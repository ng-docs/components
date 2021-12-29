/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Directive, TemplateRef} from '@angular/core';

/**
 * Context provided to the tree node component.
 *
 * 提供给树节点组件的上下文。
 *
 */
export class CdkTreeNodeOutletContext<T> {
  /**
   * Data for the node.
   *
   * 该节点的数据。
   *
   */
  $implicit: T;

  /**
   * Depth of the node.
   *
   * 该节点的深度。
   *
   */
  level: number;

  /**
   * Index location of the node.
   *
   * 该节点的索引位置。
   *
   */
  index?: number;

  /**
   * Length of the number of total dataNodes.
   *
   * 所有数据节点的长度。
   *
   */
  count?: number;

  constructor(data: T) {
    this.$implicit = data;
  }
}

/**
 * Data node definition for the CdkTree.
 * Captures the node's template and a when predicate that describes when this node should be used.
 *
 * CdkTree 的数据节点定义。保存该节点的模板和一个 when 谓词，用于描述该节点要在何时使用。
 *
 */
@Directive({
  selector: '[cdkTreeNodeDef]',
  inputs: ['when: cdkTreeNodeDefWhen'],
})
export class CdkTreeNodeDef<T> {
  /**
   * Function that should return true if this node template should be used for the provided node
   * data and index. If left undefined, this node will be considered the default node template to
   * use when no other when functions return true for the data.
   * For every node, there must be at least one when function that passes or an undefined to
   * default.
   *
   * 如果该节点模板应该应用在所提供的节点数据和索引上，则该函数返回 true。如果未定义，那么当该函数对该数据返回 true 时，该节点将被认为是默认的节点模板。对于每一个节点，至少要传入一个 when 函数或者用 undefined 表示默认行为。
   *
   */
  when: (index: number, nodeData: T) => boolean;

  /** @docs-private */
  constructor(public template: TemplateRef<any>) {}
}
