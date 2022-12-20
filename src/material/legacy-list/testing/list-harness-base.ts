/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  ComponentHarness,
  ComponentHarnessConstructor,
  HarnessPredicate,
  parallel,
} from '@angular/cdk/testing';
import {DividerHarnessFilters, MatDividerHarness} from '@angular/material/divider/testing';
import {
  LegacyBaseListItemHarnessFilters,
  LegacySubheaderHarnessFilters,
} from './list-harness-filters';
import {MatLegacySubheaderHarness} from './list-item-harness-base';

/**
 * Represents a section of a list falling under a specific header.
 *
 * 表示属于特定标题的列表区段。
 *
 * @deprecated
 *
 * Use `ListSection` from `@angular/material/list/testing` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 * @breaking-change 17.0.0
 */
export interface ListSection<I> {
  /**
   * The heading for this list section. `undefined` if there is no heading.
   *
   * 此列表部分的标题。如果没有标题则为 `undefined`。
   *
   */
  heading?: string;

  /**
   * The items in this list section.
   *
   * 此列表部分中的条目。
   *
   */
  items: I[];
}

/**
 * Shared behavior among the harnesses for the various `MatList` flavors.
 *
 * 各种 `MatList` 风格的组件测试工具之间的共享行为。
 *
 * @template T A constructor type for a list item harness type used by this list harness.
 *
 * 此列表测试工具使用的列表条目测试工具类型的构造函数类型。
 *
 * @template C The list item harness type that `T` constructs.
 *
 * 用 `T` 构造的列表条目测试工具类型。
 *
 * @template F The filter type used filter list item harness of type `C`.
 *
 * 此过滤器类型使用 `C` 类型的过滤器列表条目测试工具。
 *
 * @docs-private
 * @deprecated
 *
 * Use `class` from `@angular/material/list/testing` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 * @breaking-change 17.0.0
 */
export abstract class MatLegacyListHarnessBase<
  T extends ComponentHarnessConstructor<C> & {with: (options?: F) => HarnessPredicate<C>},
  C extends ComponentHarness,
  F extends LegacyBaseListItemHarnessFilters,
> extends ComponentHarness {
  protected _itemHarness: T;

  /**
   * Gets a list of harnesses representing the items in this list.
   *
   * 获取代表此列表中条目的测试工具列表。
   *
   * @param filters Optional filters used to narrow which harnesses are included
   *
   * 用于收窄包括哪些测试工具的可选过滤器
   *
   * @return The list of items matching the given filters.
   *
   * 与给定过滤器匹配的条目列表。
   *
   */
  async getItems(filters?: F): Promise<C[]> {
    return this.locatorForAll(this._itemHarness.with(filters))();
  }

  /**
   * Gets a list of `ListSection` representing the list items grouped by subheaders. If the list has
   * no subheaders it is represented as a single `ListSection` with an undefined `heading` property.
   *
   * 获取一个 `ListSection` 的列表，该列表表示已按子标题分组的列表项。如果列表没有子表头，则它表示一个带有未定义 `heading` 属性的单个 `ListSection`。
   *
   * @param filters Optional filters used to narrow which list item harnesses are included
   *
   * 可选过滤器，用于收窄包括哪些列表项工具的范围
   *
   * @return The list of items matching the given filters, grouped into sections by subheader.
   *
   * 与给定过滤器匹配的条目列表，按子标题分为几部分。
   *
   */
  async getItemsGroupedBySubheader(filters?: F): Promise<ListSection<C>[]> {
    type Section = {items: C[]; heading?: Promise<string>};
    const listSections: Section[] = [];
    let currentSection: Section = {items: []};
    const itemsAndSubheaders = await this.getItemsWithSubheadersAndDividers({
      item: filters,
      divider: false,
    });
    for (const itemOrSubheader of itemsAndSubheaders) {
      if (itemOrSubheader instanceof MatLegacySubheaderHarness) {
        if (currentSection.heading !== undefined || currentSection.items.length) {
          listSections.push(currentSection);
        }
        currentSection = {heading: itemOrSubheader.getText(), items: []};
      } else {
        currentSection.items.push(itemOrSubheader);
      }
    }
    if (
      currentSection.heading !== undefined ||
      currentSection.items.length ||
      !listSections.length
    ) {
      listSections.push(currentSection);
    }

    // Concurrently wait for all sections to resolve their heading if present.
    return parallel(() =>
      listSections.map(async s => ({items: s.items, heading: await s.heading})),
    );
  }

  /**
   * Gets a list of sub-lists representing the list items grouped by dividers. If the list has no
   * dividers it is represented as a list with a single sub-list.
   *
   * 获取一个子列表的列表，该列表表示按分隔器分组的列表项。如果此列表没有分隔器，则将其表示为带有单个子列表的列表。
   *
   * @param filters Optional filters used to narrow which list item harnesses are included
   *
   * 可选过滤器，用于收窄包括哪些列表项工具的范围
   *
   * @return The list of items matching the given filters, grouped into sub-lists by divider.
   *
   * 与给定过滤器匹配的条目列表，由分隔器分组为子列表。
   *
   */
  async getItemsGroupedByDividers(filters?: F): Promise<C[][]> {
    const listSections: C[][] = [[]];
    const itemsAndDividers = await this.getItemsWithSubheadersAndDividers({
      item: filters,
      subheader: false,
    });
    for (const itemOrDivider of itemsAndDividers) {
      if (itemOrDivider instanceof MatDividerHarness) {
        listSections.push([]);
      } else {
        listSections[listSections.length - 1].push(itemOrDivider);
      }
    }
    return listSections;
  }

  /**
   * Gets a list of harnesses representing all of the items, subheaders, and dividers
   * (in the order they appear in the list). Use `instanceof` to check which type of harness a given
   * item is.
   *
   * 获取表示所有条目、子标题和分隔线的组件测试工具列表（按照它们在列表中出现的顺序）。使用 `instanceof` 检查给定条目的组件测试工具类型。
   *
   * @param filters Optional filters used to narrow which list items, subheaders, and dividers are
   *     included. A value of `false` for the `item`, `subheader`, or `divider` properties indicates
   *     that the respective harness type should be omitted completely.
   *
   * 用于缩小包含哪些列表条目、子标题和分隔符的可选过滤器。 `item`、`subheader` 或 `divider` 属性的值为 `false` 表示应完全省略相应的组件测试工具类型。
   *
   * @return The list of harnesses representing the items, subheaders, and dividers matching the
   *     given filters.
   *
   * 表示与给定过滤器匹配的条目、子标题和分隔符的组件测试工具列表。
   *
   */
  getItemsWithSubheadersAndDividers(filters: {
    item: false;
    subheader: false;
    divider: false;
  }): Promise<[]>;
  getItemsWithSubheadersAndDividers(filters: {
    item?: F | false;
    subheader: false;
    divider: false;
  }): Promise<C[]>;
  getItemsWithSubheadersAndDividers(filters: {
    item: false;
    subheader?: LegacySubheaderHarnessFilters | false;
    divider: false;
  }): Promise<MatLegacySubheaderHarness[]>;
  getItemsWithSubheadersAndDividers(filters: {
    item: false;
    subheader: false;
    divider?: DividerHarnessFilters | false;
  }): Promise<MatDividerHarness[]>;
  getItemsWithSubheadersAndDividers(filters: {
    item?: F | false;
    subheader?: LegacySubheaderHarnessFilters | false;
    divider: false;
  }): Promise<(C | MatLegacySubheaderHarness)[]>;
  getItemsWithSubheadersAndDividers(filters: {
    item?: F | false;
    subheader: false;
    divider?: false | DividerHarnessFilters;
  }): Promise<(C | MatDividerHarness)[]>;
  getItemsWithSubheadersAndDividers(filters: {
    item: false;
    subheader?: false | LegacySubheaderHarnessFilters;
    divider?: false | DividerHarnessFilters;
  }): Promise<(MatLegacySubheaderHarness | MatDividerHarness)[]>;
  getItemsWithSubheadersAndDividers(filters?: {
    item?: F | false;
    subheader?: LegacySubheaderHarnessFilters | false;
    divider?: DividerHarnessFilters | false;
  }): Promise<(C | MatLegacySubheaderHarness | MatDividerHarness)[]>;
  async getItemsWithSubheadersAndDividers(
    filters: {
      item?: F | false;
      subheader?: LegacySubheaderHarnessFilters | false;
      divider?: DividerHarnessFilters | false;
    } = {},
  ): Promise<(C | MatLegacySubheaderHarness | MatDividerHarness)[]> {
    const query = [];
    if (filters.item !== false) {
      query.push(this._itemHarness.with(filters.item || ({} as F)));
    }
    if (filters.subheader !== false) {
      query.push(MatLegacySubheaderHarness.with(filters.subheader));
    }
    if (filters.divider !== false) {
      query.push(MatDividerHarness.with(filters.divider));
    }
    return this.locatorForAll(...query)();
  }
}
