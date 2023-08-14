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
 * Default `mat-slide-toggle` options that can be overridden.
 *
 * 默认的 `mat-slide-toggle` 选项，可以被改写。
 *
 */
export interface MatSlideToggleDefaultOptions {
  /**
   * Whether toggle action triggers value changes in slide toggle.
   *
   * 切换操作是否会触发滑块开关中的值更改。
   *
   */
  disableToggleValue?: boolean;

  /**
   * Default color for slide toggles.
   *
   * 滑块开关的默认颜色。
   *
   */
  color?: ThemePalette;

  /** Whether to hide the icon inside the slide toggle. */
  hideIcon?: boolean;
}

/**
 * Injection token to be used to override the default options for `mat-slide-toggle`.
 *
 * 这个注入令牌用来改写 `mat-slide-toggle` 的默认选项。
 *
 */
export const MAT_SLIDE_TOGGLE_DEFAULT_OPTIONS = new InjectionToken<MatSlideToggleDefaultOptions>(
  'mat-slide-toggle-default-options',
  {
    providedIn: 'root',
    factory: () => ({disableToggleValue: false, hideIcon: false}),
  },
);
