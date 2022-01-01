/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {extname} from '@angular-devkit/core';
import {SchematicContext} from '@angular-devkit/schematics';
import {DevkitMigration, ResolvedResource, TargetVersion} from '@angular/cdk/schematics';
import {migrateFileContent} from './migration';

/**
 * Migration that switches all Sass files using Material theming APIs to `@use`.
 *
 * 使用 Material 主题 API 将所有 Sass 文件切换到 `@use` 的迁移。
 *
 */
export class ThemingApiMigration extends DevkitMigration<null> {
  /**
   * Number of files that have been migrated.
   *
   * 已迁移的文件数。
   *
   */
  static migratedFileCount = 0;

  enabled = this.targetVersion === TargetVersion.V12;

  override visitStylesheet(stylesheet: ResolvedResource): void {
    if (extname(stylesheet.filePath) === '.scss') {
      const content = stylesheet.content;
      const migratedContent = content
        ? migrateFileContent(
            content,
            '@angular/material/',
            '@angular/cdk/',
            '@angular/material',
            '@angular/cdk',
            undefined,
            /material\/prebuilt-themes|cdk\/.*-prebuilt/,
          )
        : content;

      if (migratedContent && migratedContent !== content) {
        this.fileSystem
          .edit(stylesheet.filePath)
          .remove(0, stylesheet.content.length)
          .insertLeft(0, migratedContent);
        ThemingApiMigration.migratedFileCount++;
      }
    }
  }

  /**
   * Logs out the number of migrated files at the end of the migration.
   *
   * 在迁移结束时记录已迁移文件的数量。
   *
   */
  static override globalPostMigration(
    _tree: unknown,
    _targetVersion: TargetVersion,
    context: SchematicContext,
  ): void {
    const count = ThemingApiMigration.migratedFileCount;

    if (count > 0) {
      context.logger.info(
        `Migrated ${count === 1 ? `1 file` : `${count} files`} to the ` +
          `new Angular Material theming API.`,
      );
      ThemingApiMigration.migratedFileCount = 0;
    }
  }
}
