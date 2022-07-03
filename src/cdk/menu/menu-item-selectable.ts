/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {BooleanInput, coerceBooleanProperty} from '@angular/cdk/coercion';
import {Directive, Input} from '@angular/core';
import {CdkMenuItem} from './menu-item';

/**
 * Base class providing checked state for selectable MenuItems.
 *
 * 为可选择的 MenuItems 提供检查状态的基类。
 *
 */
@Directive({
  host: {
    '[attr.aria-checked]': '!!checked',
    '[attr.aria-disabled]': 'disabled || null',
  },
})
export abstract class CdkMenuItemSelectable extends CdkMenuItem {
  /**
   * Whether the element is checked
   *
   * 是否已选中此元素
   *
   */
  @Input('cdkMenuItemChecked')
  get checked(): boolean {
    return this._checked;
  }
  set checked(value: BooleanInput) {
    this._checked = coerceBooleanProperty(value);
  }
  private _checked = false;

  /**
   * Whether the item should close the menu if triggered by the spacebar.
   *
   * 如果由空格键触发，此菜单项是否应关闭菜单。
   *
   */
  protected override closeOnSpacebarTrigger = false;
}
