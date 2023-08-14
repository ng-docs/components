/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {SchematicsException, Tree} from '@angular-devkit/schematics';
import {Schema as ComponentOptions} from '@schematics/angular/component/schema';
import {InsertChange} from '@schematics/angular/utility/change';
import {getWorkspace} from '@schematics/angular/utility/workspace';
import {findModuleFromOptions as internalFindModule} from '@schematics/angular/utility/find-module';
import {addImportToModule} from '@schematics/angular/utility/ast-utils';
import {getAppModulePath} from '@schematics/angular/utility/ng-ast-utils';
import {workspaces} from '@angular-devkit/core';
import * as ts from 'typescript';
import {getProjectMainFile} from './project-main-file';

/**
 * Reads file given path and returns TypeScript source file.
 *
 * 读取给定路径的文件并返回 TypeScript 源文件。
 *
 */
export function parseSourceFile(host: Tree, path: string): ts.SourceFile {
  const buffer = host.read(path);
  if (!buffer) {
    throw new SchematicsException(`Could not find file for path: ${path}`);
  }
  return ts.createSourceFile(path, buffer.toString(), ts.ScriptTarget.Latest, true);
}

/**
 * Import and add module to root app module.
 *
 * 导入模块并将其添加到应用的根模块。
 *
 */
export function addModuleImportToRootModule(
  host: Tree,
  moduleName: string,
  src: string,
  project: workspaces.ProjectDefinition,
) {
  const modulePath = getAppModulePath(host, getProjectMainFile(project));
  addModuleImportToModule(host, modulePath, moduleName, src);
}

/**
 * Import and add module to specific module path.
 *
 * 导入模块并将其添加到特定的模块路径。
 *
 * @param host the tree we are updating
 *
 * 我们正在更新的树
 *
 * @param modulePath src location of the module to import
 *
 * 导入模块的源码位置
 *
 * @param moduleName name of module to import
 *
 * 导入模块的名称
 *
 * @param src src location to import
 *
 * 要导入的源码位置
 *
 */
export function addModuleImportToModule(
  host: Tree,
  modulePath: string,
  moduleName: string,
  src: string,
) {
  const moduleSource = parseSourceFile(host, modulePath);

  if (!moduleSource) {
    throw new SchematicsException(`Module not found: ${modulePath}`);
  }

  const changes = addImportToModule(moduleSource, modulePath, moduleName, src);
  const recorder = host.beginUpdate(modulePath);

  changes.forEach(change => {
    if (change instanceof InsertChange) {
      recorder.insertLeft(change.pos, change.toAdd);
    }
  });

  host.commitUpdate(recorder);
}

/**
 * Wraps the internal find module from options with undefined path handling
 *
 * 使用具有未定义路径处理的选项，包装内部查找模块
 *
 */
export async function findModuleFromOptions(
  host: Tree,
  options: ComponentOptions,
): Promise<string | undefined> {
  const workspace = await getWorkspace(host);

  if (!options.project) {
    options.project = Array.from(workspace.projects.keys())[0];
  }

  const project = workspace.projects.get(options.project)!;

  if (options.path === undefined) {
    options.path = `/${project.root}/src/app`;
  }

  return internalFindModule(host, options);
}
