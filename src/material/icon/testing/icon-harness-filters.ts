/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {BaseHarnessFilters} from '@angular/cdk/testing';

/**
 * Possible types of icons.
 *
 * 图标的可能类型。
 *
 */
export const enum IconType {SVG, FONT}

/**
 * A set of criteria that can be used to filter a list of `MatIconHarness` instances.
 *
 * 一组可用于过滤 `MatIconHarness` 实例列表的条件。
 *
 */
export interface IconHarnessFilters extends BaseHarnessFilters {
  /**
   * Filters based on the typef of the icon.
   *
   * 根据此图标的类型进行过滤。
   *
   */
  type?: IconType;
  /**
   * Filters based on the name of the icon.
   *
   * 根据图标名称进行过滤。
   *
   */
  name?: string | RegExp;
  /**
   * Filters based on the namespace of the icon.
   *
   * 根据图标的命名空间进行过滤。
   *
   */
  namespace?: string | null | RegExp;
}
