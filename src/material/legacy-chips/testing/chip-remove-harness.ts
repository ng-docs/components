/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {HarnessPredicate, ComponentHarness} from '@angular/cdk/testing';
import {LegacyChipRemoveHarnessFilters} from './chip-harness-filters';

/**
 * Harness for interacting with a standard Material chip remove button in tests.
 *
 * 在测试过程中与标准 Material 纸片移除按钮交互的工具。
 *
 * @deprecated
 *
 * Use `MatChipRemoveHarness` from `@angular/material/chips/testing` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
export class MatLegacyChipRemoveHarness extends ComponentHarness {
  static hostSelector = '.mat-chip-remove';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `MatChipRemoveHarness` that meets
   * certain criteria.
   *
   * 获取一个 `HarnessPredicate`，它可以用来搜索满足一定条件 `MatChipRemoveHarness`。
   *
   * @param options Options for filtering which input instances are considered a match.
   *
   * 一个选项，用于筛选哪些输入框实例是匹配的。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 使用给定选项配置过的 `HarnessPredicate`。
   *
   */
  static with(
    options: LegacyChipRemoveHarnessFilters = {},
  ): HarnessPredicate<MatLegacyChipRemoveHarness> {
    return new HarnessPredicate(MatLegacyChipRemoveHarness, options);
  }

  /**
   * Clicks the remove button.
   *
   * 点击“删除”按钮。
   *
   */
  async click(): Promise<void> {
    return (await this.host()).click();
  }
}
