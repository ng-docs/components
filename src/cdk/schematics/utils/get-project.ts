/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ProjectDefinition, WorkspaceDefinition} from '@angular-devkit/core/src/workspace';
import {SchematicsException} from '@angular-devkit/schematics';

/**
 * Finds the specified project configuration in the workspace. Throws an error if the project
 * couldn't be found.
 *
 * 在工作空间中查找指定的项目配置。如果找不到项目，则会引发错误。
 *
 */
export function getProjectFromWorkspace(
  workspace: WorkspaceDefinition,
  projectName = workspace.extensions.defaultProject as string,
): ProjectDefinition {
  const project = workspace.projects.get(projectName);

  if (!project) {
    throw new SchematicsException(`Could not find project in workspace: ${projectName}`);
  }

  return project;
}
