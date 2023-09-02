/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {VersionChanges} from '../../update-tool/version-changes';

export interface InputNameUpgradeData {
  /**
   * The @Input\(\) name to replace.
   *
   * 要替换的 @Input\(\) 名称。
   *
   */
  replace: string;
  /**
   * The new name for the @Input().
   *
   * @Input () 的新名称。
   *
   */
  replaceWith: string;
  /**
   * Controls which elements and attributes in which this replacement is made.
   *
   * 控制要替换的元素和属性。
   *
   */
  limitedTo: {
    /**
     * Limit to elements with any of these element tags.
     *
     * 限制为任何具有这些元素标签的元素。
     *
     */
    elements?: string[];
    /**
     * Limit to elements with any of these attributes.
     *
     * 限制为任何带有这些属性的元素。
     *
     */
    attributes?: string[];
  };
}

export const inputNames: VersionChanges<InputNameUpgradeData> = {};
