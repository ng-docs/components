/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {InjectionToken} from '@angular/core';
import {ThemePalette} from '@angular/material/core';

/**
 * Default `mat-checkbox` options that can be overridden.
 *
 * 默认的 `mat-checkbox` 选项，可以改写它们。
 *
 */
export interface MatCheckboxDefaultOptions {
  color?: ThemePalette;
  clickAction?: MatCheckboxClickAction;
}

/**
 * Injection token to be used to override the default options for `mat-checkbox`.
 *
 * 这个注入令牌用来改写 `mat-checkbox` 的默认选项。
 *
 */
export const MAT_CHECKBOX_DEFAULT_OPTIONS =
    new InjectionToken<MatCheckboxDefaultOptions>('mat-checkbox-default-options', {
      providedIn: 'root',
      factory: MAT_CHECKBOX_DEFAULT_OPTIONS_FACTORY
    });

/** @docs-private */
export function MAT_CHECKBOX_DEFAULT_OPTIONS_FACTORY(): MatCheckboxDefaultOptions {
  return {
    color: 'accent',
    clickAction: 'check-indeterminate',
  };
}

/**
 * Checkbox click action when user click on input element.
 * noop: Do not toggle checked or indeterminate.
 * check: Only toggle checked status, ignore indeterminate.
 * check-indeterminate: Toggle checked status, set indeterminate to false. Default behavior.
 * undefined: Same as `check-indeterminate`.
 *
 * 当用户点击 input 元素时，复选框会处理点击动作。
 * noop：不要切换为勾选或未决。
 * check：只切换勾选状态，忽略未决状态。
 * check-indeterminate：切换勾选状态，未决状态设为 false。默认行为。
 * undefined：与 `check-indeterminate` 相同。
 *
 */
export type MatCheckboxClickAction = 'noop' | 'check' | 'check-indeterminate' | undefined;
