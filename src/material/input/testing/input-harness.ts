/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {HarnessPredicate, parallel} from '@angular/cdk/testing';
import {MatFormFieldControlHarness} from '@angular/material/form-field/testing/control';
import {InputHarnessFilters} from './input-harness-filters';

/**
 * Harness for interacting with a standard Material inputs in tests.
 *
 * 在测试中与标准 Material 输入框进行交互的测试工具。
 *
 */
export class MatInputHarness extends MatFormFieldControlHarness {
  // TODO: We do not want to handle `select` elements with `matNativeControl` because
  // not all methods of this harness work reasonably for native select elements.
  // For more details. See: https://github.com/angular/components/pull/18221.
  static hostSelector = '[matInput], input[matNativeControl], textarea[matNativeControl]';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `MatInputHarness` that meets
   * certain criteria.
   *
   * 获取一个 `HarnessPredicate`，该 HarnessPredicate 可用于搜索满足某些条件的 `MatInputHarness`。
   *
   * @param options Options for filtering which input instances are considered a match.
   *
   * 用于过滤哪些输入实例应该视为匹配项的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with(options: InputHarnessFilters = {}): HarnessPredicate<MatInputHarness> {
    return new HarnessPredicate(MatInputHarness, options)
      .addOption('value', options.value, (harness, value) => {
        return HarnessPredicate.stringMatches(harness.getValue(), value);
      })
      .addOption('placeholder', options.placeholder, (harness, placeholder) => {
        return HarnessPredicate.stringMatches(harness.getPlaceholder(), placeholder);
      });
  }

  /**
   * Whether the input is disabled.
   *
   * 此输入框是否已禁用。
   *
   */
  async isDisabled(): Promise<boolean> {
    return (await this.host()).getProperty<boolean>('disabled');
  }

  /**
   * Whether the input is required.
   *
   * 此输入框是否为必需的。
   *
   */
  async isRequired(): Promise<boolean> {
    return (await this.host()).getProperty<boolean>('required');
  }

  /**
   * Whether the input is readonly.
   *
   * 此输入框是否为只读。
   *
   */
  async isReadonly(): Promise<boolean> {
    return (await this.host()).getProperty<boolean>('readOnly');
  }

  /**
   * Gets the value of the input.
   *
   * 获取此输入框的值。
   *
   */
  async getValue(): Promise<string> {
    // The "value" property of the native input is never undefined.
    return await (await this.host()).getProperty<string>('value');
  }

  /**
   * Gets the name of the input.
   *
   * 获取此输入框的名称。
   *
   */
  async getName(): Promise<string> {
    // The "name" property of the native input is never undefined.
    return await (await this.host()).getProperty<string>('name');
  }

  /**
   * Gets the type of the input. Returns "textarea" if the input is
   * a textarea.
   *
   * 获取此输入框的类型。如果此输入框是一个 textarea，则返回 “textarea”。
   *
   */
  async getType(): Promise<string> {
    // The "type" property of the native input is never undefined.
    return await (await this.host()).getProperty<string>('type');
  }

  /**
   * Gets the placeholder of the input.
   *
   * 获取输入框的占位符。
   *
   */
  async getPlaceholder(): Promise<string> {
    const host = await this.host();
    const [nativePlaceholder, fallback] = await parallel(() => [
      host.getProperty('placeholder'),
      host.getAttribute('data-placeholder'),
    ]);
    return nativePlaceholder || fallback || '';
  }

  /**
   * Gets the id of the input.
   *
   * 获取此输入框的 ID。
   *
   */
  async getId(): Promise<string> {
    // The input directive always assigns a unique id to the input in
    // case no id has been explicitly specified.
    return await (await this.host()).getProperty<string>('id');
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
   * 此输入框是否拥有焦点。
   *
   */
  async isFocused(): Promise<boolean> {
    return (await this.host()).isFocused();
  }

  /**
   * Sets the value of the input. The value will be set by simulating
   * keypresses that correspond to the given value.
   *
   * 设置此输入框的值。该值将通过模拟与给定值相对应的按键来设置。
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

    // Some input types won't respond to key presses (e.g. `color`) so to be sure that the
    // value is set, we also set the property after the keyboard sequence. Note that we don't
    // want to do it before, because it can cause the value to be entered twice.
    await inputEl.setInputValue(newValue);
  }
}
