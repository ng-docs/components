/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {HarnessPredicate} from '@angular/cdk/testing';
import {MatLegacyChipHarness} from './chip-harness';
import {LegacyChipOptionHarnessFilters} from './chip-harness-filters';

/**
 * @deprecated
 *
 * Use `MatChipOptionHarness` from `@angular/material/chips/testing` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
export class MatLegacyChipOptionHarness extends MatLegacyChipHarness {
  /**
   * The selector for the host element of a selectable chip instance.
   *
   * 可选择纸片实例的宿主元素选择器。
   *
   */
  static override hostSelector = '.mat-chip';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `MatChipOptionHarness`
   * that meets certain criteria.
   *
   * 获取一个 `HarnessPredicate`，它可以用来搜索满足一定条件 `MatChipOptionHarness`。
   *
   * @param options Options for filtering which chip instances are considered a match.
   *
   * 一个选项，用于过滤哪些纸片实例是匹配的。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 使用给定选项配置过的 `HarnessPredicate`。
   *
   */
  static override with(
    options: LegacyChipOptionHarnessFilters = {},
  ): HarnessPredicate<MatLegacyChipOptionHarness> {
    return new HarnessPredicate(MatLegacyChipOptionHarness, options)
      .addOption('text', options.text, (harness, label) =>
        HarnessPredicate.stringMatches(harness.getText(), label),
      )
      .addOption(
        'selected',
        options.selected,
        async (harness, selected) => (await harness.isSelected()) === selected,
      );
  }

  /**
   * Whether the chip is selected.
   *
   * 纸片是否被选定。
   *
   */
  override async isSelected(): Promise<boolean> {
    return (await this.host()).hasClass('mat-chip-selected');
  }

  /**
   * Selects the given chip. Only applies if it's selectable.
   *
   * 选定指定的纸片。仅当它可选时才适用。
   *
   */
  override async select(): Promise<void> {
    if (!(await this.isSelected())) {
      await this.toggle();
    }
  }

  /**
   * Deselects the given chip. Only applies if it's selectable.
   *
   * 取消选定指定的纸片。仅当它可选时才适用。
   *
   */
  override async deselect(): Promise<void> {
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
  override async toggle(): Promise<void> {
    return (await this.host()).sendKeys(' ');
  }
}
