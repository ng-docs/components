/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {coerceNumberProperty} from '@angular/cdk/coercion';
import {ComponentHarness, HarnessPredicate} from '@angular/cdk/testing';
import {ProgressBarHarnessFilters} from './progress-bar-harness-filters';

/**
 * Harness for interacting with a standard mat-progress-bar in tests.
 *
 * 在测试中用来与标准 mat-progress-bar 进行交互的测试工具。
 *
 */
export class MatProgressBarHarness extends ComponentHarness {
  /** The selector for the host element of a `MatProgressBar` instance. */
  static hostSelector = '.mat-progress-bar';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `MatProgressBarHarness` that meets
   * certain criteria.
   * @param options Options for filtering which progress bar instances are considered a match.
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with(options: ProgressBarHarnessFilters = {}): HarnessPredicate<MatProgressBarHarness> {
    return new HarnessPredicate(MatProgressBarHarness, options);
  }

  /** Gets the progress bar's value. */
  async getValue(): Promise<number|null> {
    const host = await this.host();
    const ariaValue = await host.getAttribute('aria-valuenow');
    return ariaValue ? coerceNumberProperty(ariaValue) : null;
  }

  /** Gets the progress bar's mode. */
  async getMode(): Promise<string|null> {
    return (await this.host()).getAttribute('mode');
  }
}
