/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {CdkMenuGroup} from './menu-group';
import {
  AfterContentInit,
  ContentChildren,
  Directive,
  ElementRef,
  inject,
  Input,
  NgZone,
  OnDestroy,
  QueryList,
} from '@angular/core';
import {FocusKeyManager, FocusOrigin} from '@angular/cdk/a11y';
import {CdkMenuItem} from './menu-item';
import {merge, Subject} from 'rxjs';
import {Directionality} from '@angular/cdk/bidi';
import {mapTo, mergeAll, mergeMap, startWith, switchMap, takeUntil} from 'rxjs/operators';
import {MENU_STACK, MenuStack, MenuStackItem} from './menu-stack';
import {Menu} from './menu-interface';
import {PointerFocusTracker} from './pointer-focus-tracker';
import {MENU_AIM} from './menu-aim';

/**
 * Counter used to create unique IDs for menus.
 *
 * 用于为菜单创建唯一 ID 的计数器。
 *
 */
let nextId = 0;

/**
 * Abstract directive that implements shared logic common to all menus.
 * This class can be extended to create custom menu types.
 *
 * 实现所有菜单共有的共享逻辑的抽象指令。可以扩展此类以创建自定义菜单类型。
 *
 */
@Directive({
  host: {
    'role': 'menu',
    'class': '', // reset the css class added by the super-class
    '[tabindex]': '_getTabIndex()',
    '[id]': 'id',
    '[attr.aria-orientation]': 'orientation',
    '[attr.data-cdk-menu-stack-id]': 'menuStack.id',
    '(focus)': 'focusFirstItem()',
    '(focusin)': 'menuStack.setHasFocus(true)',
    '(focusout)': 'menuStack.setHasFocus(false)',
  },
})
export abstract class CdkMenuBase
  extends CdkMenuGroup
  implements Menu, AfterContentInit, OnDestroy
{
  /**
   * The menu's native DOM host element.
   *
   * 菜单的原生 DOM 宿主元素。
   *
   */
  readonly nativeElement: HTMLElement = inject(ElementRef).nativeElement;

  /**
   * The Angular zone.
   *
   * Angular 区域（Zone）。
   *
   */
  protected ngZone = inject(NgZone);

  /**
   * The stack of menus this menu belongs to.
   *
   * 此菜单所属的菜单栈。
   *
   */
  readonly menuStack: MenuStack = inject(MENU_STACK);

  /**
   * The menu aim service used by this menu.
   *
   * 此菜单使用的 MenuAim 服务。
   *
   */
  protected readonly menuAim = inject(MENU_AIM, {optional: true, self: true});

  /**
   * The directionality (text direction) of the current page.
   *
   * 当前页面的方向性（文本方向）。
   *
   */
  protected readonly dir = inject(Directionality, {optional: true});

  /**
   * The id of the menu's host element.
   *
   * 此菜单的宿主元素的 id。
   *
   */
  @Input() id = `cdk-menu-${nextId++}`;

  /**
   * All child MenuItem elements nested in this Menu.
   *
   * 嵌套在此菜单中的所有子 MenuItem 元素。
   *
   */
  @ContentChildren(CdkMenuItem, {descendants: true})
  readonly items: QueryList<CdkMenuItem>;

  /**
   * The direction items in the menu flow.
   *
   * 菜单流中的菜单项方向。
   *
   */
  orientation: 'horizontal' | 'vertical' = 'vertical';

  /**
   * Whether the menu is displayed inline (i.e. always present vs a conditional popup that the
   * user triggers with a trigger element).
   *
   * 菜单是否内联显示（即始终存在的弹出菜单，与之相对的是通过触发器元素由用户触发的条件化弹出菜单）。
   *
   */
  isInline = false;

  /**
   * Handles keyboard events for the menu.
   *
   * 处理菜单的键盘事件。
   *
   */
  protected keyManager: FocusKeyManager<CdkMenuItem>;

  /**
   * Emits when the MenuBar is destroyed.
   *
   * 当 MenuBar 被销毁时发出。
   *
   */
  protected readonly destroyed: Subject<void> = new Subject();

  /**
   * The Menu Item which triggered the open submenu.
   *
   * 触发打开子菜单的菜单项。
   *
   */
  protected triggerItem?: CdkMenuItem;

  /**
   * Tracks the users mouse movements over the menu.
   *
   * 跟踪用户鼠标在菜单上的移动。
   *
   */
  protected pointerTracker?: PointerFocusTracker<CdkMenuItem>;

  /**
   * Whether this menu's menu stack has focus.
   *
   * 此菜单的菜单栈是否具有焦点。
   *
   */
  private _menuStackHasFocus = false;

  ngAfterContentInit() {
    if (!this.isInline) {
      this.menuStack.push(this);
    }
    this._setKeyManager();
    this._subscribeToMenuStackHasFocus();
    this._subscribeToMenuOpen();
    this._subscribeToMenuStackClosed();
    this._setUpPointerTracker();
  }

  ngOnDestroy() {
    this.keyManager?.destroy();
    this.destroyed.next();
    this.destroyed.complete();
    this.pointerTracker?.destroy();
  }

  /**
   * Place focus on the first MenuItem in the menu and set the focus origin.
   *
   * 将焦点放在菜单中的第一个 MenuItem 上并设置焦点原点。
   *
   * @param focusOrigin The origin input mode of the focus event.
   *
   * 导致此焦点事件的来源模式。
   *
   */
  focusFirstItem(focusOrigin: FocusOrigin = 'program') {
    this.keyManager.setFocusOrigin(focusOrigin);
    this.keyManager.setFirstItemActive();
  }

  /**
   * Place focus on the last MenuItem in the menu and set the focus origin.
   *
   * 将焦点放在菜单中的最后一个 MenuItem 上并设置焦点原点。
   *
   * @param focusOrigin The origin input mode of the focus event.
   *
   * 导致此焦点事件的来源模式。
   *
   */
  focusLastItem(focusOrigin: FocusOrigin = 'program') {
    this.keyManager.setFocusOrigin(focusOrigin);
    this.keyManager.setLastItemActive();
  }

  /**
   * Gets the tabindex for this menu.
   *
   * 获取此菜单的 tabindex。
   *
   */
  _getTabIndex() {
    const tabindexIfInline = this._menuStackHasFocus ? -1 : 0;
    return this.isInline ? tabindexIfInline : null;
  }

  /**
   * Close the open menu if the current active item opened the requested MenuStackItem.
   *
   * 如果当前活动项打开了所请求的 MenuStackItem，则关闭打开的菜单。
   *
   * @param menu The menu requested to be closed.
   *
   * 请求关闭菜单。
   *
   * @param options Options to configure the behavior on close.
   *
   * 用于配置关闭行为的选项。
   *
   * - `focusParentTrigger` Whether to focus the parent trigger after closing the menu.
   *
   *   `focusParentTrigger` 关闭菜单后是否聚焦父触发器。
   *
   */
  protected closeOpenMenu(menu: MenuStackItem, options?: {focusParentTrigger?: boolean}) {
    const {focusParentTrigger} = {...options};
    const keyManager = this.keyManager;
    const trigger = this.triggerItem;
    if (menu === trigger?.getMenuTrigger()?.getMenu()) {
      trigger?.getMenuTrigger()?.close();
      // If the user has moused over a sibling item we want to focus the element under mouse focus
      // not the trigger which previously opened the now closed menu.
      if (focusParentTrigger) {
        if (trigger) {
          keyManager.setActiveItem(trigger);
        } else {
          keyManager.setFirstItemActive();
        }
      }
    }
  }

  /**
   * Setup the FocusKeyManager with the correct orientation for the menu.
   *
   * 使用正确的菜单方向设置 FocusKeyManager。
   *
   */
  private _setKeyManager() {
    this.keyManager = new FocusKeyManager(this.items).withWrap().withTypeAhead().withHomeAndEnd();

    if (this.orientation === 'horizontal') {
      this.keyManager.withHorizontalOrientation(this.dir?.value || 'ltr');
    } else {
      this.keyManager.withVerticalOrientation();
    }
  }

  /**
   * Subscribe to the menu trigger's open events in order to track the trigger which opened the menu
   * and stop tracking it when the menu is closed.
   *
   * 订阅菜单触发器的打开事件，以跟踪打开菜单的触发器，并在菜单关闭时停止跟踪。
   *
   */
  private _subscribeToMenuOpen() {
    const exitCondition = merge(this.items.changes, this.destroyed);
    this.items.changes
      .pipe(
        startWith(this.items),
        mergeMap((list: QueryList<CdkMenuItem>) =>
          list
            .filter(item => item.hasMenu)
            .map(item => item.getMenuTrigger()!.opened.pipe(mapTo(item), takeUntil(exitCondition))),
        ),
        mergeAll(),
        switchMap((item: CdkMenuItem) => {
          this.triggerItem = item;
          return item.getMenuTrigger()!.closed;
        }),
        takeUntil(this.destroyed),
      )
      .subscribe(() => (this.triggerItem = undefined));
  }

  /**
   * Subscribe to the MenuStack close events.
   *
   * 订阅 MenuStack 关闭事件。
   *
   */
  private _subscribeToMenuStackClosed() {
    this.menuStack.closed
      .pipe(takeUntil(this.destroyed))
      .subscribe(({item, focusParentTrigger}) => this.closeOpenMenu(item, {focusParentTrigger}));
  }

  /**
   * Subscribe to the MenuStack hasFocus events.
   *
   * 订阅 MenuStack hasFocus 事件。
   *
   */
  private _subscribeToMenuStackHasFocus() {
    if (this.isInline) {
      this.menuStack.hasFocus.pipe(takeUntil(this.destroyed)).subscribe(hasFocus => {
        this._menuStackHasFocus = hasFocus;
      });
    }
  }

  /**
   * Set the PointerFocusTracker and ensure that when mouse focus changes the key manager is updated
   * with the latest menu item under mouse focus.
   *
   * 设置 PointerFocusTracker 并确保当鼠标焦点发生变化时，键盘管理器会更新为鼠标焦点下的最新菜单项。
   *
   */
  private _setUpPointerTracker() {
    if (this.menuAim) {
      this.ngZone.runOutsideAngular(() => {
        this.pointerTracker = new PointerFocusTracker(this.items);
      });
      this.menuAim.initialize(this, this.pointerTracker!);
    }
  }
}
