/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Directive, InjectionToken, Input} from '@angular/core';

/**
 * Injection token that can be used to reference instances of `MatSuffix`. It serves as
 * alternative token to the actual `MatSuffix` class which could cause unnecessary
 * retention of the class and its directive metadata.
 *
 * 这个注入令牌可以用来引用 `MatSuffix` 实例。它可以作为实际 `MatSuffix` 类的备用令牌，直接使用实际类可能导致该类及其元数据无法被优化掉。
 *
 */
export const MAT_SUFFIX = new InjectionToken<MatSuffix>('MatSuffix');

/**
 * Suffix to be placed at the end of the form field.
 *
 * 后缀放在表单字段的末尾。
 *
 */
@Directive({
  selector: '[matSuffix], [matIconSuffix], [matTextSuffix]',
  providers: [{provide: MAT_SUFFIX, useExisting: MatSuffix}],
})
export class MatSuffix {
  @Input('matTextSuffix')
  set _isTextSelector(value: '') {
    this._isText = true;
  }

  _isText = false;
}
