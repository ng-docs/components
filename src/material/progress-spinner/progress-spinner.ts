/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {coerceNumberProperty, NumberInput} from '@angular/cdk/coercion';
import {Platform, _getShadowRoot} from '@angular/cdk/platform';
import {DOCUMENT} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Inject,
  InjectionToken,
  Input,
  Optional,
  ViewEncapsulation,
  OnInit,
} from '@angular/core';
import {CanColor, mixinColor} from '@angular/material/core';
import {ANIMATION_MODULE_TYPE} from '@angular/platform-browser/animations';

/**
 * Possible mode for a progress spinner.
 *
 * 进度圈的可能模式。
 *
 */
export type ProgressSpinnerMode = 'determinate' | 'indeterminate';

/**
 * Base reference size of the spinner.
 *
 * 进度圈的基本引用大小。
 *
 * @docs-private
 */
const BASE_SIZE = 100;

/**
 * Base reference stroke width of the spinner.
 *
 * 进度圈的基本引用线宽。
 *
 * @docs-private
 */
const BASE_STROKE_WIDTH = 10;

// Boilerplate for applying mixins to MatProgressSpinner.
/** @docs-private */
const _MatProgressSpinnerBase = mixinColor(
  class {
    constructor(public _elementRef: ElementRef) {}
  },
  'primary',
);

/**
 * Default `mat-progress-spinner` options that can be overridden.
 *
 * 默认的 `mat-progress-spinner` 选项，可以改写它们。
 *
 */
export interface MatProgressSpinnerDefaultOptions {
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

// .0001 percentage difference is necessary in order to avoid unwanted animation frames
// for example because the animation duration is 4 seconds, .1% accounts to 4ms
// which are enough to see the flicker described in
// https://github.com/angular/components/issues/8984
const INDETERMINATE_ANIMATION_TEMPLATE = `
 @keyframes mat-progress-spinner-stroke-rotate-DIAMETER {
    0%      { stroke-dashoffset: START_VALUE;  transform: rotate(0); }
    12.5%   { stroke-dashoffset: END_VALUE;    transform: rotate(0); }
    12.5001%  { stroke-dashoffset: END_VALUE;    transform: rotateX(180deg) rotate(72.5deg); }
    25%     { stroke-dashoffset: START_VALUE;  transform: rotateX(180deg) rotate(72.5deg); }

    25.0001%   { stroke-dashoffset: START_VALUE;  transform: rotate(270deg); }
    37.5%   { stroke-dashoffset: END_VALUE;    transform: rotate(270deg); }
    37.5001%  { stroke-dashoffset: END_VALUE;    transform: rotateX(180deg) rotate(161.5deg); }
    50%     { stroke-dashoffset: START_VALUE;  transform: rotateX(180deg) rotate(161.5deg); }

    50.0001%  { stroke-dashoffset: START_VALUE;  transform: rotate(180deg); }
    62.5%   { stroke-dashoffset: END_VALUE;    transform: rotate(180deg); }
    62.5001%  { stroke-dashoffset: END_VALUE;    transform: rotateX(180deg) rotate(251.5deg); }
    75%     { stroke-dashoffset: START_VALUE;  transform: rotateX(180deg) rotate(251.5deg); }

    75.0001%  { stroke-dashoffset: START_VALUE;  transform: rotate(90deg); }
    87.5%   { stroke-dashoffset: END_VALUE;    transform: rotate(90deg); }
    87.5001%  { stroke-dashoffset: END_VALUE;    transform: rotateX(180deg) rotate(341.5deg); }
    100%    { stroke-dashoffset: START_VALUE;  transform: rotateX(180deg) rotate(341.5deg); }
  }
`;

/**
 * `<mat-progress-spinner>` component.
 *
 * `<mat-progress-spinner>` 组件
 *
 */
@Component({
  selector: 'mat-progress-spinner',
  exportAs: 'matProgressSpinner',
  host: {
    'role': 'progressbar',
    'class': 'mat-progress-spinner',
    // set tab index to -1 so screen readers will read the aria-label
    // Note: there is a known issue with JAWS that does not read progressbar aria labels on FireFox
    'tabindex': '-1',
    '[class._mat-animation-noopable]': `_noopAnimations`,
    '[style.width.px]': 'diameter',
    '[style.height.px]': 'diameter',
    '[attr.aria-valuemin]': 'mode === "determinate" ? 0 : null',
    '[attr.aria-valuemax]': 'mode === "determinate" ? 100 : null',
    '[attr.aria-valuenow]': 'mode === "determinate" ? value : null',
    '[attr.mode]': 'mode',
  },
  inputs: ['color'],
  templateUrl: 'progress-spinner.html',
  styleUrls: ['progress-spinner.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class MatProgressSpinner extends _MatProgressSpinnerBase implements OnInit, CanColor {
  private _diameter = BASE_SIZE;
  private _value = 0;
  private _strokeWidth: number;

  /**
   * Element to which we should add the generated style tags for the indeterminate animation.
   * For most elements this is the document, but for the ones in the Shadow DOM we need to
   * use the shadow root.
   *
   * 要为未定动画添加生成的样式标签的元素。对于大多数元素来说，这是 document，但对于 Shadow DOM 中的那些，我们要使用 Shadow DOM 根。
   *
   */
  private _styleRoot: Node;

  /**
   * Tracks diameters of existing instances to de-dupe generated styles (default d = 100).
   * We need to keep track of which elements the diameters were attached to, because for
   * elements in the Shadow DOM the style tags are attached to the shadow root, rather
   * than the document head.
   *
   * 跟踪现有实例的直径，以便对生成的样式进行重复数据删除（默认 d = 100）。我们需要跟踪这个直径已附加到哪些元素，因为对于 Shadow DOM 中的元素，样式标签会附加到 Shadow DOM 根上，而不是 document 头中。
   *
   */
  private static _diameters = new WeakMap<Node, Set<number>>();

  /**
   * Whether the \_mat-animation-noopable class should be applied, disabling animations.
   *
   * 是否应该使用 \_mat-animation-noopable 类，以禁用动画。
   *
   */
  _noopAnimations: boolean;

  /**
   * A string that is used for setting the spinner animation-name CSS property
   *
   * 一个字符串，用于设置进度圈的 animation-name CSS 属性
   *
   */
  _spinnerAnimationLabel: string;

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
    this._spinnerAnimationLabel = this._getSpinnerAnimationLabel();

    // If this is set before `ngOnInit`, the style root may not have been resolved yet.
    if (this._styleRoot) {
      this._attachStyleNode();
    }
  }

  /**
   * Stroke width of the progress spinner.
   *
   * 进度圈的线宽。
   *
   */
  @Input()
  get strokeWidth(): number {
    return this._strokeWidth || this.diameter / 10;
  }
  set strokeWidth(value: NumberInput) {
    this._strokeWidth = coerceNumberProperty(value);
  }

  /**
   * Mode of the progress circle
   *
   * 进步圈的模式
   *
   */
  @Input() mode: ProgressSpinnerMode = 'determinate';

  /**
   * Value of the progress circle.
   *
   * 进度圈的值
   *
   */
  @Input()
  get value(): number {
    return this.mode === 'determinate' ? this._value : 0;
  }
  set value(newValue: NumberInput) {
    this._value = Math.max(0, Math.min(100, coerceNumberProperty(newValue)));
  }

  constructor(
    elementRef: ElementRef<HTMLElement>,
    /**
     * @deprecated `_platform` parameter no longer being used.
     * @breaking-change 14.0.0
     */
    _platform: Platform,
    @Optional() @Inject(DOCUMENT) private _document: any,
    @Optional() @Inject(ANIMATION_MODULE_TYPE) animationMode: string,
    @Inject(MAT_PROGRESS_SPINNER_DEFAULT_OPTIONS)
    defaults?: MatProgressSpinnerDefaultOptions,
  ) {
    super(elementRef);

    const trackedDiameters = MatProgressSpinner._diameters;
    this._spinnerAnimationLabel = this._getSpinnerAnimationLabel();

    // The base size is already inserted via the component's structural styles. We still
    // need to track it so we don't end up adding the same styles again.
    if (!trackedDiameters.has(_document.head)) {
      trackedDiameters.set(_document.head, new Set<number>([BASE_SIZE]));
    }

    this._noopAnimations =
      animationMode === 'NoopAnimations' && !!defaults && !defaults._forceAnimations;

    if (defaults) {
      if (defaults.diameter) {
        this.diameter = defaults.diameter;
      }

      if (defaults.strokeWidth) {
        this.strokeWidth = defaults.strokeWidth;
      }
    }
  }

  ngOnInit() {
    const element = this._elementRef.nativeElement;

    // Note that we need to look up the root node in ngOnInit, rather than the constructor, because
    // Angular seems to create the element outside the shadow root and then moves it inside, if the
    // node is inside an `ngIf` and a ShadowDom-encapsulated component.
    this._styleRoot = _getShadowRoot(element) || this._document.head;
    this._attachStyleNode();
    element.classList.add('mat-progress-spinner-indeterminate-animation');
  }

  /**
   * The radius of the spinner, adjusted for stroke width.
   *
   * 进度圈的半径，根据线宽调整。
   *
   */
  _getCircleRadius() {
    return (this.diameter - BASE_STROKE_WIDTH) / 2;
  }

  /**
   * The view box of the spinner's svg element.
   *
   * 进度圈 svg 元素的 viewBox。
   *
   */
  _getViewBox() {
    const viewBox = this._getCircleRadius() * 2 + this.strokeWidth;
    return `0 0 ${viewBox} ${viewBox}`;
  }

  /**
   * The stroke circumference of the svg circle.
   *
   * svg circle 的笔画周长。
   *
   */
  _getStrokeCircumference(): number {
    return 2 * Math.PI * this._getCircleRadius();
  }

  /**
   * The dash offset of the svg circle.
   *
   * svg circle 的短划线偏移量。
   *
   */
  _getStrokeDashOffset() {
    if (this.mode === 'determinate') {
      return (this._getStrokeCircumference() * (100 - this._value)) / 100;
    }

    return null;
  }

  /**
   * Stroke width of the circle in percent.
   *
   * 圆的线宽，以百分比表示。
   *
   */
  _getCircleStrokeWidth() {
    return (this.strokeWidth / this.diameter) * 100;
  }

  /**
   * Dynamically generates a style tag containing the correct animation for this diameter.
   *
   * 动态生成一个样式标签，里面包含这个直径的正确动画。
   *
   */
  private _attachStyleNode(): void {
    const styleRoot = this._styleRoot;
    const currentDiameter = this._diameter;
    const diameters = MatProgressSpinner._diameters;
    let diametersForElement = diameters.get(styleRoot);

    if (!diametersForElement || !diametersForElement.has(currentDiameter)) {
      const styleTag: HTMLStyleElement = this._document.createElement('style');
      styleTag.setAttribute('mat-spinner-animation', this._spinnerAnimationLabel);
      styleTag.textContent = this._getAnimationText();
      styleRoot.appendChild(styleTag);

      if (!diametersForElement) {
        diametersForElement = new Set<number>();
        diameters.set(styleRoot, diametersForElement);
      }

      diametersForElement.add(currentDiameter);
    }
  }

  /**
   * Generates animation styles adjusted for the spinner's diameter.
   *
   * 根据进度圈的直径生成动画样式。
   *
   */
  private _getAnimationText(): string {
    const strokeCircumference = this._getStrokeCircumference();
    return (
      INDETERMINATE_ANIMATION_TEMPLATE
        // Animation should begin at 5% and end at 80%
        .replace(/START_VALUE/g, `${0.95 * strokeCircumference}`)
        .replace(/END_VALUE/g, `${0.2 * strokeCircumference}`)
        .replace(/DIAMETER/g, `${this._spinnerAnimationLabel}`)
    );
  }

  /**
   * Returns the circle diameter formatted for use with the animation-name CSS property.
   *
   * 返回格式化过的圆直径，以便与 animation-name CSS 属性一起使用。
   *
   */
  private _getSpinnerAnimationLabel(): string {
    // The string of a float point number will include a period ‘.’ character,
    // which is not valid for a CSS animation-name.
    return this.diameter.toString().replace('.', '_');
  }
}

/**
 * `<mat-spinner>` component.
 *
 * `<mat-spinner>` 组件
 *
 * This is a component definition to be used as a convenience reference to create an
 * indeterminate `<mat-progress-spinner>` instance.
 *
 * 这是一个组件定义，可以作为方便的引用它来创建一个未定 `<mat-progress-spinner>` 的实例。
 *
 */
@Component({
  selector: 'mat-spinner',
  host: {
    'role': 'progressbar',
    'mode': 'indeterminate',
    'class': 'mat-spinner mat-progress-spinner',
    '[class._mat-animation-noopable]': `_noopAnimations`,
    '[style.width.px]': 'diameter',
    '[style.height.px]': 'diameter',
  },
  inputs: ['color'],
  templateUrl: 'progress-spinner.html',
  styleUrls: ['progress-spinner.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class MatSpinner extends MatProgressSpinner {
  constructor(
    elementRef: ElementRef<HTMLElement>,
    platform: Platform,
    @Optional() @Inject(DOCUMENT) document: any,
    @Optional() @Inject(ANIMATION_MODULE_TYPE) animationMode: string,
    @Inject(MAT_PROGRESS_SPINNER_DEFAULT_OPTIONS)
    defaults?: MatProgressSpinnerDefaultOptions,
  ) {
    super(elementRef, platform, document, animationMode, defaults);
    this.mode = 'indeterminate';
  }
}
