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
 * @deprecated
 *
 * Use `MatSlideToggleDefaultOptions` from `@angular/material/slide-toggle` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
export interface MatLegacySlideToggleDefaultOptions {
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
}

/**
 * Injection token to be used to override the default options for `mat-slide-toggle`
 *
 * 这个注入令牌用来改写 `mat-slide-toggle` 的默认选项。
 *
 * @deprecated
 *
 * Use `MAT_SLIDE_TOGGLE_DEFAULT_OPTIONS` from `@angular/material/slide-toggle` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
export const MAT_LEGACY_SLIDE_TOGGLE_DEFAULT_OPTIONS =
  new InjectionToken<MatLegacySlideToggleDefaultOptions>('mat-slide-toggle-default-options', {
    providedIn: 'root',
    factory: () => ({disableToggleValue: false}),
  });
