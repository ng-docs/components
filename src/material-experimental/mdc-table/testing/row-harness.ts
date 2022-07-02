/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ComponentHarnessConstructor, HarnessPredicate} from '@angular/cdk/testing';
import {_MatRowHarnessBase, RowHarnessFilters} from '@angular/material/table/testing';
import {MatCellHarness, MatHeaderCellHarness, MatFooterCellHarness} from './cell-harness';

/** Harness for interacting with an MDC-based Angular Material table row. */
export class MatRowHarness extends _MatRowHarnessBase<typeof MatCellHarness, MatCellHarness> {
  /**
   * The selector for the host element of a `MatRowHarness` instance.
   *
   * `MatRowHarness` 实例的宿主元素选择器。
   *
   */
  static hostSelector = '.mat-mdc-row';
  protected _cellHarness = MatCellHarness;

  /**
   * Gets a `HarnessPredicate` that can be used to search for a table row with specific attributes.
   *
   * 获取一个可用来使用指定属性搜索表行的 `HarnessPredicate`。
   *
   * @param options Options for narrowing the search
   *
   * 缩小搜索范围的选项
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with<T extends MatRowHarness>(
    this: ComponentHarnessConstructor<T>,
    options: RowHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options);
  }
}

/** Harness for interacting with an MDC-based Angular Material table header row. */
export class MatHeaderRowHarness extends _MatRowHarnessBase<
  typeof MatHeaderCellHarness,
  MatHeaderCellHarness
> {
  /**
   * The selector for the host element of a `MatHeaderRowHarness` instance.
   *
   * `MatHeaderRowHarness` 实例的宿主元素选择器。
   *
   */
  static hostSelector = '.mat-mdc-header-row';
  protected _cellHarness = MatHeaderCellHarness;

  /**
   * Gets a `HarnessPredicate` that can be used to search for a table header row with specific
   * attributes.
   *
   * 获取 `HarnessPredicate`，该 HarnessPredicate 可用于搜索具有特定属性的表标题行。
   *
   * @param options Options for narrowing the search
   *
   * 缩小搜索范围的选项
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with<T extends MatHeaderRowHarness>(
    this: ComponentHarnessConstructor<T>,
    options: RowHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options);
  }
}

/** Harness for interacting with an MDC-based Angular Material table footer row. */
export class MatFooterRowHarness extends _MatRowHarnessBase<
  typeof MatFooterCellHarness,
  MatFooterCellHarness
> {
  /**
   * The selector for the host element of a `MatFooterRowHarness` instance.
   *
   * `MatFooterRowHarness` 实例的宿主元素选择器。
   *
   */
  static hostSelector = '.mat-mdc-footer-row';
  protected _cellHarness = MatFooterCellHarness;

  /**
   * Gets a `HarnessPredicate` that can be used to search for a table footer row cell with specific
   * attributes.
   *
   * 获取 `HarnessPredicate`，该 HarnessPredicate 可用于搜索具有特定属性的表格页脚行单元格。
   *
   * @param options Options for narrowing the search
   *
   * 缩小搜索范围的选项
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with<T extends MatFooterRowHarness>(
    this: ComponentHarnessConstructor<T>,
    options: RowHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options);
  }
}
