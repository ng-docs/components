/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Injectable, Optional, SkipSelf} from '@angular/core';
import {Subject} from 'rxjs';


/**
 * To modify the labels and text displayed, create a new instance of MatPaginatorIntl and
 * include it in a custom provider
 *
 * 要修改显示的标签和文本，就要创建一个新的 MatPaginatorIntl 实例，并把它包含在自定义提供者中
 *
 */
@Injectable({providedIn: 'root'})
export class MatPaginatorIntl {
  /**
   * Stream to emit from when labels are changed. Use this to notify components when the labels have
   * changed after initialization.
   *
   * 当标签发生变化时，要触发这个流。当初始化之后标签再发生变化时，用它来通知组件。
   *
   */
  readonly changes: Subject<void> = new Subject<void>();

  /**
   * A label for the page size selector.
   *
   * 分页大小选择器的标签。
   *
   */
  itemsPerPageLabel: string = 'Items per page:';

  /**
   * A label for the button that increments the current page.
   *
   * 用于增加当前分页按钮的标签。
   *
   */
  nextPageLabel: string = 'Next page';

  /**
   * A label for the button that decrements the current page.
   *
   * 用于减小当前分页按钮的标签。
   *
   */
  previousPageLabel: string = 'Previous page';

  /**
   * A label for the button that moves to the first page.
   *
   * 移动到第一页按钮的标签。
   *
   */
  firstPageLabel: string = 'First page';

  /**
   * A label for the button that moves to the last page.
   *
   * 移动到最后一页按钮的标签。
   *
   */
  lastPageLabel: string = 'Last page';

  /**
   * A label for the range of items within the current page and the length of the whole list.
   *
   * 当前分页当中条目范围的标签，以及整个列表的长度。
   *
   */
  getRangeLabel: (page: number, pageSize: number, length: number) => string =
    (page: number, pageSize: number, length: number) => {
      if (length == 0 || pageSize == 0) { return `0 of ${length}`; }

      length = Math.max(length, 0);

      const startIndex = page * pageSize;

      // If the start index exceeds the list length, do not try and fix the end index to the end.
      const endIndex = startIndex < length ?
          Math.min(startIndex + pageSize, length) :
          startIndex + pageSize;

      return `${startIndex + 1} – ${endIndex} of ${length}`;
    }
}

/** @docs-private */
export function MAT_PAGINATOR_INTL_PROVIDER_FACTORY(parentIntl: MatPaginatorIntl) {
  return parentIntl || new MatPaginatorIntl();
}

/** @docs-private */
export const MAT_PAGINATOR_INTL_PROVIDER = {
  // If there is already an MatPaginatorIntl available, use that. Otherwise, provide a new one.
  provide: MatPaginatorIntl,
  deps: [[new Optional(), new SkipSelf(), MatPaginatorIntl]],
  useFactory: MAT_PAGINATOR_INTL_PROVIDER_FACTORY
};
