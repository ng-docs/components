/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Platform, normalizePassiveListenerOptions, _getShadowRoot} from '@angular/cdk/platform';
import {
  Directive,
  ElementRef,
  EventEmitter,
  Inject,
  Injectable,
  InjectionToken,
  NgZone,
  OnDestroy,
  Optional,
  Output,
  AfterViewInit,
} from '@angular/core';
import {Observable, of as observableOf, Subject, Subscription} from 'rxjs';
import {coerceElement} from '@angular/cdk/coercion';
import {DOCUMENT} from '@angular/common';
import {
  isFakeMousedownFromScreenReader,
  isFakeTouchstartFromScreenReader,
} from '../fake-event-detection';

// This is the value used by AngularJS Material. Through trial and error (on iPhone 6S) they found
// that a value of around 650ms seems appropriate.
export const TOUCH_BUFFER_MS = 650;

export type FocusOrigin = 'touch' | 'mouse' | 'keyboard' | 'program' | null;

/**
 * Corresponds to the options that can be passed to the native `focus` event.
 * via <https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus>
 *
 * 对应于可以传递给原生 `focus` 事件的选项。通过 <https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus>
 *
 */
export interface FocusOptions {
  /**
   * Whether the browser should scroll to the element when it is focused.
   *
   * 浏览器在焦点变化时是否应滚动到该元素。
   *
   */
  preventScroll?: boolean;
}

/**
 * Detection mode used for attributing the origin of a focus event.
 *
 * 用于确定焦点事件起源的检测模式。
 *
 */
export const enum FocusMonitorDetectionMode {
  /**
   * Any mousedown, keydown, or touchstart event that happened in the previous
   * tick or the current tick will be used to assign a focus event's origin (to
   * either mouse, keyboard, or touch). This is the default option.
   *
   * 在上一个周期或当前周期中发生的任何 mousedown、keydown 或 touchstart 事件都将用于指定焦点事件的来源（鼠标、键盘或触摸）。这是默认选项。
   *
   */
  IMMEDIATE,
  /**
   * A focus event's origin is always attributed to the last corresponding
   * mousedown, keydown, or touchstart event, no matter how long ago it occured.
   *
   * 焦点事件的起源总是归因于上次相应的 mousedown、keydown 或 touchstart 事件，无论它发生在多久之前。
   *
   */
  EVENTUAL
}

/**
 * Injectable service-level options for FocusMonitor.
 *
 * FocusMonitor 在可注入服务级别的选项。
 *
 */
export interface FocusMonitorOptions {
  detectionMode?: FocusMonitorDetectionMode;
}

/**
 * InjectionToken for FocusMonitorOptions.
 *
 * FocusMonitorOptions 的 InjectionToken。
 *
 */
export const FOCUS_MONITOR_DEFAULT_OPTIONS =
    new InjectionToken<FocusMonitorOptions>('cdk-focus-monitor-default-options');

type MonitoredElementInfo = {
  checkChildren: boolean,
  readonly subject: Subject<FocusOrigin>,
  rootNode: HTMLElement|ShadowRoot|Document
};

/**
 * Event listener options that enable capturing and also
 * mark the listener as passive if the browser supports it.
 *
 * 事件侦听器选项可启用捕获功能，并在浏览器支持的情况下将其标记为被动。
 *
 */
const captureEventListenerOptions = normalizePassiveListenerOptions({
  passive: true,
  capture: true
});

/**
 * Monitors mouse and keyboard events to determine the cause of focus events.
 *
 * 监视鼠标和键盘事件以确定焦点事件的原因。
 *
 */
@Injectable({providedIn: 'root'})
export class FocusMonitor implements OnDestroy {
  /**
   * The focus origin that the next focus event is a result of.
   *
   * 下一个焦点事件所基于的焦点来源。
   *
   */
  private _origin: FocusOrigin = null;

  /**
   * The FocusOrigin of the last focus event tracked by the FocusMonitor.
   *
   * FocusMonitor 跟踪的最后一个焦点事件的 FocusOrigin。
   *
   */
  private _lastFocusOrigin: FocusOrigin;

  /**
   * Whether the window has just been focused.
   *
   * 窗口是否刚刚获得焦点。
   *
   */
  private _windowFocused = false;

  /**
   * The target of the last touch event.
   *
   * 上次触摸事件的目标。
   *
   */
  private _lastTouchTarget: EventTarget | null;

  /**
   * The timeout id of the touch timeout, used to cancel timeout later.
   *
   * 触摸超时的超时 ID，用于以后取消超时。
   *
   */
  private _touchTimeoutId: number;

  /**
   * The timeout id of the window focus timeout.
   *
   * 窗口焦点超时的超时 ID。
   *
   */
  private _windowFocusTimeoutId: number;

  /**
   * The timeout id of the origin clearing timeout.
   *
   * 清除源超时的超时 ID。
   *
   */
  private _originTimeoutId: number;

  /**
   * Map of elements being monitored to their info.
   *
   * 被监视元素与其信息的映射。
   *
   */
  private _elementInfo = new Map<HTMLElement, MonitoredElementInfo>();

  /**
   * The number of elements currently being monitored.
   *
   * 当前正在监视的元素数。
   *
   */
  private _monitoredElementCount = 0;

  /**
   * Keeps track of the root nodes to which we've currently bound a focus/blur handler,
   * as well as the number of monitored elements that they contain. We have to treat focus/blur
   * handlers differently from the rest of the events, because the browser won't emit events
   * to the document when focus moves inside of a shadow root.
   *
   * 跟踪我们当前已将焦点/失焦处理器绑定到的根节点，以及它们包含的受监视元素的数量。我们必须将焦点/失焦处理程序与其余事件区别对待，因为当焦点移到 Shadow DOM 根内部时，浏览器不会向文档发出事件。
   *
   */
  private _rootNodeFocusListenerCount = new Map<HTMLElement|Document|ShadowRoot, number>();

  /**
   * The specified detection mode, used for attributing the origin of a focus
   * event.
   *
   * 指定的检测模式，用于归因于焦点来源事件。
   *
   */
  private readonly _detectionMode: FocusMonitorDetectionMode;

  /**
   * Event listener for `keydown` events on the document.
   * Needs to be an arrow function in order to preserve the context when it gets bound.
   *
   * 用于文档上的 `keydown` 事件的事件侦听器。需要是一个箭头函数，以便在绑定时保留上下文。
   *
   */
  private _documentKeydownListener = () => {
    // On keydown record the origin and clear any touch event that may be in progress.
    this._lastTouchTarget = null;
    this._setOriginForCurrentEventQueue('keyboard');
  }

  /**
   * Event listener for `mousedown` events on the document.
   * Needs to be an arrow function in order to preserve the context when it gets bound.
   *
   * 用于文档上的 `mousedown` 事件的事件侦听器。需要是一个箭头函数，以便在绑定时保留上下文。
   *
   */
  private _documentMousedownListener = (event: MouseEvent) => {
    // On mousedown record the origin only if there is not touch
    // target, since a mousedown can happen as a result of a touch event.
    if (!this._lastTouchTarget) {
      // In some cases screen readers fire fake `mousedown` events instead of `keydown`.
      // Resolve the focus source to `keyboard` if we detect one of them.
      const source = isFakeMousedownFromScreenReader(event) ? 'keyboard' : 'mouse';
      this._setOriginForCurrentEventQueue(source);
    }
  }

  /**
   * Event listener for `touchstart` events on the document.
   * Needs to be an arrow function in order to preserve the context when it gets bound.
   *
   * 用于文档上的 `touchstart` 事件的事件侦听器。需要是一个箭头函数，以便在绑定时保留上下文。
   *
   */
  private _documentTouchstartListener = (event: TouchEvent) => {
    // Some screen readers will fire a fake `touchstart` event if an element is activated using
    // the keyboard while on a device with a touchsreen. Consider such events as keyboard focus.
    if (!isFakeTouchstartFromScreenReader(event)) {
      // When the touchstart event fires the focus event is not yet in the event queue. This means
      // we can't rely on the trick used above (setting timeout of 1ms). Instead we wait 650ms to
      // see if a focus happens.
      if (this._touchTimeoutId != null) {
        clearTimeout(this._touchTimeoutId);
      }

      this._lastTouchTarget = getTarget(event);
      this._touchTimeoutId = setTimeout(() => this._lastTouchTarget = null, TOUCH_BUFFER_MS);
    } else if (!this._lastTouchTarget) {
      this._setOriginForCurrentEventQueue('keyboard');
    }
  }

  /**
   * Event listener for `focus` events on the window.
   * Needs to be an arrow function in order to preserve the context when it gets bound.
   *
   * 窗口中 `focus` 事件的事件侦听器。需要是一个箭头函数，以便在绑定时保留上下文。
   *
   */
  private _windowFocusListener = () => {
    // Make a note of when the window regains focus, so we can
    // restore the origin info for the focused element.
    this._windowFocused = true;
    this._windowFocusTimeoutId = setTimeout(() => this._windowFocused = false);
  }

  /**
   * Used to reference correct document/window
   *
   * 用于引用正确的文档/窗口
   *
   */
  protected _document?: Document;

  constructor(
      private _ngZone: NgZone,
      private _platform: Platform,
      /** @breaking-change 11.0.0 make document required */
      @Optional() @Inject(DOCUMENT) document: any|null,
      @Optional() @Inject(FOCUS_MONITOR_DEFAULT_OPTIONS) options:
          FocusMonitorOptions|null) {
    this._document = document;
    this._detectionMode = options?.detectionMode || FocusMonitorDetectionMode.IMMEDIATE;
  }
  /**
   * Event listener for `focus` and 'blur' events on the document.
   * Needs to be an arrow function in order to preserve the context when it gets bound.
   *
   * 事件侦听器，用于文档上的 `focus` 和 `blur` 事件。需要是一个箭头函数，以便在绑定时保留上下文。
   *
   */
  private _rootNodeFocusAndBlurListener = (event: Event) => {
    const target = getTarget(event);
    const handler = event.type === 'focus' ? this._onFocus : this._onBlur;

    // We need to walk up the ancestor chain in order to support `checkChildren`.
    for (let element = target; element; element = element.parentElement) {
      handler.call(this, event as FocusEvent, element);
    }
  }

  /**
   * Monitors focus on an element and applies appropriate CSS classes.
   *
   * 监视元素的焦点，并应用适当的 CSS 类。
   *
   * @param element The element to monitor
   *
   * 要监视的元素
   *
   * @param checkChildren Whether to count the element as focused when its children are focused.
   *
   * 当子元素获得焦点时是否要计入这个焦点。
   *
   * @returns An observable that emits when the focus state of the element changes.
   *     When the element is blurred, null will be emitted.
   *
   * 会在元素的焦点状态更改时发出通知的可观察对象。当元素失焦时，将发出 null。
   *
   */
  monitor(element: HTMLElement, checkChildren?: boolean): Observable<FocusOrigin>;

  /**
   * Monitors focus on an element and applies appropriate CSS classes.
   *
   * 监视元素的焦点，并应用适当的 CSS 类。
   *
   * @param element The element to monitor
   *
   * 要监视的元素
   *
   * @param checkChildren Whether to count the element as focused when its children are focused.
   *
   * 当子元素获得焦点时是否要计入这个焦点。
   *
   * @returns An observable that emits when the focus state of the element changes.
   *     When the element is blurred, null will be emitted.
   *
   * 会在元素的焦点状态更改时发出通知的可观察对象。当元素失焦时，将发出 null。
   *
   */
  monitor(element: ElementRef<HTMLElement>, checkChildren?: boolean): Observable<FocusOrigin>;

  monitor(element: HTMLElement | ElementRef<HTMLElement>,
          checkChildren: boolean = false): Observable<FocusOrigin> {
    const nativeElement = coerceElement(element);

    // Do nothing if we're not on the browser platform or the passed in node isn't an element.
    if (!this._platform.isBrowser || nativeElement.nodeType !== 1) {
      return observableOf(null);
    }

    // If the element is inside the shadow DOM, we need to bind our focus/blur listeners to
    // the shadow root, rather than the `document`, because the browser won't emit focus events
    // to the `document`, if focus is moving within the same shadow root.
    const rootNode = _getShadowRoot(nativeElement) || this._getDocument();
    const cachedInfo = this._elementInfo.get(nativeElement);

    // Check if we're already monitoring this element.
    if (cachedInfo) {
      if (checkChildren) {
        // TODO(COMP-318): this can be problematic, because it'll turn all non-checkChildren
        // observers into ones that behave as if `checkChildren` was turned on. We need a more
        // robust solution.
        cachedInfo.checkChildren = true;
      }

      return cachedInfo.subject;
    }

    // Create monitored element info.
    const info: MonitoredElementInfo = {
      checkChildren: checkChildren,
      subject: new Subject<FocusOrigin>(),
      rootNode
    };
    this._elementInfo.set(nativeElement, info);
    this._registerGlobalListeners(info);

    return info.subject;
  }

  /**
   * Stops monitoring an element and removes all focus classes.
   *
   * 停止监视元素并删除所有焦点类。
   *
   * @param element The element to stop monitoring.
   *
   * 要停止监视的元素。
   *
   */
  stopMonitoring(element: HTMLElement): void;

  /**
   * Stops monitoring an element and removes all focus classes.
   *
   * 停止监视元素并删除所有焦点类。
   *
   * @param element The element to stop monitoring.
   *
   * 要停止监视的元素。
   *
   */
  stopMonitoring(element: ElementRef<HTMLElement>): void;

  stopMonitoring(element: HTMLElement | ElementRef<HTMLElement>): void {
    const nativeElement = coerceElement(element);
    const elementInfo = this._elementInfo.get(nativeElement);

    if (elementInfo) {
      elementInfo.subject.complete();

      this._setClasses(nativeElement);
      this._elementInfo.delete(nativeElement);
      this._removeGlobalListeners(elementInfo);
    }
  }

  /**
   * Focuses the element via the specified focus origin.
   *
   * 通过指定的焦点来源对元素进行聚焦。
   *
   * @param element Element to focus.
   *
   * 要获取焦点的元素。
   *
   * @param origin Focus origin.
   *
   * 焦点来源。
   *
   * @param options Options that can be used to configure the focus behavior.
   *
   * 可用于配置焦点行为的选项。
   *
   */
  focusVia(element: HTMLElement, origin: FocusOrigin, options?: FocusOptions): void;

  /**
   * Focuses the element via the specified focus origin.
   *
   * 通过指定的焦点来源对元素进行聚焦。
   *
   * @param element Element to focus.
   *
   * 要获取焦点的元素。
   *
   * @param origin Focus origin.
   *
   * 焦点来源。
   *
   * @param options Options that can be used to configure the focus behavior.
   *
   * 可用于配置焦点行为的选项。
   *
   */
  focusVia(element: ElementRef<HTMLElement>, origin: FocusOrigin, options?: FocusOptions): void;

  focusVia(element: HTMLElement | ElementRef<HTMLElement>,
          origin: FocusOrigin,
          options?: FocusOptions): void {

    const nativeElement = coerceElement(element);
    const focusedElement = this._getDocument().activeElement;

    // If the element is focused already, calling `focus` again won't trigger the event listener
    // which means that the focus classes won't be updated. If that's the case, update the classes
    // directly without waiting for an event.
    if (nativeElement === focusedElement) {
      this._getClosestElementsInfo(nativeElement)
        .forEach(([currentElement, info]) => this._originChanged(currentElement, origin, info));
    } else {
      this._setOriginForCurrentEventQueue(origin);

      // `focus` isn't available on the server
      if (typeof nativeElement.focus === 'function') {
        nativeElement.focus(options);
      }
    }
  }

  ngOnDestroy() {
    this._elementInfo.forEach((_info, element) => this.stopMonitoring(element));
  }

  /**
   * Access injected document if available or fallback to global document reference
   *
   * 访问已注入的文档（如果可用）或回退至全局文档的引用
   *
   */
  private _getDocument(): Document {
    return this._document || document;
  }

  /**
   * Use defaultView of injected document if available or fallback to global window reference
   *
   * 使用注入文件的 defaultView（如果可用）或回退至全局窗口的引用
   *
   */
  private _getWindow(): Window {
    const doc = this._getDocument();
    return doc.defaultView || window;
  }

  private _toggleClass(element: Element, className: string, shouldSet: boolean) {
    if (shouldSet) {
      element.classList.add(className);
    } else {
      element.classList.remove(className);
    }
  }

  private _getFocusOrigin(event: FocusEvent): FocusOrigin {
    // If we couldn't detect a cause for the focus event, it's due to one of three reasons:
    // 1) The window has just regained focus, in which case we want to restore the focused state of
    //    the element from before the window blurred.
    // 2) It was caused by a touch event, in which case we mark the origin as 'touch'.
    // 3) The element was programmatically focused, in which case we should mark the origin as
    //    'program'.
    if (this._origin) {
      return this._origin;
    }

    if (this._windowFocused && this._lastFocusOrigin) {
      return this._lastFocusOrigin;
    } else if (this._wasCausedByTouch(event)) {
      return 'touch';
    } else {
      return 'program';
    }
  }

  /**
   * Sets the focus classes on the element based on the given focus origin.
   *
   * 根据指定的焦点来源在元素上设置焦点类。
   *
   * @param element The element to update the classes on.
   *
   * 要更新类的元素。
   *
   * @param origin The focus origin.
   *
   * 焦点来源。
   *
   */
  private _setClasses(element: HTMLElement, origin?: FocusOrigin): void {
    this._toggleClass(element, 'cdk-focused', !!origin);
    this._toggleClass(element, 'cdk-touch-focused', origin === 'touch');
    this._toggleClass(element, 'cdk-keyboard-focused', origin === 'keyboard');
    this._toggleClass(element, 'cdk-mouse-focused', origin === 'mouse');
    this._toggleClass(element, 'cdk-program-focused', origin === 'program');
  }

  /**
   * Sets the origin and schedules an async function to clear it at the end of the event queue.
   * If the detection mode is 'eventual', the origin is never cleared.
   *
   * 设置来源并安排异步函数，以便在事件队列末尾将其清除。如果该检测模式为 'eventual'，则永远不会清除来源。
   *
   * @param origin The origin to set.
   *
   * 要设置的来源。
   *
   */
  private _setOriginForCurrentEventQueue(origin: FocusOrigin): void {
    this._ngZone.runOutsideAngular(() => {
      this._origin = origin;

      if (this._detectionMode === FocusMonitorDetectionMode.IMMEDIATE) {
        // Sometimes the focus origin won't be valid in Firefox because Firefox seems to focus *one*
        // tick after the interaction event fired. To ensure the focus origin is always correct,
        // the focus origin will be determined at the beginning of the next tick.
        this._originTimeoutId = setTimeout(() => this._origin = null, 1);
      }
    });
  }

  /**
   * Checks whether the given focus event was caused by a touchstart event.
   *
   * 检查指定的焦点事件是否由 touchstart 事件引起。
   *
   * @param event The focus event to check.
   *
   * 要检查的焦点事件。
   *
   * @returns Whether the event was caused by a touch.
   *
   * 事件是否是由触摸引起的。
   *
   */
  private _wasCausedByTouch(event: FocusEvent): boolean {
    // Note(mmalerba): This implementation is not quite perfect, there is a small edge case.
    // Consider the following dom structure:
    //
    // <div #parent tabindex="0" cdkFocusClasses>
    //   <div #child (click)="#parent.focus()"></div>
    // </div>
    //
    // If the user touches the #child element and the #parent is programmatically focused as a
    // result, this code will still consider it to have been caused by the touch event and will
    // apply the cdk-touch-focused class rather than the cdk-program-focused class. This is a
    // relatively small edge-case that can be worked around by using
    // focusVia(parentEl, 'program') to focus the parent element.
    //
    // If we decide that we absolutely must handle this case correctly, we can do so by listening
    // for the first focus event after the touchstart, and then the first blur event after that
    // focus event. When that blur event fires we know that whatever follows is not a result of the
    // touchstart.
    const focusTarget = getTarget(event);
    return this._lastTouchTarget instanceof Node && focusTarget instanceof Node &&
        (focusTarget === this._lastTouchTarget || focusTarget.contains(this._lastTouchTarget));
  }

  /**
   * Handles focus events on a registered element.
   *
   * 处理已注册元素上的焦点事件。
   *
   * @param event The focus event.
   *
   * 焦点事件。
   *
   * @param element The monitored element.
   *
   * 要监视的元素。
   *
   */
  private _onFocus(event: FocusEvent, element: HTMLElement) {
    // NOTE(mmalerba): We currently set the classes based on the focus origin of the most recent
    // focus event affecting the monitored element. If we want to use the origin of the first event
    // instead we should check for the cdk-focused class here and return if the element already has
    // it. (This only matters for elements that have includesChildren = true).

    // If we are not counting child-element-focus as focused, make sure that the event target is the
    // monitored element itself.
    const elementInfo = this._elementInfo.get(element);
    if (!elementInfo || (!elementInfo.checkChildren && element !== getTarget(event))) {
      return;
    }

    this._originChanged(element, this._getFocusOrigin(event), elementInfo);
  }

  /**
   * Handles blur events on a registered element.
   *
   * 处理已注册元素上的失焦事件。
   *
   * @param event The blur event.
   *
   * 模糊事件。
   *
   * @param element The monitored element.
   *
   * 要监视的元素。
   *
   */
  _onBlur(event: FocusEvent, element: HTMLElement) {
    // If we are counting child-element-focus as focused, make sure that we aren't just blurring in
    // order to focus another child of the monitored element.
    const elementInfo = this._elementInfo.get(element);

    if (!elementInfo || (elementInfo.checkChildren && event.relatedTarget instanceof Node &&
        element.contains(event.relatedTarget))) {
      return;
    }

    this._setClasses(element);
    this._emitOrigin(elementInfo.subject, null);
  }

  private _emitOrigin(subject: Subject<FocusOrigin>, origin: FocusOrigin) {
    this._ngZone.run(() => subject.next(origin));
  }

  private _registerGlobalListeners(elementInfo: MonitoredElementInfo) {
    if (!this._platform.isBrowser) {
      return;
    }

    const rootNode = elementInfo.rootNode;
    const rootNodeFocusListeners = this._rootNodeFocusListenerCount.get(rootNode) || 0;

    if (!rootNodeFocusListeners) {
      this._ngZone.runOutsideAngular(() => {
        rootNode.addEventListener('focus', this._rootNodeFocusAndBlurListener,
          captureEventListenerOptions);
        rootNode.addEventListener('blur', this._rootNodeFocusAndBlurListener,
          captureEventListenerOptions);
      });
    }

    this._rootNodeFocusListenerCount.set(rootNode, rootNodeFocusListeners + 1);

    // Register global listeners when first element is monitored.
    if (++this._monitoredElementCount === 1) {
      // Note: we listen to events in the capture phase so we
      // can detect them even if the user stops propagation.
      this._ngZone.runOutsideAngular(() => {
        const document = this._getDocument();
        const window = this._getWindow();

        document.addEventListener('keydown', this._documentKeydownListener,
          captureEventListenerOptions);
        document.addEventListener('mousedown', this._documentMousedownListener,
          captureEventListenerOptions);
        document.addEventListener('touchstart', this._documentTouchstartListener,
          captureEventListenerOptions);
        window.addEventListener('focus', this._windowFocusListener);
      });
    }
  }

  private _removeGlobalListeners(elementInfo: MonitoredElementInfo) {
    const rootNode = elementInfo.rootNode;

    if (this._rootNodeFocusListenerCount.has(rootNode)) {
      const rootNodeFocusListeners = this._rootNodeFocusListenerCount.get(rootNode)!;

      if (rootNodeFocusListeners > 1) {
        this._rootNodeFocusListenerCount.set(rootNode, rootNodeFocusListeners - 1);
      } else {
        rootNode.removeEventListener('focus', this._rootNodeFocusAndBlurListener,
          captureEventListenerOptions);
        rootNode.removeEventListener('blur', this._rootNodeFocusAndBlurListener,
          captureEventListenerOptions);
        this._rootNodeFocusListenerCount.delete(rootNode);
      }
    }

    // Unregister global listeners when last element is unmonitored.
    if (!--this._monitoredElementCount) {
      const document = this._getDocument();
      const window = this._getWindow();

      document.removeEventListener('keydown', this._documentKeydownListener,
        captureEventListenerOptions);
      document.removeEventListener('mousedown', this._documentMousedownListener,
        captureEventListenerOptions);
      document.removeEventListener('touchstart', this._documentTouchstartListener,
        captureEventListenerOptions);
      window.removeEventListener('focus', this._windowFocusListener);

      // Clear timeouts for all potentially pending timeouts to prevent the leaks.
      clearTimeout(this._windowFocusTimeoutId);
      clearTimeout(this._touchTimeoutId);
      clearTimeout(this._originTimeoutId);
    }
  }

  /**
   * Updates all the state on an element once its focus origin has changed.
   *
   * 焦点来源更改后，更新元素上的所有状态。
   *
   */
  private _originChanged(element: HTMLElement, origin: FocusOrigin,
                         elementInfo: MonitoredElementInfo) {
    this._setClasses(element, origin);
    this._emitOrigin(elementInfo.subject, origin);
    this._lastFocusOrigin = origin;
  }

  /**
   * Collects the `MonitoredElementInfo` of a particular element and
   * all of its ancestors that have enabled `checkChildren`.
   *
   * 收集特定元素及其所有祖先上已启用的 `checkChildren` 上的 `MonitoredElementInfo`。
   *
   * @param element Element from which to start the search.
   *
   * 要搜索的起始元素。
   *
   */
  private _getClosestElementsInfo(element: HTMLElement): [HTMLElement, MonitoredElementInfo][] {
    const results: [HTMLElement, MonitoredElementInfo][] = [];

    this._elementInfo.forEach((info, currentElement) => {
      if (currentElement === element || (info.checkChildren && currentElement.contains(element))) {
        results.push([currentElement, info]);
      }
    });

    return results;
  }
}

/**
 * Gets the target of an event, accounting for Shadow DOM.
 *
 * 获取事件的目标，包括 Shadow DOM。
 *
 */
function getTarget(event: Event): HTMLElement|null {
  // If an event is bound outside the Shadow DOM, the `event.target` will
  // point to the shadow root so we have to use `composedPath` instead.
  return (event.composedPath ? event.composedPath()[0] : event.target) as HTMLElement | null;
}

/**
 * Directive that determines how a particular element was focused (via keyboard, mouse, touch, or
 * programmatically) and adds corresponding classes to the element.
 *
 * 指令，用于确定如何让特定元素获得焦点（通过键盘，鼠标，触摸或以编程方式），并向该元素添加相应的类。
 *
 * There are two variants of this directive:
 * 1) cdkMonitorElementFocus: does not consider an element to be focused if one of its children is
 *    focused.
 * 2) cdkMonitorSubtreeFocus: considers an element focused if it or any of its children are focused.
 *
 * 此指令有两种变体：
 * 1）cdkMonitorElementFocus：如果元素的任何一个子元素有焦点，则不认为该元素拥有焦点。
 * 2）cdkMonitorSubtreeFocus：如果元素或其任何子元素都有焦点，则认为该元素拥有焦点。
 *
 */
@Directive({
  selector: '[cdkMonitorElementFocus], [cdkMonitorSubtreeFocus]',
})
export class CdkMonitorFocus implements AfterViewInit, OnDestroy {
  private _monitorSubscription: Subscription;
  @Output() readonly cdkFocusChange = new EventEmitter<FocusOrigin>();

  constructor(private _elementRef: ElementRef<HTMLElement>, private _focusMonitor: FocusMonitor) {}

  ngAfterViewInit() {
    const element = this._elementRef.nativeElement;
    this._monitorSubscription = this._focusMonitor.monitor(
      element,
      element.nodeType === 1 && element.hasAttribute('cdkMonitorSubtreeFocus'))
    .subscribe(origin => this.cdkFocusChange.emit(origin));
  }

  ngOnDestroy() {
    this._focusMonitor.stopMonitoring(this._elementRef);

    if (this._monitorSubscription) {
      this._monitorSubscription.unsubscribe();
    }
  }
}
