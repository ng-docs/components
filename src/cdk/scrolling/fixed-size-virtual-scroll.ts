/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {coerceNumberProperty, NumberInput} from '@angular/cdk/coercion';
import {Directive, forwardRef, Input, OnChanges} from '@angular/core';
import {Observable, Subject} from 'rxjs';
import {distinctUntilChanged} from 'rxjs/operators';
import {VIRTUAL_SCROLL_STRATEGY, VirtualScrollStrategy} from './virtual-scroll-strategy';
import {CdkVirtualScrollViewport} from './virtual-scroll-viewport';

/**
 * Virtual scrolling strategy for lists with items of known fixed size.
 *
 * 具有固定大小已知条目列表的虚拟滚动策略。
 *
 */
export class FixedSizeVirtualScrollStrategy implements VirtualScrollStrategy {
  private readonly _scrolledIndexChange = new Subject<number>();

  /**
   *
   * @docs-private Implemented as part of VirtualScrollStrategy.
   *
   *是 VirtualScrollStrategy 实现的一部分。
   *
   */
  scrolledIndexChange: Observable<number> = this._scrolledIndexChange.pipe(distinctUntilChanged());

  /**
   * The attached viewport.
   *
   * 附着的视口。
   *
   */
  private _viewport: CdkVirtualScrollViewport | null = null;

  /**
   * The size of the items in the virtually scrolling list.
   *
   * 虚拟滚动列表中各条目的大小。
   *
   */
  private _itemSize: number;

  /**
   * The minimum amount of buffer rendered beyond the viewport (in pixels).
   *
   * 缓存在视口之外的最小缓冲区数（以像素为单位）。
   *
   */
  private _minBufferPx: number;

  /**
   * The number of buffer items to render beyond the edge of the viewport (in pixels).
   *
   * 缓存在视口边缘以外的缓冲区数（以像素为单位）。
   *
   */
  private _maxBufferPx: number;

  /**
   *
   * @param itemSize The size of the items in the virtually scrolling list.
   *
   * 虚拟滚动列表中各条目的大小。
   * @param minBufferPx The minimum amount of buffer \(in pixels\) before needing to render more
   *
   * 在需要渲染更多内容之前，缓冲区的最小量（以像素为单位）
   *
   * @param maxBufferPx The amount of buffer \(in pixels\) to render when rendering more.
   *
   * 渲染时要渲染的缓冲区（以像素为单位）。
   *
   */
  constructor(itemSize: number, minBufferPx: number, maxBufferPx: number) {
    this._itemSize = itemSize;
    this._minBufferPx = minBufferPx;
    this._maxBufferPx = maxBufferPx;
  }

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
  attach(viewport: CdkVirtualScrollViewport) {
    this._viewport = viewport;
    this._updateTotalContentSize();
    this._updateRenderedRange();
  }

  /**
   * Detaches this scroll strategy from the currently attached viewport.
   *
   * 这个滚动策略是从当前连接的视口中拆除出来的。
   *
   */
  detach() {
    this._scrolledIndexChange.complete();
    this._viewport = null;
  }

  /**
   * Update the item size and buffer size.
   *
   * 更新条目大小和缓冲区大小。
   *
   * @param itemSize The size of the items in the virtually scrolling list.
   *
   * 虚拟滚动列表中各条目的大小。
   * @param minBufferPx The minimum amount of buffer \(in pixels\) before needing to render more
   *
   * 在需要渲染更多内容之前，缓冲区的最小量（以像素为单位）
   *
   * @param maxBufferPx The amount of buffer \(in pixels\) to render when rendering more.
   *
   * 渲染时要渲染的缓冲区（以像素为单位）。
   *
   */
  updateItemAndBufferSize(itemSize: number, minBufferPx: number, maxBufferPx: number) {
    if (maxBufferPx < minBufferPx && (typeof ngDevMode === 'undefined' || ngDevMode)) {
      throw Error('CDK virtual scroll: maxBufferPx must be greater than or equal to minBufferPx');
    }
    this._itemSize = itemSize;
    this._minBufferPx = minBufferPx;
    this._maxBufferPx = maxBufferPx;
    this._updateTotalContentSize();
    this._updateRenderedRange();
  }

  /**
   *
   * @docs-private Implemented as part of VirtualScrollStrategy.
   *
   *是 VirtualScrollStrategy 实现的一部分。
   *
   */
  onContentScrolled() {
    this._updateRenderedRange();
  }

  /**
   *
   * @docs-private Implemented as part of VirtualScrollStrategy.
   *
   *是 VirtualScrollStrategy 实现的一部分。
   *
   */
  onDataLengthChanged() {
    this._updateTotalContentSize();
    this._updateRenderedRange();
  }

  /**
   *
   * @docs-private Implemented as part of VirtualScrollStrategy.
   *
   *是 VirtualScrollStrategy 实现的一部分。
   *
   */
  onContentRendered() {
    /* no-op */
  }

  /**
   *
   * @docs-private Implemented as part of VirtualScrollStrategy.
   *
   *是 VirtualScrollStrategy 实现的一部分。
   *
   */
  onRenderedOffsetChanged() {
    /* no-op */
  }

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
  scrollToIndex(index: number, behavior: ScrollBehavior): void {
    if (this._viewport) {
      this._viewport.scrollToOffset(index * this._itemSize, behavior);
    }
  }

  /**
   * Update the viewport's total content size.
   *
   * 更新视口的总内容大小。
   *
   */
  private _updateTotalContentSize() {
    if (!this._viewport) {
      return;
    }

    this._viewport.setTotalContentSize(this._viewport.getDataLength() * this._itemSize);
  }

  /**
   * Update the viewport's rendered range.
   *
   * 更新视口的渲染范围。
   *
   */
  private _updateRenderedRange() {
    if (!this._viewport) {
      return;
    }

    const renderedRange = this._viewport.getRenderedRange();
    const newRange = {start: renderedRange.start, end: renderedRange.end};
    const viewportSize = this._viewport.getViewportSize();
    const dataLength = this._viewport.getDataLength();
    let scrollOffset = this._viewport.measureScrollOffset();
    // Prevent NaN as result when dividing by zero.
    let firstVisibleIndex = this._itemSize > 0 ? scrollOffset / this._itemSize : 0;

    // If user scrolls to the bottom of the list and data changes to a smaller list
    if (newRange.end > dataLength) {
      // We have to recalculate the first visible index based on new data length and viewport size.
      const maxVisibleItems = Math.ceil(viewportSize / this._itemSize);
      const newVisibleIndex = Math.max(
        0,
        Math.min(firstVisibleIndex, dataLength - maxVisibleItems),
      );

      // If first visible index changed we must update scroll offset to handle start/end buffers
      // Current range must also be adjusted to cover the new position (bottom of new list).
      if (firstVisibleIndex != newVisibleIndex) {
        firstVisibleIndex = newVisibleIndex;
        scrollOffset = newVisibleIndex * this._itemSize;
        newRange.start = Math.floor(firstVisibleIndex);
      }

      newRange.end = Math.max(0, Math.min(dataLength, newRange.start + maxVisibleItems));
    }

    const startBuffer = scrollOffset - newRange.start * this._itemSize;
    if (startBuffer < this._minBufferPx && newRange.start != 0) {
      const expandStart = Math.ceil((this._maxBufferPx - startBuffer) / this._itemSize);
      newRange.start = Math.max(0, newRange.start - expandStart);
      newRange.end = Math.min(
        dataLength,
        Math.ceil(firstVisibleIndex + (viewportSize + this._minBufferPx) / this._itemSize),
      );
    } else {
      const endBuffer = newRange.end * this._itemSize - (scrollOffset + viewportSize);
      if (endBuffer < this._minBufferPx && newRange.end != dataLength) {
        const expandEnd = Math.ceil((this._maxBufferPx - endBuffer) / this._itemSize);
        if (expandEnd > 0) {
          newRange.end = Math.min(dataLength, newRange.end + expandEnd);
          newRange.start = Math.max(
            0,
            Math.floor(firstVisibleIndex - this._minBufferPx / this._itemSize),
          );
        }
      }
    }

    this._viewport.setRenderedRange(newRange);
    this._viewport.setRenderedContentOffset(this._itemSize * newRange.start);
    this._scrolledIndexChange.next(Math.floor(firstVisibleIndex));
  }
}

/**
 * Provider factory for `FixedSizeVirtualScrollStrategy` that simply extracts the already created
 * `FixedSizeVirtualScrollStrategy` from the given directive.
 *
 * `FixedSizeVirtualScrollStrategy` Provider 工厂，只是从指定的指令中提取已经创建的 `FixedSizeVirtualScrollStrategy`
 *
 * @param fixedSizeDir The instance of `CdkFixedSizeVirtualScroll` to extract the
 *     `FixedSizeVirtualScrollStrategy` from.
 *
 * `CdkFixedSizeVirtualScroll` 实例从中提取 `FixedSizeVirtualScrollStrategy`。
 *
 */
export function _fixedSizeVirtualScrollStrategyFactory(fixedSizeDir: CdkFixedSizeVirtualScroll) {
  return fixedSizeDir._scrollStrategy;
}

/**
 * A virtual scroll strategy that supports fixed-size items.
 *
 * 支持固定大小的虚拟滚动策略。
 *
 */
@Directive({
  selector: 'cdk-virtual-scroll-viewport[itemSize]',
  standalone: true,
  providers: [
    {
      provide: VIRTUAL_SCROLL_STRATEGY,
      useFactory: _fixedSizeVirtualScrollStrategyFactory,
      deps: [forwardRef(() => CdkFixedSizeVirtualScroll)],
    },
  ],
})
export class CdkFixedSizeVirtualScroll implements OnChanges {
  /**
   * The size of the items in the list \(in pixels\).
   *
   * 列表中条目的大小（以像素为单位）。
   *
   */
  @Input()
  get itemSize(): number {
    return this._itemSize;
  }
  set itemSize(value: NumberInput) {
    this._itemSize = coerceNumberProperty(value);
  }
  _itemSize = 20;

  /**
   * The minimum amount of buffer rendered beyond the viewport \(in pixels\).
   * If the amount of buffer dips below this number, more items will be rendered. Defaults to 100px.
   *
   * 缓存在视口之外的最小缓冲区数（以像素为单位）。当缓冲区的数量低于这个数时，就会渲染出更多的条目。默认为 100px。
   *
   */
  @Input()
  get minBufferPx(): number {
    return this._minBufferPx;
  }
  set minBufferPx(value: NumberInput) {
    this._minBufferPx = coerceNumberProperty(value);
  }
  _minBufferPx = 100;

  /**
   * The number of pixels worth of buffer to render for when rendering new items. Defaults to 200px.
   *
   * 渲染新条目时要渲染的缓冲区的像素数。默认为 200px。
   *
   */
  @Input()
  get maxBufferPx(): number {
    return this._maxBufferPx;
  }
  set maxBufferPx(value: NumberInput) {
    this._maxBufferPx = coerceNumberProperty(value);
  }
  _maxBufferPx = 200;

  /**
   * The scroll strategy used by this directive.
   *
   * 本指令使用的滚动策略。
   *
   */
  _scrollStrategy = new FixedSizeVirtualScrollStrategy(
    this.itemSize,
    this.minBufferPx,
    this.maxBufferPx,
  );

  ngOnChanges() {
    this._scrollStrategy.updateItemAndBufferSize(this.itemSize, this.minBufferPx, this.maxBufferPx);
  }
}
