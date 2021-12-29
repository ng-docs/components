/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {BaseHarnessFilters} from '@angular/cdk/testing';

/**
 * A set of criteria that can be used to filter a list of `MatGridListHarness` instances.
 *
 * 一组可用于过滤 `MatGridListHarness` 实例列表的条件。
 *
 */
export interface GridListHarnessFilters extends BaseHarnessFilters {}

/**
 * A set of criteria that can be used to filter a list of `MatTileHarness` instances.
 *
 * 一组可用于过滤 `MatTileHarness` 实例列表的条件。
 *
 */
export interface GridTileHarnessFilters extends BaseHarnessFilters {
  /**
   * Text the grid-tile header should match.
   *
   * 网格图块头部应匹配的文本。
   *
   */
  headerText?: string | RegExp;
  /**
   * Text the grid-tile footer should match.
   *
   * 网格图块尾部应匹配的文本。
   *
   */
  footerText?: string | RegExp;
}
