/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ComponentHarness, HarnessPredicate} from '@angular/cdk/testing';
import {coerceBooleanProperty} from '@angular/cdk/coercion';
import {MatButtonToggleAppearance} from '@angular/material/button-toggle';
import {ButtonToggleHarnessFilters} from './button-toggle-harness-filters';

/**
 * Harness for interacting with a standard mat-button-toggle in tests.
 *
 * 在测试中与标准 mat-button-toggle 进行交互的测试工具。
 *
 */
export class MatButtonToggleHarness extends ComponentHarness {
  /**
   * The selector for the host element of a `MatButton` instance.
   *
   * `MatButton` 实例的宿主元素选择器。
   *
   */
  static hostSelector = '.mat-button-toggle';

  private _label = this.locatorFor('.mat-button-toggle-label-content');
  private _button = this.locatorFor('.mat-button-toggle-button');

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `MatButtonToggleHarness` that meets
   * certain criteria.
   *
   * 获取一个 `HarnessPredicate`，它可以用来搜索满足一定条件 `MatButtonToggleHarness`
   *
   * @param options Options for filtering which button toggle instances are considered a match.
   *
   * 过滤哪些按钮开关实例的选项是匹配的。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 使用指定选项配置过的 `HarnessPredicate`。
   */
  static with(options: ButtonToggleHarnessFilters = {}): HarnessPredicate<MatButtonToggleHarness> {
    return new HarnessPredicate(MatButtonToggleHarness, options)
      .addOption('text', options.text, (harness, text) =>
        HarnessPredicate.stringMatches(harness.getText(), text),
      )
      .addOption('name', options.name, (harness, name) =>
        HarnessPredicate.stringMatches(harness.getName(), name),
      )
      .addOption(
        'checked',
        options.checked,
        async (harness, checked) => (await harness.isChecked()) === checked,
      )
      .addOption('disabled', options.disabled, async (harness, disabled) => {
        return (await harness.isDisabled()) === disabled;
      });
  }

  /**
   * Gets a boolean promise indicating if the button toggle is checked.
   *
   * 获取一个布尔型 Promise，表明是否勾选了此按钮开关。
   *
   */
  async isChecked(): Promise<boolean> {
    const checked = (await this._button()).getAttribute('aria-pressed');
    return coerceBooleanProperty(await checked);
  }

  /**
   * Gets a boolean promise indicating if the button toggle is disabled.
   *
   * 获取一个布尔型 Promise，表明此按钮是否已禁用。
   *
   */
  async isDisabled(): Promise<boolean> {
    const disabled = (await this._button()).getAttribute('disabled');
    return coerceBooleanProperty(await disabled);
  }

  /**
   * Gets a promise for the button toggle's name.
   *
   * 获取此按钮开关名称的 Promise。
   *
   */
  async getName(): Promise<string | null> {
    return (await this._button()).getAttribute('name');
  }

  /**
   * Gets a promise for the button toggle's aria-label.
   *
   * 获取此按钮开关的 aria-label 的 Promise。
   *
   */
  async getAriaLabel(): Promise<string | null> {
    return (await this._button()).getAttribute('aria-label');
  }

  /**
   * Gets a promise for the button toggles's aria-labelledby.
   *
   * 获取此按钮开关的 aria-labelledby 的 Promise。
   *
   */
  async getAriaLabelledby(): Promise<string | null> {
    return (await this._button()).getAttribute('aria-labelledby');
  }

  /**
   * Gets a promise for the button toggle's text.
   *
   * 获取此按钮开关文本的 Promise。
   *
   */
  async getText(): Promise<string> {
    return (await this._label()).text();
  }

  /**
   * Gets the appearance that the button toggle is using.
   *
   * 获取此按钮开关正在使用的外观。
   *
   */
  async getAppearance(): Promise<MatButtonToggleAppearance> {
    const host = await this.host();
    const className = 'mat-button-toggle-appearance-standard';
    return (await host.hasClass(className)) ? 'standard' : 'legacy';
  }

  /**
   * Focuses the toggle.
   *
   * 让此开关获取焦点。
   *
   */
  async focus(): Promise<void> {
    return (await this._button()).focus();
  }

  /**
   * Blurs the toggle.
   *
   * 让此开关失焦。
   *
   */
  async blur(): Promise<void> {
    return (await this._button()).blur();
  }

  /**
   * Whether the toggle is focused.
   *
   * 此开关是否拥有焦点。
   *
   */
  async isFocused(): Promise<boolean> {
    return (await this._button()).isFocused();
  }

  /**
   * Toggle the checked state of the buttons toggle.
   *
   * 切换按钮开关的勾选状态。
   *
   */
  async toggle(): Promise<void> {
    return (await this._button()).click();
  }

  /**
   * Puts the button toggle in a checked state by toggling it if it's
   * currently unchecked, or doing nothing if it is already checked.
   *
   * 如果当前未勾选，就把按钮开关设置到已勾选状态；如果当前未勾选，就什么也不做。
   *
   */
  async check(): Promise<void> {
    if (!(await this.isChecked())) {
      await this.toggle();
    }
  }

  /**
   * Puts the button toggle in an unchecked state by toggling it if it's
   * currently checked, or doing nothing if it's already unchecked.
   *
   * 如果当前已勾选，则把此按钮开关切换到未勾选状态；如果当前未勾选，就什么也不做。
   *
   */
  async uncheck(): Promise<void> {
    if (await this.isChecked()) {
      await this.toggle();
    }
  }
}
