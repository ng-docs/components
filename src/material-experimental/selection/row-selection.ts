/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {CdkRowSelection} from '@angular/cdk-experimental/selection';
import {Input, Directive} from '@angular/core';

/**
 * Applies `mat-selected` class and `aria-selected` to an element.
 *
 * 将 `mat-selected` 类和 `aria-selected` 应用于元素。
 *
 * Must be used within a parent `MatSelection` directive.
 * Must be provided with the value. The index is required if `trackBy` is used on the `CdkSelection`
 * directive.
 *
 * 必须在父 `MatSelection` 指令中使用。必须提供值。如果在 `trackBy` 指令上使用 `CdkSelection` ，则需要索引。
 *
 */
@Directive({
  selector: '[matRowSelection]',
  host: {
    '[class.mat-selected]': '_selection.isSelected(this.value, this.index)',
    '[attr.aria-selected]': '_selection.isSelected(this.value, this.index)',
  },
  providers: [{provide: CdkRowSelection, useExisting: MatRowSelection}],
  inputs: ['index: matRowSelectionIndex'],
})
export class MatRowSelection<T> extends CdkRowSelection<T> {
  /**
   * The value that is associated with the row
   *
   * 与本行关联的值
   *
   */
  @Input('matRowSelectionValue') override value: T;
}
