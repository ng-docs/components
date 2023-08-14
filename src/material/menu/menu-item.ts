/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewEncapsulation,
  Inject,
  Optional,
  Input,
  AfterViewInit,
  ChangeDetectorRef,
} from '@angular/core';
import {
  CanDisable,
  CanDisableRipple,
  mixinDisabled,
  mixinDisableRipple,
} from '@angular/material/core';
import {FocusableOption, FocusMonitor, FocusOrigin} from '@angular/cdk/a11y';
import {Subject} from 'rxjs';
import {DOCUMENT} from '@angular/common';
import {MatMenuPanel, MAT_MENU_PANEL} from './menu-panel';

// Boilerplate for applying mixins to MatMenuItem.
/** @docs-private */
const _MatMenuItemBase = mixinDisableRipple(mixinDisabled(class {}));

/**
 * Single item inside a `mat-menu`. Provides the menu item styling and accessibility treatment.
 *
 * `mat-menu` 里面的单个菜单项。提供菜单项样式和无障碍性处理。
 *
 */
@Component({
  selector: '[mat-menu-item]',
  exportAs: 'matMenuItem',
  inputs: ['disabled', 'disableRipple'],
  host: {
    '[attr.role]': 'role',
    'class': 'mat-mdc-menu-item mat-mdc-focus-indicator',
    '[class.mat-mdc-menu-item-highlighted]': '_highlighted',
    '[class.mat-mdc-menu-item-submenu-trigger]': '_triggersSubmenu',
    '[attr.tabindex]': '_getTabIndex()',
    '[attr.aria-disabled]': 'disabled',
    '[attr.disabled]': 'disabled || null',
    '(click)': '_checkDisabled($event)',
    '(mouseenter)': '_handleMouseEnter()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: 'menu-item.html',
})
export class MatMenuItem
  extends _MatMenuItemBase
  implements FocusableOption, CanDisable, CanDisableRipple, AfterViewInit, OnDestroy
{
  /**
   * ARIA role for the menu item.
   *
   * 菜单项的 ARIA 角色。
   *
   */
  @Input() role: 'menuitem' | 'menuitemradio' | 'menuitemcheckbox' = 'menuitem';

  /**
   * Stream that emits when the menu item is hovered.
   *
   * 当菜单项悬停时会发出流。
   *
   */
  readonly _hovered: Subject<MatMenuItem> = new Subject<MatMenuItem>();

  /**
   * Stream that emits when the menu item is focused.
   *
   * 当菜单项获得焦点时会发出流。
   *
   */
  readonly _focused = new Subject<MatMenuItem>();

  /**
   * Whether the menu item is highlighted.
   *
   * 该菜单项是否突出显示。
   *
   */
  _highlighted: boolean = false;

  /**
   * Whether the menu item acts as a trigger for a sub-menu.
   *
   * 菜单项是否作为子菜单的触发器。
   *
   */
  _triggersSubmenu: boolean = false;

  constructor(
    elementRef: ElementRef<HTMLElement>,
    document: any,
    focusMonitor: FocusMonitor,
    parentMenu: MatMenuPanel<MatMenuItem> | undefined,
    changeDetectorRef: ChangeDetectorRef,
  );

  /**
   * @deprecated
   *
   * `document`, `changeDetectorRef` and `focusMonitor` to become required.
   *
   * `document` ， `changeDetectorRef` 和 `focusMonitor` 成了必要参数。
   *
   * @breaking-change 12.0.0
   */
  constructor(
    elementRef: ElementRef<HTMLElement>,
    document?: any,
    focusMonitor?: FocusMonitor,
    parentMenu?: MatMenuPanel<MatMenuItem>,
    changeDetectorRef?: ChangeDetectorRef,
  );

  constructor(
    private _elementRef: ElementRef<HTMLElement>,
    @Inject(DOCUMENT) private _document?: any,
    private _focusMonitor?: FocusMonitor,
    @Inject(MAT_MENU_PANEL) @Optional() public _parentMenu?: MatMenuPanel<MatMenuItem>,
    private _changeDetectorRef?: ChangeDetectorRef,
  ) {
    super();
    _parentMenu?.addItem?.(this);
  }

  /**
   * Focuses the menu item.
   *
   * 让本菜单项获得焦点。
   *
   */
  focus(origin?: FocusOrigin, options?: FocusOptions): void {
    if (this._focusMonitor && origin) {
      this._focusMonitor.focusVia(this._getHostElement(), origin, options);
    } else {
      this._getHostElement().focus(options);
    }

    this._focused.next(this);
  }

  ngAfterViewInit() {
    if (this._focusMonitor) {
      // Start monitoring the element, so it gets the appropriate focused classes. We want
      // to show the focus style for menu items only when the focus was not caused by a
      // mouse or touch interaction.
      this._focusMonitor.monitor(this._elementRef, false);
    }
  }

  ngOnDestroy() {
    if (this._focusMonitor) {
      this._focusMonitor.stopMonitoring(this._elementRef);
    }

    if (this._parentMenu && this._parentMenu.removeItem) {
      this._parentMenu.removeItem(this);
    }

    this._hovered.complete();
    this._focused.complete();
  }

  /**
   * Used to set the `tabindex`.
   *
   * 用来设置 `tabindex`。
   *
   */
  _getTabIndex(): string {
    return this.disabled ? '-1' : '0';
  }

  /**
   * Returns the host DOM element.
   *
   * 返回宿主 DOM 元素。
   *
   */
  _getHostElement(): HTMLElement {
    return this._elementRef.nativeElement;
  }

  /**
   * Prevents the default element actions if it is disabled.
   *
   * 如果被禁用了，就会阻止默认元素上的操作
   *
   */
  _checkDisabled(event: Event): void {
    if (this.disabled) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  /**
   * Emits to the hover stream.
   *
   * 发送悬停流。
   *
   */
  _handleMouseEnter() {
    this._hovered.next(this);
  }

  /**
   * Gets the label to be used when determining whether the option should be focused.
   *
   * 获取在确定该选项是否应该获得焦点时使用的标签。
   *
   */
  getLabel(): string {
    const clone = this._elementRef.nativeElement.cloneNode(true) as HTMLElement;
    const icons = clone.querySelectorAll('mat-icon, .material-icons');

    // Strip away icons, so they don't show up in the text.
    for (let i = 0; i < icons.length; i++) {
      icons[i].remove();
    }

    return clone.textContent?.trim() || '';
  }

  _setHighlighted(isHighlighted: boolean) {
    // We need to mark this for check for the case where the content is coming from a
    // `matMenuContent` whose change detection tree is at the declaration position,
    // not the insertion position. See #23175.
    // @breaking-change 12.0.0 Remove null check for `_changeDetectorRef`.
    this._highlighted = isHighlighted;
    this._changeDetectorRef?.markForCheck();
  }

  _setTriggersSubmenu(triggersSubmenu: boolean) {
    // @breaking-change 12.0.0 Remove null check for `_changeDetectorRef`.
    this._triggersSubmenu = triggersSubmenu;
    this._changeDetectorRef?.markForCheck();
  }

  _hasFocus(): boolean {
    return this._document && this._document.activeElement === this._getHostElement();
  }
}
