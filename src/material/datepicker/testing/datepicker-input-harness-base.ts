/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  ComponentHarnessConstructor,
  HarnessPredicate,
} from '@angular/cdk/testing';
import {MatFormFieldControlHarness} from '@angular/material/form-field/testing/control';
import {DatepickerInputHarnessFilters} from './datepicker-harness-filters';

/**
 * Sets up the filter predicates for a datepicker input harness.
 *
 * 为日期选择器输入框测试工具设置筛选谓词。
 *
 */
export function getInputPredicate<T extends MatDatepickerInputHarnessBase>(
  type: ComponentHarnessConstructor<T>,
  options: DatepickerInputHarnessFilters): HarnessPredicate<T> {

  return new HarnessPredicate(type, options)
    .addOption('value', options.value, (harness, value) => {
      return HarnessPredicate.stringMatches(harness.getValue(), value);
    })
    .addOption('placeholder', options.placeholder, (harness, placeholder) => {
      return HarnessPredicate.stringMatches(harness.getPlaceholder(), placeholder);
    });
}

/**
 * Base class for datepicker input harnesses.
 *
 * 日期选择器输入框测试工具的基类。
 *
 */
export abstract class MatDatepickerInputHarnessBase extends MatFormFieldControlHarness {
  /**
   * Whether the input is disabled.
   *
   * 输入框是否已禁用。
   *
   */
  async isDisabled(): Promise<boolean> {
    return (await this.host()).getProperty('disabled')!;
  }

  /**
   * Whether the input is required.
   *
   * 输入框是否为必需的。
   *
   */
  async isRequired(): Promise<boolean> {
    return (await this.host()).getProperty('required')!;
  }

  /**
   * Gets the value of the input.
   *
   * 获取输入框的值。
   *
   */
  async getValue(): Promise<string> {
    // The "value" property of the native input is always defined.
    return (await (await this.host()).getProperty('value'))!;
  }

  /**
   * Sets the value of the input. The value will be set by simulating
   * keypresses that correspond to the given value.
   *
   * 设置输入框的值。该值将通过模拟与给定值相对应的按键来设置。
   *
   */
  async setValue(newValue: string): Promise<void> {
    const inputEl = await this.host();
    await inputEl.clear();

    // We don't want to send keys for the value if the value is an empty
    // string in order to clear the value. Sending keys with an empty string
    // still results in unnecessary focus events.
    if (newValue) {
      await inputEl.sendKeys(newValue);
    }

    await inputEl.dispatchEvent('change');
  }

  /**
   * Gets the placeholder of the input.
   *
   * 获取输入框的占位符。
   *
   */
  async getPlaceholder(): Promise<string> {
    return (await (await this.host()).getProperty('placeholder'));
  }

  /**
   * Focuses the input and returns a promise that indicates when the
   * action is complete.
   *
   * 让此输入框获得焦点并返回一个 Promise，指示操作何时完成。
   *
   */
  async focus(): Promise<void> {
    return (await this.host()).focus();
  }

  /**
   * Blurs the input and returns a promise that indicates when the
   * action is complete.
   *
   * 让此输入框失焦并返回一个 Promise，指示操作何时完成。
   *
   */
  async blur(): Promise<void> {
    return (await this.host()).blur();
  }

  /**
   * Whether the input is focused.
   *
   * 输入框是否拥有焦点。
   *
   */
  async isFocused(): Promise<boolean> {
    return (await this.host()).isFocused();
  }

  /**
   * Gets the formatted minimum date for the input's value.
   *
   * 获取输入值的格式化过的最小日期。
   *
   */
  async getMin(): Promise<string | null> {
    return (await this.host()).getAttribute('min');
  }

  /**
   * Gets the formatted maximum date for the input's value.
   *
   * 获取输入值的格式化过的最大日期。
   *
   */
  async getMax(): Promise<string | null> {
    return (await this.host()).getAttribute('max');
  }
}
