/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ComponentHarnessConstructor, HarnessPredicate} from '@angular/cdk/testing';

import {_MatErrorHarnessBase, ErrorHarnessFilters} from '@angular/material/form-field/testing';

/**
 * Harness for interacting with a `mat-error` in tests.
 *
 * 用于与测试中的 `mat-error` 交互的组件测试工具。
 *
 * @deprecated
 *
 * Use `MatErrorHarness` from `@angular/material/form-field/testing` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 * @breaking-change 17.0.0
 */
export class MatLegacyErrorHarness extends _MatErrorHarnessBase {
  static hostSelector = '.mat-error';

  /**
   * Gets a `HarnessPredicate` that can be used to search for an error with specific
   * attributes.
   *
   * 获取可用于搜索具有特定属性的错误的 `HarnessPredicate` 。
   *
   * @param options Options for filtering which error instances are considered a match.
   *
   * 用于过滤哪些错误实例被视为匹配项的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 使用给定选项配置过的 `HarnessPredicate`。
   */
  static with<T extends MatLegacyErrorHarness>(
    this: ComponentHarnessConstructor<T>,
    options: ErrorHarnessFilters = {},
  ): HarnessPredicate<T> {
    return _MatErrorHarnessBase._getErrorPredicate(this, options);
  }
}
