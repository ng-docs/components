/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Directive, InjectionToken, Input} from '@angular/core';

let nextUniqueId = 0;

/**
 * Injection token that can be used to reference instances of `MatHint`. It serves as
 * alternative token to the actual `MatHint` class which could cause unnecessary
 * retention of the class and its directive metadata.
 *
 * 这个注入令牌可以用来引用 `MatHint` 实例。它可以作为实际 `MatHint` 类的备用令牌，直接使用实际类可能导致该类及其元数据无法被优化掉。
 *
 * *Note*: This is not part of the public API as the MDC-based form-field will not
 * need a lightweight token for `MatHint` and we want to reduce breaking changes.
 *
 * *注意*：这不是公共 API 的一部分，因为基于 MDC 的表单字段不需要 `MatHint` 的轻量级令牌，而我们希望减少重大变更。
 *
 */
export const _MAT_HINT = new InjectionToken<MatHint>('MatHint');

/**
 * Hint text to be shown underneath the form field control.
 *
 * 提示文本显示在表单字段控件的下方。
 *
 */
@Directive({
  selector: 'mat-hint',
  host: {
    'class': 'mat-hint',
    '[class.mat-form-field-hint-end]': 'align === "end"',
    '[attr.id]': 'id',
    // Remove align attribute to prevent it from interfering with layout.
    '[attr.align]': 'null',
  },
  providers: [{provide: _MAT_HINT, useExisting: MatHint}],
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
  @Input() id: string = `mat-hint-${nextUniqueId++}`;
}
