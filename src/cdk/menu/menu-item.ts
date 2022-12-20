/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  Directive,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  NgZone,
  OnDestroy,
  Output,
} from '@angular/core';
import {BooleanInput, coerceBooleanProperty} from '@angular/cdk/coercion';
import {FocusableOption} from '@angular/cdk/a11y';
import {ENTER, hasModifierKey, LEFT_ARROW, RIGHT_ARROW, SPACE} from '@angular/cdk/keycodes';
import {Directionality} from '@angular/cdk/bidi';
import {fromEvent, Subject} from 'rxjs';
import {filter, takeUntil} from 'rxjs/operators';
import {CdkMenuTrigger} from './menu-trigger';
import {CDK_MENU, Menu} from './menu-interface';
import {FocusNext, MENU_STACK} from './menu-stack';
import {FocusableElement} from './pointer-focus-tracker';
import {MENU_AIM, Toggler} from './menu-aim';

/**
 * Directive which provides the ability for an element to be focused and navigated to using the
 * keyboard when residing in a CdkMenu, CdkMenuBar, or CdkMenuGroup. It performs user defined
 * behavior when clicked.
 *
 * 当位于 CdkMenu、CdkMenuBar 或 CdkMenuGroup 中时，该指令为元素提供使用键盘进行聚焦和导航的能力。它在单击时执行用户定义的行为。
 *
 */
@Directive({
  selector: '[cdkMenuItem]',
  exportAs: 'cdkMenuItem',
  standalone: true,
  host: {
    'role': 'menuitem',
    'class': 'cdk-menu-item',
    '[tabindex]': '_tabindex',
    '[attr.aria-disabled]': 'disabled || null',
    '(blur)': '_resetTabIndex()',
    '(focus)': '_setTabIndex()',
    '(click)': 'trigger()',
    '(keydown)': '_onKeydown($event)',
  },
})
export class CdkMenuItem implements FocusableOption, FocusableElement, Toggler, OnDestroy {
  /**
   * The directionality (text direction) of the current page.
   *
   * 当前页面的方向性（文本方向）。
   *
   */
  protected readonly _dir = inject(Directionality, {optional: true});

  /**
   * The menu's native DOM host element.
   *
   * 菜单的原生 DOM 宿主元素。
   *
   */
  readonly _elementRef: ElementRef<HTMLElement> = inject(ElementRef);

  /**
   * The Angular zone.
   *
   * Angular 区域（Zone）。
   *
   */
  protected _ngZone = inject(NgZone);

  /**
   * The menu aim service used by this menu.
   *
   * 此菜单使用的MenuAim 服务。
   *
   */
  private readonly _menuAim = inject(MENU_AIM, {optional: true});

  /**
   * The stack of menus this menu belongs to.
   *
   * 此菜单所属的菜单栈。
   *
   */
  private readonly _menuStack = inject(MENU_STACK);

  /**
   * The parent menu in which this menuitem resides.
   *
   * 此菜单项所在的父菜单。
   *
   */
  private readonly _parentMenu = inject(CDK_MENU, {optional: true});

  /**
   * Reference to the CdkMenuItemTrigger directive if one is added to the same element
   *
   * 如果将一个 CdkMenuItemTrigger 指令添加到同一元素，则引用该指令
   *
   */
  private readonly _menuTrigger = inject(CdkMenuTrigger, {optional: true, self: true});

  /**
   * Whether the CdkMenuItem is disabled - defaults to false
   *
   * CdkMenuItem 是否被禁用 - 默认为 false
   *
   */
  @Input('cdkMenuItemDisabled')
  get disabled(): boolean {
    return this._disabled;
  }
  set disabled(value: BooleanInput) {
    this._disabled = coerceBooleanProperty(value);
  }
  private _disabled = false;

  /**
   * The text used to locate this item during menu typeahead. If not specified,
   * the `textContent` of the item will be used.
   *
   * 在菜单预先输入期间用于定位此菜单项的文本。如果未指定，将使用菜单项的 `textContent` 。
   *
   */
  @Input('cdkMenuitemTypeaheadLabel') typeaheadLabel: string | null;

  /**
   * If this MenuItem is a regular MenuItem, outputs when it is triggered by a keyboard or mouse
   * event.
   *
   * 如果此 MenuItem 是常规 MenuItem，则在由键盘或鼠标事件触发时输出。
   *
   */
  @Output('cdkMenuItemTriggered') readonly triggered: EventEmitter<void> = new EventEmitter();

  /**
   * Whether the menu item opens a menu.
   *
   * 该菜单项是否已打开了某个菜单。
   *
   */
  readonly hasMenu = !!this._menuTrigger;

  /**
   * The tabindex for this menu item managed internally and used for implementing roving a
   * tab index.
   *
   * 此菜单项的 tabindex 在内部管理并用于实现漫游 `tabindex` 。
   *
   */
  _tabindex: 0 | -1 = -1;

  /**
   * Whether the item should close the menu if triggered by the spacebar.
   *
   * 如果由空格键触发，本菜单项是否应关闭此菜单。
   *
   */
  protected closeOnSpacebarTrigger = true;

  /**
   * Emits when the menu item is destroyed.
   *
   * 当此菜单项被销毁时发出。
   *
   */
  protected readonly destroyed = new Subject<void>();

  constructor() {
    this._setupMouseEnter();
    this._setType();

    if (this._isStandaloneItem()) {
      this._tabindex = 0;
    }
  }

  ngOnDestroy() {
    this.destroyed.next();
    this.destroyed.complete();
  }

  /**
   * Place focus on the element.
   *
   * 将焦点放在元素上。
   *
   */
  focus() {
    this._elementRef.nativeElement.focus();
  }

  /**
   * If the menu item is not disabled and the element does not have a menu trigger attached, emit
   * on the cdkMenuItemTriggered emitter and close all open menus.
   *
   * 如果此菜单项未禁用并且元素没有附着到某个菜单触发器，则在 cdkMenuItemTriggered 上发出事件并关闭所有打开的菜单。
   *
   * @param options Options the configure how the item is triggered
   *
   * 配置此菜单项如何触发的选项
   *
   * - keepOpen: specifies that the menu should be kept open after triggering the item.
   *
   *   keepOpen：指定触发此菜单项后菜单是否应保持打开状态。
   *
   */
  trigger(options?: {keepOpen: boolean}) {
    const {keepOpen} = {...options};
    if (!this.disabled && !this.hasMenu) {
      this.triggered.next();
      if (!keepOpen) {
        this._menuStack.closeAll({focusParentTrigger: true});
      }
    }
  }

  /**
   * Return true if this MenuItem has an attached menu and it is open.
   *
   * 如果此 MenuItem 有一个已附着的菜单并且它是打开的，则返回 true。
   *
   */
  isMenuOpen() {
    return !!this._menuTrigger?.isOpen();
  }

  /**
   * Get a reference to the rendered Menu if the Menu is open and it is visible in the DOM.
   *
   * 如果 Menu 已打开并且在 DOM 中可见，则获取对所渲染的 Menu 的引用。
   *
   * @return the menu if it is open, otherwise undefined.
   *
   * 如果菜单已打开则为此菜单，否则为 undefined。
   *
   */
  getMenu(): Menu | undefined {
    return this._menuTrigger?.getMenu();
  }

  /**
   * Get the CdkMenuTrigger associated with this element.
   *
   * 获取与此元素关联的 CdkMenuTrigger。
   *
   */
  getMenuTrigger(): CdkMenuTrigger | null {
    return this._menuTrigger;
  }

  /**
   * Get the label for this element which is required by the FocusableOption interface.
   *
   * 获取 FocusableOption 接口所需的本元素的标签。
   *
   */
  getLabel(): string {
    return this.typeaheadLabel || this._elementRef.nativeElement.textContent?.trim() || '';
  }

  /**
   * Reset the tabindex to -1.
   *
   * 将 tabindex 重置为 -1。
   *
   */
  _resetTabIndex() {
    if (!this._isStandaloneItem()) {
      this._tabindex = -1;
    }
  }

  /**
   * Set the tab index to 0 if not disabled and it's a focus event, or a mouse enter if this element
   * is not in a menu bar.
   *
   * 如果未禁用并且它是焦点事件，则将 `tabindex` 设置为 0，如果此元素不在菜单栏中，则将用鼠标输入。
   *
   */
  _setTabIndex(event?: MouseEvent) {
    if (this.disabled) {
      return;
    }

    // don't set the tabindex if there are no open sibling or parent menus
    if (!event || !this._menuStack.isEmpty()) {
      this._tabindex = 0;
    }
  }

  /**
   * Handles keyboard events for the menu item, specifically either triggering the user defined
   * callback or opening/closing the current menu based on whether the left or right arrow key was
   * pressed.
   *
   * 处理菜单项的键盘事件，特别是触发用户定义的回调或根据是否按下左箭头键或右箭头键来打开/关闭当前菜单。
   *
   * @param event the keyboard event to handle
   *
   * 要处理的键盘事件
   *
   */
  _onKeydown(event: KeyboardEvent) {
    switch (event.keyCode) {
      case SPACE:
      case ENTER:
        if (!hasModifierKey(event)) {
          event.preventDefault();
          this.trigger({keepOpen: event.keyCode === SPACE && !this.closeOnSpacebarTrigger});
        }
        break;

      case RIGHT_ARROW:
        if (!hasModifierKey(event)) {
          if (this._parentMenu && this._isParentVertical()) {
            if (this._dir?.value !== 'rtl') {
              this._forwardArrowPressed(event);
            } else {
              this._backArrowPressed(event);
            }
          }
        }
        break;

      case LEFT_ARROW:
        if (!hasModifierKey(event)) {
          if (this._parentMenu && this._isParentVertical()) {
            if (this._dir?.value !== 'rtl') {
              this._backArrowPressed(event);
            } else {
              this._forwardArrowPressed(event);
            }
          }
        }
        break;
    }
  }

  /**
   * Whether this menu item is standalone or within a menu or menu bar.
   *
   * 此菜单项是独立的还是位于菜单或菜单栏中。
   *
   */
  private _isStandaloneItem() {
    return !this._parentMenu;
  }

  /**
   * Handles the user pressing the back arrow key.
   *
   * 处理用户按下后退箭头键。
   *
   * @param event The keyboard event.
   *
   * 键盘事件。
   *
   */
  private _backArrowPressed(event: KeyboardEvent) {
    const parentMenu = this._parentMenu!;
    if (this._menuStack.hasInlineMenu() || this._menuStack.length() > 1) {
      event.preventDefault();
      this._menuStack.close(parentMenu, {
        focusNextOnEmpty:
          this._menuStack.inlineMenuOrientation() === 'horizontal'
            ? FocusNext.previousItem
            : FocusNext.currentItem,
        focusParentTrigger: true,
      });
    }
  }

  /**
   * Handles the user pressing the forward arrow key.
   *
   * 处理用户按下前进箭头键。
   *
   * @param event The keyboard event.
   *
   * 键盘事件。
   *
   */
  private _forwardArrowPressed(event: KeyboardEvent) {
    if (!this.hasMenu && this._menuStack.inlineMenuOrientation() === 'horizontal') {
      event.preventDefault();
      this._menuStack.closeAll({
        focusNextOnEmpty: FocusNext.nextItem,
        focusParentTrigger: true,
      });
    }
  }

  /**
   * Subscribe to the mouseenter events and close any sibling menu items if this element is moused
   * into.
   *
   * 订阅 mouseenter 事件并关闭任何同级菜单项（如果鼠标移入了此元素）。
   *
   */
  private _setupMouseEnter() {
    if (!this._isStandaloneItem()) {
      const closeOpenSiblings = () =>
        this._ngZone.run(() => this._menuStack.closeSubMenuOf(this._parentMenu!));

      this._ngZone.runOutsideAngular(() =>
        fromEvent(this._elementRef.nativeElement, 'mouseenter')
          .pipe(
            filter(() => !this._menuStack.isEmpty() && !this.hasMenu),
            takeUntil(this.destroyed),
          )
          .subscribe(() => {
            if (this._menuAim) {
              this._menuAim.toggle(closeOpenSiblings);
            } else {
              closeOpenSiblings();
            }
          }),
      );
    }
  }

  /**
   * Return true if the enclosing parent menu is configured in a horizontal orientation, false
   * otherwise or if no parent.
   *
   * 如果父菜单配置为水平方向，则返回 true，否则则返回 false，如果没有父菜单也返回 false。
   *
   */
  private _isParentVertical() {
    return this._parentMenu?.orientation === 'vertical';
  }

  /** Sets the `type` attribute of the menu item. */
  private _setType() {
    const element = this._elementRef.nativeElement;

    if (element.nodeName === 'BUTTON' && !element.getAttribute('type')) {
      // Prevent form submissions.
      element.setAttribute('type', 'button');
    }
  }
}
