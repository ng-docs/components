/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ContentContainerComponentHarness, HarnessPredicate, parallel} from '@angular/cdk/testing';
import {ToolbarHarnessFilters} from './toolbar-harness-filters';

/**
 * Selectors for different sections of the mat-toolbar that contain user content.
 *
 * 包含用户内容的 mat-toolbar 的不同部分的选择器。
 *
 */
export const enum MatToolbarSection {
  ROW = '.mat-toolbar-row'
}

/**
 * Harness for interacting with a standard mat-toolbar in tests.
 *
 * 在测试中用来与标准 mat-toolbar 进行交互的测试工具。
 *
 */
export class MatToolbarHarness extends ContentContainerComponentHarness<MatToolbarSection> {
  static hostSelector = '.mat-toolbar';

  private _getRows = this.locatorForAll(MatToolbarSection.ROW);

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `MatToolbarHarness` that meets
   * certain criteria.
   *
   * 获取一个 `HarnessPredicate`，可用于搜索满足某些条件的 `MatToolbarHarness`。
   *
   * @param options Options for filtering which card instances are considered a match.
   *
   * 用于过滤哪些卡实例应该视为匹配项的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with(options: ToolbarHarnessFilters = {}): HarnessPredicate<MatToolbarHarness> {
    return new HarnessPredicate(MatToolbarHarness, options)
      .addOption('text', options.text,
        (harness, text) => HarnessPredicate.stringMatches(harness._getText(), text));
  }

  /**
   * Whether the toolbar has multiple rows.
   *
   * 此工具栏是否有多行。
   *
   */
  async hasMultipleRows(): Promise<boolean> {
    return (await this.host()).hasClass('mat-toolbar-multiple-rows');
  }

  /**
   * Gets all of the toolbar's content as text.
   *
   * 以文本形式获取此工具栏的所有内容。
   *
   */
  private async _getText(): Promise<string> {
    return (await this.host()).text();
  }

  /**
   * Gets the text of each row in the toolbar.
   *
   * 获取此工具栏中每一行的文本。
   *
   */
  async getRowsAsText(): Promise<string[]> {
    const rows = await this._getRows();
    return parallel(() => rows.length ? rows.map(r => r.text()) : [this._getText()]);
  }
}
