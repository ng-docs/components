/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as ts from 'typescript';
import {ResolvedResource} from './component-resource-collector';
import {FileSystem, WorkspacePath} from './file-system';
import {UpdateLogger} from './logger';
import {TargetVersion} from './target-version';
import {LineAndCharacter} from './utils/line-mappings';

export interface MigrationFailure {
  filePath: WorkspacePath;
  message: string;
  position?: LineAndCharacter;
}

export type PostMigrationAction = void | {
  /**
   * Whether the package manager should run upon migration completion.
   *
   * 程序包管理器是否应在迁移完成后运行。
   *
   */
  runPackageManager: boolean;
};

/**
 * Creates a constructor type for the specified type.
 *
 * 为指定的类型创建构造函数类型。
 *
 */
export type Constructor<T> = new (...args: any[]) => T;
/**
 * Gets a constructor type for the passed migration data.
 *
 * 获取传递的迁移数据的构造函数类型。
 *
 */
export type MigrationCtor<Data, Context = any> = Constructor<Migration<Data, Context>>;

export abstract class Migration<Data, Context = any> {
  /**
   * List of migration failures that need to be reported.
   *
   * 需要报告的迁移失败列表。
   *
   */
  failures: MigrationFailure[] = [];

  /**
   * Whether the migration is enabled or not.
   *
   * 是否启用迁移。
   *
   */
  abstract enabled: boolean;

  constructor(
    /** TypeScript program for the migration. */
    public program: ts.Program,
    /** TypeChecker instance for the analysis program. */
    public typeChecker: ts.TypeChecker,
    /**
     * Version for which the migration rule should run. Null if the migration
     * is invoked manually.
     */
    public targetVersion: TargetVersion | null,
    /** Context data for the migration. */
    public context: Context,
    /** Upgrade data passed to the migration. */
    public upgradeData: Data,
    /** File system that can be used for modifying files. */
    public fileSystem: FileSystem,
    /** Logger that can be used to print messages as part of the migration. */
    public logger: UpdateLogger,
  ) {}

  /**
   * Method can be used to perform global analysis of the program.
   *
   * 方法可用于执行程序的全局分析。
   *
   */
  init(): void {}

  /**
   * Method that will be called once all nodes, templates and stylesheets
   * have been visited.
   *
   * 访问所有节点、模板和样式表后将调用的方法。
   *
   */
  postAnalysis(): void {}

  /**
   * Method that will be called for each node in a given source file. Unlike tslint, this
   * function will only retrieve TypeScript nodes that need to be casted manually. This
   * allows us to only walk the program source files once per program and not per
   * migration rule (significant performance boost).
   *
   * 将对给定源文件中每个节点调用的方法。与 tslint 不同，此函数将仅检索需要手动转换的 TypeScript 节点。这使我们每个程序只能遍历程序源文件一次，而不能按照迁移规则遍历程序源文件（显著提高性能）。
   *
   */
  visitNode(node: ts.Node): void {}

  /**
   * Method that will be called for each Angular template in the program.
   *
   * 将为程序中的每个 Angular 模板调用的方法。
   *
   */
  visitTemplate(template: ResolvedResource): void {}

  /**
   * Method that will be called for each stylesheet in the program.
   *
   * 将为程序中的每个样式表调用的方法。
   *
   */
  visitStylesheet(stylesheet: ResolvedResource): void {}

  /**
   * Creates a failure with a specified message at the given node location.
   *
   * 创建一个带有给定节点位置的指定消息的失败规则。
   *
   */
  protected createFailureAtNode(node: ts.Node, message: string) {
    const sourceFile = node.getSourceFile();
    this.failures.push({
      filePath: this.fileSystem.resolve(sourceFile.fileName),
      position: ts.getLineAndCharacterOfPosition(sourceFile, node.getStart()),
      message: message,
    });
  }
}
