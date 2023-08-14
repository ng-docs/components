/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {DOCUMENT} from '@angular/common';
import {Inject, Injectable, OnDestroy} from '@angular/core';
import type {OverlayRef} from '../overlay-ref';

/**
 * Service for dispatching events that land on the body to appropriate overlay ref,
 * if any. It maintains a list of attached overlays to determine best suited overlay based
 * on event target and order of overlay opens.
 *
 * 本服务用于将落在主体上的事件派发到适当的浮层引用（如果有）。它维护一个已附加的浮层列表，以便根据事件目标和浮层打开的顺序确定最适合的浮层。
 *
 */
@Injectable({providedIn: 'root'})
export abstract class BaseOverlayDispatcher implements OnDestroy {
  /**
   * Currently attached overlays in the order they were attached.
   *
   * 当前已附加的浮层，按其附加顺序排列。
   *
   */
  _attachedOverlays: OverlayRef[] = [];

  protected _document: Document;
  protected _isAttached: boolean;

  constructor(@Inject(DOCUMENT) document: any) {
    this._document = document;
  }

  ngOnDestroy(): void {
    this.detach();
  }

  /**
   * Add a new overlay to the list of attached overlay refs.
   *
   * 将新的浮层添加到已附加的浮层引用列表中。
   *
   */
  add(overlayRef: OverlayRef): void {
    // Ensure that we don't get the same overlay multiple times.
    this.remove(overlayRef);
    this._attachedOverlays.push(overlayRef);
  }

  /**
   * Remove an overlay from the list of attached overlay refs.
   *
   * 从已附加的浮层引用列表中删除浮层。
   *
   */
  remove(overlayRef: OverlayRef): void {
    const index = this._attachedOverlays.indexOf(overlayRef);

    if (index > -1) {
      this._attachedOverlays.splice(index, 1);
    }

    // Remove the global listener once there are no more overlays.
    if (this._attachedOverlays.length === 0) {
      this.detach();
    }
  }

  /**
   * Detaches the global event listener.
   *
   * 拆除全局事件侦听器。
   *
   */
  protected abstract detach(): void;
}
