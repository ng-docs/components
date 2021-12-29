/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {parse5} from '@angular/cdk/schematics';

/**
 * Parses the specified HTML content and looks for "script" elements which
 * potentially import HammerJS. These elements will be returned.
 *
 * 解析指定的 HTML 内容，并寻找可能导入 HammerJS 的 “script” 元素。这些元素将被返回。
 *
 */
export function findHammerScriptImportElements(htmlContent: string): parse5.Element[] {
  const document = parse5.parse(htmlContent, {sourceCodeLocationInfo: true});
  const nodeQueue = [...document.childNodes];
  const result: parse5.Element[] = [];

  while (nodeQueue.length) {
    const node = nodeQueue.shift() as parse5.Element;

    if (node.childNodes) {
      nodeQueue.push(...node.childNodes);
    }

    if (node.nodeName.toLowerCase() === 'script' && node.attrs.length !== 0) {
      const srcAttribute = node.attrs.find(a => a.name === 'src');
      if (srcAttribute && isPotentialHammerScriptReference(srcAttribute.value)) {
        result.push(node);
      }
    }
  }
  return result;
}

/**
 * Checks whether the specified source path is potentially referring to the
 * HammerJS script output.
 *
 * 检查指定的源路径是否可能引用到 HammerJS 脚本输出。
 *
 */
function isPotentialHammerScriptReference(srcPath: string): boolean {
  return /\/hammer(\.min)?\.js($|\?)/.test(srcPath);
}
