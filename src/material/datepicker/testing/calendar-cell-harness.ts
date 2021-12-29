/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {HarnessPredicate, ComponentHarness} from '@angular/cdk/testing';
import {CalendarCellHarnessFilters} from './datepicker-harness-filters';

/**
 * Harness for interacting with a standard Material calendar cell in tests.
 *
 * 与测试中的标准 Material 日历单元进行交互的测试工具。
 *
 */
export class MatCalendarCellHarness extends ComponentHarness {
  static hostSelector = '.mat-calendar-body-cell';

  /**
   * Reference to the inner content element inside the cell.
   *
   * 引用单元格内部的内容元素。
   *
   */
  private _content = this.locatorFor('.mat-calendar-body-cell-content');

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `MatCalendarCellHarness`
   * that meets certain criteria.
   *
   * 获取一个 `HarnessPredicate`，可用于搜索满足某些条件的 `MatCalendarCellHarness`。
   *
   * @param options Options for filtering which cell instances are considered a match.
   *
   * 用于过滤哪些单元格实例应该视为匹配的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with(options: CalendarCellHarnessFilters = {}): HarnessPredicate<MatCalendarCellHarness> {
    return new HarnessPredicate(MatCalendarCellHarness, options)
      .addOption('text', options.text, (harness, text) => {
        return HarnessPredicate.stringMatches(harness.getText(), text);
      })
      .addOption('selected', options.selected, async (harness, selected) => {
        return (await harness.isSelected()) === selected;
      })
      .addOption('active', options.active, async (harness, active) => {
        return (await harness.isActive()) === active;
      })
      .addOption('disabled', options.disabled, async (harness, disabled) => {
        return (await harness.isDisabled()) === disabled;
      })
      .addOption('today', options.today, async (harness, today) => {
        return (await harness.isToday()) === today;
      })
      .addOption('inRange', options.inRange, async (harness, inRange) => {
        return (await harness.isInRange()) === inRange;
      })
      .addOption(
        'inComparisonRange',
        options.inComparisonRange,
        async (harness, inComparisonRange) => {
          return (await harness.isInComparisonRange()) === inComparisonRange;
        },
      )
      .addOption('inPreviewRange', options.inPreviewRange, async (harness, inPreviewRange) => {
        return (await harness.isInPreviewRange()) === inPreviewRange;
      });
  }

  /**
   * Gets the text of the calendar cell.
   *
   * 获取此日历单元格的文本。
   *
   */
  async getText(): Promise<string> {
    return (await this._content()).text();
  }

  /**
   * Gets the aria-label of the calendar cell.
   *
   * 获取此日历单元格的 aria-label。
   *
   */
  async getAriaLabel(): Promise<string> {
    // We're guaranteed for the `aria-label` to be defined
    // since this is a private element that we control.
    return (await this.host()).getAttribute('aria-label') as Promise<string>;
  }

  /**
   * Whether the cell is selected.
   *
   * 是否选中了此单元格。
   *
   */
  async isSelected(): Promise<boolean> {
    const host = await this.host();
    return (await host.getAttribute('aria-selected')) === 'true';
  }

  /**
   * Whether the cell is disabled.
   *
   * 此单元格是否已禁用。
   *
   */
  async isDisabled(): Promise<boolean> {
    return this._hasState('disabled');
  }

  /**
   * Whether the cell is currently activated using keyboard navigation.
   *
   * 当前是否通过键盘导航激活了此单元格。
   *
   */
  async isActive(): Promise<boolean> {
    return this._hasState('active');
  }

  /**
   * Whether the cell represents today's date.
   *
   * 此单元格是否代表今天的日期。
   *
   */
  async isToday(): Promise<boolean> {
    return (await this._content()).hasClass('mat-calendar-body-today');
  }

  /**
   * Selects the calendar cell. Won't do anything if the cell is disabled.
   *
   * 选择此日历单元格。如果该单元格被禁用，则不会执行任何操作。
   *
   */
  async select(): Promise<void> {
    return (await this.host()).click();
  }

  /**
   * Hovers over the calendar cell.
   *
   * 将鼠标悬停在日历单元格上。
   *
   */
  async hover(): Promise<void> {
    return (await this.host()).hover();
  }

  /**
   * Moves the mouse away from the calendar cell.
   *
   * 将鼠标从此日历单元格移开。
   *
   */
  async mouseAway(): Promise<void> {
    return (await this.host()).mouseAway();
  }

  /**
   * Focuses the calendar cell.
   *
   * 让此日历单元格获得焦点。
   *
   */
  async focus(): Promise<void> {
    return (await this.host()).focus();
  }

  /**
   * Removes focus from the calendar cell.
   *
   * 让此日历单元格失焦。
   *
   */
  async blur(): Promise<void> {
    return (await this.host()).blur();
  }

  /**
   * Whether the cell is the start of the main range.
   *
   * 此单元格是否主范围的起点。
   *
   */
  async isRangeStart(): Promise<boolean> {
    return this._hasState('range-start');
  }

  /**
   * Whether the cell is the end of the main range.
   *
   * 此单元格是否主范围的终点。
   *
   */
  async isRangeEnd(): Promise<boolean> {
    return this._hasState('range-end');
  }

  /**
   * Whether the cell is part of the main range.
   *
   * 此单元格是否主范围的一部分。
   *
   */
  async isInRange(): Promise<boolean> {
    return this._hasState('in-range');
  }

  /**
   * Whether the cell is the start of the comparison range.
   *
   * 此单元格是否比较范围的起点。
   *
   */
  async isComparisonRangeStart(): Promise<boolean> {
    return this._hasState('comparison-start');
  }

  /**
   * Whether the cell is the end of the comparison range.
   *
   * 此单元格是否比较范围的终点。
   *
   */
  async isComparisonRangeEnd(): Promise<boolean> {
    return this._hasState('comparison-end');
  }

  /**
   * Whether the cell is inside of the comparison range.
   *
   * 此单元格是否在比较范围内。
   *
   */
  async isInComparisonRange(): Promise<boolean> {
    return this._hasState('in-comparison-range');
  }

  /**
   * Whether the cell is the start of the preview range.
   *
   * 此单元格是否是预览范围的起点。
   *
   */
  async isPreviewRangeStart(): Promise<boolean> {
    return this._hasState('preview-start');
  }

  /**
   * Whether the cell is the end of the preview range.
   *
   * 此单元格是否在预览范围的终点。
   *
   */
  async isPreviewRangeEnd(): Promise<boolean> {
    return this._hasState('preview-end');
  }

  /**
   * Whether the cell is inside of the preview range.
   *
   * 此单元格是否在预览范围内。
   *
   */
  async isInPreviewRange(): Promise<boolean> {
    return this._hasState('in-preview');
  }

  /**
   * Returns whether the cell has a particular CSS class-based state.
   *
   * 返回此单元格是否具有特定的基于 CSS 类的状态。
   *
   */
  private async _hasState(name: string): Promise<boolean> {
    return (await this.host()).hasClass(`mat-calendar-body-${name}`);
  }
}
