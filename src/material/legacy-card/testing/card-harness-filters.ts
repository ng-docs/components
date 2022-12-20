/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {BaseHarnessFilters} from '@angular/cdk/testing';

/**
 * A set of criteria that can be used to filter a list of `MatCardHarness` instances.
 *
 * 一组可以用来过滤 `MatCardHarness` 实例列表的条件。
 *
 * @deprecated
 *
 * Use `CardHarnessFilters` from `@angular/material/card/testing` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
export interface LegacyCardHarnessFilters extends BaseHarnessFilters {
  /**
   * Only find instances whose text matches the given value.
   *
   * 只查找其文本内容匹配指定值的实例。
   *
   */
  text?: string | RegExp;
  /**
   * Only find instances whose title matches the given value.
   *
   * 只查找标题与指定值匹配的实例。
   *
   */
  title?: string | RegExp;
  /**
   * Only find instances whose subtitle matches the given value.
   *
   * 只查找副标题匹配指定值的实例。
   *
   */
  subtitle?: string | RegExp;
}
