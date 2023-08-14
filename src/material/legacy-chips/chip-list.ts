/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {FocusKeyManager} from '@angular/cdk/a11y';
import {Directionality} from '@angular/cdk/bidi';
import {BooleanInput, coerceBooleanProperty} from '@angular/cdk/coercion';
import {SelectionModel} from '@angular/cdk/collections';
import {
  AfterContentInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChildren,
  DoCheck,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Optional,
  Output,
  QueryList,
  Self,
  ViewEncapsulation,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormGroupDirective,
  NgControl,
  NgForm,
  Validators,
} from '@angular/forms';
import {CanUpdateErrorState, ErrorStateMatcher, mixinErrorState} from '@angular/material/core';
import {MatLegacyFormFieldControl} from '@angular/material/legacy-form-field';
import {merge, Observable, Subject, Subscription} from 'rxjs';
import {startWith, takeUntil} from 'rxjs/operators';
import {MatLegacyChip, MatLegacyChipEvent, MatLegacyChipSelectionChange} from './chip';
import {MatLegacyChipTextControl} from './chip-text-control';

// Boilerplate for applying mixins to MatChipList.
/** @docs-private */
const _MatChipListBase = mixinErrorState(
  class {
    /**
     * Emits whenever the component state changes and should cause the parent
     * form-field to update. Implemented as part of `MatFormFieldControl`.
     *
     * 每当组件状态更改时发出，并会导致父表单字段更新。作为 `MatFormFieldControl` 的一部分实现。
     *
     * @docs-private
     */
    readonly stateChanges = new Subject<void>();

    constructor(
      public _defaultErrorStateMatcher: ErrorStateMatcher,
      public _parentForm: NgForm,
      public _parentFormGroup: FormGroupDirective,
      /**
       * Form control bound to the component.
       * Implemented as part of `MatFormFieldControl`.
       * @docs-private
       */
      public ngControl: NgControl,
    ) {}
  },
);

// Increasing integer for generating unique ids for chip-list components.
let nextUniqueId = 0;

/**
 * Change event object that is emitted when the chip list value has changed.
 *
 * 纸片列表的值发生变化时发出的事件对象。
 *
 * @deprecated
 *
 * Use `MatChipListChange` from `@angular/material/chips` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
export class MatLegacyChipListChange {
  constructor(
    /** Chip list that emitted the event. */
    public source: MatLegacyChipList,
    /** Value of the chip list when the event was emitted. */
    public value: any,
  ) {}
}

/**
 * A material design chips component (named ChipList for its similarity to the List component).
 *
 * 一种 Material Design 纸片组件（由于类似于 List 组件，因此得名 ChipList）。
 *
 * @deprecated
 *
 * Use `MatChipList` from `@angular/material/chips` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
@Component({
  selector: 'mat-chip-list',
  template: `<div class="mat-chip-list-wrapper"><ng-content></ng-content></div>`,
  exportAs: 'matChipList',
  host: {
    '[attr.tabindex]': 'disabled ? null : _tabIndex',
    '[attr.aria-required]': 'role ? required : null',
    '[attr.aria-disabled]': 'disabled.toString()',
    '[attr.aria-invalid]': 'errorState',
    '[attr.aria-multiselectable]': 'multiple',
    '[attr.role]': 'role',
    '[class.mat-chip-list-disabled]': 'disabled',
    '[class.mat-chip-list-invalid]': 'errorState',
    '[class.mat-chip-list-required]': 'required',
    '[attr.aria-orientation]': 'ariaOrientation',
    'class': 'mat-chip-list',
    '(focus)': 'focus()',
    '(blur)': '_blur()',
    '(keydown)': '_keydown($event)',
    '[id]': '_uid',
    'ngSkipHydration': '',
  },
  providers: [{provide: MatLegacyFormFieldControl, useExisting: MatLegacyChipList}],
  styleUrls: ['chips.css'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatLegacyChipList
  extends _MatChipListBase
  implements
    MatLegacyFormFieldControl<any>,
    ControlValueAccessor,
    AfterContentInit,
    DoCheck,
    OnInit,
    OnDestroy,
    CanUpdateErrorState
{
  /**
   * Implemented as part of MatFormFieldControl.
   *
   * 作为 MatFormFieldControl 的一部分实现。
   *
   * @docs-private
   */
  readonly controlType: string = 'mat-chip-list';

  /**
   * When a chip is destroyed, we store the index of the destroyed chip until the chips
   * query list notifies about the update. This is necessary because we cannot determine an
   * appropriate chip that should receive focus until the array of chips updated completely.
   */
  private _lastDestroyedChipIndex: number | null = null;

  /**
   * Subject that emits when the component has been destroyed.
   *
   * 当组件被销毁时发出事件的主体。
   *
   */
  private readonly _destroyed = new Subject<void>();

  /** Subscription to focus changes in the chips. */
  private _chipFocusSubscription: Subscription | null;

  /** Subscription to blur changes in the chips. */
  private _chipBlurSubscription: Subscription | null;

  /** Subscription to selection changes in chips. */
  private _chipSelectionSubscription: Subscription | null;

  /** Subscription to remove changes in chips. */
  private _chipRemoveSubscription: Subscription | null;

  /**
   * The chip input to add more chips
   *
   * 纸片输入，用以添加更多纸片
   *
   */
  protected _chipInput: MatLegacyChipTextControl;

  /**
   * Uid of the chip list
   *
   * 纸片列表的 uid
   *
   */
  _uid: string = `mat-chip-list-${nextUniqueId++}`;

  /**
   * Tab index for the chip list.
   *
   * 纸片列表的 tabindex 。
   *
   */
  _tabIndex = 0;

  /**
   * User defined tab index.
   * When it is not null, use user defined tab index. Otherwise use \_tabIndex
   *
   * 用户定义的 tabindex 。当它不为空时，使用用户定义的 tabindex 。否则使用 \_tabIndex
   *
   */
  _userTabIndex: number | null = null;

  /**
   * The FocusKeyManager which handles focus.
   *
   * 处理焦点的 FocusKeyManager。
   *
   */
  _keyManager: FocusKeyManager<MatLegacyChip>;

  /**
   * Function when touched
   *
   * 已接触时调用的函数
   *
   */
  _onTouched = () => {};

  /**
   * Function when changed
   *
   * 已改变时调用的函数
   *
   */
  _onChange: (value: any) => void = () => {};

  _selectionModel: SelectionModel<MatLegacyChip>;

  /**
   * The array of selected chips inside chip list.
   *
   * 纸片列表中选定纸片的数组。
   *
   */
  get selected(): MatLegacyChip[] | MatLegacyChip {
    return this.multiple ? this._selectionModel?.selected || [] : this._selectionModel?.selected[0];
  }

  /**
   * The ARIA role applied to the chip list.
   *
   * ARIA 的角色，应用于纸片列表中。
   *
   */
  @Input()
  get role(): string | null {
    if (this._explicitRole) {
      return this._explicitRole;
    }

    return this.empty ? null : 'listbox';
  }
  set role(role: string | null) {
    this._explicitRole = role;
  }
  private _explicitRole?: string | null;

  /**
   * Implemented as part of MatFormFieldControl.
   *
   * 作为 MatFormFieldControl 的一部分实现。
   *
   * @docs-private
   */
  @Input('aria-describedby') userAriaDescribedBy: string;

  /**
   * An object used to control when error messages are shown.
   *
   * 用于控制何时显示错误信息的对象。
   *
   */
  @Input() override errorStateMatcher: ErrorStateMatcher;

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
    this._syncChipsState();
  }
  private _multiple: boolean = false;

  /**
   * A function to compare the option values with the selected values. The first argument
   * is a value from an option. The second is a value from the selection. A boolean
   * should be returned.
   *
   * 用来比较选项值和当前选择的函数。第一个参数是选项的值，第二个选定的值。应该返回一个布尔值。
   *
   */
  @Input()
  get compareWith(): (o1: any, o2: any) => boolean {
    return this._compareWith;
  }
  set compareWith(fn: (o1: any, o2: any) => boolean) {
    this._compareWith = fn;
    if (this._selectionModel) {
      // A different comparator means the selection could change.
      this._initializeSelection();
    }
  }
  private _compareWith = (o1: any, o2: any) => o1 === o2;

  /**
   * Implemented as part of MatFormFieldControl.
   *
   * 作为 MatFormFieldControl 的一部分实现。
   *
   * @docs-private
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
   * Implemented as part of MatFormFieldControl.
   *
   * 作为 MatFormFieldControl 的一部分实现。
   *
   * @docs-private
   */
  get id(): string {
    return this._chipInput ? this._chipInput.id : this._uid;
  }

  /**
   * Implemented as part of MatFormFieldControl.
   *
   * 作为 MatFormFieldControl 的一部分实现。
   *
   * @docs-private
   */
  @Input()
  get required(): boolean {
    return this._required ?? this.ngControl?.control?.hasValidator(Validators.required) ?? false;
  }
  set required(value: BooleanInput) {
    this._required = coerceBooleanProperty(value);
    this.stateChanges.next();
  }
  protected _required: boolean | undefined;

  /**
   * Implemented as part of MatFormFieldControl.
   *
   * 作为 MatFormFieldControl 的一部分实现。
   *
   * @docs-private
   */
  @Input()
  get placeholder(): string {
    return this._chipInput ? this._chipInput.placeholder : this._placeholder;
  }
  set placeholder(value: string) {
    this._placeholder = value;
    this.stateChanges.next();
  }
  protected _placeholder: string;

  /**
   * Whether any chips or the matChipInput inside of this chip-list has focus.
   *
   * 这个纸片列表中是否存在任何拥有焦点的纸片或 matChipInput。
   *
   */
  get focused(): boolean {
    return (this._chipInput && this._chipInput.focused) || this._hasFocusedChip();
  }

  /**
   * Implemented as part of MatFormFieldControl.
   *
   * 作为 MatFormFieldControl 的一部分实现。
   *
   * @docs-private
   */
  get empty(): boolean {
    return (!this._chipInput || this._chipInput.empty) && (!this.chips || this.chips.length === 0);
  }

  /**
   * Implemented as part of MatFormFieldControl.
   *
   * 作为 MatFormFieldControl 的一部分实现。
   *
   * @docs-private
   */
  get shouldLabelFloat(): boolean {
    return !this.empty || this.focused;
  }

  /**
   * Implemented as part of MatFormFieldControl.
   *
   * 作为 MatFormFieldControl 的一部分实现。
   *
   * @docs-private
   */
  @Input()
  get disabled(): boolean {
    return this.ngControl ? !!this.ngControl.disabled : this._disabled;
  }
  set disabled(value: BooleanInput) {
    this._disabled = coerceBooleanProperty(value);
    this._syncChipsState();
  }
  protected _disabled: boolean = false;

  /**
   * Orientation of the chip list.
   *
   * 纸片列表的方向。
   *
   */
  @Input('aria-orientation') ariaOrientation: 'horizontal' | 'vertical' = 'horizontal';

  /**
   * Whether or not this chip list is selectable. When a chip list is not selectable,
   * the selected states for all the chips inside the chip list are always ignored.
   *
   * 这个纸片列表是否可以选择。当纸片列表不可选时，纸片列表中所有纸片的选定状态总会被忽略。
   *
   */
  @Input()
  get selectable(): boolean {
    return this._selectable;
  }
  set selectable(value: BooleanInput) {
    this._selectable = coerceBooleanProperty(value);
    this._syncChipsState();
  }
  protected _selectable: boolean = true;

  @Input()
  set tabIndex(value: number) {
    this._userTabIndex = value;
    this._tabIndex = value;
  }

  /**
   * Combined stream of all of the child chips' selection change events.
   *
   * 所有子纸片的选定状态更改事件的组合流。
   *
   */
  get chipSelectionChanges(): Observable<MatLegacyChipSelectionChange> {
    return merge(...this.chips.map(chip => chip.selectionChange));
  }

  /**
   * Combined stream of all of the child chips' focus change events.
   *
   * 所有子纸片的聚焦事件的组合流。
   *
   */
  get chipFocusChanges(): Observable<MatLegacyChipEvent> {
    return merge(...this.chips.map(chip => chip._onFocus));
  }

  /**
   * Combined stream of all of the child chips' blur change events.
   *
   * 所有子纸片的失焦事件的组合流。
   *
   */
  get chipBlurChanges(): Observable<MatLegacyChipEvent> {
    return merge(...this.chips.map(chip => chip._onBlur));
  }

  /**
   * Combined stream of all of the child chips' remove change events.
   *
   * 所有子纸片的删除事件的组合流。
   *
   */
  get chipRemoveChanges(): Observable<MatLegacyChipEvent> {
    return merge(...this.chips.map(chip => chip.destroyed));
  }

  /**
   * Event emitted when the selected chip list value has been changed by the user.
   *
   * 当纸片列表当前选择被用户改变时发出的事件。
   *
   */
  @Output() readonly change = new EventEmitter<MatLegacyChipListChange>();

  /**
   * Event that emits whenever the raw value of the chip-list changes. This is here primarily
   * to facilitate the two-way binding for the `value` input.
   *
   * 每当纸片列表的原始值发生变化时发出的事件。这里主要是为了方便进行输入框 `value` 的双向绑定。
   *
   * @docs-private
   */
  @Output() readonly valueChange = new EventEmitter<any>();

  /**
   * The chips contained within this chip list.
   *
   * 这个纸片列表中包含的纸片组件。
   *
   */
  @ContentChildren(MatLegacyChip, {
    // We need to use `descendants: true`, because Ivy will no longer match
    // indirect descendants if it's left as false.
    descendants: true,
  })
  chips: QueryList<MatLegacyChip>;

  constructor(
    protected _elementRef: ElementRef<HTMLElement>,
    private _changeDetectorRef: ChangeDetectorRef,
    @Optional() private _dir: Directionality,
    @Optional() _parentForm: NgForm,
    @Optional() _parentFormGroup: FormGroupDirective,
    _defaultErrorStateMatcher: ErrorStateMatcher,
    @Optional() @Self() ngControl: NgControl,
  ) {
    super(_defaultErrorStateMatcher, _parentForm, _parentFormGroup, ngControl);
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  ngAfterContentInit() {
    this._keyManager = new FocusKeyManager<MatLegacyChip>(this.chips)
      .withWrap()
      .withVerticalOrientation()
      .withHomeAndEnd()
      .withHorizontalOrientation(this._dir ? this._dir.value : 'ltr');

    if (this._dir) {
      this._dir.change
        .pipe(takeUntil(this._destroyed))
        .subscribe(dir => this._keyManager.withHorizontalOrientation(dir));
    }

    this._keyManager.tabOut.subscribe(() => this._allowFocusEscape());

    // When the list changes, re-subscribe
    this.chips.changes.pipe(startWith(null), takeUntil(this._destroyed)).subscribe(() => {
      if (this.disabled || !this.selectable) {
        // Since this happens after the content has been
        // checked, we need to defer it to the next tick.
        Promise.resolve().then(() => {
          this._syncChipsState();
        });
      }

      this._resetChips();

      // Reset chips selected/deselected status
      this._initializeSelection();

      // Check to see if we need to update our tab index
      this._updateTabIndex();

      // Check to see if we have a destroyed chip and need to refocus
      this._updateFocusForDestroyedChips();

      this.stateChanges.next();
    });
  }

  ngOnInit() {
    this._selectionModel = new SelectionModel<MatLegacyChip>(this.multiple, undefined, false);
    this.stateChanges.next();
  }

  ngDoCheck() {
    if (this.ngControl) {
      // We need to re-evaluate this on every change detection cycle, because there are some
      // error triggers that we can't subscribe to (e.g. parent form submissions). This means
      // that whatever logic is in here has to be super lean or we risk destroying the performance.
      this.updateErrorState();

      if (this.ngControl.disabled !== this._disabled) {
        this.disabled = !!this.ngControl.disabled;
      }
    }
  }

  ngOnDestroy() {
    this._keyManager?.destroy();
    this._destroyed.next();
    this._destroyed.complete();
    this.stateChanges.complete();
    this._dropSubscriptions();
  }

  /**
   * Associates an HTML input element with this chip list.
   *
   * 将 HTML 输入框元素与该纸片列表关联起来。
   *
   */
  registerInput(inputElement: MatLegacyChipTextControl): void {
    this._chipInput = inputElement;

    // We use this attribute to match the chip list to its input in test harnesses.
    // Set the attribute directly here to avoid "changed after checked" errors.
    this._elementRef.nativeElement.setAttribute('data-mat-chip-input', inputElement.id);
  }

  /**
   * Implemented as part of MatFormFieldControl.
   *
   * 作为 MatFormFieldControl 的一部分实现。
   *
   * @docs-private
   */
  setDescribedByIds(ids: string[]) {
    if (ids.length) {
      this._elementRef.nativeElement.setAttribute('aria-describedby', ids.join(' '));
    } else {
      this._elementRef.nativeElement.removeAttribute('aria-describedby');
    }
  }

  // Implemented as part of ControlValueAccessor.
  writeValue(value: any): void {
    if (this.chips) {
      this._setSelectionByValue(value, false);
    }
  }

  // Implemented as part of ControlValueAccessor.
  registerOnChange(fn: (value: any) => void): void {
    this._onChange = fn;
  }

  // Implemented as part of ControlValueAccessor.
  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }

  // Implemented as part of ControlValueAccessor.
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.stateChanges.next();
  }

  /**
   * Implemented as part of MatFormFieldControl.
   *
   * 作为 MatFormFieldControl 的一部分实现。
   *
   * @docs-private
   */
  onContainerClick(event: MouseEvent) {
    if (!this._originatesFromChip(event)) {
      this.focus();
    }
  }

  /**
   * Focuses the first non-disabled chip in this chip list, or the associated input when there
   * are no eligible chips.
   *
   * 让这个纸片列表中的第一个非禁用纸片获得焦点，或在没有合格纸片时让其关联输入框获得焦点。
   *
   */
  focus(options?: FocusOptions): void {
    if (this.disabled) {
      return;
    }

    // TODO: ARIA says this should focus the first `selected` chip if any are selected.
    // Focus on first element if there's no chipInput inside chip-list
    if (this._chipInput && this._chipInput.focused) {
      // do nothing
    } else if (this.chips.length > 0) {
      this._keyManager.setFirstItemActive();
      this.stateChanges.next();
    } else {
      this._focusInput(options);
      this.stateChanges.next();
    }
  }

  /**
   * Attempt to focus an input if we have one.
   *
   * 如果我们有输入框，就尝试聚焦输入框。
   *
   */
  _focusInput(options?: FocusOptions) {
    if (this._chipInput) {
      this._chipInput.focus(options);
    }
  }

  /**
   * Pass events to the keyboard manager. Available here for tests.
   *
   * 将事件传递给键盘管理器。可在此处进行测试。
   *
   */
  _keydown(event: KeyboardEvent) {
    const target = event.target as HTMLElement;

    if (target && target.classList.contains('mat-chip')) {
      this._keyManager.onKeydown(event);
      this.stateChanges.next();
    }
  }

  /**
   * Check the tab index as you should not be allowed to focus an empty list.
   *
   * 检查 tabindex ，因为不应允许你聚焦到空列表。
   *
   */
  protected _updateTabIndex(): void {
    // If we have 0 chips, we should not allow keyboard focus
    this._tabIndex = this._userTabIndex || (this.chips.length === 0 ? -1 : 0);
  }

  /**
   * If the amount of chips changed, we need to update the
   * key manager state and focus the next closest chip.
   *
   * 如果纸片数量发生变化，我们需要更新键盘管理器状态并聚焦到下一个最接近的纸片。
   *
   */
  protected _updateFocusForDestroyedChips() {
    // Move focus to the closest chip. If no other chips remain, focus the chip-list itself.
    if (this._lastDestroyedChipIndex != null) {
      if (this.chips.length) {
        const newChipIndex = Math.min(this._lastDestroyedChipIndex, this.chips.length - 1);
        this._keyManager.setActiveItem(newChipIndex);
      } else {
        this.focus();
      }
    }

    this._lastDestroyedChipIndex = null;
  }

  /**
   * Utility to ensure all indexes are valid.
   *
   * 确保所有索引有效的实用程序。
   *
   * @param index The index to be checked.
   *
   * 要检查的索引。
   *
   * @returns
   *
   * True if the index is valid for our list of chips.
   *
   * 如果此索引对我们的纸片列表有效，则为真。
   *
   */
  private _isValidIndex(index: number): boolean {
    return index >= 0 && index < this.chips.length;
  }

  _setSelectionByValue(value: any, isUserInput: boolean = true) {
    this._clearSelection();
    this.chips.forEach(chip => chip.deselect());

    if (Array.isArray(value)) {
      value.forEach(currentValue => this._selectValue(currentValue, isUserInput));
      this._sortValues();
    } else {
      const correspondingChip = this._selectValue(value, isUserInput);

      // Shift focus to the active item. Note that we shouldn't do this in multiple
      // mode, because we don't know what chip the user interacted with last.
      if (correspondingChip) {
        if (isUserInput) {
          this._keyManager.setActiveItem(correspondingChip);
        }
      }
    }
  }

  /**
   * Finds and selects the chip based on its value.
   * @returns Chip that has the corresponding value.
   */
  private _selectValue(value: any, isUserInput: boolean = true): MatLegacyChip | undefined {
    const correspondingChip = this.chips.find(chip => {
      return chip.value != null && this._compareWith(chip.value, value);
    });

    if (correspondingChip) {
      isUserInput ? correspondingChip.selectViaInteraction() : correspondingChip.select();
      this._selectionModel.select(correspondingChip);
    }

    return correspondingChip;
  }

  private _initializeSelection(): void {
    // Defer setting the value in order to avoid the "Expression
    // has changed after it was checked" errors from Angular.
    Promise.resolve().then(() => {
      if (this.ngControl || this._value) {
        this._setSelectionByValue(this.ngControl ? this.ngControl.value : this._value, false);
        this.stateChanges.next();
      }
    });
  }

  /**
   * Deselects every chip in the list.
   * @param skip Chip that should not be deselected.
   */
  private _clearSelection(skip?: MatLegacyChip): void {
    this._selectionModel.clear();
    this.chips.forEach(chip => {
      if (chip !== skip) {
        chip.deselect();
      }
    });
    this.stateChanges.next();
  }

  /**
   * Sorts the model values, ensuring that they keep the same
   * order that they have in the panel.
   */
  private _sortValues(): void {
    if (this._multiple) {
      this._selectionModel.clear();

      this.chips.forEach(chip => {
        if (chip.selected) {
          this._selectionModel.select(chip);
        }
      });
      this.stateChanges.next();
    }
  }

  /** Emits change event to set the model value. */
  private _propagateChanges(fallbackValue?: any): void {
    let valueToEmit: any = null;

    if (Array.isArray(this.selected)) {
      valueToEmit = this.selected.map(chip => chip.value);
    } else {
      valueToEmit = this.selected ? this.selected.value : fallbackValue;
    }
    this._value = valueToEmit;
    this.change.emit(new MatLegacyChipListChange(this, valueToEmit));
    this.valueChange.emit(valueToEmit);
    this._onChange(valueToEmit);
    this._changeDetectorRef.markForCheck();
  }

  /**
   * When blurred, mark the field as touched when focus moved outside the chip list.
   *
   * 失焦时，当焦点移出纸片列表时，将此字段标记为已接触。
   *
   */
  _blur() {
    if (!this._hasFocusedChip()) {
      this._keyManager.setActiveItem(-1);
    }

    if (!this.disabled) {
      if (this._chipInput) {
        // If there's a chip input, we should check whether the focus moved to chip input.
        // If the focus is not moved to chip input, mark the field as touched. If the focus moved
        // to chip input, do nothing.
        // Timeout is needed to wait for the focus() event trigger on chip input.
        setTimeout(() => {
          if (!this.focused) {
            this._markAsTouched();
          }
        });
      } else {
        // If there's no chip input, then mark the field as touched.
        this._markAsTouched();
      }
    }
  }

  /**
   * Mark the field as touched
   *
   * 将此字段标记为已接触
   *
   */
  _markAsTouched() {
    this._onTouched();
    this._changeDetectorRef.markForCheck();
    this.stateChanges.next();
  }

  /**
   * Removes the `tabindex` from the chip list and resets it back afterwards, allowing the
   * user to tab out of it. This prevents the list from capturing focus and redirecting
   * it back to the first chip, creating a focus trap, if it user tries to tab away.
   *
   * 从纸片列表中删除 `tabindex` 并在之后将其重置，允许用户从中切换。这可以防止列表捕获焦点并将其重定向回第一个纸片，从而在用户尝试离开时创建焦点陷阱。
   *
   */
  _allowFocusEscape() {
    if (this._tabIndex !== -1) {
      this._tabIndex = -1;

      setTimeout(() => {
        this._tabIndex = this._userTabIndex || 0;
        this._changeDetectorRef.markForCheck();
      });
    }
  }

  private _resetChips() {
    this._dropSubscriptions();
    this._listenToChipsFocus();
    this._listenToChipsSelection();
    this._listenToChipsRemoved();
  }

  private _dropSubscriptions() {
    if (this._chipFocusSubscription) {
      this._chipFocusSubscription.unsubscribe();
      this._chipFocusSubscription = null;
    }

    if (this._chipBlurSubscription) {
      this._chipBlurSubscription.unsubscribe();
      this._chipBlurSubscription = null;
    }

    if (this._chipSelectionSubscription) {
      this._chipSelectionSubscription.unsubscribe();
      this._chipSelectionSubscription = null;
    }

    if (this._chipRemoveSubscription) {
      this._chipRemoveSubscription.unsubscribe();
      this._chipRemoveSubscription = null;
    }
  }

  /** Listens to user-generated selection events on each chip. */
  private _listenToChipsSelection(): void {
    this._chipSelectionSubscription = this.chipSelectionChanges.subscribe(event => {
      event.source.selected
        ? this._selectionModel.select(event.source)
        : this._selectionModel.deselect(event.source);

      // For single selection chip list, make sure the deselected value is unselected.
      if (!this.multiple) {
        this.chips.forEach(chip => {
          if (!this._selectionModel.isSelected(chip) && chip.selected) {
            chip.deselect();
          }
        });
      }

      if (event.isUserInput) {
        this._propagateChanges();
      }
    });
  }

  /** Listens to user-generated selection events on each chip. */
  private _listenToChipsFocus(): void {
    this._chipFocusSubscription = this.chipFocusChanges.subscribe(event => {
      let chipIndex: number = this.chips.toArray().indexOf(event.chip);

      if (this._isValidIndex(chipIndex)) {
        this._keyManager.updateActiveItem(chipIndex);
      }
      this.stateChanges.next();
    });

    this._chipBlurSubscription = this.chipBlurChanges.subscribe(() => {
      this._blur();
      this.stateChanges.next();
    });
  }

  private _listenToChipsRemoved(): void {
    this._chipRemoveSubscription = this.chipRemoveChanges.subscribe(event => {
      const chip = event.chip;
      const chipIndex = this.chips.toArray().indexOf(event.chip);

      // In case the chip that will be removed is currently focused, we temporarily store
      // the index in order to be able to determine an appropriate sibling chip that will
      // receive focus.
      if (this._isValidIndex(chipIndex) && chip._hasFocus) {
        this._lastDestroyedChipIndex = chipIndex;
      }
    });
  }

  /**
   * Checks whether an event comes from inside a chip element.
   *
   * 检查事件是否来自纸片元素内部。
   *
   */
  private _originatesFromChip(event: Event): boolean {
    let currentElement = event.target as HTMLElement | null;

    while (currentElement && currentElement !== this._elementRef.nativeElement) {
      if (currentElement.classList.contains('mat-chip')) {
        return true;
      }

      currentElement = currentElement.parentElement;
    }

    return false;
  }

  /**
   * Checks whether any of the chips is focused.
   *
   * 检查是否有任何纸片拥有焦点。
   *
   */
  private _hasFocusedChip() {
    return this.chips && this.chips.some(chip => chip._hasFocus);
  }

  /** Syncs the list's state with the individual chips. */
  private _syncChipsState() {
    if (this.chips) {
      this.chips.forEach(chip => {
        chip._chipListDisabled = this._disabled;
        chip._chipListMultiple = this.multiple;
        chip.chipListSelectable = this._selectable;
      });
    }
  }
}
