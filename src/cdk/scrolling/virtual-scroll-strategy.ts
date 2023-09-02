/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {InjectionToken} from '@angular/core';
import {Observable} from 'rxjs';
import type {CdkVirtualScrollViewport} from './virtual-scroll-viewport';

/**
 * The injection token used to specify the virtual scrolling strategy.
 *
 * 这个注入令牌用来指定虚拟滚动策略。
 *
 */
export const VIRTUAL_SCROLL_STRATEGY = new InjectionToken<VirtualScrollStrategy>(
  'VIRTUAL_SCROLL_STRATEGY',
);
/**
 * A strategy that dictates which items should be rendered in the viewport.
 *
 * 该策略决定了应该在视口中渲染哪些条目。
 *
 */
export interface VirtualScrollStrategy {
  /**
   * Emits when the index of the first element visible in the viewport changes.
   *
   * 当视口中可见的第一个元素的索引发生变化时触发。
   *
   */
  scrolledIndexChange: Observable<number>;

  /**
   * Attaches this scroll strategy to a viewport.
   *
   * 把这个滚动策略附着到视口中。
   *
   * @param viewport The viewport to attach this strategy to.
   *
   * 要把此策略附着到的视口。
   *
   */
  attach(viewport: CdkVirtualScrollViewport): void;

  /**
   * Detaches this scroll strategy from the currently attached viewport.
   *
   * 把这个滚动策略从当前连接的视口中拆除。
   *
   */
  detach(): void;

  /**
   * Called when the viewport is scrolled \(debounced using requestAnimationFrame\).
   *
   * 在视口发生滚动时调用（使用 requestAnimationFrame 来防抖）。
   *
   */
  onContentScrolled(): void;

  /**
   * Called when the length of the data changes.
   *
   * 当数据长度发生变化时调用。
   *
   */
  onDataLengthChanged(): void;

  /**
   * Called when the range of items rendered in the DOM has changed.
   *
   * 当 DOM 中渲染的条目范围发生变化时调用。
   *
   */
  onContentRendered(): void;

  /**
   * Called when the offset of the rendered items changed.
   *
   * 当渲染条目的偏移量发生变化时调用。
   *
   */
  onRenderedOffsetChanged(): void;

  /**
   * Scroll to the offset for the given index.
   *
   * 滚动到指定索引的偏移量。
   *
   * @param index The index of the element to scroll to.
   *
   * 要滚动的元素的索引。
   *
   * @param behavior The ScrollBehavior to use when scrolling.
   *
   * 滚动时要使用的 ScrollBehavior。
   *
   */
  scrollToIndex(index: number, behavior: ScrollBehavior): void;
}
