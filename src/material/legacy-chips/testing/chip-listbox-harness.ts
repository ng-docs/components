/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {HarnessPredicate, parallel} from '@angular/cdk/testing';
import {MatLegacyChipOptionHarness} from './chip-option-harness';
import {
  LegacyChipListboxHarnessFilters,
  LegacyChipOptionHarnessFilters,
} from './chip-harness-filters';
import {_MatChipListHarnessBase} from './chip-list-harness';

/**
 * Harness for interacting with a standard selectable chip list in tests.
 *
 * 在测试中用来与标准可选纸片列表进行交互的测试工具。
 *
 * @deprecated
 *
 * Use `MatChipListboxHarness` from `@angular/material/chips/testing` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
export class MatLegacyChipListboxHarness extends _MatChipListHarnessBase {
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
   * 获取一个 `HarnessPredicate`，它可以用来搜索满足一定条件 `MatChipListHarness`。
   *
   * @param options Options for filtering which chip list instances are considered a match.
   *
   * 一个选项，用于过滤哪些纸片列表实例的选项是匹配的。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 使用给定选项配置过的 `HarnessPredicate`。
   *
   */
  static with(
    options: LegacyChipListboxHarnessFilters = {},
  ): HarnessPredicate<MatLegacyChipListboxHarness> {
    return new HarnessPredicate(MatLegacyChipListboxHarness, options);
  }

  /**
   * Gets the list of chips inside the chip list.
   *
   * 获取纸片列表中的纸片列表。
   *
   * @param filter Optionally filters which chips are included.
   *
   * （可选项）用于过滤纸片。
   *
   */
  async getChips(
    filter: LegacyChipOptionHarnessFilters = {},
  ): Promise<MatLegacyChipOptionHarness[]> {
    return this.locatorForAll(MatLegacyChipOptionHarness.with(filter))();
  }

  /**
   * Selects a chip inside the chip list.
   *
   * 选定纸片列表中的纸片。
   *
   * @param filter An optional filter to apply to the child chips.
   *    All the chips matching the filter will be selected.
   *
   * 一个可选的过滤器，适用于子纸片。所有与过滤器匹配的纸片都会被选定。
   *
   */
  async selectChips(filter: LegacyChipOptionHarnessFilters = {}): Promise<void> {
    const chips = await this.getChips(filter);
    if (!chips.length) {
      throw Error(`Cannot find chip matching filter ${JSON.stringify(filter)}`);
    }
    await parallel(() => chips.map(chip => chip.select()));
  }
}
