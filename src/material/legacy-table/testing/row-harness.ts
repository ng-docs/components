/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {HarnessPredicate} from '@angular/cdk/testing';
import {
  MatLegacyCellHarness,
  MatLegacyFooterCellHarness,
  MatLegacyHeaderCellHarness,
} from './cell-harness';
import {_MatRowHarnessBase, RowHarnessFilters} from '@angular/material/table/testing';

/**
 * Harness for interacting with a standard Angular Material table row.
 *
 * 与标准 Angular Material 表行进行交互的测试工具。
 *
 * @deprecated
 *
 * Use `MatRowHarness` from `@angular/material/table/testing` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
export class MatLegacyRowHarness extends _MatRowHarnessBase<
  typeof MatLegacyCellHarness,
  MatLegacyCellHarness
> {
  /**
   * The selector for the host element of a `MatRowHarness` instance.
   *
   * `MatRowHarness` 实例的宿主元素选择器。
   *
   */
  static hostSelector = '.mat-row';
  protected _cellHarness = MatLegacyCellHarness;

  /**
   * Gets a `HarnessPredicate` that can be used to search for a table row with specific attributes.
   *
   * 获取一个可用来使用指定属性搜索表行的 `HarnessPredicate`。
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
  static with(options: RowHarnessFilters = {}): HarnessPredicate<MatLegacyRowHarness> {
    return new HarnessPredicate(MatLegacyRowHarness, options);
  }
}

/**
 * Harness for interacting with a standard Angular Material table header row.
 *
 * 与标准 Angular Material 表标题行进行交互的测试工具。
 *
 * @deprecated
 *
 * Use `MatHeaderRowHarness` from `@angular/material/table/testing` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
export class MatLegacyHeaderRowHarness extends _MatRowHarnessBase<
  typeof MatLegacyHeaderCellHarness,
  MatLegacyHeaderCellHarness
> {
  /**
   * The selector for the host element of a `MatHeaderRowHarness` instance.
   *
   * `MatHeaderRowHarness` 实例的宿主元素选择器。
   *
   */
  static hostSelector = '.mat-header-row';
  protected _cellHarness = MatLegacyHeaderCellHarness;

  /**
   * Gets a `HarnessPredicate` that can be used to search for
   * a table header row with specific attributes.
   *
   * 获取 `HarnessPredicate`，该 HarnessPredicate 可用于搜索具有特定属性的表标题行。
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
  static with(options: RowHarnessFilters = {}): HarnessPredicate<MatLegacyHeaderRowHarness> {
    return new HarnessPredicate(MatLegacyHeaderRowHarness, options);
  }
}

/**
 * Harness for interacting with a standard Angular Material table footer row.
 *
 * 与标准 Angular Material 表的页脚行进行交互的测试工具。
 *
 * @deprecated
 *
 * Use `MatFooterRowHarness` from `@angular/material/table/testing` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
export class MatLegacyFooterRowHarness extends _MatRowHarnessBase<
  typeof MatLegacyFooterCellHarness,
  MatLegacyFooterCellHarness
> {
  /**
   * The selector for the host element of a `MatFooterRowHarness` instance.
   *
   * `MatFooterRowHarness` 实例的宿主元素选择器。
   *
   */
  static hostSelector = '.mat-footer-row';
  protected _cellHarness = MatLegacyFooterCellHarness;

  /**
   * Gets a `HarnessPredicate` that can be used to search for
   * a table footer row cell with specific attributes.
   *
   * 获取 `HarnessPredicate`，该 HarnessPredicate 可用于搜索具有特定属性的表格页脚行单元格。
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
  static with(options: RowHarnessFilters = {}): HarnessPredicate<MatLegacyFooterRowHarness> {
    return new HarnessPredicate(MatLegacyFooterRowHarness, options);
  }
}
