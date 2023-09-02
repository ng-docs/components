/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {InjectionToken} from '@angular/core';

/**
 * Injection token that can be used for a `CdkDrag` to provide itself as a parent to the
 * drag-specific child directive \(`CdkDragHandle`, `CdkDragPreview` etc.\). Used primarily
 * to avoid circular imports.
 *
 * 注入令牌，可以让 `CdkDrag` 把自己用作特定拖曳子指令（ `CdkDragHandle`、`CdkDragPreview` 等）的父级。主要用于避免循环导入。
 *
 * @docs-private
 */
export const CDK_DRAG_PARENT = new InjectionToken<{}>('CDK_DRAG_PARENT');
