/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  EmbeddedViewRef,
  IterableChangeRecord,
  IterableChanges,
  ViewContainerRef,
} from '@angular/core';
import {
  _ViewRepeater,
  _ViewRepeaterItemChanged,
  _ViewRepeaterItemContext,
  _ViewRepeaterItemContextFactory,
  _ViewRepeaterItemInsertArgs,
  _ViewRepeaterItemValueResolver,
  _ViewRepeaterOperation,
} from './view-repeater';

/**
 * A repeater that caches views when they are removed from a
 * {@link ViewContainerRef}. When new items are inserted into the container,
 * the repeater will reuse one of the cached views instead of creating a new
 * embedded view. Recycling cached views reduces the quantity of expensive DOM
 * inserts.
 *
 * 当一个复制器从 {@link ViewContainerRef} 中移除时，会缓存这些复制器。当把新条目插入到容器中时，复制器会复用其中一个缓存的视图，而不是创建一个新的嵌入式视图。回收利用缓存的视图可以减少昂贵的 DOM 插入量。
 *
 * @template T The type for the embedded view's $implicit property.
 *
 * 嵌入式视图的 $implicit 属性的类型。
 * @template R The type for the item in each IterableDiffer change record.
 *
 * 每个 IterableDiffer 更改记录中的条目类型。
 * @template C The type for the context passed to each embedded view.
 *
 * 传给每个嵌入式视图的上下文类型。
 */
export class _RecycleViewRepeaterStrategy<T, R, C extends _ViewRepeaterItemContext<T>>
  implements _ViewRepeater<T, R, C>
{
  /**
   * The size of the cache used to store unused views.
   * Setting the cache size to `0` will disable caching. Defaults to 20 views.
   *
   * 用于存储未用视图的缓存大小。如何将缓存大小设置为 `0` 将禁用缓存。默认为 20 个视图。
   *
   */
  viewCacheSize: number = 20;

  /**
   * View cache that stores embedded view instances that have been previously stamped out,
   * but don't are not currently rendered. The view repeater will reuse these views rather than
   * creating brand new ones.
   *
   * 查看缓存，用于存储以前已标记过的但当前没有渲染过的嵌入式视图实例。视图复制器会复用这些视图而不是全新的视图。
   *
   * TODO(michaeljamesparsons) Investigate whether using a linked list would improve performance.
   *
   * TODO(michaeljamesparsons) 调查使用链表是否会提高性能。
   *
   */
  private _viewCache: EmbeddedViewRef<C>[] = [];

  /**
   * Apply changes to the DOM.
   *
   * 把这些变化应用到 DOM 中。
   *
   */
  applyChanges(
    changes: IterableChanges<R>,
    viewContainerRef: ViewContainerRef,
    itemContextFactory: _ViewRepeaterItemContextFactory<T, R, C>,
    itemValueResolver: _ViewRepeaterItemValueResolver<T, R>,
    itemViewChanged?: _ViewRepeaterItemChanged<R, C>,
  ) {
    // Rearrange the views to put them in the right location.
    changes.forEachOperation(
      (
        record: IterableChangeRecord<R>,
        adjustedPreviousIndex: number | null,
        currentIndex: number | null,
      ) => {
        let view: EmbeddedViewRef<C> | undefined;
        let operation: _ViewRepeaterOperation;
        if (record.previousIndex == null) {
          // Item added.
          const viewArgsFactory = () =>
            itemContextFactory(record, adjustedPreviousIndex, currentIndex);
          view = this._insertView(
            viewArgsFactory,
            currentIndex!,
            viewContainerRef,
            itemValueResolver(record),
          );
          operation = view ? _ViewRepeaterOperation.INSERTED : _ViewRepeaterOperation.REPLACED;
        } else if (currentIndex == null) {
          // Item removed.
          this._detachAndCacheView(adjustedPreviousIndex!, viewContainerRef);
          operation = _ViewRepeaterOperation.REMOVED;
        } else {
          // Item moved.
          view = this._moveView(
            adjustedPreviousIndex!,
            currentIndex!,
            viewContainerRef,
            itemValueResolver(record),
          );
          operation = _ViewRepeaterOperation.MOVED;
        }

        if (itemViewChanged) {
          itemViewChanged({
            context: view?.context,
            operation,
            record,
          });
        }
      },
    );
  }

  detach() {
    for (const view of this._viewCache) {
      view.destroy();
    }
    this._viewCache = [];
  }

  /**
   * Inserts a view for a new item, either from the cache or by creating a new
   * one. Returns `undefined` if the item was inserted into a cached view.
   *
   * 为新条目插入一个视图，可能从缓存中取得，也可能创建一个新条目。如果该条目已被插入到缓存视图中，则返回 `undefined`
   *
   */
  private _insertView(
    viewArgsFactory: () => _ViewRepeaterItemInsertArgs<C>,
    currentIndex: number,
    viewContainerRef: ViewContainerRef,
    value: T,
  ): EmbeddedViewRef<C> | undefined {
    const cachedView = this._insertViewFromCache(currentIndex!, viewContainerRef);
    if (cachedView) {
      cachedView.context.$implicit = value;
      return undefined;
    }

    const viewArgs = viewArgsFactory();
    return viewContainerRef.createEmbeddedView(
      viewArgs.templateRef,
      viewArgs.context,
      viewArgs.index,
    );
  }

  /**
   * Detaches the view at the given index and inserts into the view cache.
   *
   * 在指定的索引处拆除视图，并把它插入到视图缓存中。
   *
   */
  private _detachAndCacheView(index: number, viewContainerRef: ViewContainerRef) {
    const detachedView = viewContainerRef.detach(index) as EmbeddedViewRef<C>;
    this._maybeCacheView(detachedView, viewContainerRef);
  }

  /**
   * Moves view at the previous index to the current index.
   *
   * 把前一个索引的视图移动到当前索引。
   *
   */
  private _moveView(
    adjustedPreviousIndex: number,
    currentIndex: number,
    viewContainerRef: ViewContainerRef,
    value: T,
  ): EmbeddedViewRef<C> {
    const view = viewContainerRef.get(adjustedPreviousIndex!) as EmbeddedViewRef<C>;
    viewContainerRef.move(view, currentIndex);
    view.context.$implicit = value;
    return view;
  }

  /**
   * Cache the given detached view. If the cache is full, the view will be
   * destroyed.
   *
   * 缓存指定的已拆除视图。如果缓存已满，该视图将被销毁。
   *
   */
  private _maybeCacheView(view: EmbeddedViewRef<C>, viewContainerRef: ViewContainerRef) {
    if (this._viewCache.length < this.viewCacheSize) {
      this._viewCache.push(view);
    } else {
      const index = viewContainerRef.indexOf(view);

      // The host component could remove views from the container outside of
      // the view repeater. It's unlikely this will occur, but just in case,
      // destroy the view on its own, otherwise destroy it through the
      // container to ensure that all the references are removed.
      if (index === -1) {
        view.destroy();
      } else {
        viewContainerRef.remove(index);
      }
    }
  }

  /**
   * Inserts a recycled view from the cache at the given index.
   *
   * 在指定索引处的缓存中插入一个回收的视图。
   *
   */
  private _insertViewFromCache(
    index: number,
    viewContainerRef: ViewContainerRef,
  ): EmbeddedViewRef<C> | null {
    const cachedView = this._viewCache.pop();
    if (cachedView) {
      viewContainerRef.insert(cachedView, index);
    }
    return cachedView || null;
  }
}
