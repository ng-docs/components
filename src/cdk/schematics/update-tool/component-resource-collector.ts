/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {dirname} from 'path';
import * as ts from 'typescript';
import {FileSystem, WorkspacePath} from './file-system';
import {getAngularDecorators} from './utils/decorators';
import {unwrapExpression} from './utils/functions';
import {
  computeLineStartsMap,
  getLineAndCharacterFromPosition,
  LineAndCharacter,
} from './utils/line-mappings';
import {getPropertyNameText} from './utils/property-name';

export interface ResolvedResource {
  /**
   * Class declaration that contains this resource.
   *
   * 包含此资源的类声明。
   *
   */
  container: ts.ClassDeclaration | null;
  /**
   * File content of the given template.
   *
   * 给定模板的文件内容。
   *
   */
  content: string;
  /**
   * Start offset of the resource content (e.g. in the inline source file)
   *
   * 资源内容的起始偏移量（例如，内联源文件中的偏移量）
   *
   */
  start: number;
  /**
   * Whether the given resource is inline or not.
   *
   * 给定资源是否为内联。
   *
   */
  inline: boolean;
  /**
   * Path to the file that contains this resource.
   *
   * 包含此资源的文件的路径。
   *
   */
  filePath: WorkspacePath;
  /**
   * Gets the character and line of a given position index in the resource.
   * If the resource is declared inline within a TypeScript source file, the line and
   * character are based on the full source file content.
   *
   * 获取资源中给定位置索引的字符和行。如果在 TypeScript 源文件中将资源声明为内联的，则行和字符是基于全部源文件内容的。
   *
   */
  getCharacterAndLineOfPosition: (pos: number) => LineAndCharacter;
}

/**
 * Collector that can be used to find Angular templates and stylesheets referenced within
 * given TypeScript source files (inline or external referenced files)
 *
 * 本收集器可用于查找在给定 TypeScript 源文件（内联或外部引用文件）中引用的 Angular 模板和样式表
 *
 */
export class ComponentResourceCollector {
  resolvedTemplates: ResolvedResource[] = [];
  resolvedStylesheets: ResolvedResource[] = [];

  constructor(public typeChecker: ts.TypeChecker, private _fileSystem: FileSystem) {}

  visitNode(node: ts.Node) {
    if (node.kind === ts.SyntaxKind.ClassDeclaration) {
      this._visitClassDeclaration(node as ts.ClassDeclaration);
    }
  }

  private _visitClassDeclaration(node: ts.ClassDeclaration) {
    const decorators = ts.getDecorators(node);

    if (!decorators || !decorators.length) {
      return;
    }

    const ngDecorators = getAngularDecorators(this.typeChecker, decorators);
    const componentDecorator = ngDecorators.find(dec => dec.name === 'Component');

    // In case no "@Component" decorator could be found on the current class, skip.
    if (!componentDecorator) {
      return;
    }

    const decoratorCall = componentDecorator.node.expression;

    // In case the component decorator call is not valid, skip this class declaration.
    if (decoratorCall.arguments.length !== 1) {
      return;
    }

    const componentMetadata = unwrapExpression(decoratorCall.arguments[0]);

    // Ensure that the component metadata is an object literal expression.
    if (!ts.isObjectLiteralExpression(componentMetadata)) {
      return;
    }

    const sourceFile = node.getSourceFile();
    const filePath = this._fileSystem.resolve(sourceFile.fileName);
    const sourceFileDirPath = dirname(sourceFile.fileName);

    // Walk through all component metadata properties and determine the referenced
    // HTML templates (either external or inline)
    componentMetadata.properties.forEach(property => {
      if (!ts.isPropertyAssignment(property)) {
        return;
      }

      const propertyName = getPropertyNameText(property.name);

      if (propertyName === 'styles' && ts.isArrayLiteralExpression(property.initializer)) {
        property.initializer.elements.forEach(el => {
          if (ts.isStringLiteralLike(el)) {
            // Need to add an offset of one to the start because the template quotes are
            // not part of the template content.
            const templateStartIdx = el.getStart() + 1;
            const content = stripBom(el.text);
            this.resolvedStylesheets.push({
              filePath,
              container: node,
              content,
              inline: true,
              start: templateStartIdx,
              getCharacterAndLineOfPosition: pos =>
                ts.getLineAndCharacterOfPosition(sourceFile, pos + templateStartIdx),
            });
          }
        });
      }

      // In case there is an inline template specified, ensure that the value is statically
      // analyzable by checking if the initializer is a string literal-like node.
      if (propertyName === 'template' && ts.isStringLiteralLike(property.initializer)) {
        // Need to add an offset of one to the start because the template quotes are
        // not part of the template content.
        const templateStartIdx = property.initializer.getStart() + 1;
        this.resolvedTemplates.push({
          filePath,
          container: node,
          content: property.initializer.text,
          inline: true,
          start: templateStartIdx,
          getCharacterAndLineOfPosition: pos =>
            ts.getLineAndCharacterOfPosition(sourceFile, pos + templateStartIdx),
        });
      }

      if (propertyName === 'styleUrls' && ts.isArrayLiteralExpression(property.initializer)) {
        property.initializer.elements.forEach(el => {
          if (ts.isStringLiteralLike(el)) {
            const stylesheetPath = this._fileSystem.resolve(sourceFileDirPath, el.text);
            const stylesheet = this.resolveExternalStylesheet(stylesheetPath, node);

            if (stylesheet) {
              this.resolvedStylesheets.push(stylesheet);
            }
          }
        });
      }

      if (propertyName === 'templateUrl' && ts.isStringLiteralLike(property.initializer)) {
        const templateUrl = property.initializer.text;
        const templatePath = this._fileSystem.resolve(sourceFileDirPath, templateUrl);

        // In case the template does not exist in the file system, skip this
        // external template.
        if (!this._fileSystem.fileExists(templatePath)) {
          return;
        }

        const fileContent = this._fileSystem.read(templatePath);

        if (fileContent) {
          const lineStartsMap = computeLineStartsMap(fileContent);

          this.resolvedTemplates.push({
            filePath: templatePath,
            container: node,
            content: fileContent,
            inline: false,
            start: 0,
            getCharacterAndLineOfPosition: p => getLineAndCharacterFromPosition(lineStartsMap, p),
          });
        }
      }
    });
  }

  /**
   * Resolves an external stylesheet by reading its content and computing line mappings.
   *
   * 通过读取其内容并计算行映射来解析外部样式表。
   *
   */
  resolveExternalStylesheet(
    filePath: WorkspacePath,
    container: ts.ClassDeclaration | null,
  ): ResolvedResource | null {
    // Strip the BOM to avoid issues with the Sass compiler. See:
    // https://github.com/angular/components/issues/24227#issuecomment-1200934258
    const fileContent = stripBom(this._fileSystem.read(filePath) || '');

    if (!fileContent) {
      return null;
    }

    const lineStartsMap = computeLineStartsMap(fileContent);

    return {
      filePath: filePath,
      container: container,
      content: fileContent,
      inline: false,
      start: 0,
      getCharacterAndLineOfPosition: pos => getLineAndCharacterFromPosition(lineStartsMap, pos),
    };
  }
}

/** Strips the BOM from a string. */
function stripBom(content: string): string {
  return content.replace(/\uFEFF/g, '');
}
