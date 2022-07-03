/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Injectable, Inject, NgZone, ElementRef} from '@angular/core';
import {DOCUMENT} from '@angular/common';
import {ViewportRuler} from '@angular/cdk/scrolling';
import {DragRef, DragRefConfig} from './drag-ref';
import {DropListRef} from './drop-list-ref';
import {DragDropRegistry} from './drag-drop-registry';

/**
 * Default configuration to be used when creating a `DragRef`.
 *
 * 创建 `DragRef` 时要使用的默认配置。
 *
 */
const DEFAULT_CONFIG = {
  dragStartThreshold: 5,
  pointerDirectionChangeThreshold: 5,
};

/**
 * Service that allows for drag-and-drop functionality to be attached to DOM elements.
 *
 * 允许把拖放功能附着到 DOM 元素上的服务。
 *
 */
@Injectable({providedIn: 'root'})
export class DragDrop {
  constructor(
    @Inject(DOCUMENT) private _document: any,
    private _ngZone: NgZone,
    private _viewportRuler: ViewportRuler,
    private _dragDropRegistry: DragDropRegistry<DragRef, DropListRef>,
  ) {}

  /**
   * Turns an element into a draggable item.
   *
   * 把一个元素变成一个可拖动的条目。
   *
   * @param element Element to which to attach the dragging functionality.
   *
   * 要附加拖动功能的元素。
   *
   * @param config Object used to configure the dragging behavior.
   *
   * 用于配置拖动行为的对象。
   *
   */
  createDrag<T = any>(
    element: ElementRef<HTMLElement> | HTMLElement,
    config: DragRefConfig = DEFAULT_CONFIG,
  ): DragRef<T> {
    return new DragRef<T>(
      element,
      config,
      this._document,
      this._ngZone,
      this._viewportRuler,
      this._dragDropRegistry,
    );
  }

  /**
   * Turns an element into a drop list.
   *
   * 把一个元素转成一个拖放列表。
   *
   * @param element Element to which to attach the drop list functionality.
   *
   * 要附加投放列表功能的元素。
   *
   */
  createDropList<T = any>(element: ElementRef<HTMLElement> | HTMLElement): DropListRef<T> {
    return new DropListRef<T>(
      element,
      this._dragDropRegistry,
      this._document,
      this._ngZone,
      this._viewportRuler,
    );
  }
}
