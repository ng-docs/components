/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

/**
 * Returns an error to be thrown when there is no usable data.
 *
 * 返回没有可用数据时抛出的错误。
 *
 * @docs-private
 */
export function getTreeNoValidDataSourceError() {
  return Error(`A valid data source must be provided.`);
}

/**
 * Returns an error to be thrown when there are multiple nodes that are missing a when function.
 *
 * 返回当多个节点都缺少 when 谓词时要抛出的错误。
 *
 * @docs-private
 */
export function getTreeMultipleDefaultNodeDefsError() {
  return Error(`There can only be one default row without a when predicate function.`);
}

/**
 * Returns an error to be thrown when there are no matching node defs for a particular set of data.
 *
 * 返回当某个特定数据集没有匹配的节点定义时要抛出的错误。
 *
 * @docs-private
 */
export function getTreeMissingMatchingNodeDefError() {
  return Error(`Could not find a matching node definition for the provided node data.`);
}

/**
 * Returns an error to be thrown when there are tree control.
 *
 * 返回找不到树形控件时抛出的错误。
 *
 * @docs-private
 */
export function getTreeControlMissingError() {
  return Error(`Could not find a tree control for the tree.`);
}

/**
 * Returns an error to be thrown when tree control did not implement functions for flat/nested node.
 *
 * 当树形控件没有为扁平/嵌套节点实现过函数时，返回一个抛出的错误。
 *
 * @docs-private
 */
export function getTreeControlFunctionsMissingError() {
  return Error(`Could not find functions for nested/flat tree in tree control.`);
}
