/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ComponentHarness, HarnessPredicate, parallel} from '@angular/cdk/testing';
import {
  LegacyTabNavBarHarnessFilters,
  LegacyTabNavPanelHarnessFilters,
  LegacyTabLinkHarnessFilters,
} from './tab-harness-filters';
import {MatLegacyTabLinkHarness} from './tab-link-harness';
import {MatLegacyTabNavPanelHarness} from './tab-nav-panel-harness';

/**
 * Harness for interacting with a standard mat-tab-nav-bar in tests.
 *
 * 在测试中用来与标准 mat-tab-nav-bar 进行交互的测试工具。
 *
 * @deprecated
 *
 * Use `MatTabNavBarHarness` from `@angular/material/tabs/testing` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
export class MatLegacyTabNavBarHarness extends ComponentHarness {
  /**
   * The selector for the host element of a `MatTabNavBar` instance.
   *
   * `MatTabNavBar` 实例的宿主元素选择器。
   *
   */
  static hostSelector = '.mat-tab-nav-bar';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `MatTabNavBar` that meets
   * certain criteria.
   *
   * 获取一个 `HarnessPredicate`，该 HarnessPredicate 可用于搜索满足某些条件的 `MatTabNavBar`。
   *
   * @param options Options for filtering which tab nav bar instances are considered a match.
   *
   * 用于过滤哪些选项卡导航栏实例应该视为匹配项的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 使用给定选项配置过的 `HarnessPredicate`。
   *
   */
  static with(
    options: LegacyTabNavBarHarnessFilters = {},
  ): HarnessPredicate<MatLegacyTabNavBarHarness> {
    return new HarnessPredicate(MatLegacyTabNavBarHarness, options);
  }

  /**
   * Gets the list of links in the nav bar.
   *
   * 获取导航栏中的链接列表。
   *
   * @param filter Optionally filters which links are included.
   *
   * （可选）过滤包含哪些链接。
   *
   */
  async getLinks(filter: LegacyTabLinkHarnessFilters = {}): Promise<MatLegacyTabLinkHarness[]> {
    return this.locatorForAll(MatLegacyTabLinkHarness.with(filter))();
  }

  /**
   * Gets the active link in the nav bar.
   *
   * 获取此导航栏中的活动链接。
   *
   */
  async getActiveLink(): Promise<MatLegacyTabLinkHarness> {
    const links = await this.getLinks();
    const isActive = await parallel(() => links.map(t => t.isActive()));
    for (let i = 0; i < links.length; i++) {
      if (isActive[i]) {
        return links[i];
      }
    }
    throw new Error('No active link could be found.');
  }

  /**
   * Clicks a link inside the nav bar.
   *
   * 单击此导航栏中的链接。
   *
   * @param filter An optional filter to apply to the child link. The first link matching the filter
   *     will be clicked.
   *
   * 应用于子链接的可选过滤器。单击与此过滤器匹配的第一个链接。
   *
   */
  async clickLink(filter: LegacyTabLinkHarnessFilters = {}): Promise<void> {
    const tabs = await this.getLinks(filter);
    if (!tabs.length) {
      throw Error(`Cannot find mat-tab-link matching filter ${JSON.stringify(filter)}`);
    }
    await tabs[0].click();
  }

  /**
   * Gets the panel associated with the nav bar.
   *
   * 获取与导航栏关联的面板。
   *
   */
  async getPanel(): Promise<MatLegacyTabNavPanelHarness> {
    const link = await this.getActiveLink();
    const host = await link.host();
    const panelId = await host.getAttribute('aria-controls');
    if (!panelId) {
      throw Error('No panel is controlled by the nav bar.');
    }

    const filter: LegacyTabNavPanelHarnessFilters = {selector: `#${panelId}`};
    return await this.documentRootLocatorFactory().locatorFor(
      MatLegacyTabNavPanelHarness.with(filter),
    )();
  }
}
