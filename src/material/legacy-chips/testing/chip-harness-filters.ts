/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {BaseHarnessFilters} from '@angular/cdk/testing';

/**
 * A set of criteria that can be used to filter a list of chip instances.
 *
 * 一组可以用来过滤纸片实例列表的标准。
 *
 * @deprecated
 *
 * Use `ChipHarnessFilters` from `@angular/material/chips/testing` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
export interface LegacyChipHarnessFilters extends BaseHarnessFilters {
  /**
   * Only find instances whose text matches the given value.
   *
   * 只查找其文本内容匹配指定值的实例。
   *
   */
  text?: string | RegExp;
  /**
   * Only find chip instances whose selected state matches the given value.
   *
   * 只查找选定状态与指定值匹配的纸片实例。
   *
   * @deprecated
   *
   * Use Legacy Chip Option Harness together with Legacy Chip Option Harness Filters.
   *
   * 将传统纸片选项测试工具与传统纸片选项测试工具过滤器联用。
   *
   * @breaking-change 12.0.0
   */
  selected?: boolean;
}

/**
 * A set of criteria that can be used to filter a list of selectable chip instances.
 *
 * 一组可以用来过滤可选纸片实例列表的标准。
 *
 * @deprecated
 *
 * Use `ChipOptionHarnessFilters` from `@angular/material/chips/testing` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
export interface LegacyChipOptionHarnessFilters extends LegacyChipHarnessFilters {
  /**
   * Only find chip instances whose selected state matches the given value.
   *
   * 只查找选定状态与指定值匹配的纸片实例。
   *
   */
  selected?: boolean;
}

/**
 * A set of criteria that can be used to filter chip list instances.
 *
 * 一组可以用来过滤纸片列表实例的标准。
 *
 * @deprecated
 *
 * Use `ChipListHarnessFilters` from `@angular/material/chips/testing` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
export interface LegacyChipListHarnessFilters extends BaseHarnessFilters {}

/**
 * A set of criteria that can be used to filter selectable chip list instances.
 *
 * 一组可用于过滤可选纸片列表实例的准则。
 *
 * @deprecated
 *
 * Use `ChipListboxHarnessFilters` from `@angular/material/chips/testing` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
export interface LegacyChipListboxHarnessFilters extends BaseHarnessFilters {}

/**
 * A set of criteria that can be used to filter a list of `MatChipListInputHarness` instances.
 *
 * 一组标准，可以用来过滤 `MatChipListInputHarness` 实例列表。
 *
 * @deprecated
 *
 * Use `ChipInputHarnessFilters` from `@angular/material/chips/testing` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
export interface LegacyChipInputHarnessFilters extends BaseHarnessFilters {
  /**
   * Filters based on the value of the input.
   *
   * 根据输入值过滤。
   *
   */
  value?: string | RegExp;
  /**
   * Filters based on the placeholder text of the input.
   *
   * 根据输入的占位符文本进行过滤。
   *
   */
  placeholder?: string | RegExp;
}

/**
 * A set of criteria that can be used to filter a list of `MatChipRemoveHarness` instances.
 *
 * 一组可以用来过滤 `MatChipRemoveHarness` 实例列表的条件。
 *
 * @deprecated
 *
 * Use `ChipRemoveHarnessFilters` from `@angular/material/chips/testing` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
export interface LegacyChipRemoveHarnessFilters extends BaseHarnessFilters {}

/**
 * A set of criteria that can be used to filter a list of `MatChipAvatarHarness` instances.
 *
 * 一组可用于过滤 `MatChipAvatarHarness` 实例列表的条件。
 *
 * @deprecated
 *
 * Use `ChipAvatarHarnessFilters` from `@angular/material/chips/testing` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
export interface LegacyChipAvatarHarnessFilters extends BaseHarnessFilters {}
