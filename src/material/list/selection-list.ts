/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {FocusKeyManager} from '@angular/cdk/a11y';
import {BooleanInput, coerceBooleanProperty} from '@angular/cdk/coercion';
import {SelectionModel} from '@angular/cdk/collections';
import {A, ENTER, hasModifierKey, SPACE} from '@angular/cdk/keycodes';
import {_getFocusedElementPierceShadowDom} from '@angular/cdk/platform';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ContentChildren,
  ElementRef,
  EventEmitter,
  forwardRef,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  Output,
  QueryList,
  SimpleChanges,
  ViewEncapsulation,
} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {ThemePalette} from '@angular/material/core';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {MatListBase} from './list-base';
import {MatListOption, SELECTION_LIST, SelectionList} from './list-option';

export const MAT_SELECTION_LIST_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => MatSelectionList),
  multi: true,
};

/**
 * Change event that is being fired whenever the selected state of an option changes.
 *
 * 当选项的某个选定状态发生变化时，就会触发这个事件。
 *
 */
export class MatSelectionListChange {
  constructor(
    /**
     * Reference to the selection list that emitted the event.
     *
     * 到发出此事件的选择列表的引用。
     *
     */
    public source: MatSelectionList,
    /** Reference to the options that have been changed. */
    public options: MatListOption[],
  ) {}
}

@Component({
  selector: 'mat-selection-list',
  exportAs: 'matSelectionList',
  host: {
    'class': 'mat-mdc-selection-list mat-mdc-list-base mdc-list',
    'role': 'listbox',
    '[attr.aria-multiselectable]': 'multiple',
    '(keydown)': '_handleKeydown($event)',
  },
  template: '<ng-content></ng-content>',
  styleUrls: ['list.css'],
  encapsulation: ViewEncapsulation.None,
  providers: [
    MAT_SELECTION_LIST_VALUE_ACCESSOR,
    {provide: MatListBase, useExisting: MatSelectionList},
    {provide: SELECTION_LIST, useExisting: MatSelectionList},
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatSelectionList
  extends MatListBase
  implements SelectionList, ControlValueAccessor, AfterViewInit, OnChanges, OnDestroy
{
  private _initialized = false;
  private _keyManager: FocusKeyManager<MatListOption>;

  /** Emits when the list has been destroyed. */
  private _destroyed = new Subject<void>();

  /** Whether the list has been destroyed. */
  private _isDestroyed: boolean;

  /** View to model callback that should be called whenever the selected options change. */
  private _onChange: (value: any) => void = (_: any) => {};

  @ContentChildren(MatListOption, {descendants: true}) _items: QueryList<MatListOption>;

  /**
   * Emits a change event whenever the selected state of an option changes.
   *
   * 每当选项的选定状态发生变化时，就会发出一个 change 事件。
   *
   */
  @Output() readonly selectionChange: EventEmitter<MatSelectionListChange> =
    new EventEmitter<MatSelectionListChange>();

  /**
   * Theme color of the selection list. This sets the checkbox color for all list options.
   *
   * 选择列表的主题颜色。这会为所有列表中的选项设置复选框颜色。
   *
   */
  @Input() color: ThemePalette = 'accent';

  /**
   * Function used for comparing an option against the selected value when determining which
   * options should appear as selected. The first argument is the value of an options. The second
   * one is a value from the selected value. A boolean must be returned.
   *
   * 函数用于在确定哪些选项应该显示为选定状态时，比较一个选项和选定的值。第一个参数就是选项的值。第二个参数是选定值的值。必须返回一个布尔值。
   *
   */
  @Input() compareWith: (o1: any, o2: any) => boolean = (a1, a2) => a1 === a2;

  /**
   * Whether selection is limited to one or multiple items (default multiple).
   *
   * 选择是否限制到一个或多个条目（默认的多个）。
   *
   */
  @Input()
  get multiple(): boolean {
    return this._multiple;
  }
  set multiple(value: BooleanInput) {
    const newValue = coerceBooleanProperty(value);

    if (newValue !== this._multiple) {
      if ((typeof ngDevMode === 'undefined' || ngDevMode) && this._initialized) {
        throw new Error(
          'Cannot change `multiple` mode of mat-selection-list after initialization.',
        );
      }

      this._multiple = newValue;
      this.selectedOptions = new SelectionModel(this._multiple, this.selectedOptions.selected);
    }
  }
  private _multiple = true;

  /**
   * The currently selected options.
   *
   * 当前选定的选项。
   *
   */
  selectedOptions = new SelectionModel<MatListOption>(this._multiple);

  /**
   * Keeps track of the currently-selected value.
   *
   * 跟踪当前选定的值。
   *
   */
  _value: string[] | null;

  /**
   * View to model callback that should be called if the list or its options lost focus.
   *
   * 如果列表或其选项失去焦点，则应调用模型回调视图。
   *
   */
  _onTouched: () => void = () => {};

  constructor(public _element: ElementRef<HTMLElement>, private _ngZone: NgZone) {
    super();
    this._isNonInteractive = false;
  }

  ngAfterViewInit() {
    // Mark the selection list as initialized so that the `multiple`
    // binding can no longer be changed.
    this._initialized = true;
    this._setupRovingTabindex();

    // These events are bound outside the zone, because they don't change
    // any change-detected properties and they can trigger timeouts.
    this._ngZone.runOutsideAngular(() => {
      this._element.nativeElement.addEventListener('focusin', this._handleFocusin);
      this._element.nativeElement.addEventListener('focusout', this._handleFocusout);
    });

    if (this._value) {
      this._setOptionsFromValues(this._value);
    }

    this._watchForSelectionChange();
  }

  ngOnChanges(changes: SimpleChanges) {
    const disabledChanges = changes['disabled'];
    const disableRippleChanges = changes['disableRipple'];

    if (
      (disableRippleChanges && !disableRippleChanges.firstChange) ||
      (disabledChanges && !disabledChanges.firstChange)
    ) {
      this._markOptionsForCheck();
    }
  }

  ngOnDestroy() {
    this._keyManager?.destroy();
    this._element.nativeElement.removeEventListener('focusin', this._handleFocusin);
    this._element.nativeElement.removeEventListener('focusout', this._handleFocusout);
    this._destroyed.next();
    this._destroyed.complete();
    this._isDestroyed = true;
  }

  /**
   * Focuses the selection list.
   *
   * 让此选择列表获得焦点。
   *
   */
  focus(options?: FocusOptions) {
    this._element.nativeElement.focus(options);
  }

  /**
   * Selects all of the options. Returns the options that changed as a result.
   *
   * 选择所有选项。返回变化过的选项。
   *
   */
  selectAll(): MatListOption[] {
    return this._setAllOptionsSelected(true);
  }

  /**
   * Deselects all of the options. Returns the options that changed as a result.
   *
   * 取消选定所有选项。返回变化过的选项。
   *
   */
  deselectAll(): MatListOption[] {
    return this._setAllOptionsSelected(false);
  }

  /**
   * Reports a value change to the ControlValueAccessor
   *
   * 向 ControlValueAccessor 报告值已更改
   *
   */
  _reportValueChange() {
    // Stop reporting value changes after the list has been destroyed. This avoids
    // cases where the list might wrongly reset its value once it is removed, but
    // the form control is still live.
    if (this.options && !this._isDestroyed) {
      const value = this._getSelectedOptionValues();
      this._onChange(value);
      this._value = value;
    }
  }

  /**
   * Emits a change event if the selected state of an option changed.
   *
   * 如果选定的某个选项状态发生了变化，就会发出一个 change 事件。
   *
   */
  _emitChangeEvent(options: MatListOption[]) {
    this.selectionChange.emit(new MatSelectionListChange(this, options));
  }

  /**
   * Implemented as part of ControlValueAccessor.
   *
   *是 ControlValueAccessor 实现的一部分。
   *
   */
  writeValue(values: string[]): void {
    this._value = values;

    if (this.options) {
      this._setOptionsFromValues(values || []);
    }
  }

  /**
   * Implemented as a part of ControlValueAccessor.
   *
   *是 ControlValueAccessor 实现的一部分。
   *
   */
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  /**
   * Whether the *entire* selection list is disabled. When true, each list item is also disabled
   * and each list item is removed from the tab order (has tabindex="-1").
   *
   * 是否禁用*整个*选择列表。当为 true 时，每个列表项都会被禁用并且每个列表项都从 Tab 顺序中删除（有 tabindex="-1"）。
   *
   */
  @Input()
  override get disabled(): boolean {
    return this._selectionListDisabled;
  }
  override set disabled(value: BooleanInput) {
    // Update the disabled state of this list. Write to `this._selectionListDisabled` instead of
    // `super.disabled`. That is to avoid closure compiler compatibility issues with assigning to
    // a super property.
    this._selectionListDisabled = coerceBooleanProperty(value);
    if (this._selectionListDisabled) {
      this._keyManager?.setActiveItem(-1);
    }
  }
  private _selectionListDisabled = false;

  /**
   * Implemented as part of ControlValueAccessor.
   *
   * 作为 ControlValueAccessor 的一部分实现。
   *
   */
  registerOnChange(fn: (value: any) => void): void {
    this._onChange = fn;
  }

  /**
   * Implemented as part of ControlValueAccessor.
   *
   *是 ControlValueAccessor 实现的一部分。
   *
   */
  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }

  /** Watches for changes in the selected state of the options and updates the list accordingly. */
  private _watchForSelectionChange() {
    this.selectedOptions.changed.pipe(takeUntil(this._destroyed)).subscribe(event => {
      // Sync external changes to the model back to the options.
      for (let item of event.added) {
        item.selected = true;
      }

      for (let item of event.removed) {
        item.selected = false;
      }

      if (!this._containsFocus()) {
        this._resetActiveOption();
      }
    });
  }

  /** Sets the selected options based on the specified values. */
  private _setOptionsFromValues(values: string[]) {
    this.options.forEach(option => option._setSelected(false));

    values.forEach(value => {
      const correspondingOption = this.options.find(option => {
        // Skip options that are already in the model. This allows us to handle cases
        // where the same primitive value is selected multiple times.
        return option.selected ? false : this.compareWith(option.value, value);
      });

      if (correspondingOption) {
        correspondingOption._setSelected(true);
      }
    });
  }

  /**
   * Returns the values of the selected options.
   *
   * 返回选定的选项的值。
   *
   */
  private _getSelectedOptionValues(): string[] {
    return this.options.filter(option => option.selected).map(option => option.value);
  }

  /** Marks all the options to be checked in the next change detection run. */
  private _markOptionsForCheck() {
    if (this.options) {
      this.options.forEach(option => option._markForCheck());
    }
  }

  /**
   * Sets the selected state on all of the options
   * and emits an event if anything changed.
   *
   * 在所有选项上设置选定状态，并在发生任何变化时发出一个事件。
   *
   */
  private _setAllOptionsSelected(isSelected: boolean, skipDisabled?: boolean): MatListOption[] {
    // Keep track of whether anything changed, because we only want to
    // emit the changed event when something actually changed.
    const changedOptions: MatListOption[] = [];

    this.options.forEach(option => {
      if ((!skipDisabled || !option.disabled) && option._setSelected(isSelected)) {
        changedOptions.push(option);
      }
    });

    if (changedOptions.length) {
      this._reportValueChange();
    }

    return changedOptions;
  }

  // Note: This getter exists for backwards compatibility. The `_items` query list
  // cannot be named `options` as it will be picked up by the interactive list base.
  /**
   * The option components contained within this selection-list.
   *
   * 这个选择列表中包含的选项组件。
   *
   */
  get options(): QueryList<MatListOption> {
    return this._items;
  }

  /**
   * Handles keydown events within the list.
   *
   * 处理此列表中的按键事件。
   *
   */
  _handleKeydown(event: KeyboardEvent) {
    const activeItem = this._keyManager.activeItem;

    if (
      (event.keyCode === ENTER || event.keyCode === SPACE) &&
      !this._keyManager.isTyping() &&
      activeItem &&
      !activeItem.disabled
    ) {
      event.preventDefault();
      activeItem._toggleOnInteraction();
    } else if (
      event.keyCode === A &&
      this.multiple &&
      !this._keyManager.isTyping() &&
      hasModifierKey(event, 'ctrlKey')
    ) {
      const shouldSelect = this.options.some(option => !option.disabled && !option.selected);
      event.preventDefault();
      this._emitChangeEvent(this._setAllOptionsSelected(shouldSelect, true));
    } else {
      this._keyManager.onKeydown(event);
    }
  }

  /**
   * Handles focusout events within the list. \*
   * 从选择列表中删除 tabindex，然后重置它，以便允许用户跳出它。这会阻止该列表捕获焦点并将其重定向到列表中，如果用户试图离开它，就会创建一个焦点陷阱。
   *
   */
  private _handleFocusout = () => {
    // Focus takes a while to update so we have to wrap our call in a timeout.
    setTimeout(() => {
      if (!this._containsFocus()) {
        this._resetActiveOption();
      }
    });
  };

  /** Handles focusin events within the list. */
  private _handleFocusin = (event: FocusEvent) => {
    if (this.disabled) {
      return;
    }

    const activeIndex = this._items
      .toArray()
      .findIndex(item => item._elementRef.nativeElement.contains(event.target as HTMLElement));

    if (activeIndex > -1) {
      this._setActiveOption(activeIndex);
    } else {
      this._resetActiveOption();
    }
  };

  /**
   * Sets up the logic for maintaining the roving tabindex.
   *
   * `skipPredicate` determines if key manager should avoid putting a given list item in the tab
   * index. Allow disabled list items to receive focus to align with WAI ARIA recommendation.
   * Normally WAI ARIA's instructions are to exclude disabled items from the tab order, but it
   * makes a few exceptions for compound widgets.
   *
   * From [Developing a Keyboard Interface](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/):
   *   "For the following composite widget elements, keep them focusable when disabled: Options in a
   *   Listbox..."
   *
   */
  private _setupRovingTabindex() {
    this._keyManager = new FocusKeyManager(this._items)
      .withHomeAndEnd()
      .withTypeAhead()
      .withWrap()
      .skipPredicate(() => this.disabled);

    // Set the initial focus.
    this._resetActiveOption();

    // Move the tabindex to the currently-focused list item.
    this._keyManager.change.subscribe(activeItemIndex => this._setActiveOption(activeItemIndex));

    // If the active item is removed from the list, reset back to the first one.
    this._items.changes.pipe(takeUntil(this._destroyed)).subscribe(() => {
      const activeItem = this._keyManager.activeItem;

      if (!activeItem || !this._items.toArray().indexOf(activeItem)) {
        this._resetActiveOption();
      }
    });
  }

  /**
   * Sets an option as active.
   * @param index Index of the active option. If set to -1, no option will be active.
   */
  private _setActiveOption(index: number) {
    this._items.forEach((item, itemIndex) => item._setTabindex(itemIndex === index ? 0 : -1));
    this._keyManager.updateActiveItem(index);
  }

  /**
   * Resets the active option. When the list is disabled, remove all options from to the tab order.
   * Otherwise, focus the first selected option.
   */
  private _resetActiveOption() {
    if (this.disabled) {
      this._setActiveOption(-1);
      return;
    }

    const activeItem =
      this._items.find(item => item.selected && !item.disabled) || this._items.first;
    this._setActiveOption(activeItem ? this._items.toArray().indexOf(activeItem) : -1);
  }

  /** Returns whether the focus is currently within the list. */
  private _containsFocus() {
    const activeElement = _getFocusedElementPierceShadowDom();
    return activeElement && this._element.nativeElement.contains(activeElement);
  }
}
