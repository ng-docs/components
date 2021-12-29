/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {TargetVersion} from './target-version';

export type VersionChanges<T> = {
  [target in TargetVersion]?: ReadableChange<T>[];
};

export type ReadableChange<T> = {
  pr: string;
  changes: T[];
};

/**
 * Conditional type that unwraps the value of a version changes type.
 *
 * 用于解开版本值更改类型的条件类型。
 *
 */
export type ValueOfChanges<T> = T extends VersionChanges<infer X> ? X : null;

/**
 * Gets the changes for a given target version from the specified version changes object.
 *
 * 从指定的版本更改对象获取给定目标版本的更改。
 *
 * For readability and a good overview of breaking changes, the version change data always
 * includes the related Pull Request link. Since this data is not needed when performing the
 * upgrade, this unused data can be removed and the changes data can be flattened into an
 * easy iterable array.
 *
 * 为了便于阅读并全面了解重大更改，版本更改数据始终包含相关的 “Pull Request” 链接。由于执行升级时不需要此数据，因此可以删除这些未使用的数据，并将更改数据展平为一个易于迭代的数组。
 *
 */
export function getChangesForTarget<T>(target: TargetVersion, data: VersionChanges<T>): T[] {
  if (!data) {
    const version = (TargetVersion as Record<string, string>)[target];
    throw new Error(`No data could be found for target version: ${version}`);
  }

  return (data[target] || []).reduce((result, prData) => result.concat(prData.changes), [] as T[]);
}

/**
 * Gets all changes from the specified version changes object. This is helpful in case a migration
 * rule does not distinguish data based on the target version, but for readability the
 * upgrade data is separated for each target version.
 *
 * 从指定的版本更改对象获取所有更改。如果迁移规则不能根据目标版本区分数据，但是为了便于阅读，请针对每个目标版本分别给出升级数据，这很有用。
 *
 */
export function getAllChanges<T>(data: VersionChanges<T>): T[] {
  return Object.keys(data)
    .map(targetVersion => getChangesForTarget(targetVersion as TargetVersion, data))
    .reduce((result, versionData) => result.concat(versionData), []);
}
