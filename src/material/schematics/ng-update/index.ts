/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Rule, SchematicContext} from '@angular-devkit/schematics';
import {
  createMigrationSchematicRule,
  NullableDevkitMigration,
  TargetVersion,
} from '@angular/cdk/schematics';
import {HammerGesturesMigration} from './migrations/hammer-gestures-v9/hammer-gestures-migration';
import {MiscClassInheritanceMigration} from './migrations/misc-checks/misc-class-inheritance';
import {MiscClassNamesMigration} from './migrations/misc-checks/misc-class-names';
import {MiscImportsMigration} from './migrations/misc-checks/misc-imports';
import {MiscPropertyNamesMigration} from './migrations/misc-checks/misc-property-names';
import {MiscTemplateMigration} from './migrations/misc-checks/misc-template';
import {RippleSpeedFactorMigration} from './migrations/misc-ripples-v7/ripple-speed-factor-migration';
import {SecondaryEntryPointsMigration} from './migrations/package-imports-v8/secondary-entry-points-migration';
import {ThemingApiMigration} from './migrations/theming-api-v12/theming-api-migration';

import {materialUpgradeData} from './upgrade-data';

const materialMigrations: NullableDevkitMigration[] = [
  MiscClassInheritanceMigration,
  MiscClassNamesMigration,
  MiscImportsMigration,
  MiscPropertyNamesMigration,
  MiscTemplateMigration,
  RippleSpeedFactorMigration,
  SecondaryEntryPointsMigration,
  HammerGesturesMigration,
  ThemingApiMigration,
];

/**
 * Entry point for the migration schematics with target of Angular Material v6
 *
 * 目标为 Angular Material v6 的迁移原理图的入口点
 *
 */
export function updateToV6(): Rule {
  return createMigrationSchematicRule(
    TargetVersion.V6,
    materialMigrations,
    materialUpgradeData,
    onMigrationComplete,
  );
}

/**
 * Entry point for the migration schematics with target of Angular Material v7
 *
 * 目标为 Angular Material v7 的迁移原理图的入口点
 *
 */
export function updateToV7(): Rule {
  return createMigrationSchematicRule(
    TargetVersion.V7,
    materialMigrations,
    materialUpgradeData,
    onMigrationComplete,
  );
}

/**
 * Entry point for the migration schematics with target of Angular Material v8
 *
 * 目标为 Angular Material v8 的迁移原理图的入口点
 *
 */
export function updateToV8(): Rule {
  return createMigrationSchematicRule(
    TargetVersion.V8,
    materialMigrations,
    materialUpgradeData,
    onMigrationComplete,
  );
}

/**
 * Entry point for the migration schematics with target of Angular Material v9
 *
 * 目标为 Angular Material v9 的迁移原理图的入口点
 *
 */
export function updateToV9(): Rule {
  return createMigrationSchematicRule(
    TargetVersion.V9,
    materialMigrations,
    materialUpgradeData,
    onMigrationComplete,
  );
}

/**
 * Entry point for the migration schematics with target of Angular Material v10
 *
 * 目标为 Angular Material v10 的迁移原理图的入口点
 *
 */
export function updateToV10(): Rule {
  return createMigrationSchematicRule(
    TargetVersion.V10,
    materialMigrations,
    materialUpgradeData,
    onMigrationComplete,
  );
}

/**
 * Entry point for the migration schematics with target of Angular Material v11
 *
 * 目标为 Angular Material v11 的迁移原理图的入口点
 *
 */
export function updateToV11(): Rule {
  return createMigrationSchematicRule(
    TargetVersion.V11,
    materialMigrations,
    materialUpgradeData,
    onMigrationComplete,
  );
}

/**
 * Entry point for the migration schematics with target of Angular Material v12
 *
 * 目标为 Angular Material v12 的迁移原理图的入口点
 *
 */
export function updateToV12(): Rule {
  return createMigrationSchematicRule(
    TargetVersion.V12,
    materialMigrations,
    materialUpgradeData,
    onMigrationComplete,
  );
}

/**
 * Entry point for the migration schematics with target of Angular Material v13
 *
 * 以 Angular Material v13 为目标的迁移示意图的入口点
 *
 */
export function updateToV13(): Rule {
  return createMigrationSchematicRule(
    TargetVersion.V13,
    materialMigrations,
    materialUpgradeData,
    onMigrationComplete,
  );
}

/**
 * Function that will be called when the migration completed.
 *
 * 迁移完成时将调用的函数。
 *
 */
function onMigrationComplete(
  context: SchematicContext,
  targetVersion: TargetVersion,
  hasFailures: boolean,
) {
  context.logger.info('');
  context.logger.info(`  ✓  Updated Angular Material to ${targetVersion}`);
  context.logger.info('');

  if (hasFailures) {
    context.logger.warn(
      '  ⚠  Some issues were detected but could not be fixed automatically. Please check the ' +
        'output above and fix these issues manually.',
    );
  }
}
