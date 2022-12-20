/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {coerceElement} from '@angular/cdk/coercion';
import {Platform} from '@angular/cdk/platform';
import {ElementRef, Injectable, NgZone, OnDestroy, Optional, Inject} from '@angular/core';
import {fromEvent, of as observableOf, Subject, Subscription, Observable, Observer} from 'rxjs';
import {auditTime, filter} from 'rxjs/operators';
import {CdkScrollable} from './scrollable';
import {DOCUMENT} from '@angular/common';

/**
 * Time in ms to throttle the scrolling events by default.
 *
 * 默认情况下以毫秒为单位的时间来限制滚动事件的频度。
 *
 */
export const DEFAULT_SCROLL_TIME = 20;

/**
 * Service contained all registered Scrollable references and emits an event when any one of the
 * Scrollable references emit a scrolled event.
 *
 * 本服务包含所有已注册的可滚动对象的引用，并在任何一个可滚动对象的引用发出滚动事件时触发事件。
 *
 */
@Injectable({providedIn: 'root'})
export class ScrollDispatcher implements OnDestroy {
  /**
   * Used to reference correct document/window
   *
   * 用于引用正确的 document/window
   *
   */
  protected _document: Document;

  constructor(
    private _ngZone: NgZone,
    private _platform: Platform,
    @Optional() @Inject(DOCUMENT) document: any,
  ) {
    this._document = document;
  }

  /**
   * Subject for notifying that a registered scrollable reference element has been scrolled.
   *
   * 用于通知某个已注册的可滚动对象所引用的元素发生滚动时的主体对象。
   *
   */
  private readonly _scrolled = new Subject<CdkScrollable | void>();

  /**
   * Keeps track of the global `scroll` and `resize` subscriptions.
   *
   * 跟踪全局 `scroll` 和 `resize` 事件的订阅。
   *
   */
  _globalSubscription: Subscription | null = null;

  /**
   * Keeps track of the amount of subscriptions to `scrolled`. Used for cleaning up afterwards.
   *
   * 到 `scrolled` 的订阅的数量。用于做后续清理。
   *
   */
  private _scrolledCount = 0;

  /**
   * Map of all the scrollable references that are registered with the service and their
   * scroll event subscriptions.
   *
   * 所有可滚动对象引用的映射表，由可滚动对象及其对滚动事件的订阅组成。
   *
   */
  scrollContainers: Map<CdkScrollable, Subscription> = new Map();

  /**
   * Registers a scrollable instance with the service and listens for its scrolled events. When the
   * scrollable is scrolled, the service emits the event to its scrolled observable.
   *
   * 使用该服务注册一个可滚动的实例，并侦听其滚动的事件。当可滚动对象发生滚动时，此服务会把事件发送到记录其滚动的可观察对象中。
   *
   * @param scrollable Scrollable instance to be registered.
   *
   * 要注册的可滚动对象实例。
   *
   */
  register(scrollable: CdkScrollable): void {
    if (!this.scrollContainers.has(scrollable)) {
      this.scrollContainers.set(
        scrollable,
        scrollable.elementScrolled().subscribe(() => this._scrolled.next(scrollable)),
      );
    }
  }

  /**
   * De-registers a Scrollable reference and unsubscribes from its scroll event observable.
   *
   * 注销一个可滚动对象的引用，并从它的 scroll 事件的可观察对象中取消订阅。
   *
   * @param scrollable Scrollable instance to be deregistered.
   *
   * 要注销的可滚动实例。
   *
   */
  deregister(scrollable: CdkScrollable): void {
    const scrollableReference = this.scrollContainers.get(scrollable);

    if (scrollableReference) {
      scrollableReference.unsubscribe();
      this.scrollContainers.delete(scrollable);
    }
  }

  /**
   * Returns an observable that emits an event whenever any of the registered Scrollable
   * references (or window, document, or body) fire a scrolled event. Can provide a time in ms
   * to override the default "throttle" time.
   *
   * 返回一个可观察对象，它会在任何已注册的可滚动对象引用（或 window, document, body）中发生滚动事件时发出一个事件。可以提供一个毫秒数来来改写默认的“限流”时间。
   *
   * **Note:** in order to avoid hitting change detection for every scroll event,
   * all of the events emitted from this stream will be run outside the Angular zone.
   * If you need to update any data bindings as a result of a scroll event, you have
   * to run the callback using `NgZone.run`.
   *
   * **注意：**为了避免每次滚动事件都发生变更检测，从这个流发出的所有事件都会在 Angular Zone 之外运行。如果你要在滚动事件中更新任何数据绑定，就必须使用 `NgZone.run` 来运行回调。
   *
   */
  scrolled(auditTimeInMs: number = DEFAULT_SCROLL_TIME): Observable<CdkScrollable | void> {
    if (!this._platform.isBrowser) {
      return observableOf<void>();
    }

    return new Observable((observer: Observer<CdkScrollable | void>) => {
      if (!this._globalSubscription) {
        this._addGlobalListener();
      }

      // In the case of a 0ms delay, use an observable without auditTime
      // since it does add a perceptible delay in processing overhead.
      const subscription =
        auditTimeInMs > 0
          ? this._scrolled.pipe(auditTime(auditTimeInMs)).subscribe(observer)
          : this._scrolled.subscribe(observer);

      this._scrolledCount++;

      return () => {
        subscription.unsubscribe();
        this._scrolledCount--;

        if (!this._scrolledCount) {
          this._removeGlobalListener();
        }
      };
    });
  }

  ngOnDestroy() {
    this._removeGlobalListener();
    this.scrollContainers.forEach((_, container) => this.deregister(container));
    this._scrolled.complete();
  }

  /**
   * Returns an observable that emits whenever any of the
   * scrollable ancestors of an element are scrolled.
   *
   * 返回一个可观察对象，它只在元素的任何可滚动祖先发生滚动时才会触发。
   *
   * @param elementOrElementRef Element whose ancestors to listen for.
   *
   * 祖先要监听的元素。
   *
   * @param auditTimeInMs Time to throttle the scroll events.
   *
   * 要对滚动事件进行限流的毫秒数。
   *
   */
  ancestorScrolled(
    elementOrElementRef: ElementRef | HTMLElement,
    auditTimeInMs?: number,
  ): Observable<CdkScrollable | void> {
    const ancestors = this.getAncestorScrollContainers(elementOrElementRef);

    return this.scrolled(auditTimeInMs).pipe(
      filter(target => {
        return !target || ancestors.indexOf(target) > -1;
      }),
    );
  }

  /**
   * Returns all registered Scrollables that contain the provided element.
   *
   * 返回所有包含所指定元素的已注册可滚动对象。
   *
   */
  getAncestorScrollContainers(elementOrElementRef: ElementRef | HTMLElement): CdkScrollable[] {
    const scrollingContainers: CdkScrollable[] = [];

    this.scrollContainers.forEach((_subscription: Subscription, scrollable: CdkScrollable) => {
      if (this._scrollableContainsElement(scrollable, elementOrElementRef)) {
        scrollingContainers.push(scrollable);
      }
    });

    return scrollingContainers;
  }

  /**
   * Use defaultView of injected document if available or fallback to global window reference
   *
   * 如果可用，则使用注入的 document 的 defaultView，否则回退到全局 window 引用
   *
   */
  private _getWindow(): Window {
    return this._document.defaultView || window;
  }

  /**
   * Returns true if the element is contained within the provided Scrollable.
   *
   * 如果该元素包含在所提供的可滚动对象中，则返回 true。
   *
   */
  private _scrollableContainsElement(
    scrollable: CdkScrollable,
    elementOrElementRef: ElementRef | HTMLElement,
  ): boolean {
    let element: HTMLElement | null = coerceElement(elementOrElementRef);
    let scrollableElement = scrollable.getElementRef().nativeElement;

    // Traverse through the element parents until we reach null, checking if any of the elements
    // are the scrollable's element.
    do {
      if (element == scrollableElement) {
        return true;
      }
    } while ((element = element!.parentElement));

    return false;
  }

  /**
   * Sets up the global scroll listeners.
   *
   * 设置全局滚动监听器。
   *
   */
  private _addGlobalListener() {
    this._globalSubscription = this._ngZone.runOutsideAngular(() => {
      const window = this._getWindow();
      return fromEvent(window.document, 'scroll').subscribe(() => this._scrolled.next());
    });
  }

  /**
   * Cleans up the global scroll listener.
   *
   * 清理全局滚动监听器。
   *
   */
  private _removeGlobalListener() {
    if (this._globalSubscription) {
      this._globalSubscription.unsubscribe();
      this._globalSubscription = null;
    }
  }
}
