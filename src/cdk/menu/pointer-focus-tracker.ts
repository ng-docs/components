/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ElementRef, QueryList} from '@angular/core';
import {defer, fromEvent, Observable, Subject} from 'rxjs';
import {mapTo, mergeAll, mergeMap, startWith, takeUntil} from 'rxjs/operators';

/**
 * Item to track for mouse focus events.
 *
 * 跟踪鼠标焦点事件的菜单项。
 *
 */
export interface FocusableElement {
  /**
   * A reference to the element to be tracked.
   *
   * 对要跟踪的元素的引用。
   *
   */
  _elementRef: ElementRef<HTMLElement>;
}

/**
 * PointerFocusTracker keeps track of the currently active item under mouse focus. It also has
 * observables which emit when the users mouse enters and leaves a tracked element.
 *
 * PointerFocusTracker 跟踪鼠标焦点下的当前活动菜单项。它还具有当用户鼠标进入和离开被跟踪元素时发出事件的 observables。
 *
 */
export class PointerFocusTracker<T extends FocusableElement> {
  /**
   * Emits when an element is moused into.
   *
   * 当一个元素被鼠标移入时发出。
   *
   */
  readonly entered: Observable<T> = this._getItemPointerEntries();

  /**
   * Emits when an element is moused out.
   *
   * 当元素被鼠标移出时发出。
   *
   */
  readonly exited: Observable<T> = this._getItemPointerExits();

  /**
   * The element currently under mouse focus.
   *
   * 当前处于鼠标焦点下的元素。
   *
   */
  activeElement?: T;

  /**
   * The element previously under mouse focus.
   *
   * 先前处于鼠标焦点下的元素。
   *
   */
  previousElement?: T;

  /**
   * Emits when this is destroyed.
   *
   * 当它被销毁时发出。
   *
   */
  private readonly _destroyed: Subject<void> = new Subject();

  constructor(
    /** The list of items being tracked. */
    private readonly _items: QueryList<T>,
  ) {
    this.entered.subscribe(element => (this.activeElement = element));
    this.exited.subscribe(() => {
      this.previousElement = this.activeElement;
      this.activeElement = undefined;
    });
  }

  /**
   * Stop the managers listeners.
   *
   * 停止管理器侦听器。
   *
   */
  destroy() {
    this._destroyed.next();
    this._destroyed.complete();
  }

  /**
   * Gets a stream of pointer (mouse) entries into the given items.
   * This should typically run outside the Angular zone.
   *
   * 获取指向给定菜单项的指针（鼠标）条目流。这通常应该在 Angular 区域之外运行。
   *
   */
  private _getItemPointerEntries(): Observable<T> {
    return defer(() =>
      this._items.changes.pipe(
        startWith(this._items),
        mergeMap((list: QueryList<T>) =>
          list.map(element =>
            fromEvent(element._elementRef.nativeElement, 'mouseenter').pipe(
              mapTo(element),
              takeUntil(this._items.changes),
            ),
          ),
        ),
        mergeAll(),
      ),
    );
  }

  /**
   * Gets a stream of pointer (mouse) exits out of the given items.
   * This should typically run outside the Angular zone.
   *
   * 从给定菜单项中获取指针（鼠标）退出流。这通常应该在 Angular 区域之外运行。
   *
   */
  private _getItemPointerExits() {
    return defer(() =>
      this._items.changes.pipe(
        startWith(this._items),
        mergeMap((list: QueryList<T>) =>
          list.map(element =>
            fromEvent(element._elementRef.nativeElement, 'mouseout').pipe(
              mapTo(element),
              takeUntil(this._items.changes),
            ),
          ),
        ),
        mergeAll(),
      ),
    );
  }
}
