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
  parallel,
} from '@angular/cdk/testing';
import {TabGroupHarnessFilters, TabHarnessFilters} from './tab-harness-filters';
import {MatTabHarness} from './tab-harness';

/**
 * Harness for interacting with an MDC-based mat-tab-group in tests.
 *
 * 在测试中用来与标准 mat-tab-group 进行交互的测试工具。
 *
 */
export class MatTabGroupHarness extends ComponentHarness {
  /**
   * The selector for the host element of a `MatTabGroup` instance.
   *
   * `MatTabGroup` 实例的宿主元素选择器。
   *
   */
  static hostSelector = '.mat-mdc-tab-group';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a tab group with specific attributes.
   *
   * 获取一个 `HarnessPredicate`，可用于搜索满足某些条件的 `MatTabGroupHarness`。
   *
   * @param options Options for filtering which tab group instances are considered a match.
   *
   * 用于过滤哪些选项卡组实例应该视为匹配项的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with<T extends MatTabGroupHarness>(
    this: ComponentHarnessConstructor<T>,
    options: TabGroupHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options).addOption(
      'selectedTabLabel',
      options.selectedTabLabel,
      async (harness, label) => {
        const selectedTab = await harness.getSelectedTab();
        return HarnessPredicate.stringMatches(await selectedTab.getLabel(), label);
      },
    );
  }

  /**
   * Gets the list of tabs in the tab group.
   *
   * 获取此选项卡组中的选项卡列表。
   *
   * @param filter Optionally filters which tabs are included.
   *
   * （可选）决定应该包括哪些选项卡的可选过滤器。
   *
   */
  async getTabs(filter: TabHarnessFilters = {}): Promise<MatTabHarness[]> {
    return this.locatorForAll(MatTabHarness.with(filter))();
  }

  /**
   * Gets the selected tab of the tab group.
   *
   * 获取此选项卡组中的已选选项卡。
   *
   */
  async getSelectedTab(): Promise<MatTabHarness> {
    const tabs = await this.getTabs();
    const isSelected = await parallel(() => tabs.map(t => t.isSelected()));
    for (let i = 0; i < tabs.length; i++) {
      if (isSelected[i]) {
        return tabs[i];
      }
    }
    throw new Error('No selected tab could be found.');
  }

  /**
   * Selects a tab in this tab group.
   *
   * 在此选项卡组中选择一个选项卡。
   *
   * @param filter An optional filter to apply to the child tabs. The first tab matching the filter
   *     will be selected.
   *
   * 应用于子选项卡的可选过滤器。将选择与过滤器匹配的第一个标签。
   *
   */
  async selectTab(filter: TabHarnessFilters = {}): Promise<void> {
    const tabs = await this.getTabs(filter);
    if (!tabs.length) {
      throw Error(`Cannot find mat-tab matching filter ${JSON.stringify(filter)}`);
    }
    await tabs[0].select();
  }
}
