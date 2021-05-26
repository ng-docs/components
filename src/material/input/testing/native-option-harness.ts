/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ComponentHarness, HarnessPredicate} from '@angular/cdk/testing';
import {NativeOptionHarnessFilters} from './native-select-harness-filters';

/**
 * Harness for interacting with a native `option` in tests.
 *
 * 在测试中与原生 `option` 进行交互的工具。
 *
 */
export class MatNativeOptionHarness extends ComponentHarness {
  /**
   * Selector used to locate option instances.
   *
   * 选择器，用于定位选项实例。
   *
   */
  static hostSelector = 'select[matNativeControl] option';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `MatNativeOptionHarness` that meets
   * certain criteria.
   *
   * 获取一个 `HarnessPredicate`，可用于搜索满足某些条件的 `MatNativeOptionHarness`。
   *
   * @param options Options for filtering which option instances are considered a match.
   *
   * 用于过滤哪些选项实例应该视为匹配的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with(options: NativeOptionHarnessFilters = {}) {
    return new HarnessPredicate(MatNativeOptionHarness, options)
        .addOption('text', options.text,
            async (harness, title) =>
                HarnessPredicate.stringMatches(await harness.getText(), title))
        .addOption('index', options.index,
            async (harness, index) => await harness.getIndex() === index)
        .addOption('isSelected', options.isSelected,
            async (harness, isSelected) => await harness.isSelected() === isSelected);

  }

  /**
   * Gets the option's label text.
   *
   * 获取此选项的标签文本。
   *
   */
  async getText(): Promise<string> {
    return (await this.host()).getProperty('label');
  }

  /**
   * Index of the option within the native `select` element.
   *
   * 此选项在 `select` 元素中的索引。
   *
   */
  async getIndex(): Promise<number> {
    return (await this.host()).getProperty('index');
  }

  /**
   * Gets whether the option is disabled.
   *
   * 获取是否禁用此选项。
   *
   */
  async isDisabled(): Promise<boolean> {
    return (await this.host()).getProperty('disabled');
  }

  /**
   * Gets whether the option is selected.
   *
   * 获取是否选择了此选项。
   *
   */
  async isSelected(): Promise<boolean> {
    return (await this.host()).getProperty('selected');
  }
}
