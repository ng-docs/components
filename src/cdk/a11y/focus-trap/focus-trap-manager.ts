/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Injectable} from '@angular/core';

/**
 * A FocusTrap managed by FocusTrapManager.
 * Implemented by ConfigurableFocusTrap to avoid circular dependency.
 *
 * 由 FocusTrapManager 管理的 FocusTrap。由 ConfigurableFocusTrap 实现，以避免循环依赖。
 *
 */
export interface ManagedFocusTrap {
  _enable(): void;
  _disable(): void;
  focusInitialElementWhenReady(): Promise<boolean>;
}

/**
 * Injectable that ensures only the most recently enabled FocusTrap is active.
 *
 * 可注入，可确保只有最近启用的 FocusTrap 处于活动状态。
 *
 */
@Injectable({providedIn: 'root'})
export class FocusTrapManager {
  // A stack of the FocusTraps on the page. Only the FocusTrap at the
  // top of the stack is active.
  private _focusTrapStack: ManagedFocusTrap[] = [];

  /**
   * Disables the FocusTrap at the top of the stack, and then pushes
   * the new FocusTrap onto the stack.
   *
   * 禁用堆栈顶部的 FocusTrap，然后将新的 FocusTrap 推入堆栈。
   *
   */
  register(focusTrap: ManagedFocusTrap): void {
    // Dedupe focusTraps that register multiple times.
    this._focusTrapStack = this._focusTrapStack.filter(ft => ft !== focusTrap);

    let stack = this._focusTrapStack;

    if (stack.length) {
      stack[stack.length - 1]._disable();
    }

    stack.push(focusTrap);
    focusTrap._enable();
  }

  /**
   * Removes the FocusTrap from the stack, and activates the
   * FocusTrap that is the new top of the stack.
   *
   * 从堆栈中删除此 FocusTrap，并激活作为堆栈新顶部的 FocusTrap。
   *
   */
  deregister(focusTrap: ManagedFocusTrap): void {
    focusTrap._disable();

    const stack = this._focusTrapStack;

    const i = stack.indexOf(focusTrap);
    if (i !== -1) {
      stack.splice(i, 1);
      if (stack.length) {
        stack[stack.length - 1]._enable();
      }
    }
  }
}
