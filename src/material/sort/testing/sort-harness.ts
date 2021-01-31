/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ComponentHarness, HarnessPredicate} from '@angular/cdk/testing';
import {SortHarnessFilters, SortHeaderHarnessFilters} from './sort-harness-filters';
import {MatSortHeaderHarness} from './sort-header-harness';

/** Harness for interacting with a standard `mat-sort` in tests. */
export class MatSortHarness extends ComponentHarness {
  static hostSelector = '.mat-sort';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `mat-sort` with specific attributes.
   *
   * 获取一个可用来使用指定属性搜索 `mat-sort` 的 `HarnessPredicate`。
   *
   * @param options Options for narrowing the search.
   *
   * 用来收窄搜索范围的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with(options: SortHarnessFilters = {}): HarnessPredicate<MatSortHarness> {
    return new HarnessPredicate(MatSortHarness, options);
  }

  /** Gets all of the sort headers in the `mat-sort`. */
  async getSortHeaders(filter: SortHeaderHarnessFilters = {}): Promise<MatSortHeaderHarness[]> {
    return this.locatorForAll(MatSortHeaderHarness.with(filter))();
  }

  /** Gets the selected header in the `mat-sort`. */
  async getActiveHeader(): Promise<MatSortHeaderHarness|null> {
    const headers = await this.getSortHeaders();
    for (let i = 0; i < headers.length; i++) {
      if (await headers[i].isActive()) {
        return headers[i];
      }
    }
    return null;
  }
}
