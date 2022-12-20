/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {runfiles} from '@bazel/runfiles';

/**
 * Path to the schematic collection for non-migration schematics.
 *
 * 非迁移型原理图集合的路径。
 *
 */
export const COLLECTION_PATH = runfiles.resolveWorkspaceRelative(
  'src/material/schematics/collection.json',
);

/**
 * Path to the schematic collection that includes the migrations.
 *
 * 包含迁移型原理图集合的路径。
 *
 */
export const MIGRATION_PATH = runfiles.resolveWorkspaceRelative(
  'src/material/schematics/migration.json',
);
