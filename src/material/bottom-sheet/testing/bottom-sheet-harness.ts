/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ContentContainerComponentHarness, HarnessPredicate, TestKey} from '@angular/cdk/testing';
import {BottomSheetHarnessFilters} from './bottom-sheet-harness-filters';

/**
 * Harness for interacting with a standard MatBottomSheet in tests.
 *
 * 在测试中与标准 MatBottomSheet 进行交互的测试工具。
 *
 */
export class MatBottomSheetHarness extends ContentContainerComponentHarness<string> {
  // Developers can provide a custom component or template for the
  // bottom sheet. The canonical parent is the ".mat-bottom-sheet-container".
  static hostSelector = '.mat-bottom-sheet-container';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a bottom sheet with
   * specific attributes.
   *
   * 获取一个 `HarnessPredicate`，它可以用来搜索具有特定属性的底部操作表。
   *
   * @param options Options for narrowing the search.
   *
   * 缩小搜索范围的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 一个使用指定选项配置过的 `HarnessPredicate` 实例。
   */
  static with(options: BottomSheetHarnessFilters = {}): HarnessPredicate<MatBottomSheetHarness> {
    return new HarnessPredicate(MatBottomSheetHarness, options);
  }

  /**
   * Gets the value of the bottom sheet's "aria-label" attribute.
   *
   * 获取底部操作表 “aria-label” 属性的值。
   *
   */
  async getAriaLabel(): Promise<string|null> {
    return (await this.host()).getAttribute('aria-label');
  }

  /**
   * Dismisses the bottom sheet by pressing escape. Note that this method cannot
   * be used if "disableClose" has been set to true via the config.
   *
   * 按下 escape 即可关闭底部操作表。注意，如果通过配置把 “disableClose” 设置成了 true，就不能使用这个方法。
   *
   */
  async dismiss(): Promise<void> {
    await (await this.host()).sendKeys(TestKey.ESCAPE);
  }
}
