/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {FileSystem} from '@angular/cdk/schematics';
import {dirname, resolve} from 'path';
import * as ts from 'typescript';

// tslint:disable:no-bitwise

/**
 * Enum describing the possible states of an analyzed import.
 *
 * 枚举，描述已分析的导入的可能状态。
 *
 */
const enum ImportState {
  UNMODIFIED = 0b0,
  MODIFIED = 0b10,
  ADDED = 0b100,
  DELETED = 0b1000,
}

/**
 * Interface describing an import specifier.
 *
 * 描述导入说明符的接口。
 *
 */
interface ImportSpecifier {
  name: ts.Identifier;
  propertyName?: ts.Identifier;
}

/**
 * Interface describing an analyzed import.
 *
 * 描述已分析的导入的接口。
 *
 */
interface AnalyzedImport {
  node: ts.ImportDeclaration;
  moduleName: string;
  name?: ts.Identifier;
  specifiers?: ImportSpecifier[];
  namespace?: boolean;
  state: ImportState;
}

/**
 * Checks whether an analyzed import has the given import flag set.
 *
 * 检查已分析的导入是否已设置给定的导入标志。
 *
 */
const hasFlag = (data: AnalyzedImport, flag: ImportState) => (data.state & flag) !== 0;

/**
 * Import manager that can be used to add or remove TypeScript imports within source
 * files. The manager ensures that multiple transformations are applied properly
 * without shifted offsets and that existing imports are re-used.
 *
 * 导入管理器，可用于在源文件中添加或删除 TypeScript 导入。管理器确保正确应用多个转换而不会偏移，并且重新使用现有的导入。
 *
 */
export class ImportManager {
  /**
   * Map of source-files and their previously used identifier names.
   *
   * 源文件及其以前使用的标识符名称的映射表。
   *
   */
  private _usedIdentifierNames = new Map<ts.SourceFile, string[]>();

  /**
   * Map of source files and their analyzed imports.
   *
   * 源文件及其已分析导入的映射表。
   *
   */
  private _importCache = new Map<ts.SourceFile, AnalyzedImport[]>();

  constructor(private _fileSystem: FileSystem, private _printer: ts.Printer) {}

  /**
   * Analyzes the import of the specified source file if needed. In order to perform
   * modifications to imports of a source file, we store all imports in memory and
   * update the source file once all changes have been made. This is essential to
   * ensure that we can re-use newly added imports and not break file offsets.
   *
   * 如果需要，分析指定源文件的导入。为了对源文件的导入进行修改，我们将所有导入存储在内存中，并在进行所有更改后更新源文件。这对于确保我们可以复用新添加的导入并且不破坏文件偏移量至关重要。
   *
   */
  private _analyzeImportsIfNeeded(sourceFile: ts.SourceFile): AnalyzedImport[] {
    if (this._importCache.has(sourceFile)) {
      return this._importCache.get(sourceFile)!;
    }

    const result: AnalyzedImport[] = [];
    for (let node of sourceFile.statements) {
      if (!ts.isImportDeclaration(node) || !ts.isStringLiteral(node.moduleSpecifier)) {
        continue;
      }

      const moduleName = node.moduleSpecifier.text;

      // Handles side-effect imports which do neither have a name or
      // specifiers. e.g. `import "my-package";`
      if (!node.importClause) {
        result.push({moduleName, node, state: ImportState.UNMODIFIED});
        continue;
      }

      // Handles imports resolving to default exports of a module.
      // e.g. `import moment from "moment";`
      if (!node.importClause.namedBindings) {
        result.push({
          moduleName,
          node,
          name: node.importClause.name,
          state: ImportState.UNMODIFIED,
        });
        continue;
      }

      // Handles imports with individual symbol specifiers.
      // e.g. `import {A, B, C} from "my-module";`
      if (ts.isNamedImports(node.importClause.namedBindings)) {
        result.push({
          moduleName,
          node,
          specifiers: node.importClause.namedBindings.elements.map(el => ({
            name: el.name,
            propertyName: el.propertyName,
          })),
          state: ImportState.UNMODIFIED,
        });
      } else {
        // Handles namespaced imports. e.g. `import * as core from "my-pkg";`
        result.push({
          moduleName,
          node,
          name: node.importClause.namedBindings.name,
          namespace: true,
          state: ImportState.UNMODIFIED,
        });
      }
    }
    this._importCache.set(sourceFile, result);
    return result;
  }

  /**
   * Checks whether the given specifier, which can be relative to the base path,
   * matches the passed module name.
   *
   * 检查给定的说明符（可以相对于基本路径）是否与传递的模块名称匹配。
   *
   */
  private _isModuleSpecifierMatching(
    basePath: string,
    specifier: string,
    moduleName: string,
  ): boolean {
    return specifier.startsWith('.')
      ? resolve(basePath, specifier) === resolve(basePath, moduleName)
      : specifier === moduleName;
  }

  /**
   * Deletes a given named binding import from the specified source file.
   *
   * 从指定的源文件中删除给定的命名绑定导入。
   *
   */
  deleteNamedBindingImport(sourceFile: ts.SourceFile, symbolName: string, moduleName: string) {
    const sourceDir = dirname(sourceFile.fileName);
    const fileImports = this._analyzeImportsIfNeeded(sourceFile);

    for (let importData of fileImports) {
      if (
        !this._isModuleSpecifierMatching(sourceDir, importData.moduleName, moduleName) ||
        !importData.specifiers
      ) {
        continue;
      }

      const specifierIndex = importData.specifiers.findIndex(
        d => (d.propertyName || d.name).text === symbolName,
      );
      if (specifierIndex !== -1) {
        importData.specifiers.splice(specifierIndex, 1);
        // if the import does no longer contain any specifiers after the removal of the
        // given symbol, we can just mark the whole import for deletion. Otherwise, we mark
        // it as modified so that it will be re-printed.
        if (importData.specifiers.length === 0) {
          importData.state |= ImportState.DELETED;
        } else {
          importData.state |= ImportState.MODIFIED;
        }
      }
    }
  }

  /**
   * Deletes the import that matches the given import declaration if found.
   *
   * 如果找到，则删除与给定导入声明匹配的导入。
   *
   */
  deleteImportByDeclaration(declaration: ts.ImportDeclaration) {
    const fileImports = this._analyzeImportsIfNeeded(declaration.getSourceFile());
    for (let importData of fileImports) {
      if (importData.node === declaration) {
        importData.state |= ImportState.DELETED;
      }
    }
  }

  /**
   * Adds an import to the given source file and returns the TypeScript expression that
   * can be used to access the newly imported symbol.
   *
   * 将导入添加到给定的源文件中，并返回可用于访问新导入的符号的 TypeScript 表达式。
   *
   * Whenever an import is added to a source file, it's recommended that the returned
   * expression is used to reference th symbol. This is necessary because the symbol
   * could be aliased if it would collide with existing imports in source file.
   *
   * 每当将导入添加到源文件时，建议将返回的表达式用于引用符号。这是必需的，因为如果符号会与源文件中的现有导入相冲突，则可能会为其加上别名。
   *
   * @param sourceFile Source file to which the import should be added.
   *
   * 要将此导入添加到的源文件。
   *
   * @param symbolName Name of the symbol that should be imported. Can be null if
   *    the default export is requested.
   *
   * 用导入的符号名称。如果请求的是默认导出，则可以为 null。
   *
   * @param moduleName Name of the module of which the symbol should be imported.
   *
   * 要导入符号的模块的名称。
   *
   * @param typeImport Whether the symbol is a type.
   *
   * 符号是否为类型。
   *
   * @param ignoreIdentifierCollisions List of identifiers which can be ignored when
   *    the import manager checks for import collisions.
   *
   * 导入管理器检查导入冲突时可以忽略的标识符列表。
   *
   */
  addImportToSourceFile(
    sourceFile: ts.SourceFile,
    symbolName: string | null,
    moduleName: string,
    typeImport = false,
    ignoreIdentifierCollisions: ts.Identifier[] = [],
  ): ts.Expression {
    const sourceDir = dirname(sourceFile.fileName);
    const fileImports = this._analyzeImportsIfNeeded(sourceFile);

    let existingImport: AnalyzedImport | null = null;
    for (let importData of fileImports) {
      if (!this._isModuleSpecifierMatching(sourceDir, importData.moduleName, moduleName)) {
        continue;
      }

      // If no symbol name has been specified, the default import is requested. In that
      // case we search for non-namespace and non-specifier imports.
      if (!symbolName && !importData.namespace && !importData.specifiers) {
        return ts.factory.createIdentifier(importData.name!.text);
      }

      // In case a "Type" symbol is imported, we can't use namespace imports
      // because these only export symbols available at runtime (no types)
      if (importData.namespace && !typeImport) {
        return ts.factory.createPropertyAccessExpression(
          ts.factory.createIdentifier(importData.name!.text),
          ts.factory.createIdentifier(symbolName || 'default'),
        );
      } else if (importData.specifiers && symbolName) {
        const existingSpecifier = importData.specifiers.find(s =>
          s.propertyName ? s.propertyName.text === symbolName : s.name.text === symbolName,
        );

        if (existingSpecifier) {
          return ts.factory.createIdentifier(existingSpecifier.name.text);
        }

        // In case the symbol could not be found in an existing import, we
        // keep track of the import declaration as it can be updated to include
        // the specified symbol name without having to create a new import.
        existingImport = importData;
      }
    }

    // If there is an existing import that matches the specified module, we
    // just update the import specifiers to also import the requested symbol.
    if (existingImport) {
      const propertyIdentifier = ts.factory.createIdentifier(symbolName!);
      const generatedUniqueIdentifier = this._getUniqueIdentifier(
        sourceFile,
        symbolName!,
        ignoreIdentifierCollisions,
      );
      const needsGeneratedUniqueName = generatedUniqueIdentifier.text !== symbolName;
      const importName = needsGeneratedUniqueName ? generatedUniqueIdentifier : propertyIdentifier;

      existingImport.specifiers!.push({
        name: importName,
        propertyName: needsGeneratedUniqueName ? propertyIdentifier : undefined,
      });
      existingImport.state |= ImportState.MODIFIED;

      if (hasFlag(existingImport, ImportState.DELETED)) {
        // unset the deleted flag if the import is pending deletion, but
        // can now be used for the new imported symbol.
        existingImport.state &= ~ImportState.DELETED;
      }

      return importName;
    }

    let identifier: ts.Identifier | null = null;
    let newImport: AnalyzedImport | null = null;

    if (symbolName) {
      const propertyIdentifier = ts.factory.createIdentifier(symbolName);
      const generatedUniqueIdentifier = this._getUniqueIdentifier(
        sourceFile,
        symbolName,
        ignoreIdentifierCollisions,
      );
      const needsGeneratedUniqueName = generatedUniqueIdentifier.text !== symbolName;
      identifier = needsGeneratedUniqueName ? generatedUniqueIdentifier : propertyIdentifier;

      const newImportDecl = ts.factory.createImportDeclaration(
        undefined,
        undefined,
        ts.factory.createImportClause(false, undefined, ts.factory.createNamedImports([])),
        ts.factory.createStringLiteral(moduleName),
      );

      newImport = {
        moduleName,
        node: newImportDecl,
        specifiers: [
          {
            propertyName: needsGeneratedUniqueName ? propertyIdentifier : undefined,
            name: identifier,
          },
        ],
        state: ImportState.ADDED,
      };
    } else {
      identifier = this._getUniqueIdentifier(
        sourceFile,
        'defaultExport',
        ignoreIdentifierCollisions,
      );
      const newImportDecl = ts.factory.createImportDeclaration(
        undefined,
        undefined,
        ts.factory.createImportClause(false, identifier, undefined),
        ts.factory.createStringLiteral(moduleName),
      );
      newImport = {
        moduleName,
        node: newImportDecl,
        name: identifier,
        state: ImportState.ADDED,
      };
    }
    fileImports.push(newImport);
    return identifier;
  }

  /**
   * Applies the recorded changes in the update recorders of the corresponding source files.
   * The changes are applied separately after all changes have been recorded because otherwise
   * file offsets will change and the source files would need to be re-parsed after each change.
   *
   * 将已记录的更改应用到相应源文件的更新记录器中。记录所有更改后，将分别应用更改，因为如果不这样，文件偏移就会发生变化，并且每次更改后都需要重新解析源文件。
   *
   */
  recordChanges() {
    this._importCache.forEach((fileImports, sourceFile) => {
      const recorder = this._fileSystem.edit(this._fileSystem.resolve(sourceFile.fileName));
      const lastUnmodifiedImport = fileImports
        .reverse()
        .find(i => i.state === ImportState.UNMODIFIED);
      const importStartIndex = lastUnmodifiedImport
        ? this._getEndPositionOfNode(lastUnmodifiedImport.node)
        : 0;

      fileImports.forEach(importData => {
        if (importData.state === ImportState.UNMODIFIED) {
          return;
        }

        if (hasFlag(importData, ImportState.DELETED)) {
          // Imports which do not exist in source file, can be just skipped as
          // we do not need any replacement to delete the import.
          if (!hasFlag(importData, ImportState.ADDED)) {
            recorder.remove(importData.node.getFullStart(), importData.node.getFullWidth());
          }
          return;
        }

        if (importData.specifiers) {
          const namedBindings = importData.node.importClause!.namedBindings as ts.NamedImports;
          const importSpecifiers = importData.specifiers.map(s =>
            ts.factory.createImportSpecifier(false, s.propertyName, s.name),
          );
          const updatedBindings = ts.factory.updateNamedImports(namedBindings, importSpecifiers);

          // In case an import has been added newly, we need to print the whole import
          // declaration and insert it at the import start index. Otherwise, we just
          // update the named bindings to not re-print the whole import (which could
          // cause unnecessary formatting changes)
          if (hasFlag(importData, ImportState.ADDED)) {
            const updatedImport = ts.factory.updateImportDeclaration(
              importData.node,
              undefined,
              undefined,
              ts.factory.createImportClause(false, undefined, updatedBindings),
              ts.factory.createStringLiteral(importData.moduleName),
              undefined,
            );
            const newImportText = this._printer.printNode(
              ts.EmitHint.Unspecified,
              updatedImport,
              sourceFile,
            );
            recorder.insertLeft(
              importStartIndex,
              importStartIndex === 0 ? `${newImportText}\n` : `\n${newImportText}`,
            );
            return;
          } else if (hasFlag(importData, ImportState.MODIFIED)) {
            const newNamedBindingsText = this._printer.printNode(
              ts.EmitHint.Unspecified,
              updatedBindings,
              sourceFile,
            );
            recorder.remove(namedBindings.getStart(), namedBindings.getWidth());
            recorder.insertRight(namedBindings.getStart(), newNamedBindingsText);
            return;
          }
        } else if (hasFlag(importData, ImportState.ADDED)) {
          const newImportText = this._printer.printNode(
            ts.EmitHint.Unspecified,
            importData.node,
            sourceFile,
          );
          recorder.insertLeft(
            importStartIndex,
            importStartIndex === 0 ? `${newImportText}\n` : `\n${newImportText}`,
          );
          return;
        }

        // we should never hit this, but we rather want to print a custom exception
        // instead of just skipping imports silently.
        throw Error('Unexpected import modification.');
      });
    });
  }

  /**
   * Corrects the line and character position of a given node. Since nodes of
   * source files are immutable and we sometimes make changes to the containing
   * source file, the node position might shift (e.g. if we add a new import before).
   *
   * 校正给定节点的行和字符位置。由于源文件的节点是不可变的，并且有时我们会对包含的源文件进行更改，因此节点位置可能会发生变化（例如，如果我们之前添加了新的导入）。
   *
   * This method can be used to retrieve a corrected position of the given node. This
   * is helpful when printing out error messages which should reflect the new state of
   * source files.
   *
   * 此方法可用于检索给定节点的已校正位置。在打印应该反映源文件新状态的错误消息时，这很有用。
   *
   */
  correctNodePosition(node: ts.Node, offset: number, position: ts.LineAndCharacter) {
    const sourceFile = node.getSourceFile();

    if (!this._importCache.has(sourceFile)) {
      return position;
    }

    const newPosition: ts.LineAndCharacter = {...position};
    const fileImports = this._importCache.get(sourceFile)!;

    for (let importData of fileImports) {
      const fullEnd = importData.node.getFullStart() + importData.node.getFullWidth();
      // Subtract or add lines based on whether an import has been deleted or removed
      // before the actual node offset.
      if (offset > fullEnd && hasFlag(importData, ImportState.DELETED)) {
        newPosition.line--;
      } else if (offset > fullEnd && hasFlag(importData, ImportState.ADDED)) {
        newPosition.line++;
      }
    }
    return newPosition;
  }

  /**
   * Returns an unique identifier name for the specified symbol name.
   *
   * 返回具有指定符号名称的唯一标识符名称。
   *
   * @param sourceFile Source file to check for identifier collisions.
   *
   * 用于检查标识符冲突的源文件。
   *
   * @param symbolName Name of the symbol for which we want to generate an unique name.
   *
   * 我们要为其生成唯一名称的符号的名称。
   *
   * @param ignoreIdentifierCollisions List of identifiers which should be ignored when
   *    checking for identifier collisions in the given source file.
   *
   * 在给定源文件中检查标识符冲突时应忽略的标识符列表。
   *
   */
  private _getUniqueIdentifier(
    sourceFile: ts.SourceFile,
    symbolName: string,
    ignoreIdentifierCollisions: ts.Identifier[],
  ): ts.Identifier {
    if (this._isUniqueIdentifierName(sourceFile, symbolName, ignoreIdentifierCollisions)) {
      this._recordUsedIdentifier(sourceFile, symbolName);
      return ts.factory.createIdentifier(symbolName);
    }

    let name: string | null = null;
    let counter = 1;
    do {
      name = `${symbolName}_${counter++}`;
    } while (!this._isUniqueIdentifierName(sourceFile, name, ignoreIdentifierCollisions));

    this._recordUsedIdentifier(sourceFile, name!);
    return ts.factory.createIdentifier(name!);
  }

  /**
   * Checks whether the specified identifier name is used within the given source file.
   *
   * 检查指定的标识符名称是否要在给定的源文件中使用。
   *
   * @param sourceFile Source file to check for identifier collisions.
   *
   * 用于检查标识符冲突的源文件。
   *
   * @param name Name of the identifier which is checked for its uniqueness.
   *
   * 要检查其唯一性的标识符名称。
   *
   * @param ignoreIdentifierCollisions List of identifiers which should be ignored when
   *    checking for identifier collisions in the given source file.
   *
   * 在给定源文件中检查标识符冲突时应忽略的标识符列表。
   *
   */
  private _isUniqueIdentifierName(
    sourceFile: ts.SourceFile,
    name: string,
    ignoreIdentifierCollisions: ts.Identifier[],
  ) {
    if (
      this._usedIdentifierNames.has(sourceFile) &&
      this._usedIdentifierNames.get(sourceFile)!.indexOf(name) !== -1
    ) {
      return false;
    }

    // Walk through the source file and search for an identifier matching
    // the given name. In that case, it's not guaranteed that this name
    // is unique in the given declaration scope and we just return false.
    const nodeQueue: ts.Node[] = [sourceFile];
    while (nodeQueue.length) {
      const node = nodeQueue.shift()!;
      if (
        ts.isIdentifier(node) &&
        node.text === name &&
        !ignoreIdentifierCollisions.includes(node)
      ) {
        return false;
      }
      nodeQueue.push(...node.getChildren());
    }
    return true;
  }

  /**
   * Records that the given identifier is used within the specified source file. This
   * is necessary since we do not apply changes to source files per change, but still
   * want to avoid conflicts with newly imported symbols.
   *
   * 记录要在给定的源文件中使用的给定标识符。这是必要的，因为我们不会在每次更改时都将更改应用于源文件，但仍希望避免与新导入的符号发生冲突。
   *
   */
  private _recordUsedIdentifier(sourceFile: ts.SourceFile, identifierName: string) {
    this._usedIdentifierNames.set(
      sourceFile,
      (this._usedIdentifierNames.get(sourceFile) || []).concat(identifierName),
    );
  }

  /**
   * Determines the full end of a given node. By default the end position of a node is
   * before all trailing comments. This could mean that generated imports shift comments.
   *
   * 确定给定节点的完整结束位置。默认情况下，节点的结束位置在所有尾随注释之前。这可能意味着生成的导入会更改注释。
   *
   */
  private _getEndPositionOfNode(node: ts.Node) {
    const nodeEndPos = node.getEnd();
    const commentRanges = ts.getTrailingCommentRanges(node.getSourceFile().text, nodeEndPos);
    if (!commentRanges || !commentRanges.length) {
      return nodeEndPos;
    }
    return commentRanges[commentRanges.length - 1]!.end;
  }
}
