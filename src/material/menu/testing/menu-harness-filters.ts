/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {BaseHarnessFilters} from '@angular/cdk/testing';

/**
 * A set of criteria that can be used to filter a list of `MatMenuHarness` instances.
 *
 * 一组可用于过滤 `MatMenuHarness` 实例列表的条件。
 *
 */
export interface MenuHarnessFilters extends BaseHarnessFilters {
  /**
   * Only find instances whose trigger text matches the given value.
   *
   * 仅查找其触发文本与给定值匹配的实例。
   *
   */
  triggerText?: string | RegExp;
}

/**
 * A set of criteria that can be used to filter a list of `MatMenuItemHarness` instances.
 *
 * 一组可用于过滤 `MatMenuItemHarness` 实例列表的条件。
 *
 */
export interface MenuItemHarnessFilters extends BaseHarnessFilters {
  /**
   * Only find instances whose text matches the given value.
   *
   * 只查找其文本内容匹配指定值的实例。
   *
   */
  text?: string | RegExp;
  /**
   * Only find instances that have a sub-menu.
   *
   * 仅查找具有子菜单的实例。
   *
   */
  hasSubmenu?: boolean;
}
