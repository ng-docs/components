/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {FocusableOption, FocusMonitor} from '@angular/cdk/a11y';
import {Directionality} from '@angular/cdk/bidi';
import {BooleanInput, coerceBooleanProperty} from '@angular/cdk/coercion';
import {Platform} from '@angular/cdk/platform';
import {ViewportRuler} from '@angular/cdk/scrolling';
import {
  AfterContentChecked,
  AfterContentInit,
  AfterViewInit,
  Attribute,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChildren,
  Directive,
  ElementRef,
  forwardRef,
  Inject,
  Input,
  NgZone,
  OnDestroy,
  Optional,
  QueryList,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import {
  CanDisable,
  CanDisableRipple,
  HasTabIndex,
  MAT_RIPPLE_GLOBAL_OPTIONS,
  mixinDisabled,
  mixinDisableRipple,
  mixinTabIndex,
  RippleConfig,
  RippleGlobalOptions,
  RippleRenderer,
  RippleTarget,
  ThemePalette,
} from '@angular/material/core';
import {ANIMATION_MODULE_TYPE} from '@angular/platform-browser/animations';
import {startWith, takeUntil} from 'rxjs/operators';
import {MatInkBar} from '../ink-bar';
import {MatPaginatedTabHeader, MatPaginatedTabHeaderItem} from '../paginated-tab-header';

/**
 * Base class with all of the `MatTabNav` functionality.
 *
 * 具有所有 `MatTabNav` 功能的基类。
 *
 * @docs-private
 */
@Directive()
export abstract class _MatTabNavBase
  extends MatPaginatedTabHeader
  implements AfterContentChecked, AfterContentInit, OnDestroy
{
  /**
   * Query list of all tab links of the tab navigation.
   *
   * 此标签导航的所有标签链接的查询列表。
   *
   */
  abstract override _items: QueryList<MatPaginatedTabHeaderItem & {active: boolean}>;

  /**
   * Background color of the tab nav.
   *
   * 此标签导航的背景颜色。
   *
   */
  @Input()
  get backgroundColor(): ThemePalette {
    return this._backgroundColor;
  }
  set backgroundColor(value: ThemePalette) {
    const classList = this._elementRef.nativeElement.classList;
    classList.remove(`mat-background-${this.backgroundColor}`);

    if (value) {
      classList.add(`mat-background-${value}`);
    }

    this._backgroundColor = value;
  }
  private _backgroundColor: ThemePalette;

  /**
   * Whether the ripple effect is disabled or not.
   *
   * 是否已禁用涟漪效果。
   *
   */
  @Input()
  get disableRipple(): boolean {
    return this._disableRipple;
  }
  set disableRipple(value: BooleanInput) {
    this._disableRipple = coerceBooleanProperty(value);
  }
  private _disableRipple: boolean = false;

  /**
   * Theme color of the nav bar.
   *
   * 此导航栏的主题颜色。
   *
   */
  @Input() color: ThemePalette = 'primary';

  constructor(
    elementRef: ElementRef,
    @Optional() dir: Directionality,
    ngZone: NgZone,
    changeDetectorRef: ChangeDetectorRef,
    viewportRuler: ViewportRuler,
    platform: Platform,
    @Optional() @Inject(ANIMATION_MODULE_TYPE) animationMode?: string,
  ) {
    super(elementRef, changeDetectorRef, viewportRuler, dir, ngZone, platform, animationMode);
  }

  protected _itemSelected() {
    // noop
  }

  override ngAfterContentInit() {
    // We need this to run before the `changes` subscription in parent to ensure that the
    // selectedIndex is up-to-date by the time the super class starts looking for it.
    this._items.changes.pipe(startWith(null), takeUntil(this._destroyed)).subscribe(() => {
      this.updateActiveLink();
    });

    super.ngAfterContentInit();
  }

  /**
   * Notifies the component that the active link has been changed.
   *
   * 通知组件此活动链接已更改。
   *
   */
  updateActiveLink() {
    if (!this._items) {
      return;
    }

    const items = this._items.toArray();

    for (let i = 0; i < items.length; i++) {
      if (items[i].active) {
        this.selectedIndex = i;
        this._changeDetectorRef.markForCheck();
        return;
      }
    }

    // The ink bar should hide itself if no items are active.
    this.selectedIndex = -1;
    this._inkBar.hide();
  }
}

/**
 * Navigation component matching the styles of the tab group header.
 * Provides anchored navigation with animated ink bar.
 *
 * 与选项卡组标题样式匹配的导航组件。提供带有动画墨水栏的链接导航。
 *
 */
@Component({
  selector: '[mat-tab-nav-bar]',
  exportAs: 'matTabNavBar, matTabNav',
  inputs: ['color'],
  templateUrl: 'tab-nav-bar.html',
  styleUrls: ['tab-nav-bar.css'],
  host: {
    'class': 'mat-tab-nav-bar mat-tab-header',
    '[class.mat-tab-header-pagination-controls-enabled]': '_showPaginationControls',
    '[class.mat-tab-header-rtl]': "_getLayoutDirection() == 'rtl'",
    '[class.mat-primary]': 'color !== "warn" && color !== "accent"',
    '[class.mat-accent]': 'color === "accent"',
    '[class.mat-warn]': 'color === "warn"',
  },
  encapsulation: ViewEncapsulation.None,
  // tslint:disable-next-line:validate-decorators
  changeDetection: ChangeDetectionStrategy.Default,
})
export class MatTabNav extends _MatTabNavBase {
  @ContentChildren(forwardRef(() => MatTabLink), {descendants: true}) _items: QueryList<MatTabLink>;
  @ViewChild(MatInkBar, {static: true}) _inkBar: MatInkBar;
  @ViewChild('tabListContainer', {static: true}) _tabListContainer: ElementRef;
  @ViewChild('tabList', {static: true}) _tabList: ElementRef;
  @ViewChild('tabListInner', {static: true}) _tabListInner: ElementRef;
  @ViewChild('nextPaginator') _nextPaginator: ElementRef<HTMLElement>;
  @ViewChild('previousPaginator') _previousPaginator: ElementRef<HTMLElement>;

  constructor(
    elementRef: ElementRef,
    @Optional() dir: Directionality,
    ngZone: NgZone,
    changeDetectorRef: ChangeDetectorRef,
    viewportRuler: ViewportRuler,
    platform: Platform,
    @Optional() @Inject(ANIMATION_MODULE_TYPE) animationMode?: string,
  ) {
    super(elementRef, dir, ngZone, changeDetectorRef, viewportRuler, platform, animationMode);
  }
}

// Boilerplate for applying mixins to MatTabLink.
const _MatTabLinkMixinBase = mixinTabIndex(mixinDisableRipple(mixinDisabled(class {})));

/**
 * Base class with all of the `MatTabLink` functionality.
 *
 * 具有所有 `MatTabLink` 功能的基类。
 *
 */
@Directive()
export class _MatTabLinkBase
  extends _MatTabLinkMixinBase
  implements
    AfterViewInit,
    OnDestroy,
    CanDisable,
    CanDisableRipple,
    HasTabIndex,
    RippleTarget,
    FocusableOption
{
  /**
   * Whether the tab link is active or not.
   *
   * 此选项卡链接是否处于活动状态。
   *
   */
  protected _isActive: boolean = false;

  /**
   * Whether the link is active.
   *
   * 此链接是否处于活动状态。
   *
   */
  @Input()
  get active(): boolean {
    return this._isActive;
  }
  set active(value: BooleanInput) {
    const newValue = coerceBooleanProperty(value);

    if (newValue !== this._isActive) {
      this._isActive = newValue;
      this._tabNavBar.updateActiveLink();
    }
  }

  /**
   * Ripple configuration for ripples that are launched on pointer down. The ripple config
   * is set to the global ripple options since we don't have any configurable options for
   * the tab link ripples.
   *
   * 用于在指针设备按下时发出涟漪的涟漪配置。由于我们没有用于标签链接涟漪的任何可配置选项，所以此涟漪配置被设置为全局涟漪选项。
   *
   * @docs-private
   */
  rippleConfig: RippleConfig & RippleGlobalOptions;

  /**
   * Whether ripples are disabled on interaction.
   *
   * 交互中是否禁用了涟漪。
   *
   * @docs-private
   */
  get rippleDisabled(): boolean {
    return (
      this.disabled ||
      this.disableRipple ||
      this._tabNavBar.disableRipple ||
      !!this.rippleConfig.disabled
    );
  }

  constructor(
    private _tabNavBar: _MatTabNavBase,
    /** @docs-private */ public elementRef: ElementRef,
    @Optional() @Inject(MAT_RIPPLE_GLOBAL_OPTIONS) globalRippleOptions: RippleGlobalOptions | null,
    @Attribute('tabindex') tabIndex: string,
    private _focusMonitor: FocusMonitor,
    @Optional() @Inject(ANIMATION_MODULE_TYPE) animationMode?: string,
  ) {
    super();

    this.rippleConfig = globalRippleOptions || {};
    this.tabIndex = parseInt(tabIndex) || 0;

    if (animationMode === 'NoopAnimations') {
      this.rippleConfig.animation = {enterDuration: 0, exitDuration: 0};
    }
  }

  /**
   * Focuses the tab link.
   *
   * 让此选项卡链接获得焦点。
   *
   */
  focus() {
    this.elementRef.nativeElement.focus();
  }

  ngAfterViewInit() {
    this._focusMonitor.monitor(this.elementRef);
  }

  ngOnDestroy() {
    this._focusMonitor.stopMonitoring(this.elementRef);
  }

  _handleFocus() {
    // Since we allow navigation through tabbing in the nav bar, we
    // have to update the focused index whenever the link receives focus.
    this._tabNavBar.focusIndex = this._tabNavBar._items.toArray().indexOf(this);
  }
}

/**
 * Link inside of a `mat-tab-nav-bar`.
 *
 * 链接到 `mat-tab-nav-bar`。
 *
 */
@Directive({
  selector: '[mat-tab-link], [matTabLink]',
  exportAs: 'matTabLink',
  inputs: ['disabled', 'disableRipple', 'tabIndex'],
  host: {
    'class': 'mat-tab-link mat-focus-indicator',
    '[attr.aria-current]': 'active ? "page" : null',
    '[attr.aria-disabled]': 'disabled',
    '[attr.tabIndex]': 'tabIndex',
    '[class.mat-tab-disabled]': 'disabled',
    '[class.mat-tab-label-active]': 'active',
    '(focus)': '_handleFocus()',
  },
})
export class MatTabLink extends _MatTabLinkBase implements OnDestroy {
  /**
   * Reference to the RippleRenderer for the tab-link.
   *
   * 对此选项卡链接的 RippleRenderer 的引用。
   *
   */
  private _tabLinkRipple: RippleRenderer;

  constructor(
    tabNavBar: MatTabNav,
    elementRef: ElementRef,
    ngZone: NgZone,
    platform: Platform,
    @Optional() @Inject(MAT_RIPPLE_GLOBAL_OPTIONS) globalRippleOptions: RippleGlobalOptions | null,
    @Attribute('tabindex') tabIndex: string,
    focusMonitor: FocusMonitor,
    @Optional() @Inject(ANIMATION_MODULE_TYPE) animationMode?: string,
  ) {
    super(tabNavBar, elementRef, globalRippleOptions, tabIndex, focusMonitor, animationMode);
    this._tabLinkRipple = new RippleRenderer(this, ngZone, elementRef, platform);
    this._tabLinkRipple.setupTriggerEvents(elementRef.nativeElement);
  }

  override ngOnDestroy() {
    super.ngOnDestroy();
    this._tabLinkRipple._removeTriggerEvents();
  }
}
