/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ConstructorChecksUpgradeData, VersionChanges} from '@angular/cdk/schematics';

/**
 * List of class names for which the constructor signature has been changed. The new constructor
 * signature types don't need to be stored here because the signature will be determined
 * automatically through type checking.
 *
 * 构造函数签名已更改过的类名称的列表。不需要在这里存储新的构造函数签名类型，因为签名将通过类型检查自动确定。
 *
 */
export const constructorChecks: VersionChanges<ConstructorChecksUpgradeData> = {};
