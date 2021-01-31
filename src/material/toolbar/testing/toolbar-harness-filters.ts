/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {BaseHarnessFilters} from '@angular/cdk/testing';

/** A set of criteria that can be used to filter a list of `MatToolbarHarness` instances. */
export interface ToolbarHarnessFilters extends BaseHarnessFilters {
  /**
   * Only find instances whose text matches the given value.
   *
   * 只查找其文本内容匹配指定值的实例。
   *
   */
  text?: string | RegExp;
}
