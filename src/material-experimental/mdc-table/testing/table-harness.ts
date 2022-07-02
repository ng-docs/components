/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ComponentHarnessConstructor, HarnessPredicate} from '@angular/cdk/testing';
import {TableHarnessFilters, _MatTableHarnessBase} from '@angular/material/table/testing';
import {MatRowHarness, MatHeaderRowHarness, MatFooterRowHarness} from './row-harness';

/** Harness for interacting with an MDC-based mat-table in tests. */
export class MatTableHarness extends _MatTableHarnessBase<
  typeof MatHeaderRowHarness,
  MatHeaderRowHarness,
  typeof MatRowHarness,
  MatRowHarness,
  typeof MatFooterRowHarness,
  MatFooterRowHarness
> {
  /**
   * The selector for the host element of a `MatTableHarness` instance.
   *
   * `MatTableHarness` 实例的宿主元素选择器。
   *
   */
  static hostSelector = '.mat-mdc-table';
  protected _headerRowHarness = MatHeaderRowHarness;
  protected _rowHarness = MatRowHarness;
  protected _footerRowHarness = MatFooterRowHarness;

  /**
   * Gets a `HarnessPredicate` that can be used to search for a table with specific attributes.
   *
   * 获取一个 `HarnessPredicate`，该 HarnessPredicate 可用于搜索具有特定属性的表。
   *
   * @param options Options for narrowing the search
   *
   * 缩小搜索范围的选项
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with<T extends MatTableHarness>(
    this: ComponentHarnessConstructor<T>,
    options: TableHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options);
  }
}
