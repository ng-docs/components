/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {DOCUMENT} from '@angular/common';
import {Inject, Injectable, NgZone, Optional} from '@angular/core';
import {BaseOverlayDispatcher} from './base-overlay-dispatcher';
import type {OverlayRef} from '../overlay-ref';

/**
 * Service for dispatching keyboard events that land on the body to appropriate overlay ref,
 * if any. It maintains a list of attached overlays to determine best suited overlay based
 * on event target and order of overlay opens.
 *
 * 本服务用于将落在 body 上的键盘事件派发到适当的浮层引用（如果有）。它维护一个已附加的浮层列表，以便根据事件目标和浮层打开顺序确定最适合的浮层。
 *
 */
@Injectable({providedIn: 'root'})
export class OverlayKeyboardDispatcher extends BaseOverlayDispatcher {
  constructor(
    @Inject(DOCUMENT) document: any,
    /** @breaking-change 14.0.0 _ngZone will be required. */
    @Optional() private _ngZone?: NgZone,
  ) {
    super(document);
  }

  /**
   * Add a new overlay to the list of attached overlay refs.
   *
   * 将新的浮层添加到已附加的浮层引用列表中。
   *
   */
  override add(overlayRef: OverlayRef): void {
    super.add(overlayRef);

    // Lazily start dispatcher once first overlay is added
    if (!this._isAttached) {
      /** @breaking-change 14.0.0 _ngZone will be required. */
      if (this._ngZone) {
        this._ngZone.runOutsideAngular(() =>
          this._document.body.addEventListener('keydown', this._keydownListener),
        );
      } else {
        this._document.body.addEventListener('keydown', this._keydownListener);
      }
      this._isAttached = true;
    }
  }

  /**
   * Detaches the global keyboard event listener.
   *
   * 拆除全局键盘事件侦听器。
   *
   */
  protected detach() {
    if (this._isAttached) {
      this._document.body.removeEventListener('keydown', this._keydownListener);
      this._isAttached = false;
    }
  }

  /**
   * Keyboard event listener that will be attached to the body.
   *
   * 键盘事件监听器，将被附加到 body 上。
   *
   */
  private _keydownListener = (event: KeyboardEvent) => {
    const overlays = this._attachedOverlays;

    for (let i = overlays.length - 1; i > -1; i--) {
      // Dispatch the keydown event to the top overlay which has subscribers to its keydown events.
      // We want to target the most recent overlay, rather than trying to match where the event came
      // from, because some components might open an overlay, but keep focus on a trigger element
      // (e.g. for select and autocomplete). We skip overlays without keydown event subscriptions,
      // because we don't want overlays that don't handle keyboard events to block the ones below
      // them that do.
      if (overlays[i]._keydownEvents.observers.length > 0) {
        const keydownEvents = overlays[i]._keydownEvents;
        /** @breaking-change 14.0.0 _ngZone will be required. */
        if (this._ngZone) {
          this._ngZone.run(() => keydownEvents.next(event));
        } else {
          keydownEvents.next(event);
        }
        break;
      }
    }
  };
}
