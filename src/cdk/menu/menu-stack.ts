/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Inject, Injectable, InjectionToken, Optional, SkipSelf} from '@angular/core';
import {Observable, Subject} from 'rxjs';
import {debounceTime, distinctUntilChanged, startWith} from 'rxjs/operators';

/**
 * The relative item in the inline menu to focus after closing all popup menus.
 *
 * 关闭所有弹出菜单后要聚焦的内联菜单中的相关菜单项。
 *
 */
export const enum FocusNext {
  nextItem,
  previousItem,
  currentItem,
}

/**
 * A single item \(menu\) in the menu stack.
 *
 * 菜单栈中的单个项目（菜单）。
 *
 */
export interface MenuStackItem {
  /**
   * A reference to the menu stack this menu stack item belongs to.
   *
   * 对此菜单栈项所属的菜单栈的引用。
   *
   */
  menuStack?: MenuStack;
}

/**
 * Injection token used for an implementation of MenuStack.
 *
 * 用于 MenuStack 实现的注入令牌。
 *
 */
export const MENU_STACK = new InjectionToken<MenuStack>('cdk-menu-stack');

/**
 * Provider that provides the parent menu stack, or a new menu stack if there is no parent one.
 *
 * 提供父菜单栈的提供者，如果没有父菜单栈，则提供新的菜单栈。
 *
 */
export const PARENT_OR_NEW_MENU_STACK_PROVIDER = {
  provide: MENU_STACK,
  deps: [[new Optional(), new SkipSelf(), new Inject(MENU_STACK)]],
  useFactory: (parentMenuStack?: MenuStack) => parentMenuStack || new MenuStack(),
};

/**
 * Provider that provides the parent menu stack, or a new inline menu stack if there is no parent one.
 *
 * 提供父菜单栈的提供者，如果没有父菜单栈，则提供新的内联菜单栈。
 *
 */
export const PARENT_OR_NEW_INLINE_MENU_STACK_PROVIDER = (
  orientation: 'vertical' | 'horizontal',
) => ({
  provide: MENU_STACK,
  deps: [[new Optional(), new SkipSelf(), new Inject(MENU_STACK)]],
  useFactory: (parentMenuStack?: MenuStack) => parentMenuStack || MenuStack.inline(orientation),
});

/**
 * Options that can be provided to the close or closeAll methods.
 *
 * 可以提供给 close 或 closeAll 方法的选项。
 *
 */
export interface CloseOptions {
  /**
   * The element to focus next if the close operation causes the menu stack to become empty.
   *
   * 如果关闭操作导致菜单栈变为空，则为下一个要聚焦的元素。
   *
   */
  focusNextOnEmpty?: FocusNext;
  /**
   * Whether to focus the parent trigger after closing the menu.
   *
   * 关闭菜单后是否聚焦父触发器。
   *
   */
  focusParentTrigger?: boolean;
}

/**
 * Event dispatched when a menu is closed.
 *
 * 关闭菜单时要派发的事件。
 *
 */
export interface MenuStackCloseEvent {
  /**
   * The menu being closed.
   *
   * 正在关闭的菜单。
   *
   */
  item: MenuStackItem;
  /**
   * Whether to focus the parent trigger after closing the menu.
   *
   * 关闭菜单后是否聚焦父触发器。
   *
   */
  focusParentTrigger?: boolean;
}

/**
 * The next available menu stack ID.
 *
 * 下一个可用的菜单栈 ID。
 *
 */
let nextId = 0;

/**
 * MenuStack allows subscribers to listen for close events \(when a MenuStackItem is popped off
 * of the stack\) in order to perform closing actions. Upon the MenuStack being empty it emits
 * from the `empty` observable specifying the next focus action which the listener should perform
 * as requested by the closer.
 *
 * MenuStack 允许订阅者监听关闭事件（当 MenuStackItem 从堆栈中弹出时）以执行关闭操作。当 MenuStack 为空时，它会从 `empty` 的 observable 发出，指定侦听器应根据更近者的请求执行的下一个焦点操作。
 *
 */
@Injectable()
export class MenuStack {
  /**
   * The ID of this menu stack.
   *
   * 此菜单栈的 ID。
   *
   */
  readonly id = `${nextId++}`;

  /**
   * All MenuStackItems tracked by this MenuStack.
   *
   * 此 MenuStack 跟踪的所有 MenuStackItem。
   *
   */
  private readonly _elements: MenuStackItem[] = [];

  /**
   * Emits the element which was popped off of the stack when requested by a closer.
   *
   * 发出当关闭器请求时从堆栈中弹出的那个元素。
   *
   */
  private readonly _close = new Subject<MenuStackCloseEvent>();

  /**
   * Emits once the MenuStack has become empty after popping off elements.
   *
   * 在弹出元素后 MenuStack 变空时发出。
   *
   */
  private readonly _empty = new Subject<FocusNext | undefined>();

  /**
   * Emits whether any menu in the menu stack has focus.
   *
   * 发出菜单栈中的任何菜单是否具有焦点。
   *
   */
  private readonly _hasFocus = new Subject<boolean>();

  /**
   * Observable which emits the MenuStackItem which has been requested to close.
   *
   * 这个 Observable 发出已请求关闭的 MenuStackItem。
   *
   */
  readonly closed: Observable<MenuStackCloseEvent> = this._close;

  /**
   * Observable which emits whether any menu in the menu stack has focus.
   *
   * 这个 Observable 发出菜单栈中的任何菜单是否具有焦点。
   *
   */
  readonly hasFocus: Observable<boolean> = this._hasFocus.pipe(
    startWith(false),
    debounceTime(0),
    distinctUntilChanged(),
  );

  /**
   * Observable which emits when the MenuStack is empty after popping off the last element. It
   * emits a FocusNext event which specifies the action the closer has requested the listener
   * perform.
   *
   * 弹出最后一个元素后，当 MenuStack 为空时发出的 Observable。它发出一个 FocusNext 事件，该事件指定关闭者请求侦听器执行的操作。
   *
   */
  readonly emptied: Observable<FocusNext | undefined> = this._empty;

  /**
   * Whether the inline menu associated with this menu stack is vertical or horizontal.
   * `null` indicates there is no inline menu associated with this menu stack.
   *
   * 与此菜单栈关联的内联菜单是垂直的还是水平的。 `null` 表示没有与此菜单栈关联的内联菜单。
   *
   */
  private _inlineMenuOrientation: 'vertical' | 'horizontal' | null = null;

  /**
   * Creates a menu stack that originates from an inline menu.
   *
   * 创建源自内联菜单的菜单栈。
   *
   */
  static inline(orientation: 'vertical' | 'horizontal') {
    const stack = new MenuStack();
    stack._inlineMenuOrientation = orientation;
    return stack;
  }

  /**
   * Adds an item to the menu stack.
   *
   * 将项目添加到此菜单栈。
   *
   * @param menu the MenuStackItem to put on the stack.
   *
   * 要放入此堆栈的 MenuStackItem。
   *
   */
  push(menu: MenuStackItem) {
    this._elements.push(menu);
  }

  /**
   * Pop items off of the stack up to and including `lastItem` and emit each on the close
   * observable. If the stack is empty or `lastItem` is not on the stack it does nothing.
   *
   * 从堆栈中弹出项目直到 `lastItem`（含）并在 close 这个 observable 上发出每个项目。如果堆栈为空或 `lastItem` 不在此堆栈上，则什么也不做。
   *
   * @param lastItem the last item to pop off the stack.
   *
   * 从堆栈中弹出的最后一项。
   *
   * @param options Options that configure behavior on close.
   *
   * 配置关闭行为的选项。
   *
   */
  close(lastItem: MenuStackItem, options?: CloseOptions) {
    const {focusNextOnEmpty, focusParentTrigger} = {...options};
    if (this._elements.indexOf(lastItem) >= 0) {
      let poppedElement;
      do {
        poppedElement = this._elements.pop()!;
        this._close.next({item: poppedElement, focusParentTrigger});
      } while (poppedElement !== lastItem);

      if (this.isEmpty()) {
        this._empty.next(focusNextOnEmpty);
      }
    }
  }

  /**
   * Pop items off of the stack up to but excluding `lastItem` and emit each on the close
   * observable. If the stack is empty or `lastItem` is not on the stack it does nothing.
   *
   * 从堆栈中弹出项目直到 `lastItem`（不含）并在 close 这个 observable 上发出每个项目。如果堆栈为空或 `lastItem` 不在堆栈上，则什么也不做。
   *
   * @param lastItem the element which should be left on the stack
   *
   * 应该留在堆栈上的元素
   *
   * @return whether or not an item was removed from the stack
   *
   * 项目是否从堆栈中移除
   *
   */
  closeSubMenuOf(lastItem: MenuStackItem) {
    let removed = false;
    if (this._elements.indexOf(lastItem) >= 0) {
      removed = this.peek() !== lastItem;
      while (this.peek() !== lastItem) {
        this._close.next({item: this._elements.pop()!});
      }
    }
    return removed;
  }

  /**
   * Pop off all MenuStackItems and emit each one on the `close` observable one by one.
   *
   * 弹出所有 MenuStackItems 并在 `close` 这个 observable 上逐一发出。
   *
   * @param options Options that configure behavior on close.
   *
   * 用来配置关闭时行为的选项。
   *
   */
  closeAll(options?: CloseOptions) {
    const {focusNextOnEmpty, focusParentTrigger} = {...options};
    if (!this.isEmpty()) {
      while (!this.isEmpty()) {
        const menuStackItem = this._elements.pop();
        if (menuStackItem) {
          this._close.next({item: menuStackItem, focusParentTrigger});
        }
      }
      this._empty.next(focusNextOnEmpty);
    }
  }

  /**
   * Return true if this stack is empty.
   *
   * 如果此堆栈为空，则返回 true。
   *
   */
  isEmpty() {
    return !this._elements.length;
  }

  /**
   * Return the length of the stack.
   *
   * 返回堆栈的长度。
   *
   */
  length() {
    return this._elements.length;
  }

  /**
   * Get the top most element on the stack.
   *
   * 获取堆栈中最顶部的元素。
   *
   */
  peek(): MenuStackItem | undefined {
    return this._elements[this._elements.length - 1];
  }

  /**
   * Whether the menu stack is associated with an inline menu.
   *
   * 菜单栈是否关联着内联菜单。
   *
   */
  hasInlineMenu() {
    return this._inlineMenuOrientation != null;
  }

  /**
   * The orientation of the associated inline menu.
   *
   * 关联的内联菜单的方向。
   *
   */
  inlineMenuOrientation() {
    return this._inlineMenuOrientation;
  }

  /**
   * Sets whether the menu stack contains the focused element.
   *
   * 设置菜单栈是否包含有焦点的元素。
   *
   */
  setHasFocus(hasFocus: boolean) {
    this._hasFocus.next(hasFocus);
  }
}
