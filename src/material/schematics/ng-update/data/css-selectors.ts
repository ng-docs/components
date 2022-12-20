/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {VersionChanges} from '@angular/cdk/schematics';

export interface MaterialCssSelectorData {
  /**
   * The CSS selector to replace.
   *
   * 要替换的 CSS 选择器。
   *
   */
  replace: string;
  /**
   * The new CSS selector.
   *
   * 新的 CSS 选择器。
   *
   */
  replaceWith: string;
  /**
   * Controls which file types in which this replacement is made. If omitted, it is made in all
   * files.
   *
   * 控制要进行这种替换的那些文件类型。如果省略，它将在所有文件中进行。
   *
   */
  replaceIn?: {
    /**
     * Replace this name in stylesheet files.
     *
     * 在样式表文件中替换此名称。
     *
     */
    stylesheet?: boolean;
    /**
     * Replace this name in HTML files.
     *
     * 在 HTML 文件中替换此名称。
     *
     */
    html?: boolean;
    /**
     * Replace this name in TypeScript strings.
     *
     * 在 TypeScript 字符串中替换此名称。
     *
     */
    tsStringLiterals?: boolean;
  };
}

export const cssSelectors: VersionChanges<MaterialCssSelectorData> = {};
