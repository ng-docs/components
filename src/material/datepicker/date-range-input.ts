/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  Component,
  ChangeDetectionStrategy,
  ViewEncapsulation,
  Input,
  Optional,
  OnDestroy,
  ContentChild,
  AfterContentInit,
  ChangeDetectorRef,
  Self,
  ElementRef,
  Inject,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import {MatFormFieldControl, MAT_FORM_FIELD} from '@angular/material/form-field';
import {ThemePalette, DateAdapter} from '@angular/material/core';
import {NgControl, ControlContainer, Validators} from '@angular/forms';
import {Subject, merge, Subscription} from 'rxjs';
import {FocusOrigin} from '@angular/cdk/a11y';
import {coerceBooleanProperty, BooleanInput} from '@angular/cdk/coercion';
import {
  MatStartDate,
  MatEndDate,
  MatDateRangeInputParent,
  MAT_DATE_RANGE_INPUT_PARENT,
} from './date-range-input-parts';
import {MatDatepickerControl, MatDatepickerPanel} from './datepicker-base';
import {createMissingDateImplError} from './datepicker-errors';
import {DateFilterFn, dateInputsHaveChanged, _MatFormFieldPartial} from './datepicker-input-base';
import {MatDateRangePickerInput} from './date-range-picker';
import {DateRange, MatDateSelectionModel} from './date-selection-model';

let nextUniqueId = 0;

@Component({
  selector: 'mat-date-range-input',
  templateUrl: 'date-range-input.html',
  styleUrls: ['date-range-input.css'],
  exportAs: 'matDateRangeInput',
  host: {
    'class': 'mat-date-range-input',
    '[class.mat-date-range-input-hide-placeholders]': '_shouldHidePlaceholders()',
    '[class.mat-date-range-input-required]': 'required',
    '[attr.id]': 'id',
    'role': 'group',
    '[attr.aria-labelledby]': '_getAriaLabelledby()',
    '[attr.aria-describedby]': '_ariaDescribedBy',
    // Used by the test harness to tie this input to its calendar. We can't depend on
    // `aria-owns` for this, because it's only defined while the calendar is open.
    '[attr.data-mat-calendar]': 'rangePicker ? rangePicker.id : null',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    {provide: MatFormFieldControl, useExisting: MatDateRangeInput},
    {provide: MAT_DATE_RANGE_INPUT_PARENT, useExisting: MatDateRangeInput},
  ],
})
export class MatDateRangeInput<D>
  implements
    MatFormFieldControl<DateRange<D>>,
    MatDatepickerControl<D>,
    MatDateRangeInputParent<D>,
    MatDateRangePickerInput<D>,
    AfterContentInit,
    OnChanges,
    OnDestroy
{
  private _closedSubscription = Subscription.EMPTY;

  /**
   * Current value of the range input.
   *
   * 范围输入框的当前值。
   *
   */
  get value() {
    return this._model ? this._model.selection : null;
  }

  /**
   * Unique ID for the group.
   *
   * 输入框的唯一 ID。
   *
   */
  id = `mat-date-range-input-${nextUniqueId++}`;

  /**
   * Whether the control is focused.
   *
   * 控件是否拥有焦点。
   *
   */
  focused = false;

  /**
   * Whether the control's label should float.
   *
   * 控件的标签是否应该浮动。
   *
   */
  get shouldLabelFloat(): boolean {
    return this.focused || !this.empty;
  }

  /**
   * Name of the form control.
   *
   * 表单控件的名字。
   *
   */
  controlType = 'mat-date-range-input';

  /**
   * Implemented as a part of `MatFormFieldControl`.
   * Set the placeholder attribute on `matStartDate` and `matEndDate`.
   *
   *是 `MatFormFieldControl` 实现的一部分。在 `matStartDate` 和 `matEndDate` 上设置占位符属性。
   *
   * @docs-private
   */
  get placeholder() {
    const start = this._startInput?._getPlaceholder() || '';
    const end = this._endInput?._getPlaceholder() || '';
    return start || end ? `${start} ${this.separator} ${end}` : '';
  }

  /**
   * The range picker that this input is associated with.
   *
   * 此输入框所关联的范围选择器。
   *
   */
  @Input()
  get rangePicker() {
    return this._rangePicker;
  }
  set rangePicker(rangePicker: MatDatepickerPanel<MatDatepickerControl<D>, DateRange<D>, D>) {
    if (rangePicker) {
      this._model = rangePicker.registerInput(this);
      this._rangePicker = rangePicker;
      this._closedSubscription.unsubscribe();
      this._closedSubscription = rangePicker.closedStream.subscribe(() => {
        this._startInput?._onTouched();
        this._endInput?._onTouched();
      });
      this._registerModel(this._model!);
    }
  }
  private _rangePicker: MatDatepickerPanel<MatDatepickerControl<D>, DateRange<D>, D>;

  /**
   * Whether the input is required.
   *
   * 输入框是否为必填项。
   *
   */
  @Input()
  get required(): boolean {
    return (
      this._required ??
      (this._isTargetRequired(this) ||
        this._isTargetRequired(this._startInput) ||
        this._isTargetRequired(this._endInput)) ??
      false
    );
  }
  set required(value: BooleanInput) {
    this._required = coerceBooleanProperty(value);
  }
  private _required: boolean | undefined;

  /**
   * Function that can be used to filter out dates within the date range picker.
   *
   * 可用于过滤掉日期范围选择器中日期的函数。
   *
   */
  @Input()
  get dateFilter() {
    return this._dateFilter;
  }
  set dateFilter(value: DateFilterFn<D>) {
    const start = this._startInput;
    const end = this._endInput;
    const wasMatchingStart = start && start._matchesFilter(start.value);
    const wasMatchingEnd = end && end._matchesFilter(start.value);
    this._dateFilter = value;

    if (start && start._matchesFilter(start.value) !== wasMatchingStart) {
      start._validatorOnChange();
    }

    if (end && end._matchesFilter(end.value) !== wasMatchingEnd) {
      end._validatorOnChange();
    }
  }
  private _dateFilter: DateFilterFn<D>;

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
      this._revalidate();
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
      this._revalidate();
    }
  }
  private _max: D | null;

  /**
   * Whether the input is disabled.
   *
   * 输入框是否已禁用。
   *
   */
  @Input()
  get disabled(): boolean {
    return this._startInput && this._endInput
      ? this._startInput.disabled && this._endInput.disabled
      : this._groupDisabled;
  }
  set disabled(value: BooleanInput) {
    const newValue = coerceBooleanProperty(value);

    if (newValue !== this._groupDisabled) {
      this._groupDisabled = newValue;
      this.stateChanges.next(undefined);
    }
  }
  _groupDisabled = false;

  /**
   * Whether the input is in an error state.
   *
   * 输入框是否处于出错状态。
   *
   */
  get errorState(): boolean {
    if (this._startInput && this._endInput) {
      return this._startInput.errorState || this._endInput.errorState;
    }

    return false;
  }

  /**
   * Whether the datepicker input is empty.
   *
   * 日期选择器输入框是否为空。
   *
   */
  get empty(): boolean {
    const startEmpty = this._startInput ? this._startInput.isEmpty() : false;
    const endEmpty = this._endInput ? this._endInput.isEmpty() : false;
    return startEmpty && endEmpty;
  }

  /**
   * Value for the `aria-describedby` attribute of the inputs.
   *
   * 输入框的 `aria-describedby` 属性值。
   *
   */
  _ariaDescribedBy: string | null = null;

  /**
   * Date selection model currently registered with the input.
   *
   * 当前在输入框中注册的日期选择模型。
   *
   */
  private _model: MatDateSelectionModel<DateRange<D>> | undefined;

  /**
   * Separator text to be shown between the inputs.
   *
   * 要在输入框之间显示的分隔符文本。
   *
   */
  @Input() separator = '–';

  /**
   * Start of the comparison range that should be shown in the calendar.
   *
   * 应该在日历中显示的比较范围的起始日期。
   *
   */
  @Input() comparisonStart: D | null = null;

  /**
   * End of the comparison range that should be shown in the calendar.
   *
   * 应该在日历中显示的比较范围的结束日期。
   *
   */
  @Input() comparisonEnd: D | null = null;

  @ContentChild(MatStartDate) _startInput: MatStartDate<D>;
  @ContentChild(MatEndDate) _endInput: MatEndDate<D>;

  /**
   * Implemented as a part of `MatFormFieldControl`.
   * TODO\(crisbeto\): change type to `AbstractControlDirective` after #18206 lands.
   *
   * 是 `MatFormFieldControl` 实现的一部分。
   *
   * @docs-private
   */
  ngControl: NgControl | null;

  /**
   * Emits when the input's state has changed.
   *
   * 当输入框状态发生变化时触发。
   *
   */
  readonly stateChanges = new Subject<void>();

  constructor(
    private _changeDetectorRef: ChangeDetectorRef,
    private _elementRef: ElementRef<HTMLElement>,
    @Optional() @Self() control: ControlContainer,
    @Optional() private _dateAdapter: DateAdapter<D>,
    @Optional() @Inject(MAT_FORM_FIELD) private _formField?: _MatFormFieldPartial,
  ) {
    if (!_dateAdapter && (typeof ngDevMode === 'undefined' || ngDevMode)) {
      throw createMissingDateImplError('DateAdapter');
    }

    // The datepicker module can be used both with MDC and non-MDC form fields. We have
    // to conditionally add the MDC input class so that the range picker looks correctly.
    if (_formField?._elementRef.nativeElement.classList.contains('mat-mdc-form-field')) {
      _elementRef.nativeElement.classList.add(
        'mat-mdc-input-element',
        'mat-mdc-form-field-input-control',
        'mdc-text-field__input',
      );
    }

    // TODO(crisbeto): remove `as any` after #18206 lands.
    this.ngControl = control as any;
  }

  /**
   * Implemented as a part of `MatFormFieldControl`.
   *
   *是 `MatFormFieldControl` 实现的一部分。
   *
   * @docs-private
   */
  setDescribedByIds(ids: string[]): void {
    this._ariaDescribedBy = ids.length ? ids.join(' ') : null;
  }

  /**
   * Implemented as a part of `MatFormFieldControl`.
   *
   *是 `MatFormFieldControl` 实现的一部分。
   *
   * @docs-private
   */
  onContainerClick(): void {
    if (!this.focused && !this.disabled) {
      if (!this._model || !this._model.selection.start) {
        this._startInput.focus();
      } else {
        this._endInput.focus();
      }
    }
  }

  ngAfterContentInit() {
    if (typeof ngDevMode === 'undefined' || ngDevMode) {
      if (!this._startInput) {
        throw Error('mat-date-range-input must contain a matStartDate input');
      }

      if (!this._endInput) {
        throw Error('mat-date-range-input must contain a matEndDate input');
      }
    }

    if (this._model) {
      this._registerModel(this._model);
    }

    // We don't need to unsubscribe from this, because we
    // know that the input streams will be completed on destroy.
    merge(this._startInput.stateChanges, this._endInput.stateChanges).subscribe(() => {
      this.stateChanges.next(undefined);
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (dateInputsHaveChanged(changes, this._dateAdapter)) {
      this.stateChanges.next(undefined);
    }
  }

  ngOnDestroy() {
    this._closedSubscription.unsubscribe();
    this.stateChanges.complete();
  }

  /**
   * Gets the date at which the calendar should start.
   *
   * 获取日历的起始日期。
   *
   */
  getStartValue(): D | null {
    return this.value ? this.value.start : null;
  }

  /**
   * Gets the input's theme palette.
   *
   * 获取输入框的主题调色板。
   *
   */
  getThemePalette(): ThemePalette {
    return this._formField ? this._formField.color : undefined;
  }

  /**
   * Gets the element to which the calendar overlay should be attached.
   *
   * 获取要附着日历浮层的元素。
   *
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
    return this._formField ? this._formField.getLabelId() : null;
  }

  /**
   * Gets the value that is used to mirror the state input.
   *
   * 获取用于镜像状态输入框的值。
   *
   */
  _getInputMirrorValue(part: 'start' | 'end') {
    const input = part === 'start' ? this._startInput : this._endInput;
    return input ? input.getMirrorValue() : '';
  }

  /**
   * Whether the input placeholders should be hidden.
   *
   * 输入框占位符是否应该隐藏。
   *
   */
  _shouldHidePlaceholders() {
    return this._startInput ? !this._startInput.isEmpty() : false;
  }

  /**
   * Handles the value in one of the child inputs changing.
   *
   * 处理子输入框之一的值的变化。
   *
   */
  _handleChildValueChange() {
    this.stateChanges.next(undefined);
    this._changeDetectorRef.markForCheck();
  }

  /**
   * Opens the date range picker associated with the input.
   *
   * 打开与输入框关联的日期范围选择器。
   *
   */
  _openDatepicker() {
    if (this._rangePicker) {
      this._rangePicker.open();
    }
  }

  /**
   * Whether the separate text should be hidden.
   *
   * 是否要隐藏单独的文本。
   *
   */
  _shouldHideSeparator() {
    return (
      (!this._formField ||
        (this._formField.getLabelId() && !this._formField._shouldLabelFloat())) &&
      this.empty
    );
  }

  /**
   * Gets the value for the `aria-labelledby` attribute of the inputs.
   *
   * 获取输入框 `aria-labelledby` 属性的值。
   *
   */
  _getAriaLabelledby() {
    const formField = this._formField;
    return formField && formField._hasFloatingLabel() ? formField._labelId : null;
  }

  _getStartDateAccessibleName(): string {
    return this._startInput._getAccessibleName();
  }

  _getEndDateAccessibleName(): string {
    return this._endInput._getAccessibleName();
  }

  /**
   * Updates the focused state of the range input.
   *
   * 更新范围输入的焦点状态。
   *
   */
  _updateFocus(origin: FocusOrigin) {
    this.focused = origin !== null;
    this.stateChanges.next();
  }

  /**
   * Re-runs the validators on the start/end inputs.
   *
   * 重新运行起始日期/结束日期输入框的验证器。
   *
   */
  private _revalidate() {
    if (this._startInput) {
      this._startInput._validatorOnChange();
    }

    if (this._endInput) {
      this._endInput._validatorOnChange();
    }
  }

  /**
   * Registers the current date selection model with the start/end inputs.
   *
   * 使用起始日期/结束日期输入框来注册当前的日期选择模型。
   *
   */
  private _registerModel(model: MatDateSelectionModel<DateRange<D>>) {
    if (this._startInput) {
      this._startInput._registerModel(model);
    }

    if (this._endInput) {
      this._endInput._registerModel(model);
    }
  }

  /** Checks whether a specific range input directive is required. */
  private _isTargetRequired(target: {ngControl: NgControl | null} | null): boolean | undefined {
    return target?.ngControl?.control?.hasValidator(Validators.required);
  }
}
