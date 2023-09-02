/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Injectable} from '@angular/core';
import {Observable, Subject} from 'rxjs';

/**
 * Indicates the width of a column.
 *
 * 指示列的宽度。
 *
 */
export interface ColumnSize {
  /**
   * The ID/name of the column, as defined in CdkColumnDef.
   *
   * 此列的 ID/名称，如 CdkColumnDef 中所定义。
   *
   */
  readonly columnId: string;

  /**
   * The width in pixels of the column.
   *
   * 此列的宽度（以像素为单位）。
   *
   */
  readonly size: number;

  /**
   * The width in pixels of the column prior to this update, if known.
   *
   * 此更新之前列的宽度（以像素为单位）（如果已知）。
   *
   */
  readonly previousSize?: number;
}

/**
 * Interface describing column size changes.
 *
 * 描述列大小更改的接口。
 *
 */
export interface ColumnSizeAction extends ColumnSize {
  /**
   * Whether the resize action should be applied instantaneously. False for events triggered during
   * a UI-triggered resize \(such as with the mouse\) until the mouse button is released. True
   * for all programmatically triggered resizes.
   *
   * 是否应该立即应用此调整大小操作。对于在 UI 触发的（例如使用鼠标）调整大小期间触发的事件，直到释放鼠标按钮未知都为 false。对于所有以编程方式触发的调整大小都为 true。
   *
   */
  readonly completeImmediately?: boolean;

  /**
   * Whether the resize action is being applied to a sticky/stickyEnd column.
   *
   * 此调整大小操作是否应用于 sticky/stickyEnd 列。
   *
   */
  readonly isStickyColumn?: boolean;
}

/**
 * Originating source of column resize events within a table.
 *
 * 表中列的大小调整事件的原始来源。
 *
 * @docs-private
 */
@Injectable()
export class ColumnResizeNotifierSource {
  /**
   * Emits when an in-progress resize is canceled.
   *
   * 当取消正在进行的调整大小操作时发出。
   *
   */
  readonly resizeCanceled = new Subject<ColumnSizeAction>();

  /**
   * Emits when a resize is applied.
   *
   * 当已调整完大小时发出。
   *
   */
  readonly resizeCompleted = new Subject<ColumnSize>();

  /**
   * Triggers a resize action.
   *
   * 触发调整大小操作。
   *
   */
  readonly triggerResize = new Subject<ColumnSizeAction>();
}

/**
 * Service for triggering column resizes imperatively or being notified of them.
 *
 * 用于强制或被通知触发列调整大小的服务。
 *
 */
@Injectable()
export class ColumnResizeNotifier {
  /**
   * Emits whenever a column is resized.
   *
   * 每当调整列大小时发出。
   *
   */
  readonly resizeCompleted: Observable<ColumnSize> = this._source.resizeCompleted;

  constructor(private readonly _source: ColumnResizeNotifierSource) {}

  /**
   * Instantly resizes the specified column.
   *
   * 立即调整指定列的大小。
   *
   */
  resize(columnId: string, size: number): void {
    this._source.triggerResize.next({
      columnId,
      size,
      completeImmediately: true,
      isStickyColumn: true,
    });
  }
}
