/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {BaseHarnessFilters} from '@angular/cdk/testing';

/**
 * A set of criteria that can be used to filter a list of `MatDrawerHarness` instances.
 *
 * 一组可用于过滤 `MatDrawerHarness` 实例列表的条件。
 *
 */
export interface DrawerHarnessFilters extends BaseHarnessFilters {
  /**
   * Only find instances whose side is the given value.
   *
   * 只找到位置为给定值的实例。
   *
   */
  position?: 'start' | 'end';
}

/**
 * A set of criteria that can be used to filter a list of `MatDrawerContainerHarness` instances.
 *
 * 一组可用于过滤 `MatDrawerContainerHarness` 实例列表的条件。
 *
 */
export interface DrawerContainerHarnessFilters extends BaseHarnessFilters {}

/**
 * A set of criteria that can be used to filter a list of `MatDrawerContentHarness` instances.
 *
 * 一组可用于过滤 `MatDrawerContentHarness` 实例列表的条件。
 *
 */
export interface DrawerContentHarnessFilters extends BaseHarnessFilters {}
