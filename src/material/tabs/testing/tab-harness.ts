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
  HarnessLoader,
  HarnessPredicate,
} from '@angular/cdk/testing';
import {TabHarnessFilters} from './tab-harness-filters';

/**
 * Harness for interacting with an MDC_based Angular Material tab in tests.
 *
 * 在测试中可与标准 Angular Material 选项卡标签进行交互的测试工具。
 *
 */
export class MatTabHarness extends ContentContainerComponentHarness<string> {
  /**
   * The selector for the host element of a `MatTab` instance.
   *
   * `MatTab` 实例的宿主元素选择器。
   *
   */
  static hostSelector = '.mat-mdc-tab';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a tab with specific attributes.
   *
   * 获取一个 `HarnessPredicate`，可用于搜索满足某些条件的 `MatTabHarness`。
   *
   * @param options Options for filtering which tab instances are considered a match.
   *
   * 用于过滤哪些选项卡实例应该视为匹配项的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with<T extends MatTabHarness>(
    this: ComponentHarnessConstructor<T>,
    options: TabHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options).addOption('label', options.label, (harness, label) =>
      HarnessPredicate.stringMatches(harness.getLabel(), label),
    );
  }

  /**
   * Gets the label of the tab.
   *
   * 获取此选项卡的标签。
   *
   */
  async getLabel(): Promise<string> {
    return (await this.host()).text();
  }

  /**
   * Gets the aria-label of the tab.
   *
   * 获取此选项卡的 aria-label。
   *
   */
  async getAriaLabel(): Promise<string | null> {
    return (await this.host()).getAttribute('aria-label');
  }

  /**
   * Gets the value of the "aria-labelledby" attribute.
   *
   * 获取 “aria-labelledby” 属性的值。
   *
   */
  async getAriaLabelledby(): Promise<string | null> {
    return (await this.host()).getAttribute('aria-labelledby');
  }

  /**
   * Whether the tab is selected.
   *
   * 是否已选择此选项卡。
   *
   */
  async isSelected(): Promise<boolean> {
    const hostEl = await this.host();
    return (await hostEl.getAttribute('aria-selected')) === 'true';
  }

  /**
   * Whether the tab is disabled.
   *
   * 此选项卡是否已禁用。
   *
   */
  async isDisabled(): Promise<boolean> {
    const hostEl = await this.host();
    return (await hostEl.getAttribute('aria-disabled')) === 'true';
  }

  /**
   * Selects the given tab by clicking on the label. Tab cannot be selected if disabled.
   *
   * 通过单击标签来选择给定的选项卡。如果禁用，则无法选择选项卡。
   *
   */
  async select(): Promise<void> {
    await (await this.host()).click('center');
  }

  /**
   * Gets the text content of the tab.
   *
   * 获取选项卡的文本内容。
   *
   */
  async getTextContent(): Promise<string> {
    const contentId = await this._getContentId();
    const contentEl = await this.documentRootLocatorFactory().locatorFor(`#${contentId}`)();
    return contentEl.text();
  }

  protected override async getRootHarnessLoader(): Promise<HarnessLoader> {
    const contentId = await this._getContentId();
    return this.documentRootLocatorFactory().harnessLoaderFor(`#${contentId}`);
  }

  /**
   * Gets the element id for the content of the current tab.
   *
   * 获取当前选项卡内容的元素 ID。
   *
   */
  private async _getContentId(): Promise<string> {
    const hostEl = await this.host();
    // Tabs never have an empty "aria-controls" attribute.
    return (await hostEl.getAttribute('aria-controls'))!;
  }
}
