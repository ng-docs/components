/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Observable} from 'rxjs';

/**
 * Represents a range of numbers with a specified start and end.
 *
 * 表示特定起点和终点的数字范围。
 *
 */
export type ListRange = {start: number; end: number};
/**
 * Interface for any component that provides a view of some data collection and wants to provide
 * information regarding the view and any changes made.
 *
 * 让任何组件都可以提供某种数据集合视图的接口，它希望提供相关视图和所做过更改的信息。
 *
 */
export interface CollectionViewer {
  /**
   * A stream that emits whenever the `CollectionViewer` starts looking at a new portion of the
   * data. The `start` index is inclusive, while the `end` is exclusive.
   *
   * `CollectionViewer` 开始查看数据的新部分时就会发出的流。包含 `start` 索引，而不包含 `end` 索引（左闭右开区间）。
   *
   */
  viewChange: Observable<ListRange>;
}
