/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {BaseHarnessFilters} from '@angular/cdk/testing';

/**
 * A set of criteria that can be used to filter a list of `MatSlideToggleHarness` instances.
 *
 * 一组可用于过滤 `MatSlideToggleHarness` 实例列表的条件。
 *
 */
export interface SlideToggleHarnessFilters extends BaseHarnessFilters {
  /**
   * Only find instances whose label matches the given value.
   *
   * 只查找标签与指定值匹配的实例。
   *
   */
  label?: string | RegExp;
  /**
   * Only find instances whose name is the given value.
   *
   * 仅查找名称为给定值的实例。
   *
   */
  name?: string;
  /** Only find instances with the given checked value. */
  checked?: boolean;
  /** Only find instances where the disabled state matches the given value. */
  disabled?: boolean;
}
