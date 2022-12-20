/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {BaseHarnessFilters} from '@angular/cdk/testing';

/**
 * A set of criteria that can be used to filter a list of `MatCheckboxHarness` instances.
 *
 * 一组可以用来过滤 `MatCheckboxHarness` 实例列表的条件。
 *
 */
export interface CheckboxHarnessFilters extends BaseHarnessFilters {
  /**
   * Only find instances whose label matches the given value.
   *
   * 只查找标签与指定值匹配的实例。
   *
   */
  label?: string | RegExp;
  /**
   * Only find instances whose name attribute is the given value.
   *
   * 只查找 name 属性为指定值的实例。
   *
   */
  name?: string;
  /**
   * Only find instances with the given checked value.
   *
   * 仅查找具有给定勾选值的实例。
   *
   */
  checked?: boolean;
  /** Only find instances which match the given disabled state. */
  disabled?: boolean;
}
