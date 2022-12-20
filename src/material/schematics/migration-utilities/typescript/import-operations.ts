/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Update} from '../update';
import * as ts from 'typescript';

/**
 * Returns an Update that renames the module specifier of the given import declaration node.
 *
 * 返回一个更新，它会重命名给定导入声明节点的模块说明符。
 *
 */
export function updateModuleSpecifier(
  node: ts.ImportDeclaration,
  opts: {
    moduleSpecifier: string;
  },
): Update {
  const moduleSpecifier = node.moduleSpecifier as ts.StringLiteral;
  return {
    offset: moduleSpecifier.pos,
    updateFn: (text: string) => {
      const index = text.indexOf(moduleSpecifier.text, moduleSpecifier.pos);
      return replaceAt(text, index, {
        old: moduleSpecifier.text,
        new: opts.moduleSpecifier,
      });
    },
  };
}

/**
 * Returns an Update that renames an export of the given named import node.
 *
 * 返回一个更新，它会重命名给定名字的导入节点的导出。
 *
 */
export function updateNamedImport(
  node: ts.NamedImports,
  opts: {
    oldExport: string;
    newExport: string;
  },
): Update | undefined {
  for (let i = 0; i < node.elements.length; i++) {
    const n = node.elements[i];
    const name = n.propertyName ? n.propertyName : n.name;
    if (name.escapedText === opts.oldExport) {
      return {
        offset: name.pos,
        updateFn: (text: string) => {
          const index = text.indexOf(opts.oldExport, name.pos);
          return replaceAt(text, index, {
            old: opts.oldExport,
            new: opts.newExport,
          });
        },
      };
    }
  }
  return;
}

/**
 * Replaces the first instance of substring.old after the given index.
 *
 * 在给定索引之后替换 substring.old 的第一个实例。
 *
 */
function replaceAt(str: string, index: number, substring: {old: string; new: string}): string {
  return str.slice(0, index) + substring.new + str.slice(index + substring.old.length);
}
