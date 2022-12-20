/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Directive, InjectionToken, Input} from '@angular/core';

/**
 * Injection token that can be used to reference instances of `MatPrefix`. It serves as
 * alternative token to the actual `MatPrefix` class which could cause unnecessary
 * retention of the class and its directive metadata.
 *
 * 这个注入令牌可以用来引用 `MatPrefix` 实例。它可以作为实际 `MatPrefix` 类的备用令牌，直接使用实际类可能导致该类及其元数据无法被优化掉。
 *
 */
export const MAT_PREFIX = new InjectionToken<MatPrefix>('MatPrefix');

/**
 * Prefix to be placed in front of the form field.
 *
 * 要放在表单字段前面的前缀。
 *
 */
@Directive({
  selector: '[matPrefix], [matIconPrefix], [matTextPrefix]',
  providers: [{provide: MAT_PREFIX, useExisting: MatPrefix}],
})
export class MatPrefix {
  @Input('matTextPrefix')
  set _isTextSelector(value: '') {
    this._isText = true;
  }

  _isText = false;
}
