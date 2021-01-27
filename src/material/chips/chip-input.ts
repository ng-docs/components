/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {BooleanInput, coerceBooleanProperty} from '@angular/cdk/coercion';
import {hasModifierKey, TAB} from '@angular/cdk/keycodes';
import {Directive, ElementRef, EventEmitter, Inject, Input, OnChanges, Output} from '@angular/core';
import {MatChipsDefaultOptions, MAT_CHIPS_DEFAULT_OPTIONS} from './chip-default-options';
import {MatChipList} from './chip-list';
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
   * 触发该事件的原生 `<input>`
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
}

// Increasing integer for generating unique ids.
let nextUniqueId = 0;

/**
 * Directive that adds chip-specific behaviors to an input element inside `<mat-form-field>`.
 * May be placed inside or outside of an `<mat-chip-list>`.
 *
 * 该指令用于把纸片特有的行为添加到 `<mat-form-field>` 里面的输入框元素中。可以放在 `<mat-chip-list>` 的内部或外部。
 *
 */
@Directive({
  selector: 'input[matChipInputFor]',
  exportAs: 'matChipInput, matChipInputFor',
  host: {
    'class': 'mat-chip-input mat-input-element',
    '(keydown)': '_keydown($event)',
    '(blur)': '_blur()',
    '(focus)': '_focus()',
    '(input)': '_onInput()',
    '[id]': 'id',
    '[attr.disabled]': 'disabled || null',
    '[attr.placeholder]': 'placeholder || null',
    '[attr.aria-invalid]': '_chipList && _chipList.ngControl ? _chipList.ngControl.invalid : null',
    '[attr.aria-required]': '_chipList && _chipList.required || null',
  }
})
export class MatChipInput implements MatChipTextControl, OnChanges {
  /**
   * Whether the control is focused.
   *
   * 控件是否有焦点。
   *
   */
  focused: boolean = false;
  _chipList: MatChipList;

  /**
   * Register input for chip list
   *
   * 注册纸片列表的输入框
   *
   */
  @Input('matChipInputFor')
  set chipList(value: MatChipList) {
    if (value) {
      this._chipList = value;
      this._chipList.registerInput(this);
    }
  }

  /**
   * Whether or not the chipEnd event will be emitted when the input is blurred.
   *
   * 当输入失焦时，是否会发出 chipEnd 事件。
   *
   */
  @Input('matChipInputAddOnBlur')
  get addOnBlur(): boolean { return this._addOnBlur; }
  set addOnBlur(value: boolean) { this._addOnBlur = coerceBooleanProperty(value); }
  _addOnBlur: boolean = false;

  /**
   * The list of key codes that will trigger a chipEnd event.
   *
   * 会触发 chipEnd 事件的键盘代码列表。
   *
   * Defaults to `[ENTER]`.
   *
   * 默认为 `[ENTER]` 。
   *
   */
  @Input('matChipInputSeparatorKeyCodes')
  separatorKeyCodes: readonly number[] | ReadonlySet<number> =
      this._defaultOptions.separatorKeyCodes;

  /**
   * Emitted when a chip is to be added.
   *
   * 当要添加纸片时会触发。
   *
   */
  @Output('matChipInputTokenEnd')
  chipEnd: EventEmitter<MatChipInputEvent> = new EventEmitter<MatChipInputEvent>();

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
  @Input() id: string = `mat-chip-list-input-${nextUniqueId++}`;

  /**
   * Whether the input is disabled.
   *
   * 输入框是否被禁用。
   *
   */
  @Input()
  get disabled(): boolean { return this._disabled || (this._chipList && this._chipList.disabled); }
  set disabled(value: boolean) { this._disabled = coerceBooleanProperty(value); }
  private _disabled: boolean = false;

  /**
   * Whether the input is empty.
   *
   * 输入框是否为空。
   *
   */
  get empty(): boolean { return !this._inputElement.value; }

  /**
   * The native input element to which this directive is attached.
   *
   * 该指令所附属的原生输入框元素。
   *
   */
  protected _inputElement: HTMLInputElement;

  constructor(
    protected _elementRef: ElementRef<HTMLInputElement>,
    @Inject(MAT_CHIPS_DEFAULT_OPTIONS) private _defaultOptions: MatChipsDefaultOptions) {
    this._inputElement = this._elementRef.nativeElement as HTMLInputElement;
  }

  ngOnChanges() {
    this._chipList.stateChanges.next();
  }

  /**
   * Utility method to make host definition/tests more clear.
   *
   * 一种让宿主的定义/测试更清晰的实用工具。
   *
   */
  _keydown(event?: KeyboardEvent) {
    // Allow the user's focus to escape when they're tabbing forward. Note that we don't
    // want to do this when going backwards, because focus should go back to the first chip.
    if (event && event.keyCode === TAB && !hasModifierKey(event, 'shiftKey')) {
      this._chipList._allowFocusEscape();
    }

    this._emitChipEnd(event);
  }

  /**
   * Checks to see if the blur should emit the (chipEnd) event.
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
    if (!this._chipList.focused) {
      this._chipList._blur();
    }
    this._chipList.stateChanges.next();
  }

  _focus() {
    this.focused = true;
    this._chipList.stateChanges.next();
  }

  /**
   * Checks to see if the (chipEnd) event needs to be emitted.
   *
   * 检查是否需要发出（chipEnd）事件。
   *
   */
  _emitChipEnd(event?: KeyboardEvent) {
    if (!this._inputElement.value && !!event) {
      this._chipList._keydown(event);
    }
    if (!event || this._isSeparatorKey(event)) {
      this.chipEnd.emit({ input: this._inputElement, value: this._inputElement.value });

      if (event) {
        event.preventDefault();
      }
    }
  }

  _onInput() {
    // Let chip list know whenever the value changes.
    this._chipList.stateChanges.next();
  }

  /**
   * Focuses the input.
   *
   * 让输入框获得焦点。
   *
   */
  focus(options?: FocusOptions): void {
    this._inputElement.focus(options);
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

  static ngAcceptInputType_addOnBlur: BooleanInput;
  static ngAcceptInputType_disabled: BooleanInput;
}
