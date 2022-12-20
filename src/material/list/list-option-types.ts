/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {InjectionToken} from '@angular/core';

/**
 * Type describing possible positions of a checkbox or radio in a list option
 * with respect to the list item's text.
 *
 * 此类型描述列表中的复选框相对于列表条目文本的的可能位置。
 *
 */
export type MatListOptionTogglePosition = 'before' | 'after';

/**
 * Interface describing a list option. This is used to avoid circular
 * dependencies between the list-option and the styler directives.
 *
 * 描述列表选项的接口。这用于避免 list-option 和 styler 指令之间的循环依赖。
 *
 * @docs-private
 */
export interface ListOption {
  _getTogglePosition(): MatListOptionTogglePosition;
}

/**
 * Injection token that can be used to reference instances of an `ListOption`. It serves
 * as alternative token to an actual implementation which could result in undesired
 * retention of the class or circular references breaking runtime execution.
 *
 * 可用于引用 `ListOption` 实例的注入令牌。它作为实际实现的替代标记，可能会导致不希望保留的类或循环引用破坏运行时执行。
 *
 * @docs-private
 */
export const LIST_OPTION = new InjectionToken<ListOption>('ListOption');
