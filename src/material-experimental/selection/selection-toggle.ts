/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {CdkSelectionToggle} from '@angular/cdk-experimental/selection';
import {Directive, Input} from '@angular/core';

/**
 * Makes the element a selection toggle.
 *
 * 使元素成为选择开关。
 *
 * Must be used within a parent `MatSelection` directive.
 * Must be provided with the value. If `trackBy` is used on `MatSelection`, the index of the value
 * is required. If the element implements `ControlValueAccessor`, e.g. `MatCheckbox`, the directive
 * automatically connects it with the selection state provided by the `MatSelection` directive. If
 * not, use `checked$` to get the checked state of the value, and `toggle()` to change the selection
 * state.
 *
 * 必须在父 `MatSelection` 指令中使用。必须提供值。如果在 `trackBy` 上使用 `MatSelection` ，则需要值的索引。如果该元素实现了 `ControlValueAccessor` ，例如 `MatCheckbox` ，指令会自动将它与 `MatSelection` 指令提供的选择状态连接起来。如果不是，则使用 `checked$` 获取值的选定状态，并使用 `toggle()` 更改选定状态。
 *
 */
@Directive({
  selector: '[matSelectionToggle]',
  exportAs: 'matSelectionToggle',
  inputs: ['index: matSelectionToggleIndex'],
  providers: [{provide: CdkSelectionToggle, useExisting: MatSelectionToggle}],
})
export class MatSelectionToggle<T> extends CdkSelectionToggle<T> {
  /**
   * The value that is associated with the toggle
   *
   * 与此开关相关联的值
   *
   */
  @Input('matSelectionToggleValue') override value: T;
}
