/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ComponentHarness, HarnessPredicate} from '@angular/cdk/testing';
import {MatExpansionPanelHarness} from './expansion-harness';
import {AccordionHarnessFilters, ExpansionPanelHarnessFilters} from './expansion-harness-filters';

/**
 * Harness for interacting with a standard mat-accordion in tests.
 *
 * 在测试中用来与标准 mat-accordion 进行交互的测试工具。
 *
 */
export class MatAccordionHarness extends ComponentHarness {
  static hostSelector = '.mat-accordion';

  /**
   * Gets a `HarnessPredicate` that can be used to search for an accordion
   * with specific attributes.
   *
   * 获取一个可用来使用指定属性搜索手风琴的 `HarnessPredicate`。
   *
   * @param options Options for narrowing the search.
   *
   * 用来收窄搜索范围的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with(options: AccordionHarnessFilters = {}): HarnessPredicate<MatAccordionHarness> {
    return new HarnessPredicate(MatAccordionHarness, options);
  }

  /** Gets all expansion panels which are part of the accordion. */
  async getExpansionPanels(filter: ExpansionPanelHarnessFilters = {}):
      Promise<MatExpansionPanelHarness[]> {
    return this.locatorForAll(MatExpansionPanelHarness.with(filter))();
  }

  /** Whether the accordion allows multiple expanded panels simultaneously. */
  async isMulti(): Promise<boolean> {
    return (await this.host()).hasClass('mat-accordion-multi');
  }
}
