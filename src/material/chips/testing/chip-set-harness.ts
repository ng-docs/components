/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  ComponentHarnessConstructor,
  ComponentHarness,
  HarnessPredicate,
} from '@angular/cdk/testing';
import {MatChipHarness} from './chip-harness';
import {ChipHarnessFilters, ChipSetHarnessFilters} from './chip-harness-filters';

/**
 * Harness for interacting with a mat-chip-set in tests.
 *
 * 用于在测试中与 mat-chip-set 交互的组件测试工具。
 *
 */
export class MatChipSetHarness extends ComponentHarness {
  static hostSelector = '.mat-mdc-chip-set';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a chip set with specific attributes.
   *
   * 获取可用于搜索具有特定属性的纸片组的 `HarnessPredicate` 。
   *
   * @param options Options for filtering which chip set instances are considered a match.
   *
   * 用于过滤哪些纸片组实例会被视为匹配项的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 使用给定选项配置过的 `HarnessPredicate`。
   */
  static with<T extends MatChipSetHarness>(
    this: ComponentHarnessConstructor<T>,
    options: ChipSetHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options);
  }

  /**
   * Gets promise of the harnesses for the chips.
   *
   * 获得纸片组件测试工具的 Promise。
   *
   */
  async getChips(filter: ChipHarnessFilters = {}): Promise<MatChipHarness[]> {
    return await this.locatorForAll(MatChipHarness.with(filter))();
  }
}
