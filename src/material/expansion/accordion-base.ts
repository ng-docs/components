/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {InjectionToken} from '@angular/core';
import {CdkAccordion} from '@angular/cdk/accordion';

/**
 * MatAccordion's display modes.
 *
 * MatAccordion 的显示模式。
 *
 */
export type MatAccordionDisplayMode = 'default' | 'flat';

/**
 * MatAccordion's toggle positions.
 *
 * MatAccordion 的切换位置。
 *
 */
export type MatAccordionTogglePosition = 'before' | 'after';

/**
 * Base interface for a `MatAccordion`.
 *
 * `MatAccordion` 的基本接口。
 *
 * @docs-private
 */
export interface MatAccordionBase extends CdkAccordion {
  /**
   * Whether the expansion indicator should be hidden.
   *
   * 是否应该隐藏展开指示器。
   *
   */
  hideToggle: boolean;

  /**
   * Display mode used for all expansion panels in the accordion.
   *
   * 显示模式用于手风琴中的所有可展开面板。
   *
   */
  displayMode: MatAccordionDisplayMode;

  /**
   * The position of the expansion indicator.
   *
   * 展开指示器的位置。
   *
   */
  togglePosition: MatAccordionTogglePosition;

  /**
   * Handles keyboard events coming in from the panel headers.
   *
   * 处理从面板标头进来的键盘事件。
   *
   */
  _handleHeaderKeydown: (event: KeyboardEvent) => void;

  /**
   * Handles focus events on the panel headers.
   *
   * 处理面板标头上的所有事件。
   *
   */
  _handleHeaderFocus: (header: any) => void;
}

/**
 * Token used to provide a `MatAccordion` to `MatExpansionPanel`.
 * Used primarily to avoid circular imports between `MatAccordion` and `MatExpansionPanel`.
 *
 * 该令牌用于向 `MatExpansionPanel` 提供 `MatAccordion`。主要用于打破 `MatAccordion` 和 `MatExpansionPanel` 之间的循环导入。
 *
 */
export const MAT_ACCORDION = new InjectionToken<MatAccordionBase>('MAT_ACCORDION');
