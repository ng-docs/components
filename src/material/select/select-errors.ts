/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

// Note that these have been copied over verbatim from
// `material/select` so that we don't have to expose them publicly.

/**
 * Returns an exception to be thrown when attempting to change a select's `multiple` option
 * after initialization.
 *
 * 当初始化之后再试图修改 `multiple` 选项时，会返回一个要抛出的异常。
 *
 * @docs-private
 */
export function getMatSelectDynamicMultipleError(): Error {
  return Error('Cannot change `multiple` mode of select after initialization.');
}

/**
 * Returns an exception to be thrown when attempting to assign a non-array value to a select
 * in `multiple` mode. Note that `undefined` and `null` are still valid values to allow for
 * resetting the value.
 *
 * `multiple` 模式下为选择器赋值为非数组时要抛出的异常。注意，`undefined` 和 `null` 仍然是有效值，用来重置该值。
 *
 * @docs-private
 */
export function getMatSelectNonArrayValueError(): Error {
  return Error('Value must be an array in multiple-selection mode.');
}

/**
 * Returns an exception to be thrown when assigning a non-function value to the comparator
 * used to determine if a value corresponds to an option. Note that whether the function
 * actually takes two values and returns a boolean is not checked.
 *
 * 返回一个异常值，表示正在把一个非函数的值赋给比较器，比较器用来确定某个值是否与某个选项对应。注意，这里并不关心此函数是否真的接受两个参数而返回一个布尔型值。
 *
 */
export function getMatSelectNonFunctionValueError(): Error {
  return Error('`compareWith` must be a function.');
}
