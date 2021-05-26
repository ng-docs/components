/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  Directive,
  forwardRef,
  Provider,
} from '@angular/core';
import {
  CheckboxRequiredValidator,
  NG_VALIDATORS,
} from '@angular/forms';

export const MAT_CHECKBOX_REQUIRED_VALIDATOR: Provider = {
  provide: NG_VALIDATORS,
  useExisting: forwardRef(() => MatCheckboxRequiredValidator),
  multi: true
};

/**
 * Validator for Material checkbox's required attribute in template-driven checkbox.
 * Current CheckboxRequiredValidator only work with `input type=checkbox` and does not
 * work with `mat-checkbox`.
 *
 * 一个验证器，用于验证 Material 复选框在模板驱动复选框中的必填属性。目前 CheckboxRequiredValidator 只能用于 `input type=checkbox`，而且不能用于 `mat-checkbox`。
 *
 */
@Directive({
  selector: `mat-checkbox[required][formControlName],
             mat-checkbox[required][formControl], mat-checkbox[required][ngModel]`,
  providers: [MAT_CHECKBOX_REQUIRED_VALIDATOR],
})
export class MatCheckboxRequiredValidator extends CheckboxRequiredValidator {}
