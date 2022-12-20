/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {HarnessPredicate} from '@angular/cdk/testing';
import {
  MatLegacyFooterRowHarness,
  MatLegacyHeaderRowHarness,
  MatLegacyRowHarness,
} from './row-harness';
import {_MatTableHarnessBase, TableHarnessFilters} from '@angular/material/table/testing';

/**
 * Harness for interacting with a standard mat-table in tests.
 *
 * 在测试中与标准 mat-table 进行交互的测试工具。
 *
 * @deprecated
 *
 * Use `MatTableHarness` from `@angular/material/table/testing` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
export class MatLegacyTableHarness extends _MatTableHarnessBase<
  typeof MatLegacyHeaderRowHarness,
  MatLegacyHeaderRowHarness,
  typeof MatLegacyRowHarness,
  MatLegacyRowHarness,
  typeof MatLegacyFooterRowHarness,
  MatLegacyFooterRowHarness
> {
  /**
   * The selector for the host element of a `MatTableHarness` instance.
   *
   * `MatTableHarness` 实例的宿主元素选择器。
   *
   */
  static hostSelector = '.mat-table';
  protected _headerRowHarness = MatLegacyHeaderRowHarness;
  protected _rowHarness = MatLegacyRowHarness;
  protected _footerRowHarness = MatLegacyFooterRowHarness;

  /**
   * Gets a `HarnessPredicate` that can be used to search for a table with specific attributes.
   *
   * 获取一个 `HarnessPredicate`，该 HarnessPredicate 可用于搜索具有特定属性的表。
   *
   * @param options Options for narrowing the search
   *
   * 用来收窄搜索范围的选项：
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 使用给定选项配置过的 `HarnessPredicate`。
   *
   */
  static with(options: TableHarnessFilters = {}): HarnessPredicate<MatLegacyTableHarness> {
    return new HarnessPredicate(MatLegacyTableHarness, options);
  }
}
