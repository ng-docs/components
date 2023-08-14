/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import type {OverlayRef} from '../overlay-ref';

/**
 * Strategy for setting the position on an overlay.
 *
 * 在浮层上设置位置的策略。
 *
 */
export interface PositionStrategy {
  /**
   * Attaches this position strategy to an overlay.
   *
   * 将此定位策略附加到浮层。
   *
   */
  attach(overlayRef: OverlayRef): void;

  /**
   * Updates the position of the overlay element.
   *
   * 更新浮层元素的位置。
   *
   */
  apply(): void;

  /**
   * Called when the overlay is detached.
   *
   * 拆除浮层时调用。
   *
   */
  detach?(): void;

  /**
   * Cleans up any DOM modifications made by the position strategy, if necessary.
   *
   * 如有必要，清除定位策略进行的所有 DOM 修改。
   *
   */
  dispose(): void;
}
