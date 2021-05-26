/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ComponentHarness, HarnessPredicate} from '@angular/cdk/testing';
import {coerceBooleanProperty} from '@angular/cdk/coercion';
import {SlideToggleHarnessFilters} from './slide-toggle-harness-filters';

export abstract class _MatSlideToggleHarnessBase extends ComponentHarness {
  private _label = this.locatorFor('label');
  protected _input = this.locatorFor('input');

  /**
   * Toggle the checked state of the slide-toggle.
   *
   * 切换此滑块开关的选中状态。
   *
   */
  abstract toggle(): Promise<void>;

  /**
   * Whether the slide-toggle is checked.
   *
   * 是否选中了此滑块开关。
   *
   */
  async isChecked(): Promise<boolean> {
    const checked = (await this._input()).getProperty('checked');
    return coerceBooleanProperty(await checked);
  }

  /**
   * Whether the slide-toggle is disabled.
   *
   * 此滑块开关是否已禁用。
   *
   */
  async isDisabled(): Promise<boolean> {
    const disabled = (await this._input()).getAttribute('disabled');
    return coerceBooleanProperty(await disabled);
  }

  /**
   * Whether the slide-toggle is required.
   *
   * 滑块开关是否为必填项。
   *
   */
  async isRequired(): Promise<boolean> {
    const required = (await this._input()).getAttribute('required');
    return coerceBooleanProperty(await required);
  }

  /**
   * Whether the slide-toggle is valid.
   *
   * 此滑块开关是否有效。
   *
   */
  async isValid(): Promise<boolean> {
    const invalid = (await this.host()).hasClass('ng-invalid');
    return !(await invalid);
  }

  /**
   * Gets the slide-toggle's name.
   *
   * 获取此滑块开关的名称。
   *
   */
  async getName(): Promise<string | null> {
    return (await this._input()).getAttribute('name');
  }

  /**
   * Gets the slide-toggle's aria-label.
   *
   * 获取此滑块开关的 aria-label。
   *
   */
  async getAriaLabel(): Promise<string | null> {
    return (await this._input()).getAttribute('aria-label');
  }

  /**
   * Gets the slide-toggle's aria-labelledby.
   *
   * 获取滑块开关的 aria-labeledby。
   *
   */
  async getAriaLabelledby(): Promise<string | null> {
    return (await this._input()).getAttribute('aria-labelledby');
  }

  /**
   * Gets the slide-toggle's label text.
   *
   * 获取此滑块开关的标签文本。
   *
   */
  async getLabelText(): Promise<string> {
    return (await this._label()).text();
  }

  /**
   * Focuses the slide-toggle.
   *
   * 让此滑块开关获得焦点。
   *
   */
  async focus(): Promise<void> {
    return (await this._input()).focus();
  }

  /**
   * Blurs the slide-toggle.
   *
   * 让此滑块开关失焦。
   *
   */
  async blur(): Promise<void> {
    return (await this._input()).blur();
  }

  /**
   * Whether the slide-toggle is focused.
   *
   * 此滑块开关是否拥有焦点。
   *
   */
  async isFocused(): Promise<boolean> {
    return (await this._input()).isFocused();
  }

  /**
   * Puts the slide-toggle in a checked state by toggling it if it is currently unchecked, or doing
   * nothing if it is already checked.
   *
   * 如果当前未选中它，则将其切换为选中状态；如果已经选中，则不进行任何操作。
   *
   */
  async check(): Promise<void> {
    if (!(await this.isChecked())) {
      await this.toggle();
    }
  }

  /**
   * Puts the slide-toggle in an unchecked state by toggling it if it is currently checked, or doing
   * nothing if it is already unchecked.
   *
   * 如果当前已选中它，则将其切换为未选中状态；如果尚未选中，则不进行任何操作。
   *
   */
  async uncheck(): Promise<void> {
    if (await this.isChecked()) {
      await this.toggle();
    }
  }
}



/**
 * Harness for interacting with a standard mat-slide-toggle in tests.
 *
 * 在测试中可与标准的 mat-slide-toggle 进行交互的测试工具。
 *
 */
export class MatSlideToggleHarness extends _MatSlideToggleHarnessBase {
  /**
   * The selector for the host element of a `MatSlideToggle` instance.
   *
   * `MatSlideToggle` 实例的宿主元素选择器。
   *
   */
  static hostSelector = '.mat-slide-toggle';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `MatSlideToggleHarness` that meets
   * certain criteria.
   *
   * 获取一个 `HarnessPredicate`，可用于搜索满足某些条件的 `MatSlideToggleHarness`。
   *
   * @param options Options for filtering which slide toggle instances are considered a match.
   *
   * 用于筛选哪些滑块开关实例应该视为匹配项的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 使用给定选项配置过的 `HarnessPredicate`
   *
   */
  static with(options: SlideToggleHarnessFilters = {}): HarnessPredicate<MatSlideToggleHarness> {
    return new HarnessPredicate(MatSlideToggleHarness, options)
        .addOption('label', options.label,
            (harness, label) => HarnessPredicate.stringMatches(harness.getLabelText(), label))
        // We want to provide a filter option for "name" because the name of the slide-toggle is
        // only set on the underlying input. This means that it's not possible for developers
        // to retrieve the harness of a specific checkbox with name through a CSS selector.
        .addOption('name', options.name, async (harness, name) => await harness.getName() === name);
  }

  private _inputContainer = this.locatorFor('.mat-slide-toggle-bar');

  /**
   * Toggle the checked state of the slide-toggle.
   *
   * 此滑块开关的选中状态。
   *
   */
  async toggle(): Promise<void> {
    return (await this._inputContainer()).click();
  }
}
