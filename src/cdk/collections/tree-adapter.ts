/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {SelectionModel} from './selection-model';

/**
 * Interface for a class that can flatten hierarchical structured data and re-expand the flattened
 * data back into its original structure. Should be used in conjunction with the cdk-tree.
 *
 * 类的接口，它可以把分层的结构化数据扁平化，以及把扁平化的数据重新扩展为原来的结构。应该和 cdk-tree 一起使用。
 *
 */
export interface TreeDataNodeFlattener<T> {
  /**
   * Transforms a set of hierarchical structured data into a flattened data array.
   *
   * 将一组分层的结构化数据转换成一个展平的数据数组。
   *
   */
  flattenNodes(structuredData: any[]): T[];

  /**
   * Expands a flattened array of data into its hierarchical form using the provided expansion
   * model.
   *
   * 使用提供的扩展模型将展平的数据数组扩展为层次结构。
   *
   */
  expandFlattenedNodes(nodes: T[], expansionModel: SelectionModel<T>): T[];

  /**
   * Put node descendants of node in array.
   * If `onlyExpandable` is true, then only process expandable descendants.
   *
   * 把节点的后代置于数组中。如果 `onlyExpandable` 为 true，则只处理可展开的后代。
   *
   */
  nodeDescendents(node: T, nodes: T[], onlyExpandable: boolean): void;
}
