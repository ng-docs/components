/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Inject,
  InjectionToken,
  Input,
  Optional,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import {CanColor, mixinColor, ThemePalette} from '@angular/material/core';
import {ANIMATION_MODULE_TYPE} from '@angular/platform-browser/animations';
import {coerceNumberProperty, NumberInput} from '@angular/cdk/coercion';

// Boilerplate for applying mixins to MatProgressBar.
const _MatProgressSpinnerBase = mixinColor(
  class {
    constructor(public _elementRef: ElementRef) {}
  },
  'primary',
);

/**
 * Possible mode for a progress spinner.
 *
 * 进度圈的可能模式。
 *
 */
export type ProgressSpinnerMode = 'determinate' | 'indeterminate';

/**
 * Default `mat-progress-spinner` options that can be overridden.
 *
 * 默认的 `mat-progress-spinner` 选项，可以改写它们。
 *
 */
export interface MatProgressSpinnerDefaultOptions {
  /**
   * Default color of the spinner.
   *
   * 进度圈的默认颜色。
   *
   */
  color?: ThemePalette;
  /**
   * Diameter of the spinner.
   *
   * 进度圈的直径。
   *
   */
  diameter?: number;
  /**
   * Width of the spinner's stroke.
   *
   * 进度圈的线宽。
   *
   */
  strokeWidth?: number;
  /**
   * Whether the animations should be force to be enabled, ignoring if the current environment is
   * using NoopAnimationsModule.
   *
   * 是否要强制启用动画，忽略当前环境是否正在使用 NoopAnimationsModule。
   *
   */
  _forceAnimations?: boolean;
}

/**
 * Injection token to be used to override the default options for `mat-progress-spinner`.
 *
 * 注入令牌，用于改写 `mat-progress-spinner` 的默认选项。
 *
 */
export const MAT_PROGRESS_SPINNER_DEFAULT_OPTIONS =
  new InjectionToken<MatProgressSpinnerDefaultOptions>('mat-progress-spinner-default-options', {
    providedIn: 'root',
    factory: MAT_PROGRESS_SPINNER_DEFAULT_OPTIONS_FACTORY,
  });

/** @docs-private */
export function MAT_PROGRESS_SPINNER_DEFAULT_OPTIONS_FACTORY(): MatProgressSpinnerDefaultOptions {
  return {diameter: BASE_SIZE};
}

/**
 * Base reference size of the spinner.
 *
 * 微调器的基本参考大小。
 *
 */
const BASE_SIZE = 100;

/**
 * Base reference stroke width of the spinner.
 *
 * `<mat-progress-spinner>` 组件。
 *
 */
const BASE_STROKE_WIDTH = 10;

@Component({
  selector: 'mat-progress-spinner, mat-spinner',
  exportAs: 'matProgressSpinner',
  host: {
    'role': 'progressbar',
    'class': 'mat-mdc-progress-spinner mdc-circular-progress',
    // set tab index to -1 so screen readers will read the aria-label
    // Note: there is a known issue with JAWS that does not read progressbar aria labels on FireFox
    'tabindex': '-1',
    '[class._mat-animation-noopable]': `_noopAnimations`,
    '[class.mdc-circular-progress--indeterminate]': 'mode === "indeterminate"',
    '[style.width.px]': 'diameter',
    '[style.height.px]': 'diameter',
    '[style.--mdc-circular-progress-size]': 'diameter + "px"',
    '[style.--mdc-circular-progress-active-indicator-width]': 'diameter + "px"',
    '[attr.aria-valuemin]': '0',
    '[attr.aria-valuemax]': '100',
    '[attr.aria-valuenow]': 'mode === "determinate" ? value : null',
    '[attr.mode]': 'mode',
  },
  inputs: ['color'],
  templateUrl: 'progress-spinner.html',
  styleUrls: ['progress-spinner.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class MatProgressSpinner extends _MatProgressSpinnerBase implements CanColor {
  /**
   * Whether the \_mat-animation-noopable class should be applied, disabling animations.
   *
   * 是否要应用 \_mat-animation-noopable 类，以禁用动画。
   *
   */
  _noopAnimations: boolean;

  /**
   * The element of the determinate spinner.
   *
   * 确定微调器的元素。
   *
   */
  @ViewChild('determinateSpinner') _determinateCircle: ElementRef<HTMLElement>;

  constructor(
    elementRef: ElementRef<HTMLElement>,
    @Optional() @Inject(ANIMATION_MODULE_TYPE) animationMode: string,
    @Inject(MAT_PROGRESS_SPINNER_DEFAULT_OPTIONS)
    defaults?: MatProgressSpinnerDefaultOptions,
  ) {
    super(elementRef);
    this._noopAnimations =
      animationMode === 'NoopAnimations' && !!defaults && !defaults._forceAnimations;

    if (defaults) {
      if (defaults.color) {
        this.color = this.defaultColor = defaults.color;
      }

      if (defaults.diameter) {
        this.diameter = defaults.diameter;
      }

      if (defaults.strokeWidth) {
        this.strokeWidth = defaults.strokeWidth;
      }
    }
  }

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
  @Input() mode: ProgressSpinnerMode =
    this._elementRef.nativeElement.nodeName.toLowerCase() === 'mat-spinner'
      ? 'indeterminate'
      : 'determinate';

  /**
   * Value of the progress bar. Defaults to zero. Mirrored to aria-valuenow.
   *
   * 进度条的值。默认为零。镜像到 aria-valuenow。
   *
   */
  @Input()
  get value(): number {
    return this.mode === 'determinate' ? this._value : 0;
  }
  set value(v: NumberInput) {
    this._value = Math.max(0, Math.min(100, coerceNumberProperty(v)));
  }
  private _value = 0;

  /**
   * The diameter of the progress spinner (will set width and height of svg).
   *
   * 进度圈的直径（用于设置 svg 的宽度和高度）。
   *
   */
  @Input()
  get diameter(): number {
    return this._diameter;
  }
  set diameter(size: NumberInput) {
    this._diameter = coerceNumberProperty(size);
  }
  private _diameter = BASE_SIZE;

  /**
   * Stroke width of the progress spinner.
   *
   * 进度圈的线宽。
   *
   */
  @Input()
  get strokeWidth(): number {
    return this._strokeWidth ?? this.diameter / 10;
  }
  set strokeWidth(value: NumberInput) {
    this._strokeWidth = coerceNumberProperty(value);
  }
  private _strokeWidth: number;

  /**
   * The radius of the spinner, adjusted for stroke width.
   *
   * 进度圈的半径，根据线宽调整。
   *
   */
  _circleRadius(): number {
    return (this.diameter - BASE_STROKE_WIDTH) / 2;
  }

  /**
   * The view box of the spinner's svg element.
   *
   * 进度圈 svg 元素的 viewBox。
   *
   */
  _viewBox() {
    const viewBox = this._circleRadius() * 2 + this.strokeWidth;
    return `0 0 ${viewBox} ${viewBox}`;
  }

  /**
   * The stroke circumference of the svg circle.
   *
   * svg circle 的笔画周长。
   *
   */
  _strokeCircumference(): number {
    return 2 * Math.PI * this._circleRadius();
  }

  /**
   * The dash offset of the svg circle.
   *
   * svg circle 的短划线偏移量。
   *
   */
  _strokeDashOffset() {
    if (this.mode === 'determinate') {
      return (this._strokeCircumference() * (100 - this._value)) / 100;
    }
    return null;
  }

  /**
   * Stroke width of the circle in percent.
   *
   * 圆的线宽，以百分比表示。
   *
   */
  _circleStrokeWidth() {
    return (this.strokeWidth / this.diameter) * 100;
  }
}

/**
 * @deprecated
 *
 * Import Progress Spinner instead. Note that the
 *    `mat-spinner` selector isn't deprecated.
 *
 * 改为导入 Progress Spinner。请注意，不推荐使用 `mat-spinner` 选择器。
 *
 * @breaking-change 16.0.0
 */
// tslint:disable-next-line:variable-name
export const MatSpinner = MatProgressSpinner;
