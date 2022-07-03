/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {InjectionToken} from '@angular/core';
import {MenuStackItem} from './menu-stack';
import {FocusOrigin} from '@angular/cdk/a11y';

/**
 * Injection token used to return classes implementing the Menu interface
 *
 * 用于返回实现 Menu 接口的类的注入令牌
 *
 */
export const CDK_MENU = new InjectionToken<Menu>('cdk-menu');

/**
 * Interface which specifies Menu operations and used to break circular dependency issues
 *
 * 指定菜单操作并用于打破循环依赖问题的接口
 *
 */
export interface Menu extends MenuStackItem {
  /**
   * The id of the menu's host element.
   *
   * 菜单的宿主元素的 id。
   *
   */
  id: string;

  /**
   * The menu's native DOM host element.
   *
   * 菜单的原生 DOM 宿主元素。
   *
   */
  nativeElement: HTMLElement;

  /**
   * The direction items in the menu flow.
   *
   * 菜单流中的菜单项方向。
   *
   */
  readonly orientation: 'horizontal' | 'vertical';

  /**
   * Place focus on the first MenuItem in the menu.
   *
   * 将焦点放在菜单中的第一个 MenuItem 上。
   *
   */
  focusFirstItem(focusOrigin: FocusOrigin): void;

  /**
   * Place focus on the last MenuItem in the menu.
   *
   * 将焦点放在菜单中的最后一个 MenuItem。
   *
   */
  focusLastItem(focusOrigin: FocusOrigin): void;
}
