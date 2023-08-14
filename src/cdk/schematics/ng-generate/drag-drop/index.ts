/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {chain, noop, Rule, Tree} from '@angular-devkit/schematics';
import {
  addModuleImportToModule,
  buildComponent,
  findModuleFromOptions,
  isStandaloneSchematic,
} from '../../utils';
import {Schema} from './schema';

/**
 * Scaffolds a new Angular component that uses the Drag and Drop module.
 *
 * 建立使用拖放模块的新 Angular 组件。
 *
 */
export default function (options: Schema): Rule {
  return chain([
    buildComponent(
      {...options},
      {
        template:
          './__path__/__name@dasherize@if-flat__/__name@dasherize__.component.html.template',
        stylesheet:
          './__path__/__name@dasherize@if-flat__/__name@dasherize__.component.__style__.template',
      },
    ),
    options.skipImport ? noop() : addDragDropModulesToModule(options),
  ]);
}

/**
 * Adds the required modules to the main module of the CLI project.
 *
 * 将所需的模块添加到 CLI 项目的主模块中。
 *
 */
function addDragDropModulesToModule(options: Schema) {
  return async (host: Tree) => {
    const isStandalone = await isStandaloneSchematic(host, options);

    if (!isStandalone) {
      const modulePath = await findModuleFromOptions(host, options);
      addModuleImportToModule(host, modulePath!, 'DragDropModule', '@angular/cdk/drag-drop');
    }
  };
}
