/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ComponentHarness, HarnessPredicate} from '@angular/cdk/testing';
import {LegacyOptionHarnessFilters} from './option-harness-filters';

/**
 * Harness for interacting with a `mat-option` in tests.
 *
 * 在测试中与 `mat-option` 进行交互的测试工具。
 *
 * @deprecated
 *
 * Use `MatOptionHarness` from `@angular/material/core/testing` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
export class MatLegacyOptionHarness extends ComponentHarness {
  /**
   * Selector used to locate option instances.
   *
   * 选择器，用于定位选项实例。
   *
   */
  static hostSelector = '.mat-option';

  /**
   * Element containing the option's text.
   *
   * 包含选项文本的元素。
   *
   */
  private _text = this.locatorFor('.mat-option-text');

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `MatOptionsHarness` that meets
   * certain criteria.
   *
   * 获取一个 `HarnessPredicate`，可用于搜索满足某些条件的 `MatOptionsHarness`。
   *
   * @param options Options for filtering which option instances are considered a match.
   *
   * 用于过滤哪些选项实例应该视为匹配的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 使用给定选项配置过的 `HarnessPredicate`。
   *
   */
  static with(options: LegacyOptionHarnessFilters = {}) {
    return new HarnessPredicate(MatLegacyOptionHarness, options)
      .addOption('text', options.text, async (harness, title) =>
        HarnessPredicate.stringMatches(await harness.getText(), title),
      )
      .addOption(
        'isSelected',
        options.isSelected,
        async (harness, isSelected) => (await harness.isSelected()) === isSelected,
      );
  }

  /**
   * Clicks the option.
   *
   * 单击此选项。
   *
   */
  async click(): Promise<void> {
    return (await this.host()).click();
  }

  /**
   * Gets the option's label text.
   *
   * 获取此选项的标签文本。
   *
   */
  async getText(): Promise<string> {
    return (await this._text()).text();
  }

  /**
   * Gets whether the option is disabled.
   *
   * 获取是否已禁用此选项。
   *
   */
  async isDisabled(): Promise<boolean> {
    return (await this.host()).hasClass('mat-option-disabled');
  }

  /**
   * Gets whether the option is selected.
   *
   * 获取是否选择了此选项。
   *
   */
  async isSelected(): Promise<boolean> {
    return (await this.host()).hasClass('mat-selected');
  }

  /**
   * Gets whether the option is active.
   *
   * 获取此选项是否处于活动状态。
   *
   */
  async isActive(): Promise<boolean> {
    return (await this.host()).hasClass('mat-active');
  }

  /**
   * Gets whether the option is in multiple selection mode.
   *
   * 获取此选项是否处于多选模式。
   *
   */
  async isMultiple(): Promise<boolean> {
    return (await this.host()).hasClass('mat-option-multiple');
  }
}
