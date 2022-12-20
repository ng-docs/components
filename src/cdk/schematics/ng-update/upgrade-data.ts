/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Migration} from '../update-tool/migration';
import {getChangesForTarget, ValueOfChanges, VersionChanges} from '../update-tool/version-changes';
import {
  attributeSelectors,
  AttributeSelectorUpgradeData,
  classNames,
  ClassNameUpgradeData,
  constructorChecks,
  ConstructorChecksUpgradeData,
  cssSelectors,
  CssSelectorUpgradeData,
  elementSelectors,
  ElementSelectorUpgradeData,
  inputNames,
  InputNameUpgradeData,
  methodCallChecks,
  MethodCallUpgradeData,
  outputNames,
  OutputNameUpgradeData,
  propertyNames,
  PropertyNameUpgradeData,
  SymbolRemovalUpgradeData,
  symbolRemoval,
} from './data';

/**
 * Upgrade data for the Angular CDK.
 *
 * Angular CDK 的升级数据。
 *
 */
export const cdkUpgradeData: UpgradeData = {
  attributeSelectors,
  classNames,
  constructorChecks,
  cssSelectors,
  elementSelectors,
  inputNames,
  methodCallChecks,
  outputNames,
  propertyNames,
  symbolRemoval,
};

/**
 * Interface that describes the upgrade data that needs to be defined when using the CDK
 * upgrade rules.
 *
 * 描述使用 CDK 升级规则时需要定义的升级数据的接口。
 *
 */
export interface UpgradeData {
  attributeSelectors: VersionChanges<AttributeSelectorUpgradeData>;
  classNames: VersionChanges<ClassNameUpgradeData>;
  constructorChecks: VersionChanges<ConstructorChecksUpgradeData>;
  cssSelectors: VersionChanges<CssSelectorUpgradeData>;
  elementSelectors: VersionChanges<ElementSelectorUpgradeData>;
  inputNames: VersionChanges<InputNameUpgradeData>;
  methodCallChecks: VersionChanges<MethodCallUpgradeData>;
  outputNames: VersionChanges<OutputNameUpgradeData>;
  propertyNames: VersionChanges<PropertyNameUpgradeData>;
  symbolRemoval: VersionChanges<SymbolRemovalUpgradeData>;
}

/**
 * Gets the reduced upgrade data for the specified data key. The function reads out the
 * target version and upgrade data object from the migration and resolves the specified
 * data portion that is specifically tied to the target version.
 *
 * 获取指定数据键的简化升级数据。该函数从迁移中读取目标版本和升级数据对象，并解析特定于目标版本的指定数据部分。
 *
 */
export function getVersionUpgradeData<
  T extends keyof UpgradeData,
  U = ValueOfChanges<UpgradeData[T]>,
>(migration: Migration<UpgradeData>, dataName: T): U[] {
  if (migration.targetVersion === null) {
    return [];
  }

  // Note that below we need to cast to `unknown` first TS doesn't infer the type of T correctly.
  return getChangesForTarget<U>(
    migration.targetVersion,
    migration.upgradeData[dataName] as unknown as VersionChanges<U>,
  );
}
