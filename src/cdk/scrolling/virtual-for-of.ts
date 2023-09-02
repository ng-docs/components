/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  ArrayDataSource,
  CollectionViewer,
  DataSource,
  ListRange,
  isDataSource,
  _RecycleViewRepeaterStrategy,
  _VIEW_REPEATER_STRATEGY,
  _ViewRepeaterItemInsertArgs,
} from '@angular/cdk/collections';
import {
  Directive,
  DoCheck,
  EmbeddedViewRef,
  Inject,
  Input,
  IterableChangeRecord,
  IterableChanges,
  IterableDiffer,
  IterableDiffers,
  NgIterable,
  NgZone,
  OnDestroy,
  SkipSelf,
  TemplateRef,
  TrackByFunction,
  ViewContainerRef,
} from '@angular/core';
import {coerceNumberProperty, NumberInput} from '@angular/cdk/coercion';
import {Observable, Subject, of as observableOf, isObservable} from 'rxjs';
import {pairwise, shareReplay, startWith, switchMap, takeUntil} from 'rxjs/operators';
import {CdkVirtualScrollRepeater} from './virtual-scroll-repeater';
import {CdkVirtualScrollViewport} from './virtual-scroll-viewport';

/**
 * The context for an item rendered by `CdkVirtualForOf`
 *
 * `CdkVirtualForOf` 渲染的条目的上下文
 *
 */
export type CdkVirtualForOfContext<T> = {
  /**
   * The item value.
   *
   * 条目的值。
   *
   */
  $implicit: T;
  /**
   * The DataSource, Observable, or NgIterable that was passed to \*cdkVirtualFor.
   *
   * 传递给 \* cdkVirtualFor 的 DataSource、Observable 或 NgIterable。
   *
   */
  cdkVirtualForOf: DataSource<T> | Observable<T[]> | NgIterable<T>;
  /**
   * The index of the item in the DataSource.
   *
   * DataSource 中条目的索引。
   *
   */
  index: number;
  /**
   * The number of items in the DataSource.
   *
   * 数据源中的条目数。
   *
   */
  count: number;
  /**
   * Whether this is the first item in the DataSource.
   *
   * 这是否为 DataSource 中的第一个条目。
   *
   */
  first: boolean;
  /**
   * Whether this is the last item in the DataSource.
   *
   * 这是否为 DataSource 中的最后一条目。
   *
   */
  last: boolean;
  /**
   * Whether the index is even.
   *
   * 行索引是否偶数。
   *
   */
  even: boolean;
  /**
   * Whether the index is odd.
   *
   * 行索引是否为奇数。
   *
   */
  odd: boolean;
};

/**
 * Helper to extract the offset of a DOM Node in a certain direction.
 *
 * 用于从某个特定方向提取 DOM 节点偏移量的辅助函数。
 *
 */
function getOffset(orientation: 'horizontal' | 'vertical', direction: 'start' | 'end', node: Node) {
  const el = node as Element;
  if (!el.getBoundingClientRect) {
    return 0;
  }
  const rect = el.getBoundingClientRect();

  if (orientation === 'horizontal') {
    return direction === 'start' ? rect.left : rect.right;
  }

  return direction === 'start' ? rect.top : rect.bottom;
}

/**
 * A directive similar to `ngForOf` to be used for rendering data inside a virtual scrolling
 * container.
 *
 * 类似于 `ngForOf` 的指令，用于渲染虚拟滚动容器中的数据。
 *
 */
@Directive({
  selector: '[cdkVirtualFor][cdkVirtualForOf]',
  providers: [{provide: _VIEW_REPEATER_STRATEGY, useClass: _RecycleViewRepeaterStrategy}],
  standalone: true,
})
export class CdkVirtualForOf<T>
  implements CdkVirtualScrollRepeater<T>, CollectionViewer, DoCheck, OnDestroy
{
  /**
   * Emits when the rendered view of the data changes.
   *
   * 当渲染的数据视图发生变化时触发。
   *
   */
  readonly viewChange = new Subject<ListRange>();

  /**
   * Subject that emits when a new DataSource instance is given.
   *
   * 在指定新的 DataSource 实例时发出通知的主体对象。
   *
   */
  private readonly _dataSourceChanges = new Subject<DataSource<T>>();

  /**
   * The DataSource to display.
   *
   * 要显示的 DataSource。
   *
   */
  @Input()
  get cdkVirtualForOf(): DataSource<T> | Observable<T[]> | NgIterable<T> | null | undefined {
    return this._cdkVirtualForOf;
  }
  set cdkVirtualForOf(value: DataSource<T> | Observable<T[]> | NgIterable<T> | null | undefined) {
    this._cdkVirtualForOf = value;
    if (isDataSource(value)) {
      this._dataSourceChanges.next(value);
    } else {
      // If value is an an NgIterable, convert it to an array.
      this._dataSourceChanges.next(
        new ArrayDataSource<T>(isObservable(value) ? value : Array.from(value || [])),
      );
    }
  }

  _cdkVirtualForOf: DataSource<T> | Observable<T[]> | NgIterable<T> | null | undefined;

  /**
   * The `TrackByFunction` to use for tracking changes. The `TrackByFunction` takes the index and
   * the item and produces a value to be used as the item's identity when tracking changes.
   *
   * `TrackByFunction` 用于跟踪变更。`TrackByFunction` 接受索引和条目，并在跟踪更改时产生一个值作为此条目的标识。
   *
   */
  @Input()
  get cdkVirtualForTrackBy(): TrackByFunction<T> | undefined {
    return this._cdkVirtualForTrackBy;
  }
  set cdkVirtualForTrackBy(fn: TrackByFunction<T> | undefined) {
    this._needsUpdate = true;
    this._cdkVirtualForTrackBy = fn
      ? (index, item) => fn(index + (this._renderedRange ? this._renderedRange.start : 0), item)
      : undefined;
  }
  private _cdkVirtualForTrackBy: TrackByFunction<T> | undefined;

  /**
   * The template used to stamp out new elements.
   *
   * 用来生成新元素的模板。
   *
   */
  @Input()
  set cdkVirtualForTemplate(value: TemplateRef<CdkVirtualForOfContext<T>>) {
    if (value) {
      this._needsUpdate = true;
      this._template = value;
    }
  }

  /**
   * The size of the cache used to store templates that are not being used for re-use later.
   * Setting the cache size to `0` will disable caching. Defaults to 20 templates.
   *
   * 缓存的大小，用于存放那些以前没有用过的模板。如果将缓存大小设置为 `0` 将禁用缓存。默认为 20 个模板。
   *
   */
  @Input()
  get cdkVirtualForTemplateCacheSize(): number {
    return this._viewRepeater.viewCacheSize;
  }
  set cdkVirtualForTemplateCacheSize(size: NumberInput) {
    this._viewRepeater.viewCacheSize = coerceNumberProperty(size);
  }

  /**
   * Emits whenever the data in the current DataSource changes.
   *
   * 只要当前 DataSource 中的数据发生变化，就会发出通知。
   *
   */
  readonly dataStream: Observable<readonly T[]> = this._dataSourceChanges.pipe(
    // Start off with null `DataSource`.
    startWith(null),
    // Bundle up the previous and current data sources so we can work with both.
    pairwise(),
    // Use `_changeDataSource` to disconnect from the previous data source and connect to the
    // new one, passing back a stream of data changes which we run through `switchMap` to give
    // us a data stream that emits the latest data from whatever the current `DataSource` is.
    switchMap(([prev, cur]) => this._changeDataSource(prev, cur)),
    // Replay the last emitted data when someone subscribes.
    shareReplay(1),
  );

  /**
   * The differ used to calculate changes to the data.
   *
   * 用于计算数据的变化的差分器。
   *
   */
  private _differ: IterableDiffer<T> | null = null;

  /**
   * The most recent data emitted from the DataSource.
   *
   * 从 DataSource 发出的最新数据。
   *
   */
  private _data: readonly T[];

  /**
   * The currently rendered items.
   *
   * 当前渲染的条目。
   *
   */
  private _renderedItems: T[];

  /**
   * The currently rendered range of indices.
   *
   * 当前渲染的索引范围。
   *
   */
  private _renderedRange: ListRange;

  /**
   * Whether the rendered data should be updated during the next ngDoCheck cycle.
   *
   * 渲染的数据是否应该在下次的 ngDoCheck 周期中更新。
   *
   */
  private _needsUpdate = false;

  private readonly _destroyed = new Subject<void>();

  constructor(
    /**
     * The view container to add items to.
     *
     * 要添加元素的视图容器。
     *
     */
    private _viewContainerRef: ViewContainerRef,
    /**
     * The template to use when stamping out new items.
     *
     * 当生成新条目时，要使用的模板。
     *
     */
    private _template: TemplateRef<CdkVirtualForOfContext<T>>,
    /**
     * The set of available differs.
     *
     * 可用差分器的集合。
     */
    private _differs: IterableDiffers,
    /**
     * The strategy used to render items in the virtual scroll viewport.
     *
     * 在虚拟滚动视口内渲染条目时使用的策略。
     */
    @Inject(_VIEW_REPEATER_STRATEGY)
    private _viewRepeater: _RecycleViewRepeaterStrategy<T, T, CdkVirtualForOfContext<T>>,
    /**
     * The virtual scrolling viewport that these items are being rendered in.
     *
     * 要把这些条目渲染到的虚拟滚动视口。
     */
    @SkipSelf() private _viewport: CdkVirtualScrollViewport,
    ngZone: NgZone,
  ) {
    this.dataStream.subscribe(data => {
      this._data = data;
      this._onRenderedDataChange();
    });
    this._viewport.renderedRangeStream.pipe(takeUntil(this._destroyed)).subscribe(range => {
      this._renderedRange = range;
      if (this.viewChange.observers.length) {
        ngZone.run(() => this.viewChange.next(this._renderedRange));
      }
      this._onRenderedDataChange();
    });
    this._viewport.attach(this);
  }

  /**
   * Measures the combined size \(width for horizontal orientation, height for vertical\) of all items
   * in the specified range. Throws an error if the range includes items that are not currently
   * rendered.
   *
   * 测量指定范围内所有条目的组合大小（水平方向的宽度，垂直方向的高度）。如果该范围包含当前尚未渲染过的条目，则会引发错误。
   *
   */
  measureRangeSize(range: ListRange, orientation: 'horizontal' | 'vertical'): number {
    if (range.start >= range.end) {
      return 0;
    }
    if (
      (range.start < this._renderedRange.start || range.end > this._renderedRange.end) &&
      (typeof ngDevMode === 'undefined' || ngDevMode)
    ) {
      throw Error(`Error: attempted to measure an item that isn't rendered.`);
    }

    // The index into the list of rendered views for the first item in the range.
    const renderedStartIndex = range.start - this._renderedRange.start;
    // The length of the range we're measuring.
    const rangeLen = range.end - range.start;

    // Loop over all the views, find the first and land node and compute the size by subtracting
    // the top of the first node from the bottom of the last one.
    let firstNode: HTMLElement | undefined;
    let lastNode: HTMLElement | undefined;

    // Find the first node by starting from the beginning and going forwards.
    for (let i = 0; i < rangeLen; i++) {
      const view = this._viewContainerRef.get(i + renderedStartIndex) as EmbeddedViewRef<
        CdkVirtualForOfContext<T>
      > | null;
      if (view && view.rootNodes.length) {
        firstNode = lastNode = view.rootNodes[0];
        break;
      }
    }

    // Find the last node by starting from the end and going backwards.
    for (let i = rangeLen - 1; i > -1; i--) {
      const view = this._viewContainerRef.get(i + renderedStartIndex) as EmbeddedViewRef<
        CdkVirtualForOfContext<T>
      > | null;
      if (view && view.rootNodes.length) {
        lastNode = view.rootNodes[view.rootNodes.length - 1];
        break;
      }
    }

    return firstNode && lastNode
      ? getOffset(orientation, 'end', lastNode) - getOffset(orientation, 'start', firstNode)
      : 0;
  }

  ngDoCheck() {
    if (this._differ && this._needsUpdate) {
      // TODO(mmalerba): We should differentiate needs update due to scrolling and a new portion of
      // this list being rendered (can use simpler algorithm) vs needs update due to data actually
      // changing (need to do this diff).
      const changes = this._differ.diff(this._renderedItems);
      if (!changes) {
        this._updateContext();
      } else {
        this._applyChanges(changes);
      }
      this._needsUpdate = false;
    }
  }

  ngOnDestroy() {
    this._viewport.detach();

    this._dataSourceChanges.next(undefined!);
    this._dataSourceChanges.complete();
    this.viewChange.complete();

    this._destroyed.next();
    this._destroyed.complete();
    this._viewRepeater.detach();
  }

  /**
   * React to scroll state changes in the viewport.
   *
   * 对视口中滚动状态的变化做出反应。
   *
   */
  private _onRenderedDataChange() {
    if (!this._renderedRange) {
      return;
    }
    this._renderedItems = this._data.slice(this._renderedRange.start, this._renderedRange.end);
    if (!this._differ) {
      // Use a wrapper function for the `trackBy` so any new values are
      // picked up automatically without having to recreate the differ.
      this._differ = this._differs.find(this._renderedItems).create((index, item) => {
        return this.cdkVirtualForTrackBy ? this.cdkVirtualForTrackBy(index, item) : item;
      });
    }
    this._needsUpdate = true;
  }

  /**
   * Swap out one `DataSource` for another.
   *
   * 把一个 `DataSource` 换成另一个。
   *
   */
  private _changeDataSource(
    oldDs: DataSource<T> | null,
    newDs: DataSource<T> | null,
  ): Observable<readonly T[]> {
    if (oldDs) {
      oldDs.disconnect(this);
    }

    this._needsUpdate = true;
    return newDs ? newDs.connect(this) : observableOf();
  }

  /**
   * Update the `CdkVirtualForOfContext` for all views.
   *
   * 为所有视图更新 `CdkVirtualForOfContext`
   *
   */
  private _updateContext() {
    const count = this._data.length;
    let i = this._viewContainerRef.length;
    while (i--) {
      const view = this._viewContainerRef.get(i) as EmbeddedViewRef<CdkVirtualForOfContext<T>>;
      view.context.index = this._renderedRange.start + i;
      view.context.count = count;
      this._updateComputedContextProperties(view.context);
      view.detectChanges();
    }
  }

  /**
   * Apply changes to the DOM.
   *
   * 把这些变化应用到 DOM 中。
   *
   */
  private _applyChanges(changes: IterableChanges<T>) {
    this._viewRepeater.applyChanges(
      changes,
      this._viewContainerRef,
      (
        record: IterableChangeRecord<T>,
        _adjustedPreviousIndex: number | null,
        currentIndex: number | null,
      ) => this._getEmbeddedViewArgs(record, currentIndex!),
      record => record.item,
    );

    // Update $implicit for any items that had an identity change.
    changes.forEachIdentityChange((record: IterableChangeRecord<T>) => {
      const view = this._viewContainerRef.get(record.currentIndex!) as EmbeddedViewRef<
        CdkVirtualForOfContext<T>
      >;
      view.context.$implicit = record.item;
    });

    // Update the context variables on all items.
    const count = this._data.length;
    let i = this._viewContainerRef.length;
    while (i--) {
      const view = this._viewContainerRef.get(i) as EmbeddedViewRef<CdkVirtualForOfContext<T>>;
      view.context.index = this._renderedRange.start + i;
      view.context.count = count;
      this._updateComputedContextProperties(view.context);
    }
  }

  /**
   * Update the computed properties on the `CdkVirtualForOfContext`.
   *
   * 更新 `CdkVirtualForOfContext` 上的计算属性。
   *
   */
  private _updateComputedContextProperties(context: CdkVirtualForOfContext<any>) {
    context.first = context.index === 0;
    context.last = context.index === context.count - 1;
    context.even = context.index % 2 === 0;
    context.odd = !context.even;
  }

  private _getEmbeddedViewArgs(
    record: IterableChangeRecord<T>,
    index: number,
  ): _ViewRepeaterItemInsertArgs<CdkVirtualForOfContext<T>> {
    // Note that it's important that we insert the item directly at the proper index,
    // rather than inserting it and the moving it in place, because if there's a directive
    // on the same node that injects the `ViewContainerRef`, Angular will insert another
    // comment node which can throw off the move when it's being repeated for all items.
    return {
      templateRef: this._template,
      context: {
        $implicit: record.item,
        // It's guaranteed that the iterable is not "undefined" or "null" because we only
        // generate views for elements if the "cdkVirtualForOf" iterable has elements.
        cdkVirtualForOf: this._cdkVirtualForOf!,
        index: -1,
        count: -1,
        first: false,
        last: false,
        odd: false,
        even: false,
      },
      index,
    };
  }
}
