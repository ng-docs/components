/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

/**
 * Type describing the allowed values for a boolean input.
 *
 * 此类型用于描述布尔值输入的允许值。
 *
 * @docs-private
 */
export type BooleanInput = string | boolean | null | undefined;

/**
 * Coerces a data-bound value \(typically a string\) to a boolean.
 *
 * 把一个数据绑定值（通常是一个字符串）强制转换为布尔值。
 *
 */
export function coerceBooleanProperty(value: any): boolean {
  return value != null && `${value}` !== 'false';
}
