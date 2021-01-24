/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Injectable, OnDestroy} from '@angular/core';


// Users of the Dispatcher never need to see this type, but TypeScript requires it to be exported.
export type UniqueSelectionDispatcherListener = (id: string, name: string) => void;

/**
 * Class to coordinate unique selection based on name.
 * Intended to be consumed as an Angular service.
 * This service is needed because native radio change events are only fired on the item currently
 * being selected, and we still need to uncheck the previous selection.
 *
 * 要根据名字来协调唯一选择的类。作为 Angular 服务使用。该服务是必需的，因为原生的单选按钮变化事件只会对当前选定的条目触发，我们仍然需要取消选定之前的选择。
 *
 * This service does not *store* any IDs and names because they may change at any time, so it is
 * less error-prone if they are simply passed through when the events occur.
 *
 * 该服务不会*存储*任何 ID 和名字，因为它们可能随时都会发生变化，所以如果只在事件发生时传入它们，就不会出错。
 *
 */
@Injectable({providedIn: 'root'})
export class UniqueSelectionDispatcher implements OnDestroy {
  private _listeners: UniqueSelectionDispatcherListener[] = [];

  /**
   * Notify other items that selection for the given name has been set.
   *
   * 通知其他条目已经设置具有指定名字的选定项。
   *
   * @param id ID of the item.
   *
   * 条目的 ID。
   *
   * @param name Name of the item.
   *
   * 该条目的名称。
   *
   */
  notify(id: string, name: string) {
    for (let listener of this._listeners) {
      listener(id, name);
    }
  }

  /**
   * Listen for future changes to item selection.
   *
   * 监听条目选择的未来变化。
   *
   * @return Function used to deregister listener
   *
   * 用于注销监听器的函数
   *
   */
  listen(listener: UniqueSelectionDispatcherListener): () => void {
    this._listeners.push(listener);
    return () => {
      this._listeners = this._listeners.filter((registered: UniqueSelectionDispatcherListener) => {
        return listener !== registered;
      });
    };
  }

  ngOnDestroy() {
    this._listeners = [];
  }
}
