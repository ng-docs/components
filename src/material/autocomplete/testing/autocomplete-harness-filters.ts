/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {BaseHarnessFilters} from '@angular/cdk/testing';

/**
 * A set of criteria that can be used to filter a list of `MatAutocompleteHarness` instances.
 *
 * 一组可以用来过滤 `MatAutocompleteHarness` 实例列表的条件。
 *
 */
export interface AutocompleteHarnessFilters extends BaseHarnessFilters {
  /**
   * Only find instances whose associated input element matches the given value.
   *
   * 只找到那些关联的输入框元素匹配指定值的实例。
   *
   */
  value?: string | RegExp;

  /**
   * Only find instances which match the given disabled state.
   *
   * 仅查找与给定禁用状态匹配的实例。
   *
   */
  disabled?: boolean;
}
