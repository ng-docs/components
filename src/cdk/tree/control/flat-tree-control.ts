/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {BaseTreeControl} from './base-tree-control';

/**
 * Optional set of configuration that can be provided to the FlatTreeControl.
 *
 * 可以提供给 FlatTreeControl 的一组可选配置。
 *
 */
export interface FlatTreeControlOptions<T, K> {
  trackBy?: (dataNode: T) => K;
}

/**
 * Flat tree control. Able to expand/collapse a subtree recursively for flattened tree.
 *
 * 扁平树控件。能够对扁平树中的子树进行递归地展开/折叠。
 *
 */
export class FlatTreeControl<T, K = T> extends BaseTreeControl<T, K> {
  /**
   * Construct with flat tree data node functions getLevel and isExpandable.
   *
   * 使用扁平树数据节点的 getLevel 和 isExpandable 函数进行构造。
   *
   */
  constructor(
    public override getLevel: (dataNode: T) => number,
    public override isExpandable: (dataNode: T) => boolean,
    public options?: FlatTreeControlOptions<T, K>,
  ) {
    super();

    if (this.options) {
      this.trackBy = this.options.trackBy;
    }
  }

  /**
   * Gets a list of the data node's subtree of descendent data nodes.
   *
   * 获取后代数据节点的数据节点子树的列表。
   *
   * To make this working, the `dataNodes` of the TreeControl must be flattened tree nodes
   * with correct levels.
   *
   * 为了使它工作正常，`dataNodes` 节点必须展平为具有正确级别的树节点。
   *
   */
  getDescendants(dataNode: T): T[] {
    const startIndex = this.dataNodes.indexOf(dataNode);
    const results: T[] = [];

    // Goes through flattened tree nodes in the `dataNodes` array, and get all descendants.
    // The level of descendants of a tree node must be greater than the level of the given
    // tree node.
    // If we reach a node whose level is equal to the level of the tree node, we hit a sibling.
    // If we reach a node whose level is greater than the level of the tree node, we hit a
    // sibling of an ancestor.
    for (
      let i = startIndex + 1;
      i < this.dataNodes.length && this.getLevel(dataNode) < this.getLevel(this.dataNodes[i]);
      i++
    ) {
      results.push(this.dataNodes[i]);
    }
    return results;
  }

  /**
   * Expands all data nodes in the tree.
   *
   * 展开树中的所有数据节点。
   *
   * To make this working, the `dataNodes` variable of the TreeControl must be set to all flattened
   * data nodes of the tree.
   *
   * 为了使它起作用，`dataNodes` 变量必须设置为树的所有扁平化的数据节点。
   *
   */
  expandAll(): void {
    this.expansionModel.select(...this.dataNodes.map(node => this._trackByValue(node)));
  }
}
