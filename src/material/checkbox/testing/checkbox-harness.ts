/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  AsyncFactoryFn,
  ComponentHarness,
  ComponentHarnessConstructor,
  HarnessPredicate,
  TestElement,
} from '@angular/cdk/testing';
import {CheckboxHarnessFilters} from './checkbox-harness-filters';
import {coerceBooleanProperty} from '@angular/cdk/coercion';

export abstract class _MatCheckboxHarnessBase extends ComponentHarness {
  protected abstract _input: AsyncFactoryFn<TestElement>;
  protected abstract _label: AsyncFactoryFn<TestElement>;

  /**
   * Whether the checkbox is checked.
   *
   * 是否勾选了复选框。
   *
   */
  async isChecked(): Promise<boolean> {
    const checked = (await this._input()).getProperty<boolean>('checked');
    return coerceBooleanProperty(await checked);
  }

  /**
   * Whether the checkbox is in an indeterminate state.
   *
   * 该复选框是否处于未决状态。
   *
   */
  async isIndeterminate(): Promise<boolean> {
    const indeterminate = (await this._input()).getProperty<string>('indeterminate');
    return coerceBooleanProperty(await indeterminate);
  }

  /**
   * Whether the checkbox is disabled.
   *
   * 该复选框是否已禁用。
   *
   */
  async isDisabled(): Promise<boolean> {
    const disabled = (await this._input()).getAttribute('disabled');
    return coerceBooleanProperty(await disabled);
  }

  /**
   * Whether the checkbox is required.
   *
   * 该复选框是否必填的。
   *
   */
  async isRequired(): Promise<boolean> {
    const required = (await this._input()).getProperty<boolean>('required');
    return coerceBooleanProperty(await required);
  }

  /**
   * Whether the checkbox is valid.
   *
   * 该复选框是否有效。
   *
   */
  async isValid(): Promise<boolean> {
    const invalid = (await this.host()).hasClass('ng-invalid');
    return !(await invalid);
  }

  /**
   * Gets the checkbox's name.
   *
   * 获取复选框的名字。
   *
   */
  async getName(): Promise<string | null> {
    return (await this._input()).getAttribute('name');
  }

  /**
   * Gets the checkbox's value.
   *
   * 获取复选框的值。
   *
   */
  async getValue(): Promise<string | null> {
    return (await this._input()).getProperty<string | null>('value');
  }

  /**
   * Gets the checkbox's aria-label.
   *
   * 获取复选框的 aria-label。
   *
   */
  async getAriaLabel(): Promise<string | null> {
    return (await this._input()).getAttribute('aria-label');
  }

  /**
   * Gets the checkbox's aria-labelledby.
   *
   * 获取复选框的 aria-labelledby。
   *
   */
  async getAriaLabelledby(): Promise<string | null> {
    return (await this._input()).getAttribute('aria-labelledby');
  }

  /**
   * Gets the checkbox's label text.
   *
   * 获取复选框的标签文本。
   *
   */
  async getLabelText(): Promise<string> {
    return (await this._label()).text();
  }

  /**
   * Focuses the checkbox.
   *
   * 聚焦复选框。
   *
   */
  async focus(): Promise<void> {
    return (await this._input()).focus();
  }

  /**
   * Blurs the checkbox.
   *
   * 失焦复选框。
   *
   */
  async blur(): Promise<void> {
    return (await this._input()).blur();
  }

  /**
   * Whether the checkbox is focused.
   *
   * 该复选框是否拥有焦点。
   *
   */
  async isFocused(): Promise<boolean> {
    return (await this._input()).isFocused();
  }

  /**
   * Toggles the checked state of the checkbox.
   *
   * 切换复选框的勾选状态。
   *
   * Note: This attempts to toggle the checkbox as a user would, by clicking it. Therefore if you
   * are using `MAT_CHECKBOX_DEFAULT_OPTIONS` to change the behavior on click, calling this method
   * might not have the expected result.
   *
   * 注意：当用户点击时，这会尝试按用户的意图切换复选框。因此，如果你使用 `MAT_CHECKBOX_DEFAULT_OPTIONS` 改变过点击时的行为，那么调用这个方法可能产生预料之外的效果。
   *
   */
  abstract toggle(): Promise<void>;

  /**
   * Puts the checkbox in a checked state by toggling it if it is currently unchecked, or doing
   * nothing if it is already checked.
   *
   * 如果当前未勾选复选框，则把复选框置于已勾选状态;如果复选框已勾选，则不执行任何操作。
   *
   * Note: This attempts to check the checkbox as a user would, by clicking it. Therefore if you
   * are using `MAT_CHECKBOX_DEFAULT_OPTIONS` to change the behavior on click, calling this method
   * might not have the expected result.
   *
   * 注意：这会尝试通过单击该复选框来勾选复选框。因此，如果你使用 `MAT_CHECKBOX_DEFAULT_OPTIONS` 改变过单击的行为，那么调用这个方法可能产生预料之外的效果。
   *
   */
  async check(): Promise<void> {
    if (!(await this.isChecked())) {
      await this.toggle();
    }
  }

  /**
   * Puts the checkbox in an unchecked state by toggling it if it is currently checked, or doing
   * nothing if it is already unchecked.
   *
   * 如果复选框当前是勾选的，则把它切换到未勾选状态，如果复选框已经是未勾选的，则不做任何操作。
   *
   * Note: This attempts to uncheck the checkbox as a user would, by clicking it. Therefore if you
   * are using `MAT_CHECKBOX_DEFAULT_OPTIONS` to change the behavior on click, calling this method
   * might not have the expected result.
   *
   * 注意：这会尝试通过单击该复选框来取消勾选该复选框。因此，如果你使用 `MAT_CHECKBOX_DEFAULT_OPTIONS` 改变过单击时的行为，那么调用这个方法可能产生预料之外的效果。
   *
   */
  async uncheck(): Promise<void> {
    if (await this.isChecked()) {
      await this.toggle();
    }
  }
}

/**
 * Harness for interacting with a MDC-based mat-checkbox in tests.
 *
 * 与测试中的标准 mat-checkbox 交互的测试工具。
 *
 */
export class MatCheckboxHarness extends _MatCheckboxHarnessBase {
  static hostSelector = '.mat-mdc-checkbox';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a checkbox with specific attributes.
   *
   * 获取一个 `HarnessPredicate`，可用于搜索满足某些条件的 `MatCheckboxHarness`。
   *
   * @param options Options for narrowing the search:
   *   - `selector` finds a checkbox whose host element matches the given selector.
   *   - `label` finds a checkbox with specific label text.
   *   - `name` finds a checkbox with specific name.
   *
   * 用于过滤哪些复选框实例应该视为匹配项的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 使用给定选项配置过的 `HarnessPredicate`。
   *
   */
  static with<T extends MatCheckboxHarness>(
    this: ComponentHarnessConstructor<T>,
    options: CheckboxHarnessFilters = {},
  ): HarnessPredicate<T> {
    return (
      new HarnessPredicate(this, options)
        .addOption('label', options.label, (harness, label) =>
          HarnessPredicate.stringMatches(harness.getLabelText(), label),
        )
        // We want to provide a filter option for "name" because the name of the checkbox is
        // only set on the underlying input. This means that it's not possible for developers
        // to retrieve the harness of a specific checkbox with name through a CSS selector.
        .addOption(
          'name',
          options.name,
          async (harness, name) => (await harness.getName()) === name,
        )
        .addOption(
          'checked',
          options.checked,
          async (harness, checked) => (await harness.isChecked()) == checked,
        )
        .addOption('disabled', options.disabled, async (harness, disabled) => {
          return (await harness.isDisabled()) === disabled;
        })
    );
  }

  protected _input = this.locatorFor('input');
  protected _label = this.locatorFor('label');
  private _inputContainer = this.locatorFor('.mdc-checkbox');

  async toggle(): Promise<void> {
    const elToClick = (await this.isDisabled()) ? this._inputContainer() : this._input();
    return (await elToClick).click();
  }
}
