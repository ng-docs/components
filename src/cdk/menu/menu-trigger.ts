/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Directive, ElementRef, inject, NgZone, OnDestroy} from '@angular/core';
import {Directionality} from '@angular/cdk/bidi';
import {
  ConnectedPosition,
  FlexibleConnectedPositionStrategy,
  Overlay,
  OverlayConfig,
  STANDARD_DROPDOWN_ADJACENT_POSITIONS,
  STANDARD_DROPDOWN_BELOW_POSITIONS,
} from '@angular/cdk/overlay';
import {
  DOWN_ARROW,
  ENTER,
  hasModifierKey,
  LEFT_ARROW,
  RIGHT_ARROW,
  SPACE,
  UP_ARROW,
} from '@angular/cdk/keycodes';
import {_getEventTarget} from '@angular/cdk/platform';
import {fromEvent} from 'rxjs';
import {filter, takeUntil} from 'rxjs/operators';
import {CDK_MENU, Menu} from './menu-interface';
import {PARENT_OR_NEW_MENU_STACK_PROVIDER} from './menu-stack';
import {MENU_AIM} from './menu-aim';
import {CdkMenuTriggerBase, MENU_TRIGGER} from './menu-trigger-base';

/**
 * A directive that turns its host element into a trigger for a popup menu.
 * It can be combined with cdkMenuItem to create sub-menus. If the element is in a top level
 * MenuBar it will open the menu on click, or if a sibling is already opened it will open on hover.
 * If it is inside of a Menu it will open the attached Submenu on hover regardless of its sibling
 * state.
 *
 * 将其宿主元素转换为弹出菜单触发器的指令。它可以与 cdkMenuItem 结合创建子菜单。如果此元素在顶级 MenuBar 中，将在单击它时打开菜单，如果已打开了同级元素，则在悬停时打开。如果此元素在其它菜单内，它将在悬停时打开所附着的子菜单，而无论其兄弟的状态如何。
 *
 */
@Directive({
  selector: '[cdkMenuTriggerFor]',
  exportAs: 'cdkMenuTriggerFor',
  standalone: true,
  host: {
    'class': 'cdk-menu-trigger',
    '[attr.aria-haspopup]': 'menuTemplateRef ? "menu" : null',
    '[attr.aria-expanded]': 'menuTemplateRef == null ? null : isOpen()',
    '(focusin)': '_setHasFocus(true)',
    '(focusout)': '_setHasFocus(false)',
    '(keydown)': '_toggleOnKeydown($event)',
    '(click)': 'toggle()',
  },
  inputs: [
    'menuTemplateRef: cdkMenuTriggerFor',
    'menuPosition: cdkMenuPosition',
    'menuData: cdkMenuTriggerData',
  ],
  outputs: ['opened: cdkMenuOpened', 'closed: cdkMenuClosed'],
  providers: [
    {provide: MENU_TRIGGER, useExisting: CdkMenuTrigger},
    PARENT_OR_NEW_MENU_STACK_PROVIDER,
  ],
})
export class CdkMenuTrigger extends CdkMenuTriggerBase implements OnDestroy {
  /**
   * The host element.
   *
   * 宿主元素。
   *
   */
  private readonly _elementRef: ElementRef<HTMLElement> = inject(ElementRef);

  /**
   * The CDK overlay service.
   *
   * CDK 浮层服务。
   *
   */
  private readonly _overlay = inject(Overlay);

  /**
   * The Angular zone.
   *
   * Angular 区域（Zone）。
   *
   */
  private readonly _ngZone = inject(NgZone);

  /**
   * The parent menu this trigger belongs to.
   *
   * 此触发器所属的父菜单。
   *
   */
  private readonly _parentMenu = inject(CDK_MENU, {optional: true});

  /**
   * The menu aim service used by this menu.
   *
   * 此菜单使用的 MenuAim 服务。
   *
   */
  private readonly _menuAim = inject(MENU_AIM, {optional: true});

  /**
   * The directionality of the page.
   *
   * 此页面的方向性。
   *
   */
  private readonly _directionality = inject(Directionality, {optional: true});

  constructor() {
    super();
    this._setRole();
    this._registerCloseHandler();
    this._subscribeToMenuStackClosed();
    this._subscribeToMouseEnter();
    this._subscribeToMenuStackHasFocus();
    this._setType();
  }

  /**
   * Toggle the attached menu.
   *
   * 切换已附着的菜单。
   *
   */
  toggle() {
    this.isOpen() ? this.close() : this.open();
  }

  /**
   * Open the attached menu.
   *
   * 打开已附着的菜单。
   *
   */
  open() {
    if (!this.isOpen() && this.menuTemplateRef != null) {
      this.opened.next();

      this.overlayRef = this.overlayRef || this._overlay.create(this._getOverlayConfig());
      this.overlayRef.attach(this.getMenuContentPortal());
      this._subscribeToOutsideClicks();
    }
  }

  /**
   * Close the opened menu.
   *
   * 关闭已打开的菜单。
   *
   */
  close() {
    if (this.isOpen()) {
      this.closed.next();

      this.overlayRef!.detach();
    }
    this._closeSiblingTriggers();
  }

  /**
   * Get a reference to the rendered Menu if the Menu is open and rendered in the DOM.
   *
   * 如果菜单在 DOM 中打开并渲染，则获取对渲染出的菜单的引用。
   *
   */
  getMenu(): Menu | undefined {
    return this.childMenu;
  }

  /**
   * Handles keyboard events for the menu item.
   *
   * 处理菜单项的键盘事件。
   *
   * @param event The keyboard event to handle
   *
   * 要处理的键盘事件
   *
   */
  _toggleOnKeydown(event: KeyboardEvent) {
    const isParentVertical = this._parentMenu?.orientation === 'vertical';
    switch (event.keyCode) {
      case SPACE:
      case ENTER:
        if (!hasModifierKey(event)) {
          event.preventDefault();
          this.toggle();
          this.childMenu?.focusFirstItem('keyboard');
        }
        break;

      case RIGHT_ARROW:
        if (!hasModifierKey(event)) {
          if (this._parentMenu && isParentVertical && this._directionality?.value !== 'rtl') {
            event.preventDefault();
            this.open();
            this.childMenu?.focusFirstItem('keyboard');
          }
        }
        break;

      case LEFT_ARROW:
        if (!hasModifierKey(event)) {
          if (this._parentMenu && isParentVertical && this._directionality?.value === 'rtl') {
            event.preventDefault();
            this.open();
            this.childMenu?.focusFirstItem('keyboard');
          }
        }
        break;

      case DOWN_ARROW:
      case UP_ARROW:
        if (!hasModifierKey(event)) {
          if (!isParentVertical) {
            event.preventDefault();
            this.open();
            event.keyCode === DOWN_ARROW
              ? this.childMenu?.focusFirstItem('keyboard')
              : this.childMenu?.focusLastItem('keyboard');
          }
        }
        break;
    }
  }

  /**
   * Sets whether the trigger's menu stack has focus.
   *
   * 设置此触发器的菜单栈是否具有焦点。
   *
   * @param hasFocus Whether the menu stack has focus.
   *
   * 此菜单栈是否有焦点。
   *
   */
  _setHasFocus(hasFocus: boolean) {
    if (!this._parentMenu) {
      this.menuStack.setHasFocus(hasFocus);
    }
  }

  /**
   * Subscribe to the mouseenter events and close any sibling menu items if this element is moused
   * into.
   *
   * 订阅 mouseenter 事件并关闭任何同级菜单项（如果鼠标移入此元素）。
   *
   */
  private _subscribeToMouseEnter() {
    this._ngZone.runOutsideAngular(() => {
      fromEvent(this._elementRef.nativeElement, 'mouseenter')
        .pipe(
          filter(() => !this.menuStack.isEmpty() && !this.isOpen()),
          takeUntil(this.destroyed),
        )
        .subscribe(() => {
          // Closes any sibling menu items and opens the menu associated with this trigger.
          const toggleMenus = () =>
            this._ngZone.run(() => {
              this._closeSiblingTriggers();
              this.open();
            });

          if (this._menuAim) {
            this._menuAim.toggle(toggleMenus);
          } else {
            toggleMenus();
          }
        });
    });
  }

  /**
   * Close out any sibling menu trigger menus.
   *
   * 关闭任何由兄弟菜单触发的菜单。
   *
   */
  private _closeSiblingTriggers() {
    if (this._parentMenu) {
      // If nothing was removed from the stack and the last element is not the parent item
      // that means that the parent menu is a menu bar since we don't put the menu bar on the
      // stack
      const isParentMenuBar =
        !this.menuStack.closeSubMenuOf(this._parentMenu) &&
        this.menuStack.peek() !== this._parentMenu;

      if (isParentMenuBar) {
        this.menuStack.closeAll();
      }
    } else {
      this.menuStack.closeAll();
    }
  }

  /**
   * Get the configuration object used to create the overlay.
   *
   * 获取用于创建浮层的配置对象。
   *
   */
  private _getOverlayConfig() {
    return new OverlayConfig({
      positionStrategy: this._getOverlayPositionStrategy(),
      scrollStrategy: this._overlay.scrollStrategies.reposition(),
      direction: this._directionality || undefined,
    });
  }

  /**
   * Build the position strategy for the overlay which specifies where to place the menu.
   *
   * 为浮层构建位置策略，此浮层决定菜单要放的位置。
   *
   */
  private _getOverlayPositionStrategy(): FlexibleConnectedPositionStrategy {
    return this._overlay
      .position()
      .flexibleConnectedTo(this._elementRef)
      .withLockedPosition()
      .withGrowAfterOpen()
      .withPositions(this._getOverlayPositions());
  }

  /**
   * Get the preferred positions for the opened menu relative to the menu item.
   *
   * 获取打开的菜单相对于此菜单项的首选位置。
   *
   */
  private _getOverlayPositions(): ConnectedPosition[] {
    return (
      this.menuPosition ??
      (!this._parentMenu || this._parentMenu.orientation === 'horizontal'
        ? STANDARD_DROPDOWN_BELOW_POSITIONS
        : STANDARD_DROPDOWN_ADJACENT_POSITIONS)
    );
  }

  /**
   * Subscribe to the MenuStack close events if this is a standalone trigger and close out the menu
   * this triggers when requested.
   *
   * 如果这是一个独立的触发器，则订阅 MenuStack 的 close 事件，并在请求时关闭此触发的菜单。
   *
   */
  private _registerCloseHandler() {
    if (!this._parentMenu) {
      this.menuStack.closed.pipe(takeUntil(this.destroyed)).subscribe(({item}) => {
        if (item === this.childMenu) {
          this.close();
        }
      });
    }
  }

  /**
   * Subscribe to the overlays outside pointer events stream and handle closing out the stack if a
   * click occurs outside the menus.
   *
   * 订阅指针事件流外部的浮层，并在菜单外发生单击时处理关闭堆栈。
   *
   */
  private _subscribeToOutsideClicks() {
    if (this.overlayRef) {
      this.overlayRef
        .outsidePointerEvents()
        .pipe(takeUntil(this.stopOutsideClicksListener))
        .subscribe(event => {
          const target = _getEventTarget(event) as Element;
          const element = this._elementRef.nativeElement;

          if (target !== element && !element.contains(target)) {
            if (!this.isElementInsideMenuStack(target)) {
              this.menuStack.closeAll();
            } else {
              this._closeSiblingTriggers();
            }
          }
        });
    }
  }

  /**
   * Subscribe to the MenuStack hasFocus events.
   *
   * 订阅 MenuStack 的 hasFocus 事件。
   *
   */
  private _subscribeToMenuStackHasFocus() {
    if (!this._parentMenu) {
      this.menuStack.hasFocus.pipe(takeUntil(this.destroyed)).subscribe(hasFocus => {
        if (!hasFocus) {
          this.menuStack.closeAll();
        }
      });
    }
  }

  /**
   * Subscribe to the MenuStack closed events.
   *
   * 订阅 MenuStack 的 closed 事件。
   *
   */
  private _subscribeToMenuStackClosed() {
    if (!this._parentMenu) {
      this.menuStack.closed.subscribe(({focusParentTrigger}) => {
        if (focusParentTrigger && !this.menuStack.length()) {
          this._elementRef.nativeElement.focus();
        }
      });
    }
  }

  /**
   * Sets the role attribute for this trigger if needed.
   *
   * 如果需要，设置此触发器的 role 属性。
   *
   */
  private _setRole() {
    // If this trigger is part of another menu, the cdkMenuItem directive will handle setting the
    // role, otherwise this is a standalone trigger, and we should ensure it has role="button".
    if (!this._parentMenu) {
      this._elementRef.nativeElement.setAttribute('role', 'button');
    }
  }

  /** Sets thte `type` attribute of the trigger. */
  private _setType() {
    const element = this._elementRef.nativeElement;

    if (element.nodeName === 'BUTTON' && !element.getAttribute('type')) {
      // Prevents form submissions.
      element.setAttribute('type', 'button');
    }
  }
}
