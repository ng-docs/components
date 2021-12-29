/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {BooleanInput, coerceBooleanProperty} from '@angular/cdk/coercion';
import {Directive, Input} from '@angular/core';

import {CdkTree, CdkTreeNode} from './tree';

/**
 * Node toggle to expand/collapse the node.
 *
 * 切换节点，以展开/折叠节点。
 *
 */
@Directive({
  selector: '[cdkTreeNodeToggle]',
  host: {
    '(click)': '_toggle($event)',
  },
})
export class CdkTreeNodeToggle<T, K = T> {
  /**
   * Whether expand/collapse the node recursively.
   *
   * 是否递归展开/折叠节点。
   *
   */
  @Input('cdkTreeNodeToggleRecursive')
  get recursive(): boolean {
    return this._recursive;
  }
  set recursive(value: BooleanInput) {
    this._recursive = coerceBooleanProperty(value);
  }
  protected _recursive = false;

  constructor(protected _tree: CdkTree<T, K>, protected _treeNode: CdkTreeNode<T, K>) {}

  _toggle(event: Event): void {
    this.recursive
      ? this._tree.treeControl.toggleDescendants(this._treeNode.data)
      : this._tree.treeControl.toggle(this._treeNode.data);

    event.stopPropagation();
  }
}
