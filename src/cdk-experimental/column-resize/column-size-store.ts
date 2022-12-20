/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Injectable} from '@angular/core';

/**
 * Can be provided by the host application to enable persistence of column resize state.
 *
 * 可以由宿主应用程序提供以启用列调整大小状态的持久性。
 *
 */
@Injectable()
export abstract class ColumnSizeStore {
  /**
   * Returns the persisted size of the specified column in the specified table.
   *
   * 返回指定表中指定列的持久化大小。
   *
   */
  abstract getSize(tableId: string, columnId: string): number;

  /**
   * Persists the size of the specified column in the specified table.
   *
   * 持久化指定表中指定列的大小。
   *
   */
  abstract setSize(tableId: string, columnId: string): void;
}
