/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {CdkTreeNodePadding} from '@angular/cdk/tree';
import {Directive, Input} from '@angular/core';

/**
 * Wrapper for the CdkTree padding with Material design styles.
 *
 * 采用 Material Design 样式的 CdkTree 衬距包装器。
 *
 */
@Directive({
  selector: '[matTreeNodePadding]',
  providers: [{provide: CdkTreeNodePadding, useExisting: MatTreeNodePadding}]
})
export class MatTreeNodePadding<T, K = T> extends CdkTreeNodePadding<T, K> {

  /**
   * The level of depth of the tree node. The padding will be `level * indent` pixels.
   *
   * 树节点的深度级别。衬距将是`级别 * 缩进值`像素。
   *
   */
  @Input('matTreeNodePadding')
  get level(): number { return this._level; }
  set level(value: number) { this._setLevelInput(value); }

  /**
   * The indent for each level. Default number 40px from material design menu sub-menu spec.
   *
   * 每个级别的缩进。默认值是 40px，来自Material Design菜单中的子菜单规范。
   *
   */
  @Input('matTreeNodePaddingIndent')
  get indent(): number | string { return this._indent; }
  set indent(indent: number | string) { this._setIndentInput(indent); }
}
