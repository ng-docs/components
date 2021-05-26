/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {BaseHarnessFilters} from '@angular/cdk/testing';

/**
 * A set of criteria that can be used to filter a list of cell harness instances.
 *
 * 一组标准，可用于过滤单元测试工具实例的列表。
 *
 */
export interface CellHarnessFilters extends BaseHarnessFilters {
  /**
   * Only find instances whose text matches the given value.
   *
   * 只查找其文本内容匹配指定值的实例。
   *
   */
  text?: string | RegExp;

  /**
   * Only find instances whose column name matches the given value.
   *
   * 仅查找其列名与给定值匹配的实例。
   *
   */
  columnName?: string | RegExp;
}

/**
 * A set of criteria that can be used to filter a list of row harness instances.
 *
 * 一组标准，可用于过滤表行测试工具实例的列表。
 *
 */
export interface RowHarnessFilters extends BaseHarnessFilters {
}

/**
 * A set of criteria that can be used to filter a list of table harness instances.
 *
 * 一组标准，可用于过滤表格测试工具实例的列表。
 *
 */
export interface TableHarnessFilters extends BaseHarnessFilters {
}
