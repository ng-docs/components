/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Directive, Input} from '@angular/core';

let nextUniqueId = 0;

/**
 * Hint text to be shown underneath the form field control.
 *
 * 提示文本显示在表单字段控件的下方。
 *
 */
@Directive({
  selector: 'mat-hint',
  host: {
    'class': 'mat-mdc-form-field-hint mat-mdc-form-field-bottom-align',
    '[class.mat-mdc-form-field-hint-end]': 'align === "end"',
    '[id]': 'id',
    // Remove align attribute to prevent it from interfering with layout.
    '[attr.align]': 'null',
  },
})
export class MatHint {
  /**
   * Whether to align the hint label at the start or end of the line.
   *
   * 把提示标签对齐到行的开头还是结尾。
   *
   */
  @Input() align: 'start' | 'end' = 'start';

  /**
   * Unique ID for the hint. Used for the aria-describedby on the form field control.
   *
   * 提示的唯一 ID。用于表单字段控件中的 aria-describedby。
   *
   */
  @Input() id: string = `mat-mdc-hint-${nextUniqueId++}`;
}
