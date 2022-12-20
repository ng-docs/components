/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Directive} from '@angular/core';

/**
 * The placeholder text for an `MatFormField`.
 *
 * `MatFormField` 的占位符文本。
 *
 * @deprecated
 *
 * Use `<mat-label>` to specify the label and the `placeholder` attribute to specify the
 *     placeholder.
 *
 * 使用 `<mat-label>` 指定标签，使用 `placeholder` 属性指定占位符。
 *
 * @breaking-change 8.0.0
 */
@Directive({
  selector: 'mat-placeholder',
})
export class MatLegacyPlaceholder {}
