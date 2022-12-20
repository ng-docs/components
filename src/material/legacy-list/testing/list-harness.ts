/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {HarnessPredicate} from '@angular/cdk/testing';
import {MatLegacyListHarnessBase} from './list-harness-base';
import {LegacyListHarnessFilters, LegacyListItemHarnessFilters} from './list-harness-filters';
import {getListItemPredicate, MatLegacyListItemHarnessBase} from './list-item-harness-base';

/**
 * Harness for interacting with a standard mat-list in tests.
 *
 * 在测试中用来与标准 mat-list 进行交互的测试工具。
 *
 * @deprecated
 *
 * Use `MatListHarness` from `@angular/material/list/testing` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
export class MatLegacyListHarness extends MatLegacyListHarnessBase<
  typeof MatLegacyListItemHarness,
  MatLegacyListItemHarness,
  LegacyListItemHarnessFilters
> {
  /**
   * The selector for the host element of a `MatList` instance.
   *
   * `MatList` 实例的宿主元素选择器。
   *
   */
  static hostSelector = '.mat-list:not(mat-action-list)';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `MatListHarness` that meets certain
   * criteria.
   *
   * 获取一个 `HarnessPredicate`，可用于搜索满足某些条件的 `MatListHarness`。
   *
   * @param options Options for filtering which list instances are considered a match.
   *
   * 用于过滤哪些列表实例应该视为匹配项的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 使用给定选项配置过的 `HarnessPredicate`。
   *
   */
  static with(options: LegacyListHarnessFilters = {}): HarnessPredicate<MatLegacyListHarness> {
    return new HarnessPredicate(MatLegacyListHarness, options);
  }

  override _itemHarness = MatLegacyListItemHarness;
}

/**
 * Harness for interacting with a list item.
 *
 * 与列表项进行交互的测试工具。
 *
 * @deprecated
 *
 * Use `MatListItemHarness` from `@angular/material/list/testing` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
export class MatLegacyListItemHarness extends MatLegacyListItemHarnessBase {
  /**
   * The selector for the host element of a `MatListItem` instance.
   *
   * `MatListItem` 实例的宿主元素选择器。
   *
   */
  static hostSelector = `${MatLegacyListHarness.hostSelector} .mat-list-item`;

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `MatListItemHarness` that meets
   * certain criteria.
   *
   * 获取一个 `HarnessPredicate`，该 HarnessPredicate 可用于搜索满足某些条件的 `MatListItemHarness`。
   *
   * @param options Options for filtering which list item instances are considered a match.
   *
   * 用于过滤哪些列表项实例应该视为匹配项的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 使用给定选项配置过的 `HarnessPredicate`。
   *
   */
  static with(
    options: LegacyListItemHarnessFilters = {},
  ): HarnessPredicate<MatLegacyListItemHarness> {
    return getListItemPredicate(MatLegacyListItemHarness, options);
  }
}
