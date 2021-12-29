/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {CDK_TREE_NODE_OUTLET_NODE, CdkTreeNodeOutlet} from '@angular/cdk/tree';
import {Directive, Inject, Optional, ViewContainerRef} from '@angular/core';

/**
 * Outlet for nested CdkNode. Put `[matTreeNodeOutlet]` on a tag to place children dataNodes
 * inside the outlet.
 *
 * 嵌套的 CdkNode 出口地标。把 `[matTreeNodeOutlet]` 放在标签上，把子数据节点放到此出口地标中。
 *
 */
@Directive({
  selector: '[matTreeNodeOutlet]',
  providers: [
    {
      provide: CdkTreeNodeOutlet,
      useExisting: MatTreeNodeOutlet,
    },
  ],
})
export class MatTreeNodeOutlet implements CdkTreeNodeOutlet {
  constructor(
    public viewContainer: ViewContainerRef,
    @Inject(CDK_TREE_NODE_OUTLET_NODE) @Optional() public _node?: any,
  ) {}
}
