/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Directionality} from '@angular/cdk/bidi';
import {ListRange} from '@angular/cdk/collections';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  Inject,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Optional,
  Output,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import {Platform} from '@angular/cdk/platform';
import {
  animationFrameScheduler,
  asapScheduler,
  Observable,
  Subject,
  Observer,
  Subscription,
} from 'rxjs';
import {auditTime, startWith, takeUntil} from 'rxjs/operators';
import {ScrollDispatcher} from './scroll-dispatcher';
import {CdkScrollable, ExtendedScrollToOptions} from './scrollable';
import {VIRTUAL_SCROLL_STRATEGY, VirtualScrollStrategy} from './virtual-scroll-strategy';
import {ViewportRuler} from './viewport-ruler';
import {CdkVirtualScrollRepeater} from './virtual-scroll-repeater';
import {BooleanInput, coerceBooleanProperty} from '@angular/cdk/coercion';
import {CdkVirtualScrollable, VIRTUAL_SCROLLABLE} from './virtual-scrollable';

/**
 * Checks if the given ranges are equal.
 *
 * 检查指定的范围是否相等。
 *
 */
function rangesEqual(r1: ListRange, r2: ListRange): boolean {
  return r1.start == r2.start && r1.end == r2.end;
}

/**
 * Scheduler to be used for scroll events. Needs to fall back to
 * something that doesn't rely on requestAnimationFrame on environments
 * that don't support it \(e.g. server-side rendering\).
 *
 * 用于滚动事件的派发器。在不支持它的环境（例如服务器端渲染）下要回退到不依赖 requestAnimationFrame 派发器。
 *
 */
const SCROLL_SCHEDULER =
  typeof requestAnimationFrame !== 'undefined' ? animationFrameScheduler : asapScheduler;

/**
 * A viewport that virtualizes its scrolling with the help of `CdkVirtualForOf`.
 *
 * 借助 `CdkVirtualForOf` 虚拟化滚动行为的视口。
 *
 */
@Component({
  selector: 'cdk-virtual-scroll-viewport',
  templateUrl: 'virtual-scroll-viewport.html',
  styleUrls: ['virtual-scroll-viewport.css'],
  host: {
    'class': 'cdk-virtual-scroll-viewport',
    '[class.cdk-virtual-scroll-orientation-horizontal]': 'orientation === "horizontal"',
    '[class.cdk-virtual-scroll-orientation-vertical]': 'orientation !== "horizontal"',
  },
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  providers: [
    {
      provide: CdkScrollable,
      useFactory: (
        virtualScrollable: CdkVirtualScrollable | null,
        viewport: CdkVirtualScrollViewport,
      ) => virtualScrollable || viewport,
      deps: [[new Optional(), new Inject(VIRTUAL_SCROLLABLE)], CdkVirtualScrollViewport],
    },
  ],
})
export class CdkVirtualScrollViewport extends CdkVirtualScrollable implements OnInit, OnDestroy {
  private _platform = inject(Platform);

  /**
   * Emits when the viewport is detached from a CdkVirtualForOf.
   *
   * 当视口从 CdkVirtualForOf 上拆除时，就会触发。
   *
   */
  private readonly _detachedSubject = new Subject<void>();

  /**
   * Emits when the rendered range changes.
   *
   * 当渲染范围发生变化时触发。
   *
   */
  private readonly _renderedRangeSubject = new Subject<ListRange>();

  /**
   * The direction the viewport scrolls.
   *
   * 视口滚动的方向。
   *
   */
  @Input()
  get orientation() {
    return this._orientation;
  }

  set orientation(orientation: 'horizontal' | 'vertical') {
    if (this._orientation !== orientation) {
      this._orientation = orientation;
      this._calculateSpacerSize();
    }
  }
  private _orientation: 'horizontal' | 'vertical' = 'vertical';

  /**
   * Whether rendered items should persist in the DOM after scrolling out of view. By default, items
   * will be removed.
   *
   * 滚动出视图后，渲染的条目是否应该保留在 DOM 中。默认情况下，条目将被删除。
   *
   */
  @Input()
  get appendOnly(): boolean {
    return this._appendOnly;
  }
  set appendOnly(value: BooleanInput) {
    this._appendOnly = coerceBooleanProperty(value);
  }
  private _appendOnly = false;

  // Note: we don't use the typical EventEmitter here because we need to subscribe to the scroll
  // strategy lazily (i.e. only if the user is actually listening to the events). We do this because
  // depending on how the strategy calculates the scrolled index, it may come at a cost to
  // performance.
  /**
   * Emits when the index of the first element visible in the viewport changes.
   *
   * 当视口中可见的第一个元素的索引发生变化时触发。
   *
   */
  @Output()
  readonly scrolledIndexChange: Observable<number> = new Observable((observer: Observer<number>) =>
    this._scrollStrategy.scrolledIndexChange.subscribe(index =>
      Promise.resolve().then(() => this.ngZone.run(() => observer.next(index))),
    ),
  );

  /**
   * The element that wraps the rendered content.
   *
   * 包装渲染内容的元素。
   *
   */
  @ViewChild('contentWrapper', {static: true}) _contentWrapper: ElementRef<HTMLElement>;

  /**
   * A stream that emits whenever the rendered range changes.
   *
   * 每当渲染范围发生变化时都会发出通知的流。
   *
   */
  readonly renderedRangeStream: Observable<ListRange> = this._renderedRangeSubject;

  /**
   * The total size of all content (in pixels), including content that is not currently rendered.
   *
   * 所有内容的总大小（以像素为单位），包括当前未渲染的内容。
   *
   */
  private _totalContentSize = 0;

  /**
   * A string representing the `style.width` property value to be used for the spacer element.
   *
   * 一个字符串，表示要用于空白元素的 `style.width` 属性值。
   *
   */
  _totalContentWidth = '';

  /**
   * A string representing the `style.height` property value to be used for the spacer element.
   *
   * 一个字符串，表示要用于空白元素 `style.height`
   *
   */
  _totalContentHeight = '';

  /**
   * The CSS transform applied to the rendered subset of items so that they appear within the bounds
   * of the visible viewport.
   *
   * 要应用于渲染的条目子集的 CSS 变换，以便它们出现在可见视口的边界内。
   *
   */
  private _renderedContentTransform: string;

  /**
   * The currently rendered range of indices.
   *
   * 当前渲染的索引范围。
   *
   */
  private _renderedRange: ListRange = {start: 0, end: 0};

  /**
   * The length of the data bound to this viewport (in number of items).
   *
   * 绑定到此视口的数据长度（以条目数表示）。
   *
   */
  private _dataLength = 0;

  /**
   * The size of the viewport (in pixels).
   *
   * 视口的大小（以像素为单位）。
   *
   */
  private _viewportSize = 0;

  /**
   * the currently attached CdkVirtualScrollRepeater.
   *
   * 当前已附着的 CdkVirtualScrollRepeater。
   *
   */
  private _forOf: CdkVirtualScrollRepeater<any> | null;

  /**
   * The last rendered content offset that was set.
   *
   * 已设置的最后一次渲染内容的偏移量。
   *
   */
  private _renderedContentOffset = 0;

  /**
   * Whether the last rendered content offset was to the end of the content (and therefore needs to
   * be rewritten as an offset to the start of the content).
   *
   * 最后渲染的内容偏移量是否为内容的结尾（因此需要重写为内容开头的偏移量）。
   *
   */
  private _renderedContentOffsetNeedsRewrite = false;

  /**
   * Whether there is a pending change detection cycle.
   *
   * 是否存在挂起的变更检测周期。
   *
   */
  private _isChangeDetectionPending = false;

  /**
   * A list of functions to run after the next change detection cycle.
   *
   * 在下次变更检测周期后要运行的函数列表。
   *
   */
  private _runAfterChangeDetection: Function[] = [];

  /**
   * Subscription to changes in the viewport size.
   *
   * 订阅视口大小的变更。
   *
   */
  private _viewportChanges = Subscription.EMPTY;

  constructor(
    public override elementRef: ElementRef<HTMLElement>,
    private _changeDetectorRef: ChangeDetectorRef,
    ngZone: NgZone,
    @Optional()
    @Inject(VIRTUAL_SCROLL_STRATEGY)
    private _scrollStrategy: VirtualScrollStrategy,
    @Optional() dir: Directionality,
    scrollDispatcher: ScrollDispatcher,
    viewportRuler: ViewportRuler,
    @Optional() @Inject(VIRTUAL_SCROLLABLE) public scrollable: CdkVirtualScrollable,
  ) {
    super(elementRef, scrollDispatcher, ngZone, dir);

    if (!_scrollStrategy && (typeof ngDevMode === 'undefined' || ngDevMode)) {
      throw Error('Error: cdk-virtual-scroll-viewport requires the "itemSize" property to be set.');
    }

    this._viewportChanges = viewportRuler.change().subscribe(() => {
      this.checkViewportSize();
    });

    if (!this.scrollable) {
      // No scrollable is provided, so the virtual-scroll-viewport needs to become a scrollable
      this.elementRef.nativeElement.classList.add('cdk-virtual-scrollable');
      this.scrollable = this;
    }
  }

  override ngOnInit() {
    // Scrolling depends on the element dimensions which we can't get during SSR.
    if (!this._platform.isBrowser) {
      return;
    }

    if (this.scrollable === this) {
      super.ngOnInit();
    }
    // It's still too early to measure the viewport at this point. Deferring with a promise allows
    // the Viewport to be rendered with the correct size before we measure. We run this outside the
    // zone to avoid causing more change detection cycles. We handle the change detection loop
    // ourselves instead.
    this.ngZone.runOutsideAngular(() =>
      Promise.resolve().then(() => {
        this._measureViewportSize();
        this._scrollStrategy.attach(this);

        this.scrollable
          .elementScrolled()
          .pipe(
            // Start off with a fake scroll event so we properly detect our initial position.
            startWith(null),
            // Collect multiple events into one until the next animation frame. This way if
            // there are multiple scroll events in the same frame we only need to recheck
            // our layout once.
            auditTime(0, SCROLL_SCHEDULER),
          )
          .subscribe(() => this._scrollStrategy.onContentScrolled());

        this._markChangeDetectionNeeded();
      }),
    );
  }

  override ngOnDestroy() {
    this.detach();
    this._scrollStrategy.detach();

    // Complete all subjects
    this._renderedRangeSubject.complete();
    this._detachedSubject.complete();
    this._viewportChanges.unsubscribe();

    super.ngOnDestroy();
  }

  /**
   * Attaches a `CdkVirtualScrollRepeater` to this viewport.
   *
   * 把 `CdkVirtualScrollRepeater` 附着到这个视口。
   *
   */
  attach(forOf: CdkVirtualScrollRepeater<any>) {
    if (this._forOf && (typeof ngDevMode === 'undefined' || ngDevMode)) {
      throw Error('CdkVirtualScrollViewport is already attached.');
    }

    // Subscribe to the data stream of the CdkVirtualForOf to keep track of when the data length
    // changes. Run outside the zone to avoid triggering change detection, since we're managing the
    // change detection loop ourselves.
    this.ngZone.runOutsideAngular(() => {
      this._forOf = forOf;
      this._forOf.dataStream.pipe(takeUntil(this._detachedSubject)).subscribe(data => {
        const newLength = data.length;
        if (newLength !== this._dataLength) {
          this._dataLength = newLength;
          this._scrollStrategy.onDataLengthChanged();
        }
        this._doChangeDetection();
      });
    });
  }

  /**
   * Detaches the current `CdkVirtualForOf`.
   *
   * 拆除当前的 `CdkVirtualForOf`。
   *
   */
  detach() {
    this._forOf = null;
    this._detachedSubject.next();
  }

  /**
   * Gets the length of the data bound to this viewport \(in number of items\).
   *
   * 获取绑定到该视口的数据的长度（以条目数表示）。
   *
   */
  getDataLength(): number {
    return this._dataLength;
  }

  /**
   * Gets the size of the viewport \(in pixels\).
   *
   * 获取视口的大小（以像素为单位）。
   *
   */
  getViewportSize(): number {
    return this._viewportSize;
  }

  // TODO(mmalerba): This is technically out of sync with what's really rendered until a render
  // cycle happens. I'm being careful to only call it after the render cycle is complete and before
  // setting it to something else, but its error prone and should probably be split into
  // `pendingRange` and `renderedRange`, the latter reflecting whats actually in the DOM.

  /**
   * Get the current rendered range of items.
   *
   * 获取当前渲染的条目范围。
   *
   */
  getRenderedRange(): ListRange {
    return this._renderedRange;
  }

  measureBoundingClientRectWithScrollOffset(from: 'left' | 'top' | 'right' | 'bottom'): number {
    return this.getElementRef().nativeElement.getBoundingClientRect()[from];
  }

  /**
   * Sets the total size of all content \(in pixels\), including content that is not currently
   * rendered.
   *
   * 设置所有内容的总大小（以像素为单位），包括当前未渲染的内容。
   *
   */
  setTotalContentSize(size: number) {
    if (this._totalContentSize !== size) {
      this._totalContentSize = size;
      this._calculateSpacerSize();
      this._markChangeDetectionNeeded();
    }
  }

  /**
   * Sets the currently rendered range of indices.
   *
   * 设置当前渲染的索引范围。
   *
   */
  setRenderedRange(range: ListRange) {
    if (!rangesEqual(this._renderedRange, range)) {
      if (this.appendOnly) {
        range = {start: 0, end: Math.max(this._renderedRange.end, range.end)};
      }
      this._renderedRangeSubject.next((this._renderedRange = range));
      this._markChangeDetectionNeeded(() => this._scrollStrategy.onContentRendered());
    }
  }

  /**
   * Gets the offset from the start of the viewport to the start of the rendered data \(in pixels\).
   *
   * 获取从视口起点到渲染数据起始位置的偏移量（以像素为单位）。
   *
   */
  getOffsetToRenderedContentStart(): number | null {
    return this._renderedContentOffsetNeedsRewrite ? null : this._renderedContentOffset;
  }

  /**
   * Sets the offset from the start of the viewport to either the start or end of the rendered data
   * \(in pixels\).
   *
   * 设置从视口起点到渲染数据起点或终点的偏移量（以像素为单位）。
   *
   */
  setRenderedContentOffset(offset: number, to: 'to-start' | 'to-end' = 'to-start') {
    // In appendOnly, we always start from the top
    offset = this.appendOnly && to === 'to-start' ? 0 : offset;

    // For a horizontal viewport in a right-to-left language we need to translate along the x-axis
    // in the negative direction.
    const isRtl = this.dir && this.dir.value == 'rtl';
    const isHorizontal = this.orientation == 'horizontal';
    const axis = isHorizontal ? 'X' : 'Y';
    const axisDirection = isHorizontal && isRtl ? -1 : 1;
    let transform = `translate${axis}(${Number(axisDirection * offset)}px)`;
    this._renderedContentOffset = offset;
    if (to === 'to-end') {
      transform += ` translate${axis}(-100%)`;
      // The viewport should rewrite this as a `to-start` offset on the next render cycle. Otherwise
      // elements will appear to expand in the wrong direction (e.g. `mat-expansion-panel` would
      // expand upward).
      this._renderedContentOffsetNeedsRewrite = true;
    }
    if (this._renderedContentTransform != transform) {
      // We know this value is safe because we parse `offset` with `Number()` before passing it
      // into the string.
      this._renderedContentTransform = transform;
      this._markChangeDetectionNeeded(() => {
        if (this._renderedContentOffsetNeedsRewrite) {
          this._renderedContentOffset -= this.measureRenderedContentSize();
          this._renderedContentOffsetNeedsRewrite = false;
          this.setRenderedContentOffset(this._renderedContentOffset);
        } else {
          this._scrollStrategy.onRenderedOffsetChanged();
        }
      });
    }
  }

  /**
   * Scrolls to the given offset from the start of the viewport. Please note that this is not always
   * the same as setting `scrollTop` or `scrollLeft`. In a horizontal viewport with right-to-left
   * direction, this would be the equivalent of setting a fictional `scrollRight` property.
   *
   * 从视口开始处滚动到指定的偏移量。请注意，这并不会总是与设置 `scrollTop` 或 `scrollLeft` 一致。在水平视口中，视图是从右向左的方向，这相当于设置了一个虚构的 `scrollRight` 属性。
   *
   * @param offset The offset to scroll to.
   *
   * 要滚动到的偏移量。
   *
   * @param behavior The ScrollBehavior to use when scrolling. Default is behavior is `auto`.
   *
   * 滚动时要使用的 ScrollBehavior。行为默认是 `auto`。
   *
   */
  scrollToOffset(offset: number, behavior: ScrollBehavior = 'auto') {
    const options: ExtendedScrollToOptions = {behavior};
    if (this.orientation === 'horizontal') {
      options.start = offset;
    } else {
      options.top = offset;
    }
    this.scrollable.scrollTo(options);
  }

  /**
   * Scrolls to the offset for the given index.
   *
   * 滚动到指定索引处的偏移量。
   *
   * @param index The index of the element to scroll to.
   *
   * 要滚动的元素的索引。
   *
   * @param behavior The ScrollBehavior to use when scrolling. Default is behavior is `auto`.
   *
   * 滚动时要使用的 ScrollBehavior。行为默认是 `auto`。
   *
   */
  scrollToIndex(index: number, behavior: ScrollBehavior = 'auto') {
    this._scrollStrategy.scrollToIndex(index, behavior);
  }

  /**
   * Gets the current scroll offset from the start of the scrollable \(in pixels\).
   *
   * 从可滚动区的开头得到当前的滚动偏移量（以像素为单位）。
   *
   * @param from The edge to measure the offset from. Defaults to 'top' in vertical mode and 'start'
   *     in horizontal mode.
   *
   * 测量到边缘的偏移。在垂直模式下默认为 “top”，在水平模式下默认为 “start”。
   */
  override measureScrollOffset(
    from?: 'top' | 'left' | 'right' | 'bottom' | 'start' | 'end',
  ): number {
    // This is to break the call cycle
    let measureScrollOffset: InstanceType<typeof CdkVirtualScrollable>['measureScrollOffset'];
    if (this.scrollable == this) {
      measureScrollOffset = (_from: NonNullable<typeof from>) => super.measureScrollOffset(_from);
    } else {
      measureScrollOffset = (_from: NonNullable<typeof from>) =>
        this.scrollable.measureScrollOffset(_from);
    }

    return Math.max(
      0,
      measureScrollOffset(from ?? (this.orientation === 'horizontal' ? 'start' : 'top')) -
        this.measureViewportOffset(),
    );
  }

  /**
   * Measures the offset of the viewport from the scrolling container
   *
   * 测量视口相对于滚动容器的偏移量
   *
   * @param from The edge to measure from.
   *
   * 要测量的边缘。
   *
   */
  measureViewportOffset(from?: 'top' | 'left' | 'right' | 'bottom' | 'start' | 'end') {
    let fromRect: 'left' | 'top' | 'right' | 'bottom';
    const LEFT = 'left';
    const RIGHT = 'right';
    const isRtl = this.dir?.value == 'rtl';
    if (from == 'start') {
      fromRect = isRtl ? RIGHT : LEFT;
    } else if (from == 'end') {
      fromRect = isRtl ? LEFT : RIGHT;
    } else if (from) {
      fromRect = from;
    } else {
      fromRect = this.orientation === 'horizontal' ? 'left' : 'top';
    }

    const scrollerClientRect = this.scrollable.measureBoundingClientRectWithScrollOffset(fromRect);
    const viewportClientRect = this.elementRef.nativeElement.getBoundingClientRect()[fromRect];

    return viewportClientRect - scrollerClientRect;
  }

  /**
   * Measure the combined size of all of the rendered items.
   *
   * 测量所有渲染条目的组合大小。
   *
   */
  measureRenderedContentSize(): number {
    const contentEl = this._contentWrapper.nativeElement;
    return this.orientation === 'horizontal' ? contentEl.offsetWidth : contentEl.offsetHeight;
  }

  /**
   * Measure the total combined size of the given range. Throws if the range includes items that are
   * not rendered.
   *
   * 测量指定范围的总组合大小。如果该范围包含未渲染的条目，则抛出此异常。
   *
   */
  measureRangeSize(range: ListRange): number {
    if (!this._forOf) {
      return 0;
    }
    return this._forOf.measureRangeSize(range, this.orientation);
  }

  /**
   * Update the viewport dimensions and re-render.
   *
   * 更新视口规格并重新渲染。
   *
   */
  checkViewportSize() {
    // TODO: Cleanup later when add logic for handling content resize
    this._measureViewportSize();
    this._scrollStrategy.onDataLengthChanged();
  }

  /**
   * Measure the viewport size.
   *
   * 测量视口的大小。
   *
   */
  private _measureViewportSize() {
    this._viewportSize = this.scrollable.measureViewportSize(this.orientation);
  }

  /**
   * Queue up change detection to run.
   *
   * 将队列中的变更检测队列起来运行。
   *
   */
  private _markChangeDetectionNeeded(runAfter?: Function) {
    if (runAfter) {
      this._runAfterChangeDetection.push(runAfter);
    }

    // Use a Promise to batch together calls to `_doChangeDetection`. This way if we set a bunch of
    // properties sequentially we only have to run `_doChangeDetection` once at the end.
    if (!this._isChangeDetectionPending) {
      this._isChangeDetectionPending = true;
      this.ngZone.runOutsideAngular(() =>
        Promise.resolve().then(() => {
          this._doChangeDetection();
        }),
      );
    }
  }

  /**
   * Run change detection.
   *
   * 运行变更检测。
   *
   */
  private _doChangeDetection() {
    this._isChangeDetectionPending = false;

    // Apply the content transform. The transform can't be set via an Angular binding because
    // bypassSecurityTrustStyle is banned in Google. However the value is safe, it's composed of
    // string literals, a variable that can only be 'X' or 'Y', and user input that is run through
    // the `Number` function first to coerce it to a numeric value.
    this._contentWrapper.nativeElement.style.transform = this._renderedContentTransform;
    // Apply changes to Angular bindings. Note: We must call `markForCheck` to run change detection
    // from the root, since the repeated items are content projected in. Calling `detectChanges`
    // instead does not properly check the projected content.
    this.ngZone.run(() => this._changeDetectorRef.markForCheck());

    const runAfterChangeDetection = this._runAfterChangeDetection;
    this._runAfterChangeDetection = [];
    for (const fn of runAfterChangeDetection) {
      fn();
    }
  }

  /**
   * Calculates the `style.width` and `style.height` for the spacer element.
   *
   * 为空白元素计算 `style.width` 和 `style.height`。
   *
   */
  private _calculateSpacerSize() {
    this._totalContentHeight =
      this.orientation === 'horizontal' ? '' : `${this._totalContentSize}px`;
    this._totalContentWidth =
      this.orientation === 'horizontal' ? `${this._totalContentSize}px` : '';
  }
}
