/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {VersionChanges} from '../../update-tool/version-changes';

export interface OutputNameUpgradeData {
  /**
   * The @Output() name to replace.
   *
   * 要替换的 @Output() 名称。
   *
   */
  replace: string;
  /**
   * The new name for the @Output().
   *
   * @Output() 的新名称。
   *
   */
  replaceWith: string;
  /**
   * Controls which elements and attributes in which this replacement is made.
   *
   * 控制要进行替换的元素和属性。
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
     * 限制为任何具有这些属性的元素。
     *
     */
    attributes?: string[];
  };
}

export const outputNames: VersionChanges<OutputNameUpgradeData> = {};
