/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {HarnessPredicate} from '@angular/cdk/testing';
import {_MatCellHarnessBase, CellHarnessFilters} from '@angular/material/table/testing';

/**
 * Harness for interacting with a standard Angular Material table cell.
 *
 * 与标准 Angular Material 表的单元格进行交互的测试工具。
 *
 * @deprecated
 *
 * Use `MatCellHarness` from `@angular/material/table/testing` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
export class MatLegacyCellHarness extends _MatCellHarnessBase {
  /**
   * The selector for the host element of a `MatCellHarness` instance.
   *
   * `MatCellHarness` 实例的宿主元素选择器。
   *
   */
  static hostSelector = '.mat-cell';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a table cell with specific attributes.
   *
   * 获取一个可用来使用指定属性搜索表格中单元格的 `HarnessPredicate`。
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
  static with(options: CellHarnessFilters = {}): HarnessPredicate<MatLegacyCellHarness> {
    return _MatCellHarnessBase._getCellPredicate(this, options);
  }
}

/**
 * Harness for interacting with a standard Angular Material table header cell.
 *
 * 与标准 Angular Material 表的标题单元进行交互的测试工具。
 *
 * @deprecated
 *
 * Use `MatHeaderCellHarness` from `@angular/material/table/testing` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
export class MatLegacyHeaderCellHarness extends _MatCellHarnessBase {
  /**
   * The selector for the host element of a `MatHeaderCellHarness` instance.
   *
   * `MatHeaderCellHarness` 实例的宿主元素选择器。
   *
   */
  static hostSelector = '.mat-header-cell';

  /**
   * Gets a `HarnessPredicate` that can be used to search for
   * a table header cell with specific attributes.
   *
   * 获取一个 `HarnessPredicate`，用于搜索具有特定属性的表头单元格。
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
  static with(options: CellHarnessFilters = {}): HarnessPredicate<MatLegacyHeaderCellHarness> {
    return _MatCellHarnessBase._getCellPredicate(this, options);
  }
}

/**
 * Harness for interacting with a standard Angular Material table footer cell.
 *
 * 与标准 Angular Material 表格的页脚单元进行交互的测试工具。
 *
 * @deprecated
 *
 * Use `MatFooterCellHarness` from `@angular/material/table/testing` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
export class MatLegacyFooterCellHarness extends _MatCellHarnessBase {
  /**
   * The selector for the host element of a `MatFooterCellHarness` instance.
   *
   * `MatFooterCellHarness` 实例的宿主元素选择器。
   *
   */
  static hostSelector = '.mat-footer-cell';

  /**
   * Gets a `HarnessPredicate` that can be used to search for
   * a table footer cell with specific attributes.
   *
   * 获取一个 `HarnessPredicate`，用于搜索具有特定属性的表格页脚单元格。
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
  static with(options: CellHarnessFilters = {}): HarnessPredicate<MatLegacyFooterCellHarness> {
    return _MatCellHarnessBase._getCellPredicate(this, options);
  }
}
