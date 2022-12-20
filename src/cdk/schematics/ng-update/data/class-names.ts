/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {VersionChanges} from '../../update-tool/version-changes';

export interface ClassNameUpgradeData {
  /**
   * The Class name to replace.
   *
   * 要替换的类名称。
   *
   */
  replace: string;
  /**
   * The new name for the Class.
   *
   * 类的新名称。
   *
   */
  replaceWith: string;
}

export const classNames: VersionChanges<ClassNameUpgradeData> = {};
