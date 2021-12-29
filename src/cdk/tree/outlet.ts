/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {Directive, Inject, InjectionToken, Optional, ViewContainerRef} from '@angular/core';

/**
 * Injection token used to provide a `CdkTreeNode` to its outlet.
 * Used primarily to avoid circular imports.
 *
 * 注入令牌用于为它的出口地标提供 `CdkTreeNode`，主要用于避免循环导入。
 *
 * @docs-private
 */
export const CDK_TREE_NODE_OUTLET_NODE = new InjectionToken<{}>('CDK_TREE_NODE_OUTLET_NODE');

/**
 * Outlet for nested CdkNode. Put `[cdkTreeNodeOutlet]` on a tag to place children dataNodes
 * inside the outlet.
 *
 * 嵌套的 CdkNode 出口地标。把 `[cdkTreeNodeOutlet]` 放到标签上，把子数据节点放到这个出口地标中。
 *
 */
@Directive({
  selector: '[cdkTreeNodeOutlet]',
})
export class CdkTreeNodeOutlet {
  constructor(
    public viewContainer: ViewContainerRef,
    @Inject(CDK_TREE_NODE_OUTLET_NODE) @Optional() public _node?: any,
  ) {}
}
