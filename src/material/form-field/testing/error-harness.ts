/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  BaseHarnessFilters,
  ComponentHarness,
  ComponentHarnessConstructor,
  HarnessPredicate,
} from '@angular/cdk/testing';

/**
 * A set of criteria that can be used to filter a list of error harness instances.
 *
 * 一组可用于过滤错误组件测试工具实例列表的条件。
 *
 */
export interface ErrorHarnessFilters extends BaseHarnessFilters {
  /**
   * Only find instances whose text matches the given value.
   *
   * 只查找其文本内容匹配指定值的实例。
   *
   */
  text?: string | RegExp;
}

export abstract class _MatErrorHarnessBase extends ComponentHarness {
  /**
   * Gets a promise for the error's label text.
   *
   * 获取错误标签文本的 Promise。
   *
   */
  async getText(): Promise<string> {
    return (await this.host()).text();
  }

  protected static _getErrorPredicate<T extends MatErrorHarness>(
    type: ComponentHarnessConstructor<T>,
    options: ErrorHarnessFilters,
  ): HarnessPredicate<T> {
    return new HarnessPredicate(type, options).addOption('text', options.text, (harness, text) =>
      HarnessPredicate.stringMatches(harness.getText(), text),
    );
  }
}

/**
 * Harness for interacting with an MDC-based `mat-error` in tests.
 *
 * 用于在测试中与基于 MDC 的 `mat-error` 交互的组件测试工具。
 *
 */
export class MatErrorHarness extends _MatErrorHarnessBase {
  static hostSelector = '.mat-mdc-form-field-error';

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
  static with<T extends MatErrorHarness>(
    this: ComponentHarnessConstructor<T>,
    options: ErrorHarnessFilters = {},
  ): HarnessPredicate<T> {
    return _MatErrorHarnessBase._getErrorPredicate(this, options);
  }
}
