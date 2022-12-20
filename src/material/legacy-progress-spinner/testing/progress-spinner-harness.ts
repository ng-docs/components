/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {coerceNumberProperty} from '@angular/cdk/coercion';
import {ComponentHarness, HarnessPredicate} from '@angular/cdk/testing';
import {LegacyProgressSpinnerMode} from '@angular/material/legacy-progress-spinner';
import {ProgressSpinnerHarnessFilters} from '@angular/material/progress-spinner/testing';

/**
 * Harness for interacting with a standard mat-progress-spinner in tests.
 *
 * 在测试中用来与标准 mat-progress-spinner 进行交互的测试工具。
 *
 * @deprecated
 *
 * Use `MatProgressSpinnerHarness` from `@angular/material/progress-spinner/testing` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
export class MatLegacyProgressSpinnerHarness extends ComponentHarness {
  /**
   * The selector for the host element of a Progress Spinner instance.
   *
   * 进度圈实例的宿主元素的选择器。
   *
   */
  static hostSelector = '.mat-progress-spinner';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `MatProgressSpinnerHarness` that
   * meets certain criteria.
   *
   * 获取一个 `HarnessPredicate`，该 HarnessPredicate 可用于搜索满足某些条件的 `MatProgressSpinnerHarness`。
   *
   * @param options Options for filtering which progress spinner instances are considered a match.
   *
   * 用于筛选哪些进度圈实例应该视为匹配项的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 使用给定选项配置过的 `HarnessPredicate`。
   *
   */
  static with(
    options: ProgressSpinnerHarnessFilters = {},
  ): HarnessPredicate<MatLegacyProgressSpinnerHarness> {
    return new HarnessPredicate(MatLegacyProgressSpinnerHarness, options);
  }

  /**
   * Gets the progress spinner's value.
   *
   * 获取此进度圈的值。
   *
   */
  async getValue(): Promise<number | null> {
    const host = await this.host();
    const ariaValue = await host.getAttribute('aria-valuenow');
    return ariaValue ? coerceNumberProperty(ariaValue) : null;
  }

  /**
   * Gets the progress spinner's mode.
   *
   * 获取此进度圈的模式。
   *
   */
  async getMode(): Promise<LegacyProgressSpinnerMode> {
    const modeAttr = (await this.host()).getAttribute('mode');
    return (await modeAttr) as LegacyProgressSpinnerMode;
  }
}
