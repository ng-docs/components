/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {coerceNumberProperty} from '@angular/cdk/coercion';
import {
  ComponentHarness,
  ComponentHarnessConstructor,
  HarnessPredicate,
} from '@angular/cdk/testing';
import {ProgressBarHarnessFilters} from './progress-bar-harness-filters';

/**
 * Harness for interacting with an MDC-based `mat-progress-bar` in tests.
 *
 * 在测试中用来与标准 mat-progress-bar 进行交互的测试工具。
 *
 */
export class MatProgressBarHarness extends ComponentHarness {
  static hostSelector = '.mat-mdc-progress-bar';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a progress bar with specific
   * attributes.
   *
   * 获取一个 `HarnessPredicate`，可用于搜索满足某些条件的 `MatProgressBarHarness`。
   *
   * @param options Options for filtering which progress bar instances are considered a match.
   *
   * 用于筛选哪些进度条实例应该视为匹配项的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with<T extends MatProgressBarHarness>(
    this: ComponentHarnessConstructor<T>,
    options: ProgressBarHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options);
  }

  /**
   * Gets a promise for the progress bar's value.
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
   * Gets a promise for the progress bar's mode.
   *
   * 获取此进度条的模式。
   *
   */
  async getMode(): Promise<string | null> {
    return (await this.host()).getAttribute('mode');
  }
}
