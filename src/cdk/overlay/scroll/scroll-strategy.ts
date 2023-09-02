/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import type {OverlayRef} from '../overlay-ref';

/**
 * Describes a strategy that will be used by an overlay to handle scroll events while it is open.
 *
 * 描述一种策略，浮层在打开时将用它处理滚动事件。
 *
 */
export interface ScrollStrategy {
  /**
   * Enable this scroll strategy \(called when the attached overlay is attached to a portal\).
   *
   * 启用此滚动策略（将已附加的浮层附加到传送点 Portal 时调用）。
   *
   */
  enable: () => void;

  /**
   * Disable this scroll strategy \(called when the attached overlay is detached from a portal\).
   *
   * 禁用此滚动策略（当已附加的浮层从传送点 Portal 拆除时调用）。
   *
   */
  disable: () => void;

  /**
   * Attaches this `ScrollStrategy` to an overlay.
   *
   * 将此 `ScrollStrategy` 附加到浮层。
   *
   */
  attach: (overlayRef: OverlayRef) => void;

  /**
   * Detaches the scroll strategy from the current overlay.
   *
   * 从当前浮层拆除滚动策略。
   *
   */
  detach?: () => void;
}

/**
 * Returns an error to be thrown when attempting to attach an already-attached scroll strategy.
 *
 * 返回一个错误，它将在尝试附加到已附加的滚动策略时引发。
 *
 */
export function getMatScrollStrategyAlreadyAttachedError(): Error {
  return Error(`Scroll strategy has already been attached.`);
}
