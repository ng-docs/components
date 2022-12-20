/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  AfterContentChecked,
  AfterContentInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChildren,
  Directive,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  OnDestroy,
  Optional,
  Output,
  QueryList,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import {ANIMATION_MODULE_TYPE} from '@angular/platform-browser/animations';
import {MAT_TAB_GROUP, MatTab} from './tab';
import {MatTabHeader} from './tab-header';
import {
  BooleanInput,
  coerceBooleanProperty,
  coerceNumberProperty,
  NumberInput,
} from '@angular/cdk/coercion';
import {
  CanColor,
  CanDisableRipple,
  mixinColor,
  mixinDisableRipple,
  ThemePalette,
} from '@angular/material/core';
import {merge, Subscription} from 'rxjs';
import {MAT_TABS_CONFIG, MatTabsConfig} from './tab-config';
import {startWith} from 'rxjs/operators';
import {FocusOrigin} from '@angular/cdk/a11y';

/**
 * Used to generate unique ID's for each tab component
 *
 * 用于为每个选项卡组件生成唯一的 ID
 *
 */
let nextId = 0;

// Boilerplate for applying mixins to MatTabGroup.
/** @docs-private */
const _MatTabGroupMixinBase = mixinColor(
  mixinDisableRipple(
    class {
      constructor(public _elementRef: ElementRef) {}
    },
  ),
  'primary',
);

/** @docs-private */
export interface MatTabGroupBaseHeader {
  _alignInkBarToSelectedTab(): void;
  updatePagination(): void;
  focusIndex: number;
}

/** Possible positions for the tab header. */
export type MatTabHeaderPosition = 'above' | 'below';

/**
 * Base class with all of the `MatTabGroupBase` functionality.
 *
 * 具备所有 `MatTabGroupBase` 功能的基类。
 *
 * @docs-private
 */
@Directive()
export abstract class _MatTabGroupBase
  extends _MatTabGroupMixinBase
  implements AfterContentInit, AfterContentChecked, OnDestroy, CanColor, CanDisableRipple
{
  /**
   * All tabs inside the tab group. This includes tabs that belong to groups that are nested
   * inside the current one. We filter out only the tabs that belong to this group in `_tabs`.
   *
   * 选项卡组中的所有选项卡。这包括属于那些嵌套于当前组的子组中的选项卡。我们会在 `_tabs` 中筛选出只属于本组的选项卡。
   *
   */
  abstract _allTabs: QueryList<MatTab>;
  abstract _tabBodyWrapper: ElementRef;
  abstract _tabHeader: MatTabGroupBaseHeader;

  /**
   * All of the tabs that belong to the group.
   *
   * 所有属于本组的选项卡
   *
   */
  _tabs: QueryList<MatTab> = new QueryList<MatTab>();

  /**
   * The tab index that should be selected after the content has been checked.
   *
   * 勾选内容后应该选定的 `tabindex` 。
   *
   */
  private _indexToSelect: number | null = 0;

  /**
   * Index of the tab that was focused last.
   *
   * 最后聚焦的选项卡的索引。
   *
   */
  private _lastFocusedTabIndex: number | null = null;

  /**
   * Snapshot of the height of the tab body wrapper before another tab is activated.
   *
   * 激活另一个选项卡之前，对此选项卡本体包装器器高度的快照。
   *
   */
  private _tabBodyWrapperHeight: number = 0;

  /**
   * Subscription to tabs being added/removed.
   *
   * 到“添加/删除选项卡”事件的订阅。
   *
   */
  private _tabsSubscription = Subscription.EMPTY;

  /**
   * Subscription to changes in the tab labels.
   *
   * 对选项卡标签变更的订阅。
   *
   */
  private _tabLabelSubscription = Subscription.EMPTY;

  /**
   * Whether the tab group should grow to the size of the active tab.
   *
   * 选项卡组是否应该增长到活动选项卡的大小。
   *
   */
  @Input()
  get dynamicHeight(): boolean {
    return this._dynamicHeight;
  }

  set dynamicHeight(value: BooleanInput) {
    this._dynamicHeight = coerceBooleanProperty(value);
  }

  private _dynamicHeight: boolean = false;

  /**
   * The index of the active tab.
   *
   * 活动选项卡的索引。
   *
   */
  @Input()
  get selectedIndex(): number | null {
    return this._selectedIndex;
  }

  set selectedIndex(value: NumberInput) {
    this._indexToSelect = coerceNumberProperty(value, null);
  }

  private _selectedIndex: number | null = null;

  /**
   * Position of the tab header.
   *
   * 选项卡标头的位置。
   *
   */
  @Input() headerPosition: MatTabHeaderPosition = 'above';

  /**
   * Duration for the tab animation. Will be normalized to milliseconds if no units are set.
   *
   * 选项卡动画的持续时间。如果没有设置单位，它会被标准化为毫秒。
   *
   */
  @Input()
  get animationDuration(): string {
    return this._animationDuration;
  }

  set animationDuration(value: NumberInput) {
    this._animationDuration = /^\d+$/.test(value + '') ? value + 'ms' : (value as string);
  }

  private _animationDuration: string;

  /**
   * `tabindex` to be set on the inner element that wraps the tab content. Can be used for improved
   * accessibility when the tab does not have focusable elements or if it has scrollable content.
   * The `tabindex` will be removed automatically for inactive tabs.
   * Read more at <https://www.w3.org/TR/wai-aria-practices/examples/tabs/tabs-2/tabs.html>
   *
   * 在包装制表符内容的内部元素上设置的 `tabindex` 当标签没有聚焦元素或者它具有可滚动的内容时，可用于改进的无障碍性。对于无效的标签页，`tabindex` 将会被自动移除。到 <https://www.w3.org/TR/wai-aria-practices/examples/tabs/tabs-2/tabs.html> 了解更多信息。
   *
   */
  @Input()
  get contentTabIndex(): number | null {
    return this._contentTabIndex;
  }

  set contentTabIndex(value: NumberInput) {
    this._contentTabIndex = coerceNumberProperty(value, null);
  }

  private _contentTabIndex: number | null;

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
   * By default tabs remove their content from the DOM while it's off-screen.
   * Setting this to `true` will keep it in the DOM which will prevent elements
   * like iframes and videos from reloading next time it comes back into the view.
   *
   * 默认情况下，选项卡在屏幕外时会从 DOM 中删除其内容。将此设置为 `true` 会将其保留在 DOM 中，这将防止 iframe 和视频等元素在下次返回视图时重新加载。
   *
   */
  @Input()
  get preserveContent(): boolean {
    return this._preserveContent;
  }

  set preserveContent(value: BooleanInput) {
    this._preserveContent = coerceBooleanProperty(value);
  }

  private _preserveContent: boolean = false;

  /**
   * Background color of the tab group.
   *
   * 选项卡组的背景颜色。
   *
   */
  @Input()
  get backgroundColor(): ThemePalette {
    return this._backgroundColor;
  }

  set backgroundColor(value: ThemePalette) {
    const classList: DOMTokenList = this._elementRef.nativeElement.classList;

    classList.remove('mat-tabs-with-background', `mat-background-${this.backgroundColor}`);

    if (value) {
      classList.add('mat-tabs-with-background', `mat-background-${value}`);
    }

    this._backgroundColor = value;
  }

  private _backgroundColor: ThemePalette;

  /**
   * Output to enable support for two-way binding on `[(selectedIndex)]`
   *
   * 用来支持 `[(selectedIndex)]` 双向绑定的输出属性
   *
   */
  @Output() readonly selectedIndexChange: EventEmitter<number> = new EventEmitter<number>();

  /**
   * Event emitted when focus has changed within a tab group.
   *
   * 选项卡组中的焦点发生变化时发出的事件。
   *
   */
  @Output() readonly focusChange: EventEmitter<MatTabChangeEvent> =
    new EventEmitter<MatTabChangeEvent>();

  /**
   * Event emitted when the body animation has completed
   *
   * 当本体动画完成后，就会发出此事件
   *
   */
  @Output() readonly animationDone: EventEmitter<void> = new EventEmitter<void>();

  /**
   * Event emitted when the tab selection has changed.
   *
   * 选项卡的选定值发生变化时发出的事件。
   *
   */
  @Output() readonly selectedTabChange: EventEmitter<MatTabChangeEvent> =
    new EventEmitter<MatTabChangeEvent>(true);

  private _groupId: number;

  constructor(
    elementRef: ElementRef,
    protected _changeDetectorRef: ChangeDetectorRef,
    @Inject(MAT_TABS_CONFIG) @Optional() defaultConfig?: MatTabsConfig,
    @Optional() @Inject(ANIMATION_MODULE_TYPE) public _animationMode?: string,
  ) {
    super(elementRef);
    this._groupId = nextId++;
    this.animationDuration =
      defaultConfig && defaultConfig.animationDuration ? defaultConfig.animationDuration : '500ms';
    this.disablePagination =
      defaultConfig && defaultConfig.disablePagination != null
        ? defaultConfig.disablePagination
        : false;
    this.dynamicHeight =
      defaultConfig && defaultConfig.dynamicHeight != null ? defaultConfig.dynamicHeight : false;
    this.contentTabIndex = defaultConfig?.contentTabIndex ?? null;
    this.preserveContent = !!defaultConfig?.preserveContent;
  }

  /**
   * After the content is checked, this component knows what tabs have been defined
   * and what the selected index should be. This is where we can know exactly what position
   * each tab should be in according to the new selected index, and additionally we know how
   * a new selected tab should transition in (from the left or right).
   *
   * 检查内容后，该组件会知道哪些选项卡已定义，以及选定的索引应该是什么。
   * 这里我们可以根据新选定项的索引准确知道每个选项卡应该在哪个位置，另外我们也知道新选定选项卡应如何过渡（从左边或右边）。
   *
   */
  ngAfterContentChecked() {
    // Don't clamp the `indexToSelect` immediately in the setter because it can happen that
    // the amount of tabs changes before the actual change detection runs.
    const indexToSelect = (this._indexToSelect = this._clampTabIndex(this._indexToSelect));

    // If there is a change in selected index, emit a change event. Should not trigger if
    // the selected index has not yet been initialized.
    if (this._selectedIndex != indexToSelect) {
      const isFirstRun = this._selectedIndex == null;

      if (!isFirstRun) {
        this.selectedTabChange.emit(this._createChangeEvent(indexToSelect));
        // Preserve the height so page doesn't scroll up during tab change.
        // Fixes https://stackblitz.com/edit/mat-tabs-scroll-page-top-on-tab-change
        const wrapper = this._tabBodyWrapper.nativeElement;
        wrapper.style.minHeight = wrapper.clientHeight + 'px';
      }

      // Changing these values after change detection has run
      // since the checked content may contain references to them.
      Promise.resolve().then(() => {
        this._tabs.forEach((tab, index) => (tab.isActive = index === indexToSelect));

        if (!isFirstRun) {
          this.selectedIndexChange.emit(indexToSelect);
          // Clear the min-height, this was needed during tab change to avoid
          // unnecessary scrolling.
          this._tabBodyWrapper.nativeElement.style.minHeight = '';
        }
      });
    }

    // Setup the position for each tab and optionally setup an origin on the next selected tab.
    this._tabs.forEach((tab: MatTab, index: number) => {
      tab.position = index - indexToSelect;

      // If there is already a selected tab, then set up an origin for the next selected tab
      // if it doesn't have one already.
      if (this._selectedIndex != null && tab.position == 0 && !tab.origin) {
        tab.origin = indexToSelect - this._selectedIndex;
      }
    });

    if (this._selectedIndex !== indexToSelect) {
      this._selectedIndex = indexToSelect;
      this._lastFocusedTabIndex = null;
      this._changeDetectorRef.markForCheck();
    }
  }

  ngAfterContentInit() {
    this._subscribeToAllTabChanges();
    this._subscribeToTabLabels();

    // Subscribe to changes in the amount of tabs, in order to be
    // able to re-render the content as new tabs are added or removed.
    this._tabsSubscription = this._tabs.changes.subscribe(() => {
      const indexToSelect = this._clampTabIndex(this._indexToSelect);

      // Maintain the previously-selected tab if a new tab is added or removed and there is no
      // explicit change that selects a different tab.
      if (indexToSelect === this._selectedIndex) {
        const tabs = this._tabs.toArray();
        let selectedTab: MatTab | undefined;

        for (let i = 0; i < tabs.length; i++) {
          if (tabs[i].isActive) {
            // Assign both to the `_indexToSelect` and `_selectedIndex` so we don't fire a changed
            // event, otherwise the consumer may end up in an infinite loop in some edge cases like
            // adding a tab within the `selectedIndexChange` event.
            this._indexToSelect = this._selectedIndex = i;
            this._lastFocusedTabIndex = null;
            selectedTab = tabs[i];
            break;
          }
        }

        // If we haven't found an active tab and a tab exists at the selected index, it means
        // that the active tab was swapped out. Since this won't be picked up by the rendering
        // loop in `ngAfterContentChecked`, we need to sync it up manually.
        if (!selectedTab && tabs[indexToSelect]) {
          Promise.resolve().then(() => {
            tabs[indexToSelect].isActive = true;
            this.selectedTabChange.emit(this._createChangeEvent(indexToSelect));
          });
        }
      }

      this._changeDetectorRef.markForCheck();
    });
  }

  /**
   * Listens to changes in all of the tabs.
   *
   * 监听所有选项卡中的变化。
   *
   */
  private _subscribeToAllTabChanges() {
    // Since we use a query with `descendants: true` to pick up the tabs, we may end up catching
    // some that are inside of nested tab groups. We filter them out manually by checking that
    // the closest group to the tab is the current one.
    this._allTabs.changes.pipe(startWith(this._allTabs)).subscribe((tabs: QueryList<MatTab>) => {
      this._tabs.reset(
        tabs.filter(tab => {
          return tab._closestTabGroup === this || !tab._closestTabGroup;
        }),
      );
      this._tabs.notifyOnChanges();
    });
  }

  ngOnDestroy() {
    this._tabs.destroy();
    this._tabsSubscription.unsubscribe();
    this._tabLabelSubscription.unsubscribe();
  }

  /**
   * Re-aligns the ink bar to the selected tab element.
   *
   * 将墨水条与选定的选项卡元素重新对齐。
   *
   */
  realignInkBar() {
    if (this._tabHeader) {
      this._tabHeader._alignInkBarToSelectedTab();
    }
  }

  /**
   * Recalculates the tab group's pagination dimensions.
   *
   * 重新计算选项卡组的分页尺寸。
   *
   * WARNING: Calling this method can be very costly in terms of performance. It should be called
   * as infrequently as possible from outside of the Tabs component as it causes a reflow of the
   * page.
   *
   * 警告：就性能而言，调用此方法的成本非常高。它应尽可能从选项卡列表组件的外部调用，因为它会导致页面重排。
   *
   */
  updatePagination() {
    if (this._tabHeader) {
      this._tabHeader.updatePagination();
    }
  }

  /**
   * Sets focus to a particular tab.
   *
   * 将焦点设置到特定选项卡。
   *
   * @param index Index of the tab to be focused.
   *
   * 要设置焦点的选项卡的索引。
   *
   */
  focusTab(index: number) {
    const header = this._tabHeader;

    if (header) {
      header.focusIndex = index;
    }
  }

  _focusChanged(index: number) {
    this._lastFocusedTabIndex = index;
    this.focusChange.emit(this._createChangeEvent(index));
  }

  private _createChangeEvent(index: number): MatTabChangeEvent {
    const event = new MatTabChangeEvent();
    event.index = index;
    if (this._tabs && this._tabs.length) {
      event.tab = this._tabs.toArray()[index];
    }
    return event;
  }

  /**
   * Subscribes to changes in the tab labels. This is needed, because the @Input for the label is
   * on the MatTab component, whereas the data binding is inside the MatTabGroup. In order for the
   * binding to be updated, we need to subscribe to changes in it and trigger change detection
   * manually.
   *
   * 订阅选项卡标签中的更改。这是必需的，因为选项卡的 @Input 在 MatTab 组件上，而数据绑定在 MatTabGroup 中。
   * 要想更新绑定，我们就需要订阅其中的更改并手动触发变更检测。
   *
   */
  private _subscribeToTabLabels() {
    if (this._tabLabelSubscription) {
      this._tabLabelSubscription.unsubscribe();
    }

    this._tabLabelSubscription = merge(...this._tabs.map(tab => tab._stateChanges)).subscribe(() =>
      this._changeDetectorRef.markForCheck(),
    );
  }

  /**
   * Clamps the given index to the bounds of 0 and the tabs length.
   *
   * 在 0 和选项卡数之间夹取一个索引。
   *
   */
  private _clampTabIndex(index: number | null): number {
    // Note the `|| 0`, which ensures that values like NaN can't get through
    // and which would otherwise throw the component into an infinite loop
    // (since Math.max(NaN, 0) === NaN).
    return Math.min(this._tabs.length - 1, Math.max(index || 0, 0));
  }

  /**
   * Returns a unique id for each tab label element
   *
   * 为每个选项卡标签元素返回一个唯一的 id
   *
   */
  _getTabLabelId(i: number): string {
    return `mat-tab-label-${this._groupId}-${i}`;
  }

  /**
   * Returns a unique id for each tab content element
   *
   * 为每个选项卡内容元素返回一个唯一的 id
   *
   */
  _getTabContentId(i: number): string {
    return `mat-tab-content-${this._groupId}-${i}`;
  }

  /**
   * Sets the height of the body wrapper to the height of the activating tab if dynamic
   * height property is true.
   *
   * 如果 dynamicHeight 属性为 true，则把本体包装器的高度设置为激活选项卡的高度。
   *
   */
  _setTabBodyWrapperHeight(tabHeight: number): void {
    if (!this._dynamicHeight || !this._tabBodyWrapperHeight) {
      return;
    }

    const wrapper: HTMLElement = this._tabBodyWrapper.nativeElement;

    wrapper.style.height = this._tabBodyWrapperHeight + 'px';

    // This conditional forces the browser to paint the height so that
    // the animation to the new height can have an origin.
    if (this._tabBodyWrapper.nativeElement.offsetHeight) {
      wrapper.style.height = tabHeight + 'px';
    }
  }

  /**
   * Removes the height of the tab body wrapper.
   *
   * 去掉选项卡本体包装器的高度。
   *
   */
  _removeTabBodyWrapperHeight(): void {
    const wrapper = this._tabBodyWrapper.nativeElement;
    this._tabBodyWrapperHeight = wrapper.clientHeight;
    wrapper.style.height = '';
    this.animationDone.emit();
  }

  /**
   * Handle click events, setting new selected index if appropriate.
   *
   * 处理点击事件，根据需要设置新的选定项索引。
   *
   */
  _handleClick(tab: MatTab, tabHeader: MatTabGroupBaseHeader, index: number) {
    if (!tab.disabled) {
      this.selectedIndex = tabHeader.focusIndex = index;
    }
  }

  /**
   * Retrieves the tabindex for the tab.
   *
   * 获取该选项卡的 tabindex。
   *
   */
  _getTabIndex(tab: MatTab, index: number): number | null {
    if (tab.disabled) {
      return null;
    }
    const targetIndex = this._lastFocusedTabIndex ?? this.selectedIndex;
    return index === targetIndex ? 0 : -1;
  }

  /**
   * Callback for when the focused state of a tab has changed.
   *
   * 选项卡的焦点状态更改时的回调。
   *
   */
  _tabFocusChanged(focusOrigin: FocusOrigin, index: number) {
    // Mouse/touch focus happens during the `mousedown`/`touchstart` phase which
    // can cause the tab to be moved out from under the pointer, interrupting the
    // click sequence (see #21898). We don't need to scroll the tab into view for
    // such cases anyway, because it will be done when the tab becomes selected.
    if (focusOrigin && focusOrigin !== 'mouse' && focusOrigin !== 'touch') {
      this._tabHeader.focusIndex = index;
    }
  }
}

/**
 * Material design tab-group component. Supports basic tab pairs (label + content) and includes
 * animated ink-bar, keyboard navigation, and screen reader.
 * See: <https://material.io/design/components/tabs.html>
 *
 * Material Design 选项卡组组件。支持基本选项卡对（选项卡+内容），包括动画墨水条、键盘导航和屏幕阅读器。请参阅：<https://material.io/design/components/tabs.html>
 *
 */
@Component({
  selector: 'mat-tab-group',
  exportAs: 'matTabGroup',
  templateUrl: 'tab-group.html',
  styleUrls: ['tab-group.css'],
  encapsulation: ViewEncapsulation.None,
  // tslint:disable-next-line:validate-decorators
  changeDetection: ChangeDetectionStrategy.Default,
  inputs: ['color', 'disableRipple'],
  providers: [
    {
      provide: MAT_TAB_GROUP,
      useExisting: MatTabGroup,
    },
  ],
  host: {
    'class': 'mat-mdc-tab-group',
    '[class.mat-mdc-tab-group-dynamic-height]': 'dynamicHeight',
    '[class.mat-mdc-tab-group-inverted-header]': 'headerPosition === "below"',
    '[class.mat-mdc-tab-group-stretch-tabs]': 'stretchTabs',
  },
})
export class MatTabGroup extends _MatTabGroupBase {
  @ContentChildren(MatTab, {descendants: true}) _allTabs: QueryList<MatTab>;
  @ViewChild('tabBodyWrapper') _tabBodyWrapper: ElementRef;
  @ViewChild('tabHeader') _tabHeader: MatTabHeader;

  /** Whether the ink bar should fit its width to the size of the tab label content. */
  @Input()
  get fitInkBarToContent(): boolean {
    return this._fitInkBarToContent;
  }
  set fitInkBarToContent(v: BooleanInput) {
    this._fitInkBarToContent = coerceBooleanProperty(v);
    this._changeDetectorRef.markForCheck();
  }
  private _fitInkBarToContent = false;

  /** Whether tabs should be stretched to fill the header. */
  @Input('mat-stretch-tabs')
  get stretchTabs(): boolean {
    return this._stretchTabs;
  }
  set stretchTabs(v: BooleanInput) {
    this._stretchTabs = coerceBooleanProperty(v);
  }
  private _stretchTabs = true;

  constructor(
    elementRef: ElementRef,
    changeDetectorRef: ChangeDetectorRef,
    @Inject(MAT_TABS_CONFIG) @Optional() defaultConfig?: MatTabsConfig,
    @Optional() @Inject(ANIMATION_MODULE_TYPE) animationMode?: string,
  ) {
    super(elementRef, changeDetectorRef, defaultConfig, animationMode);
    this.fitInkBarToContent =
      defaultConfig && defaultConfig.fitInkBarToContent != null
        ? defaultConfig.fitInkBarToContent
        : false;
  }
}

/** A simple change event emitted on focus or selection changes. */
export class MatTabChangeEvent {
  /** Index of the currently-selected tab. */
  index: number;
  /** Reference to the currently-selected tab. */
  tab: MatTab;
}
