/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {HarnessPredicate} from '@angular/cdk/testing';
import {
  RadioButtonHarnessFilters,
  RadioGroupHarnessFilters,
  _MatRadioGroupHarnessBase,
  _MatRadioButtonHarnessBase,
} from '@angular/material/radio/testing';

/**
 * Harness for interacting with a standard mat-radio-group in tests
 *
 * 在测试中用来与标准 mat-radio-group 进行交互的测试工具。
 *
 * @deprecated
 *
 * Use `MatRadioGroupHarness` from `@angular/material/radio/testing` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
export class MatLegacyRadioGroupHarness extends _MatRadioGroupHarnessBase<
  typeof MatLegacyRadioButtonHarness,
  MatLegacyRadioButtonHarness,
  RadioButtonHarnessFilters
> {
  /**
   * The selector for the host element of a `MatRadioGroup` instance.
   *
   * `MatRadioGroup` 实例的宿主元素选择器。
   *
   */
  static hostSelector = '.mat-radio-group';
  protected _buttonClass = MatLegacyRadioButtonHarness;

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `MatRadioGroupHarness` that meets
   * certain criteria.
   *
   * 获取一个 `HarnessPredicate`，可用于搜索满足某些条件的 `MatRadioGroupHarness`。
   *
   * @param options Options for filtering which radio group instances are considered a match.
   *
   * 用于过滤哪些无线电组实例应该视为匹配的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 使用给定选项配置过的 `HarnessPredicate`。
   *
   */
  static with(
    options: RadioGroupHarnessFilters = {},
  ): HarnessPredicate<MatLegacyRadioGroupHarness> {
    return new HarnessPredicate(MatLegacyRadioGroupHarness, options).addOption(
      'name',
      options.name,
      this._checkRadioGroupName,
    );
  }
}

/**
 * Harness for interacting with a standard mat-radio-button in tests.
 *
 * 在测试中可与标准 mat-radio-button 进行交互的测试工具。
 *
 * @deprecated
 *
 * Use `MatRadioButtonHarness` from `@angular/material/radio/testing` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
export class MatLegacyRadioButtonHarness extends _MatRadioButtonHarnessBase {
  /**
   * The selector for the host element of a `MatRadioButton` instance.
   *
   * `MatRadioButton` 实例的宿主元素选择器。
   *
   */
  static hostSelector = '.mat-radio-button';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `MatRadioButtonHarness` that meets
   * certain criteria.
   *
   * 获取一个 `HarnessPredicate`，可用于搜索满足某些条件的 `MatRadioButtonHarness`。
   *
   * @param options Options for filtering which radio button instances are considered a match.
   *
   * 用于过滤哪些单选按钮实例应该视为匹配的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 使用给定选项配置过的 `HarnessPredicate`。
   *
   */
  static with(
    options: RadioButtonHarnessFilters = {},
  ): HarnessPredicate<MatLegacyRadioButtonHarness> {
    return new HarnessPredicate(MatLegacyRadioButtonHarness, options)
      .addOption('label', options.label, (harness, label) =>
        HarnessPredicate.stringMatches(harness.getLabelText(), label),
      )
      .addOption('name', options.name, async (harness, name) => (await harness.getName()) === name)
      .addOption(
        'checked',
        options.checked,
        async (harness, checked) => (await harness.isChecked()) == checked,
      );
  }

  protected _textLabel = this.locatorFor('.mat-radio-label-content');
  protected _clickLabel = this.locatorFor('.mat-radio-label');
}
