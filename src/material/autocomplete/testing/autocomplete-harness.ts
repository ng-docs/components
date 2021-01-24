/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {coerceBooleanProperty} from '@angular/cdk/coercion';
import {ComponentHarness, HarnessPredicate} from '@angular/cdk/testing';
import {
  MatOptgroupHarness,
  MatOptionHarness,
  OptgroupHarnessFilters,
  OptionHarnessFilters
} from '@angular/material/core/testing';
import {AutocompleteHarnessFilters} from './autocomplete-harness-filters';

/**
 * Harness for interacting with a standard mat-autocomplete in tests.
 *
 * 在测试中用来与标准 mat-autocomplete 进行交互的测试工具。
 *
 */
export class MatAutocompleteHarness extends ComponentHarness {
  private _documentRootLocator = this.documentRootLocatorFactory();

  /**
   * The selector for the host element of a `MatAutocomplete` instance.
   *
   * `MatAutocomplete` 实例的宿主元素选择器。
   *
   */
  static hostSelector = '.mat-autocomplete-trigger';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `MatAutocompleteHarness` that meets
   * certain criteria.
   *
   * 获取一个 `HarnessPredicate` ，它可以用来搜索满足一定条件的 `MatAutocompleteHarness`
   *
   * @param options Options for filtering which autocomplete instances are considered a match.
   *
   * 用于过滤哪些自动完成器实例满足条件的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with(options: AutocompleteHarnessFilters = {}): HarnessPredicate<MatAutocompleteHarness> {
    return new HarnessPredicate(MatAutocompleteHarness, options)
        .addOption('value', options.value,
            (harness, value) => HarnessPredicate.stringMatches(harness.getValue(), value));
  }

  /**
   * Gets the value of the autocomplete input.
   *
   * 获取自动完成器输入框的值。
   *
   */
  async getValue(): Promise<string> {
    return (await this.host()).getProperty('value');
  }

  /**
   * Whether the autocomplete input is disabled.
   *
   * 是否禁用了自动完成器输入框。
   *
   */
  async isDisabled(): Promise<boolean> {
    const disabled = (await this.host()).getAttribute('disabled');
    return coerceBooleanProperty(await disabled);
  }

  /**
   * Focuses the autocomplete input.
   *
   * 为自动完成器输入框设置焦点。
   *
   */
  async focus(): Promise<void> {
    return (await this.host()).focus();
  }

  /**
   * Blurs the autocomplete input.
   *
   * 为自动完成器输入框取消焦点。
   *
   */
  async blur(): Promise<void> {
    return (await this.host()).blur();
  }

  /**
   * Whether the autocomplete input is focused.
   *
   * 自动完成器输入框是否拥有焦点。
   *
   */
  async isFocused(): Promise<boolean> {
    return (await this.host()).isFocused();
  }

  /**
   * Enters text into the autocomplete.
   *
   * 在自动完成器中输入文字。
   *
   */
  async enterText(value: string): Promise<void> {
    return (await this.host()).sendKeys(value);
  }

  /**
   * Gets the options inside the autocomplete panel.
   *
   * 获取自动完成面板中的选项。
   *
   */
  async getOptions(filters: Omit<OptionHarnessFilters, 'ancestor'> = {}):
    Promise<MatOptionHarness[]> {
    return this._documentRootLocator.locatorForAll(MatOptionHarness.with({
      ...filters,
      ancestor: await this._getPanelSelector()
    }))();
  }

  /**
   * Gets the option groups inside the autocomplete panel.
   *
   * 获取自动完成面板中的选项组。
   *
   */
  async getOptionGroups(filters: Omit<OptgroupHarnessFilters, 'ancestor'> = {}):
    Promise<MatOptgroupHarness[]> {
    return this._documentRootLocator.locatorForAll(MatOptgroupHarness.with({
      ...filters,
      ancestor: await this._getPanelSelector()
    }))();
  }

  /**
   * Selects the first option matching the given filters.
   *
   * 选择与指定的过滤器匹配的第一个选项。
   *
   */
  async selectOption(filters: OptionHarnessFilters): Promise<void> {
    await this.focus(); // Focus the input to make sure the autocomplete panel is shown.
    const options = await this.getOptions(filters);
    if (!options.length) {
      throw Error(`Could not find a mat-option matching ${JSON.stringify(filters)}`);
    }
    await options[0].click();
  }

  /**
   * Whether the autocomplete is open.
   *
   * 本自动完成器是否已打开。
   *
   */
  async isOpen(): Promise<boolean> {
    const panel = await this._getPanel();
    return !!panel && await panel.hasClass('mat-autocomplete-visible');
  }

  /**
   * Gets the panel associated with this autocomplete trigger.
   *
   * 获取与自动完成触发器关联的面板。
   *
   */
  private async _getPanel() {
    // Technically this is static, but it needs to be in a
    // function, because the autocomplete's panel ID can changed.
    return this._documentRootLocator.locatorForOptional(await this._getPanelSelector())();
  }

  /**
   * Gets the selector that can be used to find the autocomplete trigger's panel.
   *
   * 获取一个可以用来查找自动完成触发器面板的选择器。
   *
   */
  private async _getPanelSelector(): Promise<string> {
    return `#${(await (await this.host()).getAttribute('aria-owns'))}`;
  }
}
