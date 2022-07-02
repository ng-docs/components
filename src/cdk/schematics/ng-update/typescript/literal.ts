/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as ts from 'typescript';

/**
 * Finds all start indices of the given search string in the input string.
 *
 * 在输入字符串中查找给定搜索字符串的所有起始索引。
 *
 */
export function findAllSubstringIndices(input: string, search: string): number[] {
  const result: number[] = [];
  let i = -1;
  while ((i = input.indexOf(search, i + 1)) !== -1) {
    result.push(i);
  }
  return result;
}

/**
 * Checks whether the given node is either a string literal or a no-substitution template
 * literal. Note that we cannot use `ts.isStringLiteralLike()` because if developers update
 * an outdated project, their TypeScript version is not automatically being updated
 * and therefore could throw because the function is not available yet.
 * https://github.com/Microsoft/TypeScript/commit/8518343dc8762475a5e92c9f80b5c5725bd81796
 *
 * 检查给定的节点是字符串文字还是非替换模板文字。请注意，我们不能使用 `ts.isStringLiteralLike()`，因为如果开发人员更新了过时的项目，则其 TypeScript 版本不会自动更新，因此可能会抛出该错误，因为该功能尚不可用。https://github.com/Microsoft/TypeScript/commit/8518343dc8762475a5e92c9f80b5c5725bd81796
 *
 */
export function isStringLiteralLike(
  node: ts.Node,
): node is ts.StringLiteral | ts.NoSubstitutionTemplateLiteral {
  return ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node);
}
