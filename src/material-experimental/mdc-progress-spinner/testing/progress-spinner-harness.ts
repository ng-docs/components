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
import {ProgressSpinnerMode} from '@angular/material/progress-spinner';
import {ProgressSpinnerHarnessFilters} from '@angular/material/progress-spinner/testing';

/** Harness for interacting with a MDC based mat-progress-spinner in tests. */
export class MatProgressSpinnerHarness extends ComponentHarness {
  /**
   * The selector for the host element of a `MatProgressSpinner` instance.
   *
   * `MatProgressSpinner` 实例的宿主元素选择器。
   *
   */
  static hostSelector = '.mat-mdc-progress-spinner';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a progress spinnner with specific
   * attributes.
   * @param options Options for filtering which progress spinner instances are considered a match.
   *
   * 用于筛选哪些进度圈实例应该视为匹配项的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with<T extends MatProgressSpinnerHarness>(
    this: ComponentHarnessConstructor<T>,
    options: ProgressSpinnerHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options);
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
  async getMode(): Promise<ProgressSpinnerMode> {
    const modeAttr = (await this.host()).getAttribute('mode');
    return (await modeAttr) as ProgressSpinnerMode;
  }
}
