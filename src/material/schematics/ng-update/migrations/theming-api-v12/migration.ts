/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  materialMixins,
  materialFunctions,
  materialVariables,
  cdkMixins,
  cdkVariables,
  removedMaterialVariables,
  unprefixedRemovedVariables,
} from './config';

/**
 * The result of a search for imports and namespaces in a file.
 *
 * 在文件中搜索导入和命名空间的结果。
 *
 */
interface DetectImportResult {
  imports: string[];
  namespaces: string[];
}

/**
 * Addition mixin and function names that can be updated when invoking migration directly.
 *
 * 添加可以在直接调用迁移时更新的 mixin 和函数名称。
 *
 */
interface ExtraSymbols {
  mixins?: Record<string, string>;
  functions?: Record<string, string>;
  variables?: Record<string, string>;
}

/**
 * Possible pairs of comment characters in a Sass file.
 *
 * Sass 文件中可能的注释字符对。
 *
 */
const commentPairs = new Map<string, string>([
  ['/*', '*/'],
  ['//', '\n'],
]);

/**
 * Prefix for the placeholder that will be used to escape comments.
 *
 * 将用于转义注释的占位符的前缀。
 *
 */
const commentPlaceholderStart = '__<<ngThemingMigrationEscapedComment';

/**
 * Suffix for the comment escape placeholder.
 *
 * 注释转义占位符的后缀。
 *
 */
const commentPlaceholderEnd = '>>__';

/**
 * Migrates the content of a file to the new theming API. Note that this migration is using plain
 * string manipulation, rather than the AST from PostCSS and the schematics string manipulation
 * APIs, because it allows us to run it inside g3 and to avoid introducing new dependencies.
 *
 * 将文件的内容迁移到新的主题 API。请注意，此迁移使用纯字符串操作，而不是来自 PostCSS 的 AST 和原理图字符串操作 API，因为这能让我们在 g3 中运行它并避免引入新的依赖项。
 *
 * @param fileContent Content of the file.
 *
 * 文件的内容。
 *
 * @param oldMaterialPrefix Prefix with which the old Material imports should start.
 *   Has to end with a slash. E.g. if `@import '@angular/material/theming'` should be
 *   matched, the prefix would be `@angular/material/`.
 *
 * 旧 Material 导入的前缀。必须以斜线结尾。例如，如果要匹配的是 `@import '@angular/material/theming'`，则前缀将是 `@angular/material/` 。
 *
 * @param oldCdkPrefix Prefix with which the old CDK imports should start.
 *   Has to end with a slash. E.g. if `@import '@angular/cdk/overlay'` should be
 *   matched, the prefix would be `@angular/cdk/`.
 *
 * 旧 CDK 导入的前缀。必须以斜线结尾。例如，如果要匹配的是 `@import '@angular/cdk/overlay'`，前缀将是 `@angular/cdk/` 。
 *
 * @param newMaterialImportPath New import to the Material theming API (e.g. `@angular/material`).
 *
 * Material 主题 API 的新导入（例如 `@angular/material` ）。
 *
 * @param newCdkImportPath New import to the CDK Sass APIs (e.g. `@angular/cdk`).
 *
 * CDK Sass API 的新导入（例如 `@angular/cdk` ）。
 *
 * @param excludedImports Pattern that can be used to exclude imports from being processed.
 *
 * 可用于从处理过程中排除导入的模式。
 *
 */
export function migrateFileContent(
  fileContent: string,
  oldMaterialPrefix: string,
  oldCdkPrefix: string,
  newMaterialImportPath: string,
  newCdkImportPath: string,
  extraMaterialSymbols: ExtraSymbols = {},
  excludedImports?: RegExp,
): string {
  let {content, placeholders} = escapeComments(fileContent);
  const materialResults = detectImports(content, oldMaterialPrefix, excludedImports);
  const cdkResults = detectImports(content, oldCdkPrefix, excludedImports);

  // Try to migrate the symbols even if there are no imports. This is used
  // to cover the case where the Components symbols were used transitively.
  content = migrateCdkSymbols(content, newCdkImportPath, placeholders, cdkResults);
  content = migrateMaterialSymbols(
    content,
    newMaterialImportPath,
    materialResults,
    placeholders,
    extraMaterialSymbols,
  );
  content = replaceRemovedVariables(content, removedMaterialVariables);

  // We can assume that the migration has taken care of any Components symbols that were
  // imported transitively so we can always drop the old imports. We also assume that imports
  // to the new entry points have been added already.
  if (materialResults.imports.length) {
    content = replaceRemovedVariables(content, unprefixedRemovedVariables);
    content = removeStrings(content, materialResults.imports);
  }

  if (cdkResults.imports.length) {
    content = removeStrings(content, cdkResults.imports);
  }

  return restoreComments(content, placeholders);
}

/**
 * Counts the number of imports with a specific prefix and extracts their namespaces.
 *
 * 计算具有特定前缀的导入数量并提取它们的命名空间。
 *
 * @param content File content in which to look for imports.
 *
 * 要在其中查找导入的文件内容。
 *
 * @param prefix Prefix that the imports should start with.
 *
 * 导入应该带有的前缀。
 *
 * @param excludedImports Pattern that can be used to exclude imports from being processed.
 *
 * 可用于从处理过程中排除导入的模式。
 *
 */
function detectImports(
  content: string,
  prefix: string,
  excludedImports?: RegExp,
): DetectImportResult {
  if (prefix[prefix.length - 1] !== '/') {
    // Some of the logic further down makes assumptions about the import depth.
    throw Error(`Prefix "${prefix}" has to end in a slash.`);
  }

  // List of `@use` namespaces from which Angular CDK/Material APIs may be referenced.
  // Since we know that the library doesn't have any name collisions, we can treat all of these
  // namespaces as equivalent.
  const namespaces: string[] = [];
  const imports: string[] = [];
  const pattern = new RegExp(`@(import|use) +['"]~?${escapeRegExp(prefix)}.*['"].*;?\n`, 'g');
  let match: RegExpExecArray | null = null;

  while ((match = pattern.exec(content))) {
    const [fullImport, type] = match;

    if (excludedImports?.test(fullImport)) {
      continue;
    }

    if (type === 'use') {
      const namespace = extractNamespaceFromUseStatement(fullImport);

      if (namespaces.indexOf(namespace) === -1) {
        namespaces.push(namespace);
      }
    }

    imports.push(fullImport);
  }

  return {imports, namespaces};
}

/**
 * Migrates the Material symbols in a file.
 *
 * 迁移文件中的 Material 符号。
 *
 */
function migrateMaterialSymbols(
  content: string,
  importPath: string,
  detectedImports: DetectImportResult,
  commentPlaceholders: Record<string, string>,
  extraMaterialSymbols: ExtraSymbols = {},
): string {
  const initialContent = content;
  const namespace = 'mat';

  // Migrate the mixins.
  const mixinsToUpdate = {...materialMixins, ...extraMaterialSymbols.mixins};
  content = renameSymbols(
    content,
    mixinsToUpdate,
    detectedImports.namespaces,
    mixinKeyFormatter,
    getMixinValueFormatter(namespace),
  );

  // Migrate the functions.
  const functionsToUpdate = {...materialFunctions, ...extraMaterialSymbols.functions};
  content = renameSymbols(
    content,
    functionsToUpdate,
    detectedImports.namespaces,
    functionKeyFormatter,
    getFunctionValueFormatter(namespace),
  );

  // Migrate the variables.
  const variablesToUpdate = {...materialVariables, ...extraMaterialSymbols.variables};
  content = renameSymbols(
    content,
    variablesToUpdate,
    detectedImports.namespaces,
    variableKeyFormatter,
    getVariableValueFormatter(namespace),
  );

  if (content !== initialContent) {
    // Add an import to the new API only if any of the APIs were being used.
    content = insertUseStatement(content, importPath, namespace, commentPlaceholders);
  }

  return content;
}

/**
 * Migrates the CDK symbols in a file.
 *
 * 迁移文件中的 CDK 符号。
 *
 */
function migrateCdkSymbols(
  content: string,
  importPath: string,
  commentPlaceholders: Record<string, string>,
  detectedImports: DetectImportResult,
): string {
  const initialContent = content;
  const namespace = 'cdk';

  // Migrate the mixins.
  content = renameSymbols(
    content,
    cdkMixins,
    detectedImports.namespaces,
    mixinKeyFormatter,
    getMixinValueFormatter(namespace),
  );

  // Migrate the variables.
  content = renameSymbols(
    content,
    cdkVariables,
    detectedImports.namespaces,
    variableKeyFormatter,
    getVariableValueFormatter(namespace),
  );

  // Previously the CDK symbols were exposed through `material/theming`, but now we have a
  // dedicated entrypoint for the CDK. Only add an import for it if any of the symbols are used.
  if (content !== initialContent) {
    content = insertUseStatement(content, importPath, namespace, commentPlaceholders);
  }

  return content;
}

/**
 * Renames all Sass symbols in a file based on a pre-defined mapping.
 *
 * 根据预定义的映射表重命名文件中的所有 Sass 符号。
 *
 * @param content Content of a file to be migrated.
 *
 * 要迁移的文件的内容。
 *
 * @param mapping Mapping between symbol names and their replacements.
 *
 * 符号名称及其替代品之间的映射。
 *
 * @param namespaces Names to iterate over and pass to getKeyPattern.
 *
 * 要迭代并传递给 getKeyPattern 的名称。
 *
 * @param getKeyPattern Function used to turn each of the keys into a regex.
 *
 * 用于将每个键名转换为正则表达式的函数。
 *
 * @param formatValue Formats the value that will replace any matches of the pattern returned by
 *  `getKeyPattern`.
 *
 * 格式化将替换由 `getKeyPattern` 返回的模式的任何匹配项的值。
 *
 */
function renameSymbols(
  content: string,
  mapping: Record<string, string>,
  namespaces: string[],
  getKeyPattern: (namespace: string | null, key: string) => RegExp,
  formatValue: (key: string) => string,
): string {
  // The null at the end is so that we make one last pass to cover non-namespaced symbols.
  [...namespaces.slice(), null].forEach(namespace => {
    Object.keys(mapping).forEach(key => {
      const pattern = getKeyPattern(namespace, key);

      // Sanity check since non-global regexes will only replace the first match.
      if (pattern.flags.indexOf('g') === -1) {
        throw Error('Replacement pattern must be global.');
      }

      content = content.replace(pattern, formatValue(mapping[key]));
    });
  });

  return content;
}

/**
 * Inserts an `@use` statement in a string.
 *
 * 在字符串中插入 `@use` 语句。
 *
 */
function insertUseStatement(
  content: string,
  importPath: string,
  namespace: string,
  commentPlaceholders: Record<string, string>,
): string {
  // If the content already has the `@use` import, we don't need to add anything.
  if (new RegExp(`@use +['"]${importPath}['"]`, 'g').test(content)) {
    return content;
  }

  // Sass will throw an error if an `@use` statement comes after another statement. The safest way
  // to ensure that we conform to that requirement is by always inserting our imports at the top
  // of the file. Detecting where the user's content starts is tricky, because there are many
  // different kinds of syntax we'd have to account for. One approach is to find the first `@import`
  // and insert before it, but the problem is that Sass allows `@import` to be placed anywhere.
  let newImportIndex = 0;

  // One special case is if the file starts with a license header which we want to preserve on top.
  if (content.trim().startsWith(commentPlaceholderStart)) {
    const commentStartIndex = content.indexOf(commentPlaceholderStart);
    newImportIndex =
      content.indexOf(commentPlaceholderEnd, commentStartIndex + 1) + commentPlaceholderEnd.length;
    // If the leading comment doesn't end with a newline,
    // we need to insert the import at the next line.
    if (!commentPlaceholders[content.slice(commentStartIndex, newImportIndex)].endsWith('\n')) {
      newImportIndex = Math.max(newImportIndex, content.indexOf('\n', newImportIndex) + 1);
    }
  }

  return (
    content.slice(0, newImportIndex) +
    `@use '${importPath}' as ${namespace};\n` +
    content.slice(newImportIndex)
  );
}

/**
 * Formats a migration key as a Sass mixin invocation.
 *
 * 将迁移的键名格式化为 Sass mixin 调用。
 *
 */
function mixinKeyFormatter(namespace: string | null, name: string): RegExp {
  // Note that adding a `(` at the end of the pattern would be more accurate, but mixin
  // invocations don't necessarily have to include the parentheses. We could add `[(;]`,
  // but then we won't know which character to include in the replacement string.
  return new RegExp(`@include +${escapeRegExp((namespace ? namespace + '.' : '') + name)}`, 'g');
}

/**
 * Returns a function that can be used to format a Sass mixin replacement.
 *
 * 返回一个可用于格式化 Sass mixin 替换的函数。
 *
 */
function getMixinValueFormatter(namespace: string): (name: string) => string {
  // Note that adding a `(` at the end of the pattern would be more accurate,
  // but mixin invocations don't necessarily have to include the parentheses.
  return name => `@include ${namespace}.${name}`;
}

/**
 * Formats a migration key as a Sass function invocation.
 *
 * 将迁移的键名格式化为 Sass 函数调用。
 *
 */
function functionKeyFormatter(namespace: string | null, name: string): RegExp {
  const functionName = escapeRegExp(`${namespace ? namespace + '.' : ''}${name}(`);
  return new RegExp(`(?<![-_a-zA-Z0-9])${functionName}`, 'g');
}

/**
 * Returns a function that can be used to format a Sass function replacement.
 *
 * 返回一个可用于格式化 Sass 函数替换的函数。
 *
 */
function getFunctionValueFormatter(namespace: string): (name: string) => string {
  return name => `${namespace}.${name}(`;
}

/**
 * Formats a migration key as a Sass variable.
 *
 * 将迁移键格式化为 Sass 变量。
 *
 */
function variableKeyFormatter(namespace: string | null, name: string): RegExp {
  const variableName = escapeRegExp(`${namespace ? namespace + '.' : ''}$${name}`);
  return new RegExp(`${variableName}(?![-_a-zA-Z0-9])`, 'g');
}

/**
 * Returns a function that can be used to format a Sass variable replacement.
 *
 * 返回一个可用于格式化 Sass 变量替换的函数。
 *
 */
function getVariableValueFormatter(namespace: string): (name: string) => string {
  return name => `${namespace}.$${name}`;
}

/**
 * Escapes special regex characters in a string.
 *
 * 转义字符串中的特殊正则表达式字符。
 *
 */
function escapeRegExp(str: string): string {
  return str.replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1');
}

/**
 * Removes all strings from another string.
 *
 * 从另一个字符串中删除所有字符串。
 *
 */
function removeStrings(content: string, toRemove: string[]): string {
  return toRemove
    .reduce((accumulator, current) => accumulator.replace(current, ''), content)
    .replace(/^\s+/, '');
}

/**
 * Parses out the namespace from a Sass `@use` statement.
 *
 * 从 Sass `@use` 语句中解析出命名空间。
 *
 */
function extractNamespaceFromUseStatement(fullImport: string): string {
  const closeQuoteIndex = Math.max(fullImport.lastIndexOf(`"`), fullImport.lastIndexOf(`'`));

  if (closeQuoteIndex > -1) {
    const asExpression = 'as ';
    const asIndex = fullImport.indexOf(asExpression, closeQuoteIndex);

    // If we found an ` as ` expression, we consider the rest of the text as the namespace.
    if (asIndex > -1) {
      return fullImport
        .slice(asIndex + asExpression.length)
        .split(';')[0]
        .trim();
    }

    // Otherwise the namespace is the name of the file that is being imported.
    const lastSlashIndex = fullImport.lastIndexOf('/', closeQuoteIndex);

    if (lastSlashIndex > -1) {
      const fileName = fullImport
        .slice(lastSlashIndex + 1, closeQuoteIndex)
        // Sass allows for leading underscores to be omitted and it technically supports .scss.
        .replace(/^_|(\.import)?\.scss$|\.import$/g, '');

      // Sass ignores `/index` and infers the namespace as the next segment in the path.
      if (fileName === 'index') {
        const nextSlashIndex = fullImport.lastIndexOf('/', lastSlashIndex - 1);

        if (nextSlashIndex > -1) {
          return fullImport.slice(nextSlashIndex + 1, lastSlashIndex);
        }
      } else {
        return fileName;
      }
    }
  }

  throw Error(`Could not extract namespace from import "${fullImport}".`);
}

/**
 * Replaces variables that have been removed with their values.
 *
 * 用它们的值替换已删除的变量。
 *
 * @param content Content of the file to be migrated.
 *
 * 要迁移的文件的内容。
 *
 * @param variables Mapping between variable names and their values.
 *
 * 变量名称与其值之间的映射。
 *
 */
function replaceRemovedVariables(content: string, variables: Record<string, string>): string {
  Object.keys(variables).forEach(variableName => {
    // Note that the pattern uses a negative lookahead to exclude
    // variable assignments, because they can't be migrated.
    const regex = new RegExp(`\\$${escapeRegExp(variableName)}(?!\\s+:|[-_a-zA-Z0-9:])`, 'g');
    content = content.replace(regex, variables[variableName]);
  });

  return content;
}

/**
 * Replaces all of the comments in a Sass file with placeholders and
 * returns the list of placeholders so they can be restored later.
 *
 * 用占位符替换 Sass 文件中的所有注释并返回占位符列表，以便以后可以恢复它们。
 *
 */
function escapeComments(content: string): {content: string; placeholders: Record<string, string>} {
  const placeholders: Record<string, string> = {};
  let commentCounter = 0;
  let [openIndex, closeIndex] = findComment(content);

  while (openIndex > -1 && closeIndex > -1) {
    const placeholder = commentPlaceholderStart + commentCounter++ + commentPlaceholderEnd;
    placeholders[placeholder] = content.slice(openIndex, closeIndex);
    content = content.slice(0, openIndex) + placeholder + content.slice(closeIndex);
    [openIndex, closeIndex] = findComment(content);
  }

  return {content, placeholders};
}

/**
 * Finds the start and end index of a comment in a file.
 *
 * 查找文件中注释的开始和结束索引。
 *
 */
function findComment(content: string): [openIndex: number, closeIndex: number] {
  // Add an extra new line at the end so that we can correctly capture single-line comments
  // at the end of the file. It doesn't really matter that the end index will be out of bounds,
  // because `String.prototype.slice` will clamp it to the string length.
  content += '\n';

  for (const [open, close] of commentPairs.entries()) {
    const openIndex = content.indexOf(open);

    if (openIndex > -1) {
      const closeIndex = content.indexOf(close, openIndex + 1);
      return closeIndex > -1 ? [openIndex, closeIndex + close.length] : [-1, -1];
    }
  }

  return [-1, -1];
}

/**
 * Restores the comments that have been escaped by `escapeComments`.
 *
 * 恢复被 `escapeComments` 转义的评论。
 *
 */
function restoreComments(content: string, placeholders: Record<string, string>): string {
  Object.keys(placeholders).forEach(key => (content = content.replace(key, placeholders[key])));
  return content;
}
