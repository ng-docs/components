/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Observable, Subscriber} from 'rxjs';
import {Constructor} from './constructor';

/**
 * Mixin that adds an initialized property to a directive which, when subscribed to, will emit a
 * value once markInitialized has been called, which should be done during the ngOnInit function.
 * If the subscription is made after it has already been marked as initialized, then it will trigger
 * an emit immediately.
 *
 * 往指令中混入 `initialized` 属性，该指令被订阅时将在调用 `markInitialized` 时发出值，这应在 `ngOnInit` 函数期间完成。如果在已将其标记为已初始化之后进行订阅，它将立即发出值。
 *
 * @docs-private
 */
export interface HasInitialized {
  /**
   * Stream that emits once during the directive/component's ngOnInit.
   *
   * 在指令/组件的 ngOnInit 期间发出一次的流。
   *
   */
  initialized: Observable<void>;

  /**
   * Sets the state as initialized and must be called during ngOnInit to notify subscribers that
   * the directive has been initialized.
   *
   * 将状态设置为已初始化，必须在 ngOnInit 期间调用以通知订阅者该指令已被初始化。
   *
   * @docs-private
   */
  _markInitialized: () => void;
}

type HasInitializedCtor = Constructor<HasInitialized>;

/**
 * Mixin to augment a directive with an initialized property that will emits when ngOnInit ends.
 *
 * 混入 `initialized` 属性以扩展某个指令，，该指令将在 ngOnInit 结束时发出事件。
 *
 */
export function mixinInitialized<T extends Constructor<{}>>(base: T): HasInitializedCtor & T {
  return class extends base {
    /**
     * Whether this directive has been marked as initialized.
     *
     * 此指令是否已标记为已初始化。
     *
     */
    _isInitialized = false;

    /**
     * List of subscribers that subscribed before the directive was initialized. Should be notified
     * during \_markInitialized. Set to null after pending subscribers are notified, and should
     * not expect to be populated after.
     *
     * 在初始化指令之前已订阅的订阅者列表。应当在 \_markInitialized 期间通知。在通知未决的订户之后，将其设置为 null，并且不应期望在此之后填充。
     *
     */
    _pendingSubscribers: Subscriber<void>[] | null = [];

    /**
     * Observable stream that emits when the directive initializes. If already initialized, the
     * subscriber is stored to be notified once \_markInitialized is called.
     *
     * 指令初始化时发出的可观察流。如果已经初始化，则一旦 \_markInitialized 被调用，将存储订户以进行通知。
     *
     */
    initialized = new Observable<void>(subscriber => {
      // If initialized, immediately notify the subscriber. Otherwise store the subscriber to notify
      // when _markInitialized is called.
      if (this._isInitialized) {
        this._notifySubscriber(subscriber);
      } else {
        this._pendingSubscribers!.push(subscriber);
      }
    });

    constructor(...args: any[]) {
      super(...args);
    }

    /**
     * Marks the state as initialized and notifies pending subscribers. Should be called at the end
     * of ngOnInit.
     *
     * 将状态标记为已初始化，并通知未决订户。应该在 ngOnInit 的末尾调用。
     *
     * @docs-private
     */
    _markInitialized(): void {
      if (this._isInitialized && (typeof ngDevMode === 'undefined' || ngDevMode)) {
        throw Error(
          'This directive has already been marked as initialized and ' +
            'should not be called twice.',
        );
      }

      this._isInitialized = true;

      this._pendingSubscribers!.forEach(this._notifySubscriber);
      this._pendingSubscribers = null;
    }

    /**
     * Emits and completes the subscriber stream (should only emit once).
     *
     * 发出事件并完成订阅流（应该只发出一次）。
     *
     */
    _notifySubscriber(subscriber: Subscriber<void>): void {
      subscriber.next();
      subscriber.complete();
    }
  };
}
