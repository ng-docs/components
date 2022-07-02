/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Direction, Directionality} from '@angular/cdk/bidi';
import {ComponentPortal, Portal, PortalOutlet, TemplatePortal} from '@angular/cdk/portal';
import {ComponentRef, EmbeddedViewRef, NgZone} from '@angular/core';
import {Location} from '@angular/common';
import {Observable, Subject, merge, SubscriptionLike, Subscription} from 'rxjs';
import {take, takeUntil} from 'rxjs/operators';
import {OverlayKeyboardDispatcher} from './dispatchers/overlay-keyboard-dispatcher';
import {OverlayOutsideClickDispatcher} from './dispatchers/overlay-outside-click-dispatcher';
import {OverlayConfig} from './overlay-config';
import {coerceCssPixelValue, coerceArray} from '@angular/cdk/coercion';
import {OverlayReference} from './overlay-reference';
import {PositionStrategy} from './position/position-strategy';
import {ScrollStrategy} from './scroll';

/**
 * An object where all of its properties cannot be written.
 *
 * 所有属性都不可变的对象。
 *
 */
export type ImmutableObject<T> = {
  readonly [P in keyof T]: T[P];
};

/**
 * Reference to an overlay that has been created with the Overlay service.
 * Used to manipulate or dispose of said overlay.
 *
 * 到使用浮层服务创建的浮层的引用。用来操纵或清除此浮层。
 *
 */
export class OverlayRef implements PortalOutlet, OverlayReference {
  private _backdropElement: HTMLElement | null = null;
  private _backdropTimeout: number | undefined;
  private readonly _backdropClick = new Subject<MouseEvent>();
  private readonly _attachments = new Subject<void>();
  private readonly _detachments = new Subject<void>();
  private _positionStrategy: PositionStrategy | undefined;
  private _scrollStrategy: ScrollStrategy | undefined;
  private _locationChanges: SubscriptionLike = Subscription.EMPTY;
  private _backdropClickHandler = (event: MouseEvent) => this._backdropClick.next(event);
  private _backdropTransitionendHandler = (event: TransitionEvent) => {
    this._disposeBackdrop(event.target as HTMLElement | null);
  };

  /**
   * Reference to the parent of the `_host` at the time it was detached. Used to restore
   * the `_host` to its original position in the DOM when it gets re-attached.
   *
   * 在拆除浮层时，引用其 `_host` 的父元素。当重新附加时，用于把 `_host` 恢复其在 DOM 中的原始位置。
   *
   */
  private _previousHostParent: HTMLElement;

  /**
   * Stream of keydown events dispatched to this overlay.
   *
   * 派发给此浮层的 keydown 事件流。
   *
   */
  readonly _keydownEvents = new Subject<KeyboardEvent>();

  /**
   * Stream of mouse outside events dispatched to this overlay.
   *
   * 将浮层外鼠标传给此浮层的事件流。
   *
   */
  readonly _outsidePointerEvents = new Subject<MouseEvent>();

  constructor(
    private _portalOutlet: PortalOutlet,
    private _host: HTMLElement,
    private _pane: HTMLElement,
    private _config: ImmutableObject<OverlayConfig>,
    private _ngZone: NgZone,
    private _keyboardDispatcher: OverlayKeyboardDispatcher,
    private _document: Document,
    private _location: Location,
    private _outsideClickDispatcher: OverlayOutsideClickDispatcher,
    private _animationsDisabled = false,
  ) {
    if (_config.scrollStrategy) {
      this._scrollStrategy = _config.scrollStrategy;
      this._scrollStrategy.attach(this);
    }

    this._positionStrategy = _config.positionStrategy;
  }

  /**
   * The overlay's HTML element
   *
   * 浮层的 HTML 元素
   *
   */
  get overlayElement(): HTMLElement {
    return this._pane;
  }

  /**
   * The overlay's backdrop HTML element.
   *
   * 浮层的背景板 HTML 元素。
   *
   */
  get backdropElement(): HTMLElement | null {
    return this._backdropElement;
  }

  /**
   * Wrapper around the panel element. Can be used for advanced
   * positioning where a wrapper with specific styling is
   * required around the overlay pane.
   *
   * 面板元素周围的包装器。可用于高级定位，在这里，需要在浮层面板周围使用具有特定样式的包装器。
   *
   */
  get hostElement(): HTMLElement {
    return this._host;
  }

  attach<T>(portal: ComponentPortal<T>): ComponentRef<T>;
  attach<T>(portal: TemplatePortal<T>): EmbeddedViewRef<T>;
  attach(portal: any): any;

  /**
   * Attaches content, given via a Portal, to the overlay.
   * If the overlay is configured to have a backdrop, it will be created.
   *
   * 把通过传送点给出的内容附加到浮层上。如果浮层配置为具有背景板，也会创建它。
   *
   * @param portal Portal instance to which to attach the overlay.
   *
   * 要附加的传送点实例。
   *
   * @returns The portal attachment result.
   *
   * 传送点附加的结果。
   *
   */
  attach(portal: Portal<any>): any {
    // Insert the host into the DOM before attaching the portal, otherwise
    // the animations module will skip animations on repeat attachments.
    if (!this._host.parentElement && this._previousHostParent) {
      this._previousHostParent.appendChild(this._host);
    }

    const attachResult = this._portalOutlet.attach(portal);

    if (this._positionStrategy) {
      this._positionStrategy.attach(this);
    }

    this._updateStackingOrder();
    this._updateElementSize();
    this._updateElementDirection();

    if (this._scrollStrategy) {
      this._scrollStrategy.enable();
    }

    // Update the position once the zone is stable so that the overlay will be fully rendered
    // before attempting to position it, as the position may depend on the size of the rendered
    // content.
    this._ngZone.onStable.pipe(take(1)).subscribe(() => {
      // The overlay could've been detached before the zone has stabilized.
      if (this.hasAttached()) {
        this.updatePosition();
      }
    });

    // Enable pointer events for the overlay pane element.
    this._togglePointerEvents(true);

    if (this._config.hasBackdrop) {
      this._attachBackdrop();
    }

    if (this._config.panelClass) {
      this._toggleClasses(this._pane, this._config.panelClass, true);
    }

    // Only emit the `attachments` event once all other setup is done.
    this._attachments.next();

    // Track this overlay by the keyboard dispatcher
    this._keyboardDispatcher.add(this);

    if (this._config.disposeOnNavigation) {
      this._locationChanges = this._location.subscribe(() => this.dispose());
    }

    this._outsideClickDispatcher.add(this);
    return attachResult;
  }

  /**
   * Detaches an overlay from a portal.
   *
   * 从浮层中拆除传送点。
   *
   * @returns The portal detachment result.
   *
   * 拆除传送点的结果。
   *
   */
  detach(): any {
    if (!this.hasAttached()) {
      return;
    }

    this.detachBackdrop();

    // When the overlay is detached, the pane element should disable pointer events.
    // This is necessary because otherwise the pane element will cover the page and disable
    // pointer events therefore. Depends on the position strategy and the applied pane boundaries.
    this._togglePointerEvents(false);

    if (this._positionStrategy && this._positionStrategy.detach) {
      this._positionStrategy.detach();
    }

    if (this._scrollStrategy) {
      this._scrollStrategy.disable();
    }

    const detachmentResult = this._portalOutlet.detach();

    // Only emit after everything is detached.
    this._detachments.next();

    // Remove this overlay from keyboard dispatcher tracking.
    this._keyboardDispatcher.remove(this);

    // Keeping the host element in the DOM can cause scroll jank, because it still gets
    // rendered, even though it's transparent and unclickable which is why we remove it.
    this._detachContentWhenStable();
    this._locationChanges.unsubscribe();
    this._outsideClickDispatcher.remove(this);
    return detachmentResult;
  }

  /**
   * Cleans up the overlay from the DOM.
   *
   * 清理 DOM 中的浮层。
   *
   */
  dispose(): void {
    const isAttached = this.hasAttached();

    if (this._positionStrategy) {
      this._positionStrategy.dispose();
    }

    this._disposeScrollStrategy();
    this._disposeBackdrop(this._backdropElement);
    this._locationChanges.unsubscribe();
    this._keyboardDispatcher.remove(this);
    this._portalOutlet.dispose();
    this._attachments.complete();
    this._backdropClick.complete();
    this._keydownEvents.complete();
    this._outsidePointerEvents.complete();
    this._outsideClickDispatcher.remove(this);
    this._host?.remove();

    this._previousHostParent = this._pane = this._host = null!;

    if (isAttached) {
      this._detachments.next();
    }

    this._detachments.complete();
  }

  /**
   * Whether the overlay has attached content.
   *
   * 浮层是否附加着内容。
   *
   */
  hasAttached(): boolean {
    return this._portalOutlet.hasAttached();
  }

  /**
   * Gets an observable that emits when the backdrop has been clicked.
   *
   * 获取一个当单击背景时会发出通知的可观察对象。
   *
   */
  backdropClick(): Observable<MouseEvent> {
    return this._backdropClick;
  }

  /**
   * Gets an observable that emits when the overlay has been attached.
   *
   * 获取一个在附加浮层时会发出通知的可观察对象。
   *
   */
  attachments(): Observable<void> {
    return this._attachments;
  }

  /**
   * Gets an observable that emits when the overlay has been detached.
   *
   * 获取一个当浮层已被拆除时会发出的可观察对象。
   *
   */
  detachments(): Observable<void> {
    return this._detachments;
  }

  /**
   * Gets an observable of keydown events targeted to this overlay.
   *
   * 获取一个以此浮层为目标的 keydown 事件的可观察对象。
   *
   */
  keydownEvents(): Observable<KeyboardEvent> {
    return this._keydownEvents;
  }

  /**
   * Gets an observable of pointer events targeted outside this overlay.
   *
   * 获取一个此浮层之外的指针事件的可观察对象。
   *
   */
  outsidePointerEvents(): Observable<MouseEvent> {
    return this._outsidePointerEvents;
  }

  /**
   * Gets the current overlay configuration, which is immutable.
   *
   * 获取当前的浮层配置，它是不可变对象。
   *
   */
  getConfig(): OverlayConfig {
    return this._config;
  }

  /**
   * Updates the position of the overlay based on the position strategy.
   *
   * 根据定位策略更新浮层的位置。
   *
   */
  updatePosition(): void {
    if (this._positionStrategy) {
      this._positionStrategy.apply();
    }
  }

  /**
   * Switches to a new position strategy and updates the overlay position.
   *
   * 切换到新的定位策略并更新浮层的位置。
   *
   */
  updatePositionStrategy(strategy: PositionStrategy): void {
    if (strategy === this._positionStrategy) {
      return;
    }

    if (this._positionStrategy) {
      this._positionStrategy.dispose();
    }

    this._positionStrategy = strategy;

    if (this.hasAttached()) {
      strategy.attach(this);
      this.updatePosition();
    }
  }

  /**
   * Update the size properties of the overlay.
   *
   * 更新浮层的大小属性。
   *
   */
  updateSize(sizeConfig: OverlaySizeConfig): void {
    this._config = {...this._config, ...sizeConfig};
    this._updateElementSize();
  }

  /**
   * Sets the LTR/RTL direction for the overlay.
   *
   * 设置浮层的 LTR/RTL 方向。
   *
   */
  setDirection(dir: Direction | Directionality): void {
    this._config = {...this._config, direction: dir};
    this._updateElementDirection();
  }

  /**
   * Add a CSS class or an array of classes to the overlay pane.
   *
   * 把一个或一组 CSS 类添加到浮层面板中。
   *
   */
  addPanelClass(classes: string | string[]): void {
    if (this._pane) {
      this._toggleClasses(this._pane, classes, true);
    }
  }

  /**
   * Remove a CSS class or an array of classes from the overlay pane.
   *
   * 从浮层面板中删除一个或一组 CSS 类。
   *
   */
  removePanelClass(classes: string | string[]): void {
    if (this._pane) {
      this._toggleClasses(this._pane, classes, false);
    }
  }

  /**
   * Returns the layout direction of the overlay panel.
   *
   * 返回浮层面板的布局方向。
   *
   */
  getDirection(): Direction {
    const direction = this._config.direction;

    if (!direction) {
      return 'ltr';
    }

    return typeof direction === 'string' ? direction : direction.value;
  }

  /**
   * Switches to a new scroll strategy.
   *
   * 切换到新的滚动策略。
   *
   */
  updateScrollStrategy(strategy: ScrollStrategy): void {
    if (strategy === this._scrollStrategy) {
      return;
    }

    this._disposeScrollStrategy();
    this._scrollStrategy = strategy;

    if (this.hasAttached()) {
      strategy.attach(this);
      strategy.enable();
    }
  }

  /**
   * Updates the text direction of the overlay panel.
   *
   * 更新浮层面板的文本方向。
   *
   */
  private _updateElementDirection() {
    this._host.setAttribute('dir', this.getDirection());
  }

  /**
   * Updates the size of the overlay element based on the overlay config.
   *
   * 基于浮层配置更新浮层元素的大小。
   *
   */
  private _updateElementSize() {
    if (!this._pane) {
      return;
    }

    const style = this._pane.style;

    style.width = coerceCssPixelValue(this._config.width);
    style.height = coerceCssPixelValue(this._config.height);
    style.minWidth = coerceCssPixelValue(this._config.minWidth);
    style.minHeight = coerceCssPixelValue(this._config.minHeight);
    style.maxWidth = coerceCssPixelValue(this._config.maxWidth);
    style.maxHeight = coerceCssPixelValue(this._config.maxHeight);
  }

  /**
   * Toggles the pointer events for the overlay pane element.
   *
   * 切换浮层面板元素的指针事件。
   *
   */
  private _togglePointerEvents(enablePointer: boolean) {
    this._pane.style.pointerEvents = enablePointer ? '' : 'none';
  }

  /**
   * Attaches a backdrop for this overlay.
   *
   * 为这个浮层附加一个背景板。
   *
   */
  private _attachBackdrop() {
    const showingClass = 'cdk-overlay-backdrop-showing';

    this._backdropElement = this._document.createElement('div');
    this._backdropElement.classList.add('cdk-overlay-backdrop');

    if (this._animationsDisabled) {
      this._backdropElement.classList.add('cdk-overlay-backdrop-noop-animation');
    }

    if (this._config.backdropClass) {
      this._toggleClasses(this._backdropElement, this._config.backdropClass, true);
    }

    // Insert the backdrop before the pane in the DOM order,
    // in order to handle stacked overlays properly.
    this._host.parentElement!.insertBefore(this._backdropElement, this._host);

    // Forward backdrop clicks such that the consumer of the overlay can perform whatever
    // action desired when such a click occurs (usually closing the overlay).
    this._backdropElement.addEventListener('click', this._backdropClickHandler);

    // Add class to fade-in the backdrop after one frame.
    if (!this._animationsDisabled && typeof requestAnimationFrame !== 'undefined') {
      this._ngZone.runOutsideAngular(() => {
        requestAnimationFrame(() => {
          if (this._backdropElement) {
            this._backdropElement.classList.add(showingClass);
          }
        });
      });
    } else {
      this._backdropElement.classList.add(showingClass);
    }
  }

  /**
   * Updates the stacking order of the element, moving it to the top if necessary.
   * This is required in cases where one overlay was detached, while another one,
   * that should be behind it, was destroyed. The next time both of them are opened,
   * the stacking will be wrong, because the detached element's pane will still be
   * in its original DOM position.
   *
   * 更新元素的堆叠顺序，并根据需要把它移动到顶层。某些情况下，这是必须的，比如一个浮层要从元素上拆除，而另一个浮层（在它后面）则要被销毁。下次打开时，两个浮层都是错误的，因为要从元素上拆除的面板仍然在原来的 DOM 位置。
   *
   */
  private _updateStackingOrder() {
    if (this._host.nextSibling) {
      this._host.parentNode!.appendChild(this._host);
    }
  }

  /**
   * Detaches the backdrop (if any) associated with the overlay.
   *
   * 拆除与本浮层关联的背景板（如果有的话）。
   *
   */
  detachBackdrop(): void {
    const backdropToDetach = this._backdropElement;

    if (!backdropToDetach) {
      return;
    }

    if (this._animationsDisabled) {
      this._disposeBackdrop(backdropToDetach);
      return;
    }

    backdropToDetach.classList.remove('cdk-overlay-backdrop-showing');

    this._ngZone.runOutsideAngular(() => {
      backdropToDetach!.addEventListener('transitionend', this._backdropTransitionendHandler);
    });

    // If the backdrop doesn't have a transition, the `transitionend` event won't fire.
    // In this case we make it unclickable and we try to remove it after a delay.
    backdropToDetach.style.pointerEvents = 'none';

    // Run this outside the Angular zone because there's nothing that Angular cares about.
    // If it were to run inside the Angular zone, every test that used Overlay would have to be
    // either async or fakeAsync.
    this._backdropTimeout = this._ngZone.runOutsideAngular(() =>
      setTimeout(() => {
        this._disposeBackdrop(backdropToDetach);
      }, 500),
    );
  }

  /**
   * Toggles a single CSS class or an array of classes on an element.
   *
   * 在元素上切换一个或一组 CSS 类。
   *
   */
  private _toggleClasses(element: HTMLElement, cssClasses: string | string[], isAdd: boolean) {
    const classes = coerceArray(cssClasses || []).filter(c => !!c);

    if (classes.length) {
      isAdd ? element.classList.add(...classes) : element.classList.remove(...classes);
    }
  }

  /**
   * Detaches the overlay content next time the zone stabilizes.
   *
   * 当 Zone 下次变得稳定时，就会拆除浮层的内容。
   *
   */
  private _detachContentWhenStable() {
    // Normally we wouldn't have to explicitly run this outside the `NgZone`, however
    // if the consumer is using `zone-patch-rxjs`, the `Subscription.unsubscribe` call will
    // be patched to run inside the zone, which will throw us into an infinite loop.
    this._ngZone.runOutsideAngular(() => {
      // We can't remove the host here immediately, because the overlay pane's content
      // might still be animating. This stream helps us avoid interrupting the animation
      // by waiting for the pane to become empty.
      const subscription = this._ngZone.onStable
        .pipe(takeUntil(merge(this._attachments, this._detachments)))
        .subscribe(() => {
          // Needs a couple of checks for the pane and host, because
          // they may have been removed by the time the zone stabilizes.
          if (!this._pane || !this._host || this._pane.children.length === 0) {
            if (this._pane && this._config.panelClass) {
              this._toggleClasses(this._pane, this._config.panelClass, false);
            }

            if (this._host && this._host.parentElement) {
              this._previousHostParent = this._host.parentElement;
              this._host.remove();
            }

            subscription.unsubscribe();
          }
        });
    });
  }

  /**
   * Disposes of a scroll strategy.
   *
   * 释放滚动策略。
   *
   */
  private _disposeScrollStrategy() {
    const scrollStrategy = this._scrollStrategy;

    if (scrollStrategy) {
      scrollStrategy.disable();

      if (scrollStrategy.detach) {
        scrollStrategy.detach();
      }
    }
  }

  /**
   * Removes a backdrop element from the DOM.
   *
   * 从 DOM 中移除背景元素。
   *
   */
  private _disposeBackdrop(backdrop: HTMLElement | null) {
    if (backdrop) {
      backdrop.removeEventListener('click', this._backdropClickHandler);
      backdrop.removeEventListener('transitionend', this._backdropTransitionendHandler);
      backdrop.remove();

      // It is possible that a new portal has been attached to this overlay since we started
      // removing the backdrop. If that is the case, only clear the backdrop reference if it
      // is still the same instance that we started to remove.
      if (this._backdropElement === backdrop) {
        this._backdropElement = null;
      }
    }

    if (this._backdropTimeout) {
      clearTimeout(this._backdropTimeout);
      this._backdropTimeout = undefined;
    }
  }
}
/**
 * Size properties for an overlay.
 *
 * 浮层的大小属性。
 *
 */
export interface OverlaySizeConfig {
  width?: number | string;
  height?: number | string;
  minWidth?: number | string;
  minHeight?: number | string;
  maxWidth?: number | string;
  maxHeight?: number | string;
}
