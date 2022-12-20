/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {HarnessPredicate} from '@angular/cdk/testing';
import {coerceBooleanProperty} from '@angular/cdk/coercion';
import {
  _MatSlideToggleHarnessBase,
  SlideToggleHarnessFilters,
} from '@angular/material/slide-toggle/testing';

/**
 * Harness for interacting with a standard mat-slide-toggle in tests.
 *
 * 在测试中可与标准的 mat-slide-toggle 进行交互的测试工具。
 *
 * @deprecated
 *
 * Use `MatSlideToggleHarness` from `@angular/material/slide-toggle/testing` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
export class MatLegacySlideToggleHarness extends _MatSlideToggleHarnessBase {
  private _inputContainer = this.locatorFor('.mat-slide-toggle-bar');
  protected _nativeElement = this.locatorFor('input');

  /**
   * The selector for the host element of a `MatSlideToggle` instance.
   *
   * `MatSlideToggle` 实例的宿主元素选择器。
   *
   */
  static hostSelector = '.mat-slide-toggle';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `MatSlideToggleHarness` that meets
   * certain criteria.
   *
   * 获取一个 `HarnessPredicate`，可用于搜索满足某些条件的 `MatSlideToggleHarness`。
   *
   * @param options Options for filtering which slide toggle instances are considered a match.
   *
   * 用于筛选哪些滑块开关实例应该视为匹配项的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 使用给定选项配置过的 `HarnessPredicate`。
   *
   */
  static with(
    options: SlideToggleHarnessFilters = {},
  ): HarnessPredicate<MatLegacySlideToggleHarness> {
    return (
      new HarnessPredicate(MatLegacySlideToggleHarness, options)
        .addOption('label', options.label, (harness, label) =>
          HarnessPredicate.stringMatches(harness.getLabelText(), label),
        )
        // We want to provide a filter option for "name" because the name of the slide-toggle is
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
        .addOption(
          'disabled',
          options.disabled,
          async (harness, disabled) => (await harness.isDisabled()) == disabled,
        )
    );
  }

  /**
   * Toggle the checked state of the slide-toggle.
   *
   * 此滑块开关的选中状态。
   *
   */
  async toggle(): Promise<void> {
    return (await this._inputContainer()).click();
  }

  /**
   * Whether the slide-toggle is checked.
   *
   * 是否选中滑块开关。
   *
   */
  async isChecked(): Promise<boolean> {
    const checked = (await this._nativeElement()).getProperty<boolean>('checked');
    return coerceBooleanProperty(await checked);
  }
}
