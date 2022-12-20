/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ComponentHarness, HarnessPredicate} from '@angular/cdk/testing';
import {MatButtonToggleAppearance} from '@angular/material/button-toggle';
import {ButtonToggleGroupHarnessFilters} from './button-toggle-group-harness-filters';
import {ButtonToggleHarnessFilters} from './button-toggle-harness-filters';
import {MatButtonToggleHarness} from './button-toggle-harness';

/**
 * Harness for interacting with a standard mat-button-toggle in tests.
 *
 * 在测试中与标准 mat-button-toggle 进行交互的测试工具。
 *
 */
export class MatButtonToggleGroupHarness extends ComponentHarness {
  /**
   * The selector for the host element of a `MatButton` instance.
   *
   * `MatButton` 实例的宿主元素选择器。
   *
   */
  static hostSelector = '.mat-button-toggle-group';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `MatButtonToggleGroupHarness`
   * that meets certain criteria.
   *
   * 获取一个 `HarnessPredicate`，它可以用来搜索满足一定条件 `MatButtonToggleGroupHarness`
   *
   * @param options Options for filtering which button toggle instances are considered a match.
   *
   * 过滤哪些按钮开关实例的选项是匹配的。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 使用指定选项配置过的 `HarnessPredicate`。
   *
   */
  static with(
    options: ButtonToggleGroupHarnessFilters = {},
  ): HarnessPredicate<MatButtonToggleGroupHarness> {
    return new HarnessPredicate(MatButtonToggleGroupHarness, options).addOption(
      'disabled',
      options.disabled,
      async (harness, disabled) => {
        return (await harness.isDisabled()) === disabled;
      },
    );
  }

  /**
   * Gets the button toggles that are inside the group.
   *
   * 获取组内部的按钮开关。
   *
   * @param filter Optionally filters which toggles are included.
   *
   * （可选）应该包括哪些按钮的过滤器。
   *
   */
  async getToggles(filter: ButtonToggleHarnessFilters = {}): Promise<MatButtonToggleHarness[]> {
    return this.locatorForAll(MatButtonToggleHarness.with(filter))();
  }

  /**
   * Gets whether the button toggle group is disabled.
   *
   * 获取是否禁用了此按钮开关组。
   *
   */
  async isDisabled(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-disabled')) === 'true';
  }

  /**
   * Gets whether the button toggle group is laid out vertically.
   *
   * 获取按钮开关组是否垂直排列。
   *
   */
  async isVertical(): Promise<boolean> {
    return (await this.host()).hasClass('mat-button-toggle-vertical');
  }

  /**
   * Gets the appearance that the group is using.
   *
   * 获取该组正在使用的外观。
   *
   */
  async getAppearance(): Promise<MatButtonToggleAppearance> {
    const host = await this.host();
    const className = 'mat-button-toggle-group-appearance-standard';
    return (await host.hasClass(className)) ? 'standard' : 'legacy';
  }
}
