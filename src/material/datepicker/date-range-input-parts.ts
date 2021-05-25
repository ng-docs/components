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
  InjectionToken,
  Inject,
  OnInit,
  Injector,
  InjectFlags,
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
  CanUpdateErrorStateCtor,
  mixinErrorState,
  MAT_DATE_FORMATS,
  DateAdapter,
  MatDateFormats,
  ErrorStateMatcher,
} from '@angular/material/core';
import {BooleanInput} from '@angular/cdk/coercion';
import {BACKSPACE} from '@angular/cdk/keycodes';
import {MatDatepickerInputBase, DateFilterFn} from './datepicker-input-base';
import {DateRange, DateSelectionModelChange} from './date-selection-model';

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
export const MAT_DATE_RANGE_INPUT_PARENT =
    new InjectionToken<MatDateRangeInputParent<unknown>>('MAT_DATE_RANGE_INPUT_PARENT');

/**
 * Base class for the individual inputs that can be projected inside a `mat-date-range-input`.
 *
 * 各种输入框的基类，可以投影到 `mat-date-range-input` 内部。
 *
 */
@Directive()
abstract class MatDateRangeInputPartBase<D>
  extends MatDatepickerInputBase<DateRange<D>> implements OnInit, DoCheck {

  /** @docs-private */
  ngControl: NgControl;

  /** @docs-private */
  abstract updateErrorState(): void;

  protected abstract _validator: ValidatorFn | null;
  protected abstract _assignValueToModel(value: D | null): void;
  protected abstract _getValueFromModel(modelValue: DateRange<D>): D | null;

  constructor(
    @Inject(MAT_DATE_RANGE_INPUT_PARENT) public _rangeInput: MatDateRangeInputParent<D>,
    elementRef: ElementRef<HTMLInputElement>,
    public _defaultErrorStateMatcher: ErrorStateMatcher,
    private _injector: Injector,
    @Optional() public _parentForm: NgForm,
    @Optional() public _parentFormGroup: FormGroupDirective,
    @Optional() dateAdapter: DateAdapter<D>,
    @Optional() @Inject(MAT_DATE_FORMATS) dateFormats: MatDateFormats) {
    super(elementRef, dateAdapter, dateFormats);
  }

  ngOnInit() {
    // We need the date input to provide itself as a `ControlValueAccessor` and a `Validator`, while
    // injecting its `NgControl` so that the error state is handled correctly. This introduces a
    // circular dependency, because both `ControlValueAccessor` and `Validator` depend on the input
    // itself. Usually we can work around it for the CVA, but there's no API to do it for the
    // validator. We work around it here by injecting the `NgControl` in `ngOnInit`, after
    // everything has been resolved.
    // tslint:disable-next-line:no-bitwise
    const ngControl = this._injector.get(NgControl, null, InjectFlags.Self | InjectFlags.Optional);

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
   * Handles `input` events on the input element.
   *
   * 处理 `input` 输入框元素上的事件。
   *
   */
  _onInput(value: string) {
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

  protected _parentDisabled() {
    return this._rangeInput._groupDisabled;
  }

  protected _shouldHandleChangeEvent({source}: DateSelectionModelChange<DateRange<D>>): boolean {
    return source !== this._rangeInput._startInput && source !== this._rangeInput._endInput;
  }

  protected _assignValueProgrammatically(value: D | null) {
    super._assignValueProgrammatically(value);
    const opposite = (this === this._rangeInput._startInput ? this._rangeInput._endInput :
        this._rangeInput._startInput) as MatDateRangeInputPartBase<D> | undefined;
    opposite?._validatorOnChange();
  }
}

const _MatDateRangeInputBase:
    CanUpdateErrorStateCtor & typeof MatDateRangeInputPartBase =
    // Needs to be `as any`, because the base class is abstract.
    mixinErrorState(MatDateRangeInputPartBase as any);

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
    '[attr.id]': '_rangeInput.id',
    '[attr.aria-haspopup]': '_rangeInput.rangePicker ? "dialog" : null',
    '[attr.aria-owns]': '(_rangeInput.rangePicker?.opened && _rangeInput.rangePicker.id) || null',
    '[attr.min]': '_getMinDate() ? _dateAdapter.toIso8601(_getMinDate()) : null',
    '[attr.max]': '_getMaxDate() ? _dateAdapter.toIso8601(_getMaxDate()) : null',
    '(blur)': '_onBlur()',
    'type': 'text',
  },
  providers: [
    {provide: NG_VALUE_ACCESSOR, useExisting: MatStartDate, multi: true},
    {provide: NG_VALIDATORS, useExisting: MatStartDate, multi: true}
  ],
  // These need to be specified explicitly, because some tooling doesn't
  // seem to pick them up from the base class. See #20932.
  outputs: ['dateChange', 'dateInput'],
  inputs: ['errorStateMatcher']
})
export class MatStartDate<D> extends _MatDateRangeInputBase<D> implements
    CanUpdateErrorState, DoCheck, OnInit {
  /**
   * Validator that checks that the start date isn't after the end date.
   *
   * 此验证器用于检查起始日期是否在结束日期之后。
   *
   */
  private _startValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const start = this._dateAdapter.getValidDateOrNull(
      this._dateAdapter.deserialize(control.value));
    const end = this._model ? this._model.selection.end : null;
    return (!start || !end ||
        this._dateAdapter.compareDate(start, end) <= 0) ?
        null : {'matStartDateInvalid': {'end': end, 'actual': start}};
  }

  constructor(
    @Inject(MAT_DATE_RANGE_INPUT_PARENT) rangeInput: MatDateRangeInputParent<D>,
    elementRef: ElementRef<HTMLInputElement>,
    defaultErrorStateMatcher: ErrorStateMatcher,
    injector: Injector,
    @Optional() parentForm: NgForm,
    @Optional() parentFormGroup: FormGroupDirective,
    @Optional() dateAdapter: DateAdapter<D>,
    @Optional() @Inject(MAT_DATE_FORMATS) dateFormats: MatDateFormats) {

    // TODO(crisbeto): this constructor shouldn't be necessary, but ViewEngine doesn't seem to
    // handle DI correctly when it is inherited from `MatDateRangeInputPartBase`. We can drop this
    // constructor once ViewEngine is removed.
    super(rangeInput, elementRef, defaultErrorStateMatcher, injector, parentForm, parentFormGroup,
        dateAdapter, dateFormats);
  }

  ngOnInit() {
    // Normally this happens automatically, but it seems to break if not added explicitly when all
    // of the criteria below are met:
    // 1) The class extends a TS mixin.
    // 2) The application is running in ViewEngine.
    // 3) The application is being transpiled through tsickle.
    // This can be removed once google3 is completely migrated to Ivy.
    super.ngOnInit();
  }

  ngDoCheck() {
    // Normally this happens automatically, but it seems to break if not added explicitly when all
    // of the criteria below are met:
    // 1) The class extends a TS mixin.
    // 2) The application is running in ViewEngine.
    // 3) The application is being transpiled through tsickle.
    // This can be removed once google3 is completely migrated to Ivy.
    super.ngDoCheck();
  }

  protected _validator = Validators.compose([...super._getValidators(), this._startValidator]);

  protected _getValueFromModel(modelValue: DateRange<D>) {
    return modelValue.start;
  }

  protected _shouldHandleChangeEvent(change: DateSelectionModelChange<DateRange<D>>): boolean {
    if (!super._shouldHandleChangeEvent(change)) {
      return false;
    } else {
      return !change.oldValue?.start ? !!change.selection.start :
        !change.selection.start ||
        !!this._dateAdapter.compareDate(change.oldValue.start, change.selection.start);
    }
  }

  protected _assignValueToModel(value: D | null) {
    if (this._model) {
      const range = new DateRange(value, this._model.selection.end);
      this._model.updateSelection(range, this);
    }
  }

  protected _formatValue(value: D | null) {
    super._formatValue(value);

    // Any time the input value is reformatted we need to tell the parent.
    this._rangeInput._handleChildValueChange();
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

  static ngAcceptInputType_disabled: BooleanInput;
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
    {provide: NG_VALIDATORS, useExisting: MatEndDate, multi: true}
  ],
  // These need to be specified explicitly, because some tooling doesn't
  // seem to pick them up from the base class. See #20932.
  outputs: ['dateChange', 'dateInput'],
  inputs: ['errorStateMatcher']
})
export class MatEndDate<D> extends _MatDateRangeInputBase<D> implements
    CanUpdateErrorState, DoCheck, OnInit {
  /**
   * Validator that checks that the end date isn't before the start date.
   *
   * 此验证器用于检查结束日期是否在起始日期之前。
   *
   */
  private _endValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const end = this._dateAdapter.getValidDateOrNull(this._dateAdapter.deserialize(control.value));
    const start = this._model ? this._model.selection.start : null;
    return (!end || !start ||
        this._dateAdapter.compareDate(end, start) >= 0) ?
        null : {'matEndDateInvalid': {'start': start, 'actual': end}};
  }

  constructor(
    @Inject(MAT_DATE_RANGE_INPUT_PARENT) rangeInput: MatDateRangeInputParent<D>,
    elementRef: ElementRef<HTMLInputElement>,
    defaultErrorStateMatcher: ErrorStateMatcher,
    injector: Injector,
    @Optional() parentForm: NgForm,
    @Optional() parentFormGroup: FormGroupDirective,
    @Optional() dateAdapter: DateAdapter<D>,
    @Optional() @Inject(MAT_DATE_FORMATS) dateFormats: MatDateFormats) {

    // TODO(crisbeto): this constructor shouldn't be necessary, but ViewEngine doesn't seem to
    // handle DI correctly when it is inherited from `MatDateRangeInputPartBase`. We can drop this
    // constructor once ViewEngine is removed.
    super(rangeInput, elementRef, defaultErrorStateMatcher, injector, parentForm, parentFormGroup,
        dateAdapter, dateFormats);
  }

  ngOnInit() {
    // Normally this happens automatically, but it seems to break if not added explicitly when all
    // of the criteria below are met:
    // 1) The class extends a TS mixin.
    // 2) The application is running in ViewEngine.
    // 3) The application is being transpiled through tsickle.
    // This can be removed once google3 is completely migrated to Ivy.
    super.ngOnInit();
  }

  ngDoCheck() {
    // Normally this happens automatically, but it seems to break if not added explicitly when all
    // of the criteria below are met:
    // 1) The class extends a TS mixin.
    // 2) The application is running in ViewEngine.
    // 3) The application is being transpiled through tsickle.
    // This can be removed once google3 is completely migrated to Ivy.
    super.ngDoCheck();
  }

  protected _validator = Validators.compose([...super._getValidators(), this._endValidator]);

  protected _getValueFromModel(modelValue: DateRange<D>) {
    return modelValue.end;
  }

  protected _shouldHandleChangeEvent(change: DateSelectionModelChange<DateRange<D>>): boolean {
    if (!super._shouldHandleChangeEvent(change)) {
      return false;
    } else {
      return !change.oldValue?.end ? !!change.selection.end :
        !change.selection.end ||
        !!this._dateAdapter.compareDate(change.oldValue.end, change.selection.end);
    }
  }

  protected _assignValueToModel(value: D | null) {
    if (this._model) {
      const range = new DateRange(this._model.selection.start, value);
      this._model.updateSelection(range, this);
    }
  }

  _onKeydown(event: KeyboardEvent) {
    // If the user is pressing backspace on an empty end input, move focus back to the start.
    if (event.keyCode === BACKSPACE && !this._elementRef.nativeElement.value) {
      this._rangeInput._startInput.focus();
    }

    super._onKeydown(event);
  }

  static ngAcceptInputType_disabled: BooleanInput;
}
