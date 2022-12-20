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
import {
  ChipGridHarnessFilters,
  ChipInputHarnessFilters,
  ChipRowHarnessFilters,
} from './chip-harness-filters';
import {MatChipInputHarness} from './chip-input-harness';
import {MatChipRowHarness} from './chip-row-harness';

/**
 * Harness for interacting with a mat-chip-grid in tests.
 *
 * 用于在测试中与 mat-chip-grid 交互的组件测试工具。
 *
 */
export class MatChipGridHarness extends ComponentHarness {
  static hostSelector = '.mat-mdc-chip-grid';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a chip grid with specific attributes.
   *
   * 获取可用于搜索具有特定属性的纸片网格的 `HarnessPredicate` 。
   *
   * @param options Options for filtering which chip grid instances are considered a match.
   *
   * 用于过滤哪些纸片网格实例被视为匹配项的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 使用给定选项配置过的 `HarnessPredicate`。
   */
  static with<T extends MatChipGridHarness>(
    this: ComponentHarnessConstructor<T>,
    options: ChipGridHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options).addOption(
      'disabled',
      options.disabled,
      async (harness, disabled) => {
        return (await harness.isDisabled()) === disabled;
      },
    );
  }

  /**
   * Gets whether the chip grid is disabled.
   *
   * 获取此纸片网格是否已禁用。
   *
   */
  async isDisabled(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-disabled')) === 'true';
  }

  /**
   * Gets whether the chip grid is required.
   *
   * 获取此纸片网格是否必要的。
   *
   */
  async isRequired(): Promise<boolean> {
    return await (await this.host()).hasClass('mat-mdc-chip-list-required');
  }

  /**
   * Gets whether the chip grid is invalid.
   *
   * 获取此纸片网格是否无效。
   *
   */
  async isInvalid(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-invalid')) === 'true';
  }

  /**
   * Gets promise of the harnesses for the chip rows.
   *
   * 获得此纸片组件测试工具的 Promise。
   *
   */
  getRows(filter: ChipRowHarnessFilters = {}): Promise<MatChipRowHarness[]> {
    return this.locatorForAll(MatChipRowHarness.with(filter))();
  }

  /**
   * Gets promise of the chip text input harness.
   *
   * 获得此纸片文本输入组件测试工具的 Promise。
   *
   */
  getInput(filter: ChipInputHarnessFilters = {}): Promise<MatChipInputHarness | null> {
    return this.locatorFor(MatChipInputHarness.with(filter))();
  }
}
