/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  ComponentHarnessConstructor,
  ContentContainerComponentHarness,
  HarnessPredicate,
  TestKey,
} from '@angular/cdk/testing';
import {MatChipAvatarHarness} from './chip-avatar-harness';
import {
  ChipAvatarHarnessFilters,
  ChipHarnessFilters,
  ChipRemoveHarnessFilters,
} from './chip-harness-filters';
import {MatChipRemoveHarness} from './chip-remove-harness';

/**
 * Harness for interacting with a mat-chip in tests.
 *
 * 在测试中与标准可选 Angular Material 纸片的测试工具。
 *
 */
export class MatChipHarness extends ContentContainerComponentHarness {
  protected _primaryAction = this.locatorFor('.mdc-evolution-chip__action--primary');

  static hostSelector = '.mat-mdc-basic-chip, .mat-mdc-chip';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a chip with specific attributes.
   *
   * 获取一个 `HarnessPredicate`，它可以用来搜索满足一定条件 `MatChipHarness`
   *
   * @param options Options for narrowing the search.
   *
   * 一个选项，用于过滤哪些纸片实例是匹配的。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with<T extends MatChipHarness>(
    this: ComponentHarnessConstructor<T>,
    options: ChipHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options)
      .addOption('text', options.text, (harness, label) => {
        return HarnessPredicate.stringMatches(harness.getText(), label);
      })
      .addOption('disabled', options.disabled, async (harness, disabled) => {
        return (await harness.isDisabled()) === disabled;
      });
  }

  /**
   * Gets a promise for the text content the option.
   *
   * 获取该纸片的文本。
   *
   */
  async getText(): Promise<string> {
    return (await this.host()).text({
      exclude: '.mat-mdc-chip-avatar, .mat-mdc-chip-trailing-icon, .mat-icon',
    });
  }

  /**
   * Whether the chip is disabled.
   *
   * 纸片是否已禁用了。
   *
   */
  async isDisabled(): Promise<boolean> {
    return (await this.host()).hasClass('mat-mdc-chip-disabled');
  }

  /**
   * Delete a chip from the set.
   *
   * 从集合中删除纸片。
   *
   */
  async remove(): Promise<void> {
    const hostEl = await this.host();
    await hostEl.sendKeys(TestKey.DELETE);
  }

  /**
   * Gets the remove button inside of a chip.
   *
   * 获取一个纸片里面的移除按钮。
   *
   * @param filter Optionally filters which chips are included.
   *
   * 可选择过滤哪些纸片。
   *
   */
  async getRemoveButton(filter: ChipRemoveHarnessFilters = {}): Promise<MatChipRemoveHarness> {
    return this.locatorFor(MatChipRemoveHarness.with(filter))();
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
  async getAvatar(filter: ChipAvatarHarnessFilters = {}): Promise<MatChipAvatarHarness | null> {
    return this.locatorForOptional(MatChipAvatarHarness.with(filter))();
  }
}
