/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {HarnessPredicate, parallel, TestKey} from '@angular/cdk/testing';
import {DatepickerInputHarnessFilters, CalendarHarnessFilters} from './datepicker-harness-filters';
import {MatDatepickerInputHarnessBase, getInputPredicate} from './datepicker-input-harness-base';
import {MatCalendarHarness} from './calendar-harness';
import {
  DatepickerTrigger,
  closeCalendar,
  getCalendarId,
  getCalendar,
} from './datepicker-trigger-harness-base';

/**
 * Harness for interacting with a standard Material datepicker inputs in tests.
 *
 * 与测试中的标准 Material datepicker 输入框进行交互的测试工具。
 *
 */
export class MatDatepickerInputHarness extends MatDatepickerInputHarnessBase implements
  DatepickerTrigger {
  static hostSelector = '.mat-datepicker-input';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `MatDatepickerInputHarness`
   * that meets certain criteria.
   *
   * 获取一个 `HarnessPredicate`，该 HarnessPredicate 可用于搜索满足某些条件的 `MatDatepickerInputHarness`。
   *
   * @param options Options for filtering which input instances are considered a match.
   *
   * 用于过滤哪些输入框实例应该视为匹配项的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with(options: DatepickerInputHarnessFilters = {}):
    HarnessPredicate<MatDatepickerInputHarness> {
    return getInputPredicate(MatDatepickerInputHarness, options);
  }

  /**
   * Gets whether the calendar associated with the input is open.
   *
   * 获取与输入框关联的日历是否已打开。
   *
   */
  async isCalendarOpen(): Promise<boolean> {
    // `aria-owns` is set only if there's an open datepicker so we can use it as an indicator.
    const host = await this.host();
    return (await host.getAttribute('aria-owns')) != null;
  }

  /**
   * Opens the calendar associated with the input.
   *
   * 打开与该输入框关联的日历。
   *
   */
  async openCalendar(): Promise<void> {
    const [isDisabled, hasCalendar] = await parallel(() => [this.isDisabled(), this.hasCalendar()]);

    if (!isDisabled && hasCalendar) {
      // Alt + down arrow is the combination for opening the calendar with the keyboard.
      const host = await this.host();
      return host.sendKeys({alt: true}, TestKey.DOWN_ARROW);
    }
  }

  /**
   * Closes the calendar associated with the input.
   *
   * 关闭与输入关联框的日历。
   *
   */
  async closeCalendar(): Promise<void> {
    if (await this.isCalendarOpen()) {
      await closeCalendar(getCalendarId(this.host()), this.documentRootLocatorFactory());
      // This is necessary so that we wait for the closing animation to finish in touch UI mode.
      await this.forceStabilize();
    }
  }

  /**
   * Whether a calendar is associated with the input.
   *
   * 日历是否与输入框关联。
   *
   */
  async hasCalendar(): Promise<boolean> {
    return (await getCalendarId(this.host())) != null;
  }

  /**
   * Gets the `MatCalendarHarness` that is associated with the trigger.
   *
   * 获取与触发器关联的 `MatCalendarHarness`。
   *
   * @param filter Optionally filters which calendar is included.
   *
   * （可选）决定要包含哪个日历的过滤器。
   *
   */
  async getCalendar(filter: CalendarHarnessFilters = {}): Promise<MatCalendarHarness> {
    return getCalendar(filter, this.host(), this.documentRootLocatorFactory());
  }
}
