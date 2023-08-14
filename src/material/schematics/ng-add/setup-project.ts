/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {chain, Rule, SchematicContext, Tree} from '@angular-devkit/schematics';
import {
  addModuleImportToRootModule,
  getAppModulePath,
  getProjectFromWorkspace,
  getProjectMainFile,
  getProjectStyleFile,
  hasNgModuleImport,
  isStandaloneApp,
} from '@angular/cdk/schematics';
import {
  importsProvidersFrom,
  addFunctionalProvidersToStandaloneBootstrap,
  callsProvidersFunction,
} from '@schematics/angular/private/components';
import {getWorkspace, ProjectDefinition} from '@schematics/angular/utility/workspace';
import {ProjectType} from '@schematics/angular/utility/workspace-models';
import {addFontsToIndex} from './fonts/material-fonts';
import {Schema} from './schema';
import {addThemeToAppStyles, addTypographyClass} from './theming/theming';

/**
 * Scaffolds the basics of a Angular Material application, this includes:
 *
 * Angular Material 应用程序脚手架的基础步骤，包括：
 *
 * - Add Packages to package.json
 *
 *   将包添加到 package.json
 *
 * - Adds pre-built themes to styles.ext
 *
 *   将预先构建的主题添加到 styles.ext
 *
 * - Adds Browser Animation to app.module
 *
 *   将浏览器动画添加到 app.module
 *
 */
export default function (options: Schema): Rule {
  return async (host: Tree, context: SchematicContext) => {
    const workspace = await getWorkspace(host);
    const project = getProjectFromWorkspace(workspace, options.project);

    if (project.extensions.projectType === ProjectType.Application) {
      return chain([
        addAnimationsModule(options),
        addThemeToAppStyles(options),
        addFontsToIndex(options),
        addMaterialAppStyles(options),
        addTypographyClass(options),
      ]);
    }
    context.logger.warn(
      'Angular Material has been set up in your workspace. There is no additional setup ' +
        'required for consuming Angular Material in your library project.\n\n' +
        'If you intended to run the schematic on a different project, pass the `--project` ' +
        'option.',
    );
    return;
  };
}

/**
 * Adds an animation module to the root module of the specified project. In case the "animations"
 * option is set to false, we still add the `NoopAnimationsModule` because otherwise various
 * components of Angular Material will throw an exception.
 *
 * 将动画模块添加到指定项目的根模块。如果 “animations” 选项设置为 false，我们仍然要添加 `NoopAnimationsModule` ，否则 Angular Material 的各个组件都会抛出异常。
 *
 */
function addAnimationsModule(options: Schema) {
  return async (host: Tree, context: SchematicContext) => {
    const workspace = await getWorkspace(host);
    const project = getProjectFromWorkspace(workspace, options.project);
    const mainFilePath = getProjectMainFile(project);

    if (isStandaloneApp(host, mainFilePath)) {
      addAnimationsToStandaloneApp(host, mainFilePath, context, options);
    } else {
      addAnimationsToNonStandaloneApp(host, project, mainFilePath, context, options);
    }
  };
}

/**
 * Adds the animations module to an app that is bootstrap using the standalone component APIs.
 *
 * 将动画模块添加到使用独立组件 API 进行引导的应用程序中。
 *
 */
function addAnimationsToStandaloneApp(
  host: Tree,
  mainFile: string,
  context: SchematicContext,
  options: Schema,
) {
  const animationsFunction = 'provideAnimations';
  const noopAnimationsFunction = 'provideNoopAnimations';

  if (options.animations === 'enabled') {
    // In case the project explicitly uses provideNoopAnimations, we should print a warning
    // message that makes the user aware of the fact that we won't automatically set up
    // animations. If we would add provideAnimations while provideNoopAnimations
    // is already configured, we would cause unexpected behavior and runtime exceptions.
    if (callsProvidersFunction(host, mainFile, noopAnimationsFunction)) {
      context.logger.error(
        `Could not add "${animationsFunction}" ` +
          `because "${noopAnimationsFunction}" is already provided.`,
      );
      context.logger.info(`Please manually set up browser animations.`);
    } else {
      addFunctionalProvidersToStandaloneBootstrap(
        host,
        mainFile,
        animationsFunction,
        '@angular/platform-browser/animations',
      );
    }
  } else if (
    options.animations === 'disabled' &&
    !importsProvidersFrom(host, mainFile, animationsFunction)
  ) {
    // Do not add the provideNoopAnimations if the project already explicitly uses
    // the provideAnimations.
    addFunctionalProvidersToStandaloneBootstrap(
      host,
      mainFile,
      noopAnimationsFunction,
      '@angular/platform-browser/animations',
    );
  }
}

/**
 * Adds the animations module to an app that is bootstrap
 * using the non-standalone component APIs.
 *
 * 将动画模块添加到使用非独立组件 API 进行引导的应用程序中。
 *
 */
function addAnimationsToNonStandaloneApp(
  host: Tree,
  project: ProjectDefinition,
  mainFile: string,
  context: SchematicContext,
  options: Schema,
) {
  const browserAnimationsModuleName = 'BrowserAnimationsModule';
  const noopAnimationsModuleName = 'NoopAnimationsModule';
  const appModulePath = getAppModulePath(host, mainFile);

  if (options.animations === 'enabled') {
    // In case the project explicitly uses the NoopAnimationsModule, we should print a warning
    // message that makes the user aware of the fact that we won't automatically set up
    // animations. If we would add the BrowserAnimationsModule while the NoopAnimationsModule
    // is already configured, we would cause unexpected behavior and runtime exceptions.
    if (hasNgModuleImport(host, appModulePath, noopAnimationsModuleName)) {
      context.logger.error(
        `Could not set up "${browserAnimationsModuleName}" ` +
          `because "${noopAnimationsModuleName}" is already imported.`,
      );
      context.logger.info(`Please manually set up browser animations.`);
    } else {
      addModuleImportToRootModule(
        host,
        browserAnimationsModuleName,
        '@angular/platform-browser/animations',
        project,
      );
    }
  } else if (
    options.animations === 'disabled' &&
    !hasNgModuleImport(host, appModulePath, browserAnimationsModuleName)
  ) {
    // Do not add the NoopAnimationsModule module if the project already explicitly uses
    // the BrowserAnimationsModule.
    addModuleImportToRootModule(
      host,
      noopAnimationsModuleName,
      '@angular/platform-browser/animations',
      project,
    );
  }
}

/**
 * Adds custom Material styles to the project style file. The custom CSS sets up the Roboto font
 * and reset the default browser body margin.
 *
 * 将自定义 Material 样式添加到项目样式文件。自定义 CSS 会设置 Roboto 字体并重置默认浏览器正文边距。
 *
 */
function addMaterialAppStyles(options: Schema) {
  return async (host: Tree, context: SchematicContext) => {
    const workspace = await getWorkspace(host);
    const project = getProjectFromWorkspace(workspace, options.project);
    const styleFilePath = getProjectStyleFile(project);
    const logger = context.logger;

    if (!styleFilePath) {
      logger.error(`Could not find the default style file for this project.`);
      logger.info(`Consider manually adding the Roboto font to your CSS.`);
      logger.info(`More information at https://fonts.google.com/specimen/Roboto`);
      return;
    }

    const buffer = host.read(styleFilePath);

    if (!buffer) {
      logger.error(
        `Could not read the default style file within the project ` + `(${styleFilePath})`,
      );
      logger.info(`Please consider manually setting up the Roboto font.`);
      return;
    }

    const htmlContent = buffer.toString();
    const insertion =
      '\n' +
      `html, body { height: 100%; }\n` +
      `body { margin: 0; font-family: Roboto, "Helvetica Neue", sans-serif; }\n`;

    if (htmlContent.includes(insertion)) {
      return;
    }

    const recorder = host.beginUpdate(styleFilePath);

    recorder.insertLeft(htmlContent.length, insertion);
    host.commitUpdate(recorder);
  };
}
