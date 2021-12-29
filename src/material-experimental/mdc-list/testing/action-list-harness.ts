/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {HarnessPredicate} from '@angular/cdk/testing';
import {MatListHarnessBase} from './list-harness-base';
import {ActionListHarnessFilters, ActionListItemHarnessFilters} from './list-harness-filters';
import {getListItemPredicate, MatListItemHarnessBase} from './list-item-harness-base';

/** Harness for interacting with a MDC-based action-list in tests. */
export class MatActionListHarness extends MatListHarnessBase<
  typeof MatActionListItemHarness,
  MatActionListItemHarness,
  ActionListItemHarnessFilters
> {
  /** The selector for the host element of a `MatActionList` instance. */
  static hostSelector = '.mat-mdc-action-list';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `MatActionListHarness` that meets
   * certain criteria.
   * @param options Options for filtering which action list instances are considered a match.
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with(options: ActionListHarnessFilters = {}): HarnessPredicate<MatActionListHarness> {
    return new HarnessPredicate(MatActionListHarness, options);
  }

  override _itemHarness = MatActionListItemHarness;
}

/** Harness for interacting with an action list item. */
export class MatActionListItemHarness extends MatListItemHarnessBase {
  /** The selector for the host element of a `MatListItem` instance. */
  static hostSelector = `${MatActionListHarness.hostSelector} .mat-mdc-list-item`;

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `MatActionListItemHarness` that
   * meets certain criteria.
   * @param options Options for filtering which action list item instances are considered a match.
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with(
    options: ActionListItemHarnessFilters = {},
  ): HarnessPredicate<MatActionListItemHarness> {
    return getListItemPredicate(MatActionListItemHarness, options);
  }

  /** Clicks on the action list item. */
  async click(): Promise<void> {
    return (await this.host()).click();
  }

  /** Focuses the action list item. */
  async focus(): Promise<void> {
    return (await this.host()).focus();
  }

  /** Blurs the action list item. */
  async blur(): Promise<void> {
    return (await this.host()).blur();
  }

  /** Whether the action list item is focused. */
  async isFocused(): Promise<boolean> {
    return (await this.host()).isFocused();
  }
}
