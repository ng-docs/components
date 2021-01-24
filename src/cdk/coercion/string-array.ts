/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

/**
 * Coerces a value to an array of trimmed non-empty strings.
 * Any input that is not an array, `null` or `undefined` will be turned into a string
 * via `toString()` and subsequently split with the given separator.
 * `null` and `undefined` will result in an empty array.
 * This results in the following outcomes:
 *
 * 把一个值强制转换为一个修剪过的非空字符串数组。任何非数组输入、`null` 或 `undefined` 都会通过 `toString()` 转换成字符串，然后用指定的分隔符拆分。`null` 和 `undefined` 都会变为空数组。结果如下：
 *
 * - `null` -&gt; `[]`
 * - `[null]` -&gt; `["null"]`
 * - `["a", "b ", " "]` -&gt; `["a", "b"]`
 * - `[1, [2, 3]]` -&gt; `["1", "2,3"]`
 * - `[{ a: 0 }]` -&gt; `["[object Object]"]`
 * - `{ a: 0 }` -&gt; `["[object", "Object]"]`
 *
 * Useful for defining CSS classes or table columns.
 *
 * 这对于定义 CSS 类或表格列是很有用的。
 *
 * @param value the value to coerce into an array of strings
 *
 * 要强制转成字符串数组的值
 *
 * @param separator split-separator if value isn't an array
 *
 * 如果 value 不是一个数组，则用本参数指定分隔符
 *
 */
export function coerceStringArray(value: any, separator: string | RegExp = /\s+/): string[] {
  const result = [];

  if (value != null) {
    const sourceValues = Array.isArray(value) ? value : `${value}`.split(separator);
    for (const sourceValue of sourceValues) {
      const trimmedString = `${sourceValue}`.trim();
      if (trimmedString) {
        result.push(trimmedString);
      }
    }
  }

  return result;
}
