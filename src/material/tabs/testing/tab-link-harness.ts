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
import {TabLinkHarnessFilters} from './tab-harness-filters';

/**
 * Harness for interacting with an MDC-based Angular Material tab link in tests.
 *
 * 在测试中可与标准 Angular Material 选项卡链接进行交互的测试工具。
 *
 */
export class MatTabLinkHarness extends ComponentHarness {
  /**
   * The selector for the host element of a `MatTabLink` instance.
   *
   * `MatTabLink` 实例的宿主元素选择器。
   *
   */
  static hostSelector = '.mat-mdc-tab-link';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a tab link with specific attributes.
   *
   * 获取一个 `HarnessPredicate`，可用于搜索满足某些条件的 `MatTabLinkHarness`。
   *
   * @param options Options for filtering which tab link instances are considered a match.
   *
   * 用于过滤哪些选项卡链接实例应该视为匹配项的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with<T extends MatTabLinkHarness>(
    this: ComponentHarnessConstructor<T>,
    options: TabLinkHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options).addOption('label', options.label, (harness, label) =>
      HarnessPredicate.stringMatches(harness.getLabel(), label),
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
    return host.hasClass('mdc-tab--active');
  }

  /**
   * Whether the link is disabled.
   *
   * 此链接是否已禁用。
   *
   */
  async isDisabled(): Promise<boolean> {
    const host = await this.host();
    return host.hasClass('mat-mdc-tab-disabled');
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
