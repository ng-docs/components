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
  parallel,
} from '@angular/cdk/testing';
import {ChipListboxHarnessFilters, ChipOptionHarnessFilters} from './chip-harness-filters';
import {MatChipOptionHarness} from './chip-option-harness';

/** Harness for interacting with a mat-chip-listbox in tests. */
export class MatChipListboxHarness extends ComponentHarness {
  static hostSelector = '.mat-mdc-chip-listbox';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a chip listbox with specific
   * attributes.
   *
   * 获取一个 `HarnessPredicate`，它可以用来搜索满足一定条件的 `MatChipListHarness`
   *
   * @param options Options for narrowing the search.
   *
   * 一个选项，用来过滤哪些些纸片列表实例是匹配的。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with<T extends MatChipListboxHarness>(
    this: ComponentHarnessConstructor<T>,
    options: ChipListboxHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options).addOption(
      'disabled',
      options.disabled,
      async (harness, disabled) => {
        return (await harness.isDisabled()) === disabled;
      },
    );
  }

  /** Gets whether the chip listbox is disabled. */
  async isDisabled(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-disabled')) === 'true';
  }

  /** Gets whether the chip listbox is required. */
  async isRequired(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-required')) === 'true';
  }

  /** Gets whether the chip listbox is in multi selection mode. */
  async isMultiple(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-multiselectable')) === 'true';
  }

  /** Gets whether the orientation of the chip list. */
  async getOrientation(): Promise<'horizontal' | 'vertical'> {
    const orientation = await (await this.host()).getAttribute('aria-orientation');
    return orientation === 'vertical' ? 'vertical' : 'horizontal';
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
