/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

/**
 * Type describing the allowed values for a number input
 *
 * 此类型描述数字输入的允许值
 *
 * @docs-private
 */
export type NumberInput = string | number | null | undefined;

/**
 * Coerces a data-bound value \(typically a string\) to a number.
 *
 * 把数据绑定值（通常是字符串）强制转换为数字。
 *
 */
export function coerceNumberProperty(value: any): number;
export function coerceNumberProperty<D>(value: any, fallback: D): number | D;
export function coerceNumberProperty(value: any, fallbackValue = 0) {
  return _isNumberValue(value) ? Number(value) : fallbackValue;
}

/**
 * Whether the provided value is considered a number.
 *
 * 提供的值是否可视为数字。
 *
 * @docs-private
 */
export function _isNumberValue(value: any): boolean {
  // parseFloat(value) handles most of the cases we're interested in (it treats null, empty string,
  // and other non-number values as NaN, where Number just uses 0) but it considers the string
  // '123hello' to be a valid number. Therefore we also check if Number(value) is NaN.
  return !isNaN(parseFloat(value as any)) && !isNaN(Number(value));
}
