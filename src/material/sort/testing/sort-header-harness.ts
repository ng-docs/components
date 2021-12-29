/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ComponentHarness, HarnessPredicate} from '@angular/cdk/testing';
import {SortDirection} from '@angular/material/sort';
import {SortHeaderHarnessFilters} from './sort-harness-filters';

/**
 * Harness for interacting with a standard Angular Material sort header in tests.
 *
 * 在测试中与标准 Angular Material 排序标题进行交互的测试工具。
 *
 */
export class MatSortHeaderHarness extends ComponentHarness {
  static hostSelector = '.mat-sort-header';
  private _container = this.locatorFor('.mat-sort-header-container');

  /**
   * Gets a `HarnessPredicate` that can be used to
   * search for a sort header with specific attributes.
   *
   * 获取一个 `HarnessPredicate`，该 HarnessPredicate 可用于搜索具有特定属性的排序标头。
   *
   */
  static with(options: SortHeaderHarnessFilters = {}): HarnessPredicate<MatSortHeaderHarness> {
    return new HarnessPredicate(MatSortHeaderHarness, options)
      .addOption('label', options.label, (harness, label) =>
        HarnessPredicate.stringMatches(harness.getLabel(), label),
      )
      .addOption('sortDirection', options.sortDirection, (harness, sortDirection) => {
        return HarnessPredicate.stringMatches(harness.getSortDirection(), sortDirection);
      });
  }

  /**
   * Gets the label of the sort header.
   *
   * 获取此排序标头的标签。
   *
   */
  async getLabel(): Promise<string> {
    return (await this._container()).text();
  }

  /**
   * Gets the sorting direction of the header.
   *
   * 获取此标头的排序方向。
   *
   */
  async getSortDirection(): Promise<SortDirection> {
    const host = await this.host();
    const ariaSort = await host.getAttribute('aria-sort');

    if (ariaSort === 'ascending') {
      return 'asc';
    } else if (ariaSort === 'descending') {
      return 'desc';
    }

    return '';
  }

  /**
   * Gets whether the sort header is currently being sorted by.
   *
   * 获取此排序标头是否当前正在被排序。
   *
   */
  async isActive(): Promise<boolean> {
    return !!(await this.getSortDirection());
  }

  /**
   * Whether the sort header is disabled.
   *
   * 此排序标头是否已禁用。
   *
   */
  async isDisabled(): Promise<boolean> {
    return (await this.host()).hasClass('mat-sort-header-disabled');
  }

  /**
   * Clicks the header to change its sorting direction. Only works if the header is enabled.
   *
   * 单击此标头以更改其排序方向。仅在启用标头的情况下有效。
   *
   */
  async click(): Promise<void> {
    return (await this.host()).click();
  }
}
