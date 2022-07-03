/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {InjectionToken} from '@angular/core';
import {CdkAccordionItem} from '@angular/cdk/accordion';

/**
 * Base interface for a `MatExpansionPanel`.
 *
 * `MatExpansionPanel` 的基本接口。
 *
 * @docs-private
 */
export interface MatExpansionPanelBase extends CdkAccordionItem {
  /**
   * Whether the toggle indicator should be hidden.
   *
   * 是否应该隐藏切换指示器。
   *
   */
  hideToggle: boolean;
}

/**
 * Token used to provide a `MatExpansionPanel` to `MatExpansionPanelContent`.
 * Used to avoid circular imports between `MatExpansionPanel` and `MatExpansionPanelContent`.
 *
 * 用于向 `MatExpansionPanelContent` 提供 `MatExpansionPanel` 的令牌。用于避免 `MatExpansionPanel` 和 `MatExpansionPanelContent` 之间的循环导入。
 *
 */
export const MAT_EXPANSION_PANEL = new InjectionToken<MatExpansionPanelBase>('MAT_EXPANSION_PANEL');
