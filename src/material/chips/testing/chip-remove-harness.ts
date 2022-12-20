/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  ComponentHarness,
  ComponentHarnessConstructor,
  HarnessPredicate,
} from '@angular/cdk/testing';
import {ChipRemoveHarnessFilters} from './chip-harness-filters';

/**
 * Harness for interacting with a standard Material chip remove button in tests.
 *
 * 在测试过程中与标准 Material 纸片移除按钮交互的工具。
 *
 */
export class MatChipRemoveHarness extends ComponentHarness {
  static hostSelector = '.mat-mdc-chip-remove';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a chip remove with specific
   * attributes.
   *
   * 获取一个 `HarnessPredicate`，它可以用来搜索满足一定条件 `MatChipRemoveHarness`
   *
   * @param options Options for filtering which input instances are considered a match.
   *
   * 一个选项，用来筛选哪些输入框实例是匹配的。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with<T extends MatChipRemoveHarness>(
    this: ComponentHarnessConstructor<T>,
    options: ChipRemoveHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options);
  }

  /**
   * Clicks the remove button.
   *
   * 点击“删除”按钮。
   *
   */
  async click(): Promise<void> {
    return (await this.host()).click();
  }
}
