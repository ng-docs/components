/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {InjectionToken} from '@angular/core';

/**
 * Describes a parent component that manages a list of options.
 * Contains properties that the options can inherit.
 *
 * 描述管理选项列表的父组件。包含一些各个选项可以继承的属性。
 *
 * @docs-private
 */
export interface MatOptionParentComponent {
  disableRipple?: boolean;
  multiple?: boolean;
  inertGroups?: boolean;
  hideSingleSelectionIndicator?: boolean;
}

/**
 * Injection token used to provide the parent component to options.
 *
 * 用于向选项提供父组件的注入令牌。
 *
 */
export const MAT_OPTION_PARENT_COMPONENT = new InjectionToken<MatOptionParentComponent>(
  'MAT_OPTION_PARENT_COMPONENT',
);
