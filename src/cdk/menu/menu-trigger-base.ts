/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  Directive,
  EventEmitter,
  inject,
  InjectionToken,
  Injector,
  OnDestroy,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import {Menu} from './menu-interface';
import {MENU_STACK, MenuStack} from './menu-stack';
import {ConnectedPosition, OverlayRef} from '@angular/cdk/overlay';
import {TemplatePortal} from '@angular/cdk/portal';
import {merge, Subject} from 'rxjs';

/**
 * Injection token used for an implementation of MenuStack.
 *
 * 用于指定 MenuStack 实现的注入令牌。
 *
 */
export const MENU_TRIGGER = new InjectionToken<CdkMenuTriggerBase>('cdk-menu-trigger');

/**
 * Abstract directive that implements shared logic common to all menu triggers.
 * This class can be extended to create custom menu trigger types.
 *
 * 实现所有菜单触发器共有的共享逻辑的抽象指令。可以扩展此类以创建自定义菜单触发器类型。
 *
 */
@Directive({
  host: {
    '[attr.aria-controls]': 'childMenu?.id',
    '[attr.data-cdk-menu-stack-id]': 'menuStack.id',
  },
})
export abstract class CdkMenuTriggerBase implements OnDestroy {
  /**
   * The DI injector for this component.
   *
   * 此组件的 DI 注入器。
   *
   */
  readonly injector = inject(Injector);

  /**
   * The view container ref for this component
   *
   * 此组件的视图容器引用
   *
   */
  protected readonly viewContainerRef = inject(ViewContainerRef);

  /**
   * The menu stack in which this menu resides.
   *
   * 此菜单所在的菜单栈。
   *
   */
  protected readonly menuStack: MenuStack = inject(MENU_STACK);

  /**
   * A list of preferred menu positions to be used when constructing the
   * `FlexibleConnectedPositionStrategy` for this trigger's menu.
   *
   * 为该触发器的菜单构造 `FlexibleConnectedPositionStrategy` 时要使用的首选菜单位置列表。
   *
   */
  menuPosition: ConnectedPosition[];

  /**
   * Emits when the attached menu is requested to open
   *
   * 请求打开已附着菜单时发出
   *
   */
  readonly opened: EventEmitter<void> = new EventEmitter();

  /**
   * Emits when the attached menu is requested to close
   *
   * 当请求关闭已附着菜单时发出
   *
   */
  readonly closed: EventEmitter<void> = new EventEmitter();

  /**
   * Template reference variable to the menu this trigger opens
   *
   * 此触发器打开的菜单的模板引用变量
   *
   */
  menuTemplateRef: TemplateRef<unknown>;

  /** Context data to be passed along to the menu template */
  menuData: unknown;

  /**
   * A reference to the overlay which manages the triggered menu
   *
   * 对管理已触发菜单的浮层的引用
   *
   */
  protected overlayRef: OverlayRef | null = null;

  /**
   * Emits when this trigger is destroyed.
   *
   * 当此触发器被销毁时发出。
   *
   */
  protected readonly destroyed: Subject<void> = new Subject();

  /**
   * Emits when the outside pointer events listener on the overlay should be stopped.
   *
   * 当应该停止浮层上的外部指针事件侦听器时发出。
   *
   */
  protected readonly stopOutsideClicksListener = merge(this.closed, this.destroyed);

  /**
   * The child menu opened by this trigger.
   *
   * 此触发器打开的子菜单。
   *
   */
  protected childMenu?: Menu;

  /**
   * The content of the menu panel opened by this trigger.
   *
   * 此触发器打开的菜单面板的内容。
   *
   */
  private _menuPortal: TemplatePortal;

  /**
   * The injector to use for the child menu opened by this trigger.
   *
   * 用于此触发器打开的子菜单的注入器。
   *
   */
  private _childMenuInjector?: Injector;

  ngOnDestroy() {
    this._destroyOverlay();

    this.destroyed.next();
    this.destroyed.complete();
  }

  /**
   * Whether the attached menu is open.
   *
   * 已附着的菜单是否打开。
   *
   */
  isOpen() {
    return !!this.overlayRef?.hasAttached();
  }

  /**
   * Registers a child menu as having been opened by this trigger.
   *
   * 将子菜单注册为已被此触发器打开。
   *
   */
  registerChildMenu(child: Menu) {
    this.childMenu = child;
  }

  /**
   * Get the portal to be attached to the overlay which contains the menu. Allows for the menu
   * content to change dynamically and be reflected in the application.
   *
   * 获取要附着到的包含菜单的浮层的传送点。允许菜单内容动态变化并反映在应用程序中。
   *
   */
  protected getMenuContentPortal() {
    const hasMenuContentChanged = this.menuTemplateRef !== this._menuPortal?.templateRef;
    if (this.menuTemplateRef && (!this._menuPortal || hasMenuContentChanged)) {
      this._menuPortal = new TemplatePortal(
        this.menuTemplateRef,
        this.viewContainerRef,
        this.menuData,
        this._getChildMenuInjector(),
      );
    }

    return this._menuPortal;
  }

  /**
   * Whether the given element is inside the scope of this trigger's menu stack.
   *
   * 给定元素是否在此触发器的菜单栈范围内。
   *
   * @param element The element to check.
   *
   * 要检查的元素。
   *
   * @return Whether the element is inside the scope of this trigger's menu stack.
   *
   * 元素是否在此触发器的菜单栈范围内。
   *
   */
  protected isElementInsideMenuStack(element: Element) {
    for (let el: Element | null = element; el; el = el?.parentElement ?? null) {
      if (el.getAttribute('data-cdk-menu-stack-id') === this.menuStack.id) {
        return true;
      }
    }
    return false;
  }

  /**
   * Destroy and unset the overlay reference it if exists
   *
   * 如果存在，则销毁并取消设置浮层引用
   *
   */
  private _destroyOverlay() {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
  }

  /**
   * Gets the injector to use when creating a child menu.
   *
   * 获取创建子菜单时要用到的注入器。
   *
   */
  private _getChildMenuInjector() {
    this._childMenuInjector =
      this._childMenuInjector ||
      Injector.create({
        providers: [
          {provide: MENU_TRIGGER, useValue: this},
          {provide: MENU_STACK, useValue: this.menuStack},
        ],
        parent: this.injector,
      });
    return this._childMenuInjector;
  }
}
