/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {VersionChanges} from '../../update-tool/version-changes';

export type ConstructorChecksUpgradeData = string;

/**
 * List of class names for which the constructor signature has been changed. The new constructor
 * signature types don't need to be stored here because the signature will be determined
 * automatically through type checking.
 *
 * 已改变构造函数签名的类名列表。不需要在此处存储新的构造函数签名类型，因为签名将通过类型检查自动确定。
 *
 */
export const constructorChecks: VersionChanges<ConstructorChecksUpgradeData> = {};
