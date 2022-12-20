/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Directive, ElementRef, forwardRef, Inject, Input, OnDestroy, Optional} from '@angular/core';
import {NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidatorFn, Validators} from '@angular/forms';
import {DateAdapter, MAT_DATE_FORMATS, MatDateFormats, ThemePalette} from '@angular/material/core';
import {MAT_FORM_FIELD} from '@angular/material/form-field';
import {MAT_INPUT_VALUE_ACCESSOR} from '@angular/material/input';
import {Subscription} from 'rxjs';
import {MatDatepickerInputBase, DateFilterFn, _MatFormFieldPartial} from './datepicker-input-base';
import {MatDatepickerControl, MatDatepickerPanel} from './datepicker-base';
import {DateSelectionModelChange} from './date-selection-model';

/** @docs-private */
export const MAT_DATEPICKER_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => MatDatepickerInput),
  multi: true,
};

/** @docs-private */
export const MAT_DATEPICKER_VALIDATORS: any = {
  provide: NG_VALIDATORS,
  useExisting: forwardRef(() => MatDatepickerInput),
  multi: true,
};

/**
 * Directive used to connect an input to a MatDatepicker.
 *
 * 用于把输入框连接到 MatDatepicker 的指令。
 *
 */
@Directive({
  selector: 'input[matDatepicker]',
  providers: [
    MAT_DATEPICKER_VALUE_ACCESSOR,
    MAT_DATEPICKER_VALIDATORS,
    {provide: MAT_INPUT_VALUE_ACCESSOR, useExisting: MatDatepickerInput},
  ],
  host: {
    'class': 'mat-datepicker-input',
    '[attr.aria-haspopup]': '_datepicker ? "dialog" : null',
    '[attr.aria-owns]': '(_datepicker?.opened && _datepicker.id) || null',
    '[attr.min]': 'min ? _dateAdapter.toIso8601(min) : null',
    '[attr.max]': 'max ? _dateAdapter.toIso8601(max) : null',
    // Used by the test harness to tie this input to its calendar. We can't depend on
    // `aria-owns` for this, because it's only defined while the calendar is open.
    '[attr.data-mat-calendar]': '_datepicker ? _datepicker.id : null',
    '[disabled]': 'disabled',
    '(input)': '_onInput($event.target.value)',
    '(change)': '_onChange()',
    '(blur)': '_onBlur()',
    '(keydown)': '_onKeydown($event)',
  },
  exportAs: 'matDatepickerInput',
})
export class MatDatepickerInput<D>
  extends MatDatepickerInputBase<D | null, D>
  implements MatDatepickerControl<D | null>, OnDestroy
{
  private _closedSubscription = Subscription.EMPTY;

  /**
   * The datepicker that this input is associated with.
   *
   * 与此输入框关联的日期选择器。
   *
   */
  @Input()
  set matDatepicker(datepicker: MatDatepickerPanel<MatDatepickerControl<D>, D | null, D>) {
    if (datepicker) {
      this._datepicker = datepicker;
      this._closedSubscription = datepicker.closedStream.subscribe(() => this._onTouched());
      this._registerModel(datepicker.registerInput(this));
    }
  }
  _datepicker: MatDatepickerPanel<MatDatepickerControl<D>, D | null, D>;

  /**
   * The minimum valid date.
   *
   * 最小有效日期。
   *
   */
  @Input()
  get min(): D | null {
    return this._min;
  }
  set min(value: D | null) {
    const validValue = this._dateAdapter.getValidDateOrNull(this._dateAdapter.deserialize(value));

    if (!this._dateAdapter.sameDate(validValue, this._min)) {
      this._min = validValue;
      this._validatorOnChange();
    }
  }
  private _min: D | null;

  /**
   * The maximum valid date.
   *
   * 最大有效日期。
   *
   */
  @Input()
  get max(): D | null {
    return this._max;
  }
  set max(value: D | null) {
    const validValue = this._dateAdapter.getValidDateOrNull(this._dateAdapter.deserialize(value));

    if (!this._dateAdapter.sameDate(validValue, this._max)) {
      this._max = validValue;
      this._validatorOnChange();
    }
  }
  private _max: D | null;

  /**
   * Function that can be used to filter out dates within the datepicker.
   *
   * 可以用来过滤掉日期选择器中日期的函数。
   *
   */
  @Input('matDatepickerFilter')
  get dateFilter() {
    return this._dateFilter;
  }
  set dateFilter(value: DateFilterFn<D | null>) {
    const wasMatchingValue = this._matchesFilter(this.value);
    this._dateFilter = value;

    if (this._matchesFilter(this.value) !== wasMatchingValue) {
      this._validatorOnChange();
    }
  }
  private _dateFilter: DateFilterFn<D | null>;

  /**
   * The combined form control validator for this input.
   *
   * 该输入框的表单控件组合验证器。
   *
   */
  protected _validator: ValidatorFn | null;

  constructor(
    elementRef: ElementRef<HTMLInputElement>,
    @Optional() dateAdapter: DateAdapter<D>,
    @Optional() @Inject(MAT_DATE_FORMATS) dateFormats: MatDateFormats,
    @Optional() @Inject(MAT_FORM_FIELD) private _formField?: _MatFormFieldPartial,
  ) {
    super(elementRef, dateAdapter, dateFormats);
    this._validator = Validators.compose(super._getValidators());
  }

  /**
   * Gets the element that the datepicker popup should be connected to.
   *
   * 获取日期选择器弹出框应该连接到的元素。
   *
   * @return The element to connect the popup to.
   *
   * 要把弹出框连接到的元素。
   */
  getConnectedOverlayOrigin(): ElementRef {
    return this._formField ? this._formField.getConnectedOverlayOrigin() : this._elementRef;
  }

  /**
   * Gets the ID of an element that should be used a description for the calendar overlay.
   *
   * 获取元素的 ID，该元素的 ID 用作日历浮层的描述。
   *
   */
  getOverlayLabelId(): string | null {
    if (this._formField) {
      return this._formField.getLabelId();
    }

    return this._elementRef.nativeElement.getAttribute('aria-labelledby');
  }

  /**
   * Returns the palette used by the input's form field, if any.
   *
   * 返回输入框表单字段中使用的调色板（如果有）。
   *
   */
  getThemePalette(): ThemePalette {
    return this._formField ? this._formField.color : undefined;
  }

  /**
   * Gets the value at which the calendar should start.
   *
   * 获取日历的起始日期。
   *
   */
  getStartValue(): D | null {
    return this.value;
  }

  override ngOnDestroy() {
    super.ngOnDestroy();
    this._closedSubscription.unsubscribe();
  }

  /**
   * Opens the associated datepicker.
   *
   * 打开相关的 datepicker。
   *
   */
  protected _openPopup(): void {
    if (this._datepicker) {
      this._datepicker.open();
    }
  }

  protected _getValueFromModel(modelValue: D | null): D | null {
    return modelValue;
  }

  protected _assignValueToModel(value: D | null): void {
    if (this._model) {
      this._model.updateSelection(value, this);
    }
  }

  /**
   * Gets the input's minimum date.
   *
   * 获取输入框的最小日期。
   *
   */
  _getMinDate() {
    return this._min;
  }

  /**
   * Gets the input's maximum date.
   *
   * 获取输入框的最大日期。
   *
   */
  _getMaxDate() {
    return this._max;
  }

  /**
   * Gets the input's date filtering function.
   *
   * 获取输入框的日期过滤函数。
   *
   */
  protected _getDateFilter() {
    return this._dateFilter;
  }

  protected _shouldHandleChangeEvent(event: DateSelectionModelChange<D>) {
    return event.source !== this;
  }
}
