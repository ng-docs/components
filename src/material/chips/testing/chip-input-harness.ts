/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  ComponentHarness,
  ComponentHarnessConstructor,
  HarnessPredicate,
  TestKey,
} from '@angular/cdk/testing';
import {ChipInputHarnessFilters} from './chip-harness-filters';

/**
 * Harness for interacting with a grid's chip input in tests.
 *
 * 在测试中用来与标准 Material 纸片组件交互的测试工具。
 *
 */
export class MatChipInputHarness extends ComponentHarness {
  static hostSelector = '.mat-mdc-chip-input';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a chip input with specific
   * attributes.
   *
   * 获取一个 `HarnessPredicate`，它可以用来搜索满足一定条件 `MatChipInputHarness`
   *
   * @param options Options for filtering which input instances are considered a match.
   *
   * 一个选项，用于筛选哪些输入框实例是匹配的。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with<T extends MatChipInputHarness>(
    this: ComponentHarnessConstructor<T>,
    options: ChipInputHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options)
      .addOption('value', options.value, async (harness, value) => {
        return (await harness.getValue()) === value;
      })
      .addOption('placeholder', options.placeholder, async (harness, placeholder) => {
        return (await harness.getPlaceholder()) === placeholder;
      })
      .addOption('disabled', options.disabled, async (harness, disabled) => {
        return (await harness.isDisabled()) === disabled;
      });
  }

  /**
   * Whether the input is disabled.
   *
   * 输入框是否已禁用。
   *
   */
  async isDisabled(): Promise<boolean> {
    return (await this.host()).getProperty<boolean>('disabled');
  }

  /**
   * Whether the input is required.
   *
   * 输入框是否为必需的。
   *
   */
  async isRequired(): Promise<boolean> {
    return (await this.host()).getProperty<boolean>('required');
  }

  /**
   * Gets the value of the input.
   *
   * 获取输入框的值。
   *
   */
  async getValue(): Promise<string> {
    // The "value" property of the native input is never undefined.
    return await (await this.host()).getProperty<string>('value');
  }

  /**
   * Gets the placeholder of the input.
   *
   * 获取输入框的占位符。
   *
   */
  async getPlaceholder(): Promise<string> {
    return await (await this.host()).getProperty<string>('placeholder');
  }

  /**
   * Focuses the input and returns a promise that indicates when the
   * action is complete.
   *
   * 聚焦输入框并返回一个 Promise，表明该动作何时完成。
   *
   */
  async focus(): Promise<void> {
    return (await this.host()).focus();
  }

  /**
   * Blurs the input and returns a promise that indicates when the
   * action is complete.
   *
   * 失焦输入框并返回一个 Promise，表明该动作什么时候完成。
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
   * Sets the value of the input. The value will be set by simulating
   * keypresses that correspond to the given value.
   *
   * 设置输入框的值。该值将通过模拟与指定值对应的按键进行设置。
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
  }

  /**
   * Sends a chip separator key to the input element.
   *
   * 向输入框元素发送一个纸片分隔键。
   *
   */
  async sendSeparatorKey(key: TestKey | string): Promise<void> {
    const inputEl = await this.host();
    return inputEl.sendKeys(key);
  }
}
