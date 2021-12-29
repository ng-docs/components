/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {
  AfterContentInit,
  ContentChildren,
  Directive,
  ElementRef,
  IterableDiffer,
  IterableDiffers,
  OnDestroy,
  OnInit,
  QueryList,
} from '@angular/core';
import {isObservable} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {CDK_TREE_NODE_OUTLET_NODE, CdkTreeNodeOutlet} from './outlet';
import {CdkTree, CdkTreeNode} from './tree';
import {getTreeControlFunctionsMissingError} from './tree-errors';

/**
 * Nested node is a child of `<cdk-tree>`. It works with nested tree.
 * By using `cdk-nested-tree-node` component in tree node template, children of the parent node will
 * be added in the `cdkTreeNodeOutlet` in tree node template.
 * The children of node will be automatically added to `cdkTreeNodeOutlet`.
 *
 * 嵌套节点是 `<cdk-tree>` 的子节点。它适用于嵌套树。通过在树节点模板中使用 `cdk-nested-tree-node` 组件，会把父节点的子节点添加到树节点模板的  `cdkTreeNodeOutlet` 中。该节点的子节点会自动添加到 `cdkTreeNodeOutlet` 中。
 *
 */
@Directive({
  selector: 'cdk-nested-tree-node',
  exportAs: 'cdkNestedTreeNode',
  inputs: ['role', 'disabled', 'tabIndex'],
  providers: [
    {provide: CdkTreeNode, useExisting: CdkNestedTreeNode},
    {provide: CDK_TREE_NODE_OUTLET_NODE, useExisting: CdkNestedTreeNode},
  ],
  host: {
    'class': 'cdk-nested-tree-node',
  },
})
export class CdkNestedTreeNode<T, K = T>
  extends CdkTreeNode<T, K>
  implements AfterContentInit, OnDestroy, OnInit
{
  /**
   * Differ used to find the changes in the data provided by the data source.
   *
   * 差分器用于查找数据源所提供的数据变化。
   *
   */
  private _dataDiffer: IterableDiffer<T>;

  /**
   * The children data dataNodes of current node. They will be placed in `CdkTreeNodeOutlet`.
   *
   * 当前节点的子节点的数据节点。它们将放在 `CdkTreeNodeOutlet` 中。
   *
   */
  protected _children: T[];

  /**
   * The children node placeholder.
   *
   * 子节点的占位符。
   *
   */
  @ContentChildren(CdkTreeNodeOutlet, {
    // We need to use `descendants: true`, because Ivy will no longer match
    // indirect descendants if it's left as false.
    descendants: true,
  })
  nodeOutlet: QueryList<CdkTreeNodeOutlet>;

  constructor(
    elementRef: ElementRef<HTMLElement>,
    tree: CdkTree<T, K>,
    protected _differs: IterableDiffers,
  ) {
    super(elementRef, tree);
  }

  ngAfterContentInit() {
    this._dataDiffer = this._differs.find([]).create(this._tree.trackBy);
    if (!this._tree.treeControl.getChildren && (typeof ngDevMode === 'undefined' || ngDevMode)) {
      throw getTreeControlFunctionsMissingError();
    }
    const childrenNodes = this._tree.treeControl.getChildren(this.data);
    if (Array.isArray(childrenNodes)) {
      this.updateChildrenNodes(childrenNodes as T[]);
    } else if (isObservable(childrenNodes)) {
      childrenNodes
        .pipe(takeUntil(this._destroyed))
        .subscribe(result => this.updateChildrenNodes(result));
    }
    this.nodeOutlet.changes
      .pipe(takeUntil(this._destroyed))
      .subscribe(() => this.updateChildrenNodes());
  }

  // This is a workaround for https://github.com/angular/angular/issues/23091
  // In aot mode, the lifecycle hooks from parent class are not called.
  override ngOnInit() {
    super.ngOnInit();
  }

  override ngOnDestroy() {
    this._clear();
    super.ngOnDestroy();
  }

  /**
   * Add children dataNodes to the NodeOutlet
   *
   * 把子节点的数据节点添加到 NodeOutlet 中
   *
   */
  protected updateChildrenNodes(children?: T[]): void {
    const outlet = this._getNodeOutlet();
    if (children) {
      this._children = children;
    }
    if (outlet && this._children) {
      const viewContainer = outlet.viewContainer;
      this._tree.renderNodeChanges(this._children, this._dataDiffer, viewContainer, this._data);
    } else {
      // Reset the data differ if there's no children nodes displayed
      this._dataDiffer.diff([]);
    }
  }

  /**
   * Clear the children dataNodes.
   *
   * 清除子节点的数据节点。
   *
   */
  protected _clear(): void {
    const outlet = this._getNodeOutlet();
    if (outlet) {
      outlet.viewContainer.clear();
      this._dataDiffer.diff([]);
    }
  }

  /**
   * Gets the outlet for the current node.
   *
   * 获取当前节点的出口地标。
   *
   */
  private _getNodeOutlet() {
    const outlets = this.nodeOutlet;

    // Note that since we use `descendants: true` on the query, we have to ensure
    // that we don't pick up the outlet of a child node by accident.
    return outlets && outlets.find(outlet => !outlet._node || outlet._node === this);
  }
}
