/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as ts from 'typescript';

/**
 * Checks whether the given node is part of an import specifier node.
 *
 * 检查给定节点是否导入说明符节点的一部分。
 *
 */
export function isImportSpecifierNode(node: ts.Node) {
  return isPartOfKind(node, ts.SyntaxKind.ImportSpecifier);
}

/**
 * Checks whether the given node is part of an export specifier node.
 *
 * 检查给定节点是否导出说明符节点的一部分。
 *
 */
export function isExportSpecifierNode(node: ts.Node) {
  return isPartOfKind(node, ts.SyntaxKind.ExportSpecifier);
}

/**
 * Checks whether the given node is part of a namespace import.
 *
 * 检查给定节点是否名称空间导入的一部分。
 *
 */
export function isNamespaceImportNode(node: ts.Node) {
  return isPartOfKind(node, ts.SyntaxKind.NamespaceImport);
}

/**
 * Finds the parent import declaration of a given TypeScript node.
 *
 * 查找给定 TypeScript 节点的父级导入声明。
 *
 */
export function getImportDeclaration(node: ts.Node) {
  return findDeclaration(node, ts.SyntaxKind.ImportDeclaration) as ts.ImportDeclaration;
}

/**
 * Finds the parent export declaration of a given TypeScript node
 *
 * 查找给定 TypeScript 节点的父级导出声明
 *
 */
export function getExportDeclaration(node: ts.Node) {
  return findDeclaration(node, ts.SyntaxKind.ExportDeclaration) as ts.ExportDeclaration;
}

/**
 * Finds the specified declaration for the given node by walking up the TypeScript nodes.
 *
 * 通过遍历 TypeScript 节点查找给定节点的指定声明。
 *
 */
function findDeclaration<T extends ts.SyntaxKind>(node: ts.Node, kind: T) {
  while (node.kind !== kind) {
    node = node.parent;
  }

  return node;
}

/**
 * Checks whether the given node is part of another TypeScript Node with the specified kind.
 *
 * 检查给定节点是否是具有指定种类的另一个 TypeScript 节点的一部分。
 *
 */
function isPartOfKind<T extends ts.SyntaxKind>(node: ts.Node, kind: T): boolean {
  if (node.kind === kind) {
    return true;
  } else if (node.kind === ts.SyntaxKind.SourceFile) {
    return false;
  }

  return isPartOfKind(node.parent, kind);
}
