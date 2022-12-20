/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {BooleanInput, coerceBooleanProperty} from '@angular/cdk/coercion';
import {MatChipAction} from './chip-action';
import {TAB} from '@angular/cdk/keycodes';
import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  ContentChildren,
  EventEmitter,
  forwardRef,
  Input,
  OnDestroy,
  Output,
  QueryList,
  ViewEncapsulation,
} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {Observable} from 'rxjs';
import {startWith, takeUntil} from 'rxjs/operators';
import {MatChip, MatChipEvent} from './chip';
import {MatChipOption, MatChipSelectionChange} from './chip-option';
import {MatChipSet} from './chip-set';

/**
 * Change event object that is emitted when the chip listbox value has changed.
 *
 * 纸片列表框值更改时发出的更改事件对象。
 *
 */
export class MatChipListboxChange {
  constructor(
    /** Chip listbox that emitted the event. */
    public source: MatChipListbox,
    /** Value of the chip listbox when the event was emitted. */
    public value: any,
  ) {}
}

/**
 * Provider Expression that allows mat-chip-listbox to register as a ControlValueAccessor.
 * This allows it to support [(ngModel)].
 *
 * 允许 mat-chip-listbox 注册为 ControlValueAccessor 的提供者表达式。这允许它支持[(ngModel)]。
 *
 * @docs-private
 */
export const MAT_CHIP_LISTBOX_CONTROL_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => MatChipListbox),
  multi: true,
};

/**
 * An extension of the MatChipSet component that supports chip selection.
 * Used with MatChipOption chips.
 *
 * 支持纸片选择的 MatChipSet 组件的扩展。与 MatChipOption 纸片一起使用。
 *
 */
@Component({
  selector: 'mat-chip-listbox',
  template: `
    <span class="mdc-evolution-chip-set__chips" role="presentation">
      <ng-content></ng-content>
    </span>
  `,
  styleUrls: ['chip-set.css'],
  inputs: ['tabIndex'],
  host: {
    'class': 'mdc-evolution-chip-set mat-mdc-chip-listbox',
    '[attr.role]': 'role',
    '[tabIndex]': 'empty ? -1 : tabIndex',
    // TODO: replace this binding with use of AriaDescriber
    '[attr.aria-describedby]': '_ariaDescribedby || null',
    '[attr.aria-required]': 'role ? required : null',
    '[attr.aria-disabled]': 'disabled.toString()',
    '[attr.aria-multiselectable]': 'multiple',
    '[attr.aria-orientation]': 'ariaOrientation',
    '[class.mat-mdc-chip-list-disabled]': 'disabled',
    '[class.mat-mdc-chip-list-required]': 'required',
    '(focus)': 'focus()',
    '(blur)': '_blur()',
    '(keydown)': '_keydown($event)',
  },
  providers: [MAT_CHIP_LISTBOX_CONTROL_VALUE_ACCESSOR],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatChipListbox
  extends MatChipSet
  implements AfterContentInit, OnDestroy, ControlValueAccessor
{
  /**
   * Function when touched. Set as part of ControlValueAccessor implementation.
   *
   * 已接触时调用的函数。设置为 ControlValueAccessor 实现的一部分。
   *
   * @docs-private
   */
  _onTouched = () => {};

  /**
   * Function when changed. Set as part of ControlValueAccessor implementation.
   *
   * 已改变时调用的函数。设置为 ControlValueAccessor 实现的一部分。
   *
   * @docs-private
   */
  _onChange: (value: any) => void = () => {};

  // TODO: MDC uses `grid` here
  protected override _defaultRole = 'listbox';

  /** Value that was assigned before the listbox was initialized. */
  private _pendingInitialValue: any;

  /**
   * Whether the user should be allowed to select multiple chips.
   *
   * 是否允许用户选择多个纸片。
   *
   */
  @Input()
  get multiple(): boolean {
    return this._multiple;
  }
  set multiple(value: BooleanInput) {
    this._multiple = coerceBooleanProperty(value);
    this._syncListboxProperties();
  }
  private _multiple: boolean = false;

  /**
   * The array of selected chips inside the chip listbox.
   *
   * 纸片列表框中已选定纸片的数组。
   *
   */
  get selected(): MatChipOption[] | MatChipOption {
    const selectedChips = this._chips.toArray().filter(chip => chip.selected);
    return this.multiple ? selectedChips : selectedChips[0];
  }

  /**
   * Orientation of the chip list.
   *
   * 纸片列表的方向。
   *
   */
  @Input('aria-orientation') ariaOrientation: 'horizontal' | 'vertical' = 'horizontal';

  /**
   * Whether or not this chip listbox is selectable.
   *
   * 此纸片列表框是否可选。
   *
   * When a chip listbox is not selectable, the selected states for all
   * the chips inside the chip listbox are always ignored.
   *
   * 当纸片列表框不可选时，纸片列表框内所有纸片的选定状态总是被忽略。
   *
   */
  @Input()
  get selectable(): boolean {
    return this._selectable;
  }
  set selectable(value: BooleanInput) {
    this._selectable = coerceBooleanProperty(value);
    this._syncListboxProperties();
  }
  protected _selectable: boolean = true;

  /**
   * A function to compare the option values with the selected values. The first argument
   * is a value from an option. The second is a value from the selection. A boolean
   * should be returned.
   *
   * 用来比较选项值和当前选择的函数。第一个参数是选项的值，第二个选定的值。应该返回一个布尔值。
   *
   */
  @Input() compareWith: (o1: any, o2: any) => boolean = (o1: any, o2: any) => o1 === o2;

  /**
   * Whether this chip listbox is required.
   *
   * 此纸片列表框是否必要的。
   *
   */
  @Input()
  get required(): boolean {
    return this._required;
  }
  set required(value: BooleanInput) {
    this._required = coerceBooleanProperty(value);
  }
  protected _required: boolean = false;

  /**
   * Combined stream of all of the child chips' selection change events.
   *
   * 所有子纸片的选定状态更改事件的组合流。
   *
   */
  get chipSelectionChanges(): Observable<MatChipSelectionChange> {
    return this._getChipStream<MatChipSelectionChange, MatChipOption>(chip => chip.selectionChange);
  }

  /**
   * Combined stream of all of the child chips' blur events.
   *
   * 所有子纸片的失焦事件的组合流。
   *
   */
  get chipBlurChanges(): Observable<MatChipEvent> {
    return this._getChipStream(chip => chip._onBlur);
  }

  /**
   * The value of the listbox, which is the combined value of the selected chips.
   *
   * 此列表框的值，即所选定纸片的组合值。
   *
   */
  @Input()
  get value(): any {
    return this._value;
  }
  set value(value: any) {
    this.writeValue(value);
    this._value = value;
  }
  protected _value: any;

  /**
   * Event emitted when the selected chip listbox value has been changed by the user.
   *
   * 当用户更改了所选定纸片列表框值时发出的事件。
   *
   */
  @Output() readonly change: EventEmitter<MatChipListboxChange> =
    new EventEmitter<MatChipListboxChange>();

  @ContentChildren(MatChipOption, {
    // We need to use `descendants: true`, because Ivy will no longer match
    // indirect descendants if it's left as false.
    descendants: true,
  })
  override _chips: QueryList<MatChipOption>;

  ngAfterContentInit() {
    if (this._pendingInitialValue !== undefined) {
      Promise.resolve().then(() => {
        this._setSelectionByValue(this._pendingInitialValue, false);
        this._pendingInitialValue = undefined;
      });
    }

    this._chips.changes.pipe(startWith(null), takeUntil(this._destroyed)).subscribe(() => {
      // Update listbox selectable/multiple properties on chips
      this._syncListboxProperties();
    });

    this.chipBlurChanges.pipe(takeUntil(this._destroyed)).subscribe(() => this._blur());
    this.chipSelectionChanges.pipe(takeUntil(this._destroyed)).subscribe(event => {
      if (!this.multiple) {
        this._chips.forEach(chip => {
          if (chip !== event.source) {
            chip._setSelectedState(false, false, false);
          }
        });
      }

      if (event.isUserInput) {
        this._propagateChanges();
      }
    });
  }

  /**
   * Focuses the first selected chip in this chip listbox, or the first non-disabled chip when there
   * are no selected chips.
   *
   * 聚焦此纸片列表框中第一个选定的纸片，或者在没有选定纸片时聚焦第一个未禁用的纸片。
   *
   */
  override focus(): void {
    if (this.disabled) {
      return;
    }

    const firstSelectedChip = this._getFirstSelectedChip();

    if (firstSelectedChip && !firstSelectedChip.disabled) {
      firstSelectedChip.focus();
    } else if (this._chips.length > 0) {
      this._keyManager.setFirstItemActive();
    } else {
      this._elementRef.nativeElement.focus();
    }
  }

  /**
   * Implemented as part of ControlValueAccessor.
   *
   * 作为 ControlValueAccessor 的一部分实现。
   *
   * @docs-private
   */
  writeValue(value: any): void {
    if (this._chips) {
      this._setSelectionByValue(value, false);
    } else if (value != null) {
      this._pendingInitialValue = value;
    }
  }

  /**
   * Implemented as part of ControlValueAccessor.
   *
   * 作为 ControlValueAccessor 的一部分实现。
   *
   * @docs-private
   */
  registerOnChange(fn: (value: any) => void): void {
    this._onChange = fn;
  }

  /**
   * Implemented as part of ControlValueAccessor.
   *
   * 作为 ControlValueAccessor 的一部分实现。
   *
   * @docs-private
   */
  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }

  /**
   * Implemented as part of ControlValueAccessor.
   *
   * 作为 ControlValueAccessor 的一部分实现。
   *
   * @docs-private
   */
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  /**
   * Selects all chips with value.
   *
   * 选择所有有值的纸片。
   *
   */
  _setSelectionByValue(value: any, isUserInput: boolean = true) {
    this._clearSelection();

    if (Array.isArray(value)) {
      value.forEach(currentValue => this._selectValue(currentValue, isUserInput));
    } else {
      this._selectValue(value, isUserInput);
    }
  }

  /**
   * When blurred, marks the field as touched when focus moved outside the chip listbox.
   *
   * 失焦时，当焦点移出纸片列表框时，将字段标记为已接触。
   *
   */
  _blur() {
    if (!this.disabled) {
      // Wait to see if focus moves to an individual chip.
      setTimeout(() => {
        if (!this.focused) {
          this._propagateChanges();
          this._markAsTouched();
        }
      });
    }
  }

  _keydown(event: KeyboardEvent) {
    if (event.keyCode === TAB) {
      super._allowFocusEscape();
    }
  }

  /** Marks the field as touched */
  private _markAsTouched() {
    this._onTouched();
    this._changeDetectorRef.markForCheck();
  }

  /** Emits change event to set the model value. */
  private _propagateChanges(): void {
    let valueToEmit: any = null;

    if (Array.isArray(this.selected)) {
      valueToEmit = this.selected.map(chip => chip.value);
    } else {
      valueToEmit = this.selected ? this.selected.value : undefined;
    }
    this._value = valueToEmit;
    this.change.emit(new MatChipListboxChange(this, valueToEmit));
    this._onChange(valueToEmit);
    this._changeDetectorRef.markForCheck();
  }

  /**
   * Deselects every chip in the listbox.
   * @param skip Chip that should not be deselected.
   */
  private _clearSelection(skip?: MatChip): void {
    this._chips.forEach(chip => {
      if (chip !== skip) {
        chip.deselect();
      }
    });
  }

  /**
   * Finds and selects the chip based on its value.
   * @returns Chip that has the corresponding value.
   */
  private _selectValue(value: any, isUserInput: boolean): MatChip | undefined {
    const correspondingChip = this._chips.find(chip => {
      return chip.value != null && this.compareWith(chip.value, value);
    });

    if (correspondingChip) {
      isUserInput ? correspondingChip.selectViaInteraction() : correspondingChip.select();
    }

    return correspondingChip;
  }

  /** Syncs the chip-listbox selection state with the individual chips. */
  private _syncListboxProperties() {
    if (this._chips) {
      // Defer setting the value in order to avoid the "Expression
      // has changed after it was checked" errors from Angular.
      Promise.resolve().then(() => {
        this._chips.forEach(chip => {
          chip._chipListMultiple = this.multiple;
          chip.chipListSelectable = this._selectable;
          chip._changeDetectorRef.markForCheck();
        });
      });
    }
  }

  /** Returns the first selected chip in this listbox, or undefined if no chips are selected. */
  private _getFirstSelectedChip(): MatChipOption | undefined {
    if (Array.isArray(this.selected)) {
      return this.selected.length ? this.selected[0] : undefined;
    } else {
      return this.selected;
    }
  }

  /**
   * Determines if key manager should avoid putting a given chip action in the tab index. Skip
   * non-interactive actions since the user can't do anything with them.
   *
   * 确定键盘管理器是否应避免将给定的纸片操作放入 tabindex 中。要跳过非交互式操作，是因为用户无法对它们执行任何操作。
   *
   */
  protected override _skipPredicate(action: MatChipAction): boolean {
    // Override the skip predicate in the base class to avoid skipping disabled chips. Allow
    // disabled chip options to receive focus to align with WAI ARIA recommendation. Normally WAI
    // ARIA's instructions are to exclude disabled items from the tab order, but it makes a few
    // exceptions for compound widgets.
    //
    // From [Developing a Keyboard Interface](
    // https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/):
    //   "For the following composite widget elements, keep them focusable when disabled: Options in a
    //   Listbox..."
    return !action.isInteractive;
  }
}
