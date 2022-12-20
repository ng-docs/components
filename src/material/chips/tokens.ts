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
 */
export interface MatChipsDefaultOptions {
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
 */
export const MAT_CHIPS_DEFAULT_OPTIONS = new InjectionToken<MatChipsDefaultOptions>(
  'mat-chips-default-options',
);

/**
 * Injection token that can be used to reference instances of `MatChipAvatar`. It serves as
 * alternative token to the actual `MatChipAvatar` class which could cause unnecessary
 * retention of the class and its directive metadata.
 *
 * 这个注入令牌可以用来引用 `MatChipAvatar` 实例。它可以作为实际 `MatChipAvatar` 类的备用令牌，直接使用实际类可能导致该类及其元数据无法被优化掉。
 *
 */
export const MAT_CHIP_AVATAR = new InjectionToken('MatChipAvatar');

/**
 * Injection token that can be used to reference instances of `MatChipTrailingIcon`. It serves as
 * alternative token to the actual `MatChipTrailingIcon` class which could cause unnecessary
 * retention of the class and its directive metadata.
 *
 * 这个注入令牌可以用来引用 `MatChipTrailingIcon` 实例。它可以作为实际 `MatChipTrailingIcon` 类的备用令牌，直接使用实际类可能导致该类及其元数据无法被优化掉。
 *
 */
export const MAT_CHIP_TRAILING_ICON = new InjectionToken('MatChipTrailingIcon');

/**
 * Injection token that can be used to reference instances of `MatChipRemove`. It serves as
 * alternative token to the actual `MatChipRemove` class which could cause unnecessary
 * retention of the class and its directive metadata.
 *
 * 这个注入令牌可以用来引用 `MatChipRemove` 实例。它可以作为实际 `MatChipRemove` 类的备用令牌，直接使用实际类可能导致该类及其元数据无法被优化掉。
 *
 */
export const MAT_CHIP_REMOVE = new InjectionToken('MatChipRemove');

/**
 * Injection token used to avoid a circular dependency between the `MatChip` and `MatChipAction`.
 *
 * 此注入令牌用于避免 `MatChip` 和 `MatChipAction` 之间的循环依赖。
 *
 */
export const MAT_CHIP = new InjectionToken('MatChip');
