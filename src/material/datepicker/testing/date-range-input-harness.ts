/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {HarnessPredicate, parallel, TestKey} from '@angular/cdk/testing';
import {MatDatepickerInputHarnessBase, getInputPredicate} from './datepicker-input-harness-base';
import {DatepickerTriggerHarnessBase} from './datepicker-trigger-harness-base';
import {
  DatepickerInputHarnessFilters,
  DateRangeInputHarnessFilters,
} from './datepicker-harness-filters';

/**
 * Harness for interacting with a standard Material date range start input in tests.
 *
 * 在测试中与标准 Material 日期范围选择器中的起始日期进行交互的测试工具。
 *
 */
export class MatStartDateHarness extends MatDatepickerInputHarnessBase {
  static hostSelector = '.mat-start-date';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `MatStartDateHarness`
   * that meets certain criteria.
   *
   * 获取一个 `HarnessPredicate`，它可以用来搜索满足一定条件 `MatStartDateHarness`。
   *
   * @param options Options for filtering which input instances are considered a match.
   *
   * 一个选项，用来筛选哪些输入框实例是匹配的。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with(options: DatepickerInputHarnessFilters = {}):
    HarnessPredicate<MatStartDateHarness> {
    return getInputPredicate(MatStartDateHarness, options);
  }
}

/**
 * Harness for interacting with a standard Material date range end input in tests.
 *
 * 在测试中与标准 Material 日期范围选择器中的结束日期进行交互的测试工具。
 *
 */
export class MatEndDateHarness extends MatDatepickerInputHarnessBase {
  static hostSelector = '.mat-end-date';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `MatEndDateHarness`
   * that meets certain criteria.
   *
   * 获取一个 `HarnessPredicate`，它可以用来搜索满足一定条件的 `MatEndDateHarness`。
   *
   * @param options Options for filtering which input instances are considered a match.
   *
   * 一个选项，用来筛选哪些输入框实例是匹配的。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with(options: DatepickerInputHarnessFilters = {}):
    HarnessPredicate<MatEndDateHarness> {
    return getInputPredicate(MatEndDateHarness, options);
  }
}

/**
 * Harness for interacting with a standard Material date range input in tests.
 *
 * 在测试中与标准 Material 日期范围选择器进行交互的测试工具。
 *
 */
export class MatDateRangeInputHarness extends DatepickerTriggerHarnessBase {
  static hostSelector = '.mat-date-range-input';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `MatDateRangeInputHarness`
   * that meets certain criteria.
   *
   * 获取一个 `HarnessPredicate` ，它可以用来搜索满足一定条件 `MatDateRangeInputHarness`。
   *
   * @param options Options for filtering which input instances are considered a match.
   *
   * 一个选项，用来筛选哪些输入框实例是匹配的。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with(options: DateRangeInputHarnessFilters = {}):
    HarnessPredicate<MatDateRangeInputHarness> {
      return new HarnessPredicate(MatDateRangeInputHarness, options)
        .addOption('value', options.value,
            (harness, value) => HarnessPredicate.stringMatches(harness.getValue(), value));
  }

  /**
   * Gets the combined value of the start and end inputs, including the separator.
   *
   * 获取起始和结束输入框的组合值，包括分隔符。
   *
   */
  async getValue(): Promise<string> {
    const [start, end, separator] = await parallel(() => [
      this.getStartInput().then(input => input.getValue()),
      this.getEndInput().then(input => input.getValue()),
      this.getSeparator()
    ]);

    return start + `${end ? ` ${separator} ${end}` : ''}`;
  }

  /**
   * Gets the inner start date input inside the range input.
   *
   * 获取范围输入框内部的起始日期输入框。
   *
   */
  async getStartInput(): Promise<MatStartDateHarness> {
    // Don't pass in filters here since the start input is required and there can only be one.
    return this.locatorFor(MatStartDateHarness)();
  }

  /**
   * Gets the inner start date input inside the range input.
   *
   * 获取范围输入框内部的结束日期输入框。
   *
   */
  async getEndInput(): Promise<MatEndDateHarness> {
    // Don't pass in filters here since the end input is required and there can only be one.
    return this.locatorFor(MatEndDateHarness)();
  }

  /**
   * Gets the separator text between the values of the two inputs.
   *
   * 获取两个输入框值之间的分隔符文本。
   *
   */
  async getSeparator(): Promise<string> {
    return (await this.locatorFor('.mat-date-range-input-separator')()).text();
  }

  /**
   * Gets whether the range input is disabled.
   *
   * 获取范围输入框是否被禁用。
   *
   */
  async isDisabled(): Promise<boolean> {
    // We consider the input as disabled if both of the sub-inputs are disabled.
    const [startDisabled, endDisabled] = await parallel(() => [
      this.getStartInput().then(input => input.isDisabled()),
      this.getEndInput().then(input => input.isDisabled())
    ]);

    return startDisabled && endDisabled;
  }

  /**
   * Gets whether the range input is required.
   *
   * 获取范围输入框是否必填。
   *
   */
  async isRequired(): Promise<boolean> {
    return (await this.host()).hasClass('mat-date-range-input-required');
  }

  /**
   * Opens the calendar associated with the input.
   *
   * 打开与该输入框关联的日历。
   *
   */
  async isCalendarOpen(): Promise<boolean> {
    // `aria-owns` is set on both inputs only if there's an
    // open range picker so we can use it as an indicator.
    const startHost = await (await this.getStartInput()).host();
    return (await startHost.getAttribute('aria-owns')) != null;
  }

  protected async _openCalendar(): Promise<void> {
    // Alt + down arrow is the combination for opening the calendar with the keyboard.
    const startHost = await (await this.getStartInput()).host();
    return startHost.sendKeys({alt: true}, TestKey.DOWN_ARROW);
  }
}
