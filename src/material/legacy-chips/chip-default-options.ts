/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {InjectionToken} from '@angular/core';

/**
 * Default options, for the chips module, that can be overridden.
 *
 * 纸片模块的默认选项，可以改写它们。
 *
 * @deprecated
 *
 * Use `MatChipsDefaultOptions` from `@angular/material/chips` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
export interface MatLegacyChipsDefaultOptions {
  /**
   * The list of key codes that will trigger a chipEnd event.
   *
   * 会触发 chipEnd 事件的键盘代码列表。
   *
   */
  separatorKeyCodes: readonly number[] | ReadonlySet<number>;
}

/**
 * Injection token to be used to override the default options for the chips module.
 *
 * 注入令牌，用于改写纸片模块的默认选项。
 *
 * @deprecated
 *
 * Use `MAT_CHIPS_DEFAULT_OPTIONS` from `@angular/material/chips` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
export const MAT_LEGACY_CHIPS_DEFAULT_OPTIONS = new InjectionToken<MatLegacyChipsDefaultOptions>(
  'mat-chips-default-options',
);
