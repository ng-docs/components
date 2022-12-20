/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {FocusMonitor} from '@angular/cdk/a11y';
import {BooleanInput, coerceBooleanProperty} from '@angular/cdk/coercion';
import {SelectionModel} from '@angular/cdk/collections';
import {
  AfterContentInit,
  Attribute,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChildren,
  Directive,
  ElementRef,
  EventEmitter,
  forwardRef,
  Input,
  OnDestroy,
  OnInit,
  Optional,
  Output,
  QueryList,
  ViewChild,
  ViewEncapsulation,
  InjectionToken,
  Inject,
  AfterViewInit,
} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {CanDisableRipple, mixinDisableRipple} from '@angular/material/core';
/**
 *
 * @deprecated No longer used.
 *
 * 不再使用了。
 *
 * @breaking-change 11.0.0
 */
export type ToggleType = 'checkbox' | 'radio';

/**
 * Possible appearance styles for the button toggle.
 *
 * 按钮开关可能的外观样式。
 *
 */
export type MatButtonToggleAppearance = 'legacy' | 'standard';

/**
 * Represents the default options for the button toggle that can be configured
 * using the `MAT_BUTTON_TOGGLE_DEFAULT_OPTIONS` injection token.
 *
 * 表示按钮开关的默认选项，可用 `MAT_BUTTON_TOGGLE_DEFAULT_OPTIONS` 注入令牌进行配置。
 *
 */
export interface MatButtonToggleDefaultOptions {
  /**
   * Default appearance to be used by button toggles. Can be overridden by explicitly
   * setting an appearance on a button toggle or group.
   *
   * 切换按钮使用的默认外观。可以通过在切换按钮或组上显式设置外观来覆盖。
   *
   */
  appearance?: MatButtonToggleAppearance;
}

/**
 * Injection token that can be used to configure the
 * default options for all button toggles within an app.
 *
 * 注入令牌，可以用来配置应用中所有按钮开关的默认选项。
 *
 */
export const MAT_BUTTON_TOGGLE_DEFAULT_OPTIONS = new InjectionToken<MatButtonToggleDefaultOptions>(
  'MAT_BUTTON_TOGGLE_DEFAULT_OPTIONS',
);

/**
 * Injection token that can be used to reference instances of `MatButtonToggleGroup`.
 * It serves as alternative token to the actual `MatButtonToggleGroup` class which
 * could cause unnecessary retention of the class and its component metadata.
 *
 * 这个注入令牌可以用来引用 `MatButtonToggleGroup` 实例。它可以作为实际 `MatButtonToggleGroup` 类的备用令牌，使用实际类会导致无法优化不必要的类及其组件元数据。
 *
 */
export const MAT_BUTTON_TOGGLE_GROUP = new InjectionToken<MatButtonToggleGroup>(
  'MatButtonToggleGroup',
);

/**
 * Provider Expression that allows mat-button-toggle-group to register as a ControlValueAccessor.
 * This allows it to support [(ngModel)].
 *
 * 这个注入表达式可以让 mat-button-toggle-group 注册为 ControlValueAccessor。这样它就能支持 `[(ngModel)]` 了。
 *
 * @docs-private
 */
export const MAT_BUTTON_TOGGLE_GROUP_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => MatButtonToggleGroup),
  multi: true,
};

// Counter used to generate unique IDs.
let uniqueIdCounter = 0;

/**
 * Change event object emitted by button toggle.
 *
 * MatButtonToggle 发出的变更事件对象。
 *
 */
export class MatButtonToggleChange {
  constructor(
    /**
     * The button toggle that emits the event.
     *
     * 发出此事件的 MatButtonToggle。
     */
    public source: MatButtonToggle,

    /**
     * The value assigned to the button toggle.
     *
     * 赋值给此 MatButtonToggle 的值。
     */
    public value: any,
  ) {}
}

/**
 * Exclusive selection button toggle group that behaves like a radio-button group.
 *
 * 排他性按钮开关组的行为类似于单选按钮组。
 *
 */
@Directive({
  selector: 'mat-button-toggle-group',
  providers: [
    MAT_BUTTON_TOGGLE_GROUP_VALUE_ACCESSOR,
    {provide: MAT_BUTTON_TOGGLE_GROUP, useExisting: MatButtonToggleGroup},
  ],
  host: {
    'role': 'group',
    'class': 'mat-button-toggle-group',
    '[attr.aria-disabled]': 'disabled',
    '[class.mat-button-toggle-vertical]': 'vertical',
    '[class.mat-button-toggle-group-appearance-standard]': 'appearance === "standard"',
  },
  exportAs: 'matButtonToggleGroup',
})
export class MatButtonToggleGroup implements ControlValueAccessor, OnInit, AfterContentInit {
  private _vertical = false;
  private _multiple = false;
  private _disabled = false;
  private _selectionModel: SelectionModel<MatButtonToggle>;

  /**
   * Reference to the raw value that the consumer tried to assign. The real
   * value will exclude any values from this one that don't correspond to a
   * toggle. Useful for the cases where the value is assigned before the toggles
   * have been initialized or at the same that they're being swapped out.
   *
   * 指向消费者试图赋值的原始值的引用。其实际值会排除那些无法与开关对应的值。适用于要在初始化开关之前赋值的情况，或者它们同时被关闭的情况。
   *
   */
  private _rawValue: any;

  /**
   * The method to be called in order to update ngModel.
   * Now `ngModel` binding is not supported in multiple selection mode.
   *
   * 为了更新 ngModel 而要调用的方法。目前在多选模式下尚不支持 `ngModel`
   *
   */
  _controlValueAccessorChangeFn: (value: any) => void = () => {};

  /**
   * onTouch function registered via registerOnTouch (ControlValueAccessor).
   *
   * 通过 ControlValueAccessor 的 registerOnTouch 注册的 onTouch 函数。
   *
   */
  _onTouched: () => any = () => {};

  /**
   * Child button toggle buttons.
   *
   * 当前组件的子按钮开关。
   *
   */
  @ContentChildren(forwardRef(() => MatButtonToggle), {
    // Note that this would technically pick up toggles
    // from nested groups, but that's not a case that we support.
    descendants: true,
  })
  _buttonToggles: QueryList<MatButtonToggle>;

  /**
   * The appearance for all the buttons in the group.
   *
   * 该组中所有按钮的外观。
   *
   */
  @Input() appearance: MatButtonToggleAppearance;

  /**
   * `name` attribute for the underlying `input` element.
   *
   * 底层 `input` 元素的 `name` 属性。
   *
   */
  @Input()
  get name(): string {
    return this._name;
  }
  set name(value: string) {
    this._name = value;
    this._markButtonsForCheck();
  }
  private _name = `mat-button-toggle-group-${uniqueIdCounter++}`;

  /**
   * Whether the toggle group is vertical.
   *
   * 开关组是否为垂直的。
   *
   */
  @Input()
  get vertical(): boolean {
    return this._vertical;
  }
  set vertical(value: BooleanInput) {
    this._vertical = coerceBooleanProperty(value);
  }

  /**
   * Value of the toggle group.
   *
   * 开关组的值。
   *
   */
  @Input()
  get value(): any {
    const selected = this._selectionModel ? this._selectionModel.selected : [];

    if (this.multiple) {
      return selected.map(toggle => toggle.value);
    }

    return selected[0] ? selected[0].value : undefined;
  }
  set value(newValue: any) {
    this._setSelectionByValue(newValue);
    this.valueChange.emit(this.value);
  }

  /**
   * Event that emits whenever the value of the group changes.
   * Used to facilitate two-way data binding.
   *
   * 每当组的值发生变化就会发出的事件。用来方便进行双向数据绑定。
   *
   * @docs-private
   */
  @Output() readonly valueChange = new EventEmitter<any>();

  /**
   * Selected button toggles in the group.
   *
   * 本组中选定的按钮开关。
   *
   */
  get selected(): MatButtonToggle | MatButtonToggle[] {
    const selected = this._selectionModel ? this._selectionModel.selected : [];
    return this.multiple ? selected : selected[0] || null;
  }

  /**
   * Whether multiple button toggles can be selected.
   *
   * 是否可以选择多个按钮开关。
   *
   */
  @Input()
  get multiple(): boolean {
    return this._multiple;
  }
  set multiple(value: BooleanInput) {
    this._multiple = coerceBooleanProperty(value);
    this._markButtonsForCheck();
  }

  /**
   * Whether multiple button toggle group is disabled.
   *
   * 是否禁用了多按钮开关组。
   *
   */
  @Input()
  get disabled(): boolean {
    return this._disabled;
  }
  set disabled(value: BooleanInput) {
    this._disabled = coerceBooleanProperty(value);
    this._markButtonsForCheck();
  }

  /**
   * Event emitted when the group's value changes.
   *
   * 当组的值发生变化时会发出本事件。
   *
   */
  @Output() readonly change: EventEmitter<MatButtonToggleChange> =
    new EventEmitter<MatButtonToggleChange>();

  constructor(
    private _changeDetector: ChangeDetectorRef,
    @Optional()
    @Inject(MAT_BUTTON_TOGGLE_DEFAULT_OPTIONS)
    defaultOptions?: MatButtonToggleDefaultOptions,
  ) {
    this.appearance =
      defaultOptions && defaultOptions.appearance ? defaultOptions.appearance : 'standard';
  }

  ngOnInit() {
    this._selectionModel = new SelectionModel<MatButtonToggle>(this.multiple, undefined, false);
  }

  ngAfterContentInit() {
    this._selectionModel.select(...this._buttonToggles.filter(toggle => toggle.checked));
  }

  /**
   * Sets the model value. Implemented as part of ControlValueAccessor.
   *
   * 设置模型值。作为 ControlValueAccessor 实现的一部分。
   *
   * @param value Value to be set to the model.
   *
   * 要设置为模型的值。
   *
   */
  writeValue(value: any) {
    this.value = value;
    this._changeDetector.markForCheck();
  }

  // Implemented as part of ControlValueAccessor.
  registerOnChange(fn: (value: any) => void) {
    this._controlValueAccessorChangeFn = fn;
  }

  // Implemented as part of ControlValueAccessor.
  registerOnTouched(fn: any) {
    this._onTouched = fn;
  }

  // Implemented as part of ControlValueAccessor.
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  /**
   * Dispatch change event with current selection and group value.
   *
   * 使用当前选定的值和组的值派发 change 事件。
   *
   */
  _emitChangeEvent(toggle: MatButtonToggle): void {
    const event = new MatButtonToggleChange(toggle, this.value);
    this._controlValueAccessorChangeFn(event.value);
    this.change.emit(event);
  }

  /**
   * Syncs a button toggle's selected state with the model value.
   *
   * 使用模型值同步一个按钮开关的选定状态。
   *
   * @param toggle Toggle to be synced.
   *
   * 要同步的开关。
   *
   * @param select Whether the toggle should be selected.
   *
   * 是否应该选定此开关。
   *
   * @param isUserInput Whether the change was a result of a user interaction.
   *
   * 这些变化是否用户交互的结果。
   *
   * @param deferEvents Whether to defer emitting the change events.
   *
   * 是否要推迟发布各种变更事件。
   *
   */
  _syncButtonToggle(
    toggle: MatButtonToggle,
    select: boolean,
    isUserInput = false,
    deferEvents = false,
  ) {
    // Deselect the currently-selected toggle, if we're in single-selection
    // mode and the button being toggled isn't selected at the moment.
    if (!this.multiple && this.selected && !toggle.checked) {
      (this.selected as MatButtonToggle).checked = false;
    }

    if (this._selectionModel) {
      if (select) {
        this._selectionModel.select(toggle);
      } else {
        this._selectionModel.deselect(toggle);
      }
    } else {
      deferEvents = true;
    }

    // We need to defer in some cases in order to avoid "changed after checked errors", however
    // the side-effect is that we may end up updating the model value out of sequence in others
    // The `deferEvents` flag allows us to decide whether to do it on a case-by-case basis.
    if (deferEvents) {
      Promise.resolve().then(() => this._updateModelValue(toggle, isUserInput));
    } else {
      this._updateModelValue(toggle, isUserInput);
    }
  }

  /**
   * Checks whether a button toggle is selected.
   *
   * 检查是否选定了某个按钮开关。
   *
   */
  _isSelected(toggle: MatButtonToggle) {
    return this._selectionModel && this._selectionModel.isSelected(toggle);
  }

  /**
   * Determines whether a button toggle should be checked on init.
   *
   * 确定是否应该在初始化时检查按钮开关。
   *
   */
  _isPrechecked(toggle: MatButtonToggle) {
    if (typeof this._rawValue === 'undefined') {
      return false;
    }

    if (this.multiple && Array.isArray(this._rawValue)) {
      return this._rawValue.some(value => toggle.value != null && value === toggle.value);
    }

    return toggle.value === this._rawValue;
  }

  /**
   * Updates the selection state of the toggles in the group based on a value.
   *
   * 根据某个值更新组中各个开关的选定状态。
   *
   */
  private _setSelectionByValue(value: any | any[]) {
    this._rawValue = value;

    if (!this._buttonToggles) {
      return;
    }

    if (this.multiple && value) {
      if (!Array.isArray(value) && (typeof ngDevMode === 'undefined' || ngDevMode)) {
        throw Error('Value must be an array in multiple-selection mode.');
      }

      this._clearSelection();
      value.forEach((currentValue: any) => this._selectValue(currentValue));
    } else {
      this._clearSelection();
      this._selectValue(value);
    }
  }

  /**
   * Clears the selected toggles.
   *
   * 清除那些已选定的按钮开关。
   *
   */
  private _clearSelection() {
    this._selectionModel.clear();
    this._buttonToggles.forEach(toggle => (toggle.checked = false));
  }

  /**
   * Selects a value if there's a toggle that corresponds to it.
   *
   * 如果有一个与之对应的开关，就选择一个值。
   *
   */
  private _selectValue(value: any) {
    const correspondingOption = this._buttonToggles.find(toggle => {
      return toggle.value != null && toggle.value === value;
    });

    if (correspondingOption) {
      correspondingOption.checked = true;
      this._selectionModel.select(correspondingOption);
    }
  }

  /**
   * Syncs up the group's value with the model and emits the change event.
   *
   * 将该组的值与模型同步，并发出 change 事件。
   *
   */
  private _updateModelValue(toggle: MatButtonToggle, isUserInput: boolean) {
    // Only emit the change event for user input.
    if (isUserInput) {
      this._emitChangeEvent(toggle);
    }

    // Note: we emit this one no matter whether it was a user interaction, because
    // it is used by Angular to sync up the two-way data binding.
    this.valueChange.emit(this.value);
  }

  /** Marks all of the child button toggles to be checked. */
  private _markButtonsForCheck() {
    this._buttonToggles?.forEach(toggle => toggle._markForCheck());
  }
}

// Boilerplate for applying mixins to the MatButtonToggle class.
/** @docs-private */
const _MatButtonToggleBase = mixinDisableRipple(class {});

/**
 * Single button inside of a toggle group.
 *
 * 开关组内部的单个按钮。
 *
 */
@Component({
  selector: 'mat-button-toggle',
  templateUrl: 'button-toggle.html',
  styleUrls: ['button-toggle.css'],
  encapsulation: ViewEncapsulation.None,
  exportAs: 'matButtonToggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  inputs: ['disableRipple'],
  host: {
    '[class.mat-button-toggle-standalone]': '!buttonToggleGroup',
    '[class.mat-button-toggle-checked]': 'checked',
    '[class.mat-button-toggle-disabled]': 'disabled',
    '[class.mat-button-toggle-appearance-standard]': 'appearance === "standard"',
    'class': 'mat-button-toggle',
    '[attr.aria-label]': 'null',
    '[attr.aria-labelledby]': 'null',
    '[attr.id]': 'id',
    '[attr.name]': 'null',
    '(focus)': 'focus()',
    'role': 'presentation',
  },
})
export class MatButtonToggle
  extends _MatButtonToggleBase
  implements OnInit, AfterViewInit, CanDisableRipple, OnDestroy
{
  private _checked = false;

  /**
   * Attached to the aria-label attribute of the host element. In most cases, aria-labelledby will
   * take precedence so this may be omitted.
   *
   * 附着在宿主元素上的 aria-label 属性。在大多数情况下，aria-labelledby 优先，所以可省略。
   *
   */
  @Input('aria-label') ariaLabel: string;

  /**
   * Users can specify the `aria-labelledby` attribute which will be forwarded to the input element
   *
   * 用户可以指定 `aria-labelledby` 属性，它会被转发到 input 元素上
   *
   */
  @Input('aria-labelledby') ariaLabelledby: string | null = null;

  /**
   * Underlying native `button` element.
   *
   * 幕后的原生 `button` 元素。
   *
   */
  @ViewChild('button') _buttonElement: ElementRef<HTMLButtonElement>;

  /**
   * The parent button toggle group (exclusive selection). Optional.
   *
   * 父开关组（排他选择）。可选。
   *
   */
  buttonToggleGroup: MatButtonToggleGroup;

  /**
   * Unique ID for the underlying `button` element.
   *
   * `button` 元素的唯一 ID。
   *
   */
  get buttonId(): string {
    return `${this.id}-button`;
  }

  /**
   * The unique ID for this button toggle.
   *
   * 此按钮开关的唯一 ID。
   *
   */
  @Input() id: string;

  /**
   * HTML's 'name' attribute used to group radios for unique selection.
   *
   * HTML 的 'name' 属性用于对单选按钮进行分组以进行唯一选择。
   *
   */
  @Input() name: string;

  /**
   * MatButtonToggleGroup reads this to assign its own value.
   *
   * MatButtonToggleGroup 读取它来指定自己的值。
   *
   */
  @Input() value: any;

  /**
   * Tabindex for the toggle.
   *
   * 此开关的 Tabindex。
   *
   */
  @Input() tabIndex: number | null;

  /**
   * The appearance style of the button.
   *
   * 此按钮的外观样式。
   *
   */
  @Input()
  get appearance(): MatButtonToggleAppearance {
    return this.buttonToggleGroup ? this.buttonToggleGroup.appearance : this._appearance;
  }
  set appearance(value: MatButtonToggleAppearance) {
    this._appearance = value;
  }
  private _appearance: MatButtonToggleAppearance;

  /**
   * Whether the button is checked.
   *
   * 此按钮是否被勾选。
   *
   */
  @Input()
  get checked(): boolean {
    return this.buttonToggleGroup ? this.buttonToggleGroup._isSelected(this) : this._checked;
  }
  set checked(value: BooleanInput) {
    const newValue = coerceBooleanProperty(value);

    if (newValue !== this._checked) {
      this._checked = newValue;

      if (this.buttonToggleGroup) {
        this.buttonToggleGroup._syncButtonToggle(this, this._checked);
      }

      this._changeDetectorRef.markForCheck();
    }
  }

  /**
   * Whether the button is disabled.
   *
   * 此按钮是否已禁用。
   *
   */
  @Input()
  get disabled(): boolean {
    return this._disabled || (this.buttonToggleGroup && this.buttonToggleGroup.disabled);
  }
  set disabled(value: BooleanInput) {
    this._disabled = coerceBooleanProperty(value);
  }
  private _disabled: boolean = false;

  /**
   * Event emitted when the group value changes.
   *
   * 本组的值发生变化时发出的事件。
   *
   */
  @Output() readonly change: EventEmitter<MatButtonToggleChange> =
    new EventEmitter<MatButtonToggleChange>();

  constructor(
    @Optional() @Inject(MAT_BUTTON_TOGGLE_GROUP) toggleGroup: MatButtonToggleGroup,
    private _changeDetectorRef: ChangeDetectorRef,
    private _elementRef: ElementRef<HTMLElement>,
    private _focusMonitor: FocusMonitor,
    @Attribute('tabindex') defaultTabIndex: string,
    @Optional()
    @Inject(MAT_BUTTON_TOGGLE_DEFAULT_OPTIONS)
    defaultOptions?: MatButtonToggleDefaultOptions,
  ) {
    super();

    const parsedTabIndex = Number(defaultTabIndex);
    this.tabIndex = parsedTabIndex || parsedTabIndex === 0 ? parsedTabIndex : null;
    this.buttonToggleGroup = toggleGroup;
    this.appearance =
      defaultOptions && defaultOptions.appearance ? defaultOptions.appearance : 'standard';
  }

  ngOnInit() {
    const group = this.buttonToggleGroup;
    this.id = this.id || `mat-button-toggle-${uniqueIdCounter++}`;

    if (group) {
      if (group._isPrechecked(this)) {
        this.checked = true;
      } else if (group._isSelected(this) !== this._checked) {
        // As as side effect of the circular dependency between the toggle group and the button,
        // we may end up in a state where the button is supposed to be checked on init, but it
        // isn't, because the checked value was assigned too early. This can happen when Ivy
        // assigns the static input value before the `ngOnInit` has run.
        group._syncButtonToggle(this, this._checked);
      }
    }
  }

  ngAfterViewInit() {
    this._focusMonitor.monitor(this._elementRef, true);
  }

  ngOnDestroy() {
    const group = this.buttonToggleGroup;

    this._focusMonitor.stopMonitoring(this._elementRef);

    // Remove the toggle from the selection once it's destroyed. Needs to happen
    // on the next tick in order to avoid "changed after checked" errors.
    if (group && group._isSelected(this)) {
      group._syncButtonToggle(this, false, false, true);
    }
  }

  /**
   * Focuses the button.
   *
   * 让此按钮获得焦点。
   *
   */
  focus(options?: FocusOptions): void {
    this._buttonElement.nativeElement.focus(options);
  }

  /**
   * Checks the button toggle due to an interaction with the underlying native button.
   *
   * 由于来自与底层原生按钮的交互，而选定此按钮开关
   *
   */
  _onButtonClick() {
    const newChecked = this._isSingleSelector() ? true : !this._checked;

    if (newChecked !== this._checked) {
      this._checked = newChecked;
      if (this.buttonToggleGroup) {
        this.buttonToggleGroup._syncButtonToggle(this, this._checked, true);
        this.buttonToggleGroup._onTouched();
      }
    }
    // Emit a change event when it's the single selector
    this.change.emit(new MatButtonToggleChange(this, this.value));
  }

  /**
   * Marks the button toggle as needing checking for change detection.
   * This method is exposed because the parent button toggle group will directly
   * update bound properties of the radio button.
   *
   * 标记此按钮是否需要进行变更检测。之所以暴露出此方法，是因为父按钮的开关组要直接更新此单选按钮的绑定属性。
   *
   */
  _markForCheck() {
    // When the group value changes, the button will not be notified.
    // Use `markForCheck` to explicit update button toggle's status.
    this._changeDetectorRef.markForCheck();
  }

  /** Gets the name that should be assigned to the inner DOM node. */
  _getButtonName(): string | null {
    if (this._isSingleSelector()) {
      return this.buttonToggleGroup.name;
    }
    return this.name || null;
  }

  /** Whether the toggle is in single selection mode. */
  private _isSingleSelector(): boolean {
    return this.buttonToggleGroup && !this.buttonToggleGroup.multiple;
  }
}
