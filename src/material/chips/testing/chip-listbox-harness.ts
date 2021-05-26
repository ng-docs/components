/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {HarnessPredicate, parallel} from '@angular/cdk/testing';
import {MatChipOptionHarness} from './chip-option-harness';
import {
  ChipListboxHarnessFilters,
  ChipOptionHarnessFilters,
} from './chip-harness-filters';
import {_MatChipListHarnessBase} from './chip-list-harness';

/**
 * Harness for interacting with a standard selectable chip list in tests.
 *
 * 在测试中用来与标准可选纸片列表进行交互的测试工具。
 *
 */
export class MatChipListboxHarness extends _MatChipListHarnessBase {
  /**
   * The selector for the host element of a `MatChipList` instance.
   *
   * `MatChipList` 实例的宿主元素选择器。
   *
   */
  static hostSelector = '.mat-chip-list';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `MatChipListHarness` that meets
   * certain criteria.
   *
   * 获取一个 `HarnessPredicate`，它可以用来搜索满足一定条件的 `MatChipListHarness`
   *
   * @param options Options for filtering which chip list instances are considered a match.
   *
   * 一个选项，用来过滤哪些些纸片列表实例是匹配的。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with(options: ChipListboxHarnessFilters = {}):
    HarnessPredicate<MatChipListboxHarness> {
    return new HarnessPredicate(MatChipListboxHarness, options);
  }

  /**
   * Gets the list of chips inside the chip list.
   *
   * 获取纸片列表中的各个纸片。
   *
   * @param filter Optionally filters which chips are included.
   *
   * 可选择过滤哪些纸片。
   *
   */
  async getChips(filter: ChipOptionHarnessFilters = {}): Promise<MatChipOptionHarness[]> {
    return this.locatorForAll(MatChipOptionHarness.with(filter))();
  }

  /**
   * Selects a chip inside the chip list.
   *
   * 选择纸片列表中的纸片。
   *
   * @param filter An optional filter to apply to the child chips.
   *    All the chips matching the filter will be selected.
   *
   * 一个可选的过滤器，适用于子纸片。所有与过滤器匹配的纸片都会被选定。
   *
   */
  async selectChips(filter: ChipOptionHarnessFilters = {}): Promise<void> {
    const chips = await this.getChips(filter);
    if (!chips.length) {
      throw Error(`Cannot find chip matching filter ${JSON.stringify(filter)}`);
    }
    await parallel(() => chips.map(chip => chip.select()));
  }
}
