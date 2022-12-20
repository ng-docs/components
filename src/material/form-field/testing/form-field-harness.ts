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
  HarnessQuery,
  parallel,
  TestElement,
} from '@angular/cdk/testing';
import {ErrorHarnessFilters, MatErrorHarness} from './error-harness';
import {MatInputHarness} from '@angular/material/input/testing';
import {MatFormFieldControlHarness} from '@angular/material/form-field/testing/control';
import {MatSelectHarness} from '@angular/material/select/testing';
import {
  MatDatepickerInputHarness,
  MatDateRangeInputHarness,
} from '@angular/material/datepicker/testing';
import {FormFieldHarnessFilters} from './form-field-harness-filters';

interface ErrorBase extends ComponentHarness {
  getText(): Promise<string>;
}

export abstract class _MatFormFieldHarnessBase<
  ControlHarness extends MatFormFieldControlHarness,
  ErrorType extends ComponentHarnessConstructor<ErrorBase> & {
    with: (options?: ErrorHarnessFilters) => HarnessPredicate<ErrorBase>;
  },
> extends ComponentHarness {
  protected abstract _prefixContainer: AsyncFactoryFn<TestElement | null>;
  protected abstract _suffixContainer: AsyncFactoryFn<TestElement | null>;
  protected abstract _label: AsyncFactoryFn<TestElement | null>;
  protected abstract _hints: AsyncFactoryFn<TestElement[]>;
  protected abstract _inputControl: AsyncFactoryFn<ControlHarness | null>;
  protected abstract _selectControl: AsyncFactoryFn<ControlHarness | null>;
  protected abstract _datepickerInputControl: AsyncFactoryFn<ControlHarness | null>;
  protected abstract _dateRangeInputControl: AsyncFactoryFn<ControlHarness | null>;
  protected abstract _errorHarness: ErrorType;

  /**
   * Gets the appearance of the form-field.
   *
   * 获取表单字段的外观。
   *
   */
  abstract getAppearance(): Promise<string>;

  /**
   * Whether the label is currently floating.
   *
   * 此标签当前是否处于浮动状态。
   *
   */
  abstract isLabelFloating(): Promise<boolean>;

  /**
   * Whether the form-field has a label.
   *
   * 此表单字段是否具有标签。
   *
   */
  abstract hasLabel(): Promise<boolean>;

  /**
   * Gets the label of the form-field.
   *
   * 获取此表单字段的标签。
   *
   */
  async getLabel(): Promise<string | null> {
    const labelEl = await this._label();
    return labelEl ? labelEl.text() : null;
  }

  /**
   * Whether the form-field has errors.
   *
   * 此表单字段是否有错误。
   *
   */
  async hasErrors(): Promise<boolean> {
    return (await this.getTextErrors()).length > 0;
  }

  /**
   * Whether the form-field is disabled.
   *
   * 此表单字段是否已禁用。
   *
   */
  async isDisabled(): Promise<boolean> {
    return (await this.host()).hasClass('mat-form-field-disabled');
  }

  /**
   * Whether the form-field is currently autofilled.
   *
   * 此表单字段当前是否为自动填充的。
   *
   */
  async isAutofilled(): Promise<boolean> {
    return (await this.host()).hasClass('mat-form-field-autofilled');
  }

  /**
   * Gets the harness of the control that is bound to the form-field. Only
   * default controls such as "MatInputHarness" and "MatSelectHarness" are
   * supported.
   *
   * 获取绑定到此表单字段的控件的测试工具。仅支持默认控件，例如 “MatInputHarness” 和 “MatSelectHarness”。
   *
   */
  async getControl(): Promise<ControlHarness | null>;

  /**
   * Gets the harness of the control that is bound to the form-field. Searches
   * for a control that matches the specified harness type.
   *
   * 获取绑定到此表单字段的控件的测试工具。搜索与指定的测试工具类型匹配的控件。
   *
   */
  async getControl<X extends MatFormFieldControlHarness>(
    type: ComponentHarnessConstructor<X>,
  ): Promise<X | null>;

  /**
   * Gets the harness of the control that is bound to the form-field. Searches
   * for a control that matches the specified harness predicate.
   *
   * 获取绑定到此表单字段的控件的测试工具。搜索与指定的测试工具谓词匹配的控件。
   *
   */
  async getControl<X extends MatFormFieldControlHarness>(
    type: HarnessPredicate<X>,
  ): Promise<X | null>;

  // Implementation of the "getControl" method overload signatures.
  async getControl<X extends MatFormFieldControlHarness>(type?: HarnessQuery<X>) {
    if (type) {
      return this.locatorForOptional(type)();
    }
    const [select, input, datepickerInput, dateRangeInput] = await parallel(() => [
      this._selectControl(),
      this._inputControl(),
      this._datepickerInputControl(),
      this._dateRangeInputControl(),
    ]);

    // Match the datepicker inputs first since they can also have a `MatInput`.
    return datepickerInput || dateRangeInput || select || input;
  }

  /**
   * Gets the theme color of the form-field.
   *
   * 获取此表单字段的主题颜色。
   *
   */
  async getThemeColor(): Promise<'primary' | 'accent' | 'warn'> {
    const hostEl = await this.host();
    const [isAccent, isWarn] = await parallel(() => {
      return [hostEl.hasClass('mat-accent'), hostEl.hasClass('mat-warn')];
    });
    if (isAccent) {
      return 'accent';
    } else if (isWarn) {
      return 'warn';
    }
    return 'primary';
  }

  /**
   * Gets error messages which are currently displayed in the form-field.
   *
   * 获取当前显示在此表单字段中的错误消息。
   *
   */
  async getTextErrors(): Promise<string[]> {
    const errors = await this.getErrors();
    return parallel(() => errors.map(e => e.getText()));
  }

  /** Gets all of the error harnesses in the form field. */
  async getErrors(filter: ErrorHarnessFilters = {}): Promise<MatErrorHarness[]> {
    return this.locatorForAll(this._errorHarness.with(filter))();
  }

  /**
   * Gets hint messages which are currently displayed in the form-field.
   *
   * 获取当前显示在此表单字段中的提示消息。
   *
   */
  async getTextHints(): Promise<string[]> {
    const hints = await this._hints();
    return parallel(() => hints.map(e => e.text()));
  }

  /**
   * Gets the text inside the prefix element.
   *
   * 获取 prefix 元素内的文本。
   *
   */
  async getPrefixText(): Promise<string> {
    const prefix = await this._prefixContainer();
    return prefix ? prefix.text() : '';
  }

  /**
   * Gets the text inside the suffix element.
   *
   * 获取此后缀元素内的文本。
   *
   */
  async getSuffixText(): Promise<string> {
    const suffix = await this._suffixContainer();
    return suffix ? suffix.text() : '';
  }

  /**
   * Whether the form control has been touched. Returns "null"
   * if no form control is set up.
   *
   * 此表单控件是否已被碰过。如果未设置表单控件，则返回 “null”。
   *
   */
  async isControlTouched(): Promise<boolean | null> {
    if (!(await this._hasFormControl())) {
      return null;
    }
    return (await this.host()).hasClass('ng-touched');
  }

  /**
   * Whether the form control is dirty. Returns "null"
   * if no form control is set up.
   *
   * 此表单控件是否脏了。如果未设置表单控件，则返回 “null”。
   *
   */
  async isControlDirty(): Promise<boolean | null> {
    if (!(await this._hasFormControl())) {
      return null;
    }
    return (await this.host()).hasClass('ng-dirty');
  }

  /**
   * Whether the form control is valid. Returns "null"
   * if no form control is set up.
   *
   * 此表单控件是否有效。如果未设置表单控件，则返回 “null”。
   *
   */
  async isControlValid(): Promise<boolean | null> {
    if (!(await this._hasFormControl())) {
      return null;
    }
    return (await this.host()).hasClass('ng-valid');
  }

  /**
   * Whether the form control is pending validation. Returns "null"
   * if no form control is set up.
   *
   * 此表单控件是否正在等待验证。如果未设置过表单控件，则返回 “null”。
   *
   */
  async isControlPending(): Promise<boolean | null> {
    if (!(await this._hasFormControl())) {
      return null;
    }
    return (await this.host()).hasClass('ng-pending');
  }

  /**
   * Checks whether the form-field control has set up a form control.
   *
   * 检查此表单字段控件是否已设置表单控件。
   *
   */
  private async _hasFormControl(): Promise<boolean> {
    const hostEl = await this.host();
    // If no form "NgControl" is bound to the form-field control, the form-field
    // is not able to forward any control status classes. Therefore if either the
    // "ng-touched" or "ng-untouched" class is set, we know that it has a form control
    const [isTouched, isUntouched] = await parallel(() => [
      hostEl.hasClass('ng-touched'),
      hostEl.hasClass('ng-untouched'),
    ]);
    return isTouched || isUntouched;
  }
}

// TODO(devversion): support support chip list harness
/** Possible harnesses of controls which can be bound to a form-field. */
export type FormFieldControlHarness =
  | MatInputHarness
  | MatSelectHarness
  | MatDatepickerInputHarness
  | MatDateRangeInputHarness;

/**
 * Harness for interacting with a MDC-based form-field's in tests.
 *
 * 在测试中与标准 Material 表单字段进行交互的测试工具。
 *
 */
export class MatFormFieldHarness extends _MatFormFieldHarnessBase<
  FormFieldControlHarness,
  typeof MatErrorHarness
> {
  static hostSelector = '.mat-mdc-form-field';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a form field with specific
   * attributes.
   *
   * 获取一个 `HarnessPredicate`，该 HarnessPredicate 可用于搜索满足某些条件的 `MatFormFieldHarness`。
   *
   * @param options Options for filtering which form field instances are considered a match.
   *
   * 用于过滤哪些表单字段实例应该视为匹配项的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 使用给定选项配置过的 `HarnessPredicate`
   *
   */
  static with<T extends MatFormFieldHarness>(
    this: ComponentHarnessConstructor<T>,
    options: FormFieldHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options)
      .addOption('floatingLabelText', options.floatingLabelText, async (harness, text) =>
        HarnessPredicate.stringMatches(await harness.getLabel(), text),
      )
      .addOption(
        'hasErrors',
        options.hasErrors,
        async (harness, hasErrors) => (await harness.hasErrors()) === hasErrors,
      )
      .addOption(
        'isValid',
        options.isValid,
        async (harness, isValid) => (await harness.isControlValid()) === isValid,
      );
  }

  protected _prefixContainer = this.locatorForOptional('.mat-mdc-form-field-text-prefix');
  protected _suffixContainer = this.locatorForOptional('.mat-mdc-form-field-text-suffix');
  protected _label = this.locatorForOptional('.mdc-floating-label');
  protected _hints = this.locatorForAll('.mat-mdc-form-field-hint');
  protected _inputControl = this.locatorForOptional(MatInputHarness);
  protected _selectControl = this.locatorForOptional(MatSelectHarness);
  protected _datepickerInputControl = this.locatorForOptional(MatDatepickerInputHarness);
  protected _dateRangeInputControl = this.locatorForOptional(MatDateRangeInputHarness);
  protected _errorHarness = MatErrorHarness;
  private _mdcTextField = this.locatorFor('.mat-mdc-text-field-wrapper');

  /**
   * Gets the appearance of the form-field.
   *
   * 获取此表单字段的外观。
   *
   */
  async getAppearance(): Promise<'fill' | 'outline'> {
    const textFieldEl = await this._mdcTextField();
    if (await textFieldEl.hasClass('mdc-text-field--outlined')) {
      return 'outline';
    }
    return 'fill';
  }

  /**
   * Whether the form-field has a label.
   *
   * 此表单字段是否具有标签。
   *
   */
  async hasLabel(): Promise<boolean> {
    return (await this._label()) !== null;
  }

  /**
   * Whether the label is currently floating.
   *
   * 此标签当前是否浮动的。
   *
   */
  async isLabelFloating(): Promise<boolean> {
    const labelEl = await this._label();
    return labelEl !== null ? await labelEl.hasClass('mdc-floating-label--float-above') : false;
  }
}
