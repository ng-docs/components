/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ContentContainerComponentHarness, HarnessPredicate} from '@angular/cdk/testing';
import {GridTileHarnessFilters} from './grid-list-harness-filters';

/**
 * Selectors for the various `mat-grid-tile` sections that may contain user content.
 *
 * 可能包含用户内容的各种 `mat-grid-tile`。
 *
 */
export const enum MatGridTileSection {
  HEADER = '.mat-grid-tile-header',
  FOOTER = '.mat-grid-tile-footer'
}

/**
 * Harness for interacting with a standard `MatGridTitle` in tests.
 *
 * 在测试中与 `MatGridTitle` 进行交互的测试工具。
 *
 */
export class MatGridTileHarness extends ContentContainerComponentHarness<MatGridTileSection> {
  /**
   * The selector for the host element of a `MatGridTile` instance.
   *
   * `MatGridTile` 实例的宿主元素选择器。
   *
   */
  static hostSelector = '.mat-grid-tile';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `MatGridTileHarness`
   * that meets certain criteria.
   *
   * 获取一个 `HarnessPredicate`，可用于搜索满足某些条件的 `MatGridTileHarness`。
   *
   * @param options Options for filtering which dialog instances are considered a match.
   *
   * 用于过滤哪些对话框实例应该视为匹配的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with(options: GridTileHarnessFilters = {}): HarnessPredicate<MatGridTileHarness> {
    return new HarnessPredicate(MatGridTileHarness, options)
        .addOption(
            'headerText', options.headerText,
            (harness, pattern) => HarnessPredicate.stringMatches(harness.getHeaderText(), pattern))
        .addOption(
            'footerText', options.footerText,
            (harness, pattern) => HarnessPredicate.stringMatches(harness.getFooterText(), pattern));
  }

  private _header = this.locatorForOptional(MatGridTileSection.HEADER);
  private _footer = this.locatorForOptional(MatGridTileSection.FOOTER);
  private _avatar = this.locatorForOptional('.mat-grid-avatar');

  /**
   * Gets the amount of rows that the grid-tile takes up.
   *
   * 获取此网格图块占用的行数。
   *
   */
  async getRowspan(): Promise<number> {
    return Number(await (await this.host()).getAttribute('rowspan'));
  }

  /**
   * Gets the amount of columns that the grid-tile takes up.
   *
   * 获取此网格图块占用的列数。
   *
   */
  async getColspan(): Promise<number> {
    return Number(await (await this.host()).getAttribute('colspan'));
  }

  /**
   * Whether the grid-tile has a header.
   *
   * 此网格块是否具有头部。
   *
   */
  async hasHeader(): Promise<boolean> {
    return (await this._header()) !== null;
  }

  /**
   * Whether the grid-tile has a footer.
   *
   * 网格块是否具有尾部。
   *
   */
  async hasFooter(): Promise<boolean> {
    return (await this._footer()) !== null;
  }

  /**
   * Whether the grid-tile has an avatar.
   *
   * 此网格图块是否具有头像。
   *
   */
  async hasAvatar(): Promise<boolean> {
    return (await this._avatar()) !== null;
  }

  /**
   * Gets the text of the header if present.
   *
   * 获取其头部的文本（如果存在）。
   *
   */
  async getHeaderText(): Promise<string|null> {
    // For performance reasons, we do not use "hasHeader" as
    // we would then need to query twice for the header.
    const headerEl = await this._header();
    return headerEl ? headerEl.text() : null;
  }

  /**
   * Gets the text of the footer if present.
   *
   * 获取其尾部的文本（如果存在）。
   *
   */
  async getFooterText(): Promise<string|null> {
    // For performance reasons, we do not use "hasFooter" as
    // we would then need to query twice for the footer.
    const headerEl = await this._footer();
    return headerEl ? headerEl.text() : null;
  }
}
