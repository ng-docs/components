/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as ts from 'typescript';

/**
 * Unwraps a given expression TypeScript node. Expressions can be wrapped within multiple
 * parentheses. e.g. "\(\(\(\({exp}\)\)\)\)\(\)". The function should return the TypeScript node
 * referring to the inner expression. e.g "exp".
 *
 * 解开给定的表达式 TypeScript 节点。表达式可以包含在多个括号内。例如 "\(\(\(\({exp}\)\)\)\)\(\)"。该函数应返回引用内部表达式的 TypeScript 节点。例如 "exp"。
 *
 */
export function unwrapExpression(node: ts.Expression | ts.ParenthesizedExpression): ts.Expression {
  return ts.isParenthesizedExpression(node) ? unwrapExpression(node.expression) : node;
}
