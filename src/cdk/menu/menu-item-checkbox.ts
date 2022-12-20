/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Directive} from '@angular/core';
import {CdkMenuItemSelectable} from './menu-item-selectable';
import {CdkMenuItem} from './menu-item';

/**
 * A directive providing behavior for the "menuitemcheckbox" ARIA role, which behaves similarly to a
 * conventional checkbox.
 *
 * 为 “menuitemcheckbox” ARIA 角色提供行为的指令，其行为类似于传统的复选框。
 *
 */
@Directive({
  selector: '[cdkMenuItemCheckbox]',
  exportAs: 'cdkMenuItemCheckbox',
  standalone: true,
  host: {
    'role': 'menuitemcheckbox',
    '[class.cdk-menu-item-checkbox]': 'true',
  },
  providers: [
    {provide: CdkMenuItemSelectable, useExisting: CdkMenuItemCheckbox},
    {provide: CdkMenuItem, useExisting: CdkMenuItemSelectable},
  ],
})
export class CdkMenuItemCheckbox extends CdkMenuItemSelectable {
  /**
   * Toggle the checked state of the checkbox.
   *
   * 切换复选框的选中状态。
   *
   * @param options Options the configure how the item is triggered
   *
   * 配置菜单项如何触发的选项
   *
   * - keepOpen: specifies that the menu should be kept open after triggering the item.
   *
   *   keepOpen：指定触发项后菜单应保持打开状态。
   *
   */
  override trigger(options?: {keepOpen: boolean}) {
    super.trigger(options);

    if (!this.disabled) {
      this.checked = !this.checked;
    }
  }
}
