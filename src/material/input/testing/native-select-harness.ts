/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {HarnessPredicate, parallel} from '@angular/cdk/testing';
import {MatFormFieldControlHarness} from '@angular/material/form-field/testing/control';
import {MatNativeOptionHarness} from './native-option-harness';
import {
  NativeOptionHarnessFilters,
  NativeSelectHarnessFilters,
} from './native-select-harness-filters';

/**
 * Harness for interacting with a native `select` in tests.
 *
 * 在测试中与 `select` 进行交互的工具。
 *
 */
export class MatNativeSelectHarness extends MatFormFieldControlHarness {
  static hostSelector = 'select[matNativeControl]';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `MatNativeSelectHarness` that meets
   * certain criteria.
   *
   * 获取一个 `HarnessPredicate`，可用于搜索满足某些条件的 `MatNativeSelectHarness`。
   *
   * @param options Options for filtering which select instances are considered a match.
   *
   * 用于筛选哪些选择实例应该视为匹配项的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with(options: NativeSelectHarnessFilters = {}): HarnessPredicate<MatNativeSelectHarness> {
    return new HarnessPredicate(MatNativeSelectHarness, options);
  }

  /**
   * Gets a boolean promise indicating if the select is disabled.
   *
   * 获取一个布尔型 Promise，指示是否禁用了选择。
   *
   */
  async isDisabled(): Promise<boolean> {
    return (await this.host()).getProperty('disabled');
  }

  /**
   * Gets a boolean promise indicating if the select is required.
   *
   * 获取布尔型 Promise，指示此选择器是否必须的。
   *
   */
  async isRequired(): Promise<boolean> {
    return (await this.host()).getProperty('required');
  }

  /**
   * Gets a boolean promise indicating if the select is in multi-selection mode.
   *
   * 获取一个布尔型 Promise，指示此选择器是否处于多选模式。
   *
   */
  async isMultiple(): Promise<boolean> {
    return (await this.host()).getProperty('multiple');
  }

  /**
   * Gets the name of the select.
   *
   * 获取此选择器的名称。
   *
   */
  async getName(): Promise<string> {
    // The "name" property of the native select is never undefined.
    return (await (await this.host()).getProperty('name'))!;
  }

  /**
   * Gets the id of the select.
   *
   * 获取此选择器的 ID。
   *
   */
  async getId(): Promise<string> {
    // We're guaranteed to have an id, because the `matNativeControl` always assigns one.
    return (await (await this.host()).getProperty('id'))!;
  }

  /**
   * Focuses the select and returns a void promise that indicates when the action is complete.
   *
   * 让此选择器获得焦点并返回 void 型 Promise，指示操作何时完成。
   *
   */
  async focus(): Promise<void> {
    return (await this.host()).focus();
  }

  /**
   * Blurs the select and returns a void promise that indicates when the action is complete.
   *
   * 让此选择器失焦并返回 void 型 Promise，指示操作何时完成。
   *
   */
  async blur(): Promise<void> {
    return (await this.host()).blur();
  }

  /**
   * Whether the select is focused.
   *
   * 此选择器是否拥有焦点。
   *
   */
  async isFocused(): Promise<boolean> {
    return (await this.host()).isFocused();
  }

  /**
   * Gets the options inside the select panel.
   *
   * 获取选择面板中的选项。
   *
   */
  async getOptions(filter: NativeOptionHarnessFilters = {}):
    Promise<MatNativeOptionHarness[]> {
    return this.locatorForAll(MatNativeOptionHarness.with(filter))();
  }

  /**
   * Selects the options that match the passed-in filter. If the select is in multi-selection
   * mode all options will be clicked, otherwise the harness will pick the first matching option.
   *
   * 选择与传入的过滤器匹配的选项。如果选择器处于多选模式，则将单击所有选项，否则测试工具将选择第一个匹配的选项。
   *
   */
  async selectOptions(filter: NativeOptionHarnessFilters = {}): Promise<void> {
    const [isMultiple, options] = await parallel(() => {
      return [this.isMultiple(), this.getOptions(filter)];
    });

    if (options.length === 0) {
      throw Error('Select does not have options matching the specified filter');
    }

    const [host, optionIndexes] = await parallel(() => [
      this.host(),
      parallel(() => options.slice(0, isMultiple ? undefined : 1).map(option => option.getIndex()))
    ]);

    await host.selectOptions(...optionIndexes);
  }
}
