/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {SchematicsException, Tree} from '@angular-devkit/schematics';
import * as ts from 'typescript';

/**
 * Whether the Angular module in the given path imports the specified module class name.
 *
 * 给定路径中的 Angular 模块是否导入指定的模块类名称。
 *
 */
export function hasNgModuleImport(tree: Tree, modulePath: string, className: string): boolean {
  const moduleFileContent = tree.read(modulePath);

  if (!moduleFileContent) {
    throw new SchematicsException(`Could not read Angular module file: ${modulePath}`);
  }

  const parsedFile = ts.createSourceFile(
    modulePath,
    moduleFileContent.toString(),
    ts.ScriptTarget.Latest,
    true,
  );
  const ngModuleMetadata = findNgModuleMetadata(parsedFile);

  if (!ngModuleMetadata) {
    throw new SchematicsException(`Could not find NgModule declaration inside: "${modulePath}"`);
  }

  for (let property of ngModuleMetadata!.properties) {
    if (
      !ts.isPropertyAssignment(property) ||
      property.name.getText() !== 'imports' ||
      !ts.isArrayLiteralExpression(property.initializer)
    ) {
      continue;
    }

    if (property.initializer.elements.some(element => element.getText() === className)) {
      return true;
    }
  }

  return false;
}

/**
 * Resolves the last identifier that is part of the given expression. This helps resolving
 * identifiers of nested property access expressions \(e.g. myNamespace.core.NgModule\).
 *
 * 解析作为给定表达式一部分的最后一个标识符。这有助于解析嵌套属性访问表达式的标识符（例如 myNamespace.core.NgModule）。
 *
 */
function resolveIdentifierOfExpression(expression: ts.Expression): ts.Identifier | null {
  if (ts.isIdentifier(expression)) {
    return expression;
  } else if (ts.isPropertyAccessExpression(expression) && ts.isIdentifier(expression.name)) {
    return expression.name;
  }
  return null;
}

/**
 * Finds a NgModule declaration within the specified TypeScript node and returns the
 * corresponding metadata for it. This function searches breadth first because
 * NgModule's are usually not nested within other expressions or declarations.
 *
 * 在指定的 TypeScript 节点内查找 NgModule 声明，并为其返回相应的元数据。该函数为广度优先搜索，因为 NgModule 通常不嵌套在其他表达式或声明中。
 *
 */
function findNgModuleMetadata(rootNode: ts.Node): ts.ObjectLiteralExpression | null {
  // Add immediate child nodes of the root node to the queue.
  const nodeQueue: ts.Node[] = [...rootNode.getChildren()];

  while (nodeQueue.length) {
    const node = nodeQueue.shift()!;

    if (
      ts.isDecorator(node) &&
      ts.isCallExpression(node.expression) &&
      isNgModuleCallExpression(node.expression)
    ) {
      return node.expression.arguments[0] as ts.ObjectLiteralExpression;
    } else {
      nodeQueue.push(...node.getChildren());
    }
  }

  return null;
}

/**
 * Whether the specified call expression is referring to a NgModule definition.
 *
 * 指定的调用表达式是否引用 NgModule 定义。
 *
 */
function isNgModuleCallExpression(callExpression: ts.CallExpression): boolean {
  if (
    !callExpression.arguments.length ||
    !ts.isObjectLiteralExpression(callExpression.arguments[0])
  ) {
    return false;
  }

  // The `NgModule` call expression name is never referring to a `PrivateIdentifier`.
  const decoratorIdentifier = resolveIdentifierOfExpression(callExpression.expression);
  return decoratorIdentifier ? decoratorIdentifier.text === 'NgModule' : false;
}
