/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  Directive,
  ElementRef,
  Optional,
  inject,
  InjectionToken,
  Inject,
  OnInit,
  Injector,
  DoCheck,
} from '@angular/core';
import {
  NG_VALUE_ACCESSOR,
  NG_VALIDATORS,
  NgForm,
  FormGroupDirective,
  NgControl,
  ValidatorFn,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import {
  CanUpdateErrorState,
  mixinErrorState,
  MAT_DATE_FORMATS,
  DateAdapter,
  MatDateFormats,
  ErrorStateMatcher,
} from '@angular/material/core';
import {Directionality} from '@angular/cdk/bidi';
import {BACKSPACE, LEFT_ARROW, RIGHT_ARROW} from '@angular/cdk/keycodes';
import {MatDatepickerInputBase, DateFilterFn} from './datepicker-input-base';
import {DateRange, DateSelectionModelChange} from './date-selection-model';
import {_computeAriaAccessibleName} from './aria-accessible-name';

/**
 * Parent component that should be wrapped around `MatStartDate` and `MatEndDate`.
 *
 * 用来包裹 `MatStartDate` 和 `MatEndDate` 的父组件。
 *
 */
export interface MatDateRangeInputParent<D> {
  id: string;
  min: D | null;
  max: D | null;
  dateFilter: DateFilterFn<D>;
  rangePicker: {
    opened: boolean;
    id: string;
  };
  _startInput: MatDateRangeInputPartBase<D>;
  _endInput: MatDateRangeInputPartBase<D>;
  _groupDisabled: boolean;
  _handleChildValueChange(): void;
  _openDatepicker(): void;
}

/**
 * Used to provide the date range input wrapper component
 * to the parts without circular dependencies.
 *
 * 用来为那些没有循环依赖的部件提供日期范围输入框包装的组件。
 *
 */
export const MAT_DATE_RANGE_INPUT_PARENT = new InjectionToken<MatDateRangeInputParent<unknown>>(
  'MAT_DATE_RANGE_INPUT_PARENT',
);

/**
 * Base class for the individual inputs that can be projected inside a `mat-date-range-input`.
 *
 * 各种输入框的基类，可以投影到 `mat-date-range-input` 内部。
 *
 */
@Directive()
abstract class MatDateRangeInputPartBase<D>
  extends MatDatepickerInputBase<DateRange<D>>
  implements OnInit, DoCheck
{
  /**
   * Form control bound to this input part.
   *
   * 绑定到此输入部分的表单控件。
   *
   * @docs-private
   */
  ngControl: NgControl;

  /** @docs-private */
  abstract updateErrorState(): void;

  protected abstract override _validator: ValidatorFn | null;
  protected abstract override _assignValueToModel(value: D | null): void;
  protected abstract override _getValueFromModel(modelValue: DateRange<D>): D | null;

  protected readonly _dir = inject(Directionality, {optional: true});

  constructor(
    @Inject(MAT_DATE_RANGE_INPUT_PARENT) public _rangeInput: MatDateRangeInputParent<D>,
    public override _elementRef: ElementRef<HTMLInputElement>,
    public _defaultErrorStateMatcher: ErrorStateMatcher,
    private _injector: Injector,
    @Optional() public _parentForm: NgForm,
    @Optional() public _parentFormGroup: FormGroupDirective,
    @Optional() dateAdapter: DateAdapter<D>,
    @Optional() @Inject(MAT_DATE_FORMATS) dateFormats: MatDateFormats,
  ) {
    super(_elementRef, dateAdapter, dateFormats);
  }

  ngOnInit() {
    // We need the date input to provide itself as a `ControlValueAccessor` and a `Validator`, while
    // injecting its `NgControl` so that the error state is handled correctly. This introduces a
    // circular dependency, because both `ControlValueAccessor` and `Validator` depend on the input
    // itself. Usually we can work around it for the CVA, but there's no API to do it for the
    // validator. We work around it here by injecting the `NgControl` in `ngOnInit`, after
    // everything has been resolved.
    // tslint:disable-next-line:no-bitwise
    const ngControl = this._injector.get(NgControl, null, {optional: true, self: true});

    if (ngControl) {
      this.ngControl = ngControl;
    }
  }

  ngDoCheck() {
    if (this.ngControl) {
      // We need to re-evaluate this on every change detection cycle, because there are some
      // error triggers that we can't subscribe to (e.g. parent form submissions). This means
      // that whatever logic is in here has to be super lean or we risk destroying the performance.
      this.updateErrorState();
    }
  }

  /**
   * Gets whether the input is empty.
   *
   * 获取输入框的结果是否为空。
   *
   */
  isEmpty(): boolean {
    return this._elementRef.nativeElement.value.length === 0;
  }

  /**
   * Gets the placeholder of the input.
   *
   * 获取输入框的占位符。
   *
   */
  _getPlaceholder() {
    return this._elementRef.nativeElement.placeholder;
  }

  /**
   * Focuses the input.
   *
   * 让输入框获得焦点。
   *
   */
  focus(): void {
    this._elementRef.nativeElement.focus();
  }

  /**
   * Gets the value that should be used when mirroring the input's size.
   *
   * 获取镜像输入框大小时应该使用的值。
   *
   */
  getMirrorValue(): string {
    const element = this._elementRef.nativeElement;
    const value = element.value;
    return value.length > 0 ? value : element.placeholder;
  }

  /**
   * Handles `input` events on the input element.
   *
   * 处理 `input` 输入框元素上的事件。
   *
   */
  override _onInput(value: string) {
    super._onInput(value);
    this._rangeInput._handleChildValueChange();
  }

  /**
   * Opens the datepicker associated with the input.
   *
   * 打开与输入框关联的 datepicker。
   *
   */
  protected _openPopup(): void {
    this._rangeInput._openDatepicker();
  }

  /**
   * Gets the minimum date from the range input.
   *
   * 获取范围输入框的最小日期。
   *
   */
  _getMinDate() {
    return this._rangeInput.min;
  }

  /**
   * Gets the maximum date from the range input.
   *
   * 获取范围输入框的最大日期。
   *
   */
  _getMaxDate() {
    return this._rangeInput.max;
  }

  /**
   * Gets the date filter function from the range input.
   *
   * 获取范围输入框的日期过滤器函数。
   *
   */
  protected _getDateFilter() {
    return this._rangeInput.dateFilter;
  }

  protected override _parentDisabled() {
    return this._rangeInput._groupDisabled;
  }

  protected _shouldHandleChangeEvent({source}: DateSelectionModelChange<DateRange<D>>): boolean {
    return source !== this._rangeInput._startInput && source !== this._rangeInput._endInput;
  }

  protected override _assignValueProgrammatically(value: D | null) {
    super._assignValueProgrammatically(value);
    const opposite = (
      this === this._rangeInput._startInput
        ? this._rangeInput._endInput
        : this._rangeInput._startInput
    ) as MatDateRangeInputPartBase<D> | undefined;
    opposite?._validatorOnChange();
  }

  /**
   * return the ARIA accessible name of the input element
   *
   * 返回此输入元素的 ARIA 无障碍名称
   *
   */
  _getAccessibleName(): string {
    return _computeAriaAccessibleName(this._elementRef.nativeElement);
  }
}

const _MatDateRangeInputBase = mixinErrorState(MatDateRangeInputPartBase);

/**
 * Input for entering the start date in a `mat-date-range-input`.
 *
 * 用于在 `mat-date-range-input` 中输入起始日期的输入框。
 *
 */
@Directive({
  selector: 'input[matStartDate]',
  host: {
    'class': 'mat-start-date mat-date-range-input-inner',
    '[disabled]': 'disabled',
    '(input)': '_onInput($event.target.value)',
    '(change)': '_onChange()',
    '(keydown)': '_onKeydown($event)',
    '[attr.aria-haspopup]': '_rangeInput.rangePicker ? "dialog" : null',
    '[attr.aria-owns]': '(_rangeInput.rangePicker?.opened && _rangeInput.rangePicker.id) || null',
    '[attr.min]': '_getMinDate() ? _dateAdapter.toIso8601(_getMinDate()) : null',
    '[attr.max]': '_getMaxDate() ? _dateAdapter.toIso8601(_getMaxDate()) : null',
    '(blur)': '_onBlur()',
    'type': 'text',
  },
  providers: [
    {provide: NG_VALUE_ACCESSOR, useExisting: MatStartDate, multi: true},
    {provide: NG_VALIDATORS, useExisting: MatStartDate, multi: true},
  ],
  // These need to be specified explicitly, because some tooling doesn't
  // seem to pick them up from the base class. See #20932.
  outputs: ['dateChange', 'dateInput'],
  inputs: ['errorStateMatcher'],
})
export class MatStartDate<D> extends _MatDateRangeInputBase<D> implements CanUpdateErrorState {
  /**
   * Validator that checks that the start date isn't after the end date.
   *
   * 此验证器用于检查起始日期是否在结束日期之后。
   *
   */
  private _startValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const start = this._dateAdapter.getValidDateOrNull(
      this._dateAdapter.deserialize(control.value),
    );
    const end = this._model ? this._model.selection.end : null;
    return !start || !end || this._dateAdapter.compareDate(start, end) <= 0
      ? null
      : {'matStartDateInvalid': {'end': end, 'actual': start}};
  };

  constructor(
    @Inject(MAT_DATE_RANGE_INPUT_PARENT) rangeInput: MatDateRangeInputParent<D>,
    elementRef: ElementRef<HTMLInputElement>,
    defaultErrorStateMatcher: ErrorStateMatcher,
    injector: Injector,
    @Optional() parentForm: NgForm,
    @Optional() parentFormGroup: FormGroupDirective,
    @Optional() dateAdapter: DateAdapter<D>,
    @Optional() @Inject(MAT_DATE_FORMATS) dateFormats: MatDateFormats,
  ) {
    super(
      rangeInput,
      elementRef,
      defaultErrorStateMatcher,
      injector,
      parentForm,
      parentFormGroup,
      dateAdapter,
      dateFormats,
    );
  }

  protected _validator = Validators.compose([...super._getValidators(), this._startValidator]);

  protected _getValueFromModel(modelValue: DateRange<D>) {
    return modelValue.start;
  }

  protected override _shouldHandleChangeEvent(
    change: DateSelectionModelChange<DateRange<D>>,
  ): boolean {
    if (!super._shouldHandleChangeEvent(change)) {
      return false;
    } else {
      return !change.oldValue?.start
        ? !!change.selection.start
        : !change.selection.start ||
            !!this._dateAdapter.compareDate(change.oldValue.start, change.selection.start);
    }
  }

  protected _assignValueToModel(value: D | null) {
    if (this._model) {
      const range = new DateRange(value, this._model.selection.end);
      this._model.updateSelection(range, this);
    }
  }

  protected override _formatValue(value: D | null) {
    super._formatValue(value);

    // Any time the input value is reformatted we need to tell the parent.
    this._rangeInput._handleChildValueChange();
  }

  override _onKeydown(event: KeyboardEvent) {
    const endInput = this._rangeInput._endInput;
    const element = this._elementRef.nativeElement;
    const isLtr = this._dir?.value !== 'rtl';

    // If the user hits RIGHT (LTR) when at the end of the input (and no
    // selection), move the cursor to the start of the end input.
    if (
      ((event.keyCode === RIGHT_ARROW && isLtr) || (event.keyCode === LEFT_ARROW && !isLtr)) &&
      element.selectionStart === element.value.length &&
      element.selectionEnd === element.value.length
    ) {
      event.preventDefault();
      endInput._elementRef.nativeElement.setSelectionRange(0, 0);
      endInput.focus();
    } else {
      super._onKeydown(event);
    }
  }
}
/**
 * Input for entering the end date in a `mat-date-range-input`.
 *
 * 用于在 `mat-date-range-input` 中输入结束日期的输入框。
 *
 */
@Directive({
  selector: 'input[matEndDate]',
  host: {
    'class': 'mat-end-date mat-date-range-input-inner',
    '[disabled]': 'disabled',
    '(input)': '_onInput($event.target.value)',
    '(change)': '_onChange()',
    '(keydown)': '_onKeydown($event)',
    '[attr.aria-haspopup]': '_rangeInput.rangePicker ? "dialog" : null',
    '[attr.aria-owns]': '(_rangeInput.rangePicker?.opened && _rangeInput.rangePicker.id) || null',
    '[attr.min]': '_getMinDate() ? _dateAdapter.toIso8601(_getMinDate()) : null',
    '[attr.max]': '_getMaxDate() ? _dateAdapter.toIso8601(_getMaxDate()) : null',
    '(blur)': '_onBlur()',
    'type': 'text',
  },
  providers: [
    {provide: NG_VALUE_ACCESSOR, useExisting: MatEndDate, multi: true},
    {provide: NG_VALIDATORS, useExisting: MatEndDate, multi: true},
  ],
  // These need to be specified explicitly, because some tooling doesn't
  // seem to pick them up from the base class. See #20932.
  outputs: ['dateChange', 'dateInput'],
  inputs: ['errorStateMatcher'],
})
export class MatEndDate<D> extends _MatDateRangeInputBase<D> implements CanUpdateErrorState {
  /**
   * Validator that checks that the end date isn't before the start date.
   *
   * 此验证器用于检查结束日期是否在起始日期之前。
   *
   */
  private _endValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const end = this._dateAdapter.getValidDateOrNull(this._dateAdapter.deserialize(control.value));
    const start = this._model ? this._model.selection.start : null;
    return !end || !start || this._dateAdapter.compareDate(end, start) >= 0
      ? null
      : {'matEndDateInvalid': {'start': start, 'actual': end}};
  };

  constructor(
    @Inject(MAT_DATE_RANGE_INPUT_PARENT) rangeInput: MatDateRangeInputParent<D>,
    elementRef: ElementRef<HTMLInputElement>,
    defaultErrorStateMatcher: ErrorStateMatcher,
    injector: Injector,
    @Optional() parentForm: NgForm,
    @Optional() parentFormGroup: FormGroupDirective,
    @Optional() dateAdapter: DateAdapter<D>,
    @Optional() @Inject(MAT_DATE_FORMATS) dateFormats: MatDateFormats,
  ) {
    super(
      rangeInput,
      elementRef,
      defaultErrorStateMatcher,
      injector,
      parentForm,
      parentFormGroup,
      dateAdapter,
      dateFormats,
    );
  }

  protected _validator = Validators.compose([...super._getValidators(), this._endValidator]);

  protected _getValueFromModel(modelValue: DateRange<D>) {
    return modelValue.end;
  }

  protected override _shouldHandleChangeEvent(
    change: DateSelectionModelChange<DateRange<D>>,
  ): boolean {
    if (!super._shouldHandleChangeEvent(change)) {
      return false;
    } else {
      return !change.oldValue?.end
        ? !!change.selection.end
        : !change.selection.end ||
            !!this._dateAdapter.compareDate(change.oldValue.end, change.selection.end);
    }
  }

  protected _assignValueToModel(value: D | null) {
    if (this._model) {
      const range = new DateRange(this._model.selection.start, value);
      this._model.updateSelection(range, this);
    }
  }

  override _onKeydown(event: KeyboardEvent) {
    const startInput = this._rangeInput._startInput;
    const element = this._elementRef.nativeElement;
    const isLtr = this._dir?.value !== 'rtl';

    // If the user is pressing backspace on an empty end input, move focus back to the start.
    if (event.keyCode === BACKSPACE && !element.value) {
      startInput.focus();
    }
    // If the user hits LEFT (LTR) when at the start of the input (and no
    // selection), move the cursor to the end of the start input.
    else if (
      ((event.keyCode === LEFT_ARROW && isLtr) || (event.keyCode === RIGHT_ARROW && !isLtr)) &&
      element.selectionStart === 0 &&
      element.selectionEnd === 0
    ) {
      event.preventDefault();
      const endPosition = startInput._elementRef.nativeElement.value.length;
      startInput._elementRef.nativeElement.setSelectionRange(endPosition, endPosition);
      startInput.focus();
    } else {
      super._onKeydown(event);
    }
  }
}
