/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {BaseHarnessFilters} from '@angular/cdk/testing';

/**
 * A set of criteria that can be used to filter a list of `MatTabHarness` instances.
 *
 * 一组可用于过滤 `MatTabHarness` 实例列表的条件。
 *
 */
export interface TabHarnessFilters extends BaseHarnessFilters {
  /**
   * Only find instances whose label matches the given value.
   *
   * 只查找标签与指定值匹配的实例。
   *
   */
  label?: string | RegExp;
  /** Only find instances whose selected state matches the given value. */
  selected?: boolean;
}

/**
 * A set of criteria that can be used to filter a list of `MatTabGroupHarness` instances.
 *
 * 一组可用于过滤 `MatTabGroupHarness` 实例列表的条件。
 *
 */
export interface TabGroupHarnessFilters extends BaseHarnessFilters {
  /**
   * Only find instances whose selected tab label matches the given value.
   *
   * 仅查找其选定选项卡标签与给定值匹配的实例。
   *
   */
  selectedTabLabel?: string | RegExp;
}

/**
 * A set of criteria that can be used to filter a list of `MatTabLinkHarness` instances.
 *
 * 一组可用于过滤 `MatTabLinkHarness` 实例列表的条件。
 *
 */
export interface TabLinkHarnessFilters extends BaseHarnessFilters {
  /**
   * Only find instances whose label matches the given value.
   *
   * 只查找标签与指定值匹配的实例。
   *
   */
  label?: string | RegExp;
}

/**
 * A set of criteria that can be used to filter a list of `MatTabNavBarHarness` instances.
 *
 * 一组可用于过滤 `MatTabNavBarHarness` 实例列表的条件。
 *
 */
export interface TabNavBarHarnessFilters extends BaseHarnessFilters {}

/**
 * A set of criteria that can be used to filter a list of `MatTabNavPanelHarness` instances.
 *
 * 一组可用于过滤 `MatTabNavBarHarness` 实例列表的条件。
 *
 */
export interface TabNavPanelHarnessFilters extends BaseHarnessFilters {}
