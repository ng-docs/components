/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Directive} from '@angular/core';

import {
  CdkEditControl,
  CdkEditRevert,
  CdkEditClose,
  EditRef,
} from '@angular/cdk-experimental/popover-edit';

/**
 * A component that attaches to a form within the edit.
 * It coordinates the form state with the table-wide edit system and handles
 * closing the edit when the form is submitted or the user clicks
 * out.
 *
 * 在编辑中附着到表单的组件。它协调表单状态与全表编辑系统，并在提交表单或用户单击退出时处理关闭编辑。
 *
 */
@Directive({
  selector: 'form[matEditLens]',
  host: {
    'class': 'mat-edit-lens',
  },
  inputs: [
    'clickOutBehavior: matEditLensClickOutBehavior',
    'preservedFormValue: matEditLensPreservedFormValue',
    'ignoreSubmitUnlessValid: matEditLensIgnoreSubmitUnlessValid',
  ],
  outputs: ['preservedFormValueChange: matEditLensPreservedFormValueChange'],
  providers: [EditRef],
})
export class MatEditLens<FormValue> extends CdkEditControl<FormValue> {}

/**
 * Reverts the form to its initial or previously submitted state on click.
 *
 * 单击时将表单恢复到其初始或先前提交的状态。
 *
 */
@Directive({
  selector: 'button[matEditRevert]',
  host: {
    'type': 'button', // Prevents accidental form submits.
  },
})
export class MatEditRevert<FormValue> extends CdkEditRevert<FormValue> {}

/**
 * Closes the lens on click.
 *
 * 单击时关闭镜头。
 *
 */
@Directive({selector: '[matEditClose]'})
export class MatEditClose<FormValue> extends CdkEditClose<FormValue> {}
