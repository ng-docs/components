/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as ts from 'typescript';
import {getExportDeclaration, getImportDeclaration} from '../typescript/imports';

/**
 * Name of the Angular Material module specifier.
 *
 * Angular Material 模块说明符的名称。
 *
 */
export const materialModuleSpecifier = '@angular/material';

/**
 * Name of the Angular CDK module specifier.
 *
 * Angular CDK 模块说明符的名称。
 *
 */
export const cdkModuleSpecifier = '@angular/cdk';

/**
 * Whether the specified node is part of an Angular Material or CDK import declaration.
 *
 * 指定的节点是 Angular Material 还是 CDK 导入声明的一部分。
 *
 */
export function isMaterialImportDeclaration(node: ts.Node) {
  return isMaterialDeclaration(getImportDeclaration(node));
}

/**
 * Whether the specified node is part of an Angular Material or CDK import declaration.
 *
 * 指定的节点是 Angular Material 还是 CDK 导入声明的一部分。
 *
 */
export function isMaterialExportDeclaration(node: ts.Node) {
  return isMaterialDeclaration(getExportDeclaration(node));
}

/**
 * Whether the declaration is part of Angular Material.
 *
 * 声明是否为 Angular Material 的一部分。
 *
 */
function isMaterialDeclaration(declaration: ts.ImportDeclaration|ts.ExportDeclaration) {
  if (!declaration.moduleSpecifier) {
    return false;
  }

  const moduleSpecifier = declaration.moduleSpecifier.getText();
  return moduleSpecifier.indexOf(materialModuleSpecifier) !== -1 ||
      moduleSpecifier.indexOf(cdkModuleSpecifier) !== -1;
}
