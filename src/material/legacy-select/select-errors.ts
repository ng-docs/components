/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

/**
 * Returns an exception to be thrown when attempting to change a select's `multiple` option
 * after initialization.
 *
 * 返回在初始化后尝试更改 select 的 `multiple` 选项时抛出的异常。
 *
 * @docs-private
 * @deprecated
 *
 * Use `getMatSelectDynamicMultipleError` from `@angular/material/select` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 * @breaking-change 17.0.0
 */
export function getMatSelectDynamicMultipleError(): Error {
  return Error('Cannot change `multiple` mode of select after initialization.');
}

/**
 * Returns an exception to be thrown when attempting to assign a non-array value to a select
 * in `multiple` mode. Note that `undefined` and `null` are still valid values to allow for
 * resetting the value.
 *
 * 返回尝试将非数组值赋值给 `multiple` 模式下的选择框时抛出的异常。请注意， `undefined` 和 `null` 仍然是允许重置值的有效值。
 *
 * @docs-private
 * @deprecated
 *
 * Use `getMatSelectNonArrayValueError` from `@angular/material/select` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 * @breaking-change 17.0.0
 */
export function getMatSelectNonArrayValueError(): Error {
  return Error('Value must be an array in multiple-selection mode.');
}

/**
 * Returns an exception to be thrown when assigning a non-function value to the comparator
 * used to determine if a value corresponds to an option. Note that whether the function
 * actually takes two values and returns a boolean is not checked.
 *
 * 返回将非函数值赋值给用于确定值是否对应于选项的比较器时抛出的异常。请注意，不会检查函数是否实际采用两个值并返回布尔值。
 *
 * @deprecated
 *
 * Use `getMatSelectNonFunctionValueError` from `@angular/material/select` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 * @breaking-change 17.0.0
 */
export function getMatSelectNonFunctionValueError(): Error {
  return Error('`compareWith` must be a function.');
}
