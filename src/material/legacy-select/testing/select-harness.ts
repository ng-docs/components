/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {HarnessPredicate} from '@angular/cdk/testing';
import {_MatSelectHarnessBase} from '@angular/material/select/testing';
import {
  MatLegacyOptionHarness,
  MatLegacyOptgroupHarness,
  LegacyOptionHarnessFilters,
  LegacyOptgroupHarnessFilters,
} from '@angular/material/legacy-core/testing';
import {LegacySelectHarnessFilters} from './select-harness-filters';

/**
 * Harness for interacting with a standard mat-select in tests.
 *
 * 在测试中与标准 mat-select 互动的测试工具。
 *
 * @deprecated
 *
 * Use `MatSelectHarness` from `@angular/material/select/testing` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
export class MatLegacySelectHarness extends _MatSelectHarnessBase<
  typeof MatLegacyOptionHarness,
  MatLegacyOptionHarness,
  LegacyOptionHarnessFilters,
  typeof MatLegacyOptgroupHarness,
  MatLegacyOptgroupHarness,
  LegacyOptgroupHarnessFilters
> {
  static hostSelector = '.mat-select';
  protected _prefix = 'mat';
  protected _optionClass = MatLegacyOptionHarness;
  protected _optionGroupClass = MatLegacyOptgroupHarness;

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `MatSelectHarness` that meets
   * certain criteria.
   *
   * 获取一个 `HarnessPredicate`，可用于搜索满足某些条件的 `MatSelectHarness`。
   *
   * @param options Options for filtering which select instances are considered a match.
   *
   * 用于筛选哪些选择实例应该视为匹配项的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 使用给定选项配置过的 `HarnessPredicate`。
   *
   */
  static with(options: LegacySelectHarnessFilters = {}): HarnessPredicate<MatLegacySelectHarness> {
    return new HarnessPredicate(MatLegacySelectHarness, options).addOption(
      'disabled',
      options.disabled,
      async (harness, disabled) => {
        return (await harness.isDisabled()) === disabled;
      },
    );
  }
}
