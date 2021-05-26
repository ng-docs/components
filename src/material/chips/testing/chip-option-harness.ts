/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {HarnessPredicate} from '@angular/cdk/testing';
import {MatChipHarness} from './chip-harness';
import {ChipOptionHarnessFilters} from './chip-harness-filters';

export class MatChipOptionHarness extends MatChipHarness {
  /**
   * The selector for the host element of a selectable chip instance.
   *
   * 可选择纸片实例的宿主元素选择器。
   *
   */
  static hostSelector = '.mat-chip';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `MatChipOptionHarness`
   * that meets certain criteria.
   *
   * 获取一个 `HarnessPredicate`，它可以用来搜索满足一定条件 `MatChipOptionHarness`
   *
   * @param options Options for filtering which chip instances are considered a match.
   *
   * 一个选项，用来过滤哪些纸片实例是匹配的。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with(options: ChipOptionHarnessFilters = {}):
    HarnessPredicate<MatChipOptionHarness> {
    return new HarnessPredicate(MatChipOptionHarness, options)
        .addOption('text', options.text,
            (harness, label) => HarnessPredicate.stringMatches(harness.getText(), label))
        .addOption('selected', options.selected,
            async (harness, selected) => (await harness.isSelected()) === selected);
  }

  /**
   * Whether the chip is selected.
   *
   * 纸片是否被选定。
   *
   */
  async isSelected(): Promise<boolean> {
    return (await this.host()).hasClass('mat-chip-selected');
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
    return (await this.host()).sendKeys(' ');
  }
}
