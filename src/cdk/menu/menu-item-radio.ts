/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {UniqueSelectionDispatcher} from '@angular/cdk/collections';
import {Directive, inject, OnDestroy} from '@angular/core';
import {CdkMenuItemSelectable} from './menu-item-selectable';
import {CdkMenuItem} from './menu-item';

/**
 * Counter used to set a unique id and name for a selectable item
 *
 * 用于为可选菜单项设置唯一 ID 和名称的计数器
 *
 */
let nextId = 0;

/**
 * A directive providing behavior for the "menuitemradio" ARIA role, which behaves similarly to
 * a conventional radio-button. Any sibling `CdkMenuItemRadio` instances within the same `CdkMenu`
 * or `CdkMenuGroup` comprise a radio group with unique selection enforced.
 *
 * 为 “menuitemradio” ARIA 角色提供行为的指令，其行为类似于传统的单选按钮。同一个 `CdkMenu` 或 `CdkMenuGroup` 中的任何同级 `CdkMenuItemRadio` 实例都包含一个强制执行唯一选择的单选组。
 *
 */
@Directive({
  selector: '[cdkMenuItemRadio]',
  exportAs: 'cdkMenuItemRadio',
  standalone: true,
  host: {
    'role': 'menuitemradio',
    '[class.cdk-menu-item-radio]': 'true',
  },
  providers: [
    {provide: CdkMenuItemSelectable, useExisting: CdkMenuItemRadio},
    {provide: CdkMenuItem, useExisting: CdkMenuItemSelectable},
  ],
})
export class CdkMenuItemRadio extends CdkMenuItemSelectable implements OnDestroy {
  /**
   * The unique selection dispatcher for this radio's `CdkMenuGroup`.
   *
   * 此单选组的 `CdkMenuGroup` 的“唯一选取结果”调度器。
   *
   */
  private readonly _selectionDispatcher = inject(UniqueSelectionDispatcher);

  /**
   * An ID to identify this radio item to the `UniqueSelectionDispatcher`.
   *
   * 用于在 `UniqueSelectionDisptcher` 中作为此单选项标识的 ID。
   *
   */
  private _id = `${nextId++}`;

  /**
   * Function to unregister the selection dispatcher
   *
   * 取消注册选取结果调度器的函数
   *
   */
  private _removeDispatcherListener: () => void;

  constructor() {
    super();
    this._registerDispatcherListener();
  }

  override ngOnDestroy() {
    super.ngOnDestroy();

    this._removeDispatcherListener();
  }

  /**
   * Toggles the checked state of the radio-button.
   *
   * 切换单选按钮的选中状态。
   *
   * @param options Options the configure how the item is triggered
   *
   * 配置此菜单项如何触发的选项
   *
   * - keepOpen: specifies that the menu should be kept open after triggering the item.
   *
   *   keepOpen：指定触发项后菜单是否应保持打开状态。
   *
   */
  override trigger(options?: {keepOpen: boolean}) {
    super.trigger(options);

    if (!this.disabled) {
      this._selectionDispatcher.notify(this._id, '');
    }
  }

  /**
   * Configure the unique selection dispatcher listener in order to toggle the checked state
   *
   * 配置唯一选取结果调度器的侦听器以切换选中状态
   *
   */
  private _registerDispatcherListener() {
    this._removeDispatcherListener = this._selectionDispatcher.listen((id: string) => {
      this.checked = this._id === id;
    });
  }
}
