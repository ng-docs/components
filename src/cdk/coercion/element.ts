/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ElementRef} from '@angular/core';

/**
 * Coerces an ElementRef or an Element into an element.
 * Useful for APIs that can accept either a ref or the native element itself.
 *
 * 把 ElementRef 或 Element 强制转换成一个 element。这对于可同时接受元素引用或 native 元素本身的 API 很有用。
 *
 */
export function coerceElement<T>(elementOrRef: ElementRef<T> | T): T {
  return elementOrRef instanceof ElementRef ? elementOrRef.nativeElement : elementOrRef;
}
