/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {BaseHarnessFilters} from '@angular/cdk/testing';

/**
 * A set of criteria that can be used to filter a list of datepicker input instances.
 *
 * 一组可用于过滤日期选择器输入实例列表的条件。
 *
 */
export interface DatepickerInputHarnessFilters extends BaseHarnessFilters {
  /**
   * Filters based on the value of the input.
   *
   * 根据输入值过滤。
   *
   */
  value?: string | RegExp;
  /**
   * Filters based on the placeholder text of the input.
   *
   * 根据输入的占位符文本进行过滤。
   *
   */
  placeholder?: string | RegExp;
}

/**
 * A set of criteria that can be used to filter a list of datepicker toggle instances.
 *
 * 一组可用于过滤日期选择器切换器实例列表的条件。
 *
 */
export interface DatepickerToggleHarnessFilters extends BaseHarnessFilters {}

/**
 * A set of criteria that can be used to filter a list of calendar instances.
 *
 * 一组可用于过滤日历实例列表的条件。
 *
 */
export interface CalendarHarnessFilters extends BaseHarnessFilters {}

/**
 * A set of criteria that can be used to filter a list of calendar cell instances.
 *
 * 一组可用于过滤日历单元格实例列表的条件。
 *
 */
export interface CalendarCellHarnessFilters extends BaseHarnessFilters {
  /**
   * Filters based on the text of the cell.
   *
   * 根据单元格的文本进行过滤。
   *
   */
  text?: string | RegExp;
  /**
   * Filters based on whether the cell is selected.
   *
   * 根据是否选择了单元格进行过滤。
   *
   */
  selected?: boolean;
  /**
   * Filters based on whether the cell is activated using keyboard navigation
   *
   * 根据是否是使用键盘导航激活的单元格进行过滤
   *
   */
  active?: boolean;
  /**
   * Filters based on whether the cell is disabled.
   *
   * 根据是否禁用了该单元进行过滤。
   *
   */
  disabled?: boolean;
  /**
   * Filters based on whether the cell represents today's date.
   *
   * 根据单元格是否代表今天的日期进行过滤。
   *
   */
  today?: boolean;
  /**
   * Filters based on whether the cell is inside of the main range.
   *
   * 根据单元格是否在主范围内进行过滤。
   *
   */
  inRange?: boolean;
  /**
   * Filters based on whether the cell is inside of the comparison range.
   *
   * 根据单元格是否在比较范围内进行过滤。
   *
   */
  inComparisonRange?: boolean;
  /**
   * Filters based on whether the cell is inside of the preview range.
   *
   * 根据单元格是否在预览范围内进行过滤。
   *
   */
  inPreviewRange?: boolean;
}

/**
 * A set of criteria that can be used to filter a list of date range input instances.
 *
 * 一组标准，可用于过滤日期范围输入实例的列表。
 *
 */
export interface DateRangeInputHarnessFilters extends BaseHarnessFilters {
  /**
   * Filters based on the value of the input.
   *
   * 根据输入值过滤。
   *
   */
  value?: string | RegExp;
}
