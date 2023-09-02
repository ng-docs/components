/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ConnectableObservable, Observable} from 'rxjs';
import {CollectionViewer} from './collection-viewer';

export abstract class DataSource<T> {
  /**
   * Connects a collection viewer \(such as a data-table\) to this data source. Note that
   * the stream provided will be accessed during change detection and should not directly change
   * values that are bound in template views.
   *
   * 将集合查看器（如数据表格）连接到这个数据源。请注意，提供的这个流将在变更检测期间被访问，并且不应直接更改模板视图中绑定的值。
   *
   * @param collectionViewer The component that exposes a view over the data provided by this
   *     data source.
   *
   * 用来暴露这个数据源提供的数据视图的组件。
   * @returns Observable that emits a new value when the data changes.
   *
   * 可观察对象，当数据发生变化时会发出新值。
   */
  abstract connect(collectionViewer: CollectionViewer): Observable<readonly T[]>;

  /**
   * Disconnects a collection viewer \(such as a data-table\) from this data source. Can be used
   * to perform any clean-up or tear-down operations when a view is being destroyed.
   *
   * 断开集合查看器（例如数据表格）与该数据源的连接。当视图被销毁时，可以执行任何清理或拆除操作。
   *
   * @param collectionViewer The component that exposes a view over the data provided by this
   *     data source.
   *
   * 用来暴露这个数据源提供的数据视图的组件。
   */
  abstract disconnect(collectionViewer: CollectionViewer): void;
}

/**
 * Checks whether an object is a data source.
 *
 * 检查对象是否为数据源。
 *
 */
export function isDataSource(value: any): value is DataSource<any> {
  // Check if the value is a DataSource by observing if it has a connect function. Cannot
  // be checked as an `instanceof DataSource` since people could create their own sources
  // that match the interface, but don't extend DataSource. We also can't use `isObservable`
  // here, because of some internal apps.
  return value && typeof value.connect === 'function' && !(value instanceof ConnectableObservable);
}
