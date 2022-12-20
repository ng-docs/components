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
import {LegacyComponentsMigration} from './migrations/legacy-components-v15';

import {materialUpgradeData} from './upgrade-data';

const materialMigrations: NullableDevkitMigration[] = [LegacyComponentsMigration];

/**
 * Entry point for the migration schematics with target of Angular Material v15
 *
 * 以 Angular Material v15 为目标的迁移原理图的入口点
 *
 */
export function updateToV15(): Rule {
  return createMigrationSchematicRule(
    TargetVersion.V15,
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
