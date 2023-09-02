/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

/**
 * Possible states for a ripple element.
 *
 * 涟漪元素的可能状态。
 *
 */
export const enum RippleState {
  FADING_IN,
  VISIBLE,
  FADING_OUT,
  HIDDEN,
}

export type RippleConfig = {
  color?: string;
  centered?: boolean;
  radius?: number;
  persistent?: boolean;
  animation?: RippleAnimationConfig;
  terminateOnPointerUp?: boolean;
};

/**
 * Interface that describes the configuration for the animation of a ripple.
 * There are two animation phases with different durations for the ripples.
 *
 * 描述涟漪动画配置的接口。有两个动画阶段，其涟漪的持续时间也不同。
 *
 */
export interface RippleAnimationConfig {
  /**
   * Duration in milliseconds for the enter animation \(expansion from point of contact\).
   *
   * 进场动画的持续时间（以毫秒为单位）（从接触点开始扩展）。
   *
   */
  enterDuration?: number;
  /**
   * Duration in milliseconds for the exit animation \(fade-out\).
   *
   * 离场动画（淡出）的持续时间（以毫秒为单位）。
   *
   */
  exitDuration?: number;
}

/**
 * Reference to a previously launched ripple element.
 *
 * 对先前启动的涟漪元素的引用。
 *
 */
export class RippleRef {
  /**
   * Current state of the ripple.
   *
   * 涟漪的当前状态。
   *
   */
  state: RippleState = RippleState.HIDDEN;

  constructor(
    private _renderer: {fadeOutRipple(ref: RippleRef): void},
    /** Reference to the ripple HTML element. */
    public element: HTMLElement,
    /** Ripple configuration used for the ripple. */
    public config: RippleConfig,
    /* Whether animations are forcibly disabled for ripples through CSS. */
    public _animationForciblyDisabledThroughCss = false,
  ) {}

  /**
   * Fades out the ripple element.
   *
   * 淡出涟漪元素。
   *
   */
  fadeOut() {
    this._renderer.fadeOutRipple(this);
  }
}
