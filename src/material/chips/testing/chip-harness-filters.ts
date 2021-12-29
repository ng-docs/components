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
 */
export interface ChipHarnessFilters extends BaseHarnessFilters {
  /**
   * Only find instances whose text matches the given value.
   *
   * 只查找文本与指定值匹配的实例。
   *
   */
  text?: string | RegExp;
  /**
   * Only find chip instances whose selected state matches the given value.
   *
   * 只查找选定状态与指定值匹配的纸片实例。
   *
   * @deprecated Use `MatChipOptionHarness` together with `ChipOptionHarnessFilters`.
   *
   * 将 `MatChipOptionHarness` 和 `ChipOptionHarnessFilters` 一起使用。
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
 */
export interface ChipOptionHarnessFilters extends ChipHarnessFilters {
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
 */
export interface ChipListHarnessFilters extends BaseHarnessFilters {}

/**
 * A set of criteria that can be used to filter selectable chip list instances.
 *
 * 一组可用于过滤可选纸片列表实例的准则。
 *
 */
export interface ChipListboxHarnessFilters extends BaseHarnessFilters {}

/**
 * A set of criteria that can be used to filter a list of `MatChipListInputHarness` instances.
 *
 * 一组标准，可以用来过滤 `MatChipListInputHarness` 实例列表。
 *
 */
export interface ChipInputHarnessFilters extends BaseHarnessFilters {
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
 */
export interface ChipRemoveHarnessFilters extends BaseHarnessFilters {}

/** A set of criteria that can be used to filter a list of `MatChipAvatarHarness` instances. */
export interface ChipAvatarHarnessFilters extends BaseHarnessFilters {}
