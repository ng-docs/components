/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ComponentFactoryResolver,
  Directive,
  ElementRef,
  EventEmitter,
  forwardRef,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  Optional,
  Output,
  ViewChild,
  ViewContainerRef,
  ViewEncapsulation,
} from '@angular/core';
import {CdkPortalOutlet, TemplatePortal} from '@angular/cdk/portal';
import {Direction, Directionality} from '@angular/cdk/bidi';
import {DOCUMENT} from '@angular/common';
import {Subject, Subscription} from 'rxjs';
import {distinctUntilChanged, startWith} from 'rxjs/operators';
import {AnimationEvent} from '@angular/animations';
import {matTabsAnimations} from './tabs-animations';

/**
 * The portal host directive for the contents of the tab.
 *
 * 该选项卡内容的传送点宿主指令。
 *
 * @docs-private
 */
@Directive({
  selector: '[matTabBodyHost]',
})
export class MatTabBodyPortal extends CdkPortalOutlet implements OnInit, OnDestroy {
  /**
   * Subscription to events for when the tab body begins centering.
   *
   * 当选项卡主体开始居中时的订阅。
   *
   */
  private _centeringSub = Subscription.EMPTY;
  /**
   * Subscription to events for when the tab body finishes leaving from center position.
   *
   * 当选项卡主体从中心位置离开后的订阅。
   *
   */
  private _leavingSub = Subscription.EMPTY;

  constructor(
    componentFactoryResolver: ComponentFactoryResolver,
    viewContainerRef: ViewContainerRef,
    @Inject(forwardRef(() => MatTabBody)) private _host: MatTabBody,
    @Inject(DOCUMENT) _document: any,
  ) {
    super(componentFactoryResolver, viewContainerRef, _document);
  }

  /**
   * Set initial visibility or set up subscription for changing visibility.
   *
   * 设置初始可见性或设置订阅以改变可见性。
   *
   */
  override ngOnInit(): void {
    super.ngOnInit();

    this._centeringSub = this._host._beforeCentering
      .pipe(startWith(this._host._isCenterPosition(this._host._position)))
      .subscribe((isCentering: boolean) => {
        if (isCentering && !this.hasAttached()) {
          this.attach(this._host._content);
        }
      });

    this._leavingSub = this._host._afterLeavingCenter.subscribe(() => {
      if (!this._host.preserveContent) {
        this.detach();
      }
    });
  }

  /**
   * Clean up centering subscription.
   *
   * 清理居中订阅。
   *
   */
  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this._centeringSub.unsubscribe();
    this._leavingSub.unsubscribe();
  }
}

/**
 * These position states are used internally as animation states for the tab body. Setting the
 * position state to left, right, or center will transition the tab body from its current
 * position to its respective state. If there is not current position (void, in the case of a new
 * tab body), then there will be no transition animation to its state.
 *
 * 这些位置状态在内部用作选项卡本体的动画状态。将位置状态设置为 left、right 或 center，会把选项卡本体从当前位置转移到各自的状态。 如果没有当前位置（对于新的选项卡本体是 void），那么它的状态就没有过渡动画了）。
 *
 * In the case of a new tab body that should immediately be centered with an animating transition,
 * then left-origin-center or right-origin-center can be used, which will use left or right as its
 * pseudo-prior state.
 *
 * 如果新选项卡主体应立即以动画过渡对齐到中央，则可以使用 left-origin-center 或 right-origin-center，这将使用 left 或 right 作为其伪前置状态。
 *
 */
export type MatTabBodyPositionState =
  | 'left'
  | 'center'
  | 'right'
  | 'left-origin-center'
  | 'right-origin-center';

/**
 * Base class with all of the `MatTabBody` functionality.
 *
 * 具备所有 `MatTabBody` 功能的基类。
 *
 * @docs-private
 */
@Directive()
export abstract class _MatTabBodyBase implements OnInit, OnDestroy {
  /**
   * Current position of the tab-body in the tab-group. Zero means that the tab is visible.
   *
   * 选项卡组中选项卡本体的当前位置。为零意味着此选项卡是可见的。
   *
   */
  private _positionIndex: number;

  /**
   * Subscription to the directionality change observable.
   *
   * 对方向性变更通知的订阅。
   *
   */
  private _dirChangeSubscription = Subscription.EMPTY;

  /**
   * Tab body position state. Used by the animation trigger for the current state.
   *
   * 选项卡本体的位置状态。供当前状态的动画触发器使用。
   *
   */
  _position: MatTabBodyPositionState;

  /**
   * Emits when an animation on the tab is complete.
   *
   * 选项卡的动画完成时发出通知。
   *
   */
  readonly _translateTabComplete = new Subject<AnimationEvent>();

  /**
   * Event emitted when the tab begins to animate towards the center as the active tab.
   *
   * 此选项卡开始成为活动项，向中心动画时会发出本事件。
   *
   */
  @Output() readonly _onCentering: EventEmitter<number> = new EventEmitter<number>();

  /**
   * Event emitted before the centering of the tab begins.
   *
   * 选项卡开始居中前发出的事件。
   *
   */
  @Output() readonly _beforeCentering: EventEmitter<boolean> = new EventEmitter<boolean>();

  /**
   * Event emitted before the centering of the tab begins.
   *
   * 选项卡开始从中心离开前发出的事件。
   *
   */
  @Output() readonly _afterLeavingCenter: EventEmitter<void> = new EventEmitter<void>();

  /**
   * Event emitted when the tab completes its animation towards the center.
   *
   * 选项卡完成居中动画时会发出本事件。
   *
   */
  @Output() readonly _onCentered: EventEmitter<void> = new EventEmitter<void>(true);

  /**
   * The portal host inside of this container into which the tab body content will be loaded.
   *
   * 这个容器里面的传送点宿主，选项卡本体的内容会加载到此处。
   *
   */
  abstract _portalHost: CdkPortalOutlet;

  /**
   * The tab body content to display.
   *
   * 选项卡本体中要显示的内容。
   *
   */
  @Input('content') _content: TemplatePortal;

  /**
   * Position that will be used when the tab is immediately becoming visible after creation.
   *
   * 当选项卡在创建后立即变为可见时，将使用的位置。
   *
   */
  @Input() origin: number | null;

  // Note that the default value will always be overwritten by `MatTabBody`, but we need one
  // anyway to prevent the animations module from throwing an error if the body is used on its own.
  /**
   * Duration for the tab's animation.
   *
   * 选项卡动画的持续时间。
   *
   */
  @Input() animationDuration: string = '500ms';

  /**
   * Whether the tab's content should be kept in the DOM while it's off-screen.
   *
   * 选项卡的内容是否应在离开屏幕时保留在 DOM 中。
   *
   */
  @Input() preserveContent: boolean = false;

  /**
   * The shifted index position of the tab body, where zero represents the active center tab.
   *
   * 选项卡主体移动后的索引位置，其中零代表活动的中心选项卡。
   *
   */
  @Input()
  set position(position: number) {
    this._positionIndex = position;
    this._computePositionAnimationState();
  }

  constructor(
    private _elementRef: ElementRef<HTMLElement>,
    @Optional() private _dir: Directionality,
    changeDetectorRef: ChangeDetectorRef,
  ) {
    if (_dir) {
      this._dirChangeSubscription = _dir.change.subscribe((dir: Direction) => {
        this._computePositionAnimationState(dir);
        changeDetectorRef.markForCheck();
      });
    }

    // Ensure that we get unique animation events, because the `.done` callback can get
    // invoked twice in some browsers. See https://github.com/angular/angular/issues/24084.
    this._translateTabComplete
      .pipe(
        distinctUntilChanged((x, y) => {
          return x.fromState === y.fromState && x.toState === y.toState;
        }),
      )
      .subscribe(event => {
        // If the transition to the center is complete, emit an event.
        if (this._isCenterPosition(event.toState) && this._isCenterPosition(this._position)) {
          this._onCentered.emit();
        }

        if (this._isCenterPosition(event.fromState) && !this._isCenterPosition(this._position)) {
          this._afterLeavingCenter.emit();
        }
      });
  }

  /**
   * After initialized, check if the content is centered and has an origin. If so, set the
   * special position states that transition the tab from the left or right before centering.
   *
   * 初始化完成后，检查内容是否居中，是否有原点。如果有，就设置特殊位置状态，以便在居中之前，从左侧或右侧播放选项卡过渡动画。
   *
   */
  ngOnInit() {
    if (this._position == 'center' && this.origin != null) {
      this._position = this._computePositionFromOrigin(this.origin);
    }
  }

  ngOnDestroy() {
    this._dirChangeSubscription.unsubscribe();
    this._translateTabComplete.complete();
  }

  _onTranslateTabStarted(event: AnimationEvent): void {
    const isCentering = this._isCenterPosition(event.toState);
    this._beforeCentering.emit(isCentering);
    if (isCentering) {
      this._onCentering.emit(this._elementRef.nativeElement.clientHeight);
    }
  }

  /**
   * The text direction of the containing app.
   *
   * 容器应用的文字方向。
   *
   */
  _getLayoutDirection(): Direction {
    return this._dir && this._dir.value === 'rtl' ? 'rtl' : 'ltr';
  }

  /**
   * Whether the provided position state is considered center, regardless of origin.
   *
   * 无论原点在哪里，都把所提供的位置状态视为居中状态。
   *
   */
  _isCenterPosition(position: MatTabBodyPositionState | string): boolean {
    return (
      position == 'center' || position == 'left-origin-center' || position == 'right-origin-center'
    );
  }

  /**
   * Computes the position state that will be used for the tab-body animation trigger.
   *
   * 计算将用于选项卡动画触发器的位置状态。
   *
   */
  private _computePositionAnimationState(dir: Direction = this._getLayoutDirection()) {
    if (this._positionIndex < 0) {
      this._position = dir == 'ltr' ? 'left' : 'right';
    } else if (this._positionIndex > 0) {
      this._position = dir == 'ltr' ? 'right' : 'left';
    } else {
      this._position = 'center';
    }
  }

  /**
   * Computes the position state based on the specified origin position. This is used if the
   * tab is becoming visible immediately after creation.
   *
   * 根据指定的原点位置计算位置状态。如果选项卡在创建后立即可见，就会使用此方法。
   *
   */
  private _computePositionFromOrigin(origin: number): MatTabBodyPositionState {
    const dir = this._getLayoutDirection();

    if ((dir == 'ltr' && origin <= 0) || (dir == 'rtl' && origin > 0)) {
      return 'left-origin-center';
    }

    return 'right-origin-center';
  }
}

/**
 * Wrapper for the contents of a tab.
 *
 * 包含选项卡内容的包装器。
 *
 * @docs-private
 */
@Component({
  selector: 'mat-tab-body',
  templateUrl: 'tab-body.html',
  styleUrls: ['tab-body.css'],
  encapsulation: ViewEncapsulation.None,
  // tslint:disable-next-line:validate-decorators
  changeDetection: ChangeDetectionStrategy.Default,
  animations: [matTabsAnimations.translateTab],
  host: {
    'class': 'mat-mdc-tab-body',
  },
})
export class MatTabBody extends _MatTabBodyBase {
  @ViewChild(CdkPortalOutlet) _portalHost: CdkPortalOutlet;

  constructor(
    elementRef: ElementRef<HTMLElement>,
    @Optional() dir: Directionality,
    changeDetectorRef: ChangeDetectorRef,
  ) {
    super(elementRef, dir, changeDetectorRef);
  }
}

/**
 * The origin state is an internally used state that is set on a new tab body indicating if it
 * began to the left or right of the prior selected index. For example, if the selected index was
 * set to 1, and a new tab is created and selected at index 2, then the tab body would have an
 * origin of right because its index was greater than the prior selected index.
 *
 * 原始状态是一个内部使用的状态，它在新的选项卡本体上设置，表明它是从前一个选定索引的左侧还是右侧开始的。 例如，如果选定索引设置为 1，并且在索引 2 处创建并选定了一个新选项卡，则该选项卡本体的原点是右侧，因为它的索引大于之前选择的索引。
 *
 */
export type MatTabBodyOriginState = 'left' | 'right';
