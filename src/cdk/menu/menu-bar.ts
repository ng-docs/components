/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {AfterContentInit, Directive} from '@angular/core';
import {
  DOWN_ARROW,
  ESCAPE,
  hasModifierKey,
  LEFT_ARROW,
  RIGHT_ARROW,
  TAB,
  UP_ARROW,
} from '@angular/cdk/keycodes';
import {takeUntil} from 'rxjs/operators';
import {CdkMenuGroup} from './menu-group';
import {CDK_MENU} from './menu-interface';
import {FocusNext, MENU_STACK, MenuStack} from './menu-stack';
import {CdkMenuBase} from './menu-base';

/**
 * Directive applied to an element which configures it as a MenuBar by setting the appropriate
 * role, aria attributes, and accessible keyboard and mouse handling logic. The component that
 * this directive is applied to should contain components marked with CdkMenuItem.
 *
 * 指令应用于通过设置适当的角色、aria 属性和无障碍化键盘和鼠标处理逻辑将其配置为 MenuBar 的元素。应用此指令的组件应包含标有 CdkMenuItem 的组件。
 *
 */
@Directive({
  selector: '[cdkMenuBar]',
  exportAs: 'cdkMenuBar',
  standalone: true,
  host: {
    'role': 'menubar',
    'class': 'cdk-menu-bar',
    '(keydown)': '_handleKeyEvent($event)',
  },
  providers: [
    {provide: CdkMenuGroup, useExisting: CdkMenuBar},
    {provide: CDK_MENU, useExisting: CdkMenuBar},
    {provide: MENU_STACK, useFactory: () => MenuStack.inline('horizontal')},
  ],
})
export class CdkMenuBar extends CdkMenuBase implements AfterContentInit {
  /**
   * The direction items in the menu flow.
   *
   * 菜单流中的菜单项方向。
   *
   */
  override readonly orientation = 'horizontal';

  /**
   * Whether the menu is displayed inline (i.e. always present vs a conditional popup that the user triggers with a trigger element).
   *
   * 菜单是否内联显示（即始终存在的弹出菜单，与之相对的是通过触发器元素由用户触发的条件化弹出菜单）。
   *
   */
  override readonly isInline = true;

  override ngAfterContentInit() {
    super.ngAfterContentInit();
    this._subscribeToMenuStackEmptied();
  }

  /**
   * Handle keyboard events for the Menu.
   *
   * 处理本菜单的键盘事件。
   *
   * @param event The keyboard event to be handled.
   *
   * 要处理的键盘事件。
   *
   */
  _handleKeyEvent(event: KeyboardEvent) {
    const keyManager = this.keyManager;
    switch (event.keyCode) {
      case UP_ARROW:
      case DOWN_ARROW:
      case LEFT_ARROW:
      case RIGHT_ARROW:
        if (!hasModifierKey(event)) {
          const horizontalArrows = event.keyCode === LEFT_ARROW || event.keyCode === RIGHT_ARROW;
          // For a horizontal menu if the left/right keys were clicked, or a vertical menu if the
          // up/down keys were clicked: if the current menu is open, close it then focus and open the
          // next  menu.
          if (horizontalArrows) {
            event.preventDefault();

            const prevIsOpen = keyManager.activeItem?.isMenuOpen();
            keyManager.activeItem?.getMenuTrigger()?.close();

            keyManager.setFocusOrigin('keyboard');
            keyManager.onKeydown(event);
            if (prevIsOpen) {
              keyManager.activeItem?.getMenuTrigger()?.open();
            }
          }
        }
        break;

      case ESCAPE:
        if (!hasModifierKey(event)) {
          event.preventDefault();
          keyManager.activeItem?.getMenuTrigger()?.close();
        }
        break;

      case TAB:
        if (!hasModifierKey(event, 'altKey', 'metaKey', 'ctrlKey')) {
          keyManager.activeItem?.getMenuTrigger()?.close();
        }
        break;

      default:
        keyManager.onKeydown(event);
    }
  }

  /**
   * Set focus to either the current, previous or next item based on the FocusNext event, then
   * open the previous or next item.
   *
   * 根据 FocusNext 事件将焦点设置到当前、上一个或下一个菜单项，然后打开上一个或下一个菜单项。
   *
   * @param focusNext The element to focus.
   *
   * 要聚焦的元素。
   *
   */
  private _toggleOpenMenu(focusNext: FocusNext | undefined) {
    const keyManager = this.keyManager;
    switch (focusNext) {
      case FocusNext.nextItem:
        keyManager.setFocusOrigin('keyboard');
        keyManager.setNextItemActive();
        keyManager.activeItem?.getMenuTrigger()?.open();
        break;

      case FocusNext.previousItem:
        keyManager.setFocusOrigin('keyboard');
        keyManager.setPreviousItemActive();
        keyManager.activeItem?.getMenuTrigger()?.open();
        break;

      case FocusNext.currentItem:
        if (keyManager.activeItem) {
          keyManager.setFocusOrigin('keyboard');
          keyManager.setActiveItem(keyManager.activeItem);
        }
        break;
    }
  }

  /**
   * Subscribe to the MenuStack emptied events.
   *
   * 订阅 MenuStack 清空事件。
   *
   */
  private _subscribeToMenuStackEmptied() {
    this.menuStack?.emptied
      .pipe(takeUntil(this.destroyed))
      .subscribe(event => this._toggleOpenMenu(event));
  }
}
