/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {HarnessPredicate, ComponentHarness} from '@angular/cdk/testing';
import {CalendarHarnessFilters, CalendarCellHarnessFilters} from './datepicker-harness-filters';
import {MatCalendarCellHarness} from './calendar-cell-harness';

/**
 * Possible views of a `MatCalendarHarness`.
 *
 * `MatCalendarHarness` 可能的视图。
 *
 */
export const enum CalendarView {
  MONTH,
  YEAR,
  MULTI_YEAR,
}

/**
 * Harness for interacting with a standard Material calendar in tests.
 *
 * 在测试中与标准 Material calendar 进行交互的测试工具。
 *
 */
export class MatCalendarHarness extends ComponentHarness {
  static hostSelector = '.mat-calendar';

  /**
   * Queries for the calendar's period toggle button.
   *
   * 查询日历的时间段切换按钮。
   *
   */
  private _periodButton = this.locatorFor('.mat-calendar-period-button');

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `MatCalendarHarness`
   * that meets certain criteria.
   *
   * 获取一个 `HarnessPredicate`，可用于搜索满足某些条件的 `MatCalendarHarness`。
   *
   * @param options Options for filtering which calendar instances are considered a match.
   *
   * 用于过滤哪些日历实例应该视为匹配项的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with(options: CalendarHarnessFilters = {}): HarnessPredicate<MatCalendarHarness> {
    return new HarnessPredicate(MatCalendarHarness, options);
  }

  /**
   * Gets a list of cells inside the calendar.
   *
   * 获取日历中的单元格列表。
   *
   * @param filter Optionally filters which cells are included.
   *
   * （可选）过滤要包含哪些单元格。
   *
   */
  async getCells(filter: CalendarCellHarnessFilters = {}): Promise<MatCalendarCellHarness[]> {
    return this.locatorForAll(MatCalendarCellHarness.with(filter))();
  }

  /**
   * Gets the current view that is being shown inside the calendar.
   *
   * 获取在日历内部显示的当前视图。
   *
   */
  async getCurrentView(): Promise<CalendarView> {
    if (await this.locatorForOptional('mat-multi-year-view')()) {
      return CalendarView.MULTI_YEAR;
    }

    if (await this.locatorForOptional('mat-year-view')()) {
      return CalendarView.YEAR;
    }

    return CalendarView.MONTH;
  }

  /**
   * Gets the label of the current calendar view.
   *
   * 获取当前日历视图的标签。
   *
   */
  async getCurrentViewLabel(): Promise<string> {
    return (await this._periodButton()).text();
  }

  /**
   * Changes the calendar view by clicking on the view toggle button.
   *
   * 通过单击视图切换按钮来更改日历视图。
   *
   */
  async changeView(): Promise<void> {
    return (await this._periodButton()).click();
  }

  /**
   * Goes to the next page of the current view \(e.g. next month when inside the month view\).
   *
   * 转到当前视图的下一页（例如，在月份视图中的下个月）。
   *
   */
  async next(): Promise<void> {
    return (await this.locatorFor('.mat-calendar-next-button')()).click();
  }

  /**
   * Goes to the previous page of the current view
   * \(e.g. previous month when inside the month view\).
   *
   * 转到当前视图的上一页（例如，在月份视图中时的前一个月）。
   *
   */
  async previous(): Promise<void> {
    return (await this.locatorFor('.mat-calendar-previous-button')()).click();
  }

  /**
   * Selects a cell in the current calendar view.
   *
   * 在当前日历视图中选择一个单元格。
   *
   * @param filter An optional filter to apply to the cells. The first cell matching the filter
   *     will be selected.
   *
   * 应用于单元格的可选过滤器。将选择与此过滤器匹配的第一个单元格。
   *
   */
  async selectCell(filter: CalendarCellHarnessFilters = {}): Promise<void> {
    const cells = await this.getCells(filter);
    if (!cells.length) {
      throw Error(`Cannot find calendar cell matching filter ${JSON.stringify(filter)}`);
    }
    await cells[0].select();
  }
}
