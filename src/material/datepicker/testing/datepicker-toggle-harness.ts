/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {HarnessPredicate} from '@angular/cdk/testing';
import {coerceBooleanProperty} from '@angular/cdk/coercion';
import {DatepickerToggleHarnessFilters} from './datepicker-harness-filters';
import {DatepickerTriggerHarnessBase} from './datepicker-trigger-harness-base';

/**
 * Harness for interacting with a standard Material datepicker toggle in tests.
 *
 * 与测试中的标准 Material 日期选择器的切换器进行交互的测试工具。
 *
 */
export class MatDatepickerToggleHarness extends DatepickerTriggerHarnessBase {
  static hostSelector = '.mat-datepicker-toggle';

  /**
   * The clickable button inside the toggle.
   *
   * 此切换器内的可点击按钮。
   *
   */
  private _button = this.locatorFor('button');

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `MatDatepickerToggleHarness` that
   * meets certain criteria.
   *
   * 获取一个 `HarnessPredicate`，可用于搜索满足某些条件的 `MatDatepickerToggleHarness`。
   *
   * @param options Options for filtering which datepicker toggle instances are considered a match.
   *
   * 用于过滤哪些日期选择器切换器实例应该视为匹配项的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with(
    options: DatepickerToggleHarnessFilters = {},
  ): HarnessPredicate<MatDatepickerToggleHarness> {
    return new HarnessPredicate(MatDatepickerToggleHarness, options);
  }

  /**
   * Gets whether the calendar associated with the toggle is open.
   *
   * 获取与此切换器关联的日历是否处于打开状态。
   *
   */
  async isCalendarOpen(): Promise<boolean> {
    return (await this.host()).hasClass('mat-datepicker-toggle-active');
  }

  /**
   * Whether the toggle is disabled.
   *
   * 是否禁用此切换器。
   *
   */
  async isDisabled(): Promise<boolean> {
    const button = await this._button();
    return coerceBooleanProperty(await button.getAttribute('disabled'));
  }

  protected async _openCalendar(): Promise<void> {
    return (await this._button()).click();
  }
}
