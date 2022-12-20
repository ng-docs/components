/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {HarnessPredicate} from '@angular/cdk/testing';
import {MatLegacyListHarnessBase} from './list-harness-base';
import {
  LegacyActionListHarnessFilters,
  LegacyActionListItemHarnessFilters,
} from './list-harness-filters';
import {getListItemPredicate, MatLegacyListItemHarnessBase} from './list-item-harness-base';

/**
 * Harness for interacting with a standard mat-action-list in tests.
 *
 * 在测试中用来与标准 mat-action-list 进行交互的测试工具。
 *
 * @deprecated
 *
 * Use `MatActionListHarness` from `@angular/material/list/testing` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
export class MatLegacyActionListHarness extends MatLegacyListHarnessBase<
  typeof MatLegacyActionListItemHarness,
  MatLegacyActionListItemHarness,
  LegacyActionListItemHarnessFilters
> {
  /**
   * The selector for the host element of a `MatActionList` instance.
   *
   * `MatActionList` 实例的宿主元素选择器。
   *
   */
  static hostSelector = 'mat-action-list.mat-list';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `MatActionListHarness` that meets
   * certain criteria.
   *
   * 获取一个 `HarnessPredicate`，该 HarnessPredicate 可用于搜索满足某些条件的 `MatActionListHarness`。
   *
   * @param options Options for filtering which action list instances are considered a match.
   *
   * 用于过滤哪些动作列表实例应该视为匹配的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 使用给定选项配置过的 `HarnessPredicate`。
   *
   */
  static with(
    options: LegacyActionListHarnessFilters = {},
  ): HarnessPredicate<MatLegacyActionListHarness> {
    return new HarnessPredicate(MatLegacyActionListHarness, options);
  }

  override _itemHarness = MatLegacyActionListItemHarness;
}

/**
 * Harness for interacting with an action list item.
 *
 * 与动作列表条目进行交互的测试工具。
 *
 * @deprecated
 *
 * Use `MatActionListItemHarness` from `@angular/material/list/testing` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
export class MatLegacyActionListItemHarness extends MatLegacyListItemHarnessBase {
  /**
   * The selector for the host element of a `MatListItem` instance.
   *
   * `MatListItem` 实例的宿主元素选择器。
   *
   */
  static hostSelector = `${MatLegacyActionListHarness.hostSelector} .mat-list-item`;

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `MatActionListItemHarness` that
   * meets certain criteria.
   *
   * 获取一个 `HarnessPredicate`，该 HarnessPredicate 可用于搜索满足某些条件的 `MatActionListItemHarness`。
   *
   * @param options Options for filtering which action list item instances are considered a match.
   *
   * 用于过滤哪些动作列表条目目实例应该视为匹配项的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 使用给定选项配置过的 `HarnessPredicate`。
   *
   */
  static with(
    options: LegacyActionListItemHarnessFilters = {},
  ): HarnessPredicate<MatLegacyActionListItemHarness> {
    return getListItemPredicate(MatLegacyActionListItemHarness, options);
  }

  /**
   * Clicks on the action list item.
   *
   * 单击此动作列表条目。
   *
   */
  async click(): Promise<void> {
    return (await this.host()).click();
  }

  /**
   * Focuses the action list item.
   *
   * 让此动作列表条目获得焦点。
   *
   */
  async focus(): Promise<void> {
    return (await this.host()).focus();
  }

  /**
   * Blurs the action list item.
   *
   * 让此动作列表条目失焦。
   *
   */
  async blur(): Promise<void> {
    return (await this.host()).blur();
  }

  /**
   * Whether the action list item is focused.
   *
   * 此动作列表条目是否具有焦点。
   *
   */
  async isFocused(): Promise<boolean> {
    return (await this.host()).isFocused();
  }
}
