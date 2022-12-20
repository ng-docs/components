/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {InjectionToken} from '@angular/core';

/**
 * The injection token used to specify the StickyPositioningListener.
 *
 * 这个注入令牌用来指定 StickyPositioningListener。
 *
 */
export const STICKY_POSITIONING_LISTENER = new InjectionToken<StickyPositioningListener>('CDK_SPL');

export type StickySize = number | null | undefined;
export type StickyOffset = number | null | undefined;

export interface StickyUpdate {
  elements?: readonly (HTMLElement[] | undefined)[];
  offsets?: StickyOffset[];
  sizes: StickySize[];
}

/**
 * If provided, CdkTable will call the methods below when it updates the size/
 * position/etc of its sticky rows and columns.
 *
 * 如果提供的话，CdkTable 在更新其粘性行和列的大小/位置等时会调用下面的方法。
 *
 */
export interface StickyPositioningListener {
  /**
   * Called when CdkTable updates its sticky start columns.
   *
   * 当 CdkTable 更新其粘性首列时调用。
   *
   */
  stickyColumnsUpdated(update: StickyUpdate): void;

  /**
   * Called when CdkTable updates its sticky end columns.
   *
   * 当 CdkTable 更新其粘性末列时调用。
   *
   */
  stickyEndColumnsUpdated(update: StickyUpdate): void;

  /**
   * Called when CdkTable updates its sticky header rows.
   *
   * 当 CdkTable 更新其粘性表头行时调用。
   *
   */
  stickyHeaderRowsUpdated(update: StickyUpdate): void;

  /**
   * Called when CdkTable updates its sticky footer rows.
   *
   * 当 CdkTable 更新其粘性表尾行时调用。
   *
   */
  stickyFooterRowsUpdated(update: StickyUpdate): void;
}
