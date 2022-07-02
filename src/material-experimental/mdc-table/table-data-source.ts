/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {_MatTableDataSource, MatTableDataSourcePaginator} from '@angular/material/table';

/**
 * Data source that accepts a client-side data array and includes native support of filtering,
 * sorting (using MatSort), and pagination (using MatPaginator).
 *
 * 可接受客户端数据的数据源，包括原生支持的过滤、排序（使用 MatSort）和分页（使用 MatPaginator）。
 *
 * Allows for sort customization by overriding sortingDataAccessor, which defines how data
 * properties are accessed. Also allows for filter customization by overriding filterTermAccessor,
 * which defines how row data is converted to a string for filter matching.
 *
 * 可以通过改写 sortingDataAccessor 来进行自定义排序，它定义了要如何访问数据属性。 还允许通过改写 filterTermAccessor 来自定义过滤器，它定义了要如何将行数据转换成字符串以进行过滤匹配。
 *
 * **Note:** This class is meant to be a simple data source to help you get started. As such
 * it isn't equipped to handle some more advanced cases like robust i18n support or server-side
 * interactions. If your app needs to support more advanced use cases, consider implementing your
 * own `DataSource`.
 *
 * **注意：**这个类是一个简单的数据源，可以帮助你入门。因此，它无法处理某些更高级的案例，比如提供强大的 i18n 支持或服务器端交互。 如果你的应用需要支持更高级的用例，可以考虑实现自己的 `DataSource`。
 *
 */
export class MatTableDataSource<
  T,
  P extends MatTableDataSourcePaginator = MatTableDataSourcePaginator,
> extends _MatTableDataSource<T, P> {}
