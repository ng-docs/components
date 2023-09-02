/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {join, Path} from '@angular-devkit/core';
import {Tree} from '@angular-devkit/schematics';

/**
 * Regular expression that matches stylesheet paths
 *
 * 与样式表路径匹配的正则表达式
 *
 */
const STYLESHEET_REGEX = /.*\.(css|scss)$/;

/**
 * Finds stylesheets in the given directory from within the specified tree.
 *
 * 从指定树中查找给定目录中的样式表。
 *
 * @param tree Devkit tree where stylesheet files can be found in.
 *
 * 可以在其中找到样式表文件的 Devkit 树。
 * @param startDirectory Optional start directory where stylesheets should be searched in.
 *   This can be useful if only stylesheets within a given folder are relevant \(to avoid
 *   unnecessary iterations\).
 *
 * 可选的开始目录，应在其中搜索样式表。如果只有给定文件夹中的样式表才是相关的，就会很有用（以避免不必要的迭代）。
 *
 */
export function findStylesheetFiles(tree: Tree, startDirectory: string = '/'): string[] {
  const result: string[] = [];
  const visitDir = (dirPath: Path) => {
    const {subfiles, subdirs} = tree.getDir(dirPath);

    subfiles.forEach(fileName => {
      if (STYLESHEET_REGEX.test(fileName)) {
        result.push(join(dirPath, fileName));
      }
    });

    // Visit directories within the current directory to find other stylesheets.
    subdirs.forEach(fragment => {
      // Do not visit directories or files inside node modules or `dist/` folders.
      if (fragment !== 'node_modules' && fragment !== 'dist') {
        visitDir(join(dirPath, fragment));
      }
    });
  };
  visitDir(startDirectory as Path);
  return result;
}
