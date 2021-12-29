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
 * Harness for interacting with a standard mat-sidenav-content in tests.
 *
 * 在测试中用来与标准 mat-sidenav-content 进行交互的测试工具。
 *
 */
export class MatSidenavContentHarness extends ContentContainerComponentHarness<string> {
  /**
   * The selector for the host element of a `MatSidenavContent` instance.
   *
   * `MatSidenavContent` 实例的宿主元素选择器。
   *
   */
  static hostSelector = '.mat-sidenav-content';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `MatSidenavContentHarness` that
   * meets certain criteria.
   *
   * 获取一个 `HarnessPredicate`，可用于搜索满足某些条件的 `MatSidenavContentHarness`。
   *
   * @param options Options for filtering which sidenav content instances are considered a match.
   *
   * 用于过滤哪些 sidenav 内容实例应该视为匹配项的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with(
    options: DrawerContentHarnessFilters = {},
  ): HarnessPredicate<MatSidenavContentHarness> {
    return new HarnessPredicate(MatSidenavContentHarness, options);
  }
}
