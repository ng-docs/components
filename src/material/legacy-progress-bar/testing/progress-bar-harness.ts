/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {coerceNumberProperty} from '@angular/cdk/coercion';
import {ComponentHarness, HarnessPredicate} from '@angular/cdk/testing';
import {ProgressBarHarnessFilters} from '@angular/material/progress-bar/testing';

/**
 * Harness for interacting with a standard mat-progress-bar in tests.
 *
 * 在测试中用来与标准 mat-progress-bar 进行交互的测试工具。
 *
 * @deprecated
 *
 * Use `MatProgressBarHarness` from `@angular/material/progress-bar/testing` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
export class MatLegacyProgressBarHarness extends ComponentHarness {
  /**
   * The selector for the host element of a `MatProgressBar` instance.
   *
   * `MatProgressBar` 实例的宿主元素选择器。
   *
   */
  static hostSelector = '.mat-progress-bar';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `MatProgressBarHarness` that meets
   * certain criteria.
   *
   * 获取一个 `HarnessPredicate`，可用于搜索满足某些条件的 `MatProgressBarHarness`。
   *
   * @param options Options for filtering which progress bar instances are considered a match.
   *
   * 用于筛选哪些进度条实例应该视为匹配项的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 使用给定选项配置过的 `HarnessPredicate`。
   *
   */
  static with(
    options: ProgressBarHarnessFilters = {},
  ): HarnessPredicate<MatLegacyProgressBarHarness> {
    return new HarnessPredicate(MatLegacyProgressBarHarness, options);
  }

  /**
   * Gets the progress bar's value.
   *
   * 获取此进度条的值。
   *
   */
  async getValue(): Promise<number | null> {
    const host = await this.host();
    const ariaValue = await host.getAttribute('aria-valuenow');
    return ariaValue ? coerceNumberProperty(ariaValue) : null;
  }

  /**
   * Gets the progress bar's mode.
   *
   * 获取此进度条的模式。
   *
   */
  async getMode(): Promise<string | null> {
    return (await this.host()).getAttribute('mode');
  }
}
