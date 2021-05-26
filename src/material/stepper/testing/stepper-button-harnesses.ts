/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ComponentHarness, HarnessPredicate} from '@angular/cdk/testing';
import {StepperButtonHarnessFilters} from './step-harness-filters';

/**
 * Base class for stepper button harnesses.
 *
 * 步进按钮测试工具的基类。
 *
 */
abstract class StepperButtonHarness extends ComponentHarness {
  /**
   * Gets the text of the button.
   *
   * 获取按钮的文本。
   *
   */
  async getText(): Promise<string> {
    return (await this.host()).text();
  }

  /**
   * Clicks the button.
   *
   * 单击此按钮。
   *
   */
  async click(): Promise<void> {
    return (await this.host()).click();
  }
}

/**
 * Harness for interacting with a standard Angular Material stepper next button in tests.
 *
 * 在测试中可与标准 Angular Material 步进器的“下一个”按钮进行交互的测试工具。
 *
 */
export class MatStepperNextHarness extends StepperButtonHarness {
  /**
   * The selector for the host element of a `MatStep` instance.
   *
   * `MatStep` 实例的宿主元素选择器。
   *
   */
  static hostSelector = '.mat-stepper-next';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `MatStepperNextHarness` that meets
   * certain criteria.
   *
   * 获取一个 `HarnessPredicate`，可用于搜索满足某些条件的 `MatStepperNextHarness`。
   *
   * @param options Options for filtering which steps are considered a match.
   *
   * 用于过滤哪些步骤被视为匹配的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with(options: StepperButtonHarnessFilters = {}): HarnessPredicate<MatStepperNextHarness> {
    return new HarnessPredicate(MatStepperNextHarness, options)
        .addOption('text', options.text,
            (harness, text) => HarnessPredicate.stringMatches(harness.getText(), text));
  }
}

/**
 * Harness for interacting with a standard Angular Material stepper previous button in tests.
 *
 * 在测试中可与标准 Angular Material 步进器的“上一步”按钮进行交互的测试工具。
 *
 */
export class MatStepperPreviousHarness extends StepperButtonHarness {
  /**
   * The selector for the host element of a `MatStep` instance.
   *
   * `MatStep` 实例的宿主元素选择器。
   *
   */
  static hostSelector = '.mat-stepper-previous';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `MatStepperPreviousHarness`
   * that meets certain criteria.
   *
   * 获取一个 `HarnessPredicate`，该 HarnessPredicate 可用于搜索满足某些条件的 `MatStepperPreviousHarness`。
   *
   * @param options Options for filtering which steps are considered a match.
   *
   * 用于过滤哪些步骤被视为匹配的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with(options: StepperButtonHarnessFilters = {}):
    HarnessPredicate<MatStepperPreviousHarness> {
    return new HarnessPredicate(MatStepperPreviousHarness, options)
        .addOption('text', options.text,
            (harness, text) => HarnessPredicate.stringMatches(harness.getText(), text));
  }
}
