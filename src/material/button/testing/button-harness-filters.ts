/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {BaseHarnessFilters} from '@angular/cdk/testing';

/**
 * Possible button appearances.
 *
 * 一些可能的按钮外观。
 *
 */
export type ButtonVariant = 'basic' | 'raised' | 'flat' | 'icon' | 'stroked' | 'fab' | 'mini-fab';

/**
 * A set of criteria that can be used to filter a list of button harness instances.
 *
 * 一组可以用来过滤 `MatButtonHarness` 实例列表的条件。
 *
 */
export interface ButtonHarnessFilters extends BaseHarnessFilters {
  /**
   * Only find instances whose text matches the given value.
   *
   * 只查找其文本内容匹配指定值的实例。
   *
   */
  text?: string | RegExp;

  /** Only find instances with a variant. */
  variant?: ButtonVariant;

  /** Only find instances which match the given disabled state. */
  disabled?: boolean;
}
