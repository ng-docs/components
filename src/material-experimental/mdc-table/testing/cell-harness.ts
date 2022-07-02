/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ComponentHarnessConstructor, HarnessPredicate} from '@angular/cdk/testing';
import {
  MatCellHarness as BaseMatCellHarness,
  MatHeaderCellHarness as BaseMatHeaderCellHarness,
  MatFooterCellHarness as BaseMatFooterCellHarness,
  CellHarnessFilters,
} from '@angular/material/table/testing';

/** Harness for interacting with an MDC-based Angular Material table cell. */
export class MatCellHarness extends BaseMatCellHarness {
  /**
   * The selector for the host element of a `MatCellHarness` instance.
   *
   * `MatCellHarness` 实例的宿主元素选择器。
   *
   */
  static override hostSelector = '.mat-mdc-cell';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a table cell with specific attributes.
   *
   * 获取一个可用来使用指定属性搜索表格中单元格的 `HarnessPredicate`。
   *
   * @param options Options for narrowing the search
   *
   * 缩小搜索范围的选项
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static override with<T extends MatCellHarness>(
    this: ComponentHarnessConstructor<T>,
    options: CellHarnessFilters = {},
  ): HarnessPredicate<T> {
    return BaseMatCellHarness._getCellPredicate(this, options);
  }
}

/** Harness for interacting with an MDC-based Angular Material table header cell. */
export class MatHeaderCellHarness extends BaseMatHeaderCellHarness {
  /**
   * The selector for the host element of a `MatHeaderCellHarness` instance.
   *
   * `MatHeaderCellHarness` 实例的宿主元素选择器。
   *
   */
  static override hostSelector = '.mat-mdc-header-cell';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a table header cell with specific
   * attributes.
   *
   * 获取一个 `HarnessPredicate`，用于搜索具有特定属性的表头单元格。
   *
   * @param options Options for narrowing the search
   *
   * 缩小搜索范围的选项
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static override with<T extends MatHeaderCellHarness>(
    this: ComponentHarnessConstructor<T>,
    options: CellHarnessFilters = {},
  ): HarnessPredicate<T> {
    return BaseMatHeaderCellHarness._getCellPredicate(this, options);
  }
}

/** Harness for interacting with an MDC-based Angular Material table footer cell. */
export class MatFooterCellHarness extends BaseMatFooterCellHarness {
  /**
   * The selector for the host element of a `MatFooterCellHarness` instance.
   *
   * `MatFooterCellHarness` 实例的宿主元素选择器。
   *
   */
  static override hostSelector = '.mat-mdc-footer-cell';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a table footer cell with specific
   * attributes.
   *
   * 获取一个 `HarnessPredicate`，用于搜索具有特定属性的表格页脚单元格。
   *
   * @param options Options for narrowing the search
   *
   * 缩小搜索范围的选项
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static override with<T extends MatFooterCellHarness>(
    this: ComponentHarnessConstructor<T>,
    options: CellHarnessFilters = {},
  ): HarnessPredicate<T> {
    return BaseMatFooterCellHarness._getCellPredicate(this, options);
  }
}
