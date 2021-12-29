/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Directive, forwardRef, Provider} from '@angular/core';
import {CheckboxRequiredValidator, NG_VALIDATORS} from '@angular/forms';

export const MAT_SLIDE_TOGGLE_REQUIRED_VALIDATOR: Provider = {
  provide: NG_VALIDATORS,
  useExisting: forwardRef(() => MatSlideToggleRequiredValidator),
  multi: true,
};

/**
 * Validator for Material slide-toggle components with the required attribute in a
 * template-driven form. The default validator for required form controls asserts
 * that the control value is not undefined but that is not appropriate for a slide-toggle
 * where the value is always defined.
 *
 * Material 滑块开关组件的验证器，在模板驱动表单中具有 required 属性。
 * 默认的验证器需要表单控件确保其值不是 undefined，但是这对于永远是已定义值的滑块开关是不合适的。
 *
 * Required slide-toggle form controls are valid when checked.
 *
 * 当检查时，滑块开关表单控件的必填项验证总是有效的。
 *
 */
@Directive({
  selector: `mat-slide-toggle[required][formControlName],
             mat-slide-toggle[required][formControl], mat-slide-toggle[required][ngModel]`,
  providers: [MAT_SLIDE_TOGGLE_REQUIRED_VALIDATOR],
})
export class MatSlideToggleRequiredValidator extends CheckboxRequiredValidator {}
