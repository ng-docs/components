/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

/**
 * Returns an error to be thrown when attempting to find an nonexistent column.
 *
 * 返回试图查找不存在的列时要抛出的错误。
 *
 * @param id Id whose lookup failed.
 *
 * 查找失败的 ID
 *
 * @docs-private
 */
export function getTableUnknownColumnError(id: string) {
  return Error(`Could not find column with id "${id}".`);
}

/**
 * Returns an error to be thrown when two column definitions have the same name.
 *
 * 返回当两个列定义具有相同的列名时抛出的错误。
 *
 * @docs-private
 */
export function getTableDuplicateColumnNameError(name: string) {
  return Error(`Duplicate column definition name provided: "${name}".`);
}

/**
 * Returns an error to be thrown when there are multiple rows that are missing a when function.
 *
 * 当有多个行缺少 when 函数时，返回一个要抛出的错误。
 *
 * @docs-private
 */
export function getTableMultipleDefaultRowDefsError() {
  return Error(`There can only be one default row without a when predicate function.`);
}

/**
 * Returns an error to be thrown when there are no matching row defs for a particular set of data.
 *
 * 返回当某个特定数据集没有匹配的行定义时要抛出的错误。
 *
 * @docs-private
 */
export function getTableMissingMatchingRowDefError(data: any) {
  return Error(
    `Could not find a matching row definition for the` +
      `provided row data: ${JSON.stringify(data)}`,
  );
}

/**
 * Returns an error to be thrown when there is no row definitions present in the content.
 *
 * 返回当内容中没有行定义时要抛出的错误。
 *
 * @docs-private
 */
export function getTableMissingRowDefsError() {
  return Error(
    'Missing definitions for header, footer, and row; ' +
      'cannot determine which columns should be rendered.',
  );
}

/**
 * Returns an error to be thrown when the data source does not match the compatible types.
 *
 * 返回当数据源与可兼容类型不匹配时抛出的错误。
 *
 * @docs-private
 */
export function getTableUnknownDataSourceError() {
  return Error(`Provided data source did not match an array, Observable, or DataSource`);
}

/**
 * Returns an error to be thrown when the text column cannot find a parent table to inject.
 *
 * 当文本列找不到要注入的父表格时，返回一个抛出的错误。
 *
 * @docs-private
 */
export function getTableTextColumnMissingParentTableError() {
  return Error(`Text column could not find a parent table for registration.`);
}

/**
 * Returns an error to be thrown when a table text column doesn't have a name.
 *
 * 当表格的文本列没有列名时，返回一个抛出的错误。
 *
 * @docs-private
 */
export function getTableTextColumnMissingNameError() {
  return Error(`Table text column must have a name.`);
}
