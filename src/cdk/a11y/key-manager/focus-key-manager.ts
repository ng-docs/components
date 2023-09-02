/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ListKeyManager, ListKeyManagerOption} from './list-key-manager';
import {FocusOrigin} from '../focus-monitor/focus-monitor';

/**
 * This is the interface for focusable items \(used by the FocusKeyManager\).
 * Each item must know how to focus itself, whether or not it is currently disabled
 * and be able to supply its label.
 *
 * 这是可获取焦点条目的接口（由 FocusKeyManager 使用）。每个条目都必须知道如何获取焦点，无论当前是否已禁用并能提供其标签。
 *
 */
export interface FocusableOption extends ListKeyManagerOption {
  /**
   * Focuses the `FocusableOption`.
   *
   * 让此 `FocusableOption` 获得焦点。
   *
   */
  focus(origin?: FocusOrigin): void;
}

export class FocusKeyManager<T> extends ListKeyManager<FocusableOption & T> {
  private _origin: FocusOrigin = 'program';

  /**
   * Sets the focus origin that will be passed in to the items for any subsequent `focus` calls.
   *
   * 设置焦点来源，该焦点来源将传递给所有后续调用 `focus` 的条目。
   *
   * @param origin Focus origin to be used when focusing items.
   *
   * 用来让条目获取焦点时的焦点来源。
   *
   */
  setFocusOrigin(origin: FocusOrigin): this {
    this._origin = origin;
    return this;
  }

  /**
   * Sets the active item to the item at the specified
   * index and focuses the newly active item.
   *
   * 将活动条目设置为指定索引处的条目，并让新的活动条目获得焦点。
   *
   * @param index Index of the item to be set as active.
   *
   * 要设置为活动条目的索引。
   *
   */
  override setActiveItem(index: number): void;

  /**
   * Sets the active item to the item that is specified and focuses it.
   *
   * 将活动条目设置为指定的条目并让它获得焦点。
   *
   * @param item Item to be set as active.
   *
   * 要设置为活动的条目。
   *
   */
  override setActiveItem(item: T): void;

  override setActiveItem(item: any): void {
    super.setActiveItem(item);

    if (this.activeItem) {
      this.activeItem.focus(this._origin);
    }
  }
}
