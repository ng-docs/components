/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {BaseHarnessFilters} from '@angular/cdk/testing';

/**
 * A set of criteria that can be used to filter a list of tree harness instances
 *
 * 一组条件，可用于筛选树测试工具实例的列表
 *
 */
export interface TreeHarnessFilters extends BaseHarnessFilters {}

/**
 * A set of criteria that can be used to filter a list of node harness instances.
 *
 * 一组条件，可用于筛选节点测试工具实例的列表。
 *
 */
export interface TreeNodeHarnessFilters extends BaseHarnessFilters {
  /**
   * Only find instances whose text matches the given value.
   *
   * 只查找其文本内容匹配指定值的实例。
   *
   */
  text?: string | RegExp;

  /**
   * Only find instances whose disabled state matches the given value.
   *
   * 仅查找其禁用状态与给定值匹配的实例。
   *
   */
  disabled?: boolean;

  /**
   * Only find instances whose expansion state matches the given value.
   *
   * 仅查找其展开状态与给定值匹配的实例。
   *
   */
  expanded?: boolean;

  /**
   * Only find instances whose level matches the given value.
   *
   * 仅查找其级别与给定值匹配的实例。
   *
   */
  level?: number;
}
