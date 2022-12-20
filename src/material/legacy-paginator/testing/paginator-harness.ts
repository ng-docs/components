/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {HarnessPredicate} from '@angular/cdk/testing';
import {MatLegacySelectHarness} from '@angular/material/legacy-select/testing';
import {
  _MatPaginatorHarnessBase,
  PaginatorHarnessFilters,
} from '@angular/material/paginator/testing';

/**
 * Harness for interacting with a standard mat-paginator in tests.
 *
 * 在测试中可与标准 mat-paginator 进行交互的测试工具。
 *
 * @deprecated
 *
 * Use `MatPaginatorHarness` from `@angular/material/paginator/testing` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
export class MatLegacyPaginatorHarness extends _MatPaginatorHarnessBase {
  /**
   * Selector used to find paginator instances.
   *
   * 用于查找分页器实例的选择器。
   *
   */
  static hostSelector = '.mat-paginator';
  protected _nextButton = this.locatorFor('.mat-paginator-navigation-next');
  protected _previousButton = this.locatorFor('.mat-paginator-navigation-previous');
  protected _firstPageButton = this.locatorForOptional('.mat-paginator-navigation-first');
  protected _lastPageButton = this.locatorForOptional('.mat-paginator-navigation-last');
  protected _select = this.locatorForOptional(
    MatLegacySelectHarness.with({
      ancestor: '.mat-paginator-page-size',
    }),
  );
  protected _pageSizeFallback = this.locatorFor('.mat-paginator-page-size-value');
  protected _rangeLabel = this.locatorFor('.mat-paginator-range-label');

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `MatPaginatorHarness` that meets
   * certain criteria.
   *
   * 获取一个 `HarnessPredicate`，可用于搜索满足某些条件的 `MatPaginatorHarness`。
   *
   * @param options Options for filtering which paginator instances are considered a match.
   *
   * 用于过滤哪些分页器实例应该视为匹配项的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 使用给定选项配置过的 `HarnessPredicate`。
   *
   */
  static with(options: PaginatorHarnessFilters = {}): HarnessPredicate<MatLegacyPaginatorHarness> {
    return new HarnessPredicate(MatLegacyPaginatorHarness, options);
  }
}
