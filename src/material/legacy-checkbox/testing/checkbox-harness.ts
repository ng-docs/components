/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {HarnessPredicate} from '@angular/cdk/testing';
import {_MatCheckboxHarnessBase, CheckboxHarnessFilters} from '@angular/material/checkbox/testing';

/**
 * Harness for interacting with a standard mat-checkbox in tests.
 *
 * 与测试中的标准 mat-checkbox 交互的测试工具。
 *
 * @deprecated
 *
 * Use `MatCheckboxHarness` from `@angular/material/checkbox/testing` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
export class MatLegacyCheckboxHarness extends _MatCheckboxHarnessBase {
  /**
   * The selector for the host element of a checkbox instance.
   *
   * 复选框实例的宿主元素的选择器。
   *
   */
  static hostSelector = '.mat-checkbox';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a checkbox harness that meets
   * certain criteria.
   *
   * 获取可用于搜索满足特定条件的复选框组件测试工具的 `HarnessPredicate` 。
   *
   * @param options Options for filtering which checkbox instances are considered a match.
   *
   * 用于过滤哪些复选框实例应该视为匹配项的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 使用给定选项配置过的 `HarnessPredicate`。
   *
   */
  static with(options: CheckboxHarnessFilters = {}): HarnessPredicate<MatLegacyCheckboxHarness> {
    return (
      new HarnessPredicate(MatLegacyCheckboxHarness, options)
        .addOption('label', options.label, (harness, label) =>
          HarnessPredicate.stringMatches(harness.getLabelText(), label),
        )
        // We want to provide a filter option for "name" because the name of the checkbox is
        // only set on the underlying input. This means that it's not possible for developers
        // to retrieve the harness of a specific checkbox with name through a CSS selector.
        .addOption(
          'name',
          options.name,
          async (harness, name) => (await harness.getName()) === name,
        )
        .addOption(
          'checked',
          options.checked,
          async (harness, checked) => (await harness.isChecked()) == checked,
        )
        .addOption('disabled', options.disabled, async (harness, disabled) => {
          return (await harness.isDisabled()) === disabled;
        })
    );
  }

  protected _input = this.locatorFor('input');
  protected _label = this.locatorFor('.mat-checkbox-label');
  private _inputContainer = this.locatorFor('.mat-checkbox-inner-container');

  async toggle(): Promise<void> {
    return (await this._inputContainer()).click();
  }
}
