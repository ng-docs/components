/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {HarnessPredicate} from '@angular/cdk/testing';
import {MatDrawerHarnessBase} from './drawer-harness';
import {DrawerHarnessFilters} from './drawer-harness-filters';

/**
 * Harness for interacting with a standard mat-sidenav in tests.
 *
 * 在测试中用来与标准 mat-sidenav 进行交互的测试工具。
 *
 */
export class MatSidenavHarness extends MatDrawerHarnessBase {
  /**
   * The selector for the host element of a `MatSidenav` instance.
   *
   * `MatSidenav` 实例的宿主元素选择器。
   *
   */
  static hostSelector = '.mat-sidenav';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `MatSidenavHarness` that meets
   * certain criteria.
   *
   * 获取一个 `HarnessPredicate`，可用于搜索满足某些条件的 `MatSidenavHarness`。
   *
   * @param options Options for filtering which sidenav instances are considered a match.
   *
   * 用于过滤哪些 sidenav 实例应该视为匹配的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with(options: DrawerHarnessFilters = {}): HarnessPredicate<MatSidenavHarness> {
    return new HarnessPredicate(MatSidenavHarness, options).addOption(
      'position',
      options.position,
      async (harness, position) => (await harness.getPosition()) === position,
    );
  }

  /**
   * Whether the sidenav is fixed in the viewport.
   *
   * 侧边导航是否在视口中是固定的。
   *
   */
  async isFixedInViewport(): Promise<boolean> {
    return (await this.host()).hasClass('mat-sidenav-fixed');
  }
}
