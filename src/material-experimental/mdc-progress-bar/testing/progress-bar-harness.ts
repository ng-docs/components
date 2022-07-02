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
import {ProgressBarHarnessFilters} from '@angular/material/progress-bar/testing';

/** Harness for interacting with an MDC-based `mat-progress-bar` in tests. */
export class MatProgressBarHarness extends ComponentHarness {
  static hostSelector = '.mat-mdc-progress-bar';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a progress bar with specific
   * attributes.
   * @param options Options for filtering which progress bar instances are considered a match.
   *
   * 用于筛选哪些进度条实例应该视为匹配项的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 使用给定选项配置过的 `HarnessPredicate`。
   *
   */
  static with<T extends MatProgressBarHarness>(
    this: ComponentHarnessConstructor<T>,
    options: ProgressBarHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options);
  }

  /** Gets a promise for the progress bar's value. */
  async getValue(): Promise<number | null> {
    const host = await this.host();
    const ariaValue = await host.getAttribute('aria-valuenow');
    return ariaValue ? coerceNumberProperty(ariaValue) : null;
  }

  /** Gets a promise for the progress bar's mode. */
  async getMode(): Promise<string | null> {
    return (await this.host()).getAttribute('mode');
  }
}
