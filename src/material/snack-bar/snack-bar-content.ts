/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Directive} from '@angular/core';

/**
 * Directive that should be applied to the text element to be rendered in the snack bar.
 *
 * 要应用于要在快餐栏中渲染的文本元素的指令。
 *
 */
@Directive({
  selector: `[matSnackBarLabel]`,
  host: {
    'class': 'mat-mdc-snack-bar-label mdc-snackbar__label',
  },
})
export class MatSnackBarLabel {}

/**
 * Directive that should be applied to the element containing the snack bar's action buttons.
 *
 * 要应用于包含快餐栏操作按钮的元素的指令。
 *
 */
@Directive({
  selector: `[matSnackBarActions]`,
  host: {
    'class': 'mat-mdc-snack-bar-actions mdc-snackbar__actions',
  },
})
export class MatSnackBarActions {}

/**
 * Directive that should be applied to each of the snack bar's action buttons.
 *
 * 要应用于快餐栏的每个操作按钮的指令。
 *
 */
@Directive({
  selector: `[matSnackBarAction]`,
  host: {
    'class': 'mat-mdc-snack-bar-action mdc-snackbar__action',
  },
})
export class MatSnackBarAction {}
