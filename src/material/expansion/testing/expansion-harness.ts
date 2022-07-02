/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  ContentContainerComponentHarness,
  HarnessLoader,
  HarnessPredicate,
} from '@angular/cdk/testing';
import {ExpansionPanelHarnessFilters} from './expansion-harness-filters';

/**
 * Selectors for the various `mat-expansion-panel` sections that may contain user content.
 *
 * 可能包含用户内容的各种 `mat-expansion-panel` 区段。
 *
 */
export const enum MatExpansionPanelSection {
  HEADER = '.mat-expansion-panel-header',
  TITLE = '.mat-expansion-panel-header-title',
  DESCRIPTION = '.mat-expansion-panel-header-description',
  CONTENT = '.mat-expansion-panel-content',
}

/**
 * Harness for interacting with a standard mat-expansion-panel in tests.
 *
 * 在测试中用来与标准 mat-expansion-panel 进行交互的测试工具。
 *
 */
export class MatExpansionPanelHarness extends ContentContainerComponentHarness<MatExpansionPanelSection> {
  static hostSelector = '.mat-expansion-panel';

  private _header = this.locatorFor(MatExpansionPanelSection.HEADER);
  private _title = this.locatorForOptional(MatExpansionPanelSection.TITLE);
  private _description = this.locatorForOptional(MatExpansionPanelSection.DESCRIPTION);
  private _expansionIndicator = this.locatorForOptional('.mat-expansion-indicator');
  private _content = this.locatorFor(MatExpansionPanelSection.CONTENT);

  /**
   * Gets a `HarnessPredicate` that can be used to search for an expansion-panel
   * with specific attributes.
   *
   * 获取一个 `HarnessPredicate`，该 HarnessPredicate 可用于搜索具有特定属性的可展开面板。
   *
   * @param options Options for narrowing the search:
   *
   * 用来收窄搜索范围的选项：
   *
   * - `title` finds an expansion-panel with a specific title text.
   *
   *   `title` 查找具有特定标题文本的可展开面板。
   *
   * - `description` finds an expansion-panel with a specific description text.
   *
   *   `description` 查找具有特定描述文本的可展开面板。
   *
   * - `expanded` finds an expansion-panel that is currently expanded.
   *
   *   `expanded` 查找当前正在扩展的可展开面板。
   *
   * - `disabled` finds an expansion-panel that is disabled.
   *
   *   `disabled` 查找禁用的可展开面板。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 使用给定选项配置过的 `HarnessPredicate`。
   *
   */
  static with(
    options: ExpansionPanelHarnessFilters = {},
  ): HarnessPredicate<MatExpansionPanelHarness> {
    return new HarnessPredicate(MatExpansionPanelHarness, options)
      .addOption('title', options.title, (harness, title) =>
        HarnessPredicate.stringMatches(harness.getTitle(), title),
      )
      .addOption('description', options.description, (harness, description) =>
        HarnessPredicate.stringMatches(harness.getDescription(), description),
      )
      .addOption('content', options.content, (harness, content) =>
        HarnessPredicate.stringMatches(harness.getTextContent(), content),
      )
      .addOption(
        'expanded',
        options.expanded,
        async (harness, expanded) => (await harness.isExpanded()) === expanded,
      )
      .addOption(
        'disabled',
        options.disabled,
        async (harness, disabled) => (await harness.isDisabled()) === disabled,
      );
  }

  /**
   * Whether the panel is expanded.
   *
   * 此面板是否已展开。
   *
   */
  async isExpanded(): Promise<boolean> {
    return (await this.host()).hasClass('mat-expanded');
  }

  /**
   * Gets the title text of the panel.
   *
   * 获取此面板的标题文本。
   *
   * @returns
   *
   * Title text or `null` if no title is set up.
   *
   * 标题文本；如果未设置标题，则为 `null`。
   *
   */
  async getTitle(): Promise<string | null> {
    const titleEl = await this._title();
    return titleEl ? titleEl.text() : null;
  }

  /**
   * Gets the description text of the panel.
   *
   * 获取此面板的描述文本。
   *
   * @returns
   *
   * Description text or `null` if no description is set up.
   *
   * 说明文字，如果未设置说明，则为 `null`。
   *
   */
  async getDescription(): Promise<string | null> {
    const descriptionEl = await this._description();
    return descriptionEl ? descriptionEl.text() : null;
  }

  /**
   * Whether the panel is disabled.
   *
   * 此面板是否已禁用。
   *
   */
  async isDisabled(): Promise<boolean> {
    return (await (await this._header()).getAttribute('aria-disabled')) === 'true';
  }

  /**
   * Toggles the expanded state of the panel by clicking on the panel
   * header. This method will not work if the panel is disabled.
   *
   * 通过单击此面板的标题来切换面板的展开状态。如果已禁用此面板，则此方法将不起作用。
   *
   */
  async toggle(): Promise<void> {
    await (await this._header()).click();
  }

  /**
   * Expands the expansion panel if collapsed.
   *
   * 如果折叠，则展开这个可展开面板。
   *
   */
  async expand(): Promise<void> {
    if (!(await this.isExpanded())) {
      await this.toggle();
    }
  }

  /**
   * Collapses the expansion panel if expanded.
   *
   * 如果展开，则折叠这个可展开面板。
   *
   */
  async collapse(): Promise<void> {
    if (await this.isExpanded()) {
      await this.toggle();
    }
  }

  /**
   * Gets the text content of the panel.
   *
   * 获取此面板的文本内容。
   *
   */
  async getTextContent(): Promise<string> {
    return (await this._content()).text();
  }

  /**
   * Gets a `HarnessLoader` that can be used to load harnesses for
   * components within the panel's content area.
   *
   * 获取一个 `HarnessLoader`，可用于为此面板的内容区域内的组件加载测试工具。
   *
   * @deprecated Use either `getChildLoader(MatExpansionPanelSection.CONTENT)`, `getHarness` or
   *    `getAllHarnesses` instead.
   *
   * 请改用 `getChildLoader(MatExpansionPanelSection.CONTENT)`，`getHarness` 或 `getAllHarnesses`。
   *
   * @breaking-change 12.0.0
   */
  async getHarnessLoaderForContent(): Promise<HarnessLoader> {
    return this.getChildLoader(MatExpansionPanelSection.CONTENT);
  }

  /**
   * Focuses the panel.
   *
   * 让此面板获得焦点。
   *
   */
  async focus(): Promise<void> {
    return (await this._header()).focus();
  }

  /**
   * Blurs the panel.
   *
   * 让此面板失焦。
   *
   */
  async blur(): Promise<void> {
    return (await this._header()).blur();
  }

  /**
   * Whether the panel is focused.
   *
   * 此面板是否拥有焦点。
   *
   */
  async isFocused(): Promise<boolean> {
    return (await this._header()).isFocused();
  }

  /**
   * Whether the panel has a toggle indicator displayed.
   *
   * 此面板上是否显示切换指示器。
   *
   */
  async hasToggleIndicator(): Promise<boolean> {
    return (await this._expansionIndicator()) !== null;
  }

  /**
   * Gets the position of the toggle indicator.
   *
   * 获取切换指示器的位置。
   *
   */
  async getToggleIndicatorPosition(): Promise<'before' | 'after'> {
    // By default the expansion indicator will show "after" the panel header content.
    if (await (await this._header()).hasClass('mat-expansion-toggle-indicator-before')) {
      return 'before';
    }
    return 'after';
  }
}
