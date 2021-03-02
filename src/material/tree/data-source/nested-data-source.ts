/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {CollectionViewer, DataSource} from '@angular/cdk/collections';
import {BehaviorSubject, merge, Observable} from 'rxjs';
import {map} from 'rxjs/operators';

/**
 * Data source for nested tree.
 *
 * 嵌套树的数据源。
 *
 * The data source for nested tree doesn't have to consider node flattener, or the way to expand
 * or collapse. The expansion/collapsion will be handled by TreeControl and each non-leaf node.
 *
 * 嵌套树的数据源不必考虑节点展平器，也不必考虑展开或折叠的方式。展开/折叠将由 TreeControl 和每个非叶节点处理。
 *
 */
export class MatTreeNestedDataSource<T> extends DataSource<T> {
  _data = new BehaviorSubject<T[]>([]);

  /**
   * Data for the nested tree
   *
   * 嵌套树的数据
   *
   */
  get data() { return this._data.value; }
  set data(value: T[]) { this._data.next(value); }

  connect(collectionViewer: CollectionViewer): Observable<T[]> {
    return merge(...[collectionViewer.viewChange, this._data])
      .pipe(map(() => {
        return this.data;
      }));
  }

  disconnect() {
    // no op
  }
}

