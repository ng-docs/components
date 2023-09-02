/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  ContentContainerComponentHarness,
  HarnessPredicate,
  HarnessLoader,
} from '@angular/cdk/testing';
import {StepHarnessFilters} from './step-harness-filters';

/**
 * Harness for interacting with a standard Angular Material step in tests.
 *
 * 在测试中与标准 Angular Material 步骤进行交互的测试工具。
 *
 */
export class MatStepHarness extends ContentContainerComponentHarness<string> {
  /**
   * The selector for the host element of a `MatStep` instance.
   *
   * `MatStep` 实例的宿主元素选择器。
   *
   */
  static hostSelector = '.mat-step-header';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `MatStepHarness` that meets
   * certain criteria.
   *
   * 获取一个 `HarnessPredicate`，可用于搜索满足某些条件的 `MatStepHarness`。
   *
   * @param options Options for filtering which steps are considered a match.
   *
   * 用于过滤哪些步骤被视为匹配的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with(options: StepHarnessFilters = {}): HarnessPredicate<MatStepHarness> {
    return new HarnessPredicate(MatStepHarness, options)
      .addOption('label', options.label, (harness, label) =>
        HarnessPredicate.stringMatches(harness.getLabel(), label),
      )
      .addOption(
        'selected',
        options.selected,
        async (harness, selected) => (await harness.isSelected()) === selected,
      )
      .addOption(
        'completed',
        options.completed,
        async (harness, completed) => (await harness.isCompleted()) === completed,
      )
      .addOption(
        'invalid',
        options.invalid,
        async (harness, invalid) => (await harness.hasErrors()) === invalid,
      );
  }

  /**
   * Gets the label of the step.
   *
   * 获取此步骤的标签。
   *
   */
  async getLabel(): Promise<string> {
    return (await this.locatorFor('.mat-step-text-label')()).text();
  }

  /**
   * Gets the `aria-label` of the step.
   *
   * 获取此步骤的 `aria-label`
   *
   */
  async getAriaLabel(): Promise<string | null> {
    return (await this.host()).getAttribute('aria-label');
  }

  /**
   * Gets the value of the `aria-labelledby` attribute.
   *
   * 获取 `aria-labelledby` 属性的值。
   *
   */
  async getAriaLabelledby(): Promise<string | null> {
    return (await this.host()).getAttribute('aria-labelledby');
  }

  /**
   * Whether the step is selected.
   *
   * 是否已选择此步骤。
   *
   */
  async isSelected(): Promise<boolean> {
    const host = await this.host();
    return (await host.getAttribute('aria-selected')) === 'true';
  }

  /**
   * Whether the step has been filled out.
   *
   * 此步骤是否已填写。
   *
   */
  async isCompleted(): Promise<boolean> {
    const state = await this._getIconState();
    return state === 'done' || (state === 'edit' && !(await this.isSelected()));
  }

  /**
   * Whether the step is currently showing its error state. Note that this doesn't mean that there
   * are or aren't any invalid form controls inside the step, but that the step is showing its
   * error-specific styling which depends on there being invalid controls, as well as the
   * `ErrorStateMatcher` determining that an error should be shown and that the `showErrors`
   * option was enabled through the `STEPPER_GLOBAL_OPTIONS` injection token.
   *
   * 该步骤当前是否正在显示其错误状态。请注意，这并不意味着该步骤内部有或没有任何无效的表单控件，而是该步骤显示了其特有错误的样式，具体取决于是否存在无效的控件，由 `ErrorStateMatcher` 确定是否应该显示某错误，并且通过 `STEPPER_GLOBAL_OPTIONS` 注入令牌启用 `showErrors` 选项。
   *
   */
  async hasErrors(): Promise<boolean> {
    return (await this._getIconState()) === 'error';
  }

  /**
   * Whether the step is optional.
   *
   * 该步骤是否可选。
   *
   */
  async isOptional(): Promise<boolean> {
    // If the node with the optional text is present, it means that the step is optional.
    const optionalNode = await this.locatorForOptional('.mat-step-optional')();
    return !!optionalNode;
  }

  /**
   * Selects the given step by clicking on the label. The step may not be selected
   * if the stepper doesn't allow it \(e.g. if there are validation errors\).
   *
   * 通过单击标签选择给定的步骤。如果步进器不允许，则不能选择该步骤（例如，如果存在验证错误）。
   *
   */
  async select(): Promise<void> {
    await (await this.host()).click();
  }

  protected override async getRootHarnessLoader(): Promise<HarnessLoader> {
    const contentId = await (await this.host()).getAttribute('aria-controls');
    return this.documentRootLocatorFactory().harnessLoaderFor(`#${contentId}`);
  }

  /**
   * Gets the state of the step. Note that we have a `StepState` which we could use to type the
   * return value, but it's basically the same as `string`, because the type has `| string`.
   *
   * 获取此步骤的状态。请注意，我们有一个 `StepState` 可用作返回值的类型，但它与 `string` 基本相同，因为该类型具有 `| string`。
   *
   */
  private async _getIconState(): Promise<string> {
    // The state is exposed on the icon with a class that looks like `mat-step-icon-state-{{state}}`
    const icon = await this.locatorFor('.mat-step-icon')();
    const classes = (await icon.getAttribute('class'))!;
    const match = classes.match(/mat-step-icon-state-([a-z]+)/);

    if (!match) {
      throw Error(`Could not determine step state from "${classes}".`);
    }

    return match[1];
  }
}
