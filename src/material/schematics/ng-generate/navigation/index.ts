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
} from '@angular/cdk/schematics';
import {Schema} from './schema';

/**
 * Scaffolds a new navigation component.
 * Internally it bootstraps the base component schematic
 *
 * 搭建一个新的导航组件脚手架。在内部引导基本组件原理图
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
    options.skipImport ? noop() : addNavModulesToModule(options),
  ]);
}

/**
 * Adds the required modules to the relative module.
 *
 * 将所需的模块添加到相对模块。
 *
 */
function addNavModulesToModule(options: Schema) {
  return async (host: Tree) => {
    const isStandalone = await isStandaloneSchematic(host, options);

    if (!isStandalone) {
      const modulePath = (await findModuleFromOptions(host, options))!;
      addModuleImportToModule(host, modulePath, 'MatToolbarModule', '@angular/material/toolbar');
      addModuleImportToModule(host, modulePath, 'MatButtonModule', '@angular/material/button');
      addModuleImportToModule(host, modulePath, 'MatSidenavModule', '@angular/material/sidenav');
      addModuleImportToModule(host, modulePath, 'MatIconModule', '@angular/material/icon');
      addModuleImportToModule(host, modulePath, 'MatListModule', '@angular/material/list');
    }
  };
}
