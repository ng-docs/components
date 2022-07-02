/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

/**
 * Possible versions that can be automatically migrated by `ng update`.
 *
 * `ng update` 自动迁移的可能版本。
 *
 */
// Used in an `Object.keys` call below so it can't be `const enum`.
// tslint:disable-next-line:prefer-const-enum
export enum TargetVersion {
  V6 = 'version 6',
  V7 = 'version 7',
  V8 = 'version 8',
  V9 = 'version 9',
  V10 = 'version 10',
  V11 = 'version 11',
  V12 = 'version 12',
  V13 = 'version 13',
  V14 = 'version 14',
  V15 = 'version 15',
}

/**
 * Returns all versions that are supported by "ng update". The versions are determined
 * based on the "TargetVersion" enum.
 *
 * 返回 “ng update” 支持的所有版本。根据 “TargetVersion” 枚举确定版本。
 *
 */
export function getAllVersionNames(): string[] {
  return Object.keys(TargetVersion).filter(enumValue => {
    return typeof (TargetVersion as Record<string, string | undefined>)[enumValue] === 'string';
  });
}
