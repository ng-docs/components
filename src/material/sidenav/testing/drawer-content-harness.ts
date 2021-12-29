/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ContentContainerComponentHarness, HarnessPredicate} from '@angular/cdk/testing';
import {DrawerContentHarnessFilters} from './drawer-harness-filters';

/**
 * Harness for interacting with a standard mat-drawer-content in tests.
 *
 * 在测试中用来与标准 mat-drawer-content 进行交互的测试工具。
 *
 */
export class MatDrawerContentHarness extends ContentContainerComponentHarness<string> {
  /**
   * The selector for the host element of a `MatDrawerContent` instance.
   *
   * `MatDrawerContent` 实例的宿主元素选择器。
   *
   */
  static hostSelector = '.mat-drawer-content';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `MatDrawerContentHarness` that
   * meets certain criteria.
   *
   * 获取一个 `HarnessPredicate`，该 HarnessPredicate 可用于搜索满足某些条件的 `MatDrawerContentHarness`。
   *
   * @param options Options for filtering which drawer content instances are considered a match.
   *
   * 用于过滤哪些抽屉式内容实例应该视为匹配项的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with(
    options: DrawerContentHarnessFilters = {},
  ): HarnessPredicate<MatDrawerContentHarness> {
    return new HarnessPredicate(MatDrawerContentHarness, options);
  }
}
