/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Directive} from '@angular/core';
import {_MatMenuContentBase, _MatMenuTriggerBase, MAT_MENU_CONTENT} from '@angular/material/menu';

/**
 * Directive applied to an element that should trigger a `mat-menu`.
 *
 * 用于应触发 `mat-menu` 的元素的指令。
 *
 */
@Directive({
  selector: `[mat-menu-trigger-for], [matMenuTriggerFor]`,
  host: {
    'class': 'mat-mdc-menu-trigger',
  },
  exportAs: 'matMenuTrigger',
})
export class MatMenuTrigger extends _MatMenuTriggerBase {}

/**
 * Menu content that will be rendered lazily once the menu is opened.
 *
 * 打开菜单后将延迟渲染的菜单内容。
 *
 */
@Directive({
  selector: 'ng-template[matMenuContent]',
  providers: [{provide: MAT_MENU_CONTENT, useExisting: MatMenuContent}],
})
export class MatMenuContent extends _MatMenuContentBase {}
