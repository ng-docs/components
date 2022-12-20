/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {VersionChanges} from '../../update-tool/version-changes';

export interface PropertyNameUpgradeData {
  /**
   * The property name to replace.
   *
   * 要替换的属性名称。
   *
   */
  replace: string;
  /**
   * The new name for the property.
   *
   * 属性的新名称。
   *
   */
  replaceWith: string;
  /**
   * Controls which classes in which this replacement is made.
   *
   * 控制进行替换的类。
   *
   */
  limitedTo: {
    /**
     * Replace the property only when its type is one of the given Classes.
     *
     * 仅当属性的类型为给定类之一时才替换该属性。
     *
     */
    classes: string[];
  };
}

export const propertyNames: VersionChanges<PropertyNameUpgradeData> = {};
