/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {coerceNumberProperty, NumberInput} from '@angular/cdk/coercion';
import {DOCUMENT} from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  inject,
  InjectionToken,
  Input,
  NgZone,
  OnDestroy,
  Optional,
  Output,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import {CanColor, CanColorCtor, mixinColor} from '@angular/material/core';
import {ANIMATION_MODULE_TYPE} from '@angular/platform-browser/animations';
import {fromEvent, Observable, Subscription} from 'rxjs';
import {filter} from 'rxjs/operators';

// TODO(josephperrott): Benchpress tests.
// TODO(josephperrott): Add ARIA attributes for progress bar "for".

/**
 * Last animation end data.
 *
 * 最后一个动画结束数据
 *
 */
export interface ProgressAnimationEnd {
  value: number;
}

// Boilerplate for applying mixins to MatProgressBar.
/** @docs-private */
class MatProgressBarBase {
  constructor(public _elementRef: ElementRef) { }
}

const _MatProgressBarMixinBase: CanColorCtor & typeof MatProgressBarBase =
    mixinColor(MatProgressBarBase, 'primary');

/**
 * Injection token used to provide the current location to `MatProgressBar`.
 * Used to handle server-side rendering and to stub out during unit tests.
 *
 * 注入令牌，用于为 `MatProgressBar` 提供当前位置信息。用于处理服务端渲染，以及供单元测试中使用的桩服务。
 *
 * @docs-private
 */
export const MAT_PROGRESS_BAR_LOCATION = new InjectionToken<MatProgressBarLocation>(
  'mat-progress-bar-location',
  {providedIn: 'root', factory: MAT_PROGRESS_BAR_LOCATION_FACTORY}
);

/**
 * Stubbed out location for `MatProgressBar`.
 *
 * `MatProgressBar` 打桩过的 location。
 *
 * @docs-private
 */
export interface MatProgressBarLocation {
  getPathname: () => string;
}

/** @docs-private */
export function MAT_PROGRESS_BAR_LOCATION_FACTORY(): MatProgressBarLocation {
  const _document = inject(DOCUMENT);
  const _location = _document ? _document.location : null;

  return {
    // Note that this needs to be a function, rather than a property, because Angular
    // will only resolve it once, but we want the current path on each call.
    getPathname: () => _location ? (_location.pathname + _location.search) : ''
  };
}

export type ProgressBarMode = 'determinate' | 'indeterminate' | 'buffer' | 'query';

/**
 * Counter used to generate unique IDs for progress bars.
 *
 * 这个计数器用于为进度条生成唯一的 ID。
 *
 */
let progressbarId = 0;

/**
 * `<mat-progress-bar>` component.
 *
 * `<mat-progress-bar>` 组件
 *
 */
@Component({
  selector: 'mat-progress-bar',
  exportAs: 'matProgressBar',
  host: {
    'role': 'progressbar',
    'aria-valuemin': '0',
    'aria-valuemax': '100',
    '[attr.aria-valuenow]': '(mode === "indeterminate" || mode === "query") ? null : value',
    '[attr.mode]': 'mode',
    'class': 'mat-progress-bar',
    '[class._mat-animation-noopable]': '_isNoopAnimation',
  },
  inputs: ['color'],
  templateUrl: 'progress-bar.html',
  styleUrls: ['progress-bar.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class MatProgressBar extends _MatProgressBarMixinBase implements CanColor,
                                                      AfterViewInit, OnDestroy {
  constructor(public _elementRef: ElementRef, private _ngZone: NgZone,
              @Optional() @Inject(ANIMATION_MODULE_TYPE) public _animationMode?: string,
              /**
               * @deprecated `location` parameter to be made required.
               * @breaking-change 8.0.0
               */
              @Optional() @Inject(MAT_PROGRESS_BAR_LOCATION) location?: MatProgressBarLocation) {
    super(_elementRef);

    // We need to prefix the SVG reference with the current path, otherwise they won't work
    // in Safari if the page has a `<base>` tag. Note that we need quotes inside the `url()`,

    // because named route URLs can contain parentheses (see #12338). Also we don't use since
    // we can't tell the difference between whether
    // the consumer is using the hash location strategy or not, because `Location` normalizes
    // both `/#/foo/bar` and `/foo/bar` to the same thing.
    const path = location ? location.getPathname().split('#')[0] : '';
    this._rectangleFillValue = `url('${path}#${this.progressbarId}')`;
    this._isNoopAnimation = _animationMode === 'NoopAnimations';
  }

  /**
   * Flag that indicates whether NoopAnimations mode is set to true.
   *
   * 指出 NoopAnimations 模式是否设置为 true 的标志。
   *
   */
  _isNoopAnimation = false;

  /**
   * Value of the progress bar. Defaults to zero. Mirrored to aria-valuenow.
   *
   * 进度条的值。默认为零。镜像到 aria-valuenow。
   *
   */
  @Input()
  get value(): number { return this._value; }
  set value(v: number) {
    this._value = clamp(coerceNumberProperty(v) || 0);
  }
  private _value: number = 0;

  /**
   * Buffer value of the progress bar. Defaults to zero.
   *
   * 进度条的缓冲值。默认为零。
   *
   */
  @Input()
  get bufferValue(): number { return this._bufferValue; }
  set bufferValue(v: number) { this._bufferValue = clamp(v || 0); }
  private _bufferValue: number = 0;

  @ViewChild('primaryValueBar') _primaryValueBar: ElementRef;

  /**
   * Event emitted when animation of the primary progress bar completes. This event will not
   * be emitted when animations are disabled, nor will it be emitted for modes with continuous
   * animations (indeterminate and query).
   *
   * 当主进度条的动画完成时会发出本事件。当禁用动画时，不会发出此事件，也不会为具有连续动画的模式（不定动画和查询动画）发出此事件。
   *
   */
  @Output() animationEnd = new EventEmitter<ProgressAnimationEnd>();

  /**
   * Reference to animation end subscription to be unsubscribed on destroy.
   *
   * 供销毁时取消动画完成订阅的引用。
   *
   */
  private _animationEndSubscription: Subscription = Subscription.EMPTY;

  /**
   * Mode of the progress bar.
   *
   * 进度条的模式吧。
   *
   * Input must be one of these values: determinate, indeterminate, buffer, query, defaults to
   * 'determinate'.
   * Mirrored to mode attribute.
   *
   * 此输入属性必须是以下值之一：determinate、indeterminate、buffer 和 query，默认为 'determinate'。会镜像到 mode 属性。
   *
   */
  @Input() mode: ProgressBarMode = 'determinate';

  /**
   * ID of the progress bar.
   *
   * 进度条的 ID。
   *
   */
  progressbarId = `mat-progress-bar-${progressbarId++}`;

  /**
   * Attribute to be used for the `fill` attribute on the internal `rect` element.
   *
   * 要供内部 `rect` 元素的 `fill` 属性使用的属性。
   *
   */
  _rectangleFillValue: string;

  /**
   * Gets the current transform value for the progress bar's primary indicator.
   *
   * 获取进度条主要指示器的当前变换值。
   *
   */
  _primaryTransform() {
    // We use a 3d transform to work around some rendering issues in iOS Safari. See #19328.
    const scale = this.value / 100;
    return {transform: `scale3d(${scale}, 1, 1)`};
  }

  /**
   * Gets the current transform value for the progress bar's buffer indicator. Only used if the
   * progress mode is set to buffer, otherwise returns an undefined, causing no transformation.
   *
   * 获取进度条缓冲区指示器的当前变换值。仅当 progress 模式设置为 buffer 时才使用，否则返回 undefined，不进行转换。
   *
   */
  _bufferTransform() {
    if (this.mode === 'buffer') {
      // We use a 3d transform to work around some rendering issues in iOS Safari. See #19328.
      const scale = this.bufferValue / 100;
      return {transform: `scale3d(${scale}, 1, 1)`};
    }
    return null;
  }

  ngAfterViewInit() {
    // Run outside angular so change detection didn't get triggered on every transition end
    // instead only on the animation that we care about (primary value bar's transitionend)
    this._ngZone.runOutsideAngular((() => {
      const element = this._primaryValueBar.nativeElement;

      this._animationEndSubscription =
        (fromEvent(element, 'transitionend') as Observable<TransitionEvent>)
          .pipe(filter(((e: TransitionEvent) => e.target === element)))
          .subscribe(() => {
            if (this.mode === 'determinate' || this.mode === 'buffer') {
              this._ngZone.run(() => this.animationEnd.next({value: this.value}));
            }
          });
    }));
  }

  ngOnDestroy() {
    this._animationEndSubscription.unsubscribe();
  }

  static ngAcceptInputType_value: NumberInput;
}

/**
 * Clamps a value to be between two numbers, by default 0 and 100.
 *
 * 在两个数字之间夹取一个值，默认为 0 和 100。
 *
 */
function clamp(v: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, v));
}
