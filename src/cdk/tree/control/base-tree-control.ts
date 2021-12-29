/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {SelectionModel} from '@angular/cdk/collections';
import {Observable} from 'rxjs';
import {TreeControl} from './tree-control';

/**
 * Base tree control. It has basic toggle/expand/collapse operations on a single data node.
 *
 * 基本树控件。它在单个数据节点上具有基本的切换/展开/折叠操作。
 *
 */
export abstract class BaseTreeControl<T, K = T> implements TreeControl<T, K> {
  /**
   * Gets a list of descendent data nodes of a subtree rooted at given data node recursively.
   *
   * 递归获取以给定数据节点为根的子树的后代数据节点的列表。
   *
   */
  abstract getDescendants(dataNode: T): T[];

  /**
   * Expands all data nodes in the tree.
   *
   * 展开树中的所有数据节点。
   *
   */
  abstract expandAll(): void;

  /**
   * Saved data node for `expandAll` action.
   *
   * 已保存的数据节点，以执行 `expandAll` 动作。
   *
   */
  dataNodes: T[];

  /**
   * A selection model with multi-selection to track expansion status.
   *
   * 具有多选功能以跟踪展开状态的选择模型。
   *
   */
  expansionModel: SelectionModel<K> = new SelectionModel<K>(true);

  /**
   * Returns the identifier by which a dataNode should be tracked, should its
   * reference change.
   *
   * 返回要更改其引用的标识符，该标识符应用来跟踪 dataNode。
   *
   * Similar to trackBy for \*ngFor
   *
   * 与\* ngFor 的 trackBy 相似
   *
   */
  trackBy?: (dataNode: T) => K;

  /**
   * Get depth of a given data node, return the level number. This is for flat tree node.
   *
   * 获取给定数据节点的深度，返回其级别数字。这是用于扁平树节点的。
   *
   */
  getLevel: (dataNode: T) => number;

  /**
   * Whether the data node is expandable. Returns true if expandable.
   * This is for flat tree node.
   *
   * 数据节点是否可展开。如果可展开，则返回 true。这是用于扁平树节点的。
   *
   */
  isExpandable: (dataNode: T) => boolean;

  /**
   * Gets a stream that emits whenever the given data node's children change.
   *
   * 获取在给定数据节点的子代发生更改时会发出事件的流。
   *
   */
  getChildren: (dataNode: T) => Observable<T[]> | T[] | undefined | null;

  /**
   * Toggles one single data node's expanded/collapsed state.
   *
   * 切换一个数据节点的展开/折叠状态。
   *
   */
  toggle(dataNode: T): void {
    this.expansionModel.toggle(this._trackByValue(dataNode));
  }

  /**
   * Expands one single data node.
   *
   * 展开一个数据节点。
   *
   */
  expand(dataNode: T): void {
    this.expansionModel.select(this._trackByValue(dataNode));
  }

  /**
   * Collapses one single data node.
   *
   * 折叠一个数据节点。
   *
   */
  collapse(dataNode: T): void {
    this.expansionModel.deselect(this._trackByValue(dataNode));
  }

  /**
   * Whether a given data node is expanded or not. Returns true if the data node is expanded.
   *
   * 给定数据节点是否已展开。如果数据节点已展开，则返回 true。
   *
   */
  isExpanded(dataNode: T): boolean {
    return this.expansionModel.isSelected(this._trackByValue(dataNode));
  }

  /**
   * Toggles a subtree rooted at `node` recursively.
   *
   * 递归切换以 `node` 为根的子树。
   *
   */
  toggleDescendants(dataNode: T): void {
    this.expansionModel.isSelected(this._trackByValue(dataNode))
      ? this.collapseDescendants(dataNode)
      : this.expandDescendants(dataNode);
  }

  /**
   * Collapse all dataNodes in the tree.
   *
   * 折叠此树中的所有 dataNode。
   *
   */
  collapseAll(): void {
    this.expansionModel.clear();
  }

  /**
   * Expands a subtree rooted at given data node recursively.
   *
   * 递归展开以给定数据节点为根的子树。
   *
   */
  expandDescendants(dataNode: T): void {
    let toBeProcessed = [dataNode];
    toBeProcessed.push(...this.getDescendants(dataNode));
    this.expansionModel.select(...toBeProcessed.map(value => this._trackByValue(value)));
  }

  /**
   * Collapses a subtree rooted at given data node recursively.
   *
   * 递归折叠以给定数据节点为根的子树。
   *
   */
  collapseDescendants(dataNode: T): void {
    let toBeProcessed = [dataNode];
    toBeProcessed.push(...this.getDescendants(dataNode));
    this.expansionModel.deselect(...toBeProcessed.map(value => this._trackByValue(value)));
  }

  protected _trackByValue(value: T | K): K {
    return this.trackBy ? this.trackBy(value as T) : (value as K);
  }
}
