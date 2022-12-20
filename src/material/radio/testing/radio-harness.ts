/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {coerceBooleanProperty} from '@angular/cdk/coercion';
import {
  AsyncFactoryFn,
  BaseHarnessFilters,
  ComponentHarness,
  ComponentHarnessConstructor,
  HarnessPredicate,
  TestElement,
} from '@angular/cdk/testing';
import {RadioButtonHarnessFilters, RadioGroupHarnessFilters} from './radio-harness-filters';

export abstract class _MatRadioGroupHarnessBase<
  ButtonType extends ComponentHarnessConstructor<Button> & {
    with: (options?: ButtonFilters) => HarnessPredicate<Button>;
  },
  Button extends ComponentHarness & {
    isChecked(): Promise<boolean>;
    getValue(): Promise<string | null>;
    getName(): Promise<string | null>;
    check(): Promise<void>;
  },
  ButtonFilters extends BaseHarnessFilters,
> extends ComponentHarness {
  protected abstract _buttonClass: ButtonType;

  /**
   * Gets the name of the radio-group.
   *
   * 获取此单选组的名称。
   *
   */
  async getName(): Promise<string | null> {
    const hostName = await this._getGroupNameFromHost();
    // It's not possible to always determine the "name" of a radio-group by reading
    // the attribute. This is because the radio-group does not set the "name" as an
    // element attribute if the "name" value is set through a binding.
    if (hostName !== null) {
      return hostName;
    }
    // In case we couldn't determine the "name" of a radio-group by reading the
    // "name" attribute, we try to determine the "name" of the group by going
    // through all radio buttons.
    const radioNames = await this._getNamesFromRadioButtons();
    if (!radioNames.length) {
      return null;
    }
    if (!this._checkRadioNamesInGroupEqual(radioNames)) {
      throw Error('Radio buttons in radio-group have mismatching names.');
    }
    return radioNames[0]!;
  }

  /**
   * Gets the id of the radio-group.
   *
   * 获取此单选组的 ID。
   *
   */
  async getId(): Promise<string | null> {
    return (await this.host()).getProperty<string | null>('id');
  }

  /**
   * Gets the checked radio-button in a radio-group.
   *
   * 获取此单选组中选中的单选按钮。
   *
   */
  async getCheckedRadioButton(): Promise<Button | null> {
    for (let radioButton of await this.getRadioButtons()) {
      if (await radioButton.isChecked()) {
        return radioButton;
      }
    }
    return null;
  }

  /**
   * Gets the checked value of the radio-group.
   *
   * 获取此单选组的检查值。
   *
   */
  async getCheckedValue(): Promise<string | null> {
    const checkedRadio = await this.getCheckedRadioButton();
    if (!checkedRadio) {
      return null;
    }
    return checkedRadio.getValue();
  }

  /**
   * Gets a list of radio buttons which are part of the radio-group.
   *
   * 获取属于此单选组的单选按钮的列表。
   *
   * @param filter Optionally filters which radio buttons are included.
   *
   * （可选）过滤包含哪些单选按钮。
   *
   */
  async getRadioButtons(filter?: ButtonFilters): Promise<Button[]> {
    return this.locatorForAll(this._buttonClass.with(filter))();
  }

  /**
   * Checks a radio button in this group.
   *
   * 选中该组中的单选按钮。
   *
   * @param filter An optional filter to apply to the child radio buttons. The first tab matching
   *     the filter will be selected.
   *
   * 应用于子单选按钮的可选过滤器。将选择与过滤器匹配的第一个标签。
   *
   */
  async checkRadioButton(filter?: ButtonFilters): Promise<void> {
    const radioButtons = await this.getRadioButtons(filter);
    if (!radioButtons.length) {
      throw Error(`Could not find radio button matching ${JSON.stringify(filter)}`);
    }
    return radioButtons[0].check();
  }

  /**
   * Gets the name attribute of the host element.
   *
   * 获取宿主元素的 name 属性。
   *
   */
  private async _getGroupNameFromHost() {
    return (await this.host()).getAttribute('name');
  }

  /**
   * Gets a list of the name attributes of all child radio buttons.
   *
   * 获取所有子单选按钮的 name 属性的列表。
   *
   */
  private async _getNamesFromRadioButtons(): Promise<string[]> {
    const groupNames: string[] = [];
    for (let radio of await this.getRadioButtons()) {
      const radioName = await radio.getName();
      if (radioName !== null) {
        groupNames.push(radioName);
      }
    }
    return groupNames;
  }

  /**
   * Checks if the specified radio names are all equal.
   *
   * 检查指定的单选名称是否全部相等。
   *
   */
  private _checkRadioNamesInGroupEqual(radioNames: string[]): boolean {
    let groupName: string | null = null;
    for (let radioName of radioNames) {
      if (groupName === null) {
        groupName = radioName;
      } else if (groupName !== radioName) {
        return false;
      }
    }
    return true;
  }

  /**
   * Checks if a radio-group harness has the given name. Throws if a radio-group with
   * matching name could be found but has mismatching radio-button names.
   *
   * 检查单选组测试工具是否具有给定名称。如果可以找到具有匹配名称的单选组但具有不匹配的单选按钮名，则抛出该异常。
   *
   */
  protected static async _checkRadioGroupName(
    harness: _MatRadioGroupHarnessBase<any, any, any>,
    name: string,
  ) {
    // Check if there is a radio-group which has the "name" attribute set
    // to the expected group name. It's not possible to always determine
    // the "name" of a radio-group by reading the attribute. This is because
    // the radio-group does not set the "name" as an element attribute if the
    // "name" value is set through a binding.
    if ((await harness._getGroupNameFromHost()) === name) {
      return true;
    }
    // Check if there is a group with radio-buttons that all have the same
    // expected name. This implies that the group has the given name. It's
    // not possible to always determine the name of a radio-group through
    // the attribute because there is
    const radioNames = await harness._getNamesFromRadioButtons();
    if (radioNames.indexOf(name) === -1) {
      return false;
    }
    if (!harness._checkRadioNamesInGroupEqual(radioNames)) {
      throw Error(
        `The locator found a radio-group with name "${name}", but some ` +
          `radio-button's within the group have mismatching names, which is invalid.`,
      );
    }
    return true;
  }
}

/**
 * Harness for interacting with an MDC-based mat-radio-group in tests.
 *
 * 在测试中用来与标准 mat-radio-group 进行交互的测试工具。
 *
 */
export class MatRadioGroupHarness extends _MatRadioGroupHarnessBase<
  typeof MatRadioButtonHarness,
  MatRadioButtonHarness,
  RadioButtonHarnessFilters
> {
  /**
   * The selector for the host element of a `MatRadioGroup` instance.
   *
   * `MatRadioGroup` 实例的宿主元素选择器。
   *
   */
  static hostSelector = '.mat-mdc-radio-group';
  protected _buttonClass = MatRadioButtonHarness;

  /**
   * Gets a `HarnessPredicate` that can be used to search for a radio group with specific
   * attributes.
   *
   * 获取一个 `HarnessPredicate`，可用于搜索满足某些条件的 `MatRadioGroupHarness`。
   *
   * @param options Options for filtering which radio group instances are considered a match.
   *
   * 用于过滤哪些无线电组实例应该视为匹配的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with<T extends MatRadioGroupHarness>(
    this: ComponentHarnessConstructor<T>,
    options: RadioGroupHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options).addOption(
      'name',
      options.name,
      MatRadioGroupHarness._checkRadioGroupName,
    );
  }
}

export abstract class _MatRadioButtonHarnessBase extends ComponentHarness {
  protected abstract _textLabel: AsyncFactoryFn<TestElement>;
  protected abstract _clickLabel: AsyncFactoryFn<TestElement>;
  private _input = this.locatorFor('input');

  /**
   * Whether the radio-button is checked.
   *
   * 是否已选中此单选按钮。
   *
   */
  async isChecked(): Promise<boolean> {
    const checked = (await this._input()).getProperty<boolean>('checked');
    return coerceBooleanProperty(await checked);
  }

  /**
   * Whether the radio-button is disabled.
   *
   * 此单选按钮是否已禁用。
   *
   */
  async isDisabled(): Promise<boolean> {
    const disabled = (await this._input()).getAttribute('disabled');
    return coerceBooleanProperty(await disabled);
  }

  /**
   * Whether the radio-button is required.
   *
   * 此单选按钮是否必填的。
   *
   */
  async isRequired(): Promise<boolean> {
    const required = (await this._input()).getAttribute('required');
    return coerceBooleanProperty(await required);
  }

  /**
   * Gets the radio-button's name.
   *
   * 获取此单选按钮的名称。
   *
   */
  async getName(): Promise<string | null> {
    return (await this._input()).getAttribute('name');
  }

  /**
   * Gets the radio-button's id.
   *
   * 获取此单选按钮的 ID。
   *
   */
  async getId(): Promise<string | null> {
    return (await this.host()).getProperty<string>('id');
  }

  /**
   * Gets the value of the radio-button. The radio-button value will be converted to a string.
   *
   * 获取此单选按钮的值。单选按钮的值将转换为字符串。
   *
   * Note: This means that for radio-button's with an object as a value `[object Object]` is
   * intentionally returned.
   *
   * 注意：这意味着对于以对象为值的单选按钮，将刻意返回 `[object Object]`
   *
   */
  async getValue(): Promise<string | null> {
    return (await this._input()).getProperty('value');
  }

  /**
   * Gets the radio-button's label text.
   *
   * 获取单选按钮的标签文本。
   *
   */
  async getLabelText(): Promise<string> {
    return (await this._textLabel()).text();
  }

  /**
   * Focuses the radio-button.
   *
   * 让此单选按钮获得焦点。
   *
   */
  async focus(): Promise<void> {
    return (await this._input()).focus();
  }

  /**
   * Blurs the radio-button.
   *
   * 让此单选按钮失焦。
   *
   */
  async blur(): Promise<void> {
    return (await this._input()).blur();
  }

  /**
   * Whether the radio-button is focused.
   *
   * 此单选按钮是否拥有焦点。
   *
   */
  async isFocused(): Promise<boolean> {
    return (await this._input()).isFocused();
  }

  /**
   * Puts the radio-button in a checked state by clicking it if it is currently unchecked,
   * or doing nothing if it is already checked.
   *
   * 通过单击此单选按钮（如果当前未选中）将其置于选中状态，或者如果已选中则不执行任何操作。
   *
   */
  async check(): Promise<void> {
    if (!(await this.isChecked())) {
      return (await this._clickLabel()).click();
    }
  }
}

/**
 * Harness for interacting with an MDC-based mat-radio-button in tests.
 *
 * 在测试中可与标准 mat-radio-button 进行交互的测试工具。
 *
 */
export class MatRadioButtonHarness extends _MatRadioButtonHarnessBase {
  /**
   * The selector for the host element of a `MatRadioButton` instance.
   *
   * `MatRadioButton` 实例的宿主元素选择器。
   *
   */
  static hostSelector = '.mat-mdc-radio-button';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a radio button with specific
   * attributes.
   *
   * 获取一个 `HarnessPredicate`，可用于搜索满足某些条件的 `MatRadioButtonHarness`。
   *
   * @param options Options for filtering which radio button instances are considered a match.
   *
   * 用于过滤哪些单选按钮实例应该视为匹配的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 使用给定选项配置过的 `HarnessPredicate`
   *
   */
  static with<T extends MatRadioButtonHarness>(
    this: ComponentHarnessConstructor<T>,
    options: RadioButtonHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options)
      .addOption('label', options.label, (harness, label) =>
        HarnessPredicate.stringMatches(harness.getLabelText(), label),
      )
      .addOption('name', options.name, async (harness, name) => (await harness.getName()) === name)
      .addOption(
        'checked',
        options.checked,
        async (harness, checked) => (await harness.isChecked()) == checked,
      );
  }

  protected _textLabel = this.locatorFor('label');
  protected _clickLabel = this._textLabel;
}
