/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ComponentHarnessConstructor, HarnessPredicate} from '@angular/cdk/testing';
import {MatSelectHarness} from '@angular/material-experimental/mdc-select/testing';
import {
  PaginatorHarnessFilters,
  _MatPaginatorHarnessBase,
} from '@angular/material/paginator/testing';

/** Harness for interacting with an MDC-based mat-paginator in tests. */
export class MatPaginatorHarness extends _MatPaginatorHarnessBase {
  /**
   * Selector used to find paginator instances.
   *
   * 用于查找分页器实例的选择器。
   *
   */
  static hostSelector = '.mat-mdc-paginator';
  protected _nextButton = this.locatorFor('.mat-mdc-paginator-navigation-next');
  protected _previousButton = this.locatorFor('.mat-mdc-paginator-navigation-previous');
  protected _firstPageButton = this.locatorForOptional('.mat-mdc-paginator-navigation-first');
  protected _lastPageButton = this.locatorForOptional('.mat-mdc-paginator-navigation-last');
  protected _select = this.locatorForOptional(
    MatSelectHarness.with({
      ancestor: '.mat-mdc-paginator-page-size',
    }),
  );
  protected _pageSizeFallback = this.locatorFor('.mat-mdc-paginator-page-size-value');
  protected _rangeLabel = this.locatorFor('.mat-mdc-paginator-range-label');

  /**
   * Gets a `HarnessPredicate` that can be used to search for a paginator with specific attributes.
   * @param options Options for filtering which paginator instances are considered a match.
   *
   * 用于过滤哪些分页器实例应该视为匹配项的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with<T extends MatPaginatorHarness>(
    this: ComponentHarnessConstructor<T>,
    options: PaginatorHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options);
  }
}
