/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {AfterContentInit, Directive, EventEmitter, inject, OnDestroy, Output} from '@angular/core';
import {ESCAPE, hasModifierKey, LEFT_ARROW, RIGHT_ARROW, TAB} from '@angular/cdk/keycodes';
import {takeUntil} from 'rxjs/operators';
import {CdkMenuGroup} from './menu-group';
import {CDK_MENU} from './menu-interface';
import {FocusNext, PARENT_OR_NEW_INLINE_MENU_STACK_PROVIDER} from './menu-stack';
import {MENU_TRIGGER} from './menu-trigger-base';
import {CdkMenuBase} from './menu-base';

/**
 * Directive which configures the element as a Menu which should contain child elements marked as
 * CdkMenuItem or CdkMenuGroup. Sets the appropriate role and aria-attributes for a menu and
 * contains accessible keyboard and mouse handling logic.
 *
 * 将此元素配置为菜单的指令，该菜单应包含标记为 CdkMenuItem 或 CdkMenuGroup 的子元素。为菜单设置适当的角色和 aria 属性，并包含可访问的键盘和鼠标处理逻辑。
 *
 * It also acts as a RadioGroup for elements marked with role `menuitemradio`.
 *
 * 它还充当标有角色 `menuitemradio` 的元素的 RadioGroup。
 *
 */
@Directive({
  selector: '[cdkMenu]',
  exportAs: 'cdkMenu',
  standalone: true,
  host: {
    'role': 'menu',
    'class': 'cdk-menu',
    '[class.cdk-menu-inline]': 'isInline',
    '(keydown)': '_handleKeyEvent($event)',
  },
  providers: [
    {provide: CdkMenuGroup, useExisting: CdkMenu},
    {provide: CDK_MENU, useExisting: CdkMenu},
    PARENT_OR_NEW_INLINE_MENU_STACK_PROVIDER('vertical'),
  ],
})
export class CdkMenu extends CdkMenuBase implements AfterContentInit, OnDestroy {
  private _parentTrigger = inject(MENU_TRIGGER, {optional: true});

  /**
   * Event emitted when the menu is closed.
   *
   * 当菜单关闭时会发出本事件。
   *
   */
  @Output() readonly closed: EventEmitter<void> = new EventEmitter();

  /**
   * The direction items in the menu flow.
   *
   * 菜单流中菜单项的方向。
   *
   */
  override readonly orientation = 'vertical';

  /**
   * Whether the menu is displayed inline \(i.e. always present vs a conditional popup that the user triggers with a trigger element\).
   *
   * 菜单是否内联显示（即始终存在的弹出菜单，与之相对的是通过触发器元素由用户触发的条件化弹出菜单）。
   *
   */
  override readonly isInline = !this._parentTrigger;

  constructor() {
    super();
    this.destroyed.subscribe(this.closed);
    this._parentTrigger?.registerChildMenu(this);
  }

  override ngAfterContentInit() {
    super.ngAfterContentInit();
    this._subscribeToMenuStackEmptied();
  }

  override ngOnDestroy() {
    super.ngOnDestroy();
    this.closed.complete();
  }

  /**
   * Handle keyboard events for the Menu.
   *
   * 处理菜单的键盘事件。
   *
   * @param event The keyboard event to be handled.
   *
   * 要处理的键盘事件。
   *
   */
  _handleKeyEvent(event: KeyboardEvent) {
    const keyManager = this.keyManager;
    switch (event.keyCode) {
      case LEFT_ARROW:
      case RIGHT_ARROW:
        if (!hasModifierKey(event)) {
          event.preventDefault();
          keyManager.setFocusOrigin('keyboard');
          keyManager.onKeydown(event);
        }
        break;

      case ESCAPE:
        if (!hasModifierKey(event)) {
          event.preventDefault();
          this.menuStack.close(this, {
            focusNextOnEmpty: FocusNext.currentItem,
            focusParentTrigger: true,
          });
        }
        break;

      case TAB:
        if (!hasModifierKey(event, 'altKey', 'metaKey', 'ctrlKey')) {
          this.menuStack.closeAll({focusParentTrigger: true});
        }
        break;

      default:
        keyManager.onKeydown(event);
    }
  }

  /**
   * Set focus the either the current, previous or next item based on the FocusNext event.
   *
   * 根据 FocusNext 事件设置当前、上一个或下一个菜单项的焦点。
   *
   * @param focusNext The element to focus.
   *
   * 要聚焦的元素。
   *
   */
  private _toggleMenuFocus(focusNext: FocusNext | undefined) {
    const keyManager = this.keyManager;
    switch (focusNext) {
      case FocusNext.nextItem:
        keyManager.setFocusOrigin('keyboard');
        keyManager.setNextItemActive();
        break;

      case FocusNext.previousItem:
        keyManager.setFocusOrigin('keyboard');
        keyManager.setPreviousItemActive();
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
    this.menuStack.emptied
      .pipe(takeUntil(this.destroyed))
      .subscribe(event => this._toggleMenuFocus(event));
  }
}
