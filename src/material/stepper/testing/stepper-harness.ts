/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ComponentHarness, HarnessPredicate} from '@angular/cdk/testing';
import {MatStepHarness} from './step-harness';
import {
  StepperHarnessFilters,
  StepHarnessFilters,
  StepperOrientation,
} from './step-harness-filters';

/**
 * Harness for interacting with a standard Material stepper in tests.
 *
 * 在测试中与标准 Material stepper 进行交互的测试工具。
 *
 */
export class MatStepperHarness extends ComponentHarness {
  /**
   * The selector for the host element of a `MatStepper` instance.
   *
   * `MatStepper` 实例的宿主元素选择器。
   *
   */
  static hostSelector = '.mat-stepper-horizontal, .mat-stepper-vertical';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `MatStepperHarness` that meets
   * certain criteria.
   *
   * 获取一个 `HarnessPredicate`，可用于搜索满足某些条件的 `MatStepperHarness`。
   *
   * @param options Options for filtering which stepper instances are considered a match.
   *
   * 用于过滤哪些步进实例应该视为匹配的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with(options: StepperHarnessFilters = {}): HarnessPredicate<MatStepperHarness> {
    return new HarnessPredicate(MatStepperHarness, options).addOption(
      'orientation',
      options.orientation,
      async (harness, orientation) => (await harness.getOrientation()) === orientation,
    );
  }

  /**
   * Gets the list of steps in the stepper.
   *
   * 获取此步进器中的步骤列表。
   *
   * @param filter Optionally filters which steps are included.
   *
   * （可选）过滤包括哪些步骤。
   *
   */
  async getSteps(filter: StepHarnessFilters = {}): Promise<MatStepHarness[]> {
    return this.locatorForAll(MatStepHarness.with(filter))();
  }

  /**
   * Gets the orientation of the stepper.
   *
   * 获取步进器的方向。
   *
   */
  async getOrientation(): Promise<StepperOrientation> {
    const host = await this.host();
    return (await host.hasClass('mat-stepper-horizontal'))
      ? StepperOrientation.HORIZONTAL
      : StepperOrientation.VERTICAL;
  }

  /**
   * Selects a step in this stepper.
   *
   * 在此步进器中选择一个步骤。
   *
   * @param filter An optional filter to apply to the child steps. The first step matching the
   *    filter will be selected.
   *
   * 应用于子步骤的可选过滤器。将选择与此过滤器匹配的第一步。
   *
   */
  async selectStep(filter: StepHarnessFilters = {}): Promise<void> {
    const steps = await this.getSteps(filter);
    if (!steps.length) {
      throw Error(`Cannot find mat-step matching filter ${JSON.stringify(filter)}`);
    }
    await steps[0].select();
  }
}
