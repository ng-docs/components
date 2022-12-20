/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ComponentHarnessConstructor, HarnessPredicate} from '@angular/cdk/testing';
import {MatChipHarness} from './chip-harness';
import {ChipOptionHarnessFilters} from './chip-harness-filters';

/** Harness for interacting with a mat-chip-option in tests. */
export class MatChipOptionHarness extends MatChipHarness {
  static override hostSelector = '.mat-mdc-chip-option';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a chip option with specific
   * attributes.
   *
   * 获取一个 `HarnessPredicate`，它可以用来搜索满足一定条件 `MatChipOptionHarness`
   *
   * @param options Options for narrowing the search.
   *
   * 一个选项，用来过滤哪些纸片实例是匹配的。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static override with<T extends MatChipHarness>(
    this: ComponentHarnessConstructor<T>,
    options: ChipOptionHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(MatChipOptionHarness, options)
      .addOption('text', options.text, (harness, label) =>
        HarnessPredicate.stringMatches(harness.getText(), label),
      )
      .addOption(
        'selected',
        options.selected,
        async (harness, selected) => (await harness.isSelected()) === selected,
      ) as unknown as HarnessPredicate<T>;
  }

  /**
   * Whether the chip is selected.
   *
   * 纸片是否被选定。
   *
   */
  async isSelected(): Promise<boolean> {
    return (await this.host()).hasClass('mat-mdc-chip-selected');
  }

  /**
   * Selects the given chip. Only applies if it's selectable.
   *
   * 选择指定的纸片。仅当它可以选择时才适用。
   *
   */
  async select(): Promise<void> {
    if (!(await this.isSelected())) {
      await this.toggle();
    }
  }

  /**
   * Deselects the given chip. Only applies if it's selectable.
   *
   * 取消选择指定的纸片。仅当它可以选择时才适用。
   *
   */
  async deselect(): Promise<void> {
    if (await this.isSelected()) {
      await this.toggle();
    }
  }

  /**
   * Toggles the selected state of the given chip.
   *
   * 切换指定纸片的选定状态。
   *
   */
  async toggle(): Promise<void> {
    return (await this._primaryAction()).click();
  }
}
