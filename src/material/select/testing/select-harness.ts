/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  BaseHarnessFilters,
  ComponentHarness,
  ComponentHarnessConstructor,
  HarnessPredicate,
  parallel,
} from '@angular/cdk/testing';
import {
  MatOptionHarness,
  MatOptgroupHarness,
  OptionHarnessFilters,
  OptgroupHarnessFilters,
} from '@angular/material/core/testing';
import {MatFormFieldControlHarness} from '@angular/material/form-field/testing/control';
import {SelectHarnessFilters} from './select-harness-filters';

export abstract class _MatSelectHarnessBase<
  OptionType extends ComponentHarnessConstructor<Option> & {
    with: (options?: OptionFilters) => HarnessPredicate<Option>;
  },
  Option extends ComponentHarness & {click(): Promise<void>},
  OptionFilters extends BaseHarnessFilters,
  OptionGroupType extends ComponentHarnessConstructor<OptionGroup> & {
    with: (options?: OptionGroupFilters) => HarnessPredicate<OptionGroup>;
  },
  OptionGroup extends ComponentHarness,
  OptionGroupFilters extends BaseHarnessFilters,
> extends MatFormFieldControlHarness {
  protected abstract _prefix: string;
  protected abstract _optionClass: OptionType;
  protected abstract _optionGroupClass: OptionGroupType;
  private _documentRootLocator = this.documentRootLocatorFactory();
  private _backdrop = this._documentRootLocator.locatorFor('.cdk-overlay-backdrop');

  /**
   * Gets a boolean promise indicating if the select is disabled.
   *
   * 获取一个布尔型 Promise，指示是否禁用了此选择框。
   *
   */
  async isDisabled(): Promise<boolean> {
    return (await this.host()).hasClass(`${this._prefix}-select-disabled`);
  }

  /**
   * Gets a boolean promise indicating if the select is valid.
   *
   * 获取一个布尔型 Promise，指示此选择框是否有效。
   *
   */
  async isValid(): Promise<boolean> {
    return !(await (await this.host()).hasClass('ng-invalid'));
  }

  /**
   * Gets a boolean promise indicating if the select is required.
   *
   * 获取一个布尔型 Promise，指示此选择是否必填。
   *
   */
  async isRequired(): Promise<boolean> {
    return (await this.host()).hasClass(`${this._prefix}-select-required`);
  }

  /**
   * Gets a boolean promise indicating if the select is empty (no value is selected).
   *
   * 获取一个布尔型 Promise，指示此选择框是否为空（未选择任何值）。
   *
   */
  async isEmpty(): Promise<boolean> {
    return (await this.host()).hasClass(`${this._prefix}-select-empty`);
  }

  /**
   * Gets a boolean promise indicating if the select is in multi-selection mode.
   *
   * 获取一个布尔型 Promise，指示此选择框是否处于多选模式。
   *
   */
  async isMultiple(): Promise<boolean> {
    return (await this.host()).hasClass(`${this._prefix}-select-multiple`);
  }

  /**
   * Gets a promise for the select's value text.
   *
   * 获取此选择框值文本的 Promise。
   *
   */
  async getValueText(): Promise<string> {
    const value = await this.locatorFor(`.${this._prefix}-select-value`)();
    return value.text();
  }

  /**
   * Focuses the select and returns a void promise that indicates when the action is complete.
   *
   * 让选择框获得焦点并返回 void 型 Promise，指示操作何时完成。
   *
   */
  async focus(): Promise<void> {
    return (await this.host()).focus();
  }

  /**
   * Blurs the select and returns a void promise that indicates when the action is complete.
   *
   * 让选择框失焦并返回 void 型 Promise，指示操作何时完成。
   *
   */
  async blur(): Promise<void> {
    return (await this.host()).blur();
  }

  /**
   * Whether the select is focused.
   *
   * 此选择框是否拥有焦点。
   *
   */
  async isFocused(): Promise<boolean> {
    return (await this.host()).isFocused();
  }

  /**
   * Gets the options inside the select panel.
   *
   * 获取此选择面板中的选项。
   *
   */
  async getOptions(filter?: Omit<OptionFilters, 'ancestor'>): Promise<Option[]> {
    return this._documentRootLocator.locatorForAll(
      this._optionClass.with({
        ...(filter || {}),
        ancestor: await this._getPanelSelector(),
      } as OptionFilters),
    )();
  }

  /**
   * Gets the groups of options inside the panel.
   *
   * 获取此面板内的选项组。
   *
   */
  async getOptionGroups(filter?: Omit<OptionGroupFilters, 'ancestor'>): Promise<OptionGroup[]> {
    return this._documentRootLocator.locatorForAll(
      this._optionGroupClass.with({
        ...(filter || {}),
        ancestor: await this._getPanelSelector(),
      } as OptionGroupFilters),
    )() as Promise<OptionGroup[]>;
  }

  /**
   * Gets whether the select is open.
   *
   * 获取此选择框是否已打开。
   *
   */
  async isOpen(): Promise<boolean> {
    return !!(await this._documentRootLocator.locatorForOptional(await this._getPanelSelector())());
  }

  /**
   * Opens the select's panel.
   *
   * 打开此选择框的面板。
   *
   */
  async open(): Promise<void> {
    if (!(await this.isOpen())) {
      const trigger = await this.locatorFor(`.${this._prefix}-select-trigger`)();
      return trigger.click();
    }
  }

  /**
   * Clicks the options that match the passed-in filter. If the select is in multi-selection
   * mode all options will be clicked, otherwise the harness will pick the first matching option.
   *
   * 单击与传入的过滤器相匹配的选项。如果此选择框处于多选模式，则将单击所有选项，否则测试工具将选择第一个匹配的选项。
   *
   */
  async clickOptions(filter?: OptionFilters): Promise<void> {
    await this.open();

    const [isMultiple, options] = await parallel(() => [
      this.isMultiple(),
      this.getOptions(filter),
    ]);

    if (options.length === 0) {
      throw Error('Select does not have options matching the specified filter');
    }

    if (isMultiple) {
      await parallel(() => options.map(option => option.click()));
    } else {
      await options[0].click();
    }
  }

  /**
   * Closes the select's panel.
   *
   * 关闭此选择框的面板。
   *
   */
  async close(): Promise<void> {
    if (await this.isOpen()) {
      // This is the most consistent way that works both in both single and multi-select modes,
      // but it assumes that only one overlay is open at a time. We should be able to make it
      // a bit more precise after #16645 where we can dispatch an ESCAPE press to the host instead.
      return (await this._backdrop()).click();
    }
  }

  /**
   * Gets the selector that should be used to find this select's panel.
   *
   * 获取用于此选择框面板的选择器（selector）。
   *
   */
  private async _getPanelSelector(): Promise<string> {
    const id = await (await this.host()).getAttribute('id');
    return `#${id}-panel`;
  }
}

/**
 * Harness for interacting with an MDC-based mat-select in tests.
 *
 * 在测试中与标准 mat-select 互动的测试工具。
 *
 */
export class MatSelectHarness extends _MatSelectHarnessBase<
  typeof MatOptionHarness,
  MatOptionHarness,
  OptionHarnessFilters,
  typeof MatOptgroupHarness,
  MatOptgroupHarness,
  OptgroupHarnessFilters
> {
  static hostSelector = '.mat-mdc-select';
  protected _prefix = 'mat-mdc';
  protected _optionClass = MatOptionHarness;
  protected _optionGroupClass = MatOptgroupHarness;

  /**
   * Gets a `HarnessPredicate` that can be used to search for a select with specific attributes.
   *
   * 获取一个 `HarnessPredicate`，可用于搜索满足某些条件的 `MatSelectHarness`。
   *
   * @param options Options for filtering which select instances are considered a match.
   *
   * 用于筛选哪些选择实例应该视为匹配项的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 使用给定选项配置过的 `HarnessPredicate`
   *
   */
  static with<T extends MatSelectHarness>(
    this: ComponentHarnessConstructor<T>,
    options: SelectHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options).addOption(
      'disabled',
      options.disabled,
      async (harness, disabled) => {
        return (await harness.isDisabled()) === disabled;
      },
    );
  }
}
