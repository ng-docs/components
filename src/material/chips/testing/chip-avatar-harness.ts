/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  ComponentHarness,
  ComponentHarnessConstructor,
  HarnessPredicate,
} from '@angular/cdk/testing';
import {ChipAvatarHarnessFilters} from './chip-harness-filters';

/**
 * Harness for interacting with a standard Material chip avatar in tests.
 *
 * 在测试中与标准 Material 纸片的头像交互的测试工具。
 *
 */
export class MatChipAvatarHarness extends ComponentHarness {
  static hostSelector = '.mat-mdc-chip-avatar';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a chip avatar with specific
   * attributes.
   *
   * 获取一个 `HarnessPredicate`，可用于搜索满足特定条件的 `MatChipAvatarHarness` 。
   *
   * @param options Options for filtering which input instances are considered a match.
   *
   * 用于过滤哪些输入实例被视为匹配的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 使用给定选项配置过的 `HarnessPredicate` 。
   *
   */
  static with<T extends MatChipAvatarHarness>(
    this: ComponentHarnessConstructor<T>,
    options: ChipAvatarHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options);
  }
}
