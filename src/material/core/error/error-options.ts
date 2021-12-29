/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Injectable} from '@angular/core';
import {FormGroupDirective, NgForm, AbstractControl} from '@angular/forms';

/**
 * Error state matcher that matches when a control is invalid and dirty.
 *
 * 当控件无效且已脏时会匹配的错误状态匹配器。
 *
 */
@Injectable()
export class ShowOnDirtyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: AbstractControl | null, form: FormGroupDirective | NgForm | null): boolean {
    return !!(control && control.invalid && (control.dirty || (form && form.submitted)));
  }
}

/**
 * Provider that defines how form controls behave with regards to displaying error messages.
 *
 * 一个提供者，用于定义表单控件在显示错误消息方面的行为。
 *
 */
@Injectable({providedIn: 'root'})
export class ErrorStateMatcher {
  isErrorState(control: AbstractControl | null, form: FormGroupDirective | NgForm | null): boolean {
    return !!(control && control.invalid && (control.touched || (form && form.submitted)));
  }
}
