/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {BooleanInput, coerceBooleanProperty} from '@angular/cdk/coercion';
import {BACKSPACE, hasModifierKey} from '@angular/cdk/keycodes';
import {
  AfterContentInit,
  Directive,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  Optional,
  Output,
} from '@angular/core';
import {MatFormField, MAT_FORM_FIELD} from '@angular/material/form-field';
import {MatChipsDefaultOptions, MAT_CHIPS_DEFAULT_OPTIONS} from './tokens';
import {MatChipGrid} from './chip-grid';
import {MatChipTextControl} from './chip-text-control';

/**
 * Represents an input event on a `matChipInput`.
 *
 * 表示 `matChipInput` 上的输入事件。
 *
 */
export interface MatChipInputEvent {
  /**
   * The native `<input>` element that the event is being fired for.
   *
   * 触发该事件的原生 `<input>`。
   *
   * @deprecated Use `MatChipInputEvent#chipInput.inputElement` instead.
   *
   * 请改用 `MatChipInputEvent#chipInput.inputElement`。
   *
   * @breaking-change 13.0.0 This property will be removed.
   *
   * 此属性将被删除。
   *
   */
  input: HTMLInputElement;

  /**
   * The value of the input.
   *
   * 输入框的值。
   *
   */
  value: string;

  /**
   * Reference to the chip input that emitted the event.
   *
   * 对发出事件的纸片输入的引用。
   *
   * @breaking-change 13.0.0 This property will be made required.
   *
   * 此属性为必填项。
   *
   */
  chipInput: MatChipInput;
}

// Increasing integer for generating unique ids.
let nextUniqueId = 0;

/**
 * Directive that adds chip-specific behaviors to an input element inside `<mat-form-field>`.
 * May be placed inside or outside of a `<mat-chip-grid>`.
 *
 * 该指令用于把纸片特有的行为添加到 `<mat-form-field>` 里面的输入框元素中。可以放在 `<mat-chip-list>` 的内部或外部。
 *
 */
@Directive({
  selector: 'input[matChipInputFor]',
  exportAs: 'matChipInput, matChipInputFor',
  host: {
    // TODO: eventually we should remove `mat-input-element` from here since it comes from the
    // non-MDC version of the input. It's currently being kept for backwards compatibility, because
    // the MDC chips were landed initially with it.
    'class': 'mat-mdc-chip-input mat-mdc-input-element mdc-text-field__input mat-input-element',
    '(keydown)': '_keydown($event)',
    '(keyup)': '_keyup($event)',
    '(blur)': '_blur()',
    '(focus)': '_focus()',
    '(input)': '_onInput()',
    '[id]': 'id',
    '[attr.disabled]': 'disabled || null',
    '[attr.placeholder]': 'placeholder || null',
    '[attr.aria-invalid]': '_chipGrid && _chipGrid.ngControl ? _chipGrid.ngControl.invalid : null',
    '[attr.aria-required]': '_chipGrid && _chipGrid.required || null',
    '[attr.required]': '_chipGrid && _chipGrid.required || null',
  },
})
export class MatChipInput implements MatChipTextControl, AfterContentInit, OnChanges, OnDestroy {
  /**
   * Used to prevent focus moving to chips while user is holding backspace
   *
   * 用于防止在用户按住退格键时将焦点移到纸片上
   *
   */
  private _focusLastChipOnBackspace: boolean;

  /**
   * Whether the control is focused.
   *
   * 控件是否有焦点。
   *
   */
  focused: boolean = false;
  _chipGrid: MatChipGrid;

  /**
   * Register input for chip list
   *
   * 注册纸片列表的输入框
   *
   */
  @Input('matChipInputFor')
  set chipGrid(value: MatChipGrid) {
    if (value) {
      this._chipGrid = value;
      this._chipGrid.registerInput(this);
    }
  }

  /**
   * Whether or not the chipEnd event will be emitted when the input is blurred.
   *
   * 当输入失焦时，是否会发出 chipEnd 事件。
   *
   */
  @Input('matChipInputAddOnBlur')
  get addOnBlur(): boolean {
    return this._addOnBlur;
  }
  set addOnBlur(value: BooleanInput) {
    this._addOnBlur = coerceBooleanProperty(value);
  }
  _addOnBlur: boolean = false;

  /**
   * The list of key codes that will trigger a chipEnd event.
   *
   * 会触发 chipEnd 事件的键盘代码列表。
   *
   * Defaults to `[ENTER]`.
   *
   * 默认为 `[ENTER]`。
   *
   */
  @Input('matChipInputSeparatorKeyCodes')
  separatorKeyCodes: readonly number[] | ReadonlySet<number>;

  /**
   * Emitted when a chip is to be added.
   *
   * 当要添加纸片时会触发。
   *
   */
  @Output('matChipInputTokenEnd')
  readonly chipEnd: EventEmitter<MatChipInputEvent> = new EventEmitter<MatChipInputEvent>();

  /**
   * The input's placeholder text.
   *
   * 输入框的占位符文本。
   *
   */
  @Input() placeholder: string = '';

  /**
   * Unique id for the input.
   *
   * 该输入框的唯一 ID。
   *
   */
  @Input() id: string = `mat-mdc-chip-list-input-${nextUniqueId++}`;

  /**
   * Whether the input is disabled.
   *
   * 输入框是否已禁用。
   *
   */
  @Input()
  get disabled(): boolean {
    return this._disabled || (this._chipGrid && this._chipGrid.disabled);
  }
  set disabled(value: BooleanInput) {
    this._disabled = coerceBooleanProperty(value);
  }
  private _disabled: boolean = false;

  /**
   * Whether the input is empty.
   *
   * 输入框是否为空。
   *
   */
  get empty(): boolean {
    return !this.inputElement.value;
  }

  /**
   * The native input element to which this directive is attached.
   *
   * 该指令所附属的原生输入框元素。
   *
   */
  readonly inputElement!: HTMLInputElement;

  constructor(
    protected _elementRef: ElementRef<HTMLInputElement>,
    @Inject(MAT_CHIPS_DEFAULT_OPTIONS) defaultOptions: MatChipsDefaultOptions,
    @Optional() @Inject(MAT_FORM_FIELD) formField?: MatFormField,
  ) {
    this.inputElement = this._elementRef.nativeElement as HTMLInputElement;
    this.separatorKeyCodes = defaultOptions.separatorKeyCodes;

    if (formField) {
      this.inputElement.classList.add('mat-mdc-form-field-input-control');
    }
  }

  ngOnChanges() {
    this._chipGrid.stateChanges.next();
  }

  ngOnDestroy(): void {
    this.chipEnd.complete();
  }

  ngAfterContentInit(): void {
    this._focusLastChipOnBackspace = this.empty;
  }

  /**
   * Utility method to make host definition/tests more clear.
   *
   * 一种让宿主的定义/测试更清晰的实用工具。
   *
   */
  _keydown(event?: KeyboardEvent) {
    if (event) {
      // To prevent the user from accidentally deleting chips when pressing BACKSPACE continuously,
      // We focus the last chip on backspace only after the user has released the backspace button,
      // And the input is empty (see behaviour in _keyup)
      if (event.keyCode === BACKSPACE && this._focusLastChipOnBackspace) {
        this._chipGrid._focusLastChip();
        event.preventDefault();
        return;
      } else {
        this._focusLastChipOnBackspace = false;
      }
    }

    this._emitChipEnd(event);
  }

  /**
   * Pass events to the keyboard manager. Available here for tests.
   *
   * 将事件传递给键盘管理器。这是为测试准备的。
   *
   */
  _keyup(event: KeyboardEvent) {
    // Allow user to move focus to chips next time he presses backspace
    if (!this._focusLastChipOnBackspace && event.keyCode === BACKSPACE && this.empty) {
      this._focusLastChipOnBackspace = true;
      event.preventDefault();
    }
  }

  /**
   * Checks to see if the blur should emit the \(chipEnd\) event.
   *
   * 检查失焦时是否应该发出（chipEnd）事件。
   *
   */
  _blur() {
    if (this.addOnBlur) {
      this._emitChipEnd();
    }
    this.focused = false;
    // Blur the chip list if it is not focused
    if (!this._chipGrid.focused) {
      this._chipGrid._blur();
    }
    this._chipGrid.stateChanges.next();
  }

  _focus() {
    this.focused = true;
    this._focusLastChipOnBackspace = this.empty;
    this._chipGrid.stateChanges.next();
  }

  /**
   * Checks to see if the \(chipEnd\) event needs to be emitted.
   *
   * 检查是否需要发出（chipEnd）事件。
   *
   */
  _emitChipEnd(event?: KeyboardEvent) {
    if (!event || this._isSeparatorKey(event)) {
      this.chipEnd.emit({
        input: this.inputElement,
        value: this.inputElement.value,
        chipInput: this,
      });

      event?.preventDefault();
    }
  }

  _onInput() {
    // Let chip list know whenever the value changes.
    this._chipGrid.stateChanges.next();
  }

  /**
   * Focuses the input.
   *
   * 让输入框获得焦点。
   *
   */
  focus(): void {
    this.inputElement.focus();
  }

  /**
   * Clears the input
   *
   * 清除输入
   *
   */
  clear(): void {
    this.inputElement.value = '';
    this._focusLastChipOnBackspace = true;
  }

  setDescribedByIds(ids: string[]): void {
    const element = this._elementRef.nativeElement;

    // Set the value directly in the DOM since this binding
    // is prone to "changed after checked" errors.
    if (ids.length) {
      element.setAttribute('aria-describedby', ids.join(' '));
    } else {
      element.removeAttribute('aria-describedby');
    }
  }

  /**
   * Checks whether a keycode is one of the configured separators.
   *
   * 检查键盘代码是否为配置的分隔符之一。
   *
   */
  private _isSeparatorKey(event: KeyboardEvent) {
    return !hasModifierKey(event) && new Set(this.separatorKeyCodes).has(event.keyCode);
  }
}
