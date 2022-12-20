/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ComponentHarnessConstructor, HarnessPredicate} from '@angular/cdk/testing';
import {MatListHarnessBase} from './list-harness-base';
import {ActionListHarnessFilters, ActionListItemHarnessFilters} from './list-harness-filters';
import {getListItemPredicate, MatListItemHarnessBase} from './list-item-harness-base';

/**
 * Harness for interacting with a MDC-based action-list in tests.
 *
 * 在测试中用来与标准 mat-action-list 进行交互的测试工具。
 *
 */
export class MatActionListHarness extends MatListHarnessBase<
  typeof MatActionListItemHarness,
  MatActionListItemHarness,
  ActionListItemHarnessFilters
> {
  /**
   * The selector for the host element of a `MatActionList` instance.
   *
   * `MatActionList` 实例的宿主元素选择器。
   *
   */
  static hostSelector = '.mat-mdc-action-list';

  /**
   * Gets a `HarnessPredicate` that can be used to search for an action list with specific
   * attributes.
   *
   * 获取一个 `HarnessPredicate`，该 HarnessPredicate 可用于搜索满足某些条件的 `MatActionListHarness`。
   *
   * @param options Options for filtering which action list instances are considered a match.
   *
   * 用于过滤哪些动作列表实例应该视为匹配的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with<T extends MatActionListHarness>(
    this: ComponentHarnessConstructor<T>,
    options: ActionListHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options);
  }

  override _itemHarness = MatActionListItemHarness;
}

/**
 * Harness for interacting with an action list item.
 *
 * 与动作列表条目进行交互的测试工具。
 *
 */
export class MatActionListItemHarness extends MatListItemHarnessBase {
  /**
   * The selector for the host element of a `MatListItem` instance.
   *
   * `MatListItem` 实例的宿主元素选择器。
   *
   */
  static hostSelector = `${MatActionListHarness.hostSelector} .mat-mdc-list-item`;

  /**
   * Gets a `HarnessPredicate` that can be used to search for a list item with specific
   * attributes.
   *
   * 获取一个 `HarnessPredicate`，该 HarnessPredicate 可用于搜索满足某些条件的 `MatActionListItemHarness`。
   *
   * @param options Options for filtering which action list item instances are considered a match.
   *
   * 用于过滤哪些动作列表条目目实例应该视为匹配项的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with<T extends MatActionListItemHarness>(
    this: ComponentHarnessConstructor<T>,
    options: ActionListItemHarnessFilters = {},
  ): HarnessPredicate<T> {
    return getListItemPredicate(this, options);
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
