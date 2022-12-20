/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Directive, inject, Injectable, Input, OnDestroy} from '@angular/core';
import {Directionality} from '@angular/cdk/bidi';
import {
  FlexibleConnectedPositionStrategy,
  Overlay,
  OverlayConfig,
  STANDARD_DROPDOWN_BELOW_POSITIONS,
} from '@angular/cdk/overlay';
import {BooleanInput, coerceBooleanProperty} from '@angular/cdk/coercion';
import {_getEventTarget} from '@angular/cdk/platform';
import {merge, partition} from 'rxjs';
import {skip, takeUntil} from 'rxjs/operators';
import {MENU_STACK, MenuStack} from './menu-stack';
import {CdkMenuTriggerBase, MENU_TRIGGER} from './menu-trigger-base';

/**
 * The preferred menu positions for the context menu.
 *
 * 上下文菜单的首选菜单位置。
 *
 */
const CONTEXT_MENU_POSITIONS = STANDARD_DROPDOWN_BELOW_POSITIONS.map(position => {
  // In cases where the first menu item in the context menu is a trigger the submenu opens on a
  // hover event. We offset the context menu 2px by default to prevent this from occurring.
  const offsetX = position.overlayX === 'start' ? 2 : -2;
  const offsetY = position.overlayY === 'top' ? 2 : -2;
  return {...position, offsetX, offsetY};
});

/**
 * Tracks the last open context menu trigger across the entire application.
 *
 * 跟踪整个应用程序中最后打开的上下文菜单触发器。
 *
 */
@Injectable({providedIn: 'root'})
export class ContextMenuTracker {
  /**
   * The last open context menu trigger.
   *
   * 最后一个打开的上下文菜单触发器。
   *
   */
  private static _openContextMenuTrigger?: CdkContextMenuTrigger;

  /**
   * Close the previous open context menu and set the given one as being open.
   *
   * 关闭上一个打开的上下文菜单并将给定的菜单设置为打开。
   *
   * @param trigger The trigger for the currently open Context Menu.
   *
   * 当前打开的上下文菜单的触发器。
   *
   */
  update(trigger: CdkContextMenuTrigger) {
    if (ContextMenuTracker._openContextMenuTrigger !== trigger) {
      ContextMenuTracker._openContextMenuTrigger?.close();
      ContextMenuTracker._openContextMenuTrigger = trigger;
    }
  }
}

/**
 * The coordinates where the context menu should open.
 *
 * 上下文菜单应打开的坐标。
 *
 */
export type ContextMenuCoordinates = {x: number; y: number};

/**
 * A directive that opens a menu when a user right-clicks within its host element.
 * It is aware of nested context menus and will trigger only the lowest level non-disabled context menu.
 *
 * 当用户在其宿主元素中右键单击时打开菜单的指令。它知道嵌套的上下文菜单，并且只会触发最低级别的非禁用上下文菜单。
 *
 */
@Directive({
  selector: '[cdkContextMenuTriggerFor]',
  exportAs: 'cdkContextMenuTriggerFor',
  standalone: true,
  host: {
    '[attr.data-cdk-menu-stack-id]': 'null',
    '(contextmenu)': '_openOnContextMenu($event)',
  },
  inputs: [
    'menuTemplateRef: cdkContextMenuTriggerFor',
    'menuPosition: cdkContextMenuPosition',
    'menuData: cdkContextMenuTriggerData',
  ],
  outputs: ['opened: cdkContextMenuOpened', 'closed: cdkContextMenuClosed'],
  providers: [
    {provide: MENU_TRIGGER, useExisting: CdkContextMenuTrigger},
    {provide: MENU_STACK, useClass: MenuStack},
  ],
})
export class CdkContextMenuTrigger extends CdkMenuTriggerBase implements OnDestroy {
  /**
   * The CDK overlay service.
   *
   * CDK 浮层服务。
   *
   */
  private readonly _overlay = inject(Overlay);

  /**
   * The directionality of the page.
   *
   * 页面的方向性。
   *
   */
  private readonly _directionality = inject(Directionality, {optional: true});

  /**
   * The app's context menu tracking registry
   *
   * 应用程序的上下文菜单跟踪注册表
   *
   */
  private readonly _contextMenuTracker = inject(ContextMenuTracker);

  /**
   * Whether the context menu is disabled.
   *
   * 上下文菜单是否被禁用。
   *
   */
  @Input('cdkContextMenuDisabled')
  get disabled(): boolean {
    return this._disabled;
  }
  set disabled(value: BooleanInput) {
    this._disabled = coerceBooleanProperty(value);
  }
  private _disabled = false;

  constructor() {
    super();
    this._setMenuStackCloseListener();
  }

  /**
   * Open the attached menu at the specified location.
   *
   * 在指定位置打开已附着的菜单。
   *
   * @param coordinates where to open the context menu
   *
   * 在哪里打开上下文菜单
   *
   */
  open(coordinates: ContextMenuCoordinates) {
    this._open(coordinates, false);
  }

  /**
   * Close the currently opened context menu.
   *
   * 关闭当前打开的上下文菜单。
   *
   */
  close() {
    this.menuStack.closeAll();
  }

  /**
   * Open the context menu and closes any previously open menus.
   *
   * 打开上下文菜单并关闭任何以前打开的菜单。
   *
   * @param event the mouse event which opens the context menu.
   *
   * 导致打开此上下文菜单的鼠标事件。
   *
   */
  _openOnContextMenu(event: MouseEvent) {
    if (!this.disabled) {
      // Prevent the native context menu from opening because we're opening a custom one.
      event.preventDefault();

      // Stop event propagation to ensure that only the closest enabled context menu opens.
      // Otherwise, any context menus attached to containing elements would *also* open,
      // resulting in multiple stacked context menus being displayed.
      event.stopPropagation();

      this._contextMenuTracker.update(this);
      this._open({x: event.clientX, y: event.clientY}, true);

      // A context menu can be triggered via a mouse right click or a keyboard shortcut.
      if (event.button === 2) {
        this.childMenu?.focusFirstItem('mouse');
      } else if (event.button === 0) {
        this.childMenu?.focusFirstItem('keyboard');
      } else {
        this.childMenu?.focusFirstItem('program');
      }
    }
  }

  /**
   * Get the configuration object used to create the overlay.
   *
   * 获取用于创建浮层的配置对象。
   *
   * @param coordinates the location to place the opened menu
   *
   * 放置已打开菜单的位置
   *
   */
  private _getOverlayConfig(coordinates: ContextMenuCoordinates) {
    return new OverlayConfig({
      positionStrategy: this._getOverlayPositionStrategy(coordinates),
      scrollStrategy: this._overlay.scrollStrategies.reposition(),
      direction: this._directionality || undefined,
    });
  }

  /**
   * Get the position strategy for the overlay which specifies where to place the menu.
   *
   * 获取指定菜单放置位置的浮层的位置策略。
   *
   * @param coordinates the location to place the opened menu
   *
   * 放置所打开的菜单的位置
   *
   */
  private _getOverlayPositionStrategy(
    coordinates: ContextMenuCoordinates,
  ): FlexibleConnectedPositionStrategy {
    return this._overlay
      .position()
      .flexibleConnectedTo(coordinates)
      .withLockedPosition()
      .withGrowAfterOpen()
      .withPositions(this.menuPosition ?? CONTEXT_MENU_POSITIONS);
  }

  /**
   * Subscribe to the menu stack close events and close this menu when requested.
   *
   * 订阅菜单栈关闭事件并在请求时关闭此菜单。
   *
   */
  private _setMenuStackCloseListener() {
    this.menuStack.closed.pipe(takeUntil(this.destroyed)).subscribe(({item}) => {
      if (item === this.childMenu && this.isOpen()) {
        this.closed.next();
        this.overlayRef!.detach();
      }
    });
  }

  /**
   * Subscribe to the overlays outside pointer events stream and handle closing out the stack if a
   * click occurs outside the menus.
   *
   * 订阅浮层外部的指针事件流，并在菜单外发生单击时处理关闭堆栈。
   *
   * @param ignoreFirstAuxClick Whether to ignore the first auxclick event outside the menu.
   *
   * 是否忽略菜单外的第一个 auxclick 事件。
   *
   */
  private _subscribeToOutsideClicks(ignoreFirstAuxClick: boolean) {
    if (this.overlayRef) {
      let outsideClicks = this.overlayRef.outsidePointerEvents();
      // If the menu was triggered by the `contextmenu` event, skip the first `auxclick` event
      // because it fires when the mouse is released on the same click that opened the menu.
      if (ignoreFirstAuxClick) {
        const [auxClicks, nonAuxClicks] = partition(outsideClicks, ({type}) => type === 'auxclick');
        outsideClicks = merge(nonAuxClicks, auxClicks.pipe(skip(1)));
      }
      outsideClicks.pipe(takeUntil(this.stopOutsideClicksListener)).subscribe(event => {
        if (!this.isElementInsideMenuStack(_getEventTarget(event)!)) {
          this.menuStack.closeAll();
        }
      });
    }
  }

  /**
   * Open the attached menu at the specified location.
   *
   * 在指定位置打开附着的菜单。
   *
   * @param coordinates where to open the context menu
   *
   * 在哪里打开上下文菜单
   *
   * @param ignoreFirstOutsideAuxClick Whether to ignore the first auxclick outside the menu after opening.
   *
   * 打开后是否忽略菜单外的第一次辅助（aux）点击。
   *
   */
  private _open(coordinates: ContextMenuCoordinates, ignoreFirstOutsideAuxClick: boolean) {
    if (this.disabled) {
      return;
    }
    if (this.isOpen()) {
      // since we're moving this menu we need to close any submenus first otherwise they end up
      // disconnected from this one.
      this.menuStack.closeSubMenuOf(this.childMenu!);

      (
        this.overlayRef!.getConfig().positionStrategy as FlexibleConnectedPositionStrategy
      ).setOrigin(coordinates);
      this.overlayRef!.updatePosition();
    } else {
      this.opened.next();

      if (this.overlayRef) {
        (
          this.overlayRef.getConfig().positionStrategy as FlexibleConnectedPositionStrategy
        ).setOrigin(coordinates);
        this.overlayRef.updatePosition();
      } else {
        this.overlayRef = this._overlay.create(this._getOverlayConfig(coordinates));
      }

      this.overlayRef.attach(this.getMenuContentPortal());
      this._subscribeToOutsideClicks(ignoreFirstOutsideAuxClick);
    }
  }
}
