/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Direction, Directionality} from '@angular/cdk/bidi';
import {BooleanInput, coerceBooleanProperty} from '@angular/cdk/coercion';
import {ESCAPE, hasModifierKey} from '@angular/cdk/keycodes';
import {TemplatePortal} from '@angular/cdk/portal';
import {
  Directive,
  ElementRef,
  EventEmitter,
  Inject,
  InjectionToken,
  Input,
  OnChanges,
  OnDestroy,
  Optional,
  Output,
  SimpleChanges,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import {Subscription} from 'rxjs';
import {takeWhile} from 'rxjs/operators';
import {Overlay} from './overlay';
import {OverlayConfig} from './overlay-config';
import {OverlayRef} from './overlay-ref';
import {ConnectedOverlayPositionChange} from './position/connected-position';
import {
  ConnectedPosition,
  FlexibleConnectedPositionStrategy,
  FlexibleConnectedPositionStrategyOrigin,
} from './position/flexible-connected-position-strategy';
import {RepositionScrollStrategy, ScrollStrategy} from './scroll/index';
/**
 * Default set of positions for the overlay. Follows the behavior of a dropdown.
 *
 * 浮层的默认位置集合。它遵循下拉列表的行为方式。
 *
 */
const defaultPositionList: ConnectedPosition[] = [
  {
    originX: 'start',
    originY: 'bottom',
    overlayX: 'start',
    overlayY: 'top',
  },
  {
    originX: 'start',
    originY: 'top',
    overlayX: 'start',
    overlayY: 'bottom',
  },
  {
    originX: 'end',
    originY: 'top',
    overlayX: 'end',
    overlayY: 'bottom',
  },
  {
    originX: 'end',
    originY: 'bottom',
    overlayX: 'end',
    overlayY: 'top',
  },
];

/**
 * Injection token that determines the scroll handling while the connected overlay is open.
 *
 * 当打开已连接的浮层时，此注入令牌会决定如何处理滚动。
 *
 */
export const CDK_CONNECTED_OVERLAY_SCROLL_STRATEGY = new InjectionToken<() => ScrollStrategy>(
  'cdk-connected-overlay-scroll-strategy',
);

/**
 * Directive applied to an element to make it usable as an origin for an Overlay using a
 * ConnectedPositionStrategy.
 *
 * 该指令应用于某个元素，以便在使用 ConnectedPositionStrategy 时可以作为 Overlay 的原点。
 *
 */
@Directive({
  selector: '[cdk-overlay-origin], [overlay-origin], [cdkOverlayOrigin]',
  exportAs: 'cdkOverlayOrigin',
})
export class CdkOverlayOrigin {
  constructor(
    /**
     * Reference to the element on which the directive is applied.
     *
     * 对此指令要应用到的元素的引用。
     */
    public elementRef: ElementRef,
  ) {}
}

/**
 * Directive to facilitate declarative creation of an
 * Overlay using a FlexibleConnectedPositionStrategy.
 *
 * 该指令旨在帮助用 FlexibleConnectedPositionStrategy 声明式的创建一个浮层。
 *
 */
@Directive({
  selector: '[cdk-connected-overlay], [connected-overlay], [cdkConnectedOverlay]',
  exportAs: 'cdkConnectedOverlay',
})
export class CdkConnectedOverlay implements OnDestroy, OnChanges {
  private _overlayRef: OverlayRef;
  private _templatePortal: TemplatePortal;
  private _hasBackdrop = false;
  private _lockPosition = false;
  private _growAfterOpen = false;
  private _flexibleDimensions = false;
  private _push = false;
  private _backdropSubscription = Subscription.EMPTY;
  private _attachSubscription = Subscription.EMPTY;
  private _detachSubscription = Subscription.EMPTY;
  private _positionSubscription = Subscription.EMPTY;
  private _offsetX: number;
  private _offsetY: number;
  private _position: FlexibleConnectedPositionStrategy;
  private _scrollStrategyFactory: () => ScrollStrategy;

  /**
   * Origin for the connected overlay.
   *
   * 已连接浮层的原点。
   *
   */
  @Input('cdkConnectedOverlayOrigin')
  origin: CdkOverlayOrigin | FlexibleConnectedPositionStrategyOrigin;

  /**
   * Registered connected position pairs.
   *
   * 已注册的连接位置对。
   *
   */
  @Input('cdkConnectedOverlayPositions') positions: ConnectedPosition[];

  /**
   * This input overrides the positions input if specified. It lets users pass
   * in arbitrary positioning strategies.
   *
   * 如果指定，该输入会改写输入属性 positions。它可以让用户传入任意的定位策略。
   *
   */
  @Input('cdkConnectedOverlayPositionStrategy') positionStrategy: FlexibleConnectedPositionStrategy;

  /**
   * The offset in pixels for the overlay connection point on the x-axis
   *
   * 浮层连接点在 x 轴上的像素偏移量
   *
   */
  @Input('cdkConnectedOverlayOffsetX')
  get offsetX(): number {
    return this._offsetX;
  }
  set offsetX(offsetX: number) {
    this._offsetX = offsetX;

    if (this._position) {
      this._updatePositionStrategy(this._position);
    }
  }

  /**
   * The offset in pixels for the overlay connection point on the y-axis
   *
   * 浮层连接点在 y 轴上的像素偏移量
   *
   */
  @Input('cdkConnectedOverlayOffsetY')
  get offsetY() {
    return this._offsetY;
  }
  set offsetY(offsetY: number) {
    this._offsetY = offsetY;

    if (this._position) {
      this._updatePositionStrategy(this._position);
    }
  }

  /**
   * The width of the overlay panel.
   *
   * 浮层面板的宽度。
   *
   */
  @Input('cdkConnectedOverlayWidth') width: number | string;

  /**
   * The height of the overlay panel.
   *
   * 浮层面板的高度。
   *
   */
  @Input('cdkConnectedOverlayHeight') height: number | string;

  /**
   * The min width of the overlay panel.
   *
   * 浮层面板的最小宽度。
   *
   */
  @Input('cdkConnectedOverlayMinWidth') minWidth: number | string;

  /**
   * The min height of the overlay panel.
   *
   * 浮层面板的最小高度。
   *
   */
  @Input('cdkConnectedOverlayMinHeight') minHeight: number | string;

  /**
   * The custom class to be set on the backdrop element.
   *
   * 在背景板元素上设置的自定义类。
   *
   */
  @Input('cdkConnectedOverlayBackdropClass') backdropClass: string | string[];

  /**
   * The custom class to add to the overlay pane element.
   *
   * 要添加到浮层面板元素中的自定义类。
   *
   */
  @Input('cdkConnectedOverlayPanelClass') panelClass: string | string[];

  /**
   * Margin between the overlay and the viewport edges.
   *
   * 浮层与视口边缘之间的边距。
   *
   */
  @Input('cdkConnectedOverlayViewportMargin') viewportMargin: number = 0;

  /**
   * Strategy to be used when handling scroll events while the overlay is open.
   *
   * 在浮层完成时，处理 scroll 事件时要使用的策略。
   *
   */
  @Input('cdkConnectedOverlayScrollStrategy') scrollStrategy: ScrollStrategy;

  /**
   * Whether the overlay is open.
   *
   * 浮层是否已打开。
   *
   */
  @Input('cdkConnectedOverlayOpen') open: boolean = false;

  /**
   * Whether the overlay can be closed by user interaction.
   *
   * 浮层是否可以通过用户交互来关闭。
   *
   */
  @Input('cdkConnectedOverlayDisableClose') disableClose: boolean = false;

  /**
   * CSS selector which to set the transform origin.
   *
   * 用于设置变换原点的 CSS 选择器。
   *
   */
  @Input('cdkConnectedOverlayTransformOriginOn') transformOriginSelector: string;

  /**
   * Whether or not the overlay should attach a backdrop.
   *
   * 浮层是否应带有背景板。
   *
   */
  @Input('cdkConnectedOverlayHasBackdrop')
  get hasBackdrop(): boolean {
    return this._hasBackdrop;
  }
  set hasBackdrop(value: BooleanInput) {
    this._hasBackdrop = coerceBooleanProperty(value);
  }

  /**
   * Whether or not the overlay should be locked when scrolling.
   *
   * 滚动时是否应该锁定浮层。
   *
   */
  @Input('cdkConnectedOverlayLockPosition')
  get lockPosition(): boolean {
    return this._lockPosition;
  }
  set lockPosition(value: BooleanInput) {
    this._lockPosition = coerceBooleanProperty(value);
  }

  /**
   * Whether the overlay's width and height can be constrained to fit within the viewport.
   *
   * 浮层的宽度和高度是否可以约束在当前视口中。
   *
   */
  @Input('cdkConnectedOverlayFlexibleDimensions')
  get flexibleDimensions(): boolean {
    return this._flexibleDimensions;
  }
  set flexibleDimensions(value: BooleanInput) {
    this._flexibleDimensions = coerceBooleanProperty(value);
  }

  /**
   * Whether the overlay can grow after the initial open when flexible positioning is turned on.
   *
   * 当弹性定位打开时，浮层是否能在首次打开后扩大。
   *
   */
  @Input('cdkConnectedOverlayGrowAfterOpen')
  get growAfterOpen(): boolean {
    return this._growAfterOpen;
  }
  set growAfterOpen(value: BooleanInput) {
    this._growAfterOpen = coerceBooleanProperty(value);
  }

  /**
   * Whether the overlay can be pushed on-screen if none of the provided positions fit.
   *
   * 如果所提供的位置都不合适，是否可以在屏幕上往下压浮层。
   *
   */
  @Input('cdkConnectedOverlayPush')
  get push(): boolean {
    return this._push;
  }
  set push(value: BooleanInput) {
    this._push = coerceBooleanProperty(value);
  }

  /**
   * Event emitted when the backdrop is clicked.
   *
   * 单击背景板时发出的事件。
   *
   */
  @Output() readonly backdropClick = new EventEmitter<MouseEvent>();

  /**
   * Event emitted when the position has changed.
   *
   * 当定位发生变化时会发出本事件。
   *
   */
  @Output() readonly positionChange = new EventEmitter<ConnectedOverlayPositionChange>();

  /**
   * Event emitted when the overlay has been attached.
   *
   * 连接浮层时会发出本事件。
   *
   */
  @Output() readonly attach = new EventEmitter<void>();

  /**
   * Event emitted when the overlay has been detached.
   *
   * 解除浮层时会发出本事件。
   *
   */
  @Output() readonly detach = new EventEmitter<void>();

  /**
   * Emits when there are keyboard events that are targeted at the overlay.
   *
   * 键盘事件的目标是本浮层会触发。
   *
   */
  @Output() readonly overlayKeydown = new EventEmitter<KeyboardEvent>();

  /**
   * Emits when there are mouse outside click events that are targeted at the overlay.
   *
   * 当本浮层的外部发生鼠标点击事件时会触发。
   *
   */
  @Output() readonly overlayOutsideClick = new EventEmitter<MouseEvent>();

  // TODO(jelbourn): inputs for size, scroll behavior, animation, etc.

  constructor(
    private _overlay: Overlay,
    templateRef: TemplateRef<any>,
    viewContainerRef: ViewContainerRef,
    @Inject(CDK_CONNECTED_OVERLAY_SCROLL_STRATEGY) scrollStrategyFactory: any,
    @Optional() private _dir: Directionality,
  ) {
    this._templatePortal = new TemplatePortal(templateRef, viewContainerRef);
    this._scrollStrategyFactory = scrollStrategyFactory;
    this.scrollStrategy = this._scrollStrategyFactory();
  }

  /**
   * The associated overlay reference.
   *
   * 到关联的浮层引用。
   *
   */
  get overlayRef(): OverlayRef {
    return this._overlayRef;
  }

  /**
   * The element's layout direction.
   *
   * 元素的布局方向。
   *
   */
  get dir(): Direction {
    return this._dir ? this._dir.value : 'ltr';
  }

  ngOnDestroy() {
    this._attachSubscription.unsubscribe();
    this._detachSubscription.unsubscribe();
    this._backdropSubscription.unsubscribe();
    this._positionSubscription.unsubscribe();

    if (this._overlayRef) {
      this._overlayRef.dispose();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this._position) {
      this._updatePositionStrategy(this._position);
      this._overlayRef.updateSize({
        width: this.width,
        minWidth: this.minWidth,
        height: this.height,
        minHeight: this.minHeight,
      });

      if (changes['origin'] && this.open) {
        this._position.apply();
      }
    }

    if (changes['open']) {
      this.open ? this._attachOverlay() : this._detachOverlay();
    }
  }

  /**
   * Creates an overlay
   *
   * 创建一个浮层
   *
   */
  private _createOverlay() {
    if (!this.positions || !this.positions.length) {
      this.positions = defaultPositionList;
    }

    const overlayRef = (this._overlayRef = this._overlay.create(this._buildConfig()));
    this._attachSubscription = overlayRef.attachments().subscribe(() => this.attach.emit());
    this._detachSubscription = overlayRef.detachments().subscribe(() => this.detach.emit());
    overlayRef.keydownEvents().subscribe((event: KeyboardEvent) => {
      this.overlayKeydown.next(event);

      if (event.keyCode === ESCAPE && !this.disableClose && !hasModifierKey(event)) {
        event.preventDefault();
        this._detachOverlay();
      }
    });

    this._overlayRef.outsidePointerEvents().subscribe((event: MouseEvent) => {
      this.overlayOutsideClick.next(event);
    });
  }

  /**
   * Builds the overlay config based on the directive's inputs
   *
   * 根据指令的输入属性构建浮层配置
   *
   */
  private _buildConfig(): OverlayConfig {
    const positionStrategy = (this._position =
      this.positionStrategy || this._createPositionStrategy());
    const overlayConfig = new OverlayConfig({
      direction: this._dir,
      positionStrategy,
      scrollStrategy: this.scrollStrategy,
      hasBackdrop: this.hasBackdrop,
    });

    if (this.width || this.width === 0) {
      overlayConfig.width = this.width;
    }

    if (this.height || this.height === 0) {
      overlayConfig.height = this.height;
    }

    if (this.minWidth || this.minWidth === 0) {
      overlayConfig.minWidth = this.minWidth;
    }

    if (this.minHeight || this.minHeight === 0) {
      overlayConfig.minHeight = this.minHeight;
    }

    if (this.backdropClass) {
      overlayConfig.backdropClass = this.backdropClass;
    }

    if (this.panelClass) {
      overlayConfig.panelClass = this.panelClass;
    }

    return overlayConfig;
  }

  /**
   * Updates the state of a position strategy, based on the values of the directive inputs.
   *
   * 根据指令输入属性的值更新定位策略的状态。
   *
   */
  private _updatePositionStrategy(positionStrategy: FlexibleConnectedPositionStrategy) {
    const positions: ConnectedPosition[] = this.positions.map(currentPosition => ({
      originX: currentPosition.originX,
      originY: currentPosition.originY,
      overlayX: currentPosition.overlayX,
      overlayY: currentPosition.overlayY,
      offsetX: currentPosition.offsetX || this.offsetX,
      offsetY: currentPosition.offsetY || this.offsetY,
      panelClass: currentPosition.panelClass || undefined,
    }));

    return positionStrategy
      .setOrigin(this._getFlexibleConnectedPositionStrategyOrigin())
      .withPositions(positions)
      .withFlexibleDimensions(this.flexibleDimensions)
      .withPush(this.push)
      .withGrowAfterOpen(this.growAfterOpen)
      .withViewportMargin(this.viewportMargin)
      .withLockedPosition(this.lockPosition)
      .withTransformOriginOn(this.transformOriginSelector);
  }

  /**
   * Returns the position strategy of the overlay to be set on the overlay config
   *
   * 返回要在浮层配置上设置的浮层定位策略
   *
   */
  private _createPositionStrategy(): FlexibleConnectedPositionStrategy {
    const strategy = this._overlay
      .position()
      .flexibleConnectedTo(this._getFlexibleConnectedPositionStrategyOrigin());
    this._updatePositionStrategy(strategy);
    return strategy;
  }

  private _getFlexibleConnectedPositionStrategyOrigin(): FlexibleConnectedPositionStrategyOrigin {
    if (this.origin instanceof CdkOverlayOrigin) {
      return this.origin.elementRef;
    } else {
      return this.origin;
    }
  }

  /**
   * Attaches the overlay and subscribes to backdrop clicks if backdrop exists
   *
   * 如果存在背景板，请把浮层附着上去并订阅背景板点击事件
   *
   */
  private _attachOverlay() {
    if (!this._overlayRef) {
      this._createOverlay();
    } else {
      // Update the overlay size, in case the directive's inputs have changed
      this._overlayRef.getConfig().hasBackdrop = this.hasBackdrop;
    }

    if (!this._overlayRef.hasAttached()) {
      this._overlayRef.attach(this._templatePortal);
    }

    if (this.hasBackdrop) {
      this._backdropSubscription = this._overlayRef.backdropClick().subscribe(event => {
        this.backdropClick.emit(event);
      });
    } else {
      this._backdropSubscription.unsubscribe();
    }

    this._positionSubscription.unsubscribe();

    // Only subscribe to `positionChanges` if requested, because putting
    // together all the information for it can be expensive.
    if (this.positionChange.observers.length > 0) {
      this._positionSubscription = this._position.positionChanges
        .pipe(takeWhile(() => this.positionChange.observers.length > 0))
        .subscribe(position => {
          this.positionChange.emit(position);

          if (this.positionChange.observers.length === 0) {
            this._positionSubscription.unsubscribe();
          }
        });
    }
  }

  /**
   * Detaches the overlay and unsubscribes to backdrop clicks if backdrop exists
   *
   * 如果背景板存在，则拆除浮层并取消订阅背景板点击事件
   *
   */
  private _detachOverlay() {
    if (this._overlayRef) {
      this._overlayRef.detach();
    }

    this._backdropSubscription.unsubscribe();
    this._positionSubscription.unsubscribe();
  }
}

/** @docs-private */
export function CDK_CONNECTED_OVERLAY_SCROLL_STRATEGY_PROVIDER_FACTORY(
  overlay: Overlay,
): () => RepositionScrollStrategy {
  return () => overlay.scrollStrategies.reposition();
}

/** @docs-private */
export const CDK_CONNECTED_OVERLAY_SCROLL_STRATEGY_PROVIDER = {
  provide: CDK_CONNECTED_OVERLAY_SCROLL_STRATEGY,
  deps: [Overlay],
  useFactory: CDK_CONNECTED_OVERLAY_SCROLL_STRATEGY_PROVIDER_FACTORY,
};
