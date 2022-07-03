/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {FocusMonitor, FocusOrigin} from '@angular/cdk/a11y';
import {Directionality} from '@angular/cdk/bidi';
import {
  BooleanInput,
  coerceBooleanProperty,
  coerceNumberProperty,
  NumberInput,
} from '@angular/cdk/coercion';
import {
  DOWN_ARROW,
  END,
  HOME,
  LEFT_ARROW,
  PAGE_DOWN,
  PAGE_UP,
  RIGHT_ARROW,
  UP_ARROW,
  hasModifierKey,
} from '@angular/cdk/keycodes';
import {
  Attribute,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  Inject,
  Input,
  OnDestroy,
  Optional,
  Output,
  ViewChild,
  ViewEncapsulation,
  NgZone,
  AfterViewInit,
} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {
  CanColor,
  CanDisable,
  HasTabIndex,
  mixinColor,
  mixinDisabled,
  mixinTabIndex,
} from '@angular/material/core';
import {ANIMATION_MODULE_TYPE} from '@angular/platform-browser/animations';
import {normalizePassiveListenerOptions} from '@angular/cdk/platform';
import {DOCUMENT} from '@angular/common';
import {Subscription} from 'rxjs';

const activeEventOptions = normalizePassiveListenerOptions({passive: false});

/**
 * Visually, a 30px separation between tick marks looks best. This is very subjective but it is
 * the default separation we chose.
 *
 * 从外观上看，刻度线之间的距离是 30px 时，其视觉效果最好。这固然非常主观，但它是我们选择的默认间隔。
 *
 */
const MIN_AUTO_TICK_SEPARATION = 30;

/**
 * The thumb gap size for a disabled slider.
 *
 * 已禁用滑杆的滑块间隙尺寸。
 *
 */
const DISABLED_THUMB_GAP = 7;

/**
 * The thumb gap size for a non-active slider at its minimum value.
 *
 * 非活动滑杆在最小值时的滑块间隙大小。
 *
 */
const MIN_VALUE_NONACTIVE_THUMB_GAP = 7;

/**
 * The thumb gap size for an active slider at its minimum value.
 *
 * 活动滑杆在最小值时的滑块间隙大小。
 *
 */
const MIN_VALUE_ACTIVE_THUMB_GAP = 10;

/**
 * Provider Expression that allows mat-slider to register as a ControlValueAccessor.
 * This allows it to support [(ngModel)] and [formControl].
 *
 * 这个提供者表达式允许把 mat-slider 注册为 ControlValueAccessor。这能让它支持 [(ngModel)] 和 [formControl]。
 *
 * @docs-private
 */
export const MAT_SLIDER_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => MatSlider),
  multi: true,
};

/**
 * A simple change event emitted by the MatSlider component.
 *
 * MatSlider 组件发出的一个简单的 change 事件。
 *
 */
export class MatSliderChange {
  /**
   * The MatSlider that changed.
   *
   * 发生改变的 MatSlider。
   *
   */
  source: MatSlider;

  /**
   * The new value of the source slider.
   *
   * 源滑杆的新值。
   *
   */
  value: number | null;
}

// Boilerplate for applying mixins to MatSlider.
/** @docs-private */
const _MatSliderBase = mixinTabIndex(
  mixinColor(
    mixinDisabled(
      class {
        constructor(public _elementRef: ElementRef) {}
      },
    ),
    'accent',
  ),
);

/**
 * Allows users to select from a range of values by moving the slider thumb. It is similar in
 * behavior to the native `<input type="range">` element.
 *
 * 允许用户通过移动滑杆来从一系列值中进行选择。它的行为类似于原生的 `<input type="range">` 元素。
 *
 */
@Component({
  selector: 'mat-slider',
  exportAs: 'matSlider',
  providers: [MAT_SLIDER_VALUE_ACCESSOR],
  host: {
    '(focus)': '_onFocus()',
    '(blur)': '_onBlur()',
    '(keydown)': '_onKeydown($event)',
    '(keyup)': '_onKeyup()',
    '(mouseenter)': '_onMouseenter()',

    // On Safari starting to slide temporarily triggers text selection mode which
    // show the wrong cursor. We prevent it by stopping the `selectstart` event.
    '(selectstart)': '$event.preventDefault()',
    'class': 'mat-slider mat-focus-indicator',
    'role': 'slider',
    '[tabIndex]': 'tabIndex',
    '[attr.aria-disabled]': 'disabled',
    '[attr.aria-valuemax]': 'max',
    '[attr.aria-valuemin]': 'min',
    '[attr.aria-valuenow]': 'value',

    // NVDA and Jaws appear to announce the `aria-valuenow` by calculating its percentage based
    // on its value between `aria-valuemin` and `aria-valuemax`. Due to how decimals are handled,
    // it can cause the slider to read out a very long value like 0.20000068 if the current value
    // is 0.2 with a min of 0 and max of 1. We work around the issue by setting `aria-valuetext`
    // to the same value that we set on the slider's thumb which will be truncated.
    '[attr.aria-valuetext]': 'valueText == null ? displayValue : valueText',
    '[attr.aria-orientation]': 'vertical ? "vertical" : "horizontal"',
    '[class.mat-slider-disabled]': 'disabled',
    '[class.mat-slider-has-ticks]': 'tickInterval',
    '[class.mat-slider-horizontal]': '!vertical',
    '[class.mat-slider-axis-inverted]': '_shouldInvertAxis()',
    // Class binding which is only used by the test harness as there is no other
    // way for the harness to detect if mouse coordinates need to be inverted.
    '[class.mat-slider-invert-mouse-coords]': '_shouldInvertMouseCoords()',
    '[class.mat-slider-sliding]': '_isSliding',
    '[class.mat-slider-thumb-label-showing]': 'thumbLabel',
    '[class.mat-slider-vertical]': 'vertical',
    '[class.mat-slider-min-value]': '_isMinValue()',
    '[class.mat-slider-hide-last-tick]':
      'disabled || _isMinValue() && _getThumbGap() && _shouldInvertAxis()',
    '[class._mat-animation-noopable]': '_animationMode === "NoopAnimations"',
  },
  templateUrl: 'slider.html',
  styleUrls: ['slider.css'],
  inputs: ['disabled', 'color', 'tabIndex'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatSlider
  extends _MatSliderBase
  implements ControlValueAccessor, OnDestroy, CanDisable, CanColor, AfterViewInit, HasTabIndex
{
  /**
   * Whether the slider is inverted.
   *
   * 滑杆是否反转了。
   *
   */
  @Input()
  get invert(): boolean {
    return this._invert;
  }
  set invert(value: BooleanInput) {
    this._invert = coerceBooleanProperty(value);
  }
  private _invert = false;

  /**
   * The maximum value that the slider can have.
   *
   * 滑杆所具有的最大值。
   *
   */
  @Input()
  get max(): number {
    return this._max;
  }
  set max(v: NumberInput) {
    this._max = coerceNumberProperty(v, this._max);
    this._percent = this._calculatePercentage(this._value);

    // Since this also modifies the percentage, we need to let the change detection know.
    this._changeDetectorRef.markForCheck();
  }
  private _max: number = 100;

  /**
   * The minimum value that the slider can have.
   *
   * 滑杆所具有的最小值。
   *
   */
  @Input()
  get min(): number {
    return this._min;
  }
  set min(v: NumberInput) {
    this._min = coerceNumberProperty(v, this._min);
    this._percent = this._calculatePercentage(this._value);

    // Since this also modifies the percentage, we need to let the change detection know.
    this._changeDetectorRef.markForCheck();
  }
  private _min: number = 0;

  /**
   * The values at which the thumb will snap.
   *
   * 滑块处的值。
   *
   */
  @Input()
  get step(): number {
    return this._step;
  }
  set step(v: NumberInput) {
    this._step = coerceNumberProperty(v, this._step);

    if (this._step % 1 !== 0) {
      this._roundToDecimal = this._step.toString().split('.').pop()!.length;
    }

    // Since this could modify the label, we need to notify the change detection.
    this._changeDetectorRef.markForCheck();
  }
  private _step: number = 1;

  /**
   * Whether or not to show the thumb label.
   *
   * 是否要显示这个滑块标签。
   *
   */
  @Input()
  get thumbLabel(): boolean {
    return this._thumbLabel;
  }
  set thumbLabel(value: BooleanInput) {
    this._thumbLabel = coerceBooleanProperty(value);
  }
  private _thumbLabel: boolean = false;

  /**
   * How often to show ticks. Relative to the step so that a tick always appears on a step.
   * Ex: Tick interval of 4 with a step of 3 will draw a tick every 4 steps (every 12 values).
   *
   * 多远才显示一个刻度。相对于步长来说，刻度总是会出现在一个步长上。例如：刻度的间隔为 4，步长为 3，则每 4 步（每 12 个值）就会画一个刻度。
   *
   */
  @Input()
  get tickInterval(): 'auto' | number {
    return this._tickInterval;
  }
  set tickInterval(value: 'auto' | NumberInput) {
    if (value === 'auto') {
      this._tickInterval = 'auto';
    } else if (typeof value === 'number' || typeof value === 'string') {
      this._tickInterval = coerceNumberProperty(value, this._tickInterval as number);
    } else {
      this._tickInterval = 0;
    }
  }
  private _tickInterval: 'auto' | number = 0;

  /**
   * Value of the slider.
   *
   * 滑杆的值。
   *
   */
  @Input()
  get value(): number {
    // If the value needs to be read and it is still uninitialized, initialize it to the min.
    if (this._value === null) {
      this.value = this._min;
    }
    return this._value as number;
  }
  set value(v: NumberInput) {
    if (v !== this._value) {
      let value = coerceNumberProperty(v, 0);

      // While incrementing by a decimal we can end up with values like 33.300000000000004.
      // Truncate it to ensure that it matches the label and to make it easier to work with.
      if (this._roundToDecimal && value !== this.min && value !== this.max) {
        value = parseFloat(value.toFixed(this._roundToDecimal));
      }

      this._value = value;
      this._percent = this._calculatePercentage(this._value);

      // Since this also modifies the percentage, we need to let the change detection know.
      this._changeDetectorRef.markForCheck();
    }
  }
  private _value: number | null = null;

  /**
   * Function that will be used to format the value before it is displayed
   * in the thumb label. Can be used to format very large number in order
   * for them to fit into the slider thumb.
   *
   * 在滑块的标签上显示值之前用来格式化该值的函数。可以用来格式化非常大的数字，以便让它们适配滑杆。
   *
   */
  @Input() displayWith: (value: number) => string | number;

  /**
   * Text corresponding to the slider's value. Used primarily for improved accessibility.
   *
   * 对应滑杆值的文本。主要用于改善无障碍性。
   *
   */
  @Input() valueText: string;

  /**
   * Whether the slider is vertical.
   *
   * 滑杆是否垂直。
   *
   */
  @Input()
  get vertical(): boolean {
    return this._vertical;
  }
  set vertical(value: BooleanInput) {
    this._vertical = coerceBooleanProperty(value);
  }
  private _vertical = false;

  /**
   * Event emitted when the slider value has changed.
   *
   * 滑杆值发生变化时发出的事件。
   *
   */
  @Output() readonly change: EventEmitter<MatSliderChange> = new EventEmitter<MatSliderChange>();

  /**
   * Event emitted when the slider thumb moves.
   *
   * 滑杆上的滑块移动时发出的事件。
   *
   */
  @Output() readonly input: EventEmitter<MatSliderChange> = new EventEmitter<MatSliderChange>();

  /**
   * Emits when the raw value of the slider changes. This is here primarily
   * to facilitate the two-way binding for the `value` input.
   *
   * 当滑杆的原始值发生变化时会触发。这主要是为了方便 `value` 输入的双向绑定。
   *
   * @docs-private
   */
  @Output() readonly valueChange: EventEmitter<number | null> = new EventEmitter<number | null>();

  /**
   * The value to be used for display purposes.
   *
   * 供显示用的值。
   *
   */
  get displayValue(): string | number {
    if (this.displayWith) {
      // Value is never null but since setters and getters cannot have
      // different types, the value getter is also typed to return null.
      return this.displayWith(this.value!);
    }

    // Note that this could be improved further by rounding something like 0.999 to 1 or
    // 0.899 to 0.9, however it is very performance sensitive, because it gets called on
    // every change detection cycle.
    if (this._roundToDecimal && this.value && this.value % 1 !== 0) {
      return this.value.toFixed(this._roundToDecimal);
    }

    return this.value || 0;
  }

  /**
   * set focus to the host element
   *
   * 把焦点设置到宿主元素上
   *
   */
  focus(options?: FocusOptions) {
    this._focusHostElement(options);
  }

  /**
   * blur the host element
   *
   * 让宿主元素失焦
   *
   */
  blur() {
    this._blurHostElement();
  }

  /**
   * onTouch function registered via registerOnTouch (ControlValueAccessor).
   *
   * 通过 ControlValueAccessor 上的 registerOnTouch 注册的 onTouch 函数。
   *
   */
  onTouched: () => any = () => {};

  /**
   * The percentage of the slider that coincides with the value.
   *
   * 与滑杆值一致的百分比值。
   *
   */
  get percent(): number {
    return this._clamp(this._percent);
  }
  private _percent: number = 0;

  /**
   * Whether or not the thumb is sliding and what the user is using to slide it with.
   * Used to determine if there should be a transition for the thumb and fill track.
   *
   * 滑块是否在滑动。用来判断滑块和填充轨道是否应该有过渡动画。
   *
   */
  _isSliding: 'keyboard' | 'pointer' | null = null;

  /**
   * Whether or not the slider is active (clicked or sliding).
   * Used to shrink and grow the thumb as according to the Material Design spec.
   *
   * 滑杆是否处于活动状态（单击或滑动）。要根据 Material Design 规范缩小和缩放滑块。
   *
   */
  _isActive: boolean = false;

  /**
   * Whether the axis of the slider is inverted.
   * (i.e. whether moving the thumb in the positive x or y direction decreases the slider's value).
   *
   * 滑杆的轴是否反转了。也就是说，无论是在 x 或 y 的正方向上移动滑块，都会减小滑杆的值）。
   *
   */
  _shouldInvertAxis() {
    // Standard non-inverted mode for a vertical slider should be dragging the thumb from bottom to
    // top. However from a y-axis standpoint this is inverted.
    return this.vertical ? !this.invert : this.invert;
  }

  /**
   * Whether the slider is at its minimum value.
   *
   * 滑杆是否达到了最小值。
   *
   */
  _isMinValue() {
    return this.percent === 0;
  }

  /**
   * The amount of space to leave between the slider thumb and the track fill & track background
   * elements.
   *
   * 滑杆的滑块与填充轨道和背景轨道元素之间要留出的间隙量。
   *
   */
  _getThumbGap() {
    if (this.disabled) {
      return DISABLED_THUMB_GAP;
    }
    if (this._isMinValue() && !this.thumbLabel) {
      return this._isActive ? MIN_VALUE_ACTIVE_THUMB_GAP : MIN_VALUE_NONACTIVE_THUMB_GAP;
    }
    return 0;
  }

  /**
   * CSS styles for the track background element.
   *
   * 背景轨道元素的 CSS 样式。
   *
   */
  _getTrackBackgroundStyles(): {[key: string]: string} {
    const axis = this.vertical ? 'Y' : 'X';
    const scale = this.vertical ? `1, ${1 - this.percent}, 1` : `${1 - this.percent}, 1, 1`;
    const sign = this._shouldInvertMouseCoords() ? '-' : '';

    return {
      // scale3d avoids some rendering issues in Chrome. See #12071.
      transform: `translate${axis}(${sign}${this._getThumbGap()}px) scale3d(${scale})`,
    };
  }

  /**
   * CSS styles for the track fill element.
   *
   * 填充轨道元素的 CSS 样式。
   *
   */
  _getTrackFillStyles(): {[key: string]: string} {
    const percent = this.percent;
    const axis = this.vertical ? 'Y' : 'X';
    const scale = this.vertical ? `1, ${percent}, 1` : `${percent}, 1, 1`;
    const sign = this._shouldInvertMouseCoords() ? '' : '-';

    return {
      // scale3d avoids some rendering issues in Chrome. See #12071.
      transform: `translate${axis}(${sign}${this._getThumbGap()}px) scale3d(${scale})`,
      // iOS Safari has a bug where it won't re-render elements which start of as `scale(0)` until
      // something forces a style recalculation on it. Since we'll end up with `scale(0)` when
      // the value of the slider is 0, we can easily get into this situation. We force a
      // recalculation by changing the element's `display` when it goes from 0 to any other value.
      display: percent === 0 ? 'none' : '',
    };
  }

  /**
   * CSS styles for the ticks container element.
   *
   * 刻度容器元素的 CSS 样式。
   *
   */
  _getTicksContainerStyles(): {[key: string]: string} {
    let axis = this.vertical ? 'Y' : 'X';
    // For a horizontal slider in RTL languages we push the ticks container off the left edge
    // instead of the right edge to avoid causing a horizontal scrollbar to appear.
    let sign = !this.vertical && this._getDirection() == 'rtl' ? '' : '-';
    let offset = (this._tickIntervalPercent / 2) * 100;
    return {
      'transform': `translate${axis}(${sign}${offset}%)`,
    };
  }

  /**
   * CSS styles for the ticks element.
   *
   * 刻度元素的 CSS 样式。
   *
   */
  _getTicksStyles(): {[key: string]: string} {
    let tickSize = this._tickIntervalPercent * 100;
    let backgroundSize = this.vertical ? `2px ${tickSize}%` : `${tickSize}% 2px`;
    let axis = this.vertical ? 'Y' : 'X';
    // Depending on the direction we pushed the ticks container, push the ticks the opposite
    // direction to re-center them but clip off the end edge. In RTL languages we need to flip the
    // ticks 180 degrees so we're really cutting off the end edge abd not the start.
    let sign = !this.vertical && this._getDirection() == 'rtl' ? '-' : '';
    let rotate = !this.vertical && this._getDirection() == 'rtl' ? ' rotate(180deg)' : '';
    let styles: {[key: string]: string} = {
      'backgroundSize': backgroundSize,
      // Without translateZ ticks sometimes jitter as the slider moves on Chrome & Firefox.
      'transform': `translateZ(0) translate${axis}(${sign}${tickSize / 2}%)${rotate}`,
    };

    if (this._isMinValue() && this._getThumbGap()) {
      const shouldInvertAxis = this._shouldInvertAxis();
      let side: string;

      if (this.vertical) {
        side = shouldInvertAxis ? 'Bottom' : 'Top';
      } else {
        side = shouldInvertAxis ? 'Right' : 'Left';
      }

      styles[`padding${side}`] = `${this._getThumbGap()}px`;
    }

    return styles;
  }

  _getThumbContainerStyles(): {[key: string]: string} {
    const shouldInvertAxis = this._shouldInvertAxis();
    let axis = this.vertical ? 'Y' : 'X';
    // For a horizontal slider in RTL languages we push the thumb container off the left edge
    // instead of the right edge to avoid causing a horizontal scrollbar to appear.
    let invertOffset =
      this._getDirection() == 'rtl' && !this.vertical ? !shouldInvertAxis : shouldInvertAxis;
    let offset = (invertOffset ? this.percent : 1 - this.percent) * 100;
    return {
      'transform': `translate${axis}(-${offset}%)`,
    };
  }

  /**
   * The size of a tick interval as a percentage of the size of the track.
   *
   * 刻度间隔的大小占轨道大小的百分比。
   *
   */
  private _tickIntervalPercent: number = 0;

  /**
   * The dimensions of the slider.
   *
   * 滑杆的规格。
   *
   */
  private _sliderDimensions: ClientRect | null = null;

  private _controlValueAccessorChangeFn: (value: any) => void = () => {};

  /**
   * Decimal places to round to, based on the step amount.
   *
   * 根据步数，舍入到的小数位数。
   *
   */
  private _roundToDecimal: number;

  /**
   * Subscription to the Directionality change EventEmitter.
   *
   * 对方向性（Directionality）变化事件的订阅。
   *
   */
  private _dirChangeSubscription = Subscription.EMPTY;

  /**
   * The value of the slider when the slide start event fires.
   *
   * 当滑杆的开始滑动事件触发时，该滑杆的值是什么。
   *
   */
  private _valueOnSlideStart: number | null;

  /**
   * Reference to the inner slider wrapper element.
   *
   * 到内部滑杆的包装元素的引用。
   *
   */
  @ViewChild('sliderWrapper') private _sliderWrapper: ElementRef;

  /**
   * Whether mouse events should be converted to a slider position by calculating their distance
   * from the right or bottom edge of the slider as opposed to the top or left.
   *
   * 鼠标事件是否应该转换为滑杆中的位置，方法是计算到滑杆右边缘或下边缘以及到顶边或左边的距离。
   *
   */
  _shouldInvertMouseCoords() {
    const shouldInvertAxis = this._shouldInvertAxis();
    return this._getDirection() == 'rtl' && !this.vertical ? !shouldInvertAxis : shouldInvertAxis;
  }

  /**
   * The language direction for this slider element.
   *
   * 这个滑杆元素的语言方向。
   *
   */
  private _getDirection() {
    return this._dir && this._dir.value == 'rtl' ? 'rtl' : 'ltr';
  }

  /**
   * Keeps track of the last pointer event that was captured by the slider.
   *
   * 跟踪滑杆捕获的最后一个指针事件。
   *
   */
  private _lastPointerEvent: MouseEvent | TouchEvent | null;

  /**
   * Used to subscribe to global move and end events
   *
   * 订阅全局移动和结束事件
   *
   */
  protected _document: Document;

  /**
   * Identifier used to attribute a touch event to a particular slider.
   * Will be undefined if one of the following conditions is true:
   *
   * 用于将触摸事件归因于特定滑块的标识符。如果以下条件之一为真，则它将是未定义的：
   *
   * - The user isn't dragging using a touch device.
   *
   *   用户没有使用触摸设备进行拖动。
   *
   * - The browser doesn't support `Touch.identifier`.
   *
   *   浏览器不支持 `Touch.identifier` 。
   *
   * - Dragging hasn't started yet.
   *
   *   拖动尚未开始。
   *
   */
  private _touchId: number | undefined;

  constructor(
    elementRef: ElementRef,
    private _focusMonitor: FocusMonitor,
    private _changeDetectorRef: ChangeDetectorRef,
    @Optional() private _dir: Directionality,
    @Attribute('tabindex') tabIndex: string,
    private _ngZone: NgZone,
    @Inject(DOCUMENT) _document: any,
    @Optional() @Inject(ANIMATION_MODULE_TYPE) public _animationMode?: string,
  ) {
    super(elementRef);
    this._document = _document;
    this.tabIndex = parseInt(tabIndex) || 0;

    _ngZone.runOutsideAngular(() => {
      const element = elementRef.nativeElement;
      element.addEventListener('mousedown', this._pointerDown, activeEventOptions);
      element.addEventListener('touchstart', this._pointerDown, activeEventOptions);
    });
  }

  ngAfterViewInit() {
    this._focusMonitor.monitor(this._elementRef, true).subscribe((origin: FocusOrigin) => {
      this._isActive = !!origin && origin !== 'keyboard';
      this._changeDetectorRef.detectChanges();
    });
    if (this._dir) {
      this._dirChangeSubscription = this._dir.change.subscribe(() => {
        this._changeDetectorRef.markForCheck();
      });
    }
  }

  ngOnDestroy() {
    const element = this._elementRef.nativeElement;
    element.removeEventListener('mousedown', this._pointerDown, activeEventOptions);
    element.removeEventListener('touchstart', this._pointerDown, activeEventOptions);
    this._lastPointerEvent = null;
    this._removeGlobalEvents();
    this._focusMonitor.stopMonitoring(this._elementRef);
    this._dirChangeSubscription.unsubscribe();
  }

  _onMouseenter() {
    if (this.disabled) {
      return;
    }

    // We save the dimensions of the slider here so we can use them to update the spacing of the
    // ticks and determine where on the slider click and slide events happen.
    this._sliderDimensions = this._getSliderDimensions();
    this._updateTickIntervalPercent();
  }

  _onFocus() {
    // We save the dimensions of the slider here so we can use them to update the spacing of the
    // ticks and determine where on the slider click and slide events happen.
    this._sliderDimensions = this._getSliderDimensions();
    this._updateTickIntervalPercent();
  }

  _onBlur() {
    this.onTouched();
  }

  _onKeydown(event: KeyboardEvent) {
    if (
      this.disabled ||
      hasModifierKey(event) ||
      (this._isSliding && this._isSliding !== 'keyboard')
    ) {
      return;
    }

    const oldValue = this.value;

    switch (event.keyCode) {
      case PAGE_UP:
        this._increment(10);
        break;
      case PAGE_DOWN:
        this._increment(-10);
        break;
      case END:
        this.value = this.max;
        break;
      case HOME:
        this.value = this.min;
        break;
      case LEFT_ARROW:
        // NOTE: For a sighted user it would make more sense that when they press an arrow key on an
        // inverted slider the thumb moves in that direction. However for a blind user, nothing
        // about the slider indicates that it is inverted. They will expect left to be decrement,
        // regardless of how it appears on the screen. For speakers ofRTL languages, they probably
        // expect left to mean increment. Therefore we flip the meaning of the side arrow keys for
        // RTL. For inverted sliders we prefer a good a11y experience to having it "look right" for
        // sighted users, therefore we do not swap the meaning.
        this._increment(this._getDirection() == 'rtl' ? 1 : -1);
        break;
      case UP_ARROW:
        this._increment(1);
        break;
      case RIGHT_ARROW:
        // See comment on LEFT_ARROW about the conditions under which we flip the meaning.
        this._increment(this._getDirection() == 'rtl' ? -1 : 1);
        break;
      case DOWN_ARROW:
        this._increment(-1);
        break;
      default:
        // Return if the key is not one that we explicitly handle to avoid calling preventDefault on
        // it.
        return;
    }

    if (oldValue != this.value) {
      this._emitInputEvent();
      this._emitChangeEvent();
    }

    this._isSliding = 'keyboard';
    event.preventDefault();
  }

  _onKeyup() {
    if (this._isSliding === 'keyboard') {
      this._isSliding = null;
    }
  }

  /**
   * Called when the user has put their pointer down on the slider.
   *
   * 当用户把指针放在滑杆上时调用。
   *
   */
  private _pointerDown = (event: TouchEvent | MouseEvent) => {
    // Don't do anything if the slider is disabled or the
    // user is using anything other than the main mouse button.
    if (this.disabled || this._isSliding || (!isTouchEvent(event) && event.button !== 0)) {
      return;
    }

    this._ngZone.run(() => {
      this._touchId = isTouchEvent(event)
        ? getTouchIdForSlider(event, this._elementRef.nativeElement)
        : undefined;
      const pointerPosition = getPointerPositionOnPage(event, this._touchId);

      if (pointerPosition) {
        const oldValue = this.value;
        this._isSliding = 'pointer';
        this._lastPointerEvent = event;
        this._focusHostElement();
        this._onMouseenter(); // Simulate mouseenter in case this is a mobile device.
        this._bindGlobalEvents(event);
        this._focusHostElement();
        this._updateValueFromPosition(pointerPosition);
        this._valueOnSlideStart = oldValue;

        // Despite the fact that we explicitly bind active events, in some cases the browser
        // still dispatches non-cancelable events which cause this call to throw an error.
        // There doesn't appear to be a good way of avoiding them. See #23820.
        if (event.cancelable) {
          event.preventDefault();
        }

        // Emit a change and input event if the value changed.
        if (oldValue != this.value) {
          this._emitInputEvent();
        }
      }
    });
  };

  /**
   * Called when the user has moved their pointer after
   * starting to drag. Bound on the document level.
   *
   * 当用户在开始拖动后移动指针时调用。绑定在 document 级别。
   *
   */
  private _pointerMove = (event: TouchEvent | MouseEvent) => {
    if (this._isSliding === 'pointer') {
      const pointerPosition = getPointerPositionOnPage(event, this._touchId);

      if (pointerPosition) {
        // Prevent the slide from selecting anything else.
        event.preventDefault();
        const oldValue = this.value;
        this._lastPointerEvent = event;
        this._updateValueFromPosition(pointerPosition);

        // Native range elements always emit `input` events when the value changed while sliding.
        if (oldValue != this.value) {
          this._emitInputEvent();
        }
      }
    }
  };

  /**
   * Called when the user has lifted their pointer. Bound on the document level.
   *
   * 当用户抬起指针时调用。绑定在 document 级别。
   *
   */
  private _pointerUp = (event: TouchEvent | MouseEvent) => {
    if (this._isSliding === 'pointer') {
      if (
        !isTouchEvent(event) ||
        typeof this._touchId !== 'number' ||
        // Note that we use `changedTouches`, rather than `touches` because it
        // seems like in most cases `touches` is empty for `touchend` events.
        findMatchingTouch(event.changedTouches, this._touchId)
      ) {
        event.preventDefault();
        this._removeGlobalEvents();
        this._isSliding = null;
        this._touchId = undefined;

        if (this._valueOnSlideStart != this.value && !this.disabled) {
          this._emitChangeEvent();
        }

        this._valueOnSlideStart = this._lastPointerEvent = null;
      }
    }
  };

  /**
   * Called when the window has lost focus.
   *
   * 当窗口失焦时调用。
   *
   */
  private _windowBlur = () => {
    // If the window is blurred while dragging we need to stop dragging because the
    // browser won't dispatch the `mouseup` and `touchend` events anymore.
    if (this._lastPointerEvent) {
      this._pointerUp(this._lastPointerEvent);
    }
  };

  /**
   * Use defaultView of injected document if available or fallback to global window reference
   *
   * 如果可用，则使用注入 document 的 defaultView，否则回退到全局 window 的引用
   *
   */
  private _getWindow(): Window {
    return this._document.defaultView || window;
  }

  /**
   * Binds our global move and end events. They're bound at the document level and only while
   * dragging so that the user doesn't have to keep their pointer exactly over the slider
   * as they're swiping across the screen.
   *
   * 绑定我们的全局移动和终止事件。它们只绑定在 document 层次上，并且只是在拖动的时候才绑定，这样当用户在滑动屏幕时就不必把指针放在滑杆上。
   *
   */
  private _bindGlobalEvents(triggerEvent: TouchEvent | MouseEvent) {
    // Note that we bind the events to the `document`, because it allows us to capture
    // drag cancel events where the user's pointer is outside the browser window.
    const document = this._document;
    const isTouch = isTouchEvent(triggerEvent);
    const moveEventName = isTouch ? 'touchmove' : 'mousemove';
    const endEventName = isTouch ? 'touchend' : 'mouseup';
    document.addEventListener(moveEventName, this._pointerMove, activeEventOptions);
    document.addEventListener(endEventName, this._pointerUp, activeEventOptions);

    if (isTouch) {
      document.addEventListener('touchcancel', this._pointerUp, activeEventOptions);
    }

    const window = this._getWindow();

    if (typeof window !== 'undefined' && window) {
      window.addEventListener('blur', this._windowBlur);
    }
  }

  /**
   * Removes any global event listeners that we may have added.
   *
   * 删除那些我们可能添加的全局事件监听器。
   *
   */
  private _removeGlobalEvents() {
    const document = this._document;
    document.removeEventListener('mousemove', this._pointerMove, activeEventOptions);
    document.removeEventListener('mouseup', this._pointerUp, activeEventOptions);
    document.removeEventListener('touchmove', this._pointerMove, activeEventOptions);
    document.removeEventListener('touchend', this._pointerUp, activeEventOptions);
    document.removeEventListener('touchcancel', this._pointerUp, activeEventOptions);

    const window = this._getWindow();

    if (typeof window !== 'undefined' && window) {
      window.removeEventListener('blur', this._windowBlur);
    }
  }

  /**
   * Increments the slider by the given number of steps (negative number decrements).
   *
   * 按指定的步数递增滑杆（负数递减）。
   *
   */
  private _increment(numSteps: number) {
    // Pre-clamp the current value since it's allowed to be
    // out of bounds when assigned programmatically.
    const clampedValue = this._clamp(this.value || 0, this.min, this.max);
    this.value = this._clamp(clampedValue + this.step * numSteps, this.min, this.max);
  }

  /**
   * Calculate the new value from the new physical location. The value will always be snapped.
   *
   * 从新的物理位置计算新值。该值始终会被捕捉。
   *
   */
  private _updateValueFromPosition(pos: {x: number; y: number}) {
    if (!this._sliderDimensions) {
      return;
    }

    let offset = this.vertical ? this._sliderDimensions.top : this._sliderDimensions.left;
    let size = this.vertical ? this._sliderDimensions.height : this._sliderDimensions.width;
    let posComponent = this.vertical ? pos.y : pos.x;

    // The exact value is calculated from the event and used to find the closest snap value.
    let percent = this._clamp((posComponent - offset) / size);

    if (this._shouldInvertMouseCoords()) {
      percent = 1 - percent;
    }

    // Since the steps may not divide cleanly into the max value, if the user
    // slid to 0 or 100 percent, we jump to the min/max value. This approach
    // is slightly more intuitive than using `Math.ceil` below, because it
    // follows the user's pointer closer.
    if (percent === 0) {
      this.value = this.min;
    } else if (percent === 1) {
      this.value = this.max;
    } else {
      const exactValue = this._calculateValue(percent);

      // This calculation finds the closest step by finding the closest
      // whole number divisible by the step relative to the min.
      const closestValue = Math.round((exactValue - this.min) / this.step) * this.step + this.min;

      // The value needs to snap to the min and max.
      this.value = this._clamp(closestValue, this.min, this.max);
    }
  }

  /**
   * Emits a change event if the current value is different from the last emitted value.
   *
   * 如果当前值与上次发出的值不同，就发出 change 事件。
   *
   */
  private _emitChangeEvent() {
    this._controlValueAccessorChangeFn(this.value);
    this.valueChange.emit(this.value);
    this.change.emit(this._createChangeEvent());
  }

  /**
   * Emits an input event when the current value is different from the last emitted value.
   *
   * 如果当前值与上次发出的值不同，就发出 input 事件。
   *
   */
  private _emitInputEvent() {
    this.input.emit(this._createChangeEvent());
  }

  /**
   * Updates the amount of space between ticks as a percentage of the width of the slider.
   *
   * 以滑杆宽度的百分比形式更新刻度之间的间距。
   *
   */
  private _updateTickIntervalPercent() {
    if (!this.tickInterval || !this._sliderDimensions) {
      return;
    }

    let tickIntervalPercent: number;
    if (this.tickInterval == 'auto') {
      let trackSize = this.vertical ? this._sliderDimensions.height : this._sliderDimensions.width;
      let pixelsPerStep = (trackSize * this.step) / (this.max - this.min);
      let stepsPerTick = Math.ceil(MIN_AUTO_TICK_SEPARATION / pixelsPerStep);
      let pixelsPerTick = stepsPerTick * this.step;
      tickIntervalPercent = pixelsPerTick / trackSize;
    } else {
      tickIntervalPercent = (this.tickInterval * this.step) / (this.max - this.min);
    }
    this._tickIntervalPercent = isSafeNumber(tickIntervalPercent) ? tickIntervalPercent : 0;
  }

  /**
   * Creates a slider change object from the specified value.
   *
   * 根据指定的值创建一个滑杆变更对象。
   *
   */
  private _createChangeEvent(value = this.value): MatSliderChange {
    let event = new MatSliderChange();

    event.source = this;
    event.value = value;

    return event;
  }

  /**
   * Calculates the percentage of the slider that a value is.
   *
   * 计算某个值在滑杆上的百分比。
   *
   */
  private _calculatePercentage(value: number | null) {
    const percentage = ((value || 0) - this.min) / (this.max - this.min);
    return isSafeNumber(percentage) ? percentage : 0;
  }

  /**
   * Calculates the value a percentage of the slider corresponds to.
   *
   * 计算某个百分比在滑杆上的值。
   *
   */
  private _calculateValue(percentage: number) {
    return this.min + percentage * (this.max - this.min);
  }

  /**
   * Return a number between two numbers.
   *
   * 在两个数字之间夹取一个数字。
   *
   */
  private _clamp(value: number, min = 0, max = 1) {
    return Math.max(min, Math.min(value, max));
  }

  /**
   * Get the bounding client rect of the slider track element.
   * The track is used rather than the native element to ignore the extra space that the thumb can
   * take up.
   *
   * 获取滑杆轨道元素的 BoundingClientRect。使用该轨道而不是其原生元素来忽略滑块占用的额外空间。
   *
   */
  private _getSliderDimensions() {
    return this._sliderWrapper ? this._sliderWrapper.nativeElement.getBoundingClientRect() : null;
  }

  /**
   * Focuses the native element.
   * Currently only used to allow a blur event to fire but will be used with keyboard input later.
   *
   * 为原生元素设置焦点。目前只用来允许触发失焦事件，但以后也会用于键盘输入。
   *
   */
  private _focusHostElement(options?: FocusOptions) {
    this._elementRef.nativeElement.focus(options);
  }

  /**
   * Blurs the native element.
   *
   * 取消原生元素的焦点。
   *
   */
  private _blurHostElement() {
    this._elementRef.nativeElement.blur();
  }

  /**
   * Sets the model value. Implemented as part of ControlValueAccessor.
   *
   * 设置模型值。实现为 ControlValueAccessor 的一部分。
   *
   * @param value
   */
  writeValue(value: any) {
    this.value = value;
  }

  /**
   * Registers a callback to be triggered when the value has changed.
   * Implemented as part of ControlValueAccessor.
   *
   * 当值发生变化时，就会注册一个回调函数。实现为 ControlValueAccessor 的一部分。
   *
   * @param fn Callback to be registered.
   *
   * 要注册的回调。
   *
   */
  registerOnChange(fn: (value: any) => void) {
    this._controlValueAccessorChangeFn = fn;
  }

  /**
   * Registers a callback to be triggered when the component is touched.
   * Implemented as part of ControlValueAccessor.
   *
   * 注册一个回调函数，它会在该组件被接触时触发。实现为 ControlValueAccessor 的一部分。
   *
   * @param fn Callback to be registered.
   *
   * 要注册的回调。
   *
   */
  registerOnTouched(fn: any) {
    this.onTouched = fn;
  }

  /**
   * Sets whether the component should be disabled.
   * Implemented as part of ControlValueAccessor.
   *
   * 设置是否禁用该组件。实现为 ControlValueAccessor 的一部分。
   *
   * @param isDisabled
   */
  setDisabledState(isDisabled: boolean) {
    this.disabled = isDisabled;
  }
}

/**
 * Checks if number is safe for calculation
 *
 * 检查数字是否可以安全计算
 *
 */
function isSafeNumber(value: number) {
  return !isNaN(value) && isFinite(value);
}

/**
 * Returns whether an event is a touch event.
 *
 * 返回事件是否触摸事件。
 *
 */
function isTouchEvent(event: MouseEvent | TouchEvent): event is TouchEvent {
  // This function is called for every pixel that the user has dragged so we need it to be
  // as fast as possible. Since we only bind mouse events and touch events, we can assume
  // that if the event's name starts with `t`, it's a touch event.
  return event.type[0] === 't';
}

/**
 * Gets the coordinates of a touch or mouse event relative to the viewport.
 *
 * 获取相对于视口的触摸事件或鼠标事件的坐标。
 *
 */
function getPointerPositionOnPage(event: MouseEvent | TouchEvent, id: number | undefined) {
  let point: {clientX: number; clientY: number} | undefined;

  if (isTouchEvent(event)) {
    // The `identifier` could be undefined if the browser doesn't support `TouchEvent.identifier`.
    // If that's the case, attribute the first touch to all active sliders. This should still cover
    // the most common case while only breaking multi-touch.
    if (typeof id === 'number') {
      point = findMatchingTouch(event.touches, id) || findMatchingTouch(event.changedTouches, id);
    } else {
      // `touches` will be empty for start/end events so we have to fall back to `changedTouches`.
      point = event.touches[0] || event.changedTouches[0];
    }
  } else {
    point = event;
  }

  return point ? {x: point.clientX, y: point.clientY} : undefined;
}

/**
 * Finds a `Touch` with a specific ID in a `TouchList`.
 *
 * 在 `TouchList` 中查找具有特定 ID 的 `Touch` 。
 *
 */
function findMatchingTouch(touches: TouchList, id: number): Touch | undefined {
  for (let i = 0; i < touches.length; i++) {
    if (touches[i].identifier === id) {
      return touches[i];
    }
  }

  return undefined;
}

/**
 * Gets the unique ID of a touch that matches a specific slider.
 *
 * 获取与特定滑块匹配的触摸的唯一 ID。
 *
 */
function getTouchIdForSlider(event: TouchEvent, sliderHost: HTMLElement): number | undefined {
  for (let i = 0; i < event.touches.length; i++) {
    const target = event.touches[i].target as HTMLElement;

    if (sliderHost === target || sliderHost.contains(target)) {
      return event.touches[i].identifier;
    }
  }

  return undefined;
}
