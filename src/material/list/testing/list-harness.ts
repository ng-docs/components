/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ComponentHarnessConstructor, HarnessPredicate} from '@angular/cdk/testing';
import {MatListHarnessBase} from './list-harness-base';
import {ListHarnessFilters, ListItemHarnessFilters} from './list-harness-filters';
import {getListItemPredicate, MatListItemHarnessBase} from './list-item-harness-base';

/**
 * Harness for interacting with a MDC-based list in tests.
 *
 * 在测试中用来与标准 mat-list 进行交互的测试工具。
 *
 */
export class MatListHarness extends MatListHarnessBase<
  typeof MatListItemHarness,
  MatListItemHarness,
  ListItemHarnessFilters
> {
  /**
   * The selector for the host element of a `MatList` instance.
   *
   * `MatList` 实例的宿主元素选择器。
   *
   */
  static hostSelector = '.mat-mdc-list';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a list with specific attributes.
   *
   * 获取一个 `HarnessPredicate`，可用于搜索满足某些条件的 `MatListHarness`。
   *
   * @param options Options for filtering which list instances are considered a match.
   *
   * 用于过滤哪些列表实例应该视为匹配项的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with<T extends MatListHarness>(
    this: ComponentHarnessConstructor<T>,
    options: ListHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options);
  }

  override _itemHarness = MatListItemHarness;
}

/**
 * Harness for interacting with a list item.
 *
 * 与列表项进行交互的测试工具。
 *
 */
export class MatListItemHarness extends MatListItemHarnessBase {
  /**
   * The selector for the host element of a `MatListItem` instance.
   *
   * `MatListItem` 实例的宿主元素选择器。
   *
   */
  static hostSelector = `${MatListHarness.hostSelector} .mat-mdc-list-item`;

  /**
   * Gets a `HarnessPredicate` that can be used to search for a list item with specific attributes.
   *
   * 获取一个 `HarnessPredicate`，该 HarnessPredicate 可用于搜索满足某些条件的 `MatListItemHarness`。
   *
   * @param options Options for filtering which list item instances are considered a match.
   *
   * 用于过滤哪些列表项实例应该视为匹配项的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with<T extends MatListItemHarness>(
    this: ComponentHarnessConstructor<T>,
    options: ListItemHarnessFilters = {},
  ): HarnessPredicate<T> {
    return getListItemPredicate(this, options);
  }
}
