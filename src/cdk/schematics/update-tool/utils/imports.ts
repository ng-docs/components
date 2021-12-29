/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as ts from 'typescript';

/**
 * Interface describing a resolved import.
 *
 * 描述已解析的导入的接口。
 *
 */
export interface Import {
  /**
   * Name of the imported symbol.
   *
   * 已导入符号的名称。
   *
   */
  symbolName: string;
  /**
   * Module name from which the symbol has been imported.
   *
   * 从中导入符号的模块名称。
   *
   */
  moduleName: string;
}

/**
 * Resolves the import of the specified identifier.
 *
 * 解析指定标识符的导入。
 *
 */
export function getImportOfIdentifier(
  node: ts.Identifier,
  typeChecker: ts.TypeChecker,
): Import | null {
  // Free standing identifiers which resolve to an import will be handled
  // as direct imports. e.g. "@Component()" where "Component" is an identifier
  // referring to an import specifier.
  const directImport = getSpecificImportOfIdentifier(node, typeChecker);
  if (directImport !== null) {
    return directImport;
  } else if (ts.isQualifiedName(node.parent) && node.parent.right === node) {
    // Determines the import of a qualified name. e.g. "let t: core.Component". In that
    // case, the import of the most left identifier will be determined ("core").
    const qualifierRoot = getQualifiedNameRoot(node.parent);
    if (qualifierRoot) {
      const moduleName = getImportOfNamespacedIdentifier(qualifierRoot, typeChecker);
      if (moduleName) {
        return {moduleName, symbolName: node.text};
      }
    }
  } else if (ts.isPropertyAccessExpression(node.parent) && node.parent.name === node) {
    // Determines the import of a property expression. e.g. "@core.Component". In that
    // case, the import of the most left identifier will be determined ("core").
    const rootIdentifier = getPropertyAccessRoot(node.parent);
    if (rootIdentifier) {
      const moduleName = getImportOfNamespacedIdentifier(rootIdentifier, typeChecker);
      if (moduleName) {
        return {moduleName, symbolName: node.text};
      }
    }
  }
  return null;
}

/**
 * Resolves the import of the specified identifier. Expects the identifier to resolve
 * to a fine-grained import declaration with import specifiers.
 *
 * 解析指定标识符的导入。期望此标识符解析为带有导入说明符的细粒度导入声明。
 *
 */
function getSpecificImportOfIdentifier(
  node: ts.Identifier,
  typeChecker: ts.TypeChecker,
): Import | null {
  const symbol = typeChecker.getSymbolAtLocation(node);
  if (!symbol || !symbol.declarations || !symbol.declarations.length) {
    return null;
  }
  const declaration = symbol.declarations[0];
  if (!ts.isImportSpecifier(declaration)) {
    return null;
  }
  // Since the declaration is an import specifier, we can walk up three times to get a reference
  // to the import declaration node (NamedImports -> ImportClause -> ImportDeclaration).
  const importDecl = declaration.parent.parent.parent;
  if (!ts.isStringLiteral(importDecl.moduleSpecifier)) {
    return null;
  }
  return {
    moduleName: importDecl.moduleSpecifier.text,
    symbolName: declaration.propertyName ? declaration.propertyName.text : declaration.name.text,
  };
}

/**
 * Resolves the import of the specified identifier. Expects the identifier to
 * resolve to a namespaced import declaration. e.g. "import \* as core from ...".
 *
 * 解析指定标识符的导入。期望标识符解析为命名空间的导入声明。例如 "import \* as core from ..."。
 *
 */
function getImportOfNamespacedIdentifier(
  node: ts.Identifier,
  typeChecker: ts.TypeChecker,
): string | null {
  const symbol = typeChecker.getSymbolAtLocation(node);
  if (!symbol || !symbol.declarations || !symbol.declarations.length) {
    return null;
  }
  const declaration = symbol.declarations[0];
  if (!ts.isNamespaceImport(declaration)) {
    return null;
  }
  // Since the declaration is a namespace import, we can walk up three times to get a reference
  // to the import declaration node (NamespaceImport -> ImportClause -> ImportDeclaration).
  const importDecl = declaration.parent.parent;
  if (!ts.isStringLiteral(importDecl.moduleSpecifier)) {
    return null;
  }

  return importDecl.moduleSpecifier.text;
}

/**
 * Gets the root identifier of a qualified type chain. For example: "core.GestureConfig"
 * will return the "core" identifier. Allowing us to find the import of "core".
 *
 * 获取合格类型链的根标识符。例如："core.GestureConfig" 将返回 "core" 标识符。以便我们找到 "core" 的导入。
 *
 */
function getQualifiedNameRoot(name: ts.QualifiedName): ts.Identifier | null {
  while (ts.isQualifiedName(name.left)) {
    name = name.left;
  }
  return ts.isIdentifier(name.left) ? name.left : null;
}

/**
 * Gets the root identifier of a property access chain. For example: "core.GestureConfig"
 * will return the "core" identifier. Allowing us to find the import of "core".
 *
 * 获取属性访问链的根标识符。例如："core.GestureConfig" 将返回 "core" 标识符。以便我们找到 "core" 的导入。
 *
 */
function getPropertyAccessRoot(node: ts.PropertyAccessExpression): ts.Identifier | null {
  while (ts.isPropertyAccessExpression(node.expression)) {
    node = node.expression;
  }
  return ts.isIdentifier(node.expression) ? node.expression : null;
}
