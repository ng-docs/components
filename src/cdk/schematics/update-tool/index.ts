/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as ts from 'typescript';

import {ComponentResourceCollector} from './component-resource-collector';
import {FileSystem, WorkspacePath} from './file-system';
import {defaultLogger, UpdateLogger} from './logger';
import {Migration, MigrationCtor, MigrationFailure} from './migration';
import {TargetVersion} from './target-version';
import {parseTsconfigFile} from './utils/parse-tsconfig';
import {createFileSystemCompilerHost} from './utils/virtual-host';

/**
 * An update project that can be run against individual migrations. An update project
 * accepts a TypeScript program and a context that is provided to all migrations. The
 * context is usually not used by migrations, but in some cases migrations rely on
 * specifics from the tool that performs the update (e.g. the Angular CLI). In those cases,
 * the context can provide the necessary specifics to the migrations in a type-safe way.
 *
 * 可以针对单个迁移运行的更新项目。更新项目可以接受提供给所有迁移的一个 TypeScript 程序和上下文。迁移通常不使用上下文，但是在某些情况下，迁移依赖于执行更新工具（例如 Angular CLI）中的细节。在这些情况下，上下文可以以类型安全的方式为迁移提供必要的细节。
 *
 */
export class UpdateProject<Context> {
  private readonly _typeChecker: ts.TypeChecker;

  constructor(
    /** Context provided to all migrations. */
    private _context: Context,
    /** TypeScript program using workspace paths. */
    private _program: ts.Program,
    /** File system used for reading, writing and editing files. */
    private _fileSystem: FileSystem,
    /**
     * Set of analyzed files. Used for avoiding multiple migration runs if
     * files overlap between targets.
     */
    private _analyzedFiles: Set<WorkspacePath> = new Set(),
    /** Logger used for printing messages. */
    private _logger: UpdateLogger = defaultLogger,
  ) {
    this._typeChecker = this._program.getTypeChecker();
  }

  /**
   * Migrates the project to the specified target version.
   *
   * 将项目迁移到指定的目标版本。
   *
   * @param migrationTypes Migrations that should be run.
   *
   * 应该运行的迁移。
   *
   * @param target Version the project should be updated to. Can be `null` if the set of
   *   specified migrations runs regardless of a target version.
   *
   *   项目应更新到的版本。如果指定的迁移不用管目标版本，则可以为 `null`。
   *
   * @param data Upgrade data that is passed to all migration rules.
   *
   * 要传递到所有迁移规则的升级数据。
   *
   * @param additionalStylesheetPaths Additional stylesheets that should be migrated, if not
   *   referenced in an Angular component. This is helpful for global stylesheets in a project.
   *
   * 如果未在 Angular 组件中引用，则应迁移的其他样式表。这对于项目中的全局样式表很有帮助。
   *
   * @param limitToDirectory If specified, changes will be limited to the given directory.
   *
   * 如果指定了，则更改将被限定于指定的目录下。
   *
   */
  migrate<Data>(
    migrationTypes: MigrationCtor<Data, Context>[],
    target: TargetVersion | null,
    data: Data,
    additionalStylesheetPaths?: string[],
    limitToDirectory?: string,
  ): {hasFailures: boolean} {
    limitToDirectory &&= this._fileSystem.resolve(limitToDirectory);

    // Create instances of the specified migrations.
    const migrations = this._createMigrations(migrationTypes, target, data);
    // Creates the component resource collector. The collector can visit arbitrary
    // TypeScript nodes and will find Angular component resources. Resources include
    // templates and stylesheets. It also captures inline stylesheets and templates.
    const resourceCollector = new ComponentResourceCollector(this._typeChecker, this._fileSystem);
    // Collect all of the TypeScript source files we want to migrate. We don't
    // migrate type definition files, or source files from external libraries.
    const sourceFiles = this._program.getSourceFiles().filter(f => {
      return (
        !f.isDeclarationFile &&
        (limitToDirectory == null ||
          this._fileSystem.resolve(f.fileName).startsWith(limitToDirectory)) &&
        !this._program.isSourceFileFromExternalLibrary(f)
      );
    });

    // Helper function that visits a given TypeScript node and collects all referenced
    // component resources (i.e. stylesheets or templates). Additionally, the helper
    // visits the node in each instantiated migration.
    const visitNodeAndCollectResources = (node: ts.Node) => {
      migrations.forEach(r => r.visitNode(node));
      ts.forEachChild(node, visitNodeAndCollectResources);
      resourceCollector.visitNode(node);
    };

    // Walk through all source file, if it has not been visited before, and
    // visit found nodes while collecting potential resources.
    sourceFiles.forEach(sourceFile => {
      const resolvedPath = this._fileSystem.resolve(sourceFile.fileName);
      // Do not visit source files which have been checked as part of a
      // previously migrated TypeScript project.
      if (!this._analyzedFiles.has(resolvedPath)) {
        visitNodeAndCollectResources(sourceFile);
        this._analyzedFiles.add(resolvedPath);
      }
    });

    // Walk through all resolved templates and visit them in each instantiated
    // migration. Note that this can only happen after source files have been
    // visited because we find templates through the TypeScript source files.
    resourceCollector.resolvedTemplates.forEach(template => {
      // Do not visit the template if it has been checked before. Inline
      // templates cannot be referenced multiple times.
      if (template.inline || !this._analyzedFiles.has(template.filePath)) {
        migrations.forEach(m => m.visitTemplate(template));
        this._analyzedFiles.add(template.filePath);
      }
    });

    // Walk through all resolved stylesheets and visit them in each instantiated
    // migration. Note that this can only happen after source files have been
    // visited because we find stylesheets through the TypeScript source files.
    resourceCollector.resolvedStylesheets.forEach(stylesheet => {
      // Do not visit the stylesheet if it has been checked before. Inline
      // stylesheets cannot be referenced multiple times.
      if (stylesheet.inline || !this._analyzedFiles.has(stylesheet.filePath)) {
        migrations.forEach(r => r.visitStylesheet(stylesheet));
        this._analyzedFiles.add(stylesheet.filePath);
      }
    });

    // In some applications, developers will have global stylesheets which are not
    // specified in any Angular component. Therefore we allow for additional stylesheets
    // being specified. We visit them in each migration unless they have been already
    // discovered before as actual component resource.
    if (additionalStylesheetPaths) {
      additionalStylesheetPaths.forEach(filePath => {
        const resolvedPath = this._fileSystem.resolve(filePath);
        if (limitToDirectory == null || resolvedPath.startsWith(limitToDirectory)) {
          const stylesheet = resourceCollector.resolveExternalStylesheet(resolvedPath, null);
          // Do not visit stylesheets which have been referenced from a component.
          if (!this._analyzedFiles.has(resolvedPath) && stylesheet) {
            migrations.forEach(r => r.visitStylesheet(stylesheet));
            this._analyzedFiles.add(resolvedPath);
          }
        }
      });
    }

    // Call the "postAnalysis" method for each migration.
    migrations.forEach(r => r.postAnalysis());

    // Collect all failures reported by individual migrations.
    const failures = migrations.reduce(
      (res, m) => res.concat(m.failures),
      [] as MigrationFailure[],
    );

    // In case there are failures, print these to the CLI logger as warnings.
    if (failures.length) {
      failures.forEach(({filePath, message, position}) => {
        const lineAndCharacter = position ? `@${position.line + 1}:${position.character + 1}` : '';
        this._logger.warn(`${filePath}${lineAndCharacter} - ${message}`);
      });
    }

    return {
      hasFailures: !!failures.length,
    };
  }

  /**
   * Creates instances of the given migrations with the specified target
   * version and data.
   *
   * 使用指定的目标版本和数据创建给定迁移的实例。
   *
   */
  private _createMigrations<Data>(
    types: MigrationCtor<Data, Context>[],
    target: TargetVersion | null,
    data: Data,
  ): Migration<Data, Context>[] {
    const result: Migration<Data, Context>[] = [];
    for (const ctor of types) {
      const instance = new ctor(
        this._program,
        this._typeChecker,
        target,
        this._context,
        data,
        this._fileSystem,
        this._logger,
      );
      instance.init();
      if (instance.enabled) {
        result.push(instance);
      }
    }
    return result;
  }

  /**
   * Creates a program form the specified tsconfig and patches the host
   * to read files and directories through the given file system.
   *
   * 从指定的 tsconfig 创建一个程序，并 patch 宿主以通过给定的文件系统读取文件和目录。
   *
   *
   * @throws {TsconfigParseError} If the tsconfig could not be parsed.
   *
   * 如果 tsconfig 无法解析。
   *
   */
  static createProgramFromTsconfig(tsconfigPath: WorkspacePath, fs: FileSystem): ts.Program {
    const parsed = parseTsconfigFile(fs.resolve(tsconfigPath), fs);
    const host = createFileSystemCompilerHost(parsed.options, fs);
    return ts.createProgram(parsed.fileNames, parsed.options, host);
  }
}
