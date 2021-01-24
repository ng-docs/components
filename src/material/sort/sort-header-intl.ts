/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Injectable, SkipSelf, Optional} from '@angular/core';
import {Subject} from 'rxjs';

/**
 * To modify the labels and text displayed, create a new instance of MatSortHeaderIntl and
 * include it in a custom provider.
 *
 * 要修改显示的标签和文本，就要创建一个 MatSortHeaderIntl 的新实例，并把它包含在自定义提供者中。
 *
 */
@Injectable({providedIn: 'root'})
export class MatSortHeaderIntl {
  /**
   * Stream that emits whenever the labels here are changed. Use this to notify
   * components if the labels have changed after initialization.
   *
   * 只要这里的标签发生了变化就会发出流。如果标签在初始化后发生了变化，就用它来通知组件。
   *
   */
  readonly changes: Subject<void> = new Subject<void>();

  /**
   * ARIA label for the sorting button.
   *
   * 排序按钮的 ARIA 标签。
   *
   * @deprecated Not used anymore. To be removed.
   * @breaking-change 8.0.0
   */
  sortButtonLabel = (id: string) => {
    return `Change sorting for ${id}`;
  }
}
/** @docs-private */
export function MAT_SORT_HEADER_INTL_PROVIDER_FACTORY(parentIntl: MatSortHeaderIntl) {
  return parentIntl || new MatSortHeaderIntl();
}

/** @docs-private */
export const MAT_SORT_HEADER_INTL_PROVIDER = {
  // If there is already an MatSortHeaderIntl available, use that. Otherwise, provide a new one.
  provide: MatSortHeaderIntl,
  deps: [[new Optional(), new SkipSelf(), MatSortHeaderIntl]],
  useFactory: MAT_SORT_HEADER_INTL_PROVIDER_FACTORY
};

