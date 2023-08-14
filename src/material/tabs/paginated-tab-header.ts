/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  ChangeDetectorRef,
  ElementRef,
  NgZone,
  Optional,
  QueryList,
  EventEmitter,
  AfterContentChecked,
  AfterContentInit,
  AfterViewInit,
  OnDestroy,
  Directive,
  Inject,
  Input,
} from '@angular/core';
import {Direction, Directionality} from '@angular/cdk/bidi';
import {
  BooleanInput,
  coerceBooleanProperty,
  coerceNumberProperty,
  NumberInput,
} from '@angular/cdk/coercion';
import {ViewportRuler} from '@angular/cdk/scrolling';
import {FocusKeyManager, FocusableOption} from '@angular/cdk/a11y';
import {ENTER, SPACE, hasModifierKey} from '@angular/cdk/keycodes';
import {
  merge,
  of as observableOf,
  Subject,
  EMPTY,
  Observer,
  Observable,
  timer,
  fromEvent,
} from 'rxjs';
import {take, switchMap, startWith, skip, takeUntil, filter} from 'rxjs/operators';
import {Platform, normalizePassiveListenerOptions} from '@angular/cdk/platform';
import {ANIMATION_MODULE_TYPE} from '@angular/platform-browser/animations';

/**
 * Config used to bind passive event listeners
 *
 * 用于绑定被动事件监听器的配置
 *
 */
const passiveEventListenerOptions = normalizePassiveListenerOptions({
  passive: true,
}) as EventListenerOptions;

/**
 * The directions that scrolling can go in when the header's tabs exceed the header width. 'After'
 * will scroll the header towards the end of the tabs list and 'before' will scroll towards the
 * beginning of the list.
 *
 * 当标头上的选项卡超出标头宽度时，可以滚动的方向。'after' 会把标头滚动到选项卡列表的末尾，'before' 会滚动到列表的开头。
 *
 */
export type ScrollDirection = 'after' | 'before';

/**
 * Amount of milliseconds to wait before starting to scroll the header automatically.
 * Set a little conservatively in order to handle fake events dispatched on touch devices.
 *
 * 开始自动滚动标头之前需要等待的毫秒数。设置得保守一点，以便处理触摸设备上发送的伪事件。
 *
 */
const HEADER_SCROLL_DELAY = 650;

/**
 * Interval in milliseconds at which to scroll the header
 * while the user is holding their pointer.
 *
 * 用户按住指针设备时开始滚动标头的时间间隔（以毫秒为单位）。
 *
 */
const HEADER_SCROLL_INTERVAL = 100;

/**
 * Item inside a paginated tab header.
 *
 * 带分页的选项卡标头中的条目。
 *
 */
export type MatPaginatedTabHeaderItem = FocusableOption & {elementRef: ElementRef};

/**
 * Base class for a tab header that supported pagination.
 *
 * 支持分页的选项卡标头的基类。
 *
 * @docs-private
 */
@Directive()
export abstract class MatPaginatedTabHeader
  implements AfterContentChecked, AfterContentInit, AfterViewInit, OnDestroy
{
  abstract _items: QueryList<MatPaginatedTabHeaderItem>;
  abstract _inkBar: {hide: () => void; alignToElement: (element: HTMLElement) => void};
  abstract _tabListContainer: ElementRef<HTMLElement>;
  abstract _tabList: ElementRef<HTMLElement>;
  abstract _tabListInner: ElementRef<HTMLElement>;
  abstract _nextPaginator: ElementRef<HTMLElement>;
  abstract _previousPaginator: ElementRef<HTMLElement>;

  /**
   * The distance in pixels that the tab labels should be translated to the left.
   *
   * 选项卡标签应该向左平移的距离（以像素为单位）。
   *
   */
  private _scrollDistance = 0;

  /**
   * Whether the header should scroll to the selected index after the view has been checked.
   *
   * 标头是否应该在检查完视图后滚动到选定的索引。
   *
   */
  private _selectedIndexChanged = false;

  /**
   * Emits when the component is destroyed.
   *
   * 当组件被销毁时会触发。
   *
   */
  protected readonly _destroyed = new Subject<void>();

  /**
   * Whether the controls for pagination should be displayed
   *
   * 是否应该显示分页控件
   *
   */
  _showPaginationControls = false;

  /**
   * Whether the tab list can be scrolled more towards the end of the tab label list.
   *
   * 选项卡列表是否可以滚动到选项卡列表的末尾之后。
   *
   */
  _disableScrollAfter = true;

  /**
   * Whether the tab list can be scrolled more towards the beginning of the tab label list.
   *
   * 选项卡列表是否可以滚动到选项卡列表的末尾之前。
   *
   */
  _disableScrollBefore = true;

  /**
   * The number of tab labels that are displayed on the header. When this changes, the header
   * should re-evaluate the scroll position.
   *
   * 标头显示的选项卡数量。当这种情况发生变化时，标头会重新计算滚动位置。
   *
   */
  private _tabLabelCount: number;

  /**
   * Whether the scroll distance has changed and should be applied after the view is checked.
   *
   * 滚动距离是否已更改，是否应在检查完视图后应用这些变更。
   *
   */
  private _scrollDistanceChanged: boolean;

  /**
   * Used to manage focus between the tabs.
   *
   * 用来管理选项卡之间的焦点。
   *
   */
  private _keyManager: FocusKeyManager<MatPaginatedTabHeaderItem>;

  /**
   * Cached text content of the header.
   *
   * 标头的缓存文本内容。
   *
   */
  private _currentTextContent: string;

  /**
   * Stream that will stop the automated scrolling.
   *
   * 用来停止自动滚动的流。
   *
   */
  private _stopScrolling = new Subject<void>();

  /**
   * Whether pagination should be disabled. This can be used to avoid unnecessary
   * layout recalculations if it's known that pagination won't be required.
   *
   * 是否应该禁用分页。如果明确知道不需要分页，这可以用来避免不必要的布局重算。
   *
   */
  @Input()
  get disablePagination(): boolean {
    return this._disablePagination;
  }
  set disablePagination(value: BooleanInput) {
    this._disablePagination = coerceBooleanProperty(value);
  }
  private _disablePagination: boolean = false;

  /**
   * The index of the active tab.
   *
   * 活动选项卡的索引。
   *
   */
  get selectedIndex(): number {
    return this._selectedIndex;
  }
  set selectedIndex(value: NumberInput) {
    value = coerceNumberProperty(value);

    if (this._selectedIndex != value) {
      this._selectedIndexChanged = true;
      this._selectedIndex = value;

      if (this._keyManager) {
        this._keyManager.updateActiveItem(value);
      }
    }
  }
  private _selectedIndex: number = 0;

  /**
   * Event emitted when the option is selected.
   *
   * 选定该选项卡时会发出本事件。
   *
   */
  readonly selectFocusedIndex: EventEmitter<number> = new EventEmitter<number>();

  /**
   * Event emitted when a label is focused.
   *
   * 选项卡获得焦点时发出的事件。
   *
   */
  readonly indexFocused: EventEmitter<number> = new EventEmitter<number>();

  constructor(
    protected _elementRef: ElementRef<HTMLElement>,
    protected _changeDetectorRef: ChangeDetectorRef,
    private _viewportRuler: ViewportRuler,
    @Optional() private _dir: Directionality,
    private _ngZone: NgZone,
    private _platform: Platform,
    @Optional() @Inject(ANIMATION_MODULE_TYPE) public _animationMode?: string,
  ) {
    // Bind the `mouseleave` event on the outside since it doesn't change anything in the view.
    _ngZone.runOutsideAngular(() => {
      fromEvent(_elementRef.nativeElement, 'mouseleave')
        .pipe(takeUntil(this._destroyed))
        .subscribe(() => {
          this._stopInterval();
        });
    });
  }

  /**
   * Called when the user has selected an item via the keyboard.
   *
   * 当用户通过键盘选择了一个条目时调用。
   *
   */
  protected abstract _itemSelected(event: KeyboardEvent): void;

  ngAfterViewInit() {
    // We need to handle these events manually, because we want to bind passive event listeners.
    fromEvent(this._previousPaginator.nativeElement, 'touchstart', passiveEventListenerOptions)
      .pipe(takeUntil(this._destroyed))
      .subscribe(() => {
        this._handlePaginatorPress('before');
      });

    fromEvent(this._nextPaginator.nativeElement, 'touchstart', passiveEventListenerOptions)
      .pipe(takeUntil(this._destroyed))
      .subscribe(() => {
        this._handlePaginatorPress('after');
      });
  }

  ngAfterContentInit() {
    const dirChange = this._dir ? this._dir.change : observableOf('ltr');
    const resize = this._viewportRuler.change(150);
    const realign = () => {
      this.updatePagination();
      this._alignInkBarToSelectedTab();
    };

    this._keyManager = new FocusKeyManager<MatPaginatedTabHeaderItem>(this._items)
      .withHorizontalOrientation(this._getLayoutDirection())
      .withHomeAndEnd()
      .withWrap()
      // Allow focus to land on disabled tabs, as per https://w3c.github.io/aria-practices/#kbd_disabled_controls
      .skipPredicate(() => false);

    this._keyManager.updateActiveItem(this._selectedIndex);

    // Defer the first call in order to allow for slower browsers to lay out the elements.
    // This helps in cases where the user lands directly on a page with paginated tabs.
    // Note that we use `onStable` instead of `requestAnimationFrame`, because the latter
    // can hold up tests that are in a background tab.
    this._ngZone.onStable.pipe(take(1)).subscribe(realign);

    // On dir change or window resize, realign the ink bar and update the orientation of
    // the key manager if the direction has changed.
    merge(dirChange, resize, this._items.changes, this._itemsResized())
      .pipe(takeUntil(this._destroyed))
      .subscribe(() => {
        // We need to defer this to give the browser some time to recalculate
        // the element dimensions. The call has to be wrapped in `NgZone.run`,
        // because the viewport change handler runs outside of Angular.
        this._ngZone.run(() => {
          Promise.resolve().then(() => {
            // Clamp the scroll distance, because it can change with the number of tabs.
            this._scrollDistance = Math.max(
              0,
              Math.min(this._getMaxScrollDistance(), this._scrollDistance),
            );
            realign();
          });
        });
        this._keyManager.withHorizontalOrientation(this._getLayoutDirection());
      });

    // If there is a change in the focus key manager we need to emit the `indexFocused`
    // event in order to provide a public event that notifies about focus changes. Also we realign
    // the tabs container by scrolling the new focused tab into the visible section.
    this._keyManager.change.subscribe(newFocusIndex => {
      this.indexFocused.emit(newFocusIndex);
      this._setTabFocus(newFocusIndex);
    });
  }

  /**
   * Sends any changes that could affect the layout of the items.
   *
   * 发送可能影响项目布局的任何更改。
   *
   */
  private _itemsResized(): Observable<ResizeObserverEntry[]> {
    if (typeof ResizeObserver !== 'function') {
      return EMPTY;
    }

    return this._items.changes.pipe(
      startWith(this._items),
      switchMap(
        (tabItems: QueryList<MatPaginatedTabHeaderItem>) =>
          new Observable((observer: Observer<ResizeObserverEntry[]>) =>
            this._ngZone.runOutsideAngular(() => {
              const resizeObserver = new ResizeObserver(entries => observer.next(entries));
              tabItems.forEach(item => resizeObserver.observe(item.elementRef.nativeElement));
              return () => {
                resizeObserver.disconnect();
              };
            }),
          ),
      ),
      // Skip the first emit since the resize observer emits when an item
      // is observed for new items when the tab is already inserted
      skip(1),
      // Skip emissions where all the elements are invisible since we don't want
      // the header to try and re-render with invalid measurements. See #25574.
      filter(entries => entries.some(e => e.contentRect.width > 0 && e.contentRect.height > 0)),
    );
  }

  ngAfterContentChecked(): void {
    // If the number of tab labels have changed, check if scrolling should be enabled
    if (this._tabLabelCount != this._items.length) {
      this.updatePagination();
      this._tabLabelCount = this._items.length;
      this._changeDetectorRef.markForCheck();
    }

    // If the selected index has changed, scroll to the label and check if the scrolling controls
    // should be disabled.
    if (this._selectedIndexChanged) {
      this._scrollToLabel(this._selectedIndex);
      this._checkScrollingControls();
      this._alignInkBarToSelectedTab();
      this._selectedIndexChanged = false;
      this._changeDetectorRef.markForCheck();
    }

    // If the scroll distance has been changed (tab selected, focused, scroll controls activated),
    // then translate the header to reflect this.
    if (this._scrollDistanceChanged) {
      this._updateTabScrollPosition();
      this._scrollDistanceChanged = false;
      this._changeDetectorRef.markForCheck();
    }
  }

  ngOnDestroy() {
    this._keyManager?.destroy();
    this._destroyed.next();
    this._destroyed.complete();
    this._stopScrolling.complete();
  }

  /**
   * Handles keyboard events on the header.
   *
   * 处理标头中的键盘事件。
   *
   */
  _handleKeydown(event: KeyboardEvent) {
    // We don't handle any key bindings with a modifier key.
    if (hasModifierKey(event)) {
      return;
    }

    switch (event.keyCode) {
      case ENTER:
      case SPACE:
        if (this.focusIndex !== this.selectedIndex) {
          const item = this._items.get(this.focusIndex);

          if (item && !item.disabled) {
            this.selectFocusedIndex.emit(this.focusIndex);
            this._itemSelected(event);
          }
        }
        break;
      default:
        this._keyManager.onKeydown(event);
    }
  }

  /**
   * Callback for when the MutationObserver detects that the content has changed.
   *
   * 在 MutationObserver 检测到内容发生了变化时回调。
   *
   */
  _onContentChanges() {
    const textContent = this._elementRef.nativeElement.textContent;

    // We need to diff the text content of the header, because the MutationObserver callback
    // will fire even if the text content didn't change which is inefficient and is prone
    // to infinite loops if a poorly constructed expression is passed in (see #14249).
    if (textContent !== this._currentTextContent) {
      this._currentTextContent = textContent || '';

      // The content observer runs outside the `NgZone` by default, which
      // means that we need to bring the callback back in ourselves.
      this._ngZone.run(() => {
        this.updatePagination();
        this._alignInkBarToSelectedTab();
        this._changeDetectorRef.markForCheck();
      });
    }
  }

  /**
   * Updates the view whether pagination should be enabled or not.
   *
   * 更新视图是否应该启用分页。
   *
   * WARNING: Calling this method can be very costly in terms of performance. It should be called
   * as infrequently as possible from outside of the Tabs component as it causes a reflow of the
   * page.
   *
   * 警告：就性能而言，调用此方法的成本非常高。它应尽可能从选项卡列表组件的外部调用，因为它会导致页面重排。
   *
   */
  updatePagination() {
    this._checkPaginationEnabled();
    this._checkScrollingControls();
    this._updateTabScrollPosition();
  }

  /**
   * Tracks which element has focus; used for keyboard navigation
   *
   * 跟踪哪个元素有焦点;用于键盘导航
   *
   */
  get focusIndex(): number {
    return this._keyManager ? this._keyManager.activeItemIndex! : 0;
  }

  /**
   * When the focus index is set, we must manually send focus to the correct label
   *
   * 当焦点的索引设置完毕后，我们必须手动将焦点发送到正确的选项卡上
   *
   */
  set focusIndex(value: number) {
    if (!this._isValidIndex(value) || this.focusIndex === value || !this._keyManager) {
      return;
    }

    this._keyManager.setActiveItem(value);
  }

  /**
   * Determines if an index is valid.  If the tabs are not ready yet, we assume that the user is
   * providing a valid index and return true.
   *
   * 确定索引是否有效。如果这些选项卡尚未准备好，我们假设该用户正在提供一个有效的索引，并返回 true。
   *
   */
  _isValidIndex(index: number): boolean {
    return this._items ? !!this._items.toArray()[index] : true;
  }

  /**
   * Sets focus on the HTML element for the label wrapper and scrolls it into the view if
   * scrolling is enabled.
   *
   * 让选项卡包装器的 HTML 元素获得焦点，如果启用了滚动功能，就会把它滚动到视图中。
   *
   */
  _setTabFocus(tabIndex: number) {
    if (this._showPaginationControls) {
      this._scrollToLabel(tabIndex);
    }

    if (this._items && this._items.length) {
      this._items.toArray()[tabIndex].focus();

      // Do not let the browser manage scrolling to focus the element, this will be handled
      // by using translation. In LTR, the scroll left should be 0. In RTL, the scroll width
      // should be the full width minus the offset width.
      const containerEl = this._tabListContainer.nativeElement;
      const dir = this._getLayoutDirection();

      if (dir == 'ltr') {
        containerEl.scrollLeft = 0;
      } else {
        containerEl.scrollLeft = containerEl.scrollWidth - containerEl.offsetWidth;
      }
    }
  }

  /**
   * The layout direction of the containing app.
   *
   * 容器应用的布局方向。
   *
   */
  _getLayoutDirection(): Direction {
    return this._dir && this._dir.value === 'rtl' ? 'rtl' : 'ltr';
  }

  /**
   * Performs the CSS transformation on the tab list that will cause the list to scroll.
   *
   * 在选项卡列表中执行 CSS 转换，以便列表滚动。
   *
   */
  _updateTabScrollPosition() {
    if (this.disablePagination) {
      return;
    }

    const scrollDistance = this.scrollDistance;
    const translateX = this._getLayoutDirection() === 'ltr' ? -scrollDistance : scrollDistance;

    // Don't use `translate3d` here because we don't want to create a new layer. A new layer
    // seems to cause flickering and overflow in Internet Explorer. For example, the ink bar
    // and ripples will exceed the boundaries of the visible tab bar.
    // See: https://github.com/angular/components/issues/10276
    // We round the `transform` here, because transforms with sub-pixel precision cause some
    // browsers to blur the content of the element.
    this._tabList.nativeElement.style.transform = `translateX(${Math.round(translateX)}px)`;

    // Setting the `transform` on IE will change the scroll offset of the parent, causing the
    // position to be thrown off in some cases. We have to reset it ourselves to ensure that
    // it doesn't get thrown off. Note that we scope it only to IE and Edge, because messing
    // with the scroll position throws off Chrome 71+ in RTL mode (see #14689).
    if (this._platform.TRIDENT || this._platform.EDGE) {
      this._tabListContainer.nativeElement.scrollLeft = 0;
    }
  }

  /**
   * Sets the distance in pixels that the tab header should be transformed in the X-axis.
   *
   * 设置选项卡标头在 X 轴上的变换距离（以像素为单位）。
   *
   */
  get scrollDistance(): number {
    return this._scrollDistance;
  }
  set scrollDistance(value: number) {
    this._scrollTo(value);
  }

  /**
   * Moves the tab list in the 'before' or 'after' direction (towards the beginning of the list or
   * the end of the list, respectively). The distance to scroll is computed to be a third of the
   * length of the tab list view window.
   *
   * 在'前'或后'方向移动选项卡列表（分别朝向列表的开头或列表的末尾）。滚动的距离是选项卡列表视图窗口长度的三分之一。
   *
   * This is an expensive call that forces a layout reflow to compute box and scroll metrics and
   * should be called sparingly.
   *
   * 这是一个代价高昂的调用，它会强制进行布局重排来计算其矩形和滚动指示器，慎用。
   *
   */
  _scrollHeader(direction: ScrollDirection) {
    const viewLength = this._tabListContainer.nativeElement.offsetWidth;

    // Move the scroll distance one-third the length of the tab list's viewport.
    const scrollAmount = ((direction == 'before' ? -1 : 1) * viewLength) / 3;

    return this._scrollTo(this._scrollDistance + scrollAmount);
  }

  /**
   * Handles click events on the pagination arrows.
   *
   * 处理分页箭头上的 click 事件。
   *
   */
  _handlePaginatorClick(direction: ScrollDirection) {
    this._stopInterval();
    this._scrollHeader(direction);
  }

  /**
   * Moves the tab list such that the desired tab label (marked by index) is moved into view.
   *
   * 移动选项卡列表，以便把所需的选项卡（用 index 标出）移动到视图中。
   *
   * This is an expensive call that forces a layout reflow to compute box and scroll metrics and
   * should be called sparingly.
   *
   * 这是一个代价高昂的调用，它会强制进行布局重排来计算矩形和滚动指示器，慎用。
   *
   */
  _scrollToLabel(labelIndex: number) {
    if (this.disablePagination) {
      return;
    }

    const selectedLabel = this._items ? this._items.toArray()[labelIndex] : null;

    if (!selectedLabel) {
      return;
    }

    // The view length is the visible width of the tab labels.
    const viewLength = this._tabListContainer.nativeElement.offsetWidth;
    const {offsetLeft, offsetWidth} = selectedLabel.elementRef.nativeElement;

    let labelBeforePos: number, labelAfterPos: number;
    if (this._getLayoutDirection() == 'ltr') {
      labelBeforePos = offsetLeft;
      labelAfterPos = labelBeforePos + offsetWidth;
    } else {
      labelAfterPos = this._tabListInner.nativeElement.offsetWidth - offsetLeft;
      labelBeforePos = labelAfterPos - offsetWidth;
    }

    const beforeVisiblePos = this.scrollDistance;
    const afterVisiblePos = this.scrollDistance + viewLength;

    if (labelBeforePos < beforeVisiblePos) {
      // Scroll header to move label to the before direction
      this.scrollDistance -= beforeVisiblePos - labelBeforePos;
    } else if (labelAfterPos > afterVisiblePos) {
      // Scroll header to move label to the after direction
      this.scrollDistance += Math.min(
        labelAfterPos - afterVisiblePos,
        labelBeforePos - beforeVisiblePos,
      );
    }
  }

  /**
   * Evaluate whether the pagination controls should be displayed. If the scroll width of the
   * tab list is wider than the size of the header container, then the pagination controls should
   * be shown.
   *
   * 计算是否应该显示分页控件。如果选项卡列表的滚动宽度比标头容器的大小要宽，那么就应该显示分页控件了。
   *
   * This is an expensive call that forces a layout reflow to compute box and scroll metrics and
   * should be called sparingly.
   *
   * 这是一个代价高昂的调用，它会强制进行布局重排来计算矩形和滚动指示器，慎用。
   *
   */
  _checkPaginationEnabled() {
    if (this.disablePagination) {
      this._showPaginationControls = false;
    } else {
      const isEnabled =
        this._tabListInner.nativeElement.scrollWidth > this._elementRef.nativeElement.offsetWidth;

      if (!isEnabled) {
        this.scrollDistance = 0;
      }

      if (isEnabled !== this._showPaginationControls) {
        this._changeDetectorRef.markForCheck();
      }

      this._showPaginationControls = isEnabled;
    }
  }

  /**
   * Evaluate whether the before and after controls should be enabled or disabled.
   * If the header is at the beginning of the list (scroll distance is equal to 0) then disable the
   * before button. If the header is at the end of the list (scroll distance is equal to the
   * maximum distance we can scroll), then disable the after button.
   *
   * 评估应该启用还是禁用之前和之后的控件。如果标头位于列表的开头（滚动距离等于 0），则禁用“前一个”按钮。如果标头位于列表的末尾（滚动距离等于我们可以滚动的最大距离），则禁用“后一个”按钮。
   *
   * This is an expensive call that forces a layout reflow to compute box and scroll metrics and
   * should be called sparingly.
   *
   * 这是一个代价高昂的调用，它会强制进行布局重排来计算矩形和滚动指示器，慎用。
   *
   */
  _checkScrollingControls() {
    if (this.disablePagination) {
      this._disableScrollAfter = this._disableScrollBefore = true;
    } else {
      // Check if the pagination arrows should be activated.
      this._disableScrollBefore = this.scrollDistance == 0;
      this._disableScrollAfter = this.scrollDistance == this._getMaxScrollDistance();
      this._changeDetectorRef.markForCheck();
    }
  }

  /**
   * Determines what is the maximum length in pixels that can be set for the scroll distance. This
   * is equal to the difference in width between the tab list container and tab header container.
   *
   * 确定滚动距离的最大长度（以像素为单位）。这等于选项卡列表容器和选项卡标头容器之间的宽度差异。
   *
   * This is an expensive call that forces a layout reflow to compute box and scroll metrics and
   * should be called sparingly.
   *
   * 这是一个代价高昂的调用，它会强制进行布局重排来计算矩形和滚动指示器，慎用。
   *
   */
  _getMaxScrollDistance(): number {
    const lengthOfTabList = this._tabListInner.nativeElement.scrollWidth;
    const viewLength = this._tabListContainer.nativeElement.offsetWidth;
    return lengthOfTabList - viewLength || 0;
  }

  /**
   * Tells the ink-bar to align itself to the current label wrapper
   *
   * 让墨水条把自己对准当前的选项卡包装器
   *
   */
  _alignInkBarToSelectedTab(): void {
    const selectedItem =
      this._items && this._items.length ? this._items.toArray()[this.selectedIndex] : null;
    const selectedLabelWrapper = selectedItem ? selectedItem.elementRef.nativeElement : null;

    if (selectedLabelWrapper) {
      this._inkBar.alignToElement(selectedLabelWrapper);
    } else {
      this._inkBar.hide();
    }
  }

  /**
   * Stops the currently-running paginator interval.
   *
   * 停止当前正在运行的分页定时器。
   *
   */
  _stopInterval() {
    this._stopScrolling.next();
  }

  /**
   * Handles the user pressing down on one of the paginators.
   * Starts scrolling the header after a certain amount of time.
   *
   * 处理用户按下分页器之一的操作。经过一段时间后才开始滚动标头。
   *
   * @param direction In which direction the paginator should be scrolled.
   *
   * 应该在哪个方向上滚动分页器。
   *
   */
  _handlePaginatorPress(direction: ScrollDirection, mouseEvent?: MouseEvent) {
    // Don't start auto scrolling for right mouse button clicks. Note that we shouldn't have to
    // null check the `button`, but we do it so we don't break tests that use fake events.
    if (mouseEvent && mouseEvent.button != null && mouseEvent.button !== 0) {
      return;
    }

    // Avoid overlapping timers.
    this._stopInterval();

    // Start a timer after the delay and keep firing based on the interval.
    timer(HEADER_SCROLL_DELAY, HEADER_SCROLL_INTERVAL)
      // Keep the timer going until something tells it to stop or the component is destroyed.
      .pipe(takeUntil(merge(this._stopScrolling, this._destroyed)))
      .subscribe(() => {
        const {maxScrollDistance, distance} = this._scrollHeader(direction);

        // Stop the timer if we've reached the start or the end.
        if (distance === 0 || distance >= maxScrollDistance) {
          this._stopInterval();
        }
      });
  }

  /**
   * Scrolls the header to a given position.
   *
   * 将标头滚动到指定的位置。
   *
   * @param position Position to which to scroll.
   *
   * 要滚动的位置
   *
   * @returns Information on the current scroll distance and the maximum.
   *
   * 有关当前滚动距离和最大滚动距离的信息。
   *
   */
  private _scrollTo(position: number) {
    if (this.disablePagination) {
      return {maxScrollDistance: 0, distance: 0};
    }

    const maxScrollDistance = this._getMaxScrollDistance();
    this._scrollDistance = Math.max(0, Math.min(maxScrollDistance, position));

    // Mark that the scroll distance has changed so that after the view is checked, the CSS
    // transformation can move the header.
    this._scrollDistanceChanged = true;
    this._checkScrollingControls();

    return {maxScrollDistance, distance: this._scrollDistance};
  }
}
