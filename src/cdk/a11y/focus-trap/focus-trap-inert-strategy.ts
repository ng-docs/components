/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {InjectionToken} from '@angular/core';
import {FocusTrap} from './focus-trap';

/**
 * The injection token used to specify the inert strategy.
 *
 * 用于指定惰性策略的注入令牌。
 *
 */
export const FOCUS_TRAP_INERT_STRATEGY = new InjectionToken<FocusTrapInertStrategy>(
  'FOCUS_TRAP_INERT_STRATEGY',
);

/**
 * A strategy that dictates how FocusTrap should prevent elements
 * outside of the FocusTrap from being focused.
 *
 * 一种策略，指示 FocusTrap 应如何防止 FocusTrap 外部的元素获得焦点。
 *
 */
export interface FocusTrapInertStrategy {
  /**
   * Makes all elements outside focusTrap unfocusable.
   *
   * 使 focusTrap 之外的所有元素都无法获得焦点。
   *
   */
  preventFocus(focusTrap: FocusTrap): void;
  /**
   * Reverts elements made unfocusable by preventFocus to their previous state.
   *
   * 通过 preventFocus 以前的状态，来把元素恢复为不可获得焦点的状态。
   *
   */
  allowFocus(focusTrap: FocusTrap): void;
}
