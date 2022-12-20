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
import {OptgroupHarnessFilters} from './optgroup-harness-filters';
import {MatOptionHarness} from './option-harness';
import {OptionHarnessFilters} from './option-harness-filters';

/**
 * Harness for interacting with an MDC-based `mat-optgroup` in tests.
 *
 * 在测试中用来与 `mat-optgroup` 交互的测试工具。
 *
 */
export class MatOptgroupHarness extends ComponentHarness {
  /**
   * Selector used to locate option group instances.
   *
   * 选择器，用于定位选项组实例。
   *
   */
  static hostSelector = '.mat-mdc-optgroup';
  private _label = this.locatorFor('.mat-mdc-optgroup-label');

  /**
   * Gets a `HarnessPredicate` that can be used to search for a option group with specific
   * attributes.
   *
   * 获取一个 `HarnessPredicate`，可用于搜索满足某些条件的 `MatOptgroupHarness`。
   *
   * @param options Options for filtering which option instances are considered a match.
   *
   * 用于过滤哪些选项实例应该视为匹配的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with<T extends MatOptgroupHarness>(
    this: ComponentHarnessConstructor<T>,
    options: OptgroupHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options).addOption(
      'labelText',
      options.labelText,
      async (harness, title) => HarnessPredicate.stringMatches(await harness.getLabelText(), title),
    );
  }

  /**
   * Gets the option group's label text.
   *
   * 获取此选项组的标签文本。
   *
   */
  async getLabelText(): Promise<string> {
    return (await this._label()).text();
  }

  /**
   * Gets whether the option group is disabled.
   *
   * 获取此选项组是否已禁用。
   *
   */
  async isDisabled(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-disabled')) === 'true';
  }

  /**
   * Gets the options that are inside the group.
   *
   * 获取此组内的选项。
   *
   * @param filter Optionally filters which options are included.
   *
   * （可选）过滤包含的选项。
   *
   */
  async getOptions(filter: OptionHarnessFilters = {}): Promise<MatOptionHarness[]> {
    return this.locatorForAll(MatOptionHarness.with(filter))();
  }
}
