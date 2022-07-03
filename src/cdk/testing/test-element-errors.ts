/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

/**
 * Returns an error which reports that no keys have been specified.
 *
 * 返回一个错误，报告未指定任何键。
 *
 * @docs-private
 */
export function getNoKeysSpecifiedError() {
  return Error('No keys have been specified.');
}
