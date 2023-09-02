/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ListKeyManager, ListKeyManagerOption} from './list-key-manager';

/**
 * This is the interface for highlightable items \(used by the ActiveDescendantKeyManager\).
 * Each item must know how to style itself as active or inactive and whether or not it is
 * currently disabled.
 *
 * 这是突出显示项的界面（由 ActiveDescendantKeyManager 使用）。每个条目都必须知道如何将自己设置为活动或非活动样式，以及当前是否处于禁用状态。
 *
 */
export interface Highlightable extends ListKeyManagerOption {
  /**
   * Applies the styles for an active item to this item.
   *
   * 将活动条目的样式应用于此条目。
   *
   */
  setActiveStyles(): void;

  /**
   * Applies the styles for an inactive item to this item.
   *
   * 将非活动条目的样式应用于此条目。
   *
   */
  setInactiveStyles(): void;
}

export class ActiveDescendantKeyManager<T> extends ListKeyManager<Highlightable & T> {
  /**
   * Sets the active item to the item at the specified index and adds the
   * active styles to the newly active item. Also removes active styles
   * from the previously active item.
   *
   * 将活动条目设置为指定索引处的条目，并将活动样式添加到新活动条目。也会从以前的活动条目中删除活动样式。
   *
   * @param index Index of the item to be set as active.
   *
   * 要设置为活动条目的索引。
   *
   */
  override setActiveItem(index: number): void;

  /**
   * Sets the active item to the item to the specified one and adds the
   * active styles to the it. Also removes active styles from the
   * previously active item.
   *
   * 将活动条目设置为指定的条目，并将活动样式添加到该条目。也从以前的活动条目中删除活动样式。
   *
   * @param item Item to be set as active.
   *
   * 要设置为活动的条目。
   *
   */
  override setActiveItem(item: T): void;

  override setActiveItem(index: any): void {
    if (this.activeItem) {
      this.activeItem.setInactiveStyles();
    }
    super.setActiveItem(index);
    if (this.activeItem) {
      this.activeItem.setActiveStyles();
    }
  }
}
