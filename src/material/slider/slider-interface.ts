/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {InjectionToken, ChangeDetectorRef} from '@angular/core';
import {MatRipple, RippleGlobalOptions} from '@angular/material/core';

/**
 * Thumb types: range slider has two thumbs (START, END) whereas single point
 * slider only has one thumb (END).
 *
 * 滑杆类型：范围滑杆有两个滑块（START、END），而单点滑杆只有一个滑块（END）。
 *
 */
export const enum _MatThumb {
  START = 1,
  END = 2,
}

/**
 * Tick mark enum, for discrete sliders.
 *
 * 刻度标记枚举，用于离散滑杆。
 *
 */
export const enum _MatTickMark {
  ACTIVE = 0,
  INACTIVE = 1,
}

/**
 * Injection token that can be used for a `MatSlider` to provide itself as a
 * parent to the `MatSliderThumb` and `MatSliderRangeThumb`.
 * Used primarily to avoid circular imports.
 *
 * 可用于 `MatSlider` 的注入令牌将自身作为 `MatSlider 滑块 ` 和 `MatSliderRange 滑块 ` 的父级提供。主要用于避免循环导入。
 *
 * @docs-private
 */
export const MAT_SLIDER = new InjectionToken<{}>('_MatSlider');

/**
 * Injection token that can be used to query for a `MatSliderThumb`.
 * Used primarily to avoid circular imports.
 *
 * 可用于查询 `MatSlider 滑块 ` 的注入令牌。主要用于避免循环导入。
 *
 * @docs-private
 */
export const MAT_SLIDER_THUMB = new InjectionToken<{}>('_MatSliderThumb');

/**
 * Injection token that can be used to query for a `MatSliderRangeThumb`.
 * Used primarily to avoid circular imports.
 *
 * 可用于查询 `MatSliderRange 滑块 ` 的注入令牌。主要用于避免循环导入。
 *
 * @docs-private
 */
export const MAT_SLIDER_RANGE_THUMB = new InjectionToken<{}>('_MatSliderRangeThumb');

/**
 * Injection token that can be used to query for a `MatSliderVisualThumb`.
 * Used primarily to avoid circular imports.
 *
 * 可用于查询 `MatSliderVisual 滑块 ` 的注入令牌。主要用于避免循环导入。
 *
 * @docs-private
 */
export const MAT_SLIDER_VISUAL_THUMB = new InjectionToken<{}>('_MatSliderVisualThumb');

/**
 * Represents a drag event emitted by the MatSlider component.
 *
 * 表示由 MatSlider 组件发出的拖动事件。
 *
 */
export interface MatSliderDragEvent {
  /**
   * The MatSliderThumb that was interacted with.
   *
   * 与之交互过的 MatSlider 滑块。
   *
   */
  source: _MatSliderThumb;

  /**
   * The MatSlider that was interacted with.
   *
   * 与之交互过的 MatSlider。
   *
   */
  parent: _MatSlider;

  /**
   * The current value of the slider.
   *
   * 此滑杆的当前值。
   *
   */
  value: number;
}

/**
 * A simple change event emitted by the MatSlider component.
 *
 * MatSlider 组件发出的一个简单的 change 事件。
 *
 * @deprecated
 *
 * Use event bindings directly on the MatSliderThumbs for `change` and `input` events. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
export class MatSliderChange {
  /**
   * The MatSliderThumb that was interacted with.
   *
   * 与之交互过的 MatSlider 滑块。
   *
   */
  source: _MatSliderThumb;

  /**
   * The MatSlider that was interacted with.
   *
   * 与之交互过的 MatSlider。
   *
   */
  parent: _MatSlider;

  /**
   * The new value of the source slider.
   *
   * 源滑杆的新值。
   *
   */
  value: number;
}

export interface _MatSlider {
  /** Whether the given pointer event occurred within the bounds of the slider pointer's DOM Rect. */
  _isCursorOnSliderThumb(event: PointerEvent, rect: DOMRect): boolean;

  /** Gets the slider thumb input of the given thumb position. */
  _getInput(thumbPosition: _MatThumb): _MatSliderThumb | _MatSliderRangeThumb | undefined;

  /**
   * Gets the slider thumb HTML input element of the given thumb position.
   *
   * 获取给定滑块位置的滑杆滑块 HTML 输入元素。
   *
   */
  _getThumb(thumbPosition: _MatThumb): _MatSliderVisualThumb;

  /**
   * The minimum value that the slider can have.
   *
   * 滑杆所具有的最小值。
   *
   */
  min: number;

  /**
   * The maximum value that the slider can have.
   *
   * 滑杆所具有的最大值。
   *
   */
  max: number;

  /**
   * The amount that slider values can increment or decrement by.
   *
   * 滑杆值可以递增或递减的量。
   *
   */
  step: number;

  /**
   * Whether the slider is disabled.
   *
   * 此滑块是否已禁用。
   *
   */
  disabled: boolean;

  /**
   * Whether the slider is a range slider.
   *
   * 此滑杆是否为范围滑杆。
   *
   */
  _isRange: boolean;

  /**
   * Whether the slider is rtl.
   *
   * 此滑杆是否为右到左（RTL）的。
   *
   */
  _isRtl: boolean;

  /**
   * The stored width of the host element's bounding client rect.
   *
   * 宿主元素的边界客户端矩形的已存储宽度。
   *
   */
  _cachedWidth: number;

  /**
   * The stored width of the host element's bounding client rect.
   *
   * 宿主元素的边界客户端矩形的已存储宽度。
   *
   */
  _cachedLeft: number;

  /**
   * The padding of the native slider input. This is added in order to make the region where the
   * thumb ripple extends past the end of the slider track clickable.
   *
   * 原生滑杆输入的内衬距。这是为了使滑块涟漪延伸超过滑杆轨道末端的区域可点击。
   *
   */
  _inputPadding: number;

  /**
   * The offset represents left most translateX of the slider knob. Inversely,
   * (slider width - offset) = the right most translateX of the slider knob.
   *
   * 偏移量表示滑杆旋钮最左边的 translateX。相对的，（滑杆宽度 - 偏移量）= 滑杆旋钮最右边的 translateX。
   *
   * Note:
   *
   * 注意：
   *
   * - The native slider knob differs from the visual slider. It's knob cannot slide past
   *   the end of the track AT ALL.
   *
   *   原生滑杆旋钮不同于可视滑杆。它的旋钮根本不能滑过轨道的末端。
   *
   * - The visual slider knob CAN slide past the end of the track slightly. It's knob can slide
   *   past the end of the track such that it's center lines up with the end of the track.
   *
   *   此可视滑杆旋钮可以稍微滑过轨道的末端。它的旋钮可以滑过轨道的末端，使其中心与轨道的末端对齐。
   *
   */
  _inputOffset: number;

  /**
   * The radius of the visual slider's ripple.
   *
   * 此可视滑杆涟漪的半径。
   *
   */
  _rippleRadius: number;

  /**
   * The global configuration for `matRipple` instances.
   *
   * `matRipple` 实例的全局配置。
   *
   */
  readonly _globalRippleOptions?: RippleGlobalOptions;

  /**
   * Whether animations have been disabled.
   *
   * 动画是否已被禁用。
   *
   */
  _noopAnimations: boolean;

  /**
   * Whether or not the slider should use animations.
   *
   * 此滑杆是否应该使用动画。
   *
   */
  _hasAnimation: boolean;

  /**
   * Triggers UI updates that are needed after a slider input value has changed.
   *
   * 在滑杆输入值更改后触发所需的 UI 更新。
   *
   */
  _onValueChange: (source: _MatSliderThumb) => void;

  /**
   * Triggers UI updates that are needed after the slider thumb position has changed.
   *
   * 在滑杆滑块位置更改后触发所需的 UI 更新。
   *
   */
  _onTranslateXChange: (source: _MatSliderThumb) => void;

  /**
   * Updates the stored slider dimensions using the current bounding client rect.
   *
   * 使用当前的边界客户端矩形更新存储的滑杆尺寸。
   *
   */
  _updateDimensions: () => void;

  /**
   * Used to set the transition duration for thumb and track animations.
   *
   * 用于设置滑块和轨道动画的过渡持续时间。
   *
   */
  _setTransition: (withAnimation: boolean) => void;

  _cdr: ChangeDetectorRef;
}

export interface _MatSliderThumb {
  /**
   * The minimum value that the slider can have.
   *
   * 滑杆所具有的最小值。
   *
   */
  min: number;

  /**
   * The maximum value that the slider can have.
   *
   * 滑杆所具有的最大值。
   *
   */
  max: number;

  /**
   * The amount that slider values can increment or decrement by.
   *
   * 滑杆值可以递增或递减的量。
   *
   */
  step: number;

  /**
   * The current value of this slider input.
   *
   * 此滑杆输入的当前值。
   *
   */
  value: number;

  /**
   * The current translateX in px of the slider visual thumb.
   *
   * 此滑杆的可见滑块的当前 translateX（以 px 为单位）。
   *
   */
  translateX: number;

  /**
   * Indicates whether this thumb is the start or end thumb.
   *
   * 指示此滑块是开始滑块还是结束滑块。
   *
   */
  thumbPosition: _MatThumb;

  /**
   * Similar to percentage but calcualted using translateX relative to the total track width.
   *
   * 类似于百分比，但使用相对于总轨道宽度的 translateX 进行计算。
   *
   */
  fillPercentage: number;

  /**
   * Whether the slider is disabled.
   *
   * 此滑块是否已禁用。
   *
   */
  disabled: boolean;

  /**
   * The host native HTML input element.
   *
   * 宿主原生 HTML 输入元素。
   *
   */
  _hostElement: HTMLInputElement;

  /**
   * Whether the input is currently focused (either by tab or after clicking).
   *
   * 此输入框当前是否拥有焦点（通过 tab 或单击后）。
   *
   */
  _isFocused: boolean;

  /**
   * The aria-valuetext string representation of the input's value.
   *
   * 输入值的 aria-valuetext 字符串表示。
   *
   */
  _valuetext: string;

  /**
   * Indicates whether UI updates should be skipped.
   *
   * 指示是否应跳过 UI 更新。
   *
   * This flag is used to avoid flickering
   * when correcting values on pointer up/down.
   *
   * 此标志用于避免在向上/向下指针上更正值时出现闪烁。
   *
   */
  _skipUIUpdate: boolean;

  /**
   * Handles the initialization of properties for the slider input.
   *
   * 处理此滑杆输入的属性初始化。
   *
   */
  initProps: () => void;

  /**
   * Handles UI initialization controlled by this slider input.
   *
   * 处理由此滑杆输入控制的 UI 初始化。
   *
   */
  initUI: () => void;

  /**
   * Calculates the visual thumb's translateX based on the slider input's current value.
   *
   * 根据此滑杆输入的当前值计算可视滑杆的 translateX。
   *
   */
  _calcTranslateXByValue: () => number;

  /**
   * Updates the visual thumb based on the slider input's current value.
   *
   * 根据此滑杆输入的当前值更新可视缩略图。
   *
   */
  _updateThumbUIByValue: () => void;

  /**
   * Sets the slider input to disproportionate dimensions to allow for touch
   * events to be captured on touch devices.
   *
   * 将此滑杆输入组件设置为不成比例的尺寸，以允许在触摸设备上捕获触控事件。
   *
   */
  _updateWidthInactive: () => void;

  /**
   * Used to set the slider width to the correct
   * dimensions while the user is dragging.
   *
   * 用于在用户拖动时将滑杆宽度设置为正确的尺寸。
   *
   */
  _updateWidthActive: () => void;
}

export interface _MatSliderRangeThumb extends _MatSliderThumb {
  /**
   * Whether this slider corresponds to the input on the left hand side.
   *
   * 此滑杆是否对应于左侧的输入。
   *
   */
  _isLeftThumb: boolean;

  /**
   * Gets the sibling MatSliderRangeThumb.
   * Returns undefined if it is too early in Angular's life cycle.
   *
   * 获取兄弟 MatSliderRange 滑块。如果这操作在 Angular 的生命周期中还为时过早，则返回 undefined。
   *
   */
  getSibling: () => _MatSliderRangeThumb | undefined;

  /**
   * Used to cache whether this slider input corresponds to the visual left thumb.
   *
   * 用于缓存此滑杆输入是否对应于可视左滑块。
   *
   */
  _setIsLeftThumb: () => void;

  /**
   * Updates the input styles to control whether it is pinned to the start or end of the mat-slider.
   *
   * 更新输入样式以控制它是固定到 mat-slider 的开头还是结尾。
   *
   */
  _updateStaticStyles: () => void;

  /**
   * Updates the min and max properties of this slider input according to it's sibling.
   *
   * 根据其兄弟更新此滑杆输入的 min 和 max 属性。
   *
   */
  _updateMinMax: () => void;
}

export interface _MatSliderVisualThumb {
  /**
   * The MatRipple for this slider thumb.
   *
   * 此滑杆的滑块的 MatRipple。
   *
   */
  _ripple: MatRipple;

  /**
   * Whether the slider thumb is currently being pressed.
   *
   * 当前是否按下此滑杆的滑块。
   *
   */
  _isActive: boolean;

  /**
   * The host native HTML input element.
   *
   * 宿主原生 HTML 输入元素。
   *
   */
  _hostElement: HTMLElement;

  /**
   * Shows the value indicator ui.
   *
   * 显示值指示器 ui。
   *
   */
  _showValueIndicator: () => void;

  /**
   * Hides the value indicator ui.
   *
   * 隐藏值指示器 ui。
   *
   */
  _hideValueIndicator: () => void;

  /**
   * Whether the slider visual thumb is currently showing any ripple.
   *
   * 此滑杆的可视滑块当前是否显示任何涟漪。
   *
   */
  _isShowingAnyRipple: () => boolean;
}
