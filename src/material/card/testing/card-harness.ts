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
import {CardHarnessFilters} from './card-harness-filters';

/**
 * Selectors for different sections of the mat-card that can container user content.
 *
 * 选择器，用于表示 mat-card 中容纳用户内容的不同区段。
 *
 */
export const enum MatCardSection {
  HEADER = '.mat-mdc-card-header',
  CONTENT = '.mat-mdc-card-content',
  ACTIONS = '.mat-mdc-card-actions',
  FOOTER = '.mat-mdc-card-footer',
}

/**
 * Harness for interacting with an MDC-based mat-card in tests.
 *
 * 在测试中与标准 mat-card 进行交互的测试工具。
 *
 */
export class MatCardHarness extends ContentContainerComponentHarness<MatCardSection> {
  /**
   * The selector for the host element of a `MatCard` instance.
   *
   * `MatCard` 实例的宿主元素选择器。
   *
   */
  static hostSelector = '.mat-mdc-card';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a card with specific attributes.
   *
   * 获取一个 `HarnessPredicate`，它可以用来搜索满足一定条件的 `MatCardHarness`
   *
   * @param options Options for filtering which card instances are considered a match.
   *
   * 一个选项，用于筛选哪些卡片实例是匹配的。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 一个用指定选项配置过的 `HarnessPredicate`。
   */
  static with<T extends MatCardHarness>(
    this: ComponentHarnessConstructor<T>,
    options: CardHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options)
      .addOption('text', options.text, (harness, text) =>
        HarnessPredicate.stringMatches(harness.getText(), text),
      )
      .addOption('title', options.title, (harness, title) =>
        HarnessPredicate.stringMatches(harness.getTitleText(), title),
      )
      .addOption('subtitle', options.subtitle, (harness, subtitle) =>
        HarnessPredicate.stringMatches(harness.getSubtitleText(), subtitle),
      );
  }

  private _title = this.locatorForOptional('.mat-mdc-card-title');
  private _subtitle = this.locatorForOptional('.mat-mdc-card-subtitle');

  /**
   * Gets all of the card's content as text.
   *
   * 以文本形式获取该卡片的所有内容。
   *
   */
  async getText(): Promise<string> {
    return (await this.host()).text();
  }

  /**
   * Gets the cards's title text.
   *
   * 获取该卡片的标题文字。
   *
   */
  async getTitleText(): Promise<string> {
    return (await this._title())?.text() ?? '';
  }

  /**
   * Gets the cards's subtitle text.
   *
   * 获取该卡片的副标题文字。
   *
   */
  async getSubtitleText(): Promise<string> {
    return (await this._subtitle())?.text() ?? '';
  }
}
