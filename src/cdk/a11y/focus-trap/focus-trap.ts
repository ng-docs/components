/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {BooleanInput, coerceBooleanProperty} from '@angular/cdk/coercion';
import {DOCUMENT} from '@angular/common';
import {
  AfterContentInit,
  Directive,
  ElementRef,
  Inject,
  Injectable,
  Input,
  NgZone,
  OnDestroy,
  DoCheck,
  SimpleChanges,
  OnChanges,
} from '@angular/core';
import {take} from 'rxjs/operators';
import {InteractivityChecker} from '../interactivity-checker/interactivity-checker';

/**
 * Class that allows for trapping focus within a DOM element.
 *
 * 允许在 DOM 元素内捕获焦点的类。
 *
 * This class currently uses a relatively simple approach to focus trapping.
 * It assumes that the tab order is the same as DOM order, which is not necessarily true.
 * Things like `tabIndex > 0`, flex `order`, and shadow roots can cause the two to be misaligned.
 *
 * 此类当前使用相对简单的方法进行焦点捕获。它假定 tab 顺序与 DOM 顺序相同，但这不一定正确。和 `tabIndex > 0` 一样，flex `order` 和 Shadow DOM 之类的都可能导致两者未对齐。
 *
 * @deprecated Use `ConfigurableFocusTrap` instead.
 *
 * 请改用 `ConfigurableFocusTrap`。
 *
 * @breaking-change 11.0.0
 */
export class FocusTrap {
  private _startAnchor: HTMLElement | null;
  private _endAnchor: HTMLElement | null;
  private _hasAttached = false;

  // Event listeners for the anchors. Need to be regular functions so that we can unbind them later.
  protected startAnchorListener = () => this.focusLastTabbableElement();
  protected endAnchorListener = () => this.focusFirstTabbableElement();

  /**
   * Whether the focus trap is active.
   *
   * 焦点陷阱是否处于活动状态。
   *
   */
  get enabled(): boolean { return this._enabled; }
  set enabled(value: boolean) {
    this._enabled = value;

    if (this._startAnchor && this._endAnchor) {
      this._toggleAnchorTabIndex(value, this._startAnchor);
      this._toggleAnchorTabIndex(value, this._endAnchor);
    }
  }
  protected _enabled: boolean = true;

  constructor(
    readonly _element: HTMLElement,
    private _checker: InteractivityChecker,
    readonly _ngZone: NgZone,
    readonly _document: Document,
    deferAnchors = false) {

    if (!deferAnchors) {
      this.attachAnchors();
    }
  }

  /**
   * Destroys the focus trap by cleaning up the anchors.
   *
   * 清理锚点以销毁焦点陷阱。
   *
   */
  destroy() {
    const startAnchor = this._startAnchor;
    const endAnchor = this._endAnchor;

    if (startAnchor) {
      startAnchor.removeEventListener('focus', this.startAnchorListener);

      if (startAnchor.parentNode) {
        startAnchor.parentNode.removeChild(startAnchor);
      }
    }

    if (endAnchor) {
      endAnchor.removeEventListener('focus', this.endAnchorListener);

      if (endAnchor.parentNode) {
        endAnchor.parentNode.removeChild(endAnchor);
      }
    }

    this._startAnchor = this._endAnchor = null;
    this._hasAttached = false;
  }

  /**
   * Inserts the anchors into the DOM. This is usually done automatically
   * in the constructor, but can be deferred for cases like directives with `*ngIf`.
   *
   * 将这些锚点插入 DOM。这通常是在构造函数中自动完成的，但是对于诸如 `*ngIf` 之类的指令，可以将其推迟。
   *
   * @returns Whether the focus trap managed to attach successfully. This may not be the case
   * if the target element isn't currently in the DOM.
   *
   * 焦点陷阱是否成功附加。如果目标元素当前不在 DOM 中，则可能不是这种情况。
   *
   */
  attachAnchors(): boolean {
    // If we're not on the browser, there can be no focus to trap.
    if (this._hasAttached) {
      return true;
    }

    this._ngZone.runOutsideAngular(() => {
      if (!this._startAnchor) {
        this._startAnchor = this._createAnchor();
        this._startAnchor!.addEventListener('focus', this.startAnchorListener);
      }

      if (!this._endAnchor) {
        this._endAnchor = this._createAnchor();
        this._endAnchor!.addEventListener('focus', this.endAnchorListener);
      }
    });

    if (this._element.parentNode) {
      this._element.parentNode.insertBefore(this._startAnchor!, this._element);
      this._element.parentNode.insertBefore(this._endAnchor!, this._element.nextSibling);
      this._hasAttached = true;
    }

    return this._hasAttached;
  }

  /**
   * Waits for the zone to stabilize, then either focuses the first element that the
   * user specified, or the first tabbable element.
   *
   * 等待 zone 稳定，然后聚焦用户指定的第一个元素或第一个可 tab 的元素。
   *
   * @returns Returns a promise that resolves with a boolean, depending
   * on whether focus was moved successfully.
   *
   * 返回一个解析为布尔值的 promise，具体取决于焦点是否成功移动。
   *
   */
  focusInitialElementWhenReady(options?: FocusOptions): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      this._executeOnStable(() => resolve(this.focusInitialElement(options)));
    });
  }

  /**
   * Waits for the zone to stabilize, then focuses
   * the first tabbable element within the focus trap region.
   *
   * 等待 zone 稳定，然后让焦点陷阱内第一个可 tab 的元素获得焦点。
   *
   * @returns Returns a promise that resolves with a boolean, depending
   * on whether focus was moved successfully.
   *
   * 返回一个解析为布尔值的 promise，具体取决于焦点是否成功移动。
   *
   */
  focusFirstTabbableElementWhenReady(options?: FocusOptions): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      this._executeOnStable(() => resolve(this.focusFirstTabbableElement(options)));
    });
  }

  /**
   * Waits for the zone to stabilize, then focuses
   * the last tabbable element within the focus trap region.
   *
   * 等待 zone 稳定，然后让焦点陷阱内最后一个可 tab 的元素获得焦点。
   *
   * @returns Returns a promise that resolves with a boolean, depending
   * on whether focus was moved successfully.
   *
   * 返回一个解析为布尔值的 promise，具体取决于焦点是否成功移动。
   *
   */
  focusLastTabbableElementWhenReady(options?: FocusOptions): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      this._executeOnStable(() => resolve(this.focusLastTabbableElement(options)));
    });
  }

  /**
   * Get the specified boundary element of the trapped region.
   *
   * 获取捕获 zone 的指定边界元素。
   *
   * @param bound The boundary to get (start or end of trapped region).
   *
   * 要获取的边界（已捕获 zone 的开始或结束）。
   *
   * @returns The boundary element.
   *
   * 边界元素。
   *
   */
  private _getRegionBoundary(bound: 'start' | 'end'): HTMLElement | null {
    // Contains the deprecated version of selector, for temporary backwards comparability.
    let markers = this._element.querySelectorAll(`[cdk-focus-region-${bound}], ` +
                                                 `[cdkFocusRegion${bound}], ` +
                                                 `[cdk-focus-${bound}]`) as NodeListOf<HTMLElement>;

    for (let i = 0; i < markers.length; i++) {
      // @breaking-change 8.0.0
      if (markers[i].hasAttribute(`cdk-focus-${bound}`)) {
        console.warn(`Found use of deprecated attribute 'cdk-focus-${bound}', ` +
                     `use 'cdkFocusRegion${bound}' instead. The deprecated ` +
                     `attribute will be removed in 8.0.0.`, markers[i]);
      } else if (markers[i].hasAttribute(`cdk-focus-region-${bound}`)) {
        console.warn(`Found use of deprecated attribute 'cdk-focus-region-${bound}', ` +
                     `use 'cdkFocusRegion${bound}' instead. The deprecated attribute ` +
                     `will be removed in 8.0.0.`, markers[i]);
      }
    }

    if (bound == 'start') {
      return markers.length ? markers[0] : this._getFirstTabbableElement(this._element);
    }
    return markers.length ?
        markers[markers.length - 1] : this._getLastTabbableElement(this._element);
  }

  /**
   * Focuses the element that should be focused when the focus trap is initialized.
   *
   * 在初始化焦点陷阱时应获得焦点的元素。
   *
   * @returns Whether focus was moved successfully.
   *
   * 焦点是否成功移动。
   *
   */
  focusInitialElement(options?: FocusOptions): boolean {
    // Contains the deprecated version of selector, for temporary backwards comparability.
    const redirectToElement = this._element.querySelector(`[cdk-focus-initial], ` +
                                                          `[cdkFocusInitial]`) as HTMLElement;

    if (redirectToElement) {
      // @breaking-change 8.0.0
      if (redirectToElement.hasAttribute(`cdk-focus-initial`)) {
        console.warn(`Found use of deprecated attribute 'cdk-focus-initial', ` +
                    `use 'cdkFocusInitial' instead. The deprecated attribute ` +
                    `will be removed in 8.0.0`, redirectToElement);
      }

      // Warn the consumer if the element they've pointed to
      // isn't focusable, when not in production mode.
      if ((typeof ngDevMode === 'undefined' || ngDevMode) &&
        !this._checker.isFocusable(redirectToElement)) {
        console.warn(`Element matching '[cdkFocusInitial]' is not focusable.`, redirectToElement);
      }

      if (!this._checker.isFocusable(redirectToElement)) {
        const focusableChild = this._getFirstTabbableElement(redirectToElement) as HTMLElement;
        focusableChild?.focus(options);
        return !!focusableChild;
      }

      redirectToElement.focus(options);
      return true;
    }

    return this.focusFirstTabbableElement(options);
  }

  /**
   * Focuses the first tabbable element within the focus trap region.
   *
   * 让焦点陷阱范围内第一个可 tab 的元素获得焦点。
   *
   * @returns Whether focus was moved successfully.
   *
   * 焦点是否成功移动。
   *
   */
  focusFirstTabbableElement(options?: FocusOptions): boolean {
    const redirectToElement = this._getRegionBoundary('start');

    if (redirectToElement) {
      redirectToElement.focus(options);
    }

    return !!redirectToElement;
  }

  /**
   * Focuses the last tabbable element within the focus trap region.
   *
   * 让焦点陷阱范围内最后一个可 tab 的元素获得焦点。
   *
   * @returns Whether focus was moved successfully.
   *
   * 焦点是否成功移动。
   *
   */
  focusLastTabbableElement(options?: FocusOptions): boolean {
    const redirectToElement = this._getRegionBoundary('end');

    if (redirectToElement) {
      redirectToElement.focus(options);
    }

    return !!redirectToElement;
  }

  /**
   * Checks whether the focus trap has successfully been attached.
   *
   * 检查焦点陷阱是否已附加成功。
   *
   */
  hasAttached(): boolean {
    return this._hasAttached;
  }

  /**
   * Get the first tabbable element from a DOM subtree (inclusive).
   *
   * 从 DOM 子树（包括）中获取第一个可 tab 元素。
   *
   */
  private _getFirstTabbableElement(root: HTMLElement): HTMLElement | null {
    if (this._checker.isFocusable(root) && this._checker.isTabbable(root)) {
      return root;
    }

    // Iterate in DOM order. Note that IE doesn't have `children` for SVG so we fall
    // back to `childNodes` which includes text nodes, comments etc.
    let children = root.children || root.childNodes;

    for (let i = 0; i < children.length; i++) {
      let tabbableChild = children[i].nodeType === this._document.ELEMENT_NODE ?
        this._getFirstTabbableElement(children[i] as HTMLElement) :
        null;

      if (tabbableChild) {
        return tabbableChild;
      }
    }

    return null;
  }

  /**
   * Get the last tabbable element from a DOM subtree (inclusive).
   *
   * 从 DOM 子树（包括）中获取最后一个可 tab 元素。
   *
   */
  private _getLastTabbableElement(root: HTMLElement): HTMLElement | null {
    if (this._checker.isFocusable(root) && this._checker.isTabbable(root)) {
      return root;
    }

    // Iterate in reverse DOM order.
    let children = root.children || root.childNodes;

    for (let i = children.length - 1; i >= 0; i--) {
      let tabbableChild = children[i].nodeType === this._document.ELEMENT_NODE ?
        this._getLastTabbableElement(children[i] as HTMLElement) :
        null;

      if (tabbableChild) {
        return tabbableChild;
      }
    }

    return null;
  }

  /**
   * Creates an anchor element.
   *
   * 创建一个锚点元素。
   *
   */
  private _createAnchor(): HTMLElement {
    const anchor = this._document.createElement('div');
    this._toggleAnchorTabIndex(this._enabled, anchor);
    anchor.classList.add('cdk-visually-hidden');
    anchor.classList.add('cdk-focus-trap-anchor');
    anchor.setAttribute('aria-hidden', 'true');
    return anchor;
  }

  /**
   * Toggles the `tabindex` of an anchor, based on the enabled state of the focus trap.
   *
   * 根据焦点陷阱的启用状态，切换 `tabindex`
   *
   * @param isEnabled Whether the focus trap is enabled.
   *
   * 是否启用焦点陷阱。
   *
   * @param anchor Anchor on which to toggle the tabindex.
   *
   * 要在其上切换 tabindex 的锚点。
   *
   */
  private _toggleAnchorTabIndex(isEnabled: boolean, anchor: HTMLElement) {
    // Remove the tabindex completely, rather than setting it to -1, because if the
    // element has a tabindex, the user might still hit it when navigating with the arrow keys.
    isEnabled ? anchor.setAttribute('tabindex', '0') : anchor.removeAttribute('tabindex');
  }

  /**
   * Toggles the`tabindex` of both anchors to either trap Tab focus or allow it to escape.
   *
   * 切换 `tabindex` 以捕获 Tab 焦点或允许脱离。
   *
   * @param enabled: Whether the anchors should trap Tab.
   */
  protected toggleAnchors(enabled: boolean) {
    if (this._startAnchor && this._endAnchor) {
      this._toggleAnchorTabIndex(enabled, this._startAnchor);
      this._toggleAnchorTabIndex(enabled, this._endAnchor);
    }
  }

  /**
   * Executes a function when the zone is stable.
   *
   * 当 zone 稳定时执行某函数。
   *
   */
  private _executeOnStable(fn: () => any): void {
    if (this._ngZone.isStable) {
      fn();
    } else {
      this._ngZone.onStable.pipe(take(1)).subscribe(fn);
    }
  }
}

/**
 * Factory that allows easy instantiation of focus traps.
 *
 * 允许轻松实例化焦点陷阱的工厂。
 *
 * @deprecated Use `ConfigurableFocusTrapFactory` instead.
 *
 * 请改用 `ConfigurableFocusTrapFactory`。
 *
 * @breaking-change 11.0.0
 */
@Injectable({providedIn: 'root'})
export class FocusTrapFactory {
  private _document: Document;

  constructor(
      private _checker: InteractivityChecker,
      private _ngZone: NgZone,
      @Inject(DOCUMENT) _document: any) {

    this._document = _document;
  }

  /**
   * Creates a focus-trapped region around the given element.
   *
   * 在指定元素周围创建一个焦点捕获 zone。
   *
   * @param element The element around which focus will be trapped.
   *
   * 将在其周围捕获焦点的元素。
   *
   * @param deferCaptureElements Defers the creation of focus-capturing elements to be done
   *     manually by the user.
   *
   * 推迟创建由用户手动完成的焦点捕获元素。
   *
   * @returns The created focus trap instance.
   *
   * 创建的焦点陷阱实例。
   *
   */
  create(element: HTMLElement, deferCaptureElements: boolean = false): FocusTrap {
    return new FocusTrap(
        element, this._checker, this._ngZone, this._document, deferCaptureElements);
  }
}

/**
 * Directive for trapping focus within a region.
 *
 * 在 zone 内捕获焦点的指令。
 *
 */
@Directive({
  selector: '[cdkTrapFocus]',
  exportAs: 'cdkTrapFocus',
})
export class CdkTrapFocus implements OnDestroy, AfterContentInit, OnChanges, DoCheck {
  private _document: Document;

  /**
   * Underlying FocusTrap instance.
   *
   * 底层 FocusTrap 实例。
   *
   */
  focusTrap: FocusTrap;

  /**
   * Previously focused element to restore focus to upon destroy when using autoCapture.
   *
   * 使用 autoCapture 时，销毁本指令会导致先前拥有焦点的元素恢复焦点。
   *
   */
  private _previouslyFocusedElement: HTMLElement | null = null;

  /**
   * Whether the focus trap is active.
   *
   * 焦点陷阱是否处于活动状态。
   *
   */
  @Input('cdkTrapFocus')
  get enabled(): boolean { return this.focusTrap.enabled; }
  set enabled(value: boolean) { this.focusTrap.enabled = coerceBooleanProperty(value); }

  /**
   * Whether the directive should automatically move focus into the trapped region upon
   * initialization and return focus to the previous activeElement upon destruction.
   *
   * 指令是否应在初始化时自动将焦点移到捕获的 zone 中，并在销毁时将焦点返回给先前的 activeElement。
   *
   */
  @Input('cdkTrapFocusAutoCapture')
  get autoCapture(): boolean { return this._autoCapture; }
  set autoCapture(value: boolean) { this._autoCapture = coerceBooleanProperty(value); }
  private _autoCapture: boolean;

  constructor(
      private _elementRef: ElementRef<HTMLElement>,
      private _focusTrapFactory: FocusTrapFactory,
      @Inject(DOCUMENT) _document: any) {

    this._document = _document;
    this.focusTrap = this._focusTrapFactory.create(this._elementRef.nativeElement, true);
  }

  ngOnDestroy() {
    this.focusTrap.destroy();

    // If we stored a previously focused element when using autoCapture, return focus to that
    // element now that the trapped region is being destroyed.
    if (this._previouslyFocusedElement) {
      this._previouslyFocusedElement.focus();
      this._previouslyFocusedElement = null;
    }
  }

  ngAfterContentInit() {
    this.focusTrap.attachAnchors();

    if (this.autoCapture) {
      this._captureFocus();
    }
  }

  ngDoCheck() {
    if (!this.focusTrap.hasAttached()) {
      this.focusTrap.attachAnchors();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    const autoCaptureChange = changes['autoCapture'];

    if (autoCaptureChange && !autoCaptureChange.firstChange && this.autoCapture &&
        this.focusTrap.hasAttached()) {
      this._captureFocus();
    }
  }

  private _captureFocus() {
    // If the `activeElement` is inside a shadow root, `document.activeElement` will
    // point to the shadow root so we have to descend into it ourselves.
    const activeElement = this._document?.activeElement as HTMLElement|null;
    this._previouslyFocusedElement =
      activeElement?.shadowRoot?.activeElement as HTMLElement || activeElement;
    this.focusTrap.focusInitialElementWhenReady();
  }

  static ngAcceptInputType_enabled: BooleanInput;
  static ngAcceptInputType_autoCapture: BooleanInput;
}
