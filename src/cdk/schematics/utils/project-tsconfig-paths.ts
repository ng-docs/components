/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {normalize} from '@angular-devkit/core';
import {
  ProjectDefinition,
  WorkspaceDefinition,
  WorkspaceHost,
} from '@angular-devkit/core/src/workspace';
import {readJsonWorkspace} from '@angular-devkit/core/src/workspace/json/reader';
import {Tree} from '@angular-devkit/schematics';
import {WorkspacePath} from '../update-tool/file-system';

/**
 * Name of the default Angular CLI workspace configuration files.
 *
 * 默认的 Angular CLI 工作区配置文件的名称。
 *
 */
const defaultWorkspaceConfigPaths = ['/angular.json', '/.angular.json'];

/**
 * Gets the tsconfig path from the given target within the specified project.
 *
 * 从指定项目中的给定目标获取 tsconfig 路径。
 *
 */
export function getTargetTsconfigPath(project: ProjectDefinition,
                                      targetName: string): WorkspacePath|null {
  const tsconfig = project.targets?.get(targetName)?.options?.tsConfig;
  return tsconfig ? normalize(tsconfig as string) : null;
}

/**
 * Resolve the workspace configuration of the specified tree gracefully.
 *
 * 正常解析指定树的工作区配置。
 *
 */
export async function getWorkspaceConfigGracefully(tree: Tree): Promise<WorkspaceDefinition|null> {
  const path = defaultWorkspaceConfigPaths.find(filePath => tree.exists(filePath));
  const configBuffer = tree.read(path!);

  if (!path || !configBuffer) {
    return null;
  }

  try {
    return await readJsonWorkspace(path, {
      readFile: async filePath => tree.read(filePath)!.toString()
    } as WorkspaceHost);
  } catch (e) {
    return null;
  }
}
