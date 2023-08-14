/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Platform} from '@angular/cdk/platform';
import {
  Directive,
  ElementRef,
  Inject,
  InjectionToken,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Optional,
} from '@angular/core';
import {RippleAnimationConfig, RippleConfig, RippleRef} from './ripple-ref';
import {RippleRenderer, RippleTarget} from './ripple-renderer';
import {ANIMATION_MODULE_TYPE} from '@angular/platform-browser/animations';

/**
 * Configurable options for `matRipple`.
 *
 * `matRipple` 的可配置选项。
 *
 */
export interface RippleGlobalOptions {
  /**
   * Whether ripples should be disabled. Ripples can be still launched manually by using
   * the `launch()` method. Therefore focus indicators will still show up.
   *
   * 是否应禁用涟漪。仍然可以使用 `launch()` 方法手动启动涟漪。因此，焦点指示器仍会出现。
   *
   */
  disabled?: boolean;

  /**
   * Default configuration for the animation duration of the ripples. There are two phases with
   * different durations for the ripples: `enter` and `leave`. The durations will be overwritten
   * by the value of `matRippleAnimation` or if the `NoopAnimationsModule` is included.
   *
   * 涟漪的动画持续时间的配置。其两个阶段具有不同的涟漪持续时间。如果使用 `NoopAnimationsModule` 则动画持续时间将被覆盖。
   *
   */
  animation?: RippleAnimationConfig;

  /**
   * Whether ripples should start fading out immediately after the mouse or touch is released. By
   * default, ripples will wait for the enter animation to complete and for mouse or touch release.
   *
   * 释放鼠标或触摸后，涟漪是否应立即开始逐渐消失。默认情况下，涟漪将等待输入动画完成以及鼠标或触摸释放。
   *
   */
  terminateOnPointerUp?: boolean;
}

/**
 * Injection token that can be used to specify the global ripple options.
 *
 * 可以用于指定全局涟漪选项的注入令牌。
 *
 */
export const MAT_RIPPLE_GLOBAL_OPTIONS = new InjectionToken<RippleGlobalOptions>(
  'mat-ripple-global-options',
);

@Directive({
  selector: '[mat-ripple], [matRipple]',
  exportAs: 'matRipple',
  host: {
    'class': 'mat-ripple',
    '[class.mat-ripple-unbounded]': 'unbounded',
  },
})
export class MatRipple implements OnInit, OnDestroy, RippleTarget {
  /**
   * Custom color for all ripples.
   *
   * 所有涟漪的自定义颜色。
   *
   */
  @Input('matRippleColor') color: string;

  /**
   * Whether the ripples should be visible outside the component's bounds.
   *
   * 涟漪是否应在组件范围之外可见。
   *
   */
  @Input('matRippleUnbounded') unbounded: boolean;

  /**
   * Whether the ripple always originates from the center of the host element's bounds, rather
   * than originating from the location of the click event.
   *
   * 涟漪是否总是起源于宿主元素边界的中心，而不是起源于 click 事件的位置。
   *
   */
  @Input('matRippleCentered') centered: boolean;

  /**
   * If set, the radius in pixels of foreground ripples when fully expanded. If unset, the radius
   * will be the distance from the center of the ripple to the furthest corner of the host element's
   * bounding rectangle.
   *
   * 如果设置，则为完全扩展时前景涟漪的半径（以像素为单位）。如果未设置，则半径将是从涟漪中心到宿主元素边界矩形的最远角的距离。
   *
   */
  @Input('matRippleRadius') radius: number = 0;

  /**
   * Configuration for the ripple animation. Allows modifying the enter and exit animation
   * duration of the ripples. The animation durations will be overwritten if the
   * `NoopAnimationsModule` is being used.
   *
   * 涟漪动画的配置。允许修改涟漪的进入和退出动画持续时间。如果使用 `NoopAnimationsModule` 则动画持续时间将被覆盖。
   *
   */
  @Input('matRippleAnimation') animation: RippleAnimationConfig;

  /**
   * Whether click events will not trigger the ripple. Ripples can be still launched manually
   * by using the `launch()` method.
   *
   * 点击事件是否不会触发涟漪。仍然可以使用 `launch()` 方法手动启动涟漪。
   *
   */
  @Input('matRippleDisabled')
  get disabled() {
    return this._disabled;
  }
  set disabled(value: boolean) {
    if (value) {
      this.fadeOutAllNonPersistent();
    }
    this._disabled = value;
    this._setupTriggerEventsIfEnabled();
  }
  private _disabled: boolean = false;

  /**
   * The element that triggers the ripple when click events are received.
   * Defaults to the directive's host element.
   *
   * 收到点击事件时触发涟漪的元素。默认为指令的宿主元素。
   *
   */
  @Input('matRippleTrigger')
  get trigger() {
    return this._trigger || this._elementRef.nativeElement;
  }
  set trigger(trigger: HTMLElement) {
    this._trigger = trigger;
    this._setupTriggerEventsIfEnabled();
  }
  private _trigger: HTMLElement;

  /**
   * Renderer for the ripple DOM manipulations.
   *
   * 涟漪 DOM 操作的渲染器。
   *
   */
  private _rippleRenderer: RippleRenderer;

  /**
   * Options that are set globally for all ripples.
   *
   * 为所有涟漪设置的全局选项。
   *
   */
  private _globalOptions: RippleGlobalOptions;

  /** @docs-private Whether ripple directive is initialized and the input bindings are set. */
  _isInitialized: boolean = false;

  constructor(
    private _elementRef: ElementRef<HTMLElement>,
    ngZone: NgZone,
    platform: Platform,
    @Optional() @Inject(MAT_RIPPLE_GLOBAL_OPTIONS) globalOptions?: RippleGlobalOptions,
    @Optional() @Inject(ANIMATION_MODULE_TYPE) private _animationMode?: string,
  ) {
    this._globalOptions = globalOptions || {};
    this._rippleRenderer = new RippleRenderer(this, ngZone, _elementRef, platform);
  }

  ngOnInit() {
    this._isInitialized = true;
    this._setupTriggerEventsIfEnabled();
  }

  ngOnDestroy() {
    this._rippleRenderer._removeTriggerEvents();
  }

  /**
   * Fades out all currently showing ripple elements.
   *
   * 淡出当前显示的涟漪元素的所有元素。
   *
   */
  fadeOutAll() {
    this._rippleRenderer.fadeOutAll();
  }

  /**
   * Fades out all currently showing non-persistent ripple elements.
   *
   * 淡出当前显示的所有非持续性涟漪元素。
   *
   */
  fadeOutAllNonPersistent() {
    this._rippleRenderer.fadeOutAllNonPersistent();
  }

  /**
   * Ripple configuration from the directive's input values.
   *
   * 根据指令的输入值进行涟漪配置。
   *
   * @docs-private Implemented as part of RippleTarget
   */
  get rippleConfig(): RippleConfig {
    return {
      centered: this.centered,
      radius: this.radius,
      color: this.color,
      animation: {
        ...this._globalOptions.animation,
        ...(this._animationMode === 'NoopAnimations' ? {enterDuration: 0, exitDuration: 0} : {}),
        ...this.animation,
      },
      terminateOnPointerUp: this._globalOptions.terminateOnPointerUp,
    };
  }

  /**
   * Whether ripples on pointer-down are disabled or not.
   *
   * 指针向下涟漪是否已禁用。
   *
   * @docs-private Implemented as part of RippleTarget
   */
  get rippleDisabled(): boolean {
    return this.disabled || !!this._globalOptions.disabled;
  }

  /**
   * Sets up the trigger event listeners if ripples are enabled.
   *
   * 如果启用了涟漪，则设置触发事件侦听器。
   *
   */
  private _setupTriggerEventsIfEnabled() {
    if (!this.disabled && this._isInitialized) {
      this._rippleRenderer.setupTriggerEvents(this.trigger);
    }
  }

  /**
   * Launches a manual ripple using the specified ripple configuration.
   *
   * 使用指定的涟漪配置启动手动涟漪。
   *
   * @param config Configuration for the manual ripple.
   *
   * 手动涟漪的配置。
   *
   */
  launch(config: RippleConfig): RippleRef;

  /**
   * Launches a manual ripple at the specified coordinates relative to the viewport.
   *
   * 在相对于视口的指定坐标处手动启动涟漪。
   *
   * @param x Coordinate along the X axis at which to fade-in the ripple. Coordinate
   *   should be relative to the viewport.
   *
   * 涟漪淡入时沿 X 轴的坐标。此坐标相对于视口。
   *
   * @param y Coordinate along the Y axis at which to fade-in the ripple. Coordinate
   *   should be relative to the viewport.
   *
   * 涟漪淡入时沿 Y 轴的坐标。此坐标相对于视口。
   *
   * @param config Optional ripple configuration for the manual ripple.
   *
   * 手动涟漪的可选涟漪配置。
   *
   */
  launch(x: number, y: number, config?: RippleConfig): RippleRef;

  /**
   * Launches a manual ripple at the specified coordinated or just by the ripple config.
   *
   * 在指定的坐标位置或仅通过涟漪配置启动手动涟漪。
   *
   */
  launch(configOrX: number | RippleConfig, y: number = 0, config?: RippleConfig): RippleRef {
    if (typeof configOrX === 'number') {
      return this._rippleRenderer.fadeInRipple(configOrX, y, {...this.rippleConfig, ...config});
    } else {
      return this._rippleRenderer.fadeInRipple(0, 0, {...this.rippleConfig, ...configOrX});
    }
  }
}
