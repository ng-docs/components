/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  FocusMonitor,
  FocusOrigin,
  isFakeMousedownFromScreenReader,
  isFakeTouchstartFromScreenReader,
} from '@angular/cdk/a11y';
import {Direction, Directionality} from '@angular/cdk/bidi';
import {ENTER, LEFT_ARROW, RIGHT_ARROW, SPACE} from '@angular/cdk/keycodes';
import {
  FlexibleConnectedPositionStrategy,
  HorizontalConnectionPos,
  Overlay,
  OverlayConfig,
  OverlayRef,
  ScrollStrategy,
  VerticalConnectionPos,
} from '@angular/cdk/overlay';
import {TemplatePortal} from '@angular/cdk/portal';
import {
  AfterContentInit,
  Directive,
  ElementRef,
  EventEmitter,
  Inject,
  InjectionToken,
  Input,
  OnDestroy,
  Optional,
  Output,
  Self,
  ViewContainerRef,
} from '@angular/core';
import {normalizePassiveListenerOptions} from '@angular/cdk/platform';
import {asapScheduler, merge, Observable, of as observableOf, Subscription} from 'rxjs';
import {delay, filter, take, takeUntil} from 'rxjs/operators';
import {_MatMenuBase, MenuCloseReason} from './menu';
import {throwMatMenuMissingError, throwMatMenuRecursiveError} from './menu-errors';
import {MatMenuItem} from './menu-item';
import {MAT_MENU_PANEL, MatMenuPanel} from './menu-panel';
import {MenuPositionX, MenuPositionY} from './menu-positions';

/**
 * Injection token that determines the scroll handling while the menu is open.
 *
 * 当注册菜单打开时，它确定滚动处理的注入令牌。
 *
 */
export const MAT_MENU_SCROLL_STRATEGY = new InjectionToken<() => ScrollStrategy>(
  'mat-menu-scroll-strategy',
);

/** @docs-private */
export function MAT_MENU_SCROLL_STRATEGY_FACTORY(overlay: Overlay): () => ScrollStrategy {
  return () => overlay.scrollStrategies.reposition();
}

/** @docs-private */
export const MAT_MENU_SCROLL_STRATEGY_FACTORY_PROVIDER = {
  provide: MAT_MENU_SCROLL_STRATEGY,
  deps: [Overlay],
  useFactory: MAT_MENU_SCROLL_STRATEGY_FACTORY,
};

/**
 * Default top padding of the menu panel.
 *
 * 菜单面板的默认顶部衬距。
 *
 */
export const MENU_PANEL_TOP_PADDING = 8;

/**
 * Options for binding a passive event listener.
 *
 * 绑定被动事件监听器的选项。
 *
 */
const passiveEventListenerOptions = normalizePassiveListenerOptions({passive: true});

// TODO(andrewseguin): Remove the kebab versions in favor of camelCased attribute selectors

@Directive({
  host: {
    'aria-haspopup': 'true',
    '[attr.aria-expanded]': 'menuOpen || null',
    '[attr.aria-controls]': 'menuOpen ? menu.panelId : null',
    '(click)': '_handleClick($event)',
    '(mousedown)': '_handleMousedown($event)',
    '(keydown)': '_handleKeydown($event)',
  },
})
export abstract class _MatMenuTriggerBase implements AfterContentInit, OnDestroy {
  private _portal: TemplatePortal;
  private _overlayRef: OverlayRef | null = null;
  private _menuOpen: boolean = false;
  private _closingActionsSubscription = Subscription.EMPTY;
  private _hoverSubscription = Subscription.EMPTY;
  private _menuCloseSubscription = Subscription.EMPTY;
  private _scrollStrategy: () => ScrollStrategy;

  /**
   * We're specifically looking for a `MatMenu` here since the generic `MatMenuPanel`
   * interface lacks some functionality around nested menus and animations.
   *
   * 我们特意在 `MatMenu`，因为通用的 `MatMenuPanel` 接口在嵌套的菜单和动画中缺乏一些功能。
   *
   */
  private _parentMaterialMenu: _MatMenuBase | undefined;

  /**
   * Handles touch start events on the trigger.
   * Needs to be an arrow function so we can easily use addEventListener and removeEventListener.
   *
   * 处理触发器上的 touch 启动事件。需要成为一个箭头函数，以便我们可以轻松使用 addEventListener 和 removeEventListener。
   *
   */
  private _handleTouchStart = (event: TouchEvent) => {
    if (!isFakeTouchstartFromScreenReader(event)) {
      this._openedBy = 'touch';
    }
  };

  // Tracking input type is necessary so it's possible to only auto-focus
  // the first item of the list when the menu is opened via the keyboard
  _openedBy: Exclude<FocusOrigin, 'program' | null> | undefined = undefined;

  /**
   *
   * @deprecated
   * @breaking-change 8.0.0
   */
  @Input('mat-menu-trigger-for')
  get _deprecatedMatMenuTriggerFor(): MatMenuPanel {
    return this.menu;
  }
  set _deprecatedMatMenuTriggerFor(v: MatMenuPanel) {
    this.menu = v;
  }

  /**
   * References the menu instance that the trigger is associated with.
   *
   * 引用触发器所关联的菜单实例。
   *
   */
  @Input('matMenuTriggerFor')
  get menu() {
    return this._menu;
  }
  set menu(menu: MatMenuPanel) {
    if (menu === this._menu) {
      return;
    }

    this._menu = menu;
    this._menuCloseSubscription.unsubscribe();

    if (menu) {
      if (menu === this._parentMaterialMenu && (typeof ngDevMode === 'undefined' || ngDevMode)) {
        throwMatMenuRecursiveError();
      }

      this._menuCloseSubscription = menu.close.subscribe((reason: MenuCloseReason) => {
        this._destroyMenu(reason);

        // If a click closed the menu, we should close the entire chain of nested menus.
        if ((reason === 'click' || reason === 'tab') && this._parentMaterialMenu) {
          this._parentMaterialMenu.closed.emit(reason);
        }
      });
    }
  }
  private _menu: MatMenuPanel;

  /**
   * Data to be passed along to any lazily-rendered content.
   *
   * 要传递给任何一段时间的惰性内容的数据。
   *
   */
  @Input('matMenuTriggerData') menuData: any;

  /**
   * Whether focus should be restored when the menu is closed.
   * Note that disabling this option can have accessibility implications
   * and it's up to you to manage focus, if you decide to turn it off.
   *
   * 当菜单关闭时，是否要恢复焦点。请注意，禁用此选项可能会产生辅助功能，如果你决定将其关闭，则可由此来管理焦点。
   *
   */
  @Input('matMenuTriggerRestoreFocus') restoreFocus: boolean = true;

  /**
   * Event emitted when the associated menu is opened.
   *
   * 关联菜单打开时发出的事件。
   *
   */
  @Output() readonly menuOpened: EventEmitter<void> = new EventEmitter<void>();

  /**
   * Event emitted when the associated menu is opened.
   *
   * 关联菜单打开时发出的事件。
   *
   * @deprecated Switch to `menuOpened` instead
   *
   * 切换到 `menuOpened` 代替
   * @breaking-change 8.0.0
   */
  // tslint:disable-next-line:no-output-on-prefix
  @Output() readonly onMenuOpen: EventEmitter<void> = this.menuOpened;

  /**
   * Event emitted when the associated menu is closed.
   *
   * 当关联的菜单关闭时会发出本事件。
   *
   */
  @Output() readonly menuClosed: EventEmitter<void> = new EventEmitter<void>();

  /**
   * Event emitted when the associated menu is closed.
   *
   * 当关联的菜单关闭时会发出本事件。
   *
   * @deprecated Switch to `menuClosed` instead
   *
   * 切换到 `menuClosed` 代替
   * @breaking-change 8.0.0
   */
  // tslint:disable-next-line:no-output-on-prefix
  @Output() readonly onMenuClose: EventEmitter<void> = this.menuClosed;

  constructor(
    private _overlay: Overlay,
    private _element: ElementRef<HTMLElement>,
    private _viewContainerRef: ViewContainerRef,
    @Inject(MAT_MENU_SCROLL_STRATEGY) scrollStrategy: any,
    @Inject(MAT_MENU_PANEL) @Optional() parentMenu: MatMenuPanel,
    // `MatMenuTrigger` is commonly used in combination with a `MatMenuItem`.
    // tslint:disable-next-line: lightweight-tokens
    @Optional() @Self() private _menuItemInstance: MatMenuItem,
    @Optional() private _dir: Directionality,
    // TODO(crisbeto): make the _focusMonitor required when doing breaking changes.
    // @breaking-change 8.0.0
    private _focusMonitor?: FocusMonitor,
  ) {
    this._scrollStrategy = scrollStrategy;
    this._parentMaterialMenu = parentMenu instanceof _MatMenuBase ? parentMenu : undefined;

    _element.nativeElement.addEventListener(
      'touchstart',
      this._handleTouchStart,
      passiveEventListenerOptions,
    );

    if (_menuItemInstance) {
      _menuItemInstance._triggersSubmenu = this.triggersSubmenu();
    }
  }

  ngAfterContentInit() {
    this._checkMenu();
    this._handleHover();
  }

  ngOnDestroy() {
    if (this._overlayRef) {
      this._overlayRef.dispose();
      this._overlayRef = null;
    }

    this._element.nativeElement.removeEventListener(
      'touchstart',
      this._handleTouchStart,
      passiveEventListenerOptions,
    );

    this._menuCloseSubscription.unsubscribe();
    this._closingActionsSubscription.unsubscribe();
    this._hoverSubscription.unsubscribe();
  }

  /**
   * Whether the menu is open.
   *
   * 菜单是否已打开。
   *
   */
  get menuOpen(): boolean {
    return this._menuOpen;
  }

  /**
   * The text direction of the containing app.
   *
   * 包含该应用的文字方向。
   *
   */
  get dir(): Direction {
    return this._dir && this._dir.value === 'rtl' ? 'rtl' : 'ltr';
  }

  /**
   * Whether the menu triggers a sub-menu or a top-level one.
   *
   * 菜单是触发了子菜单，还是触发了顶级菜单。
   *
   */
  triggersSubmenu(): boolean {
    return !!(this._menuItemInstance && this._parentMaterialMenu);
  }

  /**
   * Toggles the menu between the open and closed states.
   *
   * 在打开状态和关闭状态之间切换菜单。
   *
   */
  toggleMenu(): void {
    return this._menuOpen ? this.closeMenu() : this.openMenu();
  }

  /**
   * Opens the menu.
   *
   * 打开菜单
   *
   */
  openMenu(): void {
    if (this._menuOpen) {
      return;
    }

    this._checkMenu();

    const overlayRef = this._createOverlay();
    const overlayConfig = overlayRef.getConfig();

    this._setPosition(overlayConfig.positionStrategy as FlexibleConnectedPositionStrategy);
    overlayConfig.hasBackdrop =
      this.menu.hasBackdrop == null ? !this.triggersSubmenu() : this.menu.hasBackdrop;
    overlayRef.attach(this._getPortal());

    if (this.menu.lazyContent) {
      this.menu.lazyContent.attach(this.menuData);
    }

    this._closingActionsSubscription = this._menuClosingActions().subscribe(() => this.closeMenu());
    this._initMenu();

    if (this.menu instanceof _MatMenuBase) {
      this.menu._startAnimation();
    }
  }

  /**
   * Closes the menu.
   *
   * 关闭菜单。
   *
   */
  closeMenu(): void {
    this.menu.close.emit();
  }

  /**
   * Focuses the menu trigger.
   *
   * 让此菜单触发器获得焦点。
   *
   * @param origin Source of the menu trigger's focus.
   *
   * 菜单触发器的焦点来源于此。
   *
   */
  focus(origin?: FocusOrigin, options?: FocusOptions) {
    if (this._focusMonitor && origin) {
      this._focusMonitor.focusVia(this._element, origin, options);
    } else {
      this._element.nativeElement.focus(options);
    }
  }

  /**
   * Updates the position of the menu to ensure that it fits all options within the viewport.
   *
   * 更新菜单的位置，以确保它适合视口内的所有选项。
   *
   */
  updatePosition(): void {
    this._overlayRef?.updatePosition();
  }

  /**
   * Closes the menu and does the necessary cleanup.
   *
   * 关闭菜单并进行必要的清理。
   *
   */
  private _destroyMenu(reason: MenuCloseReason) {
    if (!this._overlayRef || !this.menuOpen) {
      return;
    }

    const menu = this.menu;
    this._closingActionsSubscription.unsubscribe();
    this._overlayRef.detach();

    // Always restore focus if the user is navigating using the keyboard or the menu was opened
    // programmatically. We don't restore for non-root triggers, because it can prevent focus
    // from making it back to the root trigger when closing a long chain of menus by clicking
    // on the backdrop.
    if (this.restoreFocus && (reason === 'keydown' || !this._openedBy || !this.triggersSubmenu())) {
      this.focus(this._openedBy);
    }

    this._openedBy = undefined;

    if (menu instanceof _MatMenuBase) {
      menu._resetAnimation();

      if (menu.lazyContent) {
        // Wait for the exit animation to finish before detaching the content.
        menu._animationDone
          .pipe(
            filter(event => event.toState === 'void'),
            take(1),
            // Interrupt if the content got re-attached.
            takeUntil(menu.lazyContent._attached),
          )
          .subscribe({
            next: () => menu.lazyContent!.detach(),
            // No matter whether the content got re-attached, reset the menu.
            complete: () => this._setIsMenuOpen(false),
          });
      } else {
        this._setIsMenuOpen(false);
      }
    } else {
      this._setIsMenuOpen(false);

      if (menu.lazyContent) {
        menu.lazyContent.detach();
      }
    }
  }

  /**
   * This method sets the menu state to open and focuses the first item if
   * the menu was opened via the keyboard.
   *
   * 如果菜单是通过键盘打开的，这个方法会把菜单状态设置为打开并聚焦第一个条目。
   *
   */
  private _initMenu(): void {
    this.menu.parentMenu = this.triggersSubmenu() ? this._parentMaterialMenu : undefined;
    this.menu.direction = this.dir;
    this._setMenuElevation();
    this.menu.focusFirstItem(this._openedBy || 'program');
    this._setIsMenuOpen(true);
  }

  /**
   * Updates the menu elevation based on the amount of parent menus that it has.
   *
   * 菜单的更新窗口根据它所拥有的父菜单量来更新。
   *
   */
  private _setMenuElevation(): void {
    if (this.menu.setElevation) {
      let depth = 0;
      let parentMenu = this.menu.parentMenu;

      while (parentMenu) {
        depth++;
        parentMenu = parentMenu.parentMenu;
      }

      this.menu.setElevation(depth);
    }
  }

  // set state rather than toggle to support triggers sharing a menu
  private _setIsMenuOpen(isOpen: boolean): void {
    this._menuOpen = isOpen;
    this._menuOpen ? this.menuOpened.emit() : this.menuClosed.emit();

    if (this.triggersSubmenu()) {
      this._menuItemInstance._setHighlighted(isOpen);
    }
  }

  /**
   * This method checks that a valid instance of MatMenu has been passed into
   * matMenuTriggerFor. If not, an exception is thrown.
   *
   * 这个方法检查 MatMenu 的一个有效实例是否已经传入 matMenuTriggerFor。如果没有，抛出一个异常。
   *
   */
  private _checkMenu() {
    if (!this.menu && (typeof ngDevMode === 'undefined' || ngDevMode)) {
      throwMatMenuMissingError();
    }
  }

  /**
   * This method creates the overlay from the provided menu's template and saves its
   * OverlayRef so that it can be attached to the DOM when openMenu is called.
   *
   * 这个方法从提供的菜单模板中创建了 overlay，并保存了 OverlayRef，以便在调用 openMenu 时把它附加到 DOM 上。
   *
   */
  private _createOverlay(): OverlayRef {
    if (!this._overlayRef) {
      const config = this._getOverlayConfig();
      this._subscribeToPositions(config.positionStrategy as FlexibleConnectedPositionStrategy);
      this._overlayRef = this._overlay.create(config);

      // Consume the `keydownEvents` in order to prevent them from going to another overlay.
      // Ideally we'd also have our keyboard event logic in here, however doing so will
      // break anybody that may have implemented the `MatMenuPanel` themselves.
      this._overlayRef.keydownEvents().subscribe();
    }

    return this._overlayRef;
  }

  /**
   * This method builds the configuration object needed to create the overlay, the OverlayState.
   *
   * 这个方法构建了创建浮层 OverlayState 所需的配置对象。
   *
   * @returns OverlayConfig
   *
   * 浮层配置
   *
   */
  private _getOverlayConfig(): OverlayConfig {
    return new OverlayConfig({
      positionStrategy: this._overlay
        .position()
        .flexibleConnectedTo(this._element)
        .withLockedPosition()
        .withGrowAfterOpen()
        .withTransformOriginOn('.mat-menu-panel, .mat-mdc-menu-panel'),
      backdropClass: this.menu.backdropClass || 'cdk-overlay-transparent-backdrop',
      panelClass: this.menu.overlayPanelClass,
      scrollStrategy: this._scrollStrategy(),
      direction: this._dir,
    });
  }

  /**
   * Listens to changes in the position of the overlay and sets the correct classes
   * on the menu based on the new position. This ensures the animation origin is always
   * correct, even if a fallback position is used for the overlay.
   *
   * 监听浮层位置的变化，并根据新的位置在菜单上设置正确的类。即使在后备位置使用浮层，这也能确保动画原点始终正确。
   *
   */
  private _subscribeToPositions(position: FlexibleConnectedPositionStrategy): void {
    if (this.menu.setPositionClasses) {
      position.positionChanges.subscribe(change => {
        const posX: MenuPositionX = change.connectionPair.overlayX === 'start' ? 'after' : 'before';
        const posY: MenuPositionY = change.connectionPair.overlayY === 'top' ? 'below' : 'above';

        this.menu.setPositionClasses!(posX, posY);
      });
    }
  }

  /**
   * Sets the appropriate positions on a position strategy
   * so the overlay connects with the trigger correctly.
   *
   * 在定位策略上设置合适的位置，使浮层与触发器正确连接。
   *
   * @param positionStrategy Strategy whose position to update.
   *
   * 策略的位置要更新。
   *
   */
  private _setPosition(positionStrategy: FlexibleConnectedPositionStrategy) {
    let [originX, originFallbackX]: HorizontalConnectionPos[] =
      this.menu.xPosition === 'before' ? ['end', 'start'] : ['start', 'end'];

    let [overlayY, overlayFallbackY]: VerticalConnectionPos[] =
      this.menu.yPosition === 'above' ? ['bottom', 'top'] : ['top', 'bottom'];

    let [originY, originFallbackY] = [overlayY, overlayFallbackY];
    let [overlayX, overlayFallbackX] = [originX, originFallbackX];
    let offsetY = 0;

    if (this.triggersSubmenu()) {
      // When the menu is a sub-menu, it should always align itself
      // to the edges of the trigger, instead of overlapping it.
      overlayFallbackX = originX = this.menu.xPosition === 'before' ? 'start' : 'end';
      originFallbackX = overlayX = originX === 'end' ? 'start' : 'end';
      offsetY = overlayY === 'bottom' ? MENU_PANEL_TOP_PADDING : -MENU_PANEL_TOP_PADDING;
    } else if (!this.menu.overlapTrigger) {
      originY = overlayY === 'top' ? 'bottom' : 'top';
      originFallbackY = overlayFallbackY === 'top' ? 'bottom' : 'top';
    }

    positionStrategy.withPositions([
      {originX, originY, overlayX, overlayY, offsetY},
      {originX: originFallbackX, originY, overlayX: overlayFallbackX, overlayY, offsetY},
      {
        originX,
        originY: originFallbackY,
        overlayX,
        overlayY: overlayFallbackY,
        offsetY: -offsetY,
      },
      {
        originX: originFallbackX,
        originY: originFallbackY,
        overlayX: overlayFallbackX,
        overlayY: overlayFallbackY,
        offsetY: -offsetY,
      },
    ]);
  }

  /**
   * Returns a stream that emits whenever an action that should close the menu occurs.
   *
   * 返回当应该关闭菜单的动作发生时才会发出的流。
   *
   */
  private _menuClosingActions() {
    const backdrop = this._overlayRef!.backdropClick();
    const detachments = this._overlayRef!.detachments();
    const parentClose = this._parentMaterialMenu ? this._parentMaterialMenu.closed : observableOf();
    const hover = this._parentMaterialMenu
      ? this._parentMaterialMenu._hovered().pipe(
          filter(active => active !== this._menuItemInstance),
          filter(() => this._menuOpen),
        )
      : observableOf();

    return merge(backdrop, parentClose as Observable<MenuCloseReason>, hover, detachments);
  }

  /**
   * Handles mouse presses on the trigger.
   *
   * 在触发器上按下鼠标。
   *
   */
  _handleMousedown(event: MouseEvent): void {
    if (!isFakeMousedownFromScreenReader(event)) {
      // Since right or middle button clicks won't trigger the `click` event,
      // we shouldn't consider the menu as opened by mouse in those cases.
      this._openedBy = event.button === 0 ? 'mouse' : undefined;

      // Since clicking on the trigger won't close the menu if it opens a sub-menu,
      // we should prevent focus from moving onto it via click to avoid the
      // highlight from lingering on the menu item.
      if (this.triggersSubmenu()) {
        event.preventDefault();
      }
    }
  }

  /**
   * Handles key presses on the trigger.
   *
   * 处理扳机上的按键操作。
   *
   */
  _handleKeydown(event: KeyboardEvent): void {
    const keyCode = event.keyCode;

    // Pressing enter on the trigger will trigger the click handler later.
    if (keyCode === ENTER || keyCode === SPACE) {
      this._openedBy = 'keyboard';
    }

    if (
      this.triggersSubmenu() &&
      ((keyCode === RIGHT_ARROW && this.dir === 'ltr') ||
        (keyCode === LEFT_ARROW && this.dir === 'rtl'))
    ) {
      this._openedBy = 'keyboard';
      this.openMenu();
    }
  }

  /**
   * Handles click events on the trigger.
   *
   * 处理触发器上的 click 事件。
   *
   */
  _handleClick(event: MouseEvent): void {
    if (this.triggersSubmenu()) {
      // Stop event propagation to avoid closing the parent menu.
      event.stopPropagation();
      this.openMenu();
    } else {
      this.toggleMenu();
    }
  }

  /**
   * Handles the cases where the user hovers over the trigger.
   *
   * 处理用户将鼠标悬停在触发器上的情况。
   *
   */
  private _handleHover() {
    // Subscribe to changes in the hovered item in order to toggle the panel.
    if (!this.triggersSubmenu() || !this._parentMaterialMenu) {
      return;
    }

    this._hoverSubscription = this._parentMaterialMenu
      ._hovered()
      // Since we might have multiple competing triggers for the same menu (e.g. a sub-menu
      // with different data and triggers), we have to delay it by a tick to ensure that
      // it won't be closed immediately after it is opened.
      .pipe(
        filter(active => active === this._menuItemInstance && !active.disabled),
        delay(0, asapScheduler),
      )
      .subscribe(() => {
        this._openedBy = 'mouse';

        // If the same menu is used between multiple triggers, it might still be animating
        // while the new trigger tries to re-open it. Wait for the animation to finish
        // before doing so. Also interrupt if the user moves to another item.
        if (this.menu instanceof _MatMenuBase && this.menu._isAnimating) {
          // We need the `delay(0)` here in order to avoid
          // 'changed after checked' errors in some cases. See #12194.
          this.menu._animationDone
            .pipe(take(1), delay(0, asapScheduler), takeUntil(this._parentMaterialMenu!._hovered()))
            .subscribe(() => this.openMenu());
        } else {
          this.openMenu();
        }
      });
  }

  /**
   * Gets the portal that should be attached to the overlay.
   *
   * 获取应该附加到浮层的传送点。
   *
   */
  private _getPortal(): TemplatePortal {
    // Note that we can avoid this check by keeping the portal on the menu panel.
    // While it would be cleaner, we'd have to introduce another required method on
    // `MatMenuPanel`, making it harder to consume.
    if (!this._portal || this._portal.templateRef !== this.menu.templateRef) {
      this._portal = new TemplatePortal(this.menu.templateRef, this._viewContainerRef);
    }

    return this._portal;
  }
}

/**
 * Directive applied to an element that should trigger a `mat-menu`.
 *
 * 用于应触发 `mat-menu` 的元素的指令。
 *
 */
@Directive({
  selector: `[mat-menu-trigger-for], [matMenuTriggerFor]`,
  host: {
    'class': 'mat-menu-trigger',
  },
  exportAs: 'matMenuTrigger',
})
export class MatMenuTrigger extends _MatMenuTriggerBase {}
