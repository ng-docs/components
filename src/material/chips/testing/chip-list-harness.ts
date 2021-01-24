/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ComponentHarness, HarnessPredicate, parallel} from '@angular/cdk/testing';
import {MatChipHarness} from './chip-harness';
import {MatChipInputHarness} from './chip-input-harness';
import {
  ChipListHarnessFilters,
  ChipHarnessFilters,
  ChipInputHarnessFilters,
} from './chip-harness-filters';

/**
 * Base class for chip list harnesses.
 *
 * 纸片列表测试工具的基类。
 *
 */
export abstract class _MatChipListHarnessBase extends ComponentHarness {
  /**
   * Gets whether the chip list is disabled.
   *
   * 获取纸片列表是否被禁用。
   *
   */
  async isDisabled(): Promise<boolean> {
    return await (await this.host()).getAttribute('aria-disabled') === 'true';
  }

  /**
   * Gets whether the chip list is required.
   *
   * 获取纸片列表是否必填的。
   *
   */
  async isRequired(): Promise<boolean> {
    return await (await this.host()).getAttribute('aria-required') === 'true';
  }

  /**
   * Gets whether the chip list is invalid.
   *
   * 获取纸片列表是否无效。
   *
   */
  async isInvalid(): Promise<boolean> {
    return await (await this.host()).getAttribute('aria-invalid') === 'true';
  }

  /**
   * Gets whether the chip list is in multi selection mode.
   *
   * 获取纸片列表是否处于多选模式。
   *
   */
  async isMultiple(): Promise<boolean> {
    return await (await this.host()).getAttribute('aria-multiselectable') === 'true';
  }

  /**
   * Gets whether the orientation of the chip list.
   *
   * 获取纸片列表的方向。
   *
   */
  async getOrientation(): Promise<'horizontal' | 'vertical'> {
    const orientation = await (await this.host()).getAttribute('aria-orientation');
    return orientation === 'vertical' ? 'vertical' : 'horizontal';
  }
}

/**
 * Harness for interacting with a standard chip list in tests.
 *
 * 在测试中与标准纸片列表进行交互的测试工具。
 *
 */
export class MatChipListHarness extends _MatChipListHarnessBase {
  /**
   * The selector for the host element of a `MatChipList` instance.
   *
   * `MatChipList` 实例的宿主元素的选择器。
   *
   */
  static hostSelector = '.mat-chip-list';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `MatChipListHarness` that meets
   * certain criteria.
   *
   * 获取一个 `HarnessPredicate` ，它可以用来搜索满足一定条件 `MatChipListHarness`
   *
   * @param options Options for filtering which chip list instances are considered a match.
   *
   * 一个选项，用于过滤哪些纸片列表实例的选项是匹配的。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with(options: ChipListHarnessFilters = {}): HarnessPredicate<MatChipListHarness> {
    return new HarnessPredicate(MatChipListHarness, options);
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
  async getChips(filter: ChipHarnessFilters = {}): Promise<MatChipHarness[]> {
    return this.locatorForAll(MatChipHarness.with(filter))();
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
   * @deprecated Use `MatChipListboxHarness.selectChips` instead.
   * @breaking-change 12.0.0
   */
  async selectChips(filter: ChipHarnessFilters = {}): Promise<void> {
    const chips = await this.getChips(filter);
    if (!chips.length) {
      throw Error(`Cannot find chip matching filter ${JSON.stringify(filter)}`);
    }
    await parallel(() => chips.map(chip => chip.select()));
  }

  /**
   * Gets the `MatChipInput` inside the chip list.
   *
   * 获取纸片列表中的 `MatChipInput`
   *
   * @param filter Optionally filters which chip input is included.
   *
   * 一个可选的过滤器，用于过滤纸片。。
   *
   */
  async getInput(filter: ChipInputHarnessFilters = {}): Promise<MatChipInputHarness> {
    // The input isn't required to be a descendant of the chip list so we have to look it up by id.
    const inputId = await (await this.host()).getAttribute('data-mat-chip-input');

    if (!inputId) {
      throw Error(`Chip list is not associated with an input`);
    }

    return this.documentRootLocatorFactory().locatorFor(
      MatChipInputHarness.with({...filter, selector: `#${inputId}`}))();
  }
}
