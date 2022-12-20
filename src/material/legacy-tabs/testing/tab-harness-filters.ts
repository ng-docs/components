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
 * @deprecated
 *
 * Use `TabHarnessFilters` from `@angular/material/tabs/testing` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
export interface LegacyTabHarnessFilters extends BaseHarnessFilters {
  /**
   * Only find instances whose label matches the given value.
   *
   * 只查找标签与指定值匹配的实例。
   *
   */
  label?: string | RegExp;
  /**
   * Only find instances whose selected state matches the given value.
   *
   * 仅查找所选状态与给定值匹配的实例。
   *
   */
  selected?: boolean;
}

/**
 * A set of criteria that can be used to filter a list of `MatTabGroupHarness` instances.
 *
 * 一组可用于过滤 `MatTabGroupHarness` 实例列表的条件。
 *
 * @deprecated
 *
 * Use `TabGroupHarnessFilters` from `@angular/material/tabs/testing` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
export interface LegacyTabGroupHarnessFilters extends BaseHarnessFilters {
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
 * @deprecated
 *
 * Use `TabLinkHarnessFilters` from `@angular/material/tabs/testing` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
export interface LegacyTabLinkHarnessFilters extends BaseHarnessFilters {
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
 * @deprecated
 *
 * Use `TabNavBarHarnessFilters` from `@angular/material/tabs/testing` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
export interface LegacyTabNavBarHarnessFilters extends BaseHarnessFilters {}

/**
 * A set of criteria that can be used to filter a list of `MatTabNavBarHarness` instances.
 *
 * 一组可用于过滤 `MatTabNavBarHarness` 实例列表的条件。
 *
 * @deprecated
 *
 * Use `TabNavPanelHarnessFilters` from `@angular/material/tabs/testing` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
export interface LegacyTabNavPanelHarnessFilters extends BaseHarnessFilters {}
