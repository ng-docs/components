/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {SchematicContext, Tree} from '@angular-devkit/schematics';
import {workspaces} from '@angular-devkit/core';
import {Constructor, Migration, PostMigrationAction} from '../update-tool/migration';
import {TargetVersion} from '../update-tool/target-version';

export type DevkitContext = {
  /**
   * Devkit tree for the current migrations. Can be used to insert/remove files.
   *
   * 当前迁移的 Devkit 树。可用于插入/删除文件。
   *
   */
  tree: Tree;
  /**
   * Name of the project the migrations run against.
   *
   * 迁移所针对的项目的名称。
   *
   */
  projectName: string;
  /**
   * Workspace project the migrations run against.
   *
   * 迁移所针对的工作区项目。
   *
   */
  project: workspaces.ProjectDefinition;
  /**
   * Whether the migrations run for a test target.
   *
   * 迁移是否针对测试目标运行。
   *
   */
  isTestTarget: boolean;
};

export abstract class DevkitMigration<Data> extends Migration<Data, DevkitContext> {
  /**
   * Prints an informative message with context on the current target.
   *
   * 在当前目标上打印带有上下文的信息性消息。
   *
   */
  protected printInfo(text: string) {
    const targetName = this.context.isTestTarget ? 'test' : 'build';
    this.logger.info(`- ${this.context.projectName}@${targetName}: ${text}`);
  }

  /**
   * Optional static method that will be called once the migration of all project
   * targets has been performed. This method can be used to make changes respecting the
   * migration result of all individual targets. e.g. removing HammerJS if it
   * is not needed in any project target.
   *
   * 在完成所有项目目标的迁移后将调用的可选静态方法。此方法可用于根据所有单个目标的迁移结果进行更改。例如，如果在任何项目目标中都不需要 HammerJS，则将其删除。
   *
   */
  static globalPostMigration?(
    tree: Tree,
    targetVersion: TargetVersion,
    context: SchematicContext,
  ): PostMigrationAction;
}

export type DevkitMigrationCtor<Data> = Constructor<DevkitMigration<Data>> & {
  [m in keyof typeof DevkitMigration]: (typeof DevkitMigration)[m];
};
