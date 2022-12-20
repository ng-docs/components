/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ContentContainerComponentHarness, HarnessPredicate, TestKey} from '@angular/cdk/testing';
import {MatLegacyChipAvatarHarness} from './chip-avatar-harness';
import {
  LegacyChipAvatarHarnessFilters,
  LegacyChipHarnessFilters,
  LegacyChipRemoveHarnessFilters,
} from './chip-harness-filters';
import {MatLegacyChipRemoveHarness} from './chip-remove-harness';

/**
 * Harness for interacting with a standard selectable Angular Material chip in tests.
 *
 * 在测试中与标准可选 Angular Material 纸片的测试工具。
 *
 * @deprecated
 *
 * Use `MatChipHarness` from `@angular/material/chips/testing` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
export class MatLegacyChipHarness extends ContentContainerComponentHarness {
  /**
   * The selector for the host element of a `MatChip` instance.
   *
   * `MatChip` 实例的宿主元素选择器。
   *
   */
  static hostSelector = '.mat-chip';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `MatChipHarness` that meets
   * certain criteria.
   *
   * 获取一个 `HarnessPredicate`，它可以用来搜索满足一定条件 `MatChipHarness`。
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
  static with(options: LegacyChipHarnessFilters = {}): HarnessPredicate<MatLegacyChipHarness> {
    return new HarnessPredicate(MatLegacyChipHarness, options)
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
   * Gets the text of the chip.
   *
   * 获取该纸片的文本。
   *
   */
  async getText(): Promise<string> {
    return (await this.host()).text({
      exclude: '.mat-chip-avatar, .mat-chip-trailing-icon, .mat-icon',
    });
  }

  /**
   * Whether the chip is selected.
   *
   * 纸片是否被选定。
   *
   * @deprecated
   *
   * Use `MatChipOptionHarness.isSelected` instead.
   *
   * 请改用 `MatChipOptionHarness.isSelected` 。
   *
   * @breaking-change 12.0.0
   */
  async isSelected(): Promise<boolean> {
    return (await this.host()).hasClass('mat-chip-selected');
  }

  /**
   * Whether the chip is disabled.
   *
   * 纸片是否已禁用了。
   *
   */
  async isDisabled(): Promise<boolean> {
    return (await this.host()).hasClass('mat-chip-disabled');
  }

  /**
   * Selects the given chip. Only applies if it's selectable.
   *
   * 选定指定的纸片。仅当它可选时才适用。
   *
   * @deprecated
   *
   * Use `MatChipOptionHarness.select` instead.
   *
   * 请改用 `MatChipOptionHarness.select` 。
   *
   * @breaking-change 12.0.0
   */
  async select(): Promise<void> {
    if (!(await this.isSelected())) {
      await this.toggle();
    }
  }

  /**
   * Deselects the given chip. Only applies if it's selectable.
   *
   * 取消选定指定的纸片。仅当它可选时才适用。
   *
   * @deprecated
   *
   * Use `MatChipOptionHarness.deselect` instead.
   *
   * 请改用 `MatChipOptionHarness.deselect` 。
   *
   * @breaking-change 12.0.0
   */
  async deselect(): Promise<void> {
    if (await this.isSelected()) {
      await this.toggle();
    }
  }

  /**
   * Toggles the selected state of the given chip. Only applies if it's selectable.
   *
   * 切换指定纸片的选定状态。仅当它可选时才适用。
   *
   * @deprecated
   *
   * Use `MatChipOptionHarness.toggle` instead.
   *
   * 请改用 `MatChipOptionHarness.toggle` 。
   *
   * @breaking-change 12.0.0
   */
  async toggle(): Promise<void> {
    return (await this.host()).sendKeys(' ');
  }

  /**
   * Removes the given chip. Only applies if it's removable.
   *
   * 移除指定的纸片。只有它可移除时才适用。
   *
   */
  async remove(): Promise<void> {
    await (await this.host()).sendKeys(TestKey.DELETE);
  }

  /**
   * Gets the remove button inside of a chip.
   *
   * 获取一个纸片里面的移除按钮。
   *
   * @param filter Optionally filters which remove buttons are included.
   *
   * 可选择过滤哪些纸片。
   *
   */
  async getRemoveButton(
    filter: LegacyChipRemoveHarnessFilters = {},
  ): Promise<MatLegacyChipRemoveHarness> {
    return this.locatorFor(MatLegacyChipRemoveHarness.with(filter))();
  }

  /**
   * Gets the avatar inside a chip.
   *
   * 获取纸片内部的头像。
   *
   * @param filter Optionally filters which avatars are included.
   *
   * 可选过滤器，指定包括哪些头像。
   *
   */
  async getAvatar(
    filter: LegacyChipAvatarHarnessFilters = {},
  ): Promise<MatLegacyChipAvatarHarness | null> {
    return this.locatorForOptional(MatLegacyChipAvatarHarness.with(filter))();
  }
}
