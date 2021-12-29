/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  Directive,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewContainerRef,
  Inject,
  OnDestroy,
  Optional,
  NgZone,
} from '@angular/core';
import {Directionality} from '@angular/cdk/bidi';
import {TemplatePortal} from '@angular/cdk/portal';
import {
  OverlayRef,
  Overlay,
  OverlayConfig,
  ConnectedPosition,
  FlexibleConnectedPositionStrategy,
} from '@angular/cdk/overlay';
import {SPACE, ENTER, RIGHT_ARROW, LEFT_ARROW, DOWN_ARROW, UP_ARROW} from '@angular/cdk/keycodes';
import {fromEvent, Subject, merge} from 'rxjs';
import {takeUntil, filter} from 'rxjs/operators';
import {CdkMenuPanel} from './menu-panel';
import {Menu, CDK_MENU} from './menu-interface';
import {FocusNext, MenuStack} from './menu-stack';
import {throwExistingMenuStackError} from './menu-errors';
import {MENU_AIM, MenuAim} from './menu-aim';

/**
 * Whether the target element is a menu item to be ignored by the overlay background click handler.
 */
export function isClickInsideMenuOverlay(target: Element): boolean {
  while (target?.parentElement) {
    const isOpenTrigger =
      target.getAttribute('aria-expanded') === 'true' &&
      target.classList.contains('cdk-menu-trigger');
    const isOverlayMenu =
      target.classList.contains('cdk-menu') && !target.classList.contains('cdk-menu-inline');

    if (isOpenTrigger || isOverlayMenu) {
      return true;
    }
    target = target.parentElement;
  }
  return false;
}

/**
 * A directive to be combined with CdkMenuItem which opens the Menu it is bound to. If the
 * element is in a top level MenuBar it will open the menu on click, or if a sibling is already
 * opened it will open on hover. If it is inside of a Menu it will open the attached Submenu on
 * hover regardless of its sibling state.
 *
 * The directive must be placed along with the `cdkMenuItem` directive in order to enable full
 * functionality.
 */
@Directive({
  selector: '[cdkMenuTriggerFor]',
  exportAs: 'cdkMenuTriggerFor',
  host: {
    '(keydown)': '_toggleOnKeydown($event)',
    '(click)': 'toggle()',
    'class': 'cdk-menu-trigger',
    'aria-haspopup': 'menu',
    '[attr.aria-expanded]': 'isMenuOpen()',
  },
})
export class CdkMenuItemTrigger implements OnDestroy {
  /** Template reference variable to the menu this trigger opens */
  @Input('cdkMenuTriggerFor')
  get menuPanel(): CdkMenuPanel | undefined {
    return this._menuPanel;
  }
  set menuPanel(panel: CdkMenuPanel | undefined) {
    // If the provided panel already has a stack, that means it already has a trigger configured.
    // Note however that there are some edge cases where two triggers **may** share the same menu,
    // e.g. two triggers in two separate menus.
    if ((typeof ngDevMode === 'undefined' || ngDevMode) && panel?._menuStack) {
      throwExistingMenuStackError();
    }

    this._menuPanel = panel;
    if (this._menuPanel) {
      this._menuPanel._menuStack = this._getMenuStack();
    }
  }

  /** Reference to the MenuPanel this trigger toggles. */
  private _menuPanel?: CdkMenuPanel;

  /** Emits when the attached menu is requested to open */
  @Output('cdkMenuOpened') readonly opened: EventEmitter<void> = new EventEmitter();

  /** Emits when the attached menu is requested to close */
  @Output('cdkMenuClosed') readonly closed: EventEmitter<void> = new EventEmitter();

  /** The menu stack for this trigger and its sub-menus. */
  _menuStack: MenuStack = new MenuStack();

  /** A reference to the overlay which manages the triggered menu */
  private _overlayRef: OverlayRef | null = null;

  /** The content of the menu panel opened by this trigger. */
  private _panelContent: TemplatePortal;

  /** Emits when this trigger is destroyed. */
  private readonly _destroyed: Subject<void> = new Subject();

  /** Emits when the outside pointer events listener on the overlay should be stopped. */
  private readonly _stopOutsideClicksListener = merge(this.closed, this._destroyed);

  constructor(
    private readonly _elementRef: ElementRef<HTMLElement>,
    protected readonly _viewContainerRef: ViewContainerRef,
    private readonly _overlay: Overlay,
    private readonly _ngZone: NgZone,
    @Optional() @Inject(CDK_MENU) private readonly _parentMenu?: Menu,
    @Optional() @Inject(MENU_AIM) private readonly _menuAim?: MenuAim,
    @Optional() private readonly _directionality?: Directionality,
  ) {
    this._registerCloseHandler();
    this._subscribeToMouseEnter();
  }

  /** Open/close the attached menu if the trigger has been configured with one */
  toggle() {
    if (this.hasMenu()) {
      this.isMenuOpen() ? this.closeMenu() : this.openMenu();
    }
  }

  /** Open the attached menu. */
  openMenu() {
    if (!this.isMenuOpen()) {
      this.opened.next();

      this._overlayRef = this._overlayRef || this._overlay.create(this._getOverlayConfig());
      this._overlayRef.attach(this._getPortal());
      this._subscribeToOutsideClicks();
    }
  }

  /** Close the opened menu. */
  closeMenu() {
    if (this.isMenuOpen()) {
      this.closed.next();

      this._overlayRef!.detach();
    }
    this._closeSiblingTriggers();
  }

  /** Return true if the trigger has an attached menu */
  hasMenu() {
    return !!this.menuPanel;
  }

  /** Whether the menu this button is a trigger for is open */
  isMenuOpen() {
    return this._overlayRef ? this._overlayRef.hasAttached() : false;
  }

  /**
   * Get a reference to the rendered Menu if the Menu is open and it is visible in the DOM.
   * @return the menu if it is open, otherwise undefined.
   */
  getMenu(): Menu | undefined {
    return this.menuPanel?._menu;
  }

  /**
   * Subscribe to the mouseenter events and close any sibling menu items if this element is moused
   * into.
   */
  private _subscribeToMouseEnter() {
    // Closes any sibling menu items and opens the menu associated with this trigger.
    const toggleMenus = () =>
      this._ngZone.run(() => {
        this._closeSiblingTriggers();
        this.openMenu();
      });

    this._ngZone.runOutsideAngular(() => {
      fromEvent(this._elementRef.nativeElement, 'mouseenter')
        .pipe(
          filter(() => !this._getMenuStack()?.isEmpty() && !this.isMenuOpen()),
          takeUntil(this._destroyed),
        )
        .subscribe(() => {
          if (this._menuAim) {
            this._menuAim.toggle(toggleMenus);
          } else {
            toggleMenus();
          }
        });
    });
  }

  /**
   * Handles keyboard events for the menu item, specifically opening/closing the attached menu and
   * focusing the appropriate submenu item.
   * @param event the keyboard event to handle
   */
  _toggleOnKeydown(event: KeyboardEvent) {
    const keyCode = event.keyCode;
    switch (keyCode) {
      case SPACE:
      case ENTER:
        event.preventDefault();
        this.toggle();
        this.menuPanel?._menu?.focusFirstItem('keyboard');
        break;

      case RIGHT_ARROW:
        if (this._parentMenu && this._isParentVertical()) {
          event.preventDefault();
          if (this._directionality?.value === 'rtl') {
            this._getMenuStack().close(this._parentMenu, FocusNext.currentItem);
          } else {
            this.openMenu();
            this.menuPanel?._menu?.focusFirstItem('keyboard');
          }
        }
        break;

      case LEFT_ARROW:
        if (this._parentMenu && this._isParentVertical()) {
          event.preventDefault();
          if (this._directionality?.value === 'rtl') {
            this.openMenu();
            this.menuPanel?._menu?.focusFirstItem('keyboard');
          } else {
            this._getMenuStack().close(this._parentMenu, FocusNext.currentItem);
          }
        }
        break;

      case DOWN_ARROW:
      case UP_ARROW:
        if (!this._isParentVertical()) {
          event.preventDefault();
          this.openMenu();
          keyCode === DOWN_ARROW
            ? this.menuPanel?._menu?.focusFirstItem('keyboard')
            : this.menuPanel?._menu?.focusLastItem('keyboard');
        }
        break;
    }
  }

  /** Close out any sibling menu trigger menus. */
  private _closeSiblingTriggers() {
    if (this._parentMenu) {
      const menuStack = this._getMenuStack();

      // If nothing was removed from the stack and the last element is not the parent item
      // that means that the parent menu is a menu bar since we don't put the menu bar on the
      // stack
      const isParentMenuBar =
        !menuStack.closeSubMenuOf(this._parentMenu) && menuStack.peek() !== this._parentMenu;

      if (isParentMenuBar) {
        menuStack.closeAll();
      }
    } else {
      this._getMenuStack().closeAll();
    }
  }

  /** Get the configuration object used to create the overlay */
  private _getOverlayConfig() {
    return new OverlayConfig({
      positionStrategy: this._getOverlayPositionStrategy(),
      scrollStrategy: this._overlay.scrollStrategies.block(),
      direction: this._directionality,
    });
  }

  /** Build the position strategy for the overlay which specifies where to place the menu */
  private _getOverlayPositionStrategy(): FlexibleConnectedPositionStrategy {
    return this._overlay
      .position()
      .flexibleConnectedTo(this._elementRef)
      .withPositions(this._getOverlayPositions());
  }

  /** Determine and return where to position the opened menu relative to the menu item */
  private _getOverlayPositions(): ConnectedPosition[] {
    // TODO: use a common positioning config from (possibly) cdk/overlay
    return !this._parentMenu || this._parentMenu.orientation === 'horizontal'
      ? [
          {originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top'},
          {originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom'},
          {originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top'},
          {originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom'},
        ]
      : [
          {originX: 'end', originY: 'top', overlayX: 'start', overlayY: 'top'},
          {originX: 'end', originY: 'bottom', overlayX: 'start', overlayY: 'bottom'},
          {originX: 'start', originY: 'top', overlayX: 'end', overlayY: 'top'},
          {originX: 'start', originY: 'bottom', overlayX: 'end', overlayY: 'bottom'},
        ];
  }

  /**
   * Get the portal to be attached to the overlay which contains the menu. Allows for the menu
   * content to change dynamically and be reflected in the application.
   */
  private _getPortal() {
    const hasMenuContentChanged = this.menuPanel?._templateRef !== this._panelContent?.templateRef;
    if (this.menuPanel && (!this._panelContent || hasMenuContentChanged)) {
      this._panelContent = new TemplatePortal(this.menuPanel._templateRef, this._viewContainerRef);
    }

    return this._panelContent;
  }

  /**
   * @return true if if the enclosing parent menu is configured in a vertical orientation.
   */
  private _isParentVertical() {
    return this._parentMenu?.orientation === 'vertical';
  }

  /**
   * Subscribe to the MenuStack close events if this is a standalone trigger and close out the menu
   * this triggers when requested.
   */
  private _registerCloseHandler() {
    if (!this._parentMenu) {
      this._menuStack.closed.pipe(takeUntil(this._destroyed)).subscribe(item => {
        if (item === this._menuPanel?._menu) {
          this.closeMenu();
        }
      });
    }
  }

  /** Get the menu stack for this trigger - either from the parent or this trigger. */
  private _getMenuStack() {
    // We use a function since at the construction of the MenuItemTrigger the parent Menu won't have
    // its menu stack set. Therefore we need to reference the menu stack from the parent each time
    // we want to use it.
    return this._parentMenu?._menuStack || this._menuStack;
  }

  ngOnDestroy() {
    this._destroyOverlay();
    this._resetPanelMenuStack();

    this._destroyed.next();
    this._destroyed.complete();
  }

  /** Set the menu panels menu stack back to null. */
  private _resetPanelMenuStack() {
    // If a CdkMenuTrigger is placed in a submenu, each time the trigger is rendered (its parent
    // menu is opened) the panel setter for CdkMenuPanel is called. From the first render onward,
    // the attached CdkMenuPanel has the MenuStack set. Since we throw an error if a panel already
    // has a stack set, we want to reset the attached stack here to prevent the error from being
    // thrown if the trigger re-configures its attached panel (in the case where there is a 1:1
    // relationship between the panel and trigger).
    if (this._menuPanel) {
      this._menuPanel._menuStack = null;
    }
  }

  /**
   * Subscribe to the overlays outside pointer events stream and handle closing out the stack if a
   * click occurs outside the menus.
   */
  private _subscribeToOutsideClicks() {
    if (this._overlayRef) {
      this._overlayRef
        .outsidePointerEvents()
        .pipe(takeUntil(this._stopOutsideClicksListener))
        .subscribe(event => {
          if (!isClickInsideMenuOverlay(event.target as Element)) {
            this._getMenuStack().closeAll();
          }
        });
    }
  }

  /** Destroy and unset the overlay reference it if exists */
  private _destroyOverlay() {
    if (this._overlayRef) {
      this._overlayRef.dispose();
      this._overlayRef = null;
    }
  }
}
