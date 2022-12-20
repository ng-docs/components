/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {QueryList} from '@angular/core';
import {Subject, Subscription} from 'rxjs';
import {
  UP_ARROW,
  DOWN_ARROW,
  LEFT_ARROW,
  RIGHT_ARROW,
  TAB,
  A,
  Z,
  ZERO,
  NINE,
  hasModifierKey,
  HOME,
  END,
  PAGE_UP,
  PAGE_DOWN,
} from '@angular/cdk/keycodes';
import {debounceTime, filter, map, tap} from 'rxjs/operators';

/**
 * This interface is for items that can be passed to a ListKeyManager.
 *
 * 此接口用于可传递给 ListKeyManager 的条目。
 *
 */
export interface ListKeyManagerOption {
  /**
   * Whether the option is disabled.
   *
   * 该选项是否已禁用。
   *
   */
  disabled?: boolean;

  /**
   * Gets the label for this option.
   *
   * 获取此选项的标签。
   *
   */
  getLabel?(): string;
}

/**
 * Modifier keys handled by the ListKeyManager.
 *
 * ListKeyManager 处理的修饰键。
 *
 */
export type ListKeyManagerModifierKey = 'altKey' | 'ctrlKey' | 'metaKey' | 'shiftKey';

/**
 * This class manages keyboard events for selectable lists. If you pass it a query list
 * of items, it will set the active item correctly when arrow events occur.
 *
 * 此类管理可选列表的键盘事件。如果向其传递条目的查询列表，则当发生方向键事件时，它将正确设置活动条目。
 *
 */
export class ListKeyManager<T extends ListKeyManagerOption> {
  private _activeItemIndex = -1;
  private _activeItem: T | null = null;
  private _wrap = false;
  private readonly _letterKeyStream = new Subject<string>();
  private _typeaheadSubscription = Subscription.EMPTY;
  private _itemChangesSubscription?: Subscription;
  private _vertical = true;
  private _horizontal: 'ltr' | 'rtl' | null;
  private _allowedModifierKeys: ListKeyManagerModifierKey[] = [];
  private _homeAndEnd = false;
  private _pageUpAndDown = {enabled: false, delta: 10};

  /**
   * Predicate function that can be used to check whether an item should be skipped
   * by the key manager. By default, disabled items are skipped.
   *
   * 谓词函数，可用于检查按键管理器是否应跳过某个条目。默认情况下，已禁用的条目将被跳过。
   *
   */
  private _skipPredicateFn = (item: T) => item.disabled;

  // Buffer for the letters that the user has pressed when the typeahead option is turned on.
  private _pressedLetters: string[] = [];

  constructor(private _items: QueryList<T> | T[]) {
    // We allow for the items to be an array because, in some cases, the consumer may
    // not have access to a QueryList of the items they want to manage (e.g. when the
    // items aren't being collected via `ViewChildren` or `ContentChildren`).
    if (_items instanceof QueryList) {
      this._itemChangesSubscription = _items.changes.subscribe((newItems: QueryList<T>) => {
        if (this._activeItem) {
          const itemArray = newItems.toArray();
          const newIndex = itemArray.indexOf(this._activeItem);

          if (newIndex > -1 && newIndex !== this._activeItemIndex) {
            this._activeItemIndex = newIndex;
          }
        }
      });
    }
  }

  /**
   * Stream that emits any time the TAB key is pressed, so components can react
   * when focus is shifted off of the list.
   *
   * 只要按下 TAB 键，流就会发出通知，因此当焦点从列表移开时，组件可以做出反应。
   *
   */
  readonly tabOut = new Subject<void>();

  /**
   * Stream that emits whenever the active item of the list manager changes.
   *
   * 每当列表管理器的活动条目更改时发出通知的流。
   *
   */
  readonly change = new Subject<number>();

  /**
   * Sets the predicate function that determines which items should be skipped by the
   * list key manager.
   *
   * 设置谓词函数，该函数会确定列表按键管理器应跳过哪些条目。
   *
   * @param predicate Function that determines whether the given item should be skipped.
   *
   * 确定是否应跳过指定条目的函数。
   *
   */
  skipPredicate(predicate: (item: T) => boolean): this {
    this._skipPredicateFn = predicate;
    return this;
  }

  /**
   * Configures wrapping mode, which determines whether the active item will wrap to
   * the other end of list when there are no more items in the given direction.
   *
   * 配置回卷模式，当该模式确定在指定方向上没有更多条目时，活动条目是否将回卷列表的另一端。
   *
   * @param shouldWrap Whether the list should wrap when reaching the end.
   *
   * 到达末尾时列表是否应该回卷。
   *
   */
  withWrap(shouldWrap = true): this {
    this._wrap = shouldWrap;
    return this;
  }

  /**
   * Configures whether the key manager should be able to move the selection vertically.
   *
   * 配置按键管理器是否应该能够垂直移动选择。
   *
   * @param enabled Whether vertical selection should be enabled.
   *
   * 是否应启用垂直选择。
   *
   */
  withVerticalOrientation(enabled: boolean = true): this {
    this._vertical = enabled;
    return this;
  }

  /**
   * Configures the key manager to move the selection horizontally.
   * Passing in `null` will disable horizontal movement.
   *
   * 配置按键管理器以水平移动选择。传递 `null` 将禁用水平移动。
   *
   * @param direction Direction in which the selection can be moved.
   *
   * 所选内容可以移动的方向。
   *
   */
  withHorizontalOrientation(direction: 'ltr' | 'rtl' | null): this {
    this._horizontal = direction;
    return this;
  }

  /**
   * Modifier keys which are allowed to be held down and whose default actions will be prevented
   * as the user is pressing the arrow keys. Defaults to not allowing any modifier keys.
   *
   * 用户按下方向键时，可以按住修饰键并防止其默认操作。默认为不允许任何修饰键。
   *
   */
  withAllowedModifierKeys(keys: ListKeyManagerModifierKey[]): this {
    this._allowedModifierKeys = keys;
    return this;
  }

  /**
   * Turns on typeahead mode which allows users to set the active item by typing.
   *
   * 打开预输入模式，该模式允许用户通过键入来设置活动条目。
   *
   * @param debounceInterval Time to wait after the last keystroke before setting the active item.
   *
   * 在最后一次按键操作之后等待一小段时间，然后再设置活动条目。
   *
   */
  withTypeAhead(debounceInterval: number = 200): this {
    if (
      (typeof ngDevMode === 'undefined' || ngDevMode) &&
      this._items.length &&
      this._items.some(item => typeof item.getLabel !== 'function')
    ) {
      throw Error('ListKeyManager items in typeahead mode must implement the `getLabel` method.');
    }

    this._typeaheadSubscription.unsubscribe();

    // Debounce the presses of non-navigational keys, collect the ones that correspond to letters
    // and convert those letters back into a string. Afterwards find the first item that starts
    // with that string and select it.
    this._typeaheadSubscription = this._letterKeyStream
      .pipe(
        tap(letter => this._pressedLetters.push(letter)),
        debounceTime(debounceInterval),
        filter(() => this._pressedLetters.length > 0),
        map(() => this._pressedLetters.join('')),
      )
      .subscribe(inputString => {
        const items = this._getItemsArray();

        // Start at 1 because we want to start searching at the item immediately
        // following the current active item.
        for (let i = 1; i < items.length + 1; i++) {
          const index = (this._activeItemIndex + i) % items.length;
          const item = items[index];

          if (
            !this._skipPredicateFn(item) &&
            item.getLabel!().toUpperCase().trim().indexOf(inputString) === 0
          ) {
            this.setActiveItem(index);
            break;
          }
        }

        this._pressedLetters = [];
      });

    return this;
  }

  /** Cancels the current typeahead sequence. */
  cancelTypeahead(): this {
    this._pressedLetters = [];
    return this;
  }

  /**
   * Configures the key manager to activate the first and last items
   * respectively when the Home or End key is pressed.
   *
   * 配置按键管理器，以在按下 Home 或 End 键时分别激活第一项和最后一项。
   *
   * @param enabled Whether pressing the Home or End key activates the first/last item.
   *
   * 按下 Home 键或 End 键时是否激活第一项/最后一项。
   *
   */
  withHomeAndEnd(enabled: boolean = true): this {
    this._homeAndEnd = enabled;
    return this;
  }

  /**
   * Configures the key manager to activate every 10th, configured or first/last element in up/down direction
   * respectively when the Page-Up or Page-Down key is pressed.
   * @param enabled Whether pressing the Page-Up or Page-Down key activates the first/last item.
   * @param delta Whether pressing the Home or End key activates the first/last item.
   */
  withPageUpDown(enabled: boolean = true, delta: number = 10): this {
    this._pageUpAndDown = {enabled, delta};
    return this;
  }

  /**
   * Sets the active item to the item at the index specified.
   *
   * 把激活条目设置为由索引指定的条目。
   *
   * @param index The index of the item to be set as active.
   *
   * 要设置为活动的条目的索引。
   *
   */
  setActiveItem(index: number): void;

  /**
   * Sets the active item to the specified item.
   *
   * 将活动条目设置为指定的条目。
   *
   * @param item The item to be set as active.
   *
   * 要设置为活动的条目。
   *
   */
  setActiveItem(item: T): void;

  setActiveItem(item: any): void {
    const previousActiveItem = this._activeItem;

    this.updateActiveItem(item);

    if (this._activeItem !== previousActiveItem) {
      this.change.next(this._activeItemIndex);
    }
  }

  /**
   * Sets the active item depending on the key event passed in.
   *
   * 根据传入的键盘事件设置激活条目。
   *
   * @param event Keyboard event to be used for determining which element should be active.
   *
   * 用于确定哪个元素应处于活动状态的键盘事件。
   *
   */
  onKeydown(event: KeyboardEvent): void {
    const keyCode = event.keyCode;
    const modifiers: ListKeyManagerModifierKey[] = ['altKey', 'ctrlKey', 'metaKey', 'shiftKey'];
    const isModifierAllowed = modifiers.every(modifier => {
      return !event[modifier] || this._allowedModifierKeys.indexOf(modifier) > -1;
    });

    switch (keyCode) {
      case TAB:
        this.tabOut.next();
        return;

      case DOWN_ARROW:
        if (this._vertical && isModifierAllowed) {
          this.setNextItemActive();
          break;
        } else {
          return;
        }

      case UP_ARROW:
        if (this._vertical && isModifierAllowed) {
          this.setPreviousItemActive();
          break;
        } else {
          return;
        }

      case RIGHT_ARROW:
        if (this._horizontal && isModifierAllowed) {
          this._horizontal === 'rtl' ? this.setPreviousItemActive() : this.setNextItemActive();
          break;
        } else {
          return;
        }

      case LEFT_ARROW:
        if (this._horizontal && isModifierAllowed) {
          this._horizontal === 'rtl' ? this.setNextItemActive() : this.setPreviousItemActive();
          break;
        } else {
          return;
        }

      case HOME:
        if (this._homeAndEnd && isModifierAllowed) {
          this.setFirstItemActive();
          break;
        } else {
          return;
        }

      case END:
        if (this._homeAndEnd && isModifierAllowed) {
          this.setLastItemActive();
          break;
        } else {
          return;
        }

      case PAGE_UP:
        if (this._pageUpAndDown.enabled && isModifierAllowed) {
          const targetIndex = this._activeItemIndex - this._pageUpAndDown.delta;
          this._setActiveItemByIndex(targetIndex > 0 ? targetIndex : 0, 1);
          break;
        } else {
          return;
        }

      case PAGE_DOWN:
        if (this._pageUpAndDown.enabled && isModifierAllowed) {
          const targetIndex = this._activeItemIndex + this._pageUpAndDown.delta;
          const itemsLength = this._getItemsArray().length;
          this._setActiveItemByIndex(targetIndex < itemsLength ? targetIndex : itemsLength - 1, -1);
          break;
        } else {
          return;
        }

      default:
        if (isModifierAllowed || hasModifierKey(event, 'shiftKey')) {
          // Attempt to use the `event.key` which also maps it to the user's keyboard language,
          // otherwise fall back to resolving alphanumeric characters via the keyCode.
          if (event.key && event.key.length === 1) {
            this._letterKeyStream.next(event.key.toLocaleUpperCase());
          } else if ((keyCode >= A && keyCode <= Z) || (keyCode >= ZERO && keyCode <= NINE)) {
            this._letterKeyStream.next(String.fromCharCode(keyCode));
          }
        }

        // Note that we return here, in order to avoid preventing
        // the default action of non-navigational keys.
        return;
    }

    this._pressedLetters = [];
    event.preventDefault();
  }

  /**
   * Index of the currently active item.
   *
   * 当前活动条目的索引。
   *
   */
  get activeItemIndex(): number | null {
    return this._activeItemIndex;
  }

  /**
   * The active item.
   *
   * 活动条目。
   *
   */
  get activeItem(): T | null {
    return this._activeItem;
  }

  /**
   * Gets whether the user is currently typing into the manager using the typeahead feature.
   *
   * 获取用户当前是否正在使用预输入函数键入此管理员。
   *
   */
  isTyping(): boolean {
    return this._pressedLetters.length > 0;
  }

  /**
   * Sets the active item to the first enabled item in the list.
   *
   * 将激活条目设置为列表中第一个可用的（enabled）条目。
   *
   */
  setFirstItemActive(): void {
    this._setActiveItemByIndex(0, 1);
  }

  /**
   * Sets the active item to the last enabled item in the list.
   *
   * 将激活条目设置为列表中最后一个可用的（enabled）条目。
   *
   */
  setLastItemActive(): void {
    this._setActiveItemByIndex(this._items.length - 1, -1);
  }

  /**
   * Sets the active item to the next enabled item in the list.
   *
   * 将激活条目设置为列表中的下一个可用的（enabled）条目。
   *
   */
  setNextItemActive(): void {
    this._activeItemIndex < 0 ? this.setFirstItemActive() : this._setActiveItemByDelta(1);
  }

  /**
   * Sets the active item to a previous enabled item in the list.
   *
   * 将激活条目设置为列表中的上一个可用的（enabled）条目。
   *
   */
  setPreviousItemActive(): void {
    this._activeItemIndex < 0 && this._wrap
      ? this.setLastItemActive()
      : this._setActiveItemByDelta(-1);
  }

  /**
   * Allows setting the active without any other effects.
   *
   * 允许在没有任何其他效果的情况下设置激活状态。
   *
   * @param index Index of the item to be set as active.
   *
   * 要设置为活动条目的索引。
   *
   */
  updateActiveItem(index: number): void;

  /**
   * Allows setting the active item without any other effects.
   *
   * 允许设置活动条目，而没有任何其他影响。
   *
   * @param item Item to be set as active.
   *
   * 要设置为活动的条目。
   *
   */
  updateActiveItem(item: T): void;

  updateActiveItem(item: any): void {
    const itemArray = this._getItemsArray();
    const index = typeof item === 'number' ? item : itemArray.indexOf(item);
    const activeItem = itemArray[index];

    // Explicitly check for `null` and `undefined` because other falsy values are valid.
    this._activeItem = activeItem == null ? null : activeItem;
    this._activeItemIndex = index;
  }

  /** Cleans up the key manager. */
  destroy() {
    this._typeaheadSubscription.unsubscribe();
    this._itemChangesSubscription?.unsubscribe();
    this._letterKeyStream.complete();
    this.tabOut.complete();
    this.change.complete();
    this._pressedLetters = [];
  }

  /**
   * This method sets the active item, given a list of items and the delta between the
   * currently active item and the new active item. It will calculate differently
   * depending on whether wrap mode is turned on.
   *
   * 指定条目列表以及当前活动条目和新活动条目之间的增量，此方法将设置活动条目。根据是否打开自动回卷模式，计算方式会有所不同。
   *
   */
  private _setActiveItemByDelta(delta: -1 | 1): void {
    this._wrap ? this._setActiveInWrapMode(delta) : this._setActiveInDefaultMode(delta);
  }

  /**
   * Sets the active item properly given "wrap" mode. In other words, it will continue to move
   * down the list until it finds an item that is not disabled, and it will wrap if it
   * encounters either end of the list.
   *
   * 在“回卷”模式下正确设置活动条目。换句话说，它将继续在列表中向下移动，直到找到未被禁用的条目为止；如果遇到列表的任何一端，它将进行回卷。
   *
   */
  private _setActiveInWrapMode(delta: -1 | 1): void {
    const items = this._getItemsArray();

    for (let i = 1; i <= items.length; i++) {
      const index = (this._activeItemIndex + delta * i + items.length) % items.length;
      const item = items[index];

      if (!this._skipPredicateFn(item)) {
        this.setActiveItem(index);
        return;
      }
    }
  }

  /**
   * Sets the active item properly given the default mode. In other words, it will
   * continue to move down the list until it finds an item that is not disabled. If
   * it encounters either end of the list, it will stop and not wrap.
   *
   * 在默认模式下，正确设置活动条目。换句话说，它将继续向下移动列表，直到找到未禁用的条目。如果遇到列表的任何一端，它将停止并且不自动回卷。
   *
   */
  private _setActiveInDefaultMode(delta: -1 | 1): void {
    this._setActiveItemByIndex(this._activeItemIndex + delta, delta);
  }

  /**
   * Sets the active item to the first enabled item starting at the index specified. If the
   * item is disabled, it will move in the fallbackDelta direction until it either
   * finds an enabled item or encounters the end of the list.
   *
   * 从指定的索引开始，将活动条目设置为第一个启用的条目。如果该项被禁用，它将沿 fallbackDelta 方向移动，直到找到启用的项或遇到列表的末尾。
   *
   */
  private _setActiveItemByIndex(index: number, fallbackDelta: -1 | 1): void {
    const items = this._getItemsArray();

    if (!items[index]) {
      return;
    }

    while (this._skipPredicateFn(items[index])) {
      index += fallbackDelta;

      if (!items[index]) {
        return;
      }
    }

    this.setActiveItem(index);
  }

  /**
   * Returns the items as an array.
   *
   * 以数组形式返回条目。
   *
   */
  private _getItemsArray(): T[] {
    return this._items instanceof QueryList ? this._items.toArray() : this._items;
  }
}
