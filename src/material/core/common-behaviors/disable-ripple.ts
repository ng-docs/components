/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {coerceBooleanProperty} from '@angular/cdk/coercion';
import {AbstractConstructor, Constructor} from './constructor';

/** @docs-private */
export interface CanDisableRipple {
  /**
   * Whether ripples are disabled.
   *
   * 是否禁用涟漪。
   *
   */
  disableRipple: boolean;
}

/** @docs-private */
export type CanDisableRippleCtor = Constructor<CanDisableRipple> &
                                   AbstractConstructor<CanDisableRipple>;

/**
 * Mixin to augment a directive with a `disableRipple` property.
 *
 * 混入 `disableRipple` 属性，以扩展指令。
 *
 */
export function mixinDisableRipple<T extends AbstractConstructor<{}>>(base: T):
  CanDisableRippleCtor & T;
export function mixinDisableRipple<T extends Constructor<{}>>(base: T): CanDisableRippleCtor & T {
  return class extends base {
    private _disableRipple: boolean = false;

    /**
     * Whether the ripple effect is disabled or not.
     *
     * 是否禁用涟漪效果。
     *
     */
    get disableRipple() { return this._disableRipple; }
    set disableRipple(value: any) { this._disableRipple = coerceBooleanProperty(value); }

    constructor(...args: any[]) { super(...args); }
  };
}
