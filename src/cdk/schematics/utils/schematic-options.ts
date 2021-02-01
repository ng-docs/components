/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ProjectDefinition} from '@angular-devkit/core/src/workspace';
import {isJsonObject, JsonObject} from '@angular-devkit/core';

/**
 * Returns the default options for the `@schematics/angular:component` schematic which would
 * have been specified at project initialization (ng new or ng init).
 *
 * `@schematics/angular:component` 原理图的默认选项，该选项在项目初始化时已指定（ng new 或 ng init）。
 *
 * This is necessary because the Angular CLI only exposes the default values for the "--style",
 * "--inlineStyle", "--skipTests" and "--inlineTemplate" options to the "component" schematic.
 *
 * 这是必需的，因为 Angular CLI 仅向“组件”原理图暴露 "--style"、"--inlineStyle"、"--skipTests" 和 "--inlineTemplate" 选项的默认值。
 *
 */
export function getDefaultComponentOptions(project: ProjectDefinition) {
  // Note: Not all options which are available when running "ng new" will be stored in the
  // workspace config. List of options which will be available in the configuration:
  // angular/angular-cli/blob/master/packages/schematics/angular/application/index.ts#L109-L131
  let skipTests = getDefaultComponentOption<boolean|null>(project, ['skipTests'], null);

  // In case "skipTests" is not set explicitly, also look for the "spec" option. The "spec"
  // option has been deprecated but can be still used in older Angular CLI projects.
  // See: https://github.com/angular/angular-cli/commit/a12a4e02a4689b5bdbc6e740c0d9865afb55671a
  if (skipTests === null) {
    skipTests = !getDefaultComponentOption(project, ['spec'], true);
  }

  return {
    style: getDefaultComponentOption(project, ['style', 'styleext'], 'css'),
    inlineStyle: getDefaultComponentOption(project, ['inlineStyle'], false),
    inlineTemplate: getDefaultComponentOption(project, ['inlineTemplate'], false),
    skipTests: skipTests,
  };
}

/**
 * Gets the default value for the specified option. The default options will be determined
 * by looking at the stored schematic options for `@schematics/angular:component` in the
 * CLI workspace configuration.
 *
 * 获取指定选项的默认值。默认选项将通过查看 CLI 工作区配置中 `@schematics/angular:component` 的已存储原理图选项来确定。
 *
 */
function getDefaultComponentOption<T>(project: ProjectDefinition, optionNames: string[],
                                      fallbackValue: T): T {
  const schematicOptions = isJsonObject(project.extensions.schematics || null) ?
      project.extensions.schematics as JsonObject : null;
  const defaultSchematic = schematicOptions ?
      schematicOptions['@schematics/angular:component'] as JsonObject | null : null;

  for (const optionName of optionNames) {
    if (defaultSchematic && defaultSchematic[optionName] != null) {
      return defaultSchematic[optionName] as unknown as T;
    }
  }

  return fallbackValue;
}
