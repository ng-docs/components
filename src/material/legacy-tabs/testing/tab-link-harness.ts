/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ComponentHarness, HarnessPredicate} from '@angular/cdk/testing';
import {LegacyTabLinkHarnessFilters} from './tab-harness-filters';

/**
 * Harness for interacting with a standard Angular Material tab link in tests.
 *
 * 在测试中可与标准 Angular Material 选项卡链接进行交互的测试工具。
 *
 * @deprecated
 *
 * Use `MatTabLinkHarness` from `@angular/material/tabs/testing` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
export class MatLegacyTabLinkHarness extends ComponentHarness {
  /**
   * The selector for the host element of a `MatTabLink` instance.
   *
   * `MatTabLink` 实例的宿主元素选择器。
   *
   */
  static hostSelector = '.mat-tab-link';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `MatTabLinkHarness` that meets
   * certain criteria.
   *
   * 获取一个 `HarnessPredicate`，可用于搜索满足某些条件的 `MatTabLinkHarness`。
   *
   * @param options Options for filtering which tab link instances are considered a match.
   *
   * 用于过滤哪些选项卡链接实例应该视为匹配项的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 使用给定选项配置过的 `HarnessPredicate`。
   *
   */
  static with(
    options: LegacyTabLinkHarnessFilters = {},
  ): HarnessPredicate<MatLegacyTabLinkHarness> {
    return new HarnessPredicate(MatLegacyTabLinkHarness, options).addOption(
      'label',
      options.label,
      (harness, label) => HarnessPredicate.stringMatches(harness.getLabel(), label),
    );
  }

  /**
   * Gets the label of the link.
   *
   * 获取此链接的标签。
   *
   */
  async getLabel(): Promise<string> {
    return (await this.host()).text();
  }

  /**
   * Whether the link is active.
   *
   * 此链接是否处于活动状态。
   *
   */
  async isActive(): Promise<boolean> {
    const host = await this.host();
    return host.hasClass('mat-tab-label-active');
  }

  /**
   * Whether the link is disabled.
   *
   * 此链接是否已禁用。
   *
   */
  async isDisabled(): Promise<boolean> {
    const host = await this.host();
    return host.hasClass('mat-tab-disabled');
  }

  /**
   * Clicks on the link.
   *
   * 点击此链接。
   *
   */
  async click(): Promise<void> {
    await (await this.host()).click();
  }
}
