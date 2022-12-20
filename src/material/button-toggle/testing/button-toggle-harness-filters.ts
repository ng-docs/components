/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {BaseHarnessFilters} from '@angular/cdk/testing';

/**
 * Criteria that can be used to filter a list of `MatButtonToggleHarness` instances.
 *
 * 可以用来过滤 `MatButtonToggleHarness` 实例列表的标准。
 *
 */
export interface ButtonToggleHarnessFilters extends BaseHarnessFilters {
  /**
   * Only find instances whose text matches the given value.
   *
   * 只查找文本与指定值匹配的实例。
   *
   */
  text?: string | RegExp;
  /**
   * Only find instances whose name matches the given value.
   *
   * 只查找名字与指定值匹配的实例。
   *
   */
  name?: string | RegExp;
  /**
   * Only find instances that are checked.
   *
   * 只查找已勾选的实例。
   *
   */
  checked?: boolean;
  /**
   * Only find instances which match the given disabled state.
   *
   * 仅查找与给定禁用状态匹配的实例。
   *
   */
  disabled?: boolean;
}
