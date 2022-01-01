/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {AnimationEvent} from '@angular/animations';
import {AriaDescriber, FocusMonitor} from '@angular/cdk/a11y';
import {Directionality} from '@angular/cdk/bidi';
import {
  BooleanInput,
  coerceBooleanProperty,
  coerceNumberProperty,
  NumberInput,
} from '@angular/cdk/coercion';
import {ESCAPE, hasModifierKey} from '@angular/cdk/keycodes';
import {BreakpointObserver, Breakpoints, BreakpointState} from '@angular/cdk/layout';
import {
  ConnectedPosition,
  FlexibleConnectedPositionStrategy,
  HorizontalConnectionPos,
  OriginConnectionPosition,
  Overlay,
  OverlayConnectionPosition,
  OverlayRef,
  ScrollStrategy,
  VerticalConnectionPos,
  ConnectionPositionPair,
} from '@angular/cdk/overlay';
import {Platform, normalizePassiveListenerOptions} from '@angular/cdk/platform';
import {ComponentPortal, ComponentType} from '@angular/cdk/portal';
import {ScrollDispatcher} from '@angular/cdk/scrolling';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Directive,
  ElementRef,
  Inject,
  InjectionToken,
  Input,
  NgZone,
  OnDestroy,
  Optional,
  ViewContainerRef,
  ViewEncapsulation,
  AfterViewInit,
} from '@angular/core';
import {DOCUMENT} from '@angular/common';
import {Observable, Subject} from 'rxjs';
import {take, takeUntil} from 'rxjs/operators';

import {matTooltipAnimations} from './tooltip-animations';

/**
 * Possible positions for a tooltip.
 *
 * 工具提示的可能位置。
 *
 */
export type TooltipPosition = 'left' | 'right' | 'above' | 'below' | 'before' | 'after';

/**
 * Options for how the tooltip trigger should handle touch gestures.
 * See `MatTooltip.touchGestures` for more information.
 *
 * 工具提示触发器如何处理触摸手势的选项。有关更多信息，请参阅 `MatTooltip.touchGestures`
 *
 */
export type TooltipTouchGestures = 'auto' | 'on' | 'off';

/**
 * Possible visibility states of a tooltip.
 *
 * 工具提示的可见性状态。
 *
 */
export type TooltipVisibility = 'initial' | 'visible' | 'hidden';

/**
 * Time in ms to throttle repositioning after scroll events.
 *
 * 滚动事件后，对重新定位进行节流的毫秒数。
 *
 */
export const SCROLL_THROTTLE_MS = 20;

/**
 * CSS class that will be attached to the overlay panel.
 *
 * 那些要附加到浮层面板上的 CSS 类。
 *
 * @deprecated
 * @breaking-change 13.0.0 remove this variable
 *
 * 删除此变量
 *
 */
export const TOOLTIP_PANEL_CLASS = 'mat-tooltip-panel';

const PANEL_CLASS = 'tooltip-panel';

/**
 * Options used to bind passive event listeners.
 *
 * 用于绑定被动事件监听器的选项。
 *
 */
const passiveListenerOptions = normalizePassiveListenerOptions({passive: true});

/**
 * Time between the user putting the pointer on a tooltip
 * trigger and the long press event being fired.
 *
 * 用户把指针放在工具提示触发器上的时间与触发长按事件之间的时间。
 *
 */
const LONGPRESS_DELAY = 500;

/**
 * Creates an error to be thrown if the user supplied an invalid tooltip position.
 *
 * 如果用户提供了无效的工具提示位置，则创建一个要抛出的错误。
 *
 * @docs-private
 */
export function getMatTooltipInvalidPositionError(position: string) {
  return Error(`Tooltip position "${position}" is invalid.`);
}

/**
 * Injection token that determines the scroll handling while a tooltip is visible.
 *
 * 当工具提示可见的时候，这个注入令牌会决定滚动的处理方式。
 *
 */
export const MAT_TOOLTIP_SCROLL_STRATEGY = new InjectionToken<() => ScrollStrategy>(
  'mat-tooltip-scroll-strategy',
);

/** @docs-private */
export function MAT_TOOLTIP_SCROLL_STRATEGY_FACTORY(overlay: Overlay): () => ScrollStrategy {
  return () => overlay.scrollStrategies.reposition({scrollThrottle: SCROLL_THROTTLE_MS});
}

/** @docs-private */
export const MAT_TOOLTIP_SCROLL_STRATEGY_FACTORY_PROVIDER = {
  provide: MAT_TOOLTIP_SCROLL_STRATEGY,
  deps: [Overlay],
  useFactory: MAT_TOOLTIP_SCROLL_STRATEGY_FACTORY,
};

/**
 * Default `matTooltip` options that can be overridden.
 *
 * 默认 `matTooltip`，可改写。
 *
 */
export interface MatTooltipDefaultOptions {
  showDelay: number;
  hideDelay: number;
  touchendHideDelay: number;
  touchGestures?: TooltipTouchGestures;
  position?: TooltipPosition;
}

/**
 * Injection token to be used to override the default options for `matTooltip`.
 *
 * 这个注入令牌用来改写 `matTooltip` 的默认选项。
 *
 */
export const MAT_TOOLTIP_DEFAULT_OPTIONS = new InjectionToken<MatTooltipDefaultOptions>(
  'mat-tooltip-default-options',
  {
    providedIn: 'root',
    factory: MAT_TOOLTIP_DEFAULT_OPTIONS_FACTORY,
  },
);

/** @docs-private */
export function MAT_TOOLTIP_DEFAULT_OPTIONS_FACTORY(): MatTooltipDefaultOptions {
  return {
    showDelay: 0,
    hideDelay: 0,
    touchendHideDelay: 1500,
  };
}

@Directive()
export abstract class _MatTooltipBase<T extends _TooltipComponentBase>
  implements OnDestroy, AfterViewInit
{
  _overlayRef: OverlayRef | null;
  _tooltipInstance: T | null;

  private _portal: ComponentPortal<T>;
  private _position: TooltipPosition = 'below';
  private _disabled: boolean = false;
  private _tooltipClass: string | string[] | Set<string> | {[key: string]: any};
  private _scrollStrategy: () => ScrollStrategy;
  private _viewInitialized = false;
  private _pointerExitEventsInitialized = false;
  protected abstract readonly _tooltipComponent: ComponentType<T>;
  protected _viewportMargin = 8;
  private _currentPosition: TooltipPosition;
  protected readonly _cssClassPrefix: string = 'mat';

  /**
   * Allows the user to define the position of the tooltip relative to the parent element
   *
   * 允许用户定义工具提示相对于父元素的位置
   *
   */
  @Input('matTooltipPosition')
  get position(): TooltipPosition {
    return this._position;
  }
  set position(value: TooltipPosition) {
    if (value !== this._position) {
      this._position = value;

      if (this._overlayRef) {
        this._updatePosition(this._overlayRef);
        this._tooltipInstance?.show(0);
        this._overlayRef.updatePosition();
      }
    }
  }

  /**
   * Disables the display of the tooltip.
   *
   * 禁止显示工具提示。
   *
   */
  @Input('matTooltipDisabled')
  get disabled(): boolean {
    return this._disabled;
  }
  set disabled(value: BooleanInput) {
    this._disabled = coerceBooleanProperty(value);

    // If tooltip is disabled, hide immediately.
    if (this._disabled) {
      this.hide(0);
    } else {
      this._setupPointerEnterEventsIfNeeded();
    }
  }

  /**
   * The default delay in ms before showing the tooltip after show is called
   *
   * 调用 show 之后到显示工具提示之前的默认延迟（毫秒）
   *
   */
  @Input('matTooltipShowDelay')
  get showDelay(): number {
    return this._showDelay;
  }
  set showDelay(value: NumberInput) {
    this._showDelay = coerceNumberProperty(value);
  }
  private _showDelay = this._defaultOptions.showDelay;

  /**
   * The default delay in ms before hiding the tooltip after hide is called
   *
   * 调用 hide 之后到隐藏工具提示之前的默认延迟（毫秒）
   *
   */
  @Input('matTooltipHideDelay')
  get hideDelay(): number {
    return this._hideDelay;
  }
  set hideDelay(value: NumberInput) {
    this._hideDelay = coerceNumberProperty(value);
  }
  private _hideDelay = this._defaultOptions.hideDelay;

  /**
   * How touch gestures should be handled by the tooltip. On touch devices the tooltip directive
   * uses a long press gesture to show and hide, however it can conflict with the native browser
   * gestures. To work around the conflict, Angular Material disables native gestures on the
   * trigger, but that might not be desirable on particular elements (e.g. inputs and draggable
   * elements). The different values for this option configure the touch event handling as follows:
   *
   * 工具提示应如何处理触摸手势。在触摸设备上，工具提示指令会使用长按手势进行显示和隐藏，但是它可能与原生的浏览器手势冲突。
   * 为了解决这个冲突，Angular Material 会在触发器上禁用原生手势，但这可能不适用于特定的元素（例如输入框和可拖动的元素）。
   * 此选项有不同的值用来配置 touch 事件的处理方式，如下所示：
   *
   * - `auto` - Enables touch gestures for all elements, but tries to avoid conflicts with native
   *   browser gestures on particular elements. In particular, it allows text selection on inputs
   *   and textareas, and preserves the native browser dragging on elements marked as `draggable`.
   *
   *   `auto` - 为所有元素启用触摸手势，但会尽量避免与特定元素的原生浏览器手势冲突。
   *   它特别允许在 input 和 textarea 上进行文本选择，并保留原生浏览器中标记为 `draggable` 的元素上的拖曳效果。
   *
   * - `on` - Enables touch gestures for all elements and disables native
   *   browser gestures with no exceptions.
   *
   *   `on` - 为所有元素启用触摸手势，并禁用原生浏览器手势，没有例外。
   *
   * - `off` - Disables touch gestures. Note that this will prevent the tooltip from
   *   showing on touch devices.
   *
   *   `off` - 禁用触摸手势。请注意，这会阻止在触摸设备上显示工具提示。
   *
   */
  @Input('matTooltipTouchGestures') touchGestures: TooltipTouchGestures = 'auto';

  /**
   * The message to be displayed in the tooltip
   *
   * 要在工具提示中显示的消息是什么
   *
   */
  @Input('matTooltip')
  get message() {
    return this._message;
  }
  set message(value: string) {
    this._ariaDescriber.removeDescription(this._elementRef.nativeElement, this._message, 'tooltip');

    // If the message is not a string (e.g. number), convert it to a string and trim it.
    // Must convert with `String(value)`, not `${value}`, otherwise Closure Compiler optimises
    // away the string-conversion: https://github.com/angular/components/issues/20684
    this._message = value != null ? String(value).trim() : '';

    if (!this._message && this._isTooltipVisible()) {
      this.hide(0);
    } else {
      this._setupPointerEnterEventsIfNeeded();
      this._updateTooltipMessage();
      this._ngZone.runOutsideAngular(() => {
        // The `AriaDescriber` has some functionality that avoids adding a description if it's the
        // same as the `aria-label` of an element, however we can't know whether the tooltip trigger
        // has a data-bound `aria-label` or when it'll be set for the first time. We can avoid the
        // issue by deferring the description by a tick so Angular has time to set the `aria-label`.
        Promise.resolve().then(() => {
          this._ariaDescriber.describe(this._elementRef.nativeElement, this.message, 'tooltip');
        });
      });
    }
  }
  private _message = '';

  /**
   * Classes to be passed to the tooltip. Supports the same syntax as `ngClass`.
   *
   * 要传递给工具提示的类。语法和 `ngClass` 相同。
   *
   */
  @Input('matTooltipClass')
  get tooltipClass() {
    return this._tooltipClass;
  }
  set tooltipClass(value: string | string[] | Set<string> | {[key: string]: any}) {
    this._tooltipClass = value;
    if (this._tooltipInstance) {
      this._setTooltipClass(this._tooltipClass);
    }
  }

  /**
   * Manually-bound passive event listeners.
   *
   * 手动绑定的被动事件监听器
   *
   */
  private readonly _passiveListeners: (readonly [string, EventListenerOrEventListenerObject])[] =
    [];

  /**
   * Reference to the current document.
   *
   * 到当前的文档的引用。
   *
   */
  private _document: Document;

  /**
   * Timer started at the last `touchstart` event.
   *
   * 从最后一次 `touchstart` 事件开始的计时器。
   *
   */
  private _touchstartTimeout: number;

  /**
   * Emits when the component is destroyed.
   *
   * 当组件被销毁时会触发。
   *
   */
  private readonly _destroyed = new Subject<void>();

  constructor(
    private _overlay: Overlay,
    private _elementRef: ElementRef<HTMLElement>,
    private _scrollDispatcher: ScrollDispatcher,
    private _viewContainerRef: ViewContainerRef,
    private _ngZone: NgZone,
    private _platform: Platform,
    private _ariaDescriber: AriaDescriber,
    private _focusMonitor: FocusMonitor,
    scrollStrategy: any,
    protected _dir: Directionality,
    private _defaultOptions: MatTooltipDefaultOptions,
    @Inject(DOCUMENT) _document: any,
  ) {
    this._scrollStrategy = scrollStrategy;
    this._document = _document;

    if (_defaultOptions) {
      if (_defaultOptions.position) {
        this.position = _defaultOptions.position;
      }

      if (_defaultOptions.touchGestures) {
        this.touchGestures = _defaultOptions.touchGestures;
      }
    }

    _dir.change.pipe(takeUntil(this._destroyed)).subscribe(() => {
      if (this._overlayRef) {
        this._updatePosition(this._overlayRef);
      }
    });

    _ngZone.runOutsideAngular(() => {
      _elementRef.nativeElement.addEventListener('keydown', this._handleKeydown);
    });
  }

  ngAfterViewInit() {
    // This needs to happen after view init so the initial values for all inputs have been set.
    this._viewInitialized = true;
    this._setupPointerEnterEventsIfNeeded();

    this._focusMonitor
      .monitor(this._elementRef)
      .pipe(takeUntil(this._destroyed))
      .subscribe(origin => {
        // Note that the focus monitor runs outside the Angular zone.
        if (!origin) {
          this._ngZone.run(() => this.hide(0));
        } else if (origin === 'keyboard') {
          this._ngZone.run(() => this.show());
        }
      });
  }

  /**
   * Dispose the tooltip when destroyed.
   *
   * 当被销毁时释放工具提示。
   *
   */
  ngOnDestroy() {
    const nativeElement = this._elementRef.nativeElement;

    clearTimeout(this._touchstartTimeout);

    if (this._overlayRef) {
      this._overlayRef.dispose();
      this._tooltipInstance = null;
    }

    // Clean up the event listeners set in the constructor
    nativeElement.removeEventListener('keydown', this._handleKeydown);
    this._passiveListeners.forEach(([event, listener]) => {
      nativeElement.removeEventListener(event, listener, passiveListenerOptions);
    });
    this._passiveListeners.length = 0;

    this._destroyed.next();
    this._destroyed.complete();

    this._ariaDescriber.removeDescription(nativeElement, this.message, 'tooltip');
    this._focusMonitor.stopMonitoring(nativeElement);
  }

  /**
   * Shows the tooltip after the delay in ms, defaults to tooltip-delay-show or 0ms if no input
   *
   * 要延迟多少毫秒后显示工具提示，默认为 tooltip-delay-show，如果没有输入则默认为 0ms
   *
   */
  show(delay: number = this.showDelay): void {
    if (
      this.disabled ||
      !this.message ||
      (this._isTooltipVisible() &&
        !this._tooltipInstance!._showTimeoutId &&
        !this._tooltipInstance!._hideTimeoutId)
    ) {
      return;
    }

    const overlayRef = this._createOverlay();
    this._detach();
    this._portal =
      this._portal || new ComponentPortal(this._tooltipComponent, this._viewContainerRef);
    this._tooltipInstance = overlayRef.attach(this._portal).instance;
    this._tooltipInstance
      .afterHidden()
      .pipe(takeUntil(this._destroyed))
      .subscribe(() => this._detach());
    this._setTooltipClass(this._tooltipClass);
    this._updateTooltipMessage();
    this._tooltipInstance!.show(delay);
  }

  /**
   * Hides the tooltip after the delay in ms, defaults to tooltip-delay-hide or 0ms if no input
   *
   * 要延迟多少毫秒后隐藏工具提示，默认为 tooltip-delay-hide，如果没有输入则默认为 0ms
   *
   */
  hide(delay: number = this.hideDelay): void {
    if (this._tooltipInstance) {
      this._tooltipInstance.hide(delay);
    }
  }

  /**
   * Shows/hides the tooltip
   *
   * 显示/隐藏工具提示
   *
   */
  toggle(): void {
    this._isTooltipVisible() ? this.hide() : this.show();
  }

  /**
   * Returns true if the tooltip is currently visible to the user
   *
   * 如果工具提示当前对用户可见，则返回 true
   *
   */
  _isTooltipVisible(): boolean {
    return !!this._tooltipInstance && this._tooltipInstance.isVisible();
  }

  /**
   * Handles the keydown events on the host element.
   * Needs to be an arrow function so that we can use it in addEventListener.
   *
   * 处理宿主元素上的 keydown 事件。需要定义成一个箭头函数才能在 addEventListener 中使用它。
   *
   */
  private _handleKeydown = (event: KeyboardEvent) => {
    if (this._isTooltipVisible() && event.keyCode === ESCAPE && !hasModifierKey(event)) {
      event.preventDefault();
      event.stopPropagation();
      this._ngZone.run(() => this.hide(0));
    }
  };

  /**
   * Create the overlay config and position strategy
   *
   * 创建浮层配置和定位策略
   *
   */
  private _createOverlay(): OverlayRef {
    if (this._overlayRef) {
      return this._overlayRef;
    }

    const scrollableAncestors = this._scrollDispatcher.getAncestorScrollContainers(
      this._elementRef,
    );

    // Create connected position strategy that listens for scroll events to reposition.
    const strategy = this._overlay
      .position()
      .flexibleConnectedTo(this._elementRef)
      .withTransformOriginOn(`.${this._cssClassPrefix}-tooltip`)
      .withFlexibleDimensions(false)
      .withViewportMargin(this._viewportMargin)
      .withScrollableContainers(scrollableAncestors);

    strategy.positionChanges.pipe(takeUntil(this._destroyed)).subscribe(change => {
      this._updateCurrentPositionClass(change.connectionPair);

      if (this._tooltipInstance) {
        if (change.scrollableViewProperties.isOverlayClipped && this._tooltipInstance.isVisible()) {
          // After position changes occur and the overlay is clipped by
          // a parent scrollable then close the tooltip.
          this._ngZone.run(() => this.hide(0));
        }
      }
    });

    this._overlayRef = this._overlay.create({
      direction: this._dir,
      positionStrategy: strategy,
      panelClass: `${this._cssClassPrefix}-${PANEL_CLASS}`,
      scrollStrategy: this._scrollStrategy(),
    });

    this._updatePosition(this._overlayRef);

    this._overlayRef
      .detachments()
      .pipe(takeUntil(this._destroyed))
      .subscribe(() => this._detach());

    this._overlayRef
      .outsidePointerEvents()
      .pipe(takeUntil(this._destroyed))
      .subscribe(() => this._tooltipInstance?._handleBodyInteraction());

    return this._overlayRef;
  }

  /**
   * Detaches the currently-attached tooltip.
   *
   * 拆除当前附加的工具提示。
   *
   */
  private _detach() {
    if (this._overlayRef && this._overlayRef.hasAttached()) {
      this._overlayRef.detach();
    }

    this._tooltipInstance = null;
  }

  /**
   * Updates the position of the current tooltip.
   *
   * 更新当前工具提示的位置。
   *
   */
  private _updatePosition(overlayRef: OverlayRef) {
    const position = overlayRef.getConfig().positionStrategy as FlexibleConnectedPositionStrategy;
    const origin = this._getOrigin();
    const overlay = this._getOverlayPosition();

    position.withPositions([
      this._addOffset({...origin.main, ...overlay.main}),
      this._addOffset({...origin.fallback, ...overlay.fallback}),
    ]);
  }

  /**
   * Adds the configured offset to a position. Used as a hook for child classes.
   *
   * 将所配置的偏移量添加到位置。用作子类的钩子。
   *
   */
  protected _addOffset(position: ConnectedPosition): ConnectedPosition {
    return position;
  }

  /**
   * Returns the origin position and a fallback position based on the user's position preference.
   * The fallback position is the inverse of the origin (e.g. `'below' -> 'above'`).
   *
   * 根据用户的位置偏好，返回原点位置和后备位置。后备位置与原点相反（例如 `'below' -> 'above'` ）。
   *
   */
  _getOrigin(): {main: OriginConnectionPosition; fallback: OriginConnectionPosition} {
    const isLtr = !this._dir || this._dir.value == 'ltr';
    const position = this.position;
    let originPosition: OriginConnectionPosition;

    if (position == 'above' || position == 'below') {
      originPosition = {originX: 'center', originY: position == 'above' ? 'top' : 'bottom'};
    } else if (
      position == 'before' ||
      (position == 'left' && isLtr) ||
      (position == 'right' && !isLtr)
    ) {
      originPosition = {originX: 'start', originY: 'center'};
    } else if (
      position == 'after' ||
      (position == 'right' && isLtr) ||
      (position == 'left' && !isLtr)
    ) {
      originPosition = {originX: 'end', originY: 'center'};
    } else if (typeof ngDevMode === 'undefined' || ngDevMode) {
      throw getMatTooltipInvalidPositionError(position);
    }

    const {x, y} = this._invertPosition(originPosition!.originX, originPosition!.originY);

    return {
      main: originPosition!,
      fallback: {originX: x, originY: y},
    };
  }

  /**
   * Returns the overlay position and a fallback position based on the user's preference
   *
   * 根据用户的偏好，返回浮层位置和后备位置
   *
   */
  _getOverlayPosition(): {main: OverlayConnectionPosition; fallback: OverlayConnectionPosition} {
    const isLtr = !this._dir || this._dir.value == 'ltr';
    const position = this.position;
    let overlayPosition: OverlayConnectionPosition;

    if (position == 'above') {
      overlayPosition = {overlayX: 'center', overlayY: 'bottom'};
    } else if (position == 'below') {
      overlayPosition = {overlayX: 'center', overlayY: 'top'};
    } else if (
      position == 'before' ||
      (position == 'left' && isLtr) ||
      (position == 'right' && !isLtr)
    ) {
      overlayPosition = {overlayX: 'end', overlayY: 'center'};
    } else if (
      position == 'after' ||
      (position == 'right' && isLtr) ||
      (position == 'left' && !isLtr)
    ) {
      overlayPosition = {overlayX: 'start', overlayY: 'center'};
    } else if (typeof ngDevMode === 'undefined' || ngDevMode) {
      throw getMatTooltipInvalidPositionError(position);
    }

    const {x, y} = this._invertPosition(overlayPosition!.overlayX, overlayPosition!.overlayY);

    return {
      main: overlayPosition!,
      fallback: {overlayX: x, overlayY: y},
    };
  }

  /**
   * Updates the tooltip message and repositions the overlay according to the new message length
   *
   * 更新工具提示信息并根据新的信息长度重新定位浮层
   *
   */
  private _updateTooltipMessage() {
    // Must wait for the message to be painted to the tooltip so that the overlay can properly
    // calculate the correct positioning based on the size of the text.
    if (this._tooltipInstance) {
      this._tooltipInstance.message = this.message;
      this._tooltipInstance._markForCheck();

      this._ngZone.onMicrotaskEmpty.pipe(take(1), takeUntil(this._destroyed)).subscribe(() => {
        if (this._tooltipInstance) {
          this._overlayRef!.updatePosition();
        }
      });
    }
  }

  /**
   * Updates the tooltip class
   *
   * 更新工具提示类
   *
   */
  private _setTooltipClass(tooltipClass: string | string[] | Set<string> | {[key: string]: any}) {
    if (this._tooltipInstance) {
      this._tooltipInstance.tooltipClass = tooltipClass;
      this._tooltipInstance._markForCheck();
    }
  }

  /**
   * Inverts an overlay position.
   *
   * 反转浮层位置。
   *
   */
  private _invertPosition(x: HorizontalConnectionPos, y: VerticalConnectionPos) {
    if (this.position === 'above' || this.position === 'below') {
      if (y === 'top') {
        y = 'bottom';
      } else if (y === 'bottom') {
        y = 'top';
      }
    } else {
      if (x === 'end') {
        x = 'start';
      } else if (x === 'start') {
        x = 'end';
      }
    }

    return {x, y};
  }

  /**
   * Updates the class on the overlay panel based on the current position of the tooltip.
   *
   * 根据工具提示的当前位置更新浮层面板上的类。
   *
   */
  private _updateCurrentPositionClass(connectionPair: ConnectionPositionPair): void {
    const {overlayY, originX, originY} = connectionPair;
    let newPosition: TooltipPosition;

    // If the overlay is in the middle along the Y axis,
    // it means that it's either before or after.
    if (overlayY === 'center') {
      // Note that since this information is used for styling, we want to
      // resolve `start` and `end` to their real values, otherwise consumers
      // would have to remember to do it themselves on each consumption.
      if (this._dir && this._dir.value === 'rtl') {
        newPosition = originX === 'end' ? 'left' : 'right';
      } else {
        newPosition = originX === 'start' ? 'left' : 'right';
      }
    } else {
      newPosition = overlayY === 'bottom' && originY === 'top' ? 'above' : 'below';
    }

    if (newPosition !== this._currentPosition) {
      const overlayRef = this._overlayRef;

      if (overlayRef) {
        const classPrefix = `${this._cssClassPrefix}-${PANEL_CLASS}-`;
        overlayRef.removePanelClass(classPrefix + this._currentPosition);
        overlayRef.addPanelClass(classPrefix + newPosition);
      }

      this._currentPosition = newPosition;
    }
  }

  /**
   * Binds the pointer events to the tooltip trigger.
   *
   * 把指针事件绑定到工具提示的触发器上。
   *
   */
  private _setupPointerEnterEventsIfNeeded() {
    // Optimization: Defer hooking up events if there's no message or the tooltip is disabled.
    if (
      this._disabled ||
      !this.message ||
      !this._viewInitialized ||
      this._passiveListeners.length
    ) {
      return;
    }

    // The mouse events shouldn't be bound on mobile devices, because they can prevent the
    // first tap from firing its click event or can cause the tooltip to open for clicks.
    if (this._platformSupportsMouseEvents()) {
      this._passiveListeners.push([
        'mouseenter',
        () => {
          this._setupPointerExitEventsIfNeeded();
          this.show();
        },
      ]);
    } else if (this.touchGestures !== 'off') {
      this._disableNativeGesturesIfNecessary();

      this._passiveListeners.push([
        'touchstart',
        () => {
          // Note that it's important that we don't `preventDefault` here,
          // because it can prevent click events from firing on the element.
          this._setupPointerExitEventsIfNeeded();
          clearTimeout(this._touchstartTimeout);
          this._touchstartTimeout = setTimeout(() => this.show(), LONGPRESS_DELAY);
        },
      ]);
    }

    this._addListeners(this._passiveListeners);
  }

  private _setupPointerExitEventsIfNeeded() {
    if (this._pointerExitEventsInitialized) {
      return;
    }
    this._pointerExitEventsInitialized = true;

    const exitListeners: (readonly [string, EventListenerOrEventListenerObject])[] = [];
    if (this._platformSupportsMouseEvents()) {
      exitListeners.push(
        ['mouseleave', () => this.hide()],
        ['wheel', event => this._wheelListener(event as WheelEvent)],
      );
    } else if (this.touchGestures !== 'off') {
      this._disableNativeGesturesIfNecessary();
      const touchendListener = () => {
        clearTimeout(this._touchstartTimeout);
        this.hide(this._defaultOptions.touchendHideDelay);
      };

      exitListeners.push(['touchend', touchendListener], ['touchcancel', touchendListener]);
    }

    this._addListeners(exitListeners);
    this._passiveListeners.push(...exitListeners);
  }

  private _addListeners(listeners: (readonly [string, EventListenerOrEventListenerObject])[]) {
    listeners.forEach(([event, listener]) => {
      this._elementRef.nativeElement.addEventListener(event, listener, passiveListenerOptions);
    });
  }

  private _platformSupportsMouseEvents() {
    return !this._platform.IOS && !this._platform.ANDROID;
  }

  /**
   * Listener for the `wheel` event on the element.
   *
   * 监听元素上滚轮（`wheel`）事件的监听器。
   *
   */
  private _wheelListener(event: WheelEvent) {
    if (this._isTooltipVisible()) {
      const elementUnderPointer = this._document.elementFromPoint(event.clientX, event.clientY);
      const element = this._elementRef.nativeElement;

      // On non-touch devices we depend on the `mouseleave` event to close the tooltip, but it
      // won't fire if the user scrolls away using the wheel without moving their cursor. We
      // work around it by finding the element under the user's cursor and closing the tooltip
      // if it's not the trigger.
      if (elementUnderPointer !== element && !element.contains(elementUnderPointer)) {
        this.hide();
      }
    }
  }

  /**
   * Disables the native browser gestures, based on how the tooltip has been configured.
   *
   * 根据工具提示的配置方式，禁用原生浏览器的手势。
   *
   */
  private _disableNativeGesturesIfNecessary() {
    const gestures = this.touchGestures;

    if (gestures !== 'off') {
      const element = this._elementRef.nativeElement;
      const style = element.style;

      // If gestures are set to `auto`, we don't disable text selection on inputs and
      // textareas, because it prevents the user from typing into them on iOS Safari.
      if (gestures === 'on' || (element.nodeName !== 'INPUT' && element.nodeName !== 'TEXTAREA')) {
        style.userSelect =
          (style as any).msUserSelect =
          style.webkitUserSelect =
          (style as any).MozUserSelect =
            'none';
      }

      // If we have `auto` gestures and the element uses native HTML dragging,
      // we don't set `-webkit-user-drag` because it prevents the native behavior.
      if (gestures === 'on' || !element.draggable) {
        (style as any).webkitUserDrag = 'none';
      }

      style.touchAction = 'none';
      (style as any).webkitTapHighlightColor = 'transparent';
    }
  }
}

/**
 * Directive that attaches a material design tooltip to the host element. Animates the showing and
 * hiding of a tooltip provided position (defaults to below the element).
 *
 * 将 Material Design 工具提示附加到主体元素的指令。对工具提示提供的位置的显示和隐藏进行动画处理（默认为元素下方）。
 *
 * https://material.io/design/components/tooltips.html
 */
@Directive({
  selector: '[matTooltip]',
  exportAs: 'matTooltip',
  host: {
    'class': 'mat-tooltip-trigger',
  },
})
export class MatTooltip extends _MatTooltipBase<TooltipComponent> {
  protected readonly _tooltipComponent = TooltipComponent;

  constructor(
    overlay: Overlay,
    elementRef: ElementRef<HTMLElement>,
    scrollDispatcher: ScrollDispatcher,
    viewContainerRef: ViewContainerRef,
    ngZone: NgZone,
    platform: Platform,
    ariaDescriber: AriaDescriber,
    focusMonitor: FocusMonitor,
    @Inject(MAT_TOOLTIP_SCROLL_STRATEGY) scrollStrategy: any,
    @Optional() dir: Directionality,
    @Optional() @Inject(MAT_TOOLTIP_DEFAULT_OPTIONS) defaultOptions: MatTooltipDefaultOptions,
    @Inject(DOCUMENT) _document: any,
  ) {
    super(
      overlay,
      elementRef,
      scrollDispatcher,
      viewContainerRef,
      ngZone,
      platform,
      ariaDescriber,
      focusMonitor,
      scrollStrategy,
      dir,
      defaultOptions,
      _document,
    );
  }
}

@Directive()
export abstract class _TooltipComponentBase implements OnDestroy {
  /**
   * Message to display in the tooltip
   *
   * 要在工具提示中显示的消息
   *
   */
  message: string;

  /**
   * Classes to be added to the tooltip. Supports the same syntax as `ngClass`.
   *
   * 要添加到工具提示中的类。语法和 `ngClass` 相同。
   *
   */
  tooltipClass: string | string[] | Set<string> | {[key: string]: any};

  /**
   * The timeout ID of any current timer set to show the tooltip
   *
   * 用来显示工具提示的当前定时器的超时 ID
   *
   */
  _showTimeoutId: number | undefined;

  /**
   * The timeout ID of any current timer set to hide the tooltip
   *
   * 用来隐藏工具提示的当前定时器的超时 ID
   *
   */
  _hideTimeoutId: number | undefined;

  /**
   * Property watched by the animation framework to show or hide the tooltip
   *
   * 动画框架要监视的属性，以便显示或隐藏工具提示
   *
   */
  _visibility: TooltipVisibility = 'initial';

  /**
   * Whether interactions on the page should close the tooltip
   *
   * 页面上的交互是否应该关闭工具提示
   *
   */
  private _closeOnInteraction: boolean = false;

  /**
   * Subject for notifying that the tooltip has been hidden from the view
   *
   * 用于通知工具提示已从视图中隐藏的主体对象
   *
   */
  private readonly _onHide: Subject<void> = new Subject();

  constructor(private _changeDetectorRef: ChangeDetectorRef) {}

  /**
   * Shows the tooltip with an animation originating from the provided origin
   *
   * 从所提供的原点开始，动画显示出工具提示
   *
   * @param delay Amount of milliseconds to the delay showing the tooltip.
   *
   * 显示工具提示的延迟时间，以毫秒为单位。
   *
   */
  show(delay: number): void {
    // Cancel the delayed hide if it is scheduled
    clearTimeout(this._hideTimeoutId);

    // Body interactions should cancel the tooltip if there is a delay in showing.
    this._closeOnInteraction = true;
    this._showTimeoutId = setTimeout(() => {
      this._visibility = 'visible';
      this._showTimeoutId = undefined;
      this._onShow();

      // Mark for check so if any parent component has set the
      // ChangeDetectionStrategy to OnPush it will be checked anyways
      this._markForCheck();
    }, delay);
  }

  /**
   * Begins the animation to hide the tooltip after the provided delay in ms.
   *
   * 开始动画，以便在所提供的毫秒数之后隐藏工具提示。
   *
   * @param delay Amount of milliseconds to delay showing the tooltip.
   *
   * 延迟显示工具提示的毫秒数。
   *
   */
  hide(delay: number): void {
    // Cancel the delayed show if it is scheduled
    clearTimeout(this._showTimeoutId);

    this._hideTimeoutId = setTimeout(() => {
      this._visibility = 'hidden';
      this._hideTimeoutId = undefined;

      // Mark for check so if any parent component has set the
      // ChangeDetectionStrategy to OnPush it will be checked anyways
      this._markForCheck();
    }, delay);
  }

  /**
   * Returns an observable that notifies when the tooltip has been hidden from view.
   *
   * 返回一个可观察对象，它会在工具提示从视图中被隐藏时发出通知。
   *
   */
  afterHidden(): Observable<void> {
    return this._onHide;
  }

  /**
   * Whether the tooltip is being displayed.
   *
   * 是否正在显示工具提示。
   *
   */
  isVisible(): boolean {
    return this._visibility === 'visible';
  }

  ngOnDestroy() {
    clearTimeout(this._showTimeoutId);
    clearTimeout(this._hideTimeoutId);
    this._onHide.complete();
  }

  _animationStart() {
    this._closeOnInteraction = false;
  }

  _animationDone(event: AnimationEvent): void {
    const toState = event.toState as TooltipVisibility;

    if (toState === 'hidden' && !this.isVisible()) {
      this._onHide.next();
    }

    if (toState === 'visible' || toState === 'hidden') {
      this._closeOnInteraction = true;
    }
  }

  /**
   * Interactions on the HTML body should close the tooltip immediately as defined in the
   * material design spec.
   * <https://material.io/design/components/tooltips.html#behavior>
   *
   * HTML 正文中的交互应该立即关闭工具提示，就像在 Material Design 规范中定义的那样。<https://material.io/design/components/tooltips.html#behavior>
   */
  _handleBodyInteraction(): void {
    if (this._closeOnInteraction) {
      this.hide(0);
    }
  }

  /**
   * Marks that the tooltip needs to be checked in the next change detection run.
   * Mainly used for rendering the initial text before positioning a tooltip, which
   * can be problematic in components with OnPush change detection.
   *
   * 标记下次变更检测运行时是否需要检查工具提示。主要用于在定位工具提示之前渲染初始文本，否则对于使用 OnPush 变更检测的组件来说可能有问题。
   *
   */
  _markForCheck(): void {
    this._changeDetectorRef.markForCheck();
  }

  /**
   * Callback for when the timeout in this.show() gets completed.
   * This method is only needed by the mdc-tooltip, and so it is only implemented
   * in the mdc-tooltip, not here.
   *
   * this.show() 中的超时完成时的回调。这个方法只有 mdc-tooltip 需要，所以只在 mdc-tooltip 里面实现，这里没有。
   *
   */
  protected _onShow(): void {}
}

/**
 * Internal component that wraps the tooltip's content.
 *
 * 包装工具提示内容的内部组件。
 *
 * @docs-private
 */
@Component({
  selector: 'mat-tooltip-component',
  templateUrl: 'tooltip.html',
  styleUrls: ['tooltip.css'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [matTooltipAnimations.tooltipState],
  host: {
    // Forces the element to have a layout in IE and Edge. This fixes issues where the element
    // won't be rendered if the animations are disabled or there is no web animations polyfill.
    '[style.zoom]': '_visibility === "visible" ? 1 : null',
    'aria-hidden': 'true',
  },
})
export class TooltipComponent extends _TooltipComponentBase {
  /**
   * Stream that emits whether the user has a handset-sized display.
   *
   * 发出用户是否具有手机大小的显示器的流。
   *
   */
  _isHandset: Observable<BreakpointState> = this._breakpointObserver.observe(Breakpoints.Handset);

  constructor(
    changeDetectorRef: ChangeDetectorRef,
    private _breakpointObserver: BreakpointObserver,
  ) {
    super(changeDetectorRef);
  }
}
