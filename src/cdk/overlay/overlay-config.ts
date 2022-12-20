/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {PositionStrategy} from './position/position-strategy';
import {Direction, Directionality} from '@angular/cdk/bidi';
import {ScrollStrategy, NoopScrollStrategy} from './scroll/index';

/**
 * Initial configuration used when creating an overlay.
 *
 * 创建浮层时使用的初始配置。
 *
 */
export class OverlayConfig {
  /**
   * Strategy with which to position the overlay.
   *
   * 用于定位浮层的策略。
   *
   */
  positionStrategy?: PositionStrategy;

  /**
   * Strategy to be used when handling scroll events while the overlay is open.
   *
   * 在浮层完成时，处理 scroll 事件时要使用的策略。
   *
   */
  scrollStrategy?: ScrollStrategy = new NoopScrollStrategy();

  /**
   * Custom class to add to the overlay pane.
   *
   * 要添加到浮层面板的自定义类。
   *
   */
  panelClass?: string | string[] = '';

  /**
   * Whether the overlay has a backdrop.
   *
   * 浮层是否有背景板。
   *
   */
  hasBackdrop?: boolean = false;

  /**
   * Custom class to add to the backdrop
   *
   * 要添加到背景板的自定义类
   *
   */
  backdropClass?: string | string[] = 'cdk-overlay-dark-backdrop';

  /**
   * The width of the overlay panel. If a number is provided, pixel units are assumed.
   *
   * 浮层面板的宽度。如果提供了数字，则假定单位是像素。
   *
   */
  width?: number | string;

  /**
   * The height of the overlay panel. If a number is provided, pixel units are assumed.
   *
   * 浮层面板的高度。如果提供了数字，则假定单位是像素。
   *
   */
  height?: number | string;

  /**
   * The min-width of the overlay panel. If a number is provided, pixel units are assumed.
   *
   * 浮层面板的最小宽度。如果提供了数字，则假定单位是像素。
   *
   */
  minWidth?: number | string;

  /**
   * The min-height of the overlay panel. If a number is provided, pixel units are assumed.
   *
   * 浮层面板的最小高度。如果提供了数字，则假定单位是像素。
   *
   */
  minHeight?: number | string;

  /**
   * The max-width of the overlay panel. If a number is provided, pixel units are assumed.
   *
   * 浮层面板的最大宽度。如果提供了数字，则假定单位是像素。
   *
   */
  maxWidth?: number | string;

  /**
   * The max-height of the overlay panel. If a number is provided, pixel units are assumed.
   *
   * 浮层面板的最大高度。如果提供了数字，则假定单位是像素。
   *
   */
  maxHeight?: number | string;

  /**
   * Direction of the text in the overlay panel. If a `Directionality` instance
   * is passed in, the overlay will handle changes to its value automatically.
   *
   * 浮层面板中文本的方向。如果 `Directionality` 实例，该浮层也会自动处理对其值的更改。
   *
   */
  direction?: Direction | Directionality;

  /**
   * Whether the overlay should be disposed of when the user goes backwards/forwards in history.
   * Note that this usually doesn't include clicking on links (unless the user is using
   * the `HashLocationStrategy`).
   *
   * 当用户在历史记录中往后退时，是否应该处理浮层。请注意，这通常不包括单击链接（除非用户正在使用 `HashLocationStrategy` ）。
   *
   */
  disposeOnNavigation?: boolean = false;

  constructor(config?: OverlayConfig) {
    if (config) {
      // Use `Iterable` instead of `Array` because TypeScript, as of 3.6.3,
      // loses the array generic type in the `for of`. But we *also* have to use `Array` because
      // typescript won't iterate over an `Iterable` unless you compile with `--downlevelIteration`
      const configKeys = Object.keys(config) as Iterable<keyof OverlayConfig> &
        (keyof OverlayConfig)[];
      for (const key of configKeys) {
        if (config[key] !== undefined) {
          // TypeScript, as of version 3.5, sees the left-hand-side of this expression
          // as "I don't know *which* key this is, so the only valid value is the intersection
          // of all the possible values." In this case, that happens to be `undefined`. TypeScript
          // is not smart enough to see that the right-hand-side is actually an access of the same
          // exact type with the same exact key, meaning that the value type must be identical.
          // So we use `any` to work around this.
          this[key] = config[key] as any;
        }
      }
    }
  }
}
