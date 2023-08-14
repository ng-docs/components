/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {JsonValue, workspaces} from '@angular-devkit/core';
import {SchematicsException} from '@angular-devkit/schematics';

/**
 * Object that maps a CLI target to its default builder name.
 *
 * 将 CLI 目标映射到其默认构建器名称的对象。
 *
 */
export const defaultTargetBuilders = {
  build: '@angular-devkit/build-angular:browser',
  test: '@angular-devkit/build-angular:karma',
};

/**
 * Resolves the architect options for the build target of the given project.
 *
 * 解析给定项目的构建目标的建筑师选项。
 *
 */
export function getProjectTargetOptions(
  project: workspaces.ProjectDefinition,
  buildTarget: string,
): Record<string, JsonValue | undefined> {
  const options = project.targets?.get(buildTarget)?.options;

  if (!options) {
    throw new SchematicsException(
      `Cannot determine project target configuration for: ${buildTarget}.`,
    );
  }

  return options;
}

/**
 * Gets all targets from the given project that match the specified builder name.
 *
 * 从给定项目中获取与指定构建器名称匹配的所有目标。
 *
 */
export function getTargetsByBuilderName(
  project: workspaces.ProjectDefinition,
  builderName: string,
): workspaces.TargetDefinition[] {
  return Array.from(project.targets.keys())
    .filter(name => project.targets.get(name)?.builder === builderName)
    .map(name => project.targets.get(name)!);
}
