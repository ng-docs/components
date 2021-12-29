/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ScrollStrategy} from './scroll-strategy';

/**
 * Scroll strategy that doesn't do anything.
 *
 * 什么也不做的滚动策略。
 *
 */
export class NoopScrollStrategy implements ScrollStrategy {
  /**
   * Does nothing, as this scroll strategy is a no-op.
   *
   * 什么也不做，因为这个滚动策略就是如此。
   *
   */
  enable() {}
  /**
   * Does nothing, as this scroll strategy is a no-op.
   *
   * 什么也不做，因为这个滚动策略就是如此。
   *
   */
  disable() {}
  /**
   * Does nothing, as this scroll strategy is a no-op.
   *
   * 什么也不做，因为这个滚动策略就是如此。
   *
   */
  attach() {}
}
