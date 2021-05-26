/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {coerceNumberProperty} from '@angular/cdk/coercion';
import {Constructor, AbstractConstructor} from './constructor';
import {CanDisable} from './disabled';

/** @docs-private */
export interface HasTabIndex {
  /**
   * Tabindex of the component.
   *
   * 该组件的 Tabindex。
   *
   */
  tabIndex: number;

  /**
   * Tabindex to which to fall back to if no value is set.
   *
   * 如果未设置任何值，将退回到 Tabindex。
   *
   */
  defaultTabIndex: number;
}

/** @docs-private */
export type HasTabIndexCtor = Constructor<HasTabIndex> & AbstractConstructor<HasTabIndex>;

/**
 * Mixin to augment a directive with a `tabIndex` property.
 *
 * 混入 `tabIndex` 属性，以扩展指令。
 *
 */
export function mixinTabIndex<T extends AbstractConstructor<CanDisable>>(base: T,
  defaultTabIndex?: number): HasTabIndexCtor & T;
export function mixinTabIndex<T extends Constructor<CanDisable>>(
  base: T, defaultTabIndex = 0): HasTabIndexCtor & T {
  return class extends base implements HasTabIndex {
    private _tabIndex: number = defaultTabIndex;
    defaultTabIndex = defaultTabIndex;

    get tabIndex(): number { return this.disabled ? -1 : this._tabIndex; }
    set tabIndex(value: number) {
      // If the specified tabIndex value is null or undefined, fall back to the default value.
      this._tabIndex = value != null ? coerceNumberProperty(value) : this.defaultTabIndex;
    }

    constructor(...args: any[]) {
      super(...args);
    }
  };
}
