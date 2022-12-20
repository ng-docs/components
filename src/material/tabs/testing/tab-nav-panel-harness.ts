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
} from '@angular/cdk/testing';
import {TabNavPanelHarnessFilters} from './tab-harness-filters';

/**
 * Harness for interacting with a standard mat-tab-nav-panel in tests.
 *
 * 用于在测试中与标准 mat-tab-nav-panel 交互的测试工具。
 *
 */
export class MatTabNavPanelHarness extends ContentContainerComponentHarness {
  /**
   * The selector for the host element of a `MatTabNavPanel` instance.
   *
   * `MatTabNavPanel` 实例的宿主元素的选择器。
   *
   */
  static hostSelector = '.mat-mdc-tab-nav-panel';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a tab nav panel with specific
   * attributes.
   *
   * 获取可用于搜索满足特定条件的 `HarnessPredicate` 的 `MatTabNavPanel` 。
   *
   * @param options Options for filtering which tab nav panel instances are considered a match.
   *
   * 用于过滤哪些选项卡导航面板实例被视为匹配的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 使用给定选项配置过的 `HarnessPredicate`。
   *
   */
  static with<T extends MatTabNavPanelHarness>(
    this: ComponentHarnessConstructor<T>,
    options: TabNavPanelHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options);
  }

  /**
   * Gets the tab panel text content.
   *
   * 获取选项卡面板文本内容。
   *
   */
  async getTextContent(): Promise<string> {
    return (await this.host()).text();
  }
}
