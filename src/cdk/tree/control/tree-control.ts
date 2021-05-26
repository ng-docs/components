/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {SelectionModel} from '@angular/cdk/collections';
import {Observable} from 'rxjs';

/**
 * Tree control interface. User can implement TreeControl to expand/collapse dataNodes in the tree.
 * The CDKTree will use this TreeControl to expand/collapse a node.
 * User can also use it outside the `<cdk-tree>` to control the expansion status of the tree.
 *
 * 树控件接口。用户可以实现 TreeControl 来展开/折叠树中的 dataNodes。CDKTree 将使用此 TreeControl 来展开/折叠节点。用户还可以在 `<cdk-tree>` 之外使用它来控制树的展开状态。
 *
 */
export interface TreeControl<T, K = T> {
  /**
   * The saved tree nodes data for `expandAll` action.
   *
   * 保存的树节点数据可用于 `expandAll` 动作。
   *
   */
  dataNodes: T[];

  /**
   * The expansion model
   *
   * 展开模型
   *
   */
  expansionModel: SelectionModel<K>;

  /**
   * Whether the data node is expanded or collapsed. Return true if it's expanded.
   *
   * 数据节点是展开还是折叠。如果已展开，则返回 true。
   *
   */
  isExpanded(dataNode: T): boolean;

  /**
   * Get all descendants of a data node
   *
   * 获取数据节点的所有后代
   *
   */
  getDescendants(dataNode: T): any[];

  /**
   * Expand or collapse data node
   *
   * 展开或折叠数据节点
   *
   */
  toggle(dataNode: T): void;

  /**
   * Expand one data node
   *
   * 展开一个数据节点
   *
   */
  expand(dataNode: T): void;

  /**
   * Collapse one data node
   *
   * 折叠一个数据节点
   *
   */
  collapse(dataNode: T): void;

  /**
   * Expand all the dataNodes in the tree
   *
   * 展开树中的所有 dataNode
   *
   */
  expandAll(): void;

  /**
   * Collapse all the dataNodes in the tree
   *
   * 折叠树中的所有 dataNode
   *
   */
  collapseAll(): void;

  /**
   * Toggle a data node by expand/collapse it and all its descendants
   *
   * 通过展开/折叠数据节点及其所有后代来切换数据节点
   *
   */
  toggleDescendants(dataNode: T): void;

  /**
   * Expand a data node and all its descendants
   *
   * 展开数据节点及其所有后代
   *
   */
  expandDescendants(dataNode: T): void;

  /**
   * Collapse a data node and all its descendants
   *
   * 折叠数据节点及其所有后代
   *
   */
  collapseDescendants(dataNode: T): void;

  /**
   * Get depth of a given data node, return the level number. This is for flat tree node.
   *
   * 获取给定数据节点的深度，返回级别号。这是用于扁平树节点的。
   *
   */
  readonly getLevel: (dataNode: T) => number;

  /**
   * Whether the data node is expandable. Returns true if expandable.
   * This is for flat tree node.
   *
   * 数据节点是否可展开。如果可展开，则返回 true。这是用于扁平树节点的。
   *
   */
  readonly isExpandable: (dataNode: T) => boolean;

  /**
   * Gets a stream that emits whenever the given data node's children change.
   *
   * 获取在给定数据节点的子代发生更改时发出的流。
   *
   */
  readonly getChildren: (dataNode: T) => Observable<T[]> | T[] | undefined | null;
}
