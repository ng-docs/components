/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Path, workspaces} from '@angular-devkit/core';
import {SchematicsException} from '@angular-devkit/schematics';
import {getProjectTargetOptions} from './project-targets';

/**
 * Looks for the main TypeScript file in the given project and returns its path.
 *
 * 在给定的项目中查找主要的 TypeScript 文件并返回其路径。
 *
 */
export function getProjectMainFile(project: workspaces.ProjectDefinition): Path {
  const buildOptions = getProjectTargetOptions(project, 'build');

  if (!buildOptions.main) {
    throw new SchematicsException(
      `Could not find the project main file inside of the ` +
        `workspace config (${project.sourceRoot})`,
    );
  }

  return buildOptions.main as Path;
}
