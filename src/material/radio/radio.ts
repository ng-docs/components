/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  AfterContentInit,
  AfterViewInit,
  Attribute,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChildren,
  Directive,
  DoCheck,
  ElementRef,
  EventEmitter,
  forwardRef,
  Inject,
  InjectionToken,
  Input,
  OnDestroy,
  OnInit,
  Optional,
  Output,
  QueryList,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import {
  CanDisableRipple,
  HasTabIndex,
  mixinDisableRipple,
  mixinTabIndex,
  ThemePalette,
} from '@angular/material/core';
import {FocusMonitor, FocusOrigin} from '@angular/cdk/a11y';
import {BooleanInput, coerceBooleanProperty, coerceNumberProperty} from '@angular/cdk/coercion';
import {UniqueSelectionDispatcher} from '@angular/cdk/collections';
import {ANIMATION_MODULE_TYPE} from '@angular/platform-browser/animations';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';

// Increasing integer for generating unique ids for radio components.
let nextUniqueId = 0;

/**
 * Change event object emitted by radio button and radio group.
 *
 * 更改单选按钮和单选组发出的事件对象。
 *
 */
export class MatRadioChange {
  constructor(
    /** The radio button that emits the change event. */
    public source: _MatRadioButtonBase,
    /** The value of the radio button. */
    public value: any,
  ) {}
}

/**
 * Provider Expression that allows mat-radio-group to register as a ControlValueAccessor. This
 * allows it to support [(ngModel)] and ngControl.
 *
 * 这个提供者表达式允许把 mat-radio-group 注册为 ControlValueAccessor。这能让它支持 [(ngModel)] 和 ngControl。
 *
 * @docs-private
 */
export const MAT_RADIO_GROUP_CONTROL_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => MatRadioGroup),
  multi: true,
};

/**
 * Injection token that can be used to inject instances of `MatRadioGroup`. It serves as
 * alternative token to the actual `MatRadioGroup` class which could cause unnecessary
 * retention of the class and its component metadata.
 *
 * 这个注入令牌可以用来注入 `MatRadioGroup` 实例。它可以作为实际 `MatRadioGroup` 类的备用令牌，如果使用真实类可能导致此类及其组件元数据无法优化掉。
 *
 */
export const MAT_RADIO_GROUP = new InjectionToken<_MatRadioGroupBase<_MatRadioButtonBase>>(
  'MatRadioGroup',
);

export interface MatRadioDefaultOptions {
  color: ThemePalette;
}

export const MAT_RADIO_DEFAULT_OPTIONS = new InjectionToken<MatRadioDefaultOptions>(
  'mat-radio-default-options',
  {
    providedIn: 'root',
    factory: MAT_RADIO_DEFAULT_OPTIONS_FACTORY,
  },
);

export function MAT_RADIO_DEFAULT_OPTIONS_FACTORY(): MatRadioDefaultOptions {
  return {
    color: 'accent',
  };
}

/**
 * Base class with all of the `MatRadioGroup` functionality.
 *
 * 具备所有 `MatRadioGroup` 功能的基类。
 *
 * @docs-private
 */
@Directive()
export abstract class _MatRadioGroupBase<T extends _MatRadioButtonBase>
  implements AfterContentInit, ControlValueAccessor
{
  /**
   * Selected value for the radio group.
   *
   * 单选组中的选定值。
   *
   */
  private _value: any = null;

  /**
   * The HTML name attribute applied to radio buttons in this group.
   *
   * HTML 的 name 属性是应用于该组中所有单选按钮的。
   *
   */
  private _name: string = `mat-radio-group-${nextUniqueId++}`;

  /**
   * The currently selected radio button. Should match value.
   *
   * 当前选定的单选按钮。要匹配其值。
   *
   */
  private _selected: T | null = null;

  /**
   * Whether the `value` has been set to its initial value.
   *
   * 该 `value` 是否已设置为初始值。
   *
   */
  private _isInitialized: boolean = false;

  /**
   * Whether the labels should appear after or before the radio-buttons. Defaults to 'after'
   *
   * 标签是应该出现在单选按钮之后还是之前。默认为 'after'
   *
   */
  private _labelPosition: 'before' | 'after' = 'after';

  /**
   * Whether the radio group is disabled.
   *
   * 单选按钮组是否已禁用。
   *
   */
  private _disabled: boolean = false;

  /**
   * Whether the radio group is required.
   *
   * 单选按钮组是否必填的。
   *
   */
  private _required: boolean = false;

  /**
   * The method to be called in order to update ngModel
   *
   * 为了更新 ngModel 而要调用的方法
   *
   */
  _controlValueAccessorChangeFn: (value: any) => void = () => {};

  /**
   * onTouch function registered via registerOnTouch (ControlValueAccessor).
   *
   * 通过 registerOnTouch（ControlValueAccessor）注册的 onTouch 函数。
   *
   * @docs-private
   */
  onTouched: () => any = () => {};

  /**
   * Event emitted when the group value changes.
   * Change events are only emitted when the value changes due to user interaction with
   * a radio button (the same behavior as `<input type-"radio">`).
   *
   * 本组的值发生变化时发出的事件。只有在值是因用户与单选按钮的交互而发生变化时才会发出变更事件（与 `<input type-"radio">` 的行为相同）。
   *
   */
  @Output() readonly change: EventEmitter<MatRadioChange> = new EventEmitter<MatRadioChange>();

  /**
   * Child radio buttons.
   *
   * 子单选按钮。
   *
   */
  abstract _radios: QueryList<T>;

  /**
   * Theme color for all of the radio buttons in the group.
   *
   * 该组中所有单选按钮的主题颜色。
   *
   */
  @Input() color: ThemePalette;

  /**
   * Name of the radio button group. All radio buttons inside this group will use this name.
   *
   * 单选按钮组的名称。该组中的所有单选按钮都将使用此名称。
   *
   */
  @Input()
  get name(): string {
    return this._name;
  }
  set name(value: string) {
    this._name = value;
    this._updateRadioButtonNames();
  }

  /**
   * Whether the labels should appear after or before the radio-buttons. Defaults to 'after'
   *
   * 标签是应该出现在单选按钮之后还是之前。默认为 'after'
   *
   */
  @Input()
  get labelPosition(): 'before' | 'after' {
    return this._labelPosition;
  }
  set labelPosition(v) {
    this._labelPosition = v === 'before' ? 'before' : 'after';
    this._markRadiosForCheck();
  }

  /**
   * Value for the radio-group. Should equal the value of the selected radio button if there is
   * a corresponding radio button with a matching value. If there is not such a corresponding
   * radio button, this value persists to be applied in case a new radio button is added with a
   * matching value.
   *
   * 单选按钮组的值。如果有一个与匹配值对应的单选按钮，它应该等于选定单选按钮的值。如果没有这样一个对应的单选按钮，在加入了一个带有匹配值的新单选按钮，该值仍然会生效。
   *
   */
  @Input()
  get value(): any {
    return this._value;
  }
  set value(newValue: any) {
    if (this._value !== newValue) {
      // Set this before proceeding to ensure no circular loop occurs with selection.
      this._value = newValue;

      this._updateSelectedRadioFromValue();
      this._checkSelectedRadioButton();
    }
  }

  _checkSelectedRadioButton() {
    if (this._selected && !this._selected.checked) {
      this._selected.checked = true;
    }
  }

  /**
   * The currently selected radio button. If set to a new radio button, the radio group value
   * will be updated to match the new selected button.
   *
   * 当前选定的单选按钮。如果设置为新的单选按钮，则会更新该单选按钮组的值以匹配新选定的按钮。
   *
   */
  @Input()
  get selected() {
    return this._selected;
  }
  set selected(selected: T | null) {
    this._selected = selected;
    this.value = selected ? selected.value : null;
    this._checkSelectedRadioButton();
  }

  /**
   * Whether the radio group is disabled
   *
   * 单选按钮组是否已禁用
   *
   */
  @Input()
  get disabled(): boolean {
    return this._disabled;
  }
  set disabled(value: BooleanInput) {
    this._disabled = coerceBooleanProperty(value);
    this._markRadiosForCheck();
  }

  /**
   * Whether the radio group is required
   *
   * 单选按钮组是否为必填项
   *
   */
  @Input()
  get required(): boolean {
    return this._required;
  }
  set required(value: BooleanInput) {
    this._required = coerceBooleanProperty(value);
    this._markRadiosForCheck();
  }

  constructor(private _changeDetector: ChangeDetectorRef) {}

  /**
   * Initialize properties once content children are available.
   * This allows us to propagate relevant attributes to associated buttons.
   *
   * 当内容子组件可用时，初始化各个属性。这让让我们把相关的属性传播给相关的按钮。
   *
   */
  ngAfterContentInit() {
    // Mark this component as initialized in AfterContentInit because the initial value can
    // possibly be set by NgModel on MatRadioGroup, and it is possible that the OnInit of the
    // NgModel occurs *after* the OnInit of the MatRadioGroup.
    this._isInitialized = true;
  }

  /**
   * Mark this group as being "touched" (for ngModel). Meant to be called by the contained
   * radio buttons upon their blur.
   *
   * 把这个组标记为“已接触”（对于 ngModel）。所包含的单选按钮在失焦时都会调用它。
   *
   */
  _touch() {
    if (this.onTouched) {
      this.onTouched();
    }
  }

  private _updateRadioButtonNames(): void {
    if (this._radios) {
      this._radios.forEach(radio => {
        radio.name = this.name;
        radio._markForCheck();
      });
    }
  }

  /**
   * Updates the `selected` radio button from the internal \_value state.
   *
   * 从内部值的状态更新 `selected` 单元按钮。
   */
  private _updateSelectedRadioFromValue(): void {
    // If the value already matches the selected radio, do nothing.
    const isAlreadySelected = this._selected !== null && this._selected.value === this._value;

    if (this._radios && !isAlreadySelected) {
      this._selected = null;
      this._radios.forEach(radio => {
        radio.checked = this.value === radio.value;
        if (radio.checked) {
          this._selected = radio;
        }
      });
    }
  }

  /**
   * Dispatch change event with current selection and group value.
   *
   * 使用当前选定的值和组的值派发 change 事件。
   *
   */
  _emitChangeEvent(): void {
    if (this._isInitialized) {
      this.change.emit(new MatRadioChange(this._selected!, this._value));
    }
  }

  _markRadiosForCheck() {
    if (this._radios) {
      this._radios.forEach(radio => radio._markForCheck());
    }
  }

  /**
   * Sets the model value. Implemented as part of ControlValueAccessor.
   *
   * 设置模型值。实现为 ControlValueAccessor 的一部分。
   *
   * @param value
   */
  writeValue(value: any) {
    this.value = value;
    this._changeDetector.markForCheck();
  }

  /**
   * Registers a callback to be triggered when the model value changes.
   * Implemented as part of ControlValueAccessor.
   *
   * 当模型值发生变化时，就会注册一个回调函数。实现为 ControlValueAccessor 的一部分。
   *
   * @param fn Callback to be registered.
   *
   * 要注册的回调。
   *
   */
  registerOnChange(fn: (value: any) => void) {
    this._controlValueAccessorChangeFn = fn;
  }

  /**
   * Registers a callback to be triggered when the control is touched.
   * Implemented as part of ControlValueAccessor.
   *
   * 注册一个在控件已接触时触发的回调函数。实现为 ControlValueAccessor 的一部分。
   *
   * @param fn Callback to be registered.
   *
   * 要注册的回调。
   *
   */
  registerOnTouched(fn: any) {
    this.onTouched = fn;
  }

  /**
   * Sets the disabled state of the control. Implemented as a part of ControlValueAccessor.
   *
   * 设置控件的禁用状态。实现为 ControlValueAccessor 的一部分。
   *
   * @param isDisabled Whether the control should be disabled.
   *
   * 该控件是否应该被禁用。
   *
   */
  setDisabledState(isDisabled: boolean) {
    this.disabled = isDisabled;
    this._changeDetector.markForCheck();
  }
}

// Boilerplate for applying mixins to MatRadioButton.
/** @docs-private */
abstract class MatRadioButtonBase {
  // Since the disabled property is manually defined for the MatRadioButton and isn't set up in
  // the mixin base class. To be able to use the tabindex mixin, a disabled property must be
  // defined to properly work.
  abstract disabled: boolean;
  constructor(public _elementRef: ElementRef) {}
}

const _MatRadioButtonMixinBase = mixinDisableRipple(mixinTabIndex(MatRadioButtonBase));

/**
 * Base class with all of the `MatRadioButton` functionality.
 *
 * 具备所有 `MatRadioButton` 功能的基类。
 *
 * @docs-private
 */
@Directive()
export abstract class _MatRadioButtonBase
  extends _MatRadioButtonMixinBase
  implements OnInit, AfterViewInit, DoCheck, OnDestroy, CanDisableRipple, HasTabIndex
{
  private _uniqueId: string = `mat-radio-${++nextUniqueId}`;

  /**
   * The unique ID for the radio button.
   *
   * 单选按钮的唯一 ID。
   *
   */
  @Input() id: string = this._uniqueId;

  /**
   * Analog to HTML 'name' attribute used to group radios for unique selection.
   *
   * 模拟 HTML 的 “name” 属性，用于对单选按钮进行分组以进行唯一选择。
   *
   */
  @Input() name: string;

  /**
   * Used to set the 'aria-label' attribute on the underlying input element.
   *
   * 用来在底层的 input 元素上设置 'aria-label' 属性。
   *
   */
  @Input('aria-label') ariaLabel: string;

  /**
   * The 'aria-labelledby' attribute takes precedence as the element's text alternative.
   *
   * 'aria-labelledby' 属性优先于该元素上的替换文本。
   *
   */
  @Input('aria-labelledby') ariaLabelledby: string;

  /**
   * The 'aria-describedby' attribute is read after the element's label and field type.
   *
   * 'aria-describedby' 属性是在该元素的标签和字段类型之后读取的。
   *
   */
  @Input('aria-describedby') ariaDescribedby: string;

  /**
   * Whether this radio button is checked.
   *
   * 这个单选按钮是否被勾选。
   *
   */
  @Input()
  get checked(): boolean {
    return this._checked;
  }
  set checked(value: BooleanInput) {
    const newCheckedState = coerceBooleanProperty(value);
    if (this._checked !== newCheckedState) {
      this._checked = newCheckedState;
      if (newCheckedState && this.radioGroup && this.radioGroup.value !== this.value) {
        this.radioGroup.selected = this;
      } else if (!newCheckedState && this.radioGroup && this.radioGroup.value === this.value) {
        // When unchecking the selected radio button, update the selected radio
        // property on the group.
        this.radioGroup.selected = null;
      }

      if (newCheckedState) {
        // Notify all radio buttons with the same name to un-check.
        this._radioDispatcher.notify(this.id, this.name);
      }
      this._changeDetector.markForCheck();
    }
  }

  /**
   * The value of this radio button.
   *
   * 这个单选按钮的值。
   *
   */
  @Input()
  get value(): any {
    return this._value;
  }
  set value(value: any) {
    if (this._value !== value) {
      this._value = value;
      if (this.radioGroup !== null) {
        if (!this.checked) {
          // Update checked when the value changed to match the radio group's value
          this.checked = this.radioGroup.value === value;
        }
        if (this.checked) {
          this.radioGroup.selected = this;
        }
      }
    }
  }

  /**
   * Whether the label should appear after or before the radio button. Defaults to 'after'
   *
   * 标签是应该出现在单选按钮之后还是之前。默认为 'after'
   *
   */
  @Input()
  get labelPosition(): 'before' | 'after' {
    return this._labelPosition || (this.radioGroup && this.radioGroup.labelPosition) || 'after';
  }
  set labelPosition(value) {
    this._labelPosition = value;
  }
  private _labelPosition: 'before' | 'after';

  /**
   * Whether the radio button is disabled.
   *
   * 单选按钮是否已禁用。
   *
   */
  @Input()
  get disabled(): boolean {
    return this._disabled || (this.radioGroup !== null && this.radioGroup.disabled);
  }
  set disabled(value: BooleanInput) {
    this._setDisabled(coerceBooleanProperty(value));
  }

  /**
   * Whether the radio button is required.
   *
   * 单选按钮是否为必填项。
   *
   */
  @Input()
  get required(): boolean {
    return this._required || (this.radioGroup && this.radioGroup.required);
  }
  set required(value: BooleanInput) {
    this._required = coerceBooleanProperty(value);
  }

  /**
   * Theme color of the radio button.
   *
   * 单选按钮的主题颜色。
   *
   */
  @Input()
  get color(): ThemePalette {
    // As per Material design specifications the selection control radio should use the accent color
    // palette by default. https://material.io/guidelines/components/selection-controls.html
    return (
      this._color ||
      (this.radioGroup && this.radioGroup.color) ||
      (this._providerOverride && this._providerOverride.color) ||
      'accent'
    );
  }
  set color(newValue: ThemePalette) {
    this._color = newValue;
  }
  private _color: ThemePalette;

  /**
   * Event emitted when the checked state of this radio button changes.
   * Change events are only emitted when the value changes due to user interaction with
   * the radio button (the same behavior as `<input type-"radio">`).
   *
   * 该单选按钮的 checked 属性发生变化时，会发出本事件。只会在值因用户与单选按钮的交互而发生变化时发出此变更事件（与 `<input type-"radio">` 的行为相同）。
   *
   */
  @Output() readonly change: EventEmitter<MatRadioChange> = new EventEmitter<MatRadioChange>();

  /**
   * The parent radio group. May or may not be present.
   *
   * 父单选按钮组。可能存在，也可能不存在。
   *
   */
  radioGroup: _MatRadioGroupBase<_MatRadioButtonBase>;

  /**
   * ID of the native input element inside `<mat-radio-button>`
   *
   * `<mat-radio-button>` 里面的原生输入框元素的 ID
   *
   */
  get inputId(): string {
    return `${this.id || this._uniqueId}-input`;
  }

  /**
   * Whether this radio is checked.
   *
   * 这个单选按钮是否已勾选。
   *
   */
  private _checked: boolean = false;

  /**
   * Whether this radio is disabled.
   *
   * 这个单选按钮是否已禁用。
   *
   */
  private _disabled: boolean;

  /**
   * Whether this radio is required.
   *
   * 这个单选按钮是否为必填项。
   *
   */
  private _required: boolean;

  /**
   * Value assigned to this radio.
   *
   * 赋给这个单选按钮的值。
   *
   */
  private _value: any = null;

  /**
   * Unregister function for \_radioDispatcher
   *
   * 取消注册 \_radioDispatcher 的函数
   */
  private _removeUniqueSelectionListener: () => void = () => {};

  /**
   * Previous value of the input's tabindex.
   *
   * 此输入框的 tabindex 的先前值。
   *
   */
  private _previousTabIndex: number | undefined;

  /**
   * The native `<input type=radio>` element
   *
   * 原生 `<input type=radio>` 元素
   *
   */
  @ViewChild('input') _inputElement: ElementRef<HTMLInputElement>;

  /**
   * Whether animations are disabled.
   *
   * 是否禁用动画。
   *
   */
  _noopAnimations: boolean;

  constructor(
    radioGroup: _MatRadioGroupBase<_MatRadioButtonBase>,
    elementRef: ElementRef,
    protected _changeDetector: ChangeDetectorRef,
    private _focusMonitor: FocusMonitor,
    private _radioDispatcher: UniqueSelectionDispatcher,
    animationMode?: string,
    private _providerOverride?: MatRadioDefaultOptions,
    tabIndex?: string,
  ) {
    super(elementRef);

    // Assertions. Ideally these should be stripped out by the compiler.
    // TODO(jelbourn): Assert that there's no name binding AND a parent radio group.
    this.radioGroup = radioGroup;
    this._noopAnimations = animationMode === 'NoopAnimations';

    if (tabIndex) {
      this.tabIndex = coerceNumberProperty(tabIndex, 0);
    }
  }

  /**
   * Focuses the radio button.
   *
   * 让此单选按钮获得焦点。
   *
   */
  focus(options?: FocusOptions, origin?: FocusOrigin): void {
    if (origin) {
      this._focusMonitor.focusVia(this._inputElement, origin, options);
    } else {
      this._inputElement.nativeElement.focus(options);
    }
  }

  /**
   * Marks the radio button as needing checking for change detection.
   * This method is exposed because the parent radio group will directly
   * update bound properties of the radio button.
   *
   * 标记单选按钮是否需要进行变更检测。之所以暴露此方法，是因为父组件单选按钮组将会直接更新单选按钮的绑定属性。
   *
   */
  _markForCheck() {
    // When group value changes, the button will not be notified. Use `markForCheck` to explicit
    // update radio button's status
    this._changeDetector.markForCheck();
  }

  ngOnInit() {
    if (this.radioGroup) {
      // If the radio is inside a radio group, determine if it should be checked
      this.checked = this.radioGroup.value === this._value;

      if (this.checked) {
        this.radioGroup.selected = this;
      }

      // Copy name from parent radio group
      this.name = this.radioGroup.name;
    }

    this._removeUniqueSelectionListener = this._radioDispatcher.listen((id, name) => {
      if (id !== this.id && name === this.name) {
        this.checked = false;
      }
    });
  }

  ngDoCheck(): void {
    this._updateTabIndex();
  }

  ngAfterViewInit() {
    this._updateTabIndex();
    this._focusMonitor.monitor(this._elementRef, true).subscribe(focusOrigin => {
      if (!focusOrigin && this.radioGroup) {
        this.radioGroup._touch();
      }
    });
  }

  ngOnDestroy() {
    this._focusMonitor.stopMonitoring(this._elementRef);
    this._removeUniqueSelectionListener();
  }

  /**
   * Dispatch change event with current value.
   *
   * 使用当前值派发 change 事件。
   *
   */
  private _emitChangeEvent(): void {
    this.change.emit(new MatRadioChange(this, this._value));
  }

  _isRippleDisabled() {
    return this.disableRipple || this.disabled;
  }

  _onInputClick(event: Event) {
    // We have to stop propagation for click events on the visual hidden input element.
    // By default, when a user clicks on a label element, a generated click event will be
    // dispatched on the associated input element. Since we are using a label element as our
    // root container, the click event on the `radio-button` will be executed twice.
    // The real click event will bubble up, and the generated click event also tries to bubble up.
    // This will lead to multiple click events.
    // Preventing bubbling for the second event will solve that issue.
    event.stopPropagation();
  }

  /**
   * Triggered when the radio button receives an interaction from the user.
   *
   * 当单选按钮收到用户的交互时触发。
   *
   */
  _onInputInteraction(event: Event) {
    // We always have to stop propagation on the change event.
    // Otherwise the change event, from the input element, will bubble up and
    // emit its event object to the `change` output.
    event.stopPropagation();

    if (!this.checked && !this.disabled) {
      const groupValueChanged = this.radioGroup && this.value !== this.radioGroup.value;
      this.checked = true;
      this._emitChangeEvent();

      if (this.radioGroup) {
        this.radioGroup._controlValueAccessorChangeFn(this.value);
        if (groupValueChanged) {
          this.radioGroup._emitChangeEvent();
        }
      }
    }
  }

  /**
   * Sets the disabled state and marks for check if a change occurred.
   *
   * 设置禁用状态和标记，以检查是否发生了变化。
   *
   */
  protected _setDisabled(value: boolean) {
    if (this._disabled !== value) {
      this._disabled = value;
      this._changeDetector.markForCheck();
    }
  }

  /**
   * Gets the tabindex for the underlying input element.
   *
   * 获取底层输入框元素的 tabindex。
   *
   */
  private _updateTabIndex() {
    const group = this.radioGroup;
    let value: number;

    // Implement a roving tabindex if the button is inside a group. For most cases this isn't
    // necessary, because the browser handles the tab order for inputs inside a group automatically,
    // but we need an explicitly higher tabindex for the selected button in order for things like
    // the focus trap to pick it up correctly.
    if (!group || !group.selected || this.disabled) {
      value = this.tabIndex;
    } else {
      value = group.selected === this ? this.tabIndex : -1;
    }

    if (value !== this._previousTabIndex) {
      // We have to set the tabindex directly on the DOM node, because it depends on
      // the selected state which is prone to "changed after checked errors".
      const input: HTMLInputElement | undefined = this._inputElement?.nativeElement;

      if (input) {
        input.setAttribute('tabindex', value + '');
        this._previousTabIndex = value;
      }
    }
  }
}

/**
 * A group of radio buttons. May contain one or more `<mat-radio-button>` elements.
 *
 * Material Design 单选按钮。通常放在 `<mat-radio-group>` 元素内。
 *
 */
@Directive({
  selector: 'mat-radio-group',
  exportAs: 'matRadioGroup',
  providers: [
    MAT_RADIO_GROUP_CONTROL_VALUE_ACCESSOR,
    {provide: MAT_RADIO_GROUP, useExisting: MatRadioGroup},
  ],
  host: {
    'role': 'radiogroup',
    'class': 'mat-mdc-radio-group',
  },
})
export class MatRadioGroup extends _MatRadioGroupBase<MatRadioButton> {
  /**
   * Child radio buttons.
   *
   * 子单选按钮。
   *
   */
  @ContentChildren(forwardRef(() => MatRadioButton), {descendants: true})
  _radios: QueryList<MatRadioButton>;
}

@Component({
  selector: 'mat-radio-button',
  templateUrl: 'radio.html',
  styleUrls: ['radio.css'],
  host: {
    'class': 'mat-mdc-radio-button',
    '[attr.id]': 'id',
    '[class.mat-primary]': 'color === "primary"',
    '[class.mat-accent]': 'color === "accent"',
    '[class.mat-warn]': 'color === "warn"',
    '[class.mat-mdc-radio-checked]': 'checked',
    '[class._mat-animation-noopable]': '_noopAnimations',
    // Needs to be removed since it causes some a11y issues (see #21266).
    '[attr.tabindex]': 'null',
    '[attr.aria-label]': 'null',
    '[attr.aria-labelledby]': 'null',
    '[attr.aria-describedby]': 'null',
    // Note: under normal conditions focus shouldn't land on this element, however it may be
    // programmatically set, for example inside of a focus trap, in this case we want to forward
    // the focus to the native element.
    '(focus)': '_inputElement.nativeElement.focus()',
  },
  inputs: ['disableRipple', 'tabIndex'],
  exportAs: 'matRadioButton',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatRadioButton extends _MatRadioButtonBase {
  constructor(
    @Optional() @Inject(MAT_RADIO_GROUP) radioGroup: MatRadioGroup,
    elementRef: ElementRef,
    _changeDetector: ChangeDetectorRef,
    _focusMonitor: FocusMonitor,
    _radioDispatcher: UniqueSelectionDispatcher,
    @Optional() @Inject(ANIMATION_MODULE_TYPE) animationMode?: string,
    @Optional()
    @Inject(MAT_RADIO_DEFAULT_OPTIONS)
    _providerOverride?: MatRadioDefaultOptions,
    @Attribute('tabindex') tabIndex?: string,
  ) {
    super(
      radioGroup,
      elementRef,
      _changeDetector,
      _focusMonitor,
      _radioDispatcher,
      animationMode,
      _providerOverride,
      tabIndex,
    );
  }
}
