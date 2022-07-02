/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ContentContainerComponentHarness, HarnessPredicate} from '@angular/cdk/testing';
import {TabNavPanelHarnessFilters} from './tab-harness-filters';

/** Harness for interacting with a standard mat-tab-nav-panel in tests. */
export class MatTabNavPanelHarness extends ContentContainerComponentHarness {
  /** The selector for the host element of a `MatTabNavPanel` instance. */
  static hostSelector = '.mat-tab-nav-panel';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `MatTabNavPanel` that meets
   * certain criteria.
   * @param options Options for filtering which tab nav panel instances are considered a match.
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 使用给定选项配置过的 `HarnessPredicate`。
   *
   */
  static with(options: TabNavPanelHarnessFilters = {}): HarnessPredicate<MatTabNavPanelHarness> {
    return new HarnessPredicate(MatTabNavPanelHarness, options);
  }

  /** Gets the tab panel text content. */
  async getTextContent(): Promise<string> {
    return (await this.host()).text();
  }
}
