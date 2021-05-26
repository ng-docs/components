/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Rule, SchematicContext, Tree} from '@angular-devkit/schematics';
import {NodePackageInstallTask, RunSchematicTask} from '@angular-devkit/schematics/tasks';
import {addPackageToPackageJson, getPackageVersionFromPackageJson} from './package-config';
import {Schema} from './schema';

/**
 * Version range that will be used for the Angular CDK and Angular Material if this
 * schematic has been run outside of the CLI `ng add` command. In those cases, there
 * can be no dependency on `@angular/material` in the `package.json` file, and we need
 * to manually insert the dependency based on the build version placeholder.
 *
 * 如果此原理图在 `ng add` 命令之外运行，则将用于指定 Angular CDK 和 Angular Material的版本范围。在这些情况下，`package.json` 文件中可能没有依赖 `@angular/material`，这时我们就需要基于构建版本占位符来手动插入依赖关系。
 *
 * Note that the fallback version range does not use caret, but tilde because that is
 * the default for Angular framework dependencies in CLI projects.
 *
 * 请注意，后备版本范围不使用 `^`，而是使用 `~`，因为这是 CLI 项目中 Angular 框架依赖项的默认设置。
 *
 */
const fallbackMaterialVersionRange = `~0.0.0-PLACEHOLDER`;

/**
 * Schematic factory entry-point for the `ng-add` schematic. The ng-add schematic will be
 * automatically executed if developers run `ng add @angular/material`.
 *
 * `ng-add` 原理图的工厂入口点。如果开发者运行 `ng add @angular/material`，则将自动执行这个 ng-add 原理图。
 *
 * Since the Angular Material schematics depend on the schematic utility functions from the CDK,
 * we need to install the CDK before loading the schematic files that import from the CDK.
 *
 * 由于 Angular Material 原理图依赖于 CDK 的原理图实用函数，因此我们需要在加载从 CDK 导入的原理图文件之前安装 CDK。
 *
 */
export default function(options: Schema): Rule {
  return (host: Tree, context: SchematicContext) => {
    // Version tag of the `@angular/core` dependency that has been loaded from the `package.json`
    // of the CLI project. This tag should be preferred because all Angular dependencies should
    // have the same version tag if possible.
    const ngCoreVersionTag = getPackageVersionFromPackageJson(host, '@angular/core');
    const materialVersionRange = getPackageVersionFromPackageJson(host, '@angular/material');
    const angularDependencyVersion = ngCoreVersionTag || `0.0.0-NG`;

    // The CLI inserts `@angular/material` into the `package.json` before this schematic runs.
    // This means that we do not need to insert Angular Material into `package.json` files again.
    // In some cases though, it could happen that this schematic runs outside of the CLI `ng add`
    // command, or Material is only listed a dev dependency. If that is the case, we insert a
    // version based on the current build version (substituted version placeholder).
    if (materialVersionRange === null) {
      addPackageToPackageJson(host, '@angular/material', fallbackMaterialVersionRange);
    }

    addPackageToPackageJson(
        host, '@angular/cdk', materialVersionRange || fallbackMaterialVersionRange);
    addPackageToPackageJson(host, '@angular/forms', angularDependencyVersion);
    addPackageToPackageJson(host, '@angular/animations', angularDependencyVersion);

    // Since the Angular Material schematics depend on the schematic utility functions from the
    // CDK, we need to install the CDK before loading the schematic files that import from the CDK.
    const installTaskId = context.addTask(new NodePackageInstallTask());

    context.addTask(new RunSchematicTask('ng-add-setup-project', options), [installTaskId]);
  };
}
