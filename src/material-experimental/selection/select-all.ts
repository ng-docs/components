/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {CdkSelectAll} from '@angular/cdk-experimental/selection';
import {Directive} from '@angular/core';

/**
 * Makes the element a select-all toggle.
 *
 * 使此元素成为全选开关。
 *
 * Must be used within a parent `MatSelection` directive. It toggles the selection states
 * of all the selection toggles connected with the `MatSelection` directive.
 * If the element implements `ControlValueAccessor`, e.g. `MatCheckbox`, the directive
 * automatically connects it with the select-all state provided by the `MatSelection` directive. If
 * not, use `checked` to get the checked state, `indeterminate` to get the indeterminate state,
 * and `toggle()` to change the selection state.
 *
 * 必须在父 `MatSelection` 指令中使用。它切换与 `MatSelection` 指令连接的所有选定开关的选定状态。如果该元素实现了 `ControlValueAccessor` ，例如 `MatCheckbox` ，指令会自动将它与 `MatSelection` 指令提供的全选状态连接起来。如果不是，请使用 `checked` 获取选定状态， `indeterminate` 获取未决状态， `toggle()` 切换选定状态。
 *
 */
@Directive({
  selector: '[matSelectAll]',
  exportAs: 'matSelectAll',
  providers: [{provide: CdkSelectAll, useExisting: MatSelectAll}],
})
export class MatSelectAll<T> extends CdkSelectAll<T> {}
