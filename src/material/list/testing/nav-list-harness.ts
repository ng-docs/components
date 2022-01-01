/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {HarnessPredicate} from '@angular/cdk/testing';
import {MatListHarnessBase} from './list-harness-base';
import {NavListHarnessFilters, NavListItemHarnessFilters} from './list-harness-filters';
import {getListItemPredicate, MatListItemHarnessBase} from './list-item-harness-base';

/**
 * Harness for interacting with a standard mat-nav-list in tests.
 *
 * 在测试中用来与标准 mat-nav-list 进行交互的测试工具。
 *
 */
export class MatNavListHarness extends MatListHarnessBase<
  typeof MatNavListItemHarness,
  MatNavListItemHarness,
  NavListItemHarnessFilters
> {
  /**
   * The selector for the host element of a `MatNavList` instance.
   *
   * `MatNavList` 实例的宿主元素选择器。
   *
   */
  static hostSelector = '.mat-nav-list';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `MatNavListHarness` that meets
   * certain criteria.
   *
   * 获取一个 `HarnessPredicate`，可用于搜索满足某些条件的 `MatNavListHarness`。
   *
   * @param options Options for filtering which nav list instances are considered a match.
   *
   * 用于过滤哪些导航列表实例应该视为匹配项的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with(options: NavListHarnessFilters = {}): HarnessPredicate<MatNavListHarness> {
    return new HarnessPredicate(MatNavListHarness, options);
  }

  override _itemHarness = MatNavListItemHarness;
}

/**
 * Harness for interacting with a nav list item.
 *
 * 与导航列表项进行交互的测试工具。
 *
 */
export class MatNavListItemHarness extends MatListItemHarnessBase {
  /**
   * The selector for the host element of a `MatListItem` instance.
   *
   * `MatListItem` 实例的宿主元素选择器。
   *
   */
  static hostSelector = `${MatNavListHarness.hostSelector} .mat-list-item`;

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `MatNavListItemHarness` that
   * meets certain criteria.
   *
   * 获取一个 `HarnessPredicate`，该 HarnessPredicate 可用于搜索满足某些条件的 `MatNavListItemHarness`。
   *
   * @param options Options for filtering which nav list item instances are considered a match.
   *
   * 用于过滤哪些导航列表条目实例应该视为匹配项的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with(options: NavListItemHarnessFilters = {}): HarnessPredicate<MatNavListItemHarness> {
    return getListItemPredicate(MatNavListItemHarness, options).addOption(
      'href',
      options.href,
      async (harness, href) => HarnessPredicate.stringMatches(harness.getHref(), href),
    );
  }

  /**
   * Gets the href for this nav list item.
   *
   * 获取此导航列表项的 href。
   *
   */
  async getHref(): Promise<string | null> {
    return (await this.host()).getAttribute('href');
  }

  /**
   * Clicks on the nav list item.
   *
   * 单击此导航列表项。
   *
   */
  async click(): Promise<void> {
    return (await this.host()).click();
  }

  /**
   * Focuses the nav list item.
   *
   * 让此导航列表项获得焦点。
   *
   */
  async focus(): Promise<void> {
    return (await this.host()).focus();
  }

  /**
   * Blurs the nav list item.
   *
   * 让此导航列表项失焦。
   *
   */
  async blur(): Promise<void> {
    return (await this.host()).blur();
  }

  /**
   * Whether the nav list item is focused.
   *
   * 此导航列表项是否拥有焦点。
   *
   */
  async isFocused(): Promise<boolean> {
    return (await this.host()).isFocused();
  }
}
