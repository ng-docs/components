/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {coerceBooleanProperty} from '@angular/cdk/coercion';

/** @docs-private */
export type Constructor<T> = new(...args: any[]) => T;

/**
 * Interface for a mixin to provide a directive with a function that checks if the sticky input has
 * been changed since the last time the function was called. Essentially adds a dirty-check to the
 * sticky value.
 *
 * 一个混入（mixin）接口，用来给指令提供一个函数，该函数用于检查自上次调用该函数以来此粘性组件的输入是否已被修改过。本质上是对此粘性组件的值添加脏检查。
 *
 * @docs-private
 */
export interface CanStick {
  /**
   * Whether sticky positioning should be applied.
   *
   * 是否应该使用粘性定位。
   *
   */
  sticky: boolean;

  /**
   * Whether the sticky input has changed since it was last checked.
   *
   * 此粘性组件的输入是否自上次检查后发生了变化。
   *
   */
  _hasStickyChanged: boolean;

  /**
   * Whether the sticky value has changed since this was last called.
   *
   * 此粘性组件的值是否自上次调用后发生了变化。
   *
   */
  hasStickyChanged(): boolean;

  /**
   * Resets the dirty check for cases where the sticky state has been used without checking.
   *
   * 对于粘性状态已被使用且未经检查的情况，重置脏检查。
   *
   */
  resetStickyChanged(): void;
}

/** @docs-private */
export type CanStickCtor = Constructor<CanStick>;

/**
 * Mixin to provide a directive with a function that checks if the sticky input has been
 * changed since the last time the function was called. Essentially adds a dirty-check to the
 * sticky value.
 *
 * Mixin 用来提供一个带有函数的指令，该函数用来检查自上次调用该函数以来粘性输入是否已被改变。本质上是对脏粘值添加脏检查。
 *
 * @docs-private
 */
export function mixinHasStickyInput<T extends Constructor<{}>>(base: T): CanStickCtor & T {
  return class extends base {
    /**
     * Whether sticky positioning should be applied.
     *
     * 是否应该使用粘性定位。
     *
     */
    get sticky(): boolean { return this._sticky; }
    set sticky(v: boolean) {
      const prevValue = this._sticky;
      this._sticky = coerceBooleanProperty(v);
      this._hasStickyChanged = prevValue !== this._sticky;
    }
    _sticky: boolean = false;

    /**
     * Whether the sticky input has changed since it was last checked.
     *
     * 此粘性组件的输入是否自上次检查后发生了变化。
     *
     */
    _hasStickyChanged: boolean = false;

    /**
     * Whether the sticky value has changed since this was last called.
     *
     * 此粘性组件的值是否自上次调用后发生了变化。
     *
     */
    hasStickyChanged(): boolean {
      const hasStickyChanged = this._hasStickyChanged;
      this._hasStickyChanged = false;
      return hasStickyChanged;
    }

    /**
     * Resets the dirty check for cases where the sticky state has been used without checking.
     *
     * 对于粘性状态已被使用且未检查过的情况，重置脏检查。
     *
     */
    resetStickyChanged() {
      this._hasStickyChanged = false;
    }

    constructor(...args: any[]) { super(...args); }
  };
}
