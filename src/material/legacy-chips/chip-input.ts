/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {BooleanInput, coerceBooleanProperty} from '@angular/cdk/coercion';
import {BACKSPACE, hasModifierKey, TAB} from '@angular/cdk/keycodes';
import {
  AfterContentInit,
  Directive,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  Output,
} from '@angular/core';
import {
  MatLegacyChipsDefaultOptions,
  MAT_LEGACY_CHIPS_DEFAULT_OPTIONS,
} from './chip-default-options';
import {MatLegacyChipList} from './chip-list';
import {MatLegacyChipTextControl} from './chip-text-control';

/**
 * Represents an input event on a `matChipInput`.
 *
 * 表示 `matChipInput` 上的输入事件。
 *
 * @deprecated
 *
 * Use `MatChipInputEvent` from `@angular/material/chips` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
export interface MatLegacyChipInputEvent {
  /**
   * The native `<input>` element that the event is being fired for.
   *
   * 触发该事件的原生 `<input>`。
   *
   * @deprecated
   *
   * Use `MatChipInputEvent#chipInput.inputElement` instead.
   *
   * 请改用 `MatChipInputEvent#chipInput.inputElement` 。
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
   */
  chipInput: MatLegacyChipInput;
}

// Increasing integer for generating unique ids.
let nextUniqueId = 0;

/**
 * Directive that adds chip-specific behaviors to an input element inside `<mat-form-field>`.
 * May be placed inside or outside of an `<mat-chip-list>`.
 *
 * 该指令用于把纸片特有的行为添加到 `<mat-form-field>` 里面的输入框元素中。可以放在 `<mat-chip-list>` 的内部或外部。
 *
 * @deprecated
 *
 * Use `MatChipInput` from `@angular/material/chips` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
@Directive({
  selector: 'input[matChipInputFor]',
  exportAs: 'matChipInput, matChipInputFor',
  host: {
    'class': 'mat-chip-input mat-input-element',
    '(keydown)': '_keydown($event)',
    '(keyup)': '_keyup($event)',
    '(blur)': '_blur()',
    '(focus)': '_focus()',
    '(input)': '_onInput()',
    '[id]': 'id',
    '[attr.disabled]': 'disabled || null',
    '[attr.placeholder]': 'placeholder || null',
    '[attr.aria-invalid]': '_chipList && _chipList.ngControl ? _chipList.ngControl.invalid : null',
    '[attr.aria-required]': '_chipList && _chipList.required || null',
  },
})
export class MatLegacyChipInput
  implements MatLegacyChipTextControl, OnChanges, OnDestroy, AfterContentInit
{
  /** Used to prevent focus moving to chips while user is holding backspace */
  private _focusLastChipOnBackspace: boolean;

  /**
   * Whether the control is focused.
   *
   * 控件是否有焦点。
   *
   */
  focused: boolean = false;
  _chipList: MatLegacyChipList;

  /**
   * Register input for chip list
   *
   * 注册纸片列表的输入框
   *
   */
  @Input('matChipInputFor')
  set chipList(value: MatLegacyChipList) {
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
  separatorKeyCodes: readonly number[] | ReadonlySet<number> =
    this._defaultOptions.separatorKeyCodes;

  /**
   * Emitted when a chip is to be added.
   *
   * 当要添加纸片时会触发。
   *
   */
  @Output('matChipInputTokenEnd') readonly chipEnd = new EventEmitter<MatLegacyChipInputEvent>();

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
   * 输入框是否已禁用。
   *
   */
  @Input()
  get disabled(): boolean {
    return this._disabled || (this._chipList && this._chipList.disabled);
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
    @Inject(MAT_LEGACY_CHIPS_DEFAULT_OPTIONS) private _defaultOptions: MatLegacyChipsDefaultOptions,
  ) {
    this.inputElement = this._elementRef.nativeElement as HTMLInputElement;
  }

  ngOnChanges(): void {
    this._chipList.stateChanges.next();
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
   * 使宿主定义/测试更清晰的实用方法。
   *
   */
  _keydown(event?: KeyboardEvent) {
    if (event) {
      // Allow the user's focus to escape when they're tabbing forward. Note that we don't
      // want to do this when going backwards, because focus should go back to the first chip.
      if (event.keyCode === TAB && !hasModifierKey(event, 'shiftKey')) {
        this._chipList._allowFocusEscape();
      }

      // To prevent the user from accidentally deleting chips when pressing BACKSPACE continuously,
      // We focus the last chip on backspace only after the user has released the backspace button,
      // and the input is empty (see behaviour in _keyup)
      if (event.keyCode === BACKSPACE && this._focusLastChipOnBackspace) {
        this._chipList._keyManager.setLastItemActive();
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
   * 将事件传递给键盘管理器。可在此处进行测试。
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
   * Checks to see if the blur should emit the (chipEnd) event.
   *
   * 检查失焦时是否应发出 (chipEnd) 事件。
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
    this._focusLastChipOnBackspace = this.empty;
    this._chipList.stateChanges.next();
  }

  /**
   * Checks to see if the (chipEnd) event needs to be emitted.
   *
   * 检查是否需要发出 (chipEnd) 事件。
   *
   */
  _emitChipEnd(event?: KeyboardEvent) {
    if (!this.inputElement.value && !!event) {
      this._chipList._keydown(event);
    }

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
    this._chipList.stateChanges.next();
  }

  /**
   * Focuses the input.
   *
   * 让输入框获得焦点。
   *
   */
  focus(options?: FocusOptions): void {
    this.inputElement.focus(options);
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

  /** Checks whether a keycode is one of the configured separators. */
  private _isSeparatorKey(event: KeyboardEvent) {
    return !hasModifierKey(event) && new Set(this.separatorKeyCodes).has(event.keyCode);
  }
}
