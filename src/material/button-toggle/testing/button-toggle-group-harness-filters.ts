/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {BaseHarnessFilters} from '@angular/cdk/testing';

/**
 * Criteria that can be used to filter a list of `MatButtonToggleGroupHarness` instances.
 *
 * 可以用来过滤 `MatButtonToggleGroupHarness` 实例列表的标准。
 *
 */
export interface ButtonToggleGroupHarnessFilters extends BaseHarnessFilters {
  /**
   * Only find instances which match the given disabled state.
   *
   * 仅查找与给定禁用状态匹配的实例。
   *
   */
  disabled?: boolean;
}
