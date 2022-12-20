/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  AfterContentInit,
  ChangeDetectorRef,
  ContentChildren,
  Directive,
  ElementRef,
  forwardRef,
  inject,
  Input,
  OnDestroy,
  Output,
  QueryList,
} from '@angular/core';
import {ActiveDescendantKeyManager, Highlightable, ListKeyManagerOption} from '@angular/cdk/a11y';
import {
  A,
  DOWN_ARROW,
  END,
  ENTER,
  hasModifierKey,
  HOME,
  LEFT_ARROW,
  RIGHT_ARROW,
  SPACE,
  UP_ARROW,
} from '@angular/cdk/keycodes';
import {BooleanInput, coerceArray, coerceBooleanProperty} from '@angular/cdk/coercion';
import {SelectionModel} from '@angular/cdk/collections';
import {defer, merge, Observable, Subject} from 'rxjs';
import {filter, map, startWith, switchMap, takeUntil} from 'rxjs/operators';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {Directionality} from '@angular/cdk/bidi';

/**
 * The next id to use for creating unique DOM IDs.
 *
 * 用于创建唯一 DOM ID 的下一个 ID。
 *
 */
let nextId = 0;

/**
 * An implementation of SelectionModel that internally always represents the selection as a
 * multi-selection. This is necessary so that we can recover the full selection if the user
 * switches the listbox from single-selection to multi-selection after initialization.
 *
 * SelectionModel 的一种实现，它在内部始终会将选定结果表示为多选形式。这是必要的，因为如果用户可能会在初始化后将列表框从单选切换到多选，这时我们可以借此恢复全部选定结果。
 *
 * This selection model may report multiple selected values, even if it is in single-selection
 * mode. It is up to the user (CdkListbox) to check for invalid selections.
 *
 * 此选择模型可能会报告多个选定结果，即使它处于单选模式也一样。如何检查无效选定结果取决于用户 (CdkListbox)。
 *
 */
class ListboxSelectionModel<T> extends SelectionModel<T> {
  constructor(
    public multiple = false,
    initiallySelectedValues?: T[],
    emitChanges = true,
    compareWith?: (o1: T, o2: T) => boolean,
  ) {
    super(true, initiallySelectedValues, emitChanges, compareWith);
  }

  override isMultipleSelection(): boolean {
    return this.multiple;
  }

  override select(...values: T[]) {
    // The super class is always in multi-selection mode, so we need to override the behavior if
    // this selection model actually belongs to a single-selection listbox.
    if (this.multiple) {
      return super.select(...values);
    } else {
      return super.setSelection(...values);
    }
  }
}

/**
 * A selectable option in a listbox.
 *
 * 列表框中的可选选项。
 *
 */
@Directive({
  selector: '[cdkOption]',
  standalone: true,
  exportAs: 'cdkOption',
  host: {
    'role': 'option',
    'class': 'cdk-option',
    '[id]': 'id',
    '[attr.aria-selected]': 'isSelected()',
    '[attr.tabindex]': '_getTabIndex()',
    '[attr.aria-disabled]': 'disabled',
    '[class.cdk-option-active]': 'isActive()',
    '(click)': '_clicked.next($event)',
    '(focus)': '_handleFocus()',
  },
})
export class CdkOption<T = unknown> implements ListKeyManagerOption, Highlightable, OnDestroy {
  /**
   * The id of the option's host element.
   *
   * 选项的宿主元素的 ID。
   *
   */
  @Input()
  get id() {
    return this._id || this._generatedId;
  }
  set id(value) {
    this._id = value;
  }
  private _id: string;
  private _generatedId = `cdk-option-${nextId++}`;

  /**
   * The value of this option.
   *
   * 此选项的值。
   *
   */
  @Input('cdkOption') value: T;

  /**
   * The text used to locate this item during listbox typeahead. If not specified,
   * the `textContent` of the item will be used.
   *
   * 用于在列表框预先输入（typeahead）期间定位此条目的文本。如果未指定，将使用条目的 `textContent` 。
   *
   */
  @Input('cdkOptionTypeaheadLabel') typeaheadLabel: string;

  /**
   * Whether this option is disabled.
   *
   * 该选项是否已禁用。
   *
   */
  @Input('cdkOptionDisabled')
  get disabled(): boolean {
    return this.listbox.disabled || this._disabled;
  }
  set disabled(value: BooleanInput) {
    this._disabled = coerceBooleanProperty(value);
  }
  private _disabled: boolean = false;

  /**
   * The tabindex of the option when it is enabled.
   *
   * 此选项启用时的 tabindex。
   *
   */
  @Input('tabindex')
  get enabledTabIndex() {
    return this._enabledTabIndex === undefined
      ? this.listbox.enabledTabIndex
      : this._enabledTabIndex;
  }
  set enabledTabIndex(value) {
    this._enabledTabIndex = value;
  }
  private _enabledTabIndex?: number | null;

  /**
   * The option's host element
   *
   * 此选项的宿主元素
   *
   */
  readonly element: HTMLElement = inject(ElementRef).nativeElement;

  /**
   * The parent listbox this option belongs to.
   *
   * 此选项所属的父列表框。
   *
   */
  protected readonly listbox: CdkListbox<T> = inject(CdkListbox);

  /**
   * Emits when the option is destroyed.
   *
   * 当销毁此选项时发出。
   *
   */
  protected destroyed = new Subject<void>();

  /**
   * Emits when the option is clicked.
   *
   * 当单击此选项时发出。
   *
   */
  readonly _clicked = new Subject<MouseEvent>();

  ngOnDestroy() {
    this.destroyed.next();
    this.destroyed.complete();
  }

  /**
   * Whether this option is selected.
   *
   * 是否选定了此选项。
   *
   */
  isSelected() {
    return this.listbox.isSelected(this);
  }

  /**
   * Whether this option is active.
   *
   * 此选项是否处于活动状态。
   *
   */
  isActive() {
    return this.listbox.isActive(this);
  }

  /**
   * Toggle the selected state of this option.
   *
   * 切换此选项的选定状态。
   *
   */
  toggle() {
    this.listbox.toggle(this);
  }

  /**
   * Select this option if it is not selected.
   *
   * 如果未选定此选项，就选定它。
   *
   */
  select() {
    this.listbox.select(this);
  }

  /**
   * Deselect this option if it is selected.
   *
   * 如果已选定此选项，就取消选定它。
   *
   */
  deselect() {
    this.listbox.deselect(this);
  }

  /**
   * Focus this option.
   *
   * 聚焦此选项。
   *
   */
  focus() {
    this.element.focus();
  }

  /**
   * Get the label for this element which is required by the FocusableOption interface.
   *
   * 获取 FocusableOption 接口所需的本元素的标签。
   *
   */
  getLabel() {
    return (this.typeaheadLabel ?? this.element.textContent?.trim()) || '';
  }

  /**
   * No-op implemented as a part of `Highlightable`.
   *
   * 作为 `Highlightable` 一部分的无操作（No-op）实现。
   *
   * @docs-private
   */
  setActiveStyles() {}

  /**
   * No-op implemented as a part of `Highlightable`.
   *
   * 作为 `Highlightable` 一部分的无操作（No-op）实现。
   *
   * @docs-private
   */
  setInactiveStyles() {}

  /**
   * Handle focus events on the option.
   *
   * 处理此选项上的焦点事件。
   *
   */
  protected _handleFocus() {
    // Options can wind up getting focused in active descendant mode if the user clicks on them.
    // In this case, we push focus back to the parent listbox to prevent an extra tab stop when
    // the user performs a shift+tab.
    if (this.listbox.useActiveDescendant) {
      this.listbox._setActiveOption(this);
      this.listbox.focus();
    }
  }

  /**
   * Get the tabindex for this option.
   *
   * 获取此选项的 tabindex。
   *
   */
  protected _getTabIndex() {
    if (this.listbox.useActiveDescendant || this.disabled) {
      return -1;
    }
    return this.isActive() ? this.enabledTabIndex : -1;
  }
}

@Directive({
  selector: '[cdkListbox]',
  standalone: true,
  exportAs: 'cdkListbox',
  host: {
    'role': 'listbox',
    'class': 'cdk-listbox',
    '[id]': 'id',
    '[attr.tabindex]': '_getTabIndex()',
    '[attr.aria-disabled]': 'disabled',
    '[attr.aria-multiselectable]': 'multiple',
    '[attr.aria-activedescendant]': '_getAriaActiveDescendant()',
    '[attr.aria-orientation]': 'orientation',
    '(focus)': '_handleFocus()',
    '(keydown)': '_handleKeydown($event)',
    '(focusout)': '_handleFocusOut($event)',
    '(focusin)': '_handleFocusIn()',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CdkListbox),
      multi: true,
    },
  ],
})
export class CdkListbox<T = unknown> implements AfterContentInit, OnDestroy, ControlValueAccessor {
  /**
   * The id of the option's host element.
   *
   * 选项的宿主元素的 ID。
   *
   */
  @Input()
  get id() {
    return this._id || this._generatedId;
  }
  set id(value) {
    this._id = value;
  }
  private _id: string;
  private _generatedId = `cdk-listbox-${nextId++}`;

  /**
   * The tabindex to use when the listbox is enabled.
   *
   * 启用此列表框时使用的 tabindex。
   *
   */
  @Input('tabindex')
  get enabledTabIndex() {
    return this._enabledTabIndex === undefined ? 0 : this._enabledTabIndex;
  }
  set enabledTabIndex(value) {
    this._enabledTabIndex = value;
  }
  private _enabledTabIndex?: number | null;

  /**
   * The value selected in the listbox, represented as an array of option values.
   *
   * 此列表框中选定的值，表示为选项值的数组。
   *
   */
  @Input('cdkListboxValue')
  get value(): readonly T[] {
    return this._invalid ? [] : this.selectionModel.selected;
  }
  set value(value: readonly T[]) {
    this._setSelection(value);
  }

  /**
   * Whether the listbox allows multiple options to be selected. If the value switches from `true`
   * to `false`, and more than one option is selected, all options are deselected.
   *
   * 此列表框是否允许选定多个选项。如果值从 `true` 切换为 `false` ，并且选定了多个选项，则取消选定所有选项。
   *
   */
  @Input('cdkListboxMultiple')
  get multiple(): boolean {
    return this.selectionModel.multiple;
  }
  set multiple(value: BooleanInput) {
    this.selectionModel.multiple = coerceBooleanProperty(value);

    if (this.options) {
      this._updateInternalValue();
    }
  }

  /**
   * Whether the listbox is disabled.
   *
   * 此列表框是否被禁用。
   *
   */
  @Input('cdkListboxDisabled')
  get disabled(): boolean {
    return this._disabled;
  }
  set disabled(value: BooleanInput) {
    this._disabled = coerceBooleanProperty(value);
  }
  private _disabled: boolean = false;

  /**
   * Whether the listbox will use active descendant or will move focus onto the options.
   *
   * 此列表框要使用活动后代还是将焦点移到选项上。
   *
   */
  @Input('cdkListboxUseActiveDescendant')
  get useActiveDescendant(): boolean {
    return this._useActiveDescendant;
  }
  set useActiveDescendant(shouldUseActiveDescendant: BooleanInput) {
    this._useActiveDescendant = coerceBooleanProperty(shouldUseActiveDescendant);
  }
  private _useActiveDescendant: boolean = false;

  /**
   * The orientation of the listbox. Only affects keyboard interaction, not visual layout.
   *
   * 此列表框的方向。只影响键盘交互，不影响视觉布局。
   *
   */
  @Input('cdkListboxOrientation')
  get orientation() {
    return this._orientation;
  }
  set orientation(value: 'horizontal' | 'vertical') {
    this._orientation = value === 'horizontal' ? 'horizontal' : 'vertical';
    if (value === 'horizontal') {
      this.listKeyManager?.withHorizontalOrientation(this._dir?.value || 'ltr');
    } else {
      this.listKeyManager?.withVerticalOrientation();
    }
  }
  private _orientation: 'horizontal' | 'vertical' = 'vertical';

  /**
   * The function used to compare option values.
   *
   * 用于比较选项值的函数。
   *
   */
  @Input('cdkListboxCompareWith')
  get compareWith(): undefined | ((o1: T, o2: T) => boolean) {
    return this.selectionModel.compareWith;
  }
  set compareWith(fn: undefined | ((o1: T, o2: T) => boolean)) {
    this.selectionModel.compareWith = fn;
  }

  /**
   * Whether the keyboard navigation should wrap when the user presses arrow down on the last item
   * or arrow up on the first item.
   *
   * 当用户在最后一个条目上按下向下箭头或在第一个条目上按下向上箭头时，键盘导航是否应该回绕。
   *
   */
  @Input('cdkListboxNavigationWrapDisabled')
  get navigationWrapDisabled() {
    return this._navigationWrapDisabled;
  }
  set navigationWrapDisabled(wrap: BooleanInput) {
    this._navigationWrapDisabled = coerceBooleanProperty(wrap);
    this.listKeyManager?.withWrap(!this._navigationWrapDisabled);
  }
  private _navigationWrapDisabled = false;

  /**
   * Whether keyboard navigation should skip over disabled items.
   *
   * 键盘导航是否应跳过禁用的条目。
   *
   */
  @Input('cdkListboxNavigatesDisabledOptions')
  get navigateDisabledOptions() {
    return this._navigateDisabledOptions;
  }
  set navigateDisabledOptions(skip: BooleanInput) {
    this._navigateDisabledOptions = coerceBooleanProperty(skip);
    this.listKeyManager?.skipPredicate(
      this._navigateDisabledOptions ? this._skipNonePredicate : this._skipDisabledPredicate,
    );
  }
  private _navigateDisabledOptions = false;

  /**
   * Emits when the selected value(s) in the listbox change.
   *
   * 当列表框中的选定值更改时发出。
   *
   */
  @Output('cdkListboxValueChange') readonly valueChange = new Subject<ListboxValueChangeEvent<T>>();

  /**
   * The child options in this listbox.
   *
   * 此列表框中的子选项。
   *
   */
  @ContentChildren(CdkOption, {descendants: true}) protected options: QueryList<CdkOption<T>>;

  /**
   * The selection model used by the listbox.
   *
   * 此列表框使用的选择模型。
   *
   */
  protected selectionModel = new ListboxSelectionModel<T>();

  /**
   * The key manager that manages keyboard navigation for this listbox.
   *
   * 管理此列表框的键盘导航的键盘管理器。
   *
   */
  protected listKeyManager: ActiveDescendantKeyManager<CdkOption<T>>;

  /**
   * Emits when the listbox is destroyed.
   *
   * 当销毁此列表框时发出。
   *
   */
  protected readonly destroyed = new Subject<void>();

  /**
   * The host element of the listbox.
   *
   * 此列表框的宿主元素。
   *
   */
  protected readonly element: HTMLElement = inject(ElementRef).nativeElement;

  /**
   * The change detector for this listbox.
   *
   * 此列表框的变更检测器。
   *
   */
  protected readonly changeDetectorRef = inject(ChangeDetectorRef);

  /** Whether the currently selected value in the selection model is invalid. */
  private _invalid = false;

  /** The last user-triggered option. */
  private _lastTriggered: CdkOption<T> | null = null;

  /** Callback called when the listbox has been touched */
  private _onTouched = () => {};

  /** Callback called when the listbox value changes */
  private _onChange: (value: readonly T[]) => void = () => {};

  /** Emits when an option has been clicked. */
  private _optionClicked = defer(() =>
    (this.options.changes as Observable<CdkOption<T>[]>).pipe(
      startWith(this.options),
      switchMap(options =>
        merge(...options.map(option => option._clicked.pipe(map(event => ({option, event}))))),
      ),
    ),
  );

  /** The directionality of the page. */
  private readonly _dir = inject(Directionality, {optional: true});

  /** A predicate that skips disabled options. */
  private readonly _skipDisabledPredicate = (option: CdkOption<T>) => option.disabled;

  /** A predicate that does not skip any options. */
  private readonly _skipNonePredicate = () => false;

  /** Whether the listbox currently has focus. */
  private _hasFocus = false;

  ngAfterContentInit() {
    if (typeof ngDevMode === 'undefined' || ngDevMode) {
      this._verifyNoOptionValueCollisions();
      this._verifyOptionValues();
    }

    this._initKeyManager();

    // Update the internal value whenever the options or the model value changes.
    merge(this.selectionModel.changed, this.options.changes)
      .pipe(startWith(null), takeUntil(this.destroyed))
      .subscribe(() => this._updateInternalValue());

    this._optionClicked
      .pipe(
        filter(({option}) => !option.disabled),
        takeUntil(this.destroyed),
      )
      .subscribe(({option, event}) => this._handleOptionClicked(option, event));
  }

  ngOnDestroy() {
    this.listKeyManager?.destroy();
    this.destroyed.next();
    this.destroyed.complete();
  }

  /**
   * Toggle the selected state of the given option.
   *
   * 切换给定选项的选定状态。
   *
   * @param option The option to toggle
   *
   * 要切换的选项
   *
   */
  toggle(option: CdkOption<T>) {
    this.toggleValue(option.value);
  }

  /**
   * Toggle the selected state of the given value.
   *
   * 切换给定值的选定状态。
   *
   * @param value The value to toggle
   *
   * 要切换的值
   *
   */
  toggleValue(value: T) {
    if (this._invalid) {
      this.selectionModel.clear(false);
    }
    this.selectionModel.toggle(value);
  }

  /**
   * Select the given option.
   *
   * 选定给定的选项。
   *
   * @param option The option to select
   *
   * 要选定的选项
   *
   */
  select(option: CdkOption<T>) {
    this.selectValue(option.value);
  }

  /**
   * Select the given value.
   *
   * 选定给定的值。
   *
   * @param value The value to select
   *
   * 要选定的值
   *
   */
  selectValue(value: T) {
    if (this._invalid) {
      this.selectionModel.clear(false);
    }
    this.selectionModel.select(value);
  }

  /**
   * Deselect the given option.
   *
   * 取消选择给定的选项。
   *
   * @param option The option to deselect
   *
   * 要取消选定的选项
   *
   */
  deselect(option: CdkOption<T>) {
    this.deselectValue(option.value);
  }

  /**
   * Deselect the given value.
   *
   * 取消选定给定的值。
   *
   * @param value The value to deselect
   *
   * 要取消选定的值
   *
   */
  deselectValue(value: T) {
    if (this._invalid) {
      this.selectionModel.clear(false);
    }
    this.selectionModel.deselect(value);
  }

  /**
   * Set the selected state of all options.
   *
   * 设置所有选项的选定状态。
   *
   * @param isSelected The new selected state to set
   *
   * 要设置的新选定状态
   *
   */
  setAllSelected(isSelected: boolean) {
    if (!isSelected) {
      this.selectionModel.clear();
    } else {
      if (this._invalid) {
        this.selectionModel.clear(false);
      }
      this.selectionModel.select(...this.options.map(option => option.value));
    }
  }

  /**
   * Get whether the given option is selected.
   *
   * 获取是否选定了给定的选项。
   *
   * @param option The option to get the selected state of
   *
   * 要获取选定状态的选项
   *
   */
  isSelected(option: CdkOption<T>) {
    return this.isValueSelected(option.value);
  }

  /**
   * Get whether the given option is active.
   *
   * 获取给定选项是否处于活动状态。
   *
   * @param option The option to get the active state of
   *
   * 要获取活动状态的选项
   *
   */
  isActive(option: CdkOption<T>): boolean {
    return !!(this.listKeyManager?.activeItem === option);
  }

  /**
   * Get whether the given value is selected.
   *
   * 获取给定值是否已选定。
   *
   * @param value The value to get the selected state of
   *
   * 要获取选定状态的值
   *
   */
  isValueSelected(value: T) {
    if (this._invalid) {
      return false;
    }
    return this.selectionModel.isSelected(value);
  }

  /**
   * Registers a callback to be invoked when the listbox's value changes from user input.
   *
   * 注册一个回调，当列表框的值因用户输入而改变时被调用。
   *
   * @param fn The callback to register
   *
   * 要注册的回调
   *
   * @docs-private
   */
  registerOnChange(fn: (value: readonly T[]) => void): void {
    this._onChange = fn;
  }

  /**
   * Registers a callback to be invoked when the listbox is blurred by the user.
   *
   * 注册一个回调，当列表框因为用户操作而失去焦点时调用。
   *
   * @param fn The callback to register
   *
   * 要注册的回调
   *
   * @docs-private
   */
  registerOnTouched(fn: () => {}): void {
    this._onTouched = fn;
  }

  /**
   * Sets the listbox's value.
   *
   * 设置列表框的值。
   *
   * @param value The new value of the listbox
   *
   * 此列表框的新值
   *
   * @docs-private
   */
  writeValue(value: readonly T[]): void {
    this._setSelection(value);
    this._verifyOptionValues();
  }

  /**
   * Sets the disabled state of the listbox.
   *
   * 设置此列表框的禁用状态。
   *
   * @param isDisabled The new disabled state
   *
   * 新的禁用状态
   *
   * @docs-private
   */
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  /**
   * Focus the listbox's host element.
   *
   * 聚焦此列表框的宿主元素。
   *
   */
  focus() {
    this.element.focus();
  }

  /**
   * Triggers the given option in response to user interaction.
   *
   * 触发给定选项以响应用户交互。
   *
   * - In single selection mode: selects the option and deselects any other selected option.
   *
   *   在单选模式下：选择此选项并取消选择任何其他选定的选项。
   *
   * - In multi selection mode: toggles the selected state of the option.
   *
   *   在多选模式下：切换此选项的选定状态。
   *
   * @param option The option to trigger
   *
   * 要触发的选项
   *
   */
  protected triggerOption(option: CdkOption<T> | null) {
    if (option && !option.disabled) {
      this._lastTriggered = option;
      const changed = this.multiple
        ? this.selectionModel.toggle(option.value)
        : this.selectionModel.select(option.value);
      if (changed) {
        this._onChange(this.value);
        this.valueChange.next({
          value: this.value,
          listbox: this,
          option: option,
        });
      }
    }
  }

  /**
   * Trigger the given range of options in response to user interaction.
   * Should only be called in multi-selection mode.
   *
   * 触发给定范围的选项以响应用户交互。只应在多选模式下调用。
   *
   * @param trigger The option that was triggered
   *
   * 触发过的选项
   *
   * @param from The start index of the options to toggle
   *
   * 要切换的选项的起始索引
   *
   * @param to The end index of the options to toggle
   *
   * 要切换的选项的结束索引
   *
   * @param on Whether to toggle the option range on
   *
   * 是否开启选项范围
   *
   */
  protected triggerRange(trigger: CdkOption<T> | null, from: number, to: number, on: boolean) {
    if (this.disabled || (trigger && trigger.disabled)) {
      return;
    }
    this._lastTriggered = trigger;
    const isEqual = this.compareWith ?? Object.is;
    const updateValues = [...this.options]
      .slice(Math.max(0, Math.min(from, to)), Math.min(this.options.length, Math.max(from, to) + 1))
      .filter(option => !option.disabled)
      .map(option => option.value);
    const selected = [...this.value];
    for (const updateValue of updateValues) {
      const selectedIndex = selected.findIndex(selectedValue =>
        isEqual(selectedValue, updateValue),
      );
      if (on && selectedIndex === -1) {
        selected.push(updateValue);
      } else if (!on && selectedIndex !== -1) {
        selected.splice(selectedIndex, 1);
      }
    }
    let changed = this.selectionModel.setSelection(...selected);
    if (changed) {
      this._onChange(this.value);
      this.valueChange.next({
        value: this.value,
        listbox: this,
        option: trigger,
      });
    }
  }

  /**
   * Sets the given option as active.
   *
   * 将给定的选项设置为活动的。
   *
   * @param option The option to make active
   *
   * 要激活的选项
   *
   */
  _setActiveOption(option: CdkOption<T>) {
    this.listKeyManager.setActiveItem(option);
  }

  /**
   * Called when the listbox receives focus.
   *
   * 当此列表框获得焦点时调用。
   *
   */
  protected _handleFocus() {
    if (!this.useActiveDescendant) {
      if (this.selectionModel.selected.length > 0) {
        this._setNextFocusToSelectedOption();
      } else {
        this.listKeyManager.setNextItemActive();
      }

      this._focusActiveOption();
    }
  }

  /**
   * Called when the user presses keydown on the listbox.
   *
   * 当用户按下列表框上的按键时调用。
   *
   */
  protected _handleKeydown(event: KeyboardEvent) {
    if (this._disabled) {
      return;
    }

    const {keyCode} = event;
    const previousActiveIndex = this.listKeyManager.activeItemIndex;
    const ctrlKeys = ['ctrlKey', 'metaKey'] as const;

    if (this.multiple && keyCode === A && hasModifierKey(event, ...ctrlKeys)) {
      // Toggle all options off if they're all selected, otherwise toggle them all on.
      this.triggerRange(
        null,
        0,
        this.options.length - 1,
        this.options.length !== this.value.length,
      );
      event.preventDefault();
      return;
    }

    if (
      this.multiple &&
      (keyCode === SPACE || keyCode === ENTER) &&
      hasModifierKey(event, 'shiftKey')
    ) {
      if (this.listKeyManager.activeItem && this.listKeyManager.activeItemIndex != null) {
        this.triggerRange(
          this.listKeyManager.activeItem,
          this._getLastTriggeredIndex() ?? this.listKeyManager.activeItemIndex,
          this.listKeyManager.activeItemIndex,
          !this.listKeyManager.activeItem.isSelected(),
        );
      }
      event.preventDefault();
      return;
    }

    if (
      this.multiple &&
      keyCode === HOME &&
      hasModifierKey(event, ...ctrlKeys) &&
      hasModifierKey(event, 'shiftKey')
    ) {
      const trigger = this.listKeyManager.activeItem;
      if (trigger) {
        const from = this.listKeyManager.activeItemIndex!;
        this.listKeyManager.setFirstItemActive();
        this.triggerRange(
          trigger,
          from,
          this.listKeyManager.activeItemIndex!,
          !trigger.isSelected(),
        );
      }
      event.preventDefault();
      return;
    }

    if (
      this.multiple &&
      keyCode === END &&
      hasModifierKey(event, ...ctrlKeys) &&
      hasModifierKey(event, 'shiftKey')
    ) {
      const trigger = this.listKeyManager.activeItem;
      if (trigger) {
        const from = this.listKeyManager.activeItemIndex!;
        this.listKeyManager.setLastItemActive();
        this.triggerRange(
          trigger,
          from,
          this.listKeyManager.activeItemIndex!,
          !trigger.isSelected(),
        );
      }
      event.preventDefault();
      return;
    }

    if (keyCode === SPACE || keyCode === ENTER) {
      this.triggerOption(this.listKeyManager.activeItem);
      event.preventDefault();
      return;
    }

    const isNavKey =
      keyCode === UP_ARROW ||
      keyCode === DOWN_ARROW ||
      keyCode === LEFT_ARROW ||
      keyCode === RIGHT_ARROW ||
      keyCode === HOME ||
      keyCode === END;
    this.listKeyManager.onKeydown(event);
    // Will select an option if shift was pressed while navigating to the option
    if (isNavKey && event.shiftKey && previousActiveIndex !== this.listKeyManager.activeItemIndex) {
      this.triggerOption(this.listKeyManager.activeItem);
    }
  }

  /**
   * Called when a focus moves into the listbox.
   *
   * 当焦点移入列表框时调用。
   *
   */
  protected _handleFocusIn() {
    // Note that we use a `focusin` handler for this instead of the existing `focus` handler,
    // because focus won't land on the listbox if `useActiveDescendant` is enabled.
    this._hasFocus = true;
  }

  /**
   * Called when the focus leaves an element in the listbox.
   *
   * 当焦点离开列表框中的元素时调用。
   *
   * @param event The focusout event
   *
   * 焦点移出（focusout）事件
   *
   */
  protected _handleFocusOut(event: FocusEvent) {
    const otherElement = event.relatedTarget as Element;
    if (this.element !== otherElement && !this.element.contains(otherElement)) {
      this._onTouched();
      this._hasFocus = false;
      this._setNextFocusToSelectedOption();
    }
  }

  /**
   * Get the id of the active option if active descendant is being used.
   *
   * 如果正在使用活动后代，则获取此活动选项的 ID。
   *
   */
  protected _getAriaActiveDescendant(): string | null | undefined {
    return this._useActiveDescendant ? this.listKeyManager?.activeItem?.id : null;
  }

  /**
   * Get the tabindex for the listbox.
   *
   * 获取此列表框的 tabindex。
   *
   */
  protected _getTabIndex() {
    if (this.disabled) {
      return -1;
    }
    return this.useActiveDescendant || !this.listKeyManager.activeItem ? this.enabledTabIndex : -1;
  }

  /** Initialize the key manager. */
  private _initKeyManager() {
    this.listKeyManager = new ActiveDescendantKeyManager(this.options)
      .withWrap(!this._navigationWrapDisabled)
      .withTypeAhead()
      .withHomeAndEnd()
      .withAllowedModifierKeys(['shiftKey'])
      .skipPredicate(
        this._navigateDisabledOptions ? this._skipNonePredicate : this._skipDisabledPredicate,
      );

    if (this.orientation === 'vertical') {
      this.listKeyManager.withVerticalOrientation();
    } else {
      this.listKeyManager.withHorizontalOrientation(this._dir?.value || 'ltr');
    }

    if (this.selectionModel.selected.length) {
      Promise.resolve().then(() => this._setNextFocusToSelectedOption());
    }

    this.listKeyManager.change.subscribe(() => this._focusActiveOption());
  }

  /** Focus the active option. */
  private _focusActiveOption() {
    if (!this.useActiveDescendant) {
      this.listKeyManager.activeItem?.focus();
    }
    this.changeDetectorRef.markForCheck();
  }

  /**
   * Set the selected values.
   * @param value The list of new selected values.
   */
  private _setSelection(value: readonly T[]) {
    if (this._invalid) {
      this.selectionModel.clear(false);
    }
    this.selectionModel.setSelection(...this._coerceValue(value));

    if (!this._hasFocus) {
      this._setNextFocusToSelectedOption();
    }
  }

  /** Sets the first selected option as first in the keyboard focus order. */
  private _setNextFocusToSelectedOption() {
    // Null check the options since they only get defined after `ngAfterContentInit`.
    const selected = this.options?.find(option => option.isSelected());

    if (selected) {
      this.listKeyManager.updateActiveItem(selected);
    }
  }

  /** Update the internal value of the listbox based on the selection model. */
  private _updateInternalValue() {
    const indexCache = new Map<T, number>();
    this.selectionModel.sort((a: T, b: T) => {
      const aIndex = this._getIndexForValue(indexCache, a);
      const bIndex = this._getIndexForValue(indexCache, b);
      return aIndex - bIndex;
    });
    const selected = this.selectionModel.selected;
    this._invalid =
      (!this.multiple && selected.length > 1) || !!this._getInvalidOptionValues(selected).length;
    this.changeDetectorRef.markForCheck();
  }

  /**
   * Gets the index of the given value in the given list of options.
   * @param cache The cache of indices found so far
   * @param value The value to find
   * @return The index of the value in the options list
   */
  private _getIndexForValue(cache: Map<T, number>, value: T) {
    const isEqual = this.compareWith || Object.is;
    if (!cache.has(value)) {
      let index = -1;
      for (let i = 0; i < this.options.length; i++) {
        if (isEqual(value, this.options.get(i)!.value)) {
          index = i;
          break;
        }
      }
      cache.set(value, index);
    }
    return cache.get(value)!;
  }

  /**
   * Handle the user clicking an option.
   * @param option The option that was clicked.
   */
  private _handleOptionClicked(option: CdkOption<T>, event: MouseEvent) {
    event.preventDefault();
    this.listKeyManager.setActiveItem(option);
    if (event.shiftKey && this.multiple) {
      this.triggerRange(
        option,
        this._getLastTriggeredIndex() ?? this.listKeyManager.activeItemIndex!,
        this.listKeyManager.activeItemIndex!,
        !option.isSelected(),
      );
    } else {
      this.triggerOption(option);
    }
  }

  /** Verifies that no two options represent the same value under the compareWith function. */
  private _verifyNoOptionValueCollisions() {
    this.options.changes.pipe(startWith(this.options), takeUntil(this.destroyed)).subscribe(() => {
      const isEqual = this.compareWith ?? Object.is;
      for (let i = 0; i < this.options.length; i++) {
        const option = this.options.get(i)!;
        let duplicate: CdkOption<T> | null = null;
        for (let j = i + 1; j < this.options.length; j++) {
          const other = this.options.get(j)!;
          if (isEqual(option.value, other.value)) {
            duplicate = other;
            break;
          }
        }
        if (duplicate) {
          // TODO(mmalerba): Link to docs about this.
          if (this.compareWith) {
            console.warn(
              `Found multiple CdkOption representing the same value under the given compareWith function`,
              {
                option1: option.element,
                option2: duplicate.element,
                compareWith: this.compareWith,
              },
            );
          } else {
            console.warn(`Found multiple CdkOption with the same value`, {
              option1: option.element,
              option2: duplicate.element,
            });
          }
          return;
        }
      }
    });
  }

  /** Verifies that the option values are valid. */
  private _verifyOptionValues() {
    if (this.options && (typeof ngDevMode === 'undefined' || ngDevMode)) {
      const selected = this.selectionModel.selected;
      const invalidValues = this._getInvalidOptionValues(selected);

      if (!this.multiple && selected.length > 1) {
        throw Error('Listbox cannot have more than one selected value in multi-selection mode.');
      }

      if (invalidValues.length) {
        throw Error('Listbox has selected values that do not match any of its options.');
      }
    }
  }

  /**
   * Coerces a value into an array representing a listbox selection.
   * @param value The value to coerce
   * @return An array
   */
  private _coerceValue(value: readonly T[]) {
    return value == null ? [] : coerceArray(value);
  }

  /**
   * Get the sublist of values that do not represent valid option values in this listbox.
   * @param values The list of values
   * @return The sublist of values that are not valid option values
   */
  private _getInvalidOptionValues(values: readonly T[]) {
    const isEqual = this.compareWith || Object.is;
    const validValues = (this.options || []).map(option => option.value);
    return values.filter(value => !validValues.some(validValue => isEqual(value, validValue)));
  }

  /** Get the index of the last triggered option. */
  private _getLastTriggeredIndex() {
    const index = this.options.toArray().indexOf(this._lastTriggered!);
    return index === -1 ? null : index;
  }
}

/**
 * Change event that is fired whenever the value of the listbox changes.
 *
 * change 事件，当列表框的值改变时触发。
 *
 */
export interface ListboxValueChangeEvent<T> {
  /**
   * The new value of the listbox.
   *
   * 此列表框的新值。
   *
   */
  readonly value: readonly T[];

  /**
   * Reference to the listbox that emitted the event.
   *
   * 对发出本事件的列表框的引用。
   *
   */
  readonly listbox: CdkListbox<T>;

  /**
   * Reference to the option that was triggered.
   *
   * 对触发过的选项的引用。
   *
   */
  readonly option: CdkOption<T> | null;
}
