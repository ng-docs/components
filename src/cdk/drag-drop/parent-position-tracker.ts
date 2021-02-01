/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ViewportRuler} from '@angular/cdk/scrolling';
import {getMutableClientRect, adjustClientRect} from './client-rect';

/**
 * Object holding the scroll position of something.
 *
 * 保存滚动位置的对象。
 *
 */
interface ScrollPosition {
  top: number;
  left: number;
}

/**
 * Keeps track of the scroll position and dimensions of the parents of an element.
 *
 * 跟踪元素父级的滚动位置和规格。
 *
 */
export class ParentPositionTracker {
  /**
   * Cached positions of the scrollable parent elements.
   *
   * 缓存的可滚动父元素位置。
   *
   */
  readonly positions = new Map<Document|HTMLElement, {
    scrollPosition: ScrollPosition,
    clientRect?: ClientRect
  }>();

  constructor(private _document: Document, private _viewportRuler: ViewportRuler) {}

  /**
   * Clears the cached positions.
   *
   * 清除缓存的位置。
   *
   */
  clear() {
    this.positions.clear();
  }

  /**
   * Caches the positions. Should be called at the beginning of a drag sequence.
   *
   * 缓存这些位置。应该在拖曳序列开始时调用。
   *
   */
  cache(elements: HTMLElement[] | ReadonlyArray<HTMLElement>) {
    this.clear();
    this.positions.set(this._document, {
      scrollPosition: this._viewportRuler.getViewportScrollPosition(),
    });

    elements.forEach(element => {
      this.positions.set(element, {
        scrollPosition: {top: element.scrollTop, left: element.scrollLeft},
        clientRect: getMutableClientRect(element)
      });
    });
  }

  /**
   * Handles scrolling while a drag is taking place.
   *
   * 在拖动过程中处理滚动操作。
   *
   */
  handleScroll(event: Event): ScrollPosition | null {
    const target = event.target as HTMLElement | Document;
    const cachedPosition = this.positions.get(target);

    if (!cachedPosition) {
      return null;
    }

    // Used when figuring out whether an element is inside the scroll parent. If the scrolled
    // parent is the `document`, we use the `documentElement`, because IE doesn't support
    // `contains` on the `document`.
    const scrolledParentNode = target === this._document ? target.documentElement : target;
    const scrollPosition = cachedPosition.scrollPosition;
    let newTop: number;
    let newLeft: number;

    if (target === this._document) {
      const viewportScrollPosition = this._viewportRuler!.getViewportScrollPosition();
      newTop = viewportScrollPosition.top;
      newLeft = viewportScrollPosition.left;
    } else {
      newTop = (target as HTMLElement).scrollTop;
      newLeft = (target as HTMLElement).scrollLeft;
    }

    const topDifference = scrollPosition.top - newTop;
    const leftDifference = scrollPosition.left - newLeft;

    // Go through and update the cached positions of the scroll
    // parents that are inside the element that was scrolled.
    this.positions.forEach((position, node) => {
      if (position.clientRect && target !== node && scrolledParentNode.contains(node)) {
        adjustClientRect(position.clientRect, topDifference, leftDifference);
      }
    });

    scrollPosition.top = newTop;
    scrollPosition.left = newLeft;

    return {top: topDifference, left: leftDifference};
  }
}
