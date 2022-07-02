/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {BaseHarnessFilters} from '@angular/cdk/testing';

export interface ChipHarnessFilters extends BaseHarnessFilters {
  /**
   * Only find instances whose text matches the given value.
   *
   * 只查找其文本内容匹配指定值的实例。
   *
   */
  text?: string | RegExp;
}

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

export interface ChipListboxHarnessFilters extends BaseHarnessFilters {}

export interface ChipOptionHarnessFilters extends ChipHarnessFilters {
  /**
   * Only find chip instances whose selected state matches the given value.
   *
   * 只查找选定状态与指定值匹配的纸片实例。
   *
   */
  selected?: boolean;
}

export interface ChipGridHarnessFilters extends BaseHarnessFilters {}

export interface ChipRowHarnessFilters extends ChipHarnessFilters {}

export interface ChipSetHarnessFilters extends BaseHarnessFilters {}

export interface ChipRemoveHarnessFilters extends BaseHarnessFilters {}

export interface ChipAvatarHarnessFilters extends BaseHarnessFilters {}
