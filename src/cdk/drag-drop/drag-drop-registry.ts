/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Injectable, NgZone, OnDestroy, Inject} from '@angular/core';
import {DOCUMENT} from '@angular/common';
import {normalizePassiveListenerOptions} from '@angular/cdk/platform';
import {merge, Observable, Observer, Subject} from 'rxjs';

/**
 * Event options that can be used to bind an active, capturing event.
 *
 * 可以用来绑定活动的捕获事件的选项。
 *
 */
const activeCapturingEventOptions = normalizePassiveListenerOptions({
  passive: false,
  capture: true,
});

/**
 * Service that keeps track of all the drag item and drop container
 * instances, and manages global event listeners on the `document`.
 *
 * 该服务可以跟踪所有的可拖动条目和可投放容器实例，并管理 `document` 上的全局事件监听器。
 *
 * @docs-private
 */
// Note: this class is generic, rather than referencing CdkDrag and CdkDropList directly, in order
// to avoid circular imports. If we were to reference them here, importing the registry into the
// classes that are registering themselves will introduce a circular import.
@Injectable({providedIn: 'root'})
export class DragDropRegistry<I extends {isDragging(): boolean}, C> implements OnDestroy {
  private _document: Document;

  /**
   * Registered drop container instances.
   *
   * 已注册的可投放容器实例。
   *
   */
  private _dropInstances = new Set<C>();

  /**
   * Registered drag item instances.
   *
   * 已注册的拖动条目实例
   *
   */
  private _dragInstances = new Set<I>();

  /**
   * Drag item instances that are currently being dragged.
   *
   * 当前正被拖动的条目实例。
   *
   */
  private _activeDragInstances: I[] = [];

  /**
   * Keeps track of the event listeners that we've bound to the `document`.
   *
   * 跟踪我们绑定到 `document` 上的事件监听器。
   *
   */
  private _globalListeners = new Map<
    string,
    {
      handler: (event: Event) => void;
      options?: AddEventListenerOptions | boolean;
    }
  >();

  /**
   * Predicate function to check if an item is being dragged.  Moved out into a property,
   * because it'll be called a lot and we don't want to create a new function every time.
   *
   * 用于检查条目是否可被拖动的谓词函数。挪了属性中，因为它会被调用很多次，而且每次都不想创建新函数。
   *
   */
  private _draggingPredicate = (item: I) => item.isDragging();

  /**
   * Emits the `touchmove` or `mousemove` events that are dispatched
   * while the user is dragging a drag item instance.
   *
   * 当用户正在拖动一个拖动条目实例时，会派发 `touchmove` 或 `mousemove` 事件。
   *
   */
  readonly pointerMove: Subject<TouchEvent | MouseEvent> = new Subject<TouchEvent | MouseEvent>();

  /**
   * Emits the `touchend` or `mouseup` events that are dispatched
   * while the user is dragging a drag item instance.
   *
   * 当用户正在拖动一个拖曳条目实例时，会派发 `touchend` 或 `mouseup` 事件。
   *
   */
  readonly pointerUp: Subject<TouchEvent | MouseEvent> = new Subject<TouchEvent | MouseEvent>();

  /**
   * Emits when the viewport has been scrolled while the user is dragging an item.
   *
   * 在用户拖动某个条目并滚动视口时发出通知。
   *
   * @deprecated To be turned into a private member. Use the `scrolled` method instead.
   *
   * 成为私有成员。请改用 `scrolled` 方法。
   *
   * @breaking-change 13.0.0
   */
  readonly scroll: Subject<Event> = new Subject<Event>();

  constructor(private _ngZone: NgZone, @Inject(DOCUMENT) _document: any) {
    this._document = _document;
  }

  /**
   * Adds a drop container to the registry.
   *
   * 在注册表中添加一个投放容器。
   *
   */
  registerDropContainer(drop: C) {
    if (!this._dropInstances.has(drop)) {
      this._dropInstances.add(drop);
    }
  }

  /**
   * Adds a drag item instance to the registry.
   *
   * 把一个拖动条目的实例添加到注册表中。
   *
   */
  registerDragItem(drag: I) {
    this._dragInstances.add(drag);

    // The `touchmove` event gets bound once, ahead of time, because WebKit
    // won't preventDefault on a dynamically-added `touchmove` listener.
    // See https://bugs.webkit.org/show_bug.cgi?id=184250.
    if (this._dragInstances.size === 1) {
      this._ngZone.runOutsideAngular(() => {
        // The event handler has to be explicitly active,
        // because newer browsers make it passive by default.
        this._document.addEventListener(
          'touchmove',
          this._persistentTouchmoveListener,
          activeCapturingEventOptions,
        );
      });
    }
  }

  /**
   * Removes a drop container from the registry.
   *
   * 从注册表中删除一个投放容器。
   *
   */
  removeDropContainer(drop: C) {
    this._dropInstances.delete(drop);
  }

  /**
   * Removes a drag item instance from the registry.
   *
   * 从注册表中删除一个拖动条目实例。
   *
   */
  removeDragItem(drag: I) {
    this._dragInstances.delete(drag);
    this.stopDragging(drag);

    if (this._dragInstances.size === 0) {
      this._document.removeEventListener(
        'touchmove',
        this._persistentTouchmoveListener,
        activeCapturingEventOptions,
      );
    }
  }

  /**
   * Starts the dragging sequence for a drag instance.
   *
   * 为一个拖动实例开始拖曳序列。
   *
   * @param drag Drag instance which is being dragged.
   *
   * 正在拖动的实例。
   *
   * @param event Event that initiated the dragging.
   *
   * 引发了拖动的事件。
   *
   */
  startDragging(drag: I, event: TouchEvent | MouseEvent) {
    // Do not process the same drag twice to avoid memory leaks and redundant listeners
    if (this._activeDragInstances.indexOf(drag) > -1) {
      return;
    }

    this._activeDragInstances.push(drag);

    if (this._activeDragInstances.length === 1) {
      const isTouchEvent = event.type.startsWith('touch');

      // We explicitly bind __active__ listeners here, because newer browsers will default to
      // passive ones for `mousemove` and `touchmove`. The events need to be active, because we
      // use `preventDefault` to prevent the page from scrolling while the user is dragging.
      this._globalListeners
        .set(isTouchEvent ? 'touchend' : 'mouseup', {
          handler: (e: Event) => this.pointerUp.next(e as TouchEvent | MouseEvent),
          options: true,
        })
        .set('scroll', {
          handler: (e: Event) => this.scroll.next(e),
          // Use capturing so that we pick up scroll changes in any scrollable nodes that aren't
          // the document. See https://github.com/angular/components/issues/17144.
          options: true,
        })
        // Preventing the default action on `mousemove` isn't enough to disable text selection
        // on Safari so we need to prevent the selection event as well. Alternatively this can
        // be done by setting `user-select: none` on the `body`, however it has causes a style
        // recalculation which can be expensive on pages with a lot of elements.
        .set('selectstart', {
          handler: this._preventDefaultWhileDragging,
          options: activeCapturingEventOptions,
        });

      // We don't have to bind a move event for touch drag sequences, because
      // we already have a persistent global one bound from `registerDragItem`.
      if (!isTouchEvent) {
        this._globalListeners.set('mousemove', {
          handler: (e: Event) => this.pointerMove.next(e as MouseEvent),
          options: activeCapturingEventOptions,
        });
      }

      this._ngZone.runOutsideAngular(() => {
        this._globalListeners.forEach((config, name) => {
          this._document.addEventListener(name, config.handler, config.options);
        });
      });
    }
  }

  /**
   * Stops dragging a drag item instance.
   *
   * 停止拖动条目的实例。
   *
   */
  stopDragging(drag: I) {
    const index = this._activeDragInstances.indexOf(drag);

    if (index > -1) {
      this._activeDragInstances.splice(index, 1);

      if (this._activeDragInstances.length === 0) {
        this._clearGlobalListeners();
      }
    }
  }

  /**
   * Gets whether a drag item instance is currently being dragged.
   *
   * 获取是否正在拖动条目实例。
   *
   */
  isDragging(drag: I) {
    return this._activeDragInstances.indexOf(drag) > -1;
  }

  /**
   * Gets a stream that will emit when any element on the page is scrolled while an item is being
   * dragged.
   *
   * 获取将在拖动条目时滚动页面上的任何元素时发出的流。
   *
   * @param shadowRoot Optional shadow root that the current dragging sequence started from.
   *   Top-level listeners won't pick up events coming from the shadow DOM so this parameter can
   *   be used to include an additional top-level listener at the shadow root level.
   *
   * 当前拖动序列开始的可选 Shadow Root 。顶级侦听器不会接收来自 Shadow DOM 的事件，因此此参数可用于在 Shadow Root 级别包含额外的顶级侦听器。
   *
   */
  scrolled(shadowRoot?: DocumentOrShadowRoot | null): Observable<Event> {
    const streams: Observable<Event>[] = [this.scroll];

    if (shadowRoot && shadowRoot !== this._document) {
      // Note that this is basically the same as `fromEvent` from rxjs, but we do it ourselves,
      // because we want to guarantee that the event is bound outside of the `NgZone`. With
      // `fromEvent` it'll only happen if the subscription is outside the `NgZone`.
      streams.push(
        new Observable((observer: Observer<Event>) => {
          return this._ngZone.runOutsideAngular(() => {
            const eventOptions = true;
            const callback = (event: Event) => {
              if (this._activeDragInstances.length) {
                observer.next(event);
              }
            };

            (shadowRoot as ShadowRoot).addEventListener('scroll', callback, eventOptions);

            return () => {
              (shadowRoot as ShadowRoot).removeEventListener('scroll', callback, eventOptions);
            };
          });
        }),
      );
    }

    return merge(...streams);
  }

  ngOnDestroy() {
    this._dragInstances.forEach(instance => this.removeDragItem(instance));
    this._dropInstances.forEach(instance => this.removeDropContainer(instance));
    this._clearGlobalListeners();
    this.pointerMove.complete();
    this.pointerUp.complete();
  }

  /**
   * Event listener that will prevent the default browser action while the user is dragging.
   *
   * 事件监听器会在用户拖动时阻止默认的浏览器操作。
   *
   * @param event Event whose default action should be prevented.
   *
   * 应该阻止默认操作的事件。
   *
   */
  private _preventDefaultWhileDragging = (event: Event) => {
    if (this._activeDragInstances.length > 0) {
      event.preventDefault();
    }
  };

  /**
   * Event listener for `touchmove` that is bound even if no dragging is happening.
   *
   * `touchmove` 事件监听器，即使没有拖动也会被绑定。
   *
   */
  private _persistentTouchmoveListener = (event: TouchEvent) => {
    if (this._activeDragInstances.length > 0) {
      // Note that we only want to prevent the default action after dragging has actually started.
      // Usually this is the same time at which the item is added to the `_activeDragInstances`,
      // but it could be pushed back if the user has set up a drag delay or threshold.
      if (this._activeDragInstances.some(this._draggingPredicate)) {
        event.preventDefault();
      }

      this.pointerMove.next(event);
    }
  };

  /**
   * Clears out the global event listeners from the `document`.
   *
   * 清除 `document` 上的全局事件监听器。
   *
   */
  private _clearGlobalListeners() {
    this._globalListeners.forEach((config, name) => {
      this._document.removeEventListener(name, config.handler, config.options);
    });

    this._globalListeners.clear();
  }
}
