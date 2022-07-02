/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {FocusableOption, FocusMonitor, FocusOrigin} from '@angular/cdk/a11y';
import {BooleanInput, coerceBooleanProperty} from '@angular/cdk/coercion';
import {
  Attribute,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  Inject,
  Input,
  NgZone,
  OnDestroy,
  Optional,
  Output,
  ViewChild,
  ViewEncapsulation,
  Directive,
  AfterViewInit,
} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {
  CanColor,
  CanDisable,
  CanDisableRipple,
  HasTabIndex,
  MatRipple,
  mixinColor,
  mixinDisabled,
  mixinDisableRipple,
  mixinTabIndex,
} from '@angular/material/core';
import {ANIMATION_MODULE_TYPE} from '@angular/platform-browser/animations';
import {
  MAT_CHECKBOX_DEFAULT_OPTIONS,
  MatCheckboxDefaultOptions,
  MAT_CHECKBOX_DEFAULT_OPTIONS_FACTORY,
} from './checkbox-config';

// Increasing integer for generating unique ids for checkbox components.
let nextUniqueId = 0;

// Default checkbox configuration.
const defaults = MAT_CHECKBOX_DEFAULT_OPTIONS_FACTORY();

/**
 * Provider Expression that allows mat-checkbox to register as a ControlValueAccessor.
 * This allows it to support [(ngModel)].
 *
 * 一个提供者表达式，可以把 mat-checkbox 注册为 ControlValueAccessor。这可以让它支持 `[(ngModel)]`。
 *
 * @docs-private
 */
export const MAT_CHECKBOX_CONTROL_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => MatCheckbox),
  multi: true,
};

/**
 * Represents the different states that require custom transitions between them.
 *
 * 表示需要在它们之间进行自定义转换的不同状态。
 *
 * @docs-private
 */
export const enum TransitionCheckState {
  /**
   * The initial state of the component before any user interaction.
   *
   * 组件尚未与任何用户交互之前的初始状态。
   *
   */
  Init,
  /**
   * The state representing the component when it's becoming checked.
   *
   * 表示当组件已检查过时的状态。
   *
   */
  Checked,
  /**
   * The state representing the component when it's becoming unchecked.
   *
   * 表示当组件未检查过时的状态。
   *
   */
  Unchecked,
  /**
   * The state representing the component when it's becoming indeterminate.
   *
   * 当组件变为未决（indeterminate）时的状态。
   *
   */
  Indeterminate,
}

/**
 * Change event object emitted by MatCheckbox.
 *
 * MatCheckbox 发出的“更改”事件对象。
 *
 */
export class MatCheckboxChange {
  /**
   * The source MatCheckbox of the event.
   *
   * 该事件的来源 MatCheckbox。
   *
   */
  source: MatCheckbox;
  /**
   * The new `checked` value of the checkbox.
   *
   * 该复选框的新 `checked` 值。
   *
   */
  checked: boolean;
}

// Boilerplate for applying mixins to MatCheckbox.
/** @docs-private */
const _MatCheckboxMixinBase = mixinTabIndex(
  mixinColor(
    mixinDisableRipple(
      mixinDisabled(
        class {
          constructor(public _elementRef: ElementRef) {}
        },
      ),
    ),
  ),
);

@Directive()
export abstract class _MatCheckboxBase<E>
  extends _MatCheckboxMixinBase
  implements
    AfterViewInit,
    ControlValueAccessor,
    CanColor,
    CanDisable,
    HasTabIndex,
    CanDisableRipple,
    FocusableOption
{
  /**
   * Focuses the checkbox.
   *
   * 聚焦复选框。
   *
   */
  abstract focus(origin?: FocusOrigin): void;

  /** Creates the change event that will be emitted by the checkbox. */
  protected abstract _createChangeEvent(isChecked: boolean): E;

  /** Gets the element on which to add the animation CSS classes. */
  protected abstract _getAnimationTargetElement(): HTMLElement | null;

  /** CSS classes to add when transitioning between the different checkbox states. */
  protected abstract _animationClasses: {
    uncheckedToChecked: string;
    uncheckedToIndeterminate: string;
    checkedToUnchecked: string;
    checkedToIndeterminate: string;
    indeterminateToChecked: string;
    indeterminateToUnchecked: string;
  };

  /**
   * Attached to the aria-label attribute of the host element. In most cases, aria-labelledby will
   * take precedence so this may be omitted.
   *
   * 附加在宿主元素的 aria-label 属性上。在大多数情况下，aria-labelledby 优先，所以这个可以省略。
   *
   */
  @Input('aria-label') ariaLabel: string = '';

  /**
   * Users can specify the `aria-labelledby` attribute which will be forwarded to the input element
   *
   * 用户可以指定 `aria-labelledby` 属性，它会被转发到 input 元素
   *
   */
  @Input('aria-labelledby') ariaLabelledby: string | null = null;

  /**
   * The 'aria-describedby' attribute is read after the element's label and field type.
   *
   * 'aria-describedby' 属性是在该元素的标签和字段类型之后读取的。
   *
   */
  @Input('aria-describedby') ariaDescribedby: string;

  private _uniqueId: string;

  /**
   * A unique id for the checkbox input. If none is supplied, it will be auto-generated.
   *
   * 复选框的唯一 ID。如果没有提供，它就会自动生成。
   *
   */
  @Input() id: string;

  /**
   * Returns the unique id for the visual hidden input.
   *
   * 返回不可见输入框的唯一 id。
   *
   */
  get inputId(): string {
    return `${this.id || this._uniqueId}-input`;
  }

  /**
   * Whether the checkbox is required.
   *
   * 该复选框是否必填的。
   *
   */
  @Input()
  get required(): boolean {
    return this._required;
  }
  set required(value: BooleanInput) {
    this._required = coerceBooleanProperty(value);
  }
  private _required: boolean;

  /**
   * Whether the label should appear after or before the checkbox. Defaults to 'after'
   *
   * 标签位于复选框之后还是之前。默认为 'after'
   *
   */
  @Input() labelPosition: 'before' | 'after' = 'after';

  /**
   * Name value will be applied to the input element if present
   *
   * 如果存在，name 值就会被应用到 input 元素中
   *
   */
  @Input() name: string | null = null;

  /**
   * Event emitted when the checkbox's `checked` value changes.
   *
   * `checked` 值发生变化时会发出本事件。
   *
   */
  @Output() readonly change: EventEmitter<E> = new EventEmitter<E>();

  /**
   * Event emitted when the checkbox's `indeterminate` value changes.
   *
   * `indeterminate` 值发生变化时会发出本事件。
   *
   */
  @Output() readonly indeterminateChange: EventEmitter<boolean> = new EventEmitter<boolean>();

  /**
   * The value attribute of the native input element
   *
   * 原生输入元素的 value 属性
   *
   */
  @Input() value: string;

  /**
   * The native `<input type="checkbox">` element
   *
   * 原生 `<input type="checkbox">` 元素
   *
   */
  @ViewChild('input') _inputElement: ElementRef<HTMLInputElement>;

  /** The native `<label>` element */
  @ViewChild('label') _labelElement: ElementRef<HTMLInputElement>;

  /**
   * Reference to the ripple instance of the checkbox.
   *
   * 引用复选框的涟漪对象实例。
   *
   */
  @ViewChild(MatRipple) ripple: MatRipple;

  /**
   * Called when the checkbox is blurred. Needed to properly implement ControlValueAccessor.
   *
   * 当复选框失焦时调用。需要正确实现 ControlValueAccessor。
   *
   * @docs-private
   */
  _onTouched: () => any = () => {};

  private _currentAnimationClass: string = '';

  private _currentCheckState: TransitionCheckState = TransitionCheckState.Init;

  private _controlValueAccessorChangeFn: (value: any) => void = () => {};

  constructor(
    idPrefix: string,
    elementRef: ElementRef<HTMLElement>,
    protected _changeDetectorRef: ChangeDetectorRef,
    protected _ngZone: NgZone,
    tabIndex: string,
    public _animationMode?: string,
    protected _options?: MatCheckboxDefaultOptions,
  ) {
    super(elementRef);
    this._options = this._options || defaults;
    this.color = this.defaultColor = this._options.color || defaults.color;
    this.tabIndex = parseInt(tabIndex) || 0;
    this.id = this._uniqueId = `${idPrefix}${++nextUniqueId}`;
  }

  ngAfterViewInit() {
    this._syncIndeterminate(this._indeterminate);
  }

  /**
   * Whether the checkbox is checked.
   *
   * 是否勾选了复选框。
   *
   */
  @Input()
  get checked(): boolean {
    return this._checked;
  }
  set checked(value: BooleanInput) {
    const checked = coerceBooleanProperty(value);

    if (checked != this.checked) {
      this._checked = checked;
      this._changeDetectorRef.markForCheck();
    }
  }
  private _checked: boolean = false;

  /**
   * Whether the checkbox is disabled. This fully overrides the implementation provided by
   * mixinDisabled, but the mixin is still required because mixinTabIndex requires it.
   *
   * 该复选框是否已禁用。这完全取代了 mixinDisabled 提供的实现，但 mixin 仍然是必需的，因为 mixinTabIndex 需要它。
   *
   */
  @Input()
  override get disabled(): boolean {
    return this._disabled;
  }
  override set disabled(value: BooleanInput) {
    const newValue = coerceBooleanProperty(value);

    if (newValue !== this.disabled) {
      this._disabled = newValue;
      this._changeDetectorRef.markForCheck();
    }
  }
  private _disabled: boolean = false;

  /**
   * Whether the checkbox is indeterminate. This is also known as "mixed" mode and can be used to
   * represent a checkbox with three states, e.g. a checkbox that represents a nested list of
   * checkable items. Note that whenever checkbox is manually clicked, indeterminate is immediately
   * set to false.
   *
   * 该复选框是否未决。这也称为“混合”模式，用于表示带有三种状态的复选框，例如一个嵌套着其它复选框列表的复选框。请注意，只要手动点击复选框，就会立即将未决状态设为 false。
   *
   */
  @Input()
  get indeterminate(): boolean {
    return this._indeterminate;
  }
  set indeterminate(value: BooleanInput) {
    const changed = value != this._indeterminate;
    this._indeterminate = coerceBooleanProperty(value);

    if (changed) {
      if (this._indeterminate) {
        this._transitionCheckState(TransitionCheckState.Indeterminate);
      } else {
        this._transitionCheckState(
          this.checked ? TransitionCheckState.Checked : TransitionCheckState.Unchecked,
        );
      }
      this.indeterminateChange.emit(this._indeterminate);
    }

    this._syncIndeterminate(this._indeterminate);
  }
  private _indeterminate: boolean = false;

  _isRippleDisabled() {
    return this.disableRipple || this.disabled;
  }

  /**
   * Method being called whenever the label text changes.
   *
   * 每当标签文本发生变化时就会调用该方法。
   *
   */
  _onLabelTextChange() {
    // Since the event of the `cdkObserveContent` directive runs outside of the zone, the checkbox
    // component will be only marked for check, but no actual change detection runs automatically.
    // Instead of going back into the zone in order to trigger a change detection which causes
    // *all* components to be checked (if explicitly marked or not using OnPush), we only trigger
    // an explicit change detection for the checkbox view and its children.
    this._changeDetectorRef.detectChanges();
  }

  // Implemented as part of ControlValueAccessor.
  writeValue(value: any) {
    this.checked = !!value;
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
  setDisabledState(isDisabled: boolean) {
    this.disabled = isDisabled;
  }

  _getAriaChecked(): 'true' | 'false' | 'mixed' {
    if (this.checked) {
      return 'true';
    }

    return this.indeterminate ? 'mixed' : 'false';
  }

  private _transitionCheckState(newState: TransitionCheckState) {
    let oldState = this._currentCheckState;
    let element = this._getAnimationTargetElement();

    if (oldState === newState || !element) {
      return;
    }
    if (this._currentAnimationClass.length > 0) {
      element.classList.remove(this._currentAnimationClass);
    }

    this._currentAnimationClass = this._getAnimationClassForCheckStateTransition(
      oldState,
      newState,
    );
    this._currentCheckState = newState;

    if (this._currentAnimationClass.length > 0) {
      element.classList.add(this._currentAnimationClass);

      // Remove the animation class to avoid animation when the checkbox is moved between containers
      const animationClass = this._currentAnimationClass;

      this._ngZone.runOutsideAngular(() => {
        setTimeout(() => {
          element!.classList.remove(animationClass);
        }, 1000);
      });
    }
  }

  private _emitChangeEvent() {
    this._controlValueAccessorChangeFn(this.checked);
    this.change.emit(this._createChangeEvent(this.checked));

    // Assigning the value again here is redundant, but we have to do it in case it was
    // changed inside the `change` listener which will cause the input to be out of sync.
    if (this._inputElement) {
      this._inputElement.nativeElement.checked = this.checked;
    }
  }

  /**
   * Toggles the `checked` state of the checkbox.
   *
   * 切换 `checked` 状态。
   *
   */
  toggle(): void {
    this.checked = !this.checked;
    this._controlValueAccessorChangeFn(this.checked);
  }

  protected _handleInputClick() {
    const clickAction = this._options?.clickAction;

    // If resetIndeterminate is false, and the current state is indeterminate, do nothing on click
    if (!this.disabled && clickAction !== 'noop') {
      // When user manually click on the checkbox, `indeterminate` is set to false.
      if (this.indeterminate && clickAction !== 'check') {
        Promise.resolve().then(() => {
          this._indeterminate = false;
          this.indeterminateChange.emit(this._indeterminate);
        });
      }

      this._checked = !this._checked;
      this._transitionCheckState(
        this._checked ? TransitionCheckState.Checked : TransitionCheckState.Unchecked,
      );

      // Emit our custom change event if the native input emitted one.
      // It is important to only emit it, if the native input triggered one, because
      // we don't want to trigger a change event, when the `checked` variable changes for example.
      this._emitChangeEvent();
    } else if (!this.disabled && clickAction === 'noop') {
      // Reset native input when clicked with noop. The native checkbox becomes checked after
      // click, reset it to be align with `checked` value of `mat-checkbox`.
      this._inputElement.nativeElement.checked = this.checked;
      this._inputElement.nativeElement.indeterminate = this.indeterminate;
    }
  }

  _onInteractionEvent(event: Event) {
    // We always have to stop propagation on the change event.
    // Otherwise the change event, from the input element, will bubble up and
    // emit its event object to the `change` output.
    event.stopPropagation();
  }

  _onBlur() {
    // When a focused element becomes disabled, the browser *immediately* fires a blur event.
    // Angular does not expect events to be raised during change detection, so any state change
    // (such as a form control's 'ng-touched') will cause a changed-after-checked error.
    // See https://github.com/angular/angular/issues/17793. To work around this, we defer
    // telling the form control it has been touched until the next tick.
    Promise.resolve().then(() => {
      this._onTouched();
      this._changeDetectorRef.markForCheck();
    });
  }

  private _getAnimationClassForCheckStateTransition(
    oldState: TransitionCheckState,
    newState: TransitionCheckState,
  ): string {
    // Don't transition if animations are disabled.
    if (this._animationMode === 'NoopAnimations') {
      return '';
    }

    switch (oldState) {
      case TransitionCheckState.Init:
        // Handle edge case where user interacts with checkbox that does not have [(ngModel)] or
        // [checked] bound to it.
        if (newState === TransitionCheckState.Checked) {
          return this._animationClasses.uncheckedToChecked;
        } else if (newState == TransitionCheckState.Indeterminate) {
          return this._animationClasses.uncheckedToIndeterminate;
        }
        break;
      case TransitionCheckState.Unchecked:
        return newState === TransitionCheckState.Checked
          ? this._animationClasses.uncheckedToChecked
          : this._animationClasses.uncheckedToIndeterminate;
      case TransitionCheckState.Checked:
        return newState === TransitionCheckState.Unchecked
          ? this._animationClasses.checkedToUnchecked
          : this._animationClasses.checkedToIndeterminate;
      case TransitionCheckState.Indeterminate:
        return newState === TransitionCheckState.Checked
          ? this._animationClasses.indeterminateToChecked
          : this._animationClasses.indeterminateToUnchecked;
    }

    return '';
  }

  /**
   * Syncs the indeterminate value with the checkbox DOM node.
   *
   * 使用复选框 DOM 节点同步该未决值。
   *
   * We sync `indeterminate` directly on the DOM node, because in Ivy the check for whether a
   * property is supported on an element boils down to `if (propName in element)`. Domino's
   * HTMLInputElement doesn't have an `indeterminate` property so Ivy will warn during
   * server-side rendering.
   *
   * 我们要直接从 DOM 节点同步 `indeterminate` 值，因为在 Ivy 中，检查一个元素是否支持某属性，会归结为代码 `if (propName in element)`。Domino 引擎的 HTMLInputElement 上没有 `indeterminate` 属性，所以 Ivy 会在服务端渲染过程中发出警告。
   *
   */
  private _syncIndeterminate(value: boolean) {
    const nativeCheckbox = this._inputElement;

    if (nativeCheckbox) {
      nativeCheckbox.nativeElement.indeterminate = value;
    }
  }
}

/**
 * A material design checkbox component. Supports all of the functionality of an HTML5 checkbox,
 * and exposes a similar API. A MatCheckbox can be either checked, unchecked, indeterminate, or
 * disabled. Note that all additional accessibility attributes are taken care of by the component,
 * so there is no need to provide them yourself. However, if you want to omit a label and still
 * have the checkbox be accessible, you may supply an [aria-label] input.
 * See: https://material.io/design/components/selection-controls.html
 *
 */
@Component({
  selector: 'mat-checkbox',
  templateUrl: 'checkbox.html',
  styleUrls: ['checkbox.css'],
  exportAs: 'matCheckbox',
  host: {
    'class': 'mat-checkbox',
    '[id]': 'id',
    '[attr.tabindex]': 'null',
    '[attr.aria-label]': 'null',
    '[attr.aria-labelledby]': 'null',
    '[class.mat-checkbox-indeterminate]': 'indeterminate',
    '[class.mat-checkbox-checked]': 'checked',
    '[class.mat-checkbox-disabled]': 'disabled',
    '[class.mat-checkbox-label-before]': 'labelPosition == "before"',
    '[class._mat-animation-noopable]': `_animationMode === 'NoopAnimations'`,
  },
  providers: [MAT_CHECKBOX_CONTROL_VALUE_ACCESSOR],
  inputs: ['disableRipple', 'color', 'tabIndex'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatCheckbox
  extends _MatCheckboxBase<MatCheckboxChange>
  implements AfterViewInit, OnDestroy
{
  protected _animationClasses = {
    uncheckedToChecked: 'mat-checkbox-anim-unchecked-checked',
    uncheckedToIndeterminate: 'mat-checkbox-anim-unchecked-indeterminate',
    checkedToUnchecked: 'mat-checkbox-anim-checked-unchecked',
    checkedToIndeterminate: 'mat-checkbox-anim-checked-indeterminate',
    indeterminateToChecked: 'mat-checkbox-anim-indeterminate-checked',
    indeterminateToUnchecked: 'mat-checkbox-anim-indeterminate-unchecked',
  };

  constructor(
    elementRef: ElementRef<HTMLElement>,
    changeDetectorRef: ChangeDetectorRef,
    private _focusMonitor: FocusMonitor,
    ngZone: NgZone,
    @Attribute('tabindex') tabIndex: string,
    @Optional() @Inject(ANIMATION_MODULE_TYPE) animationMode?: string,
    @Optional()
    @Inject(MAT_CHECKBOX_DEFAULT_OPTIONS)
    options?: MatCheckboxDefaultOptions,
  ) {
    super('mat-checkbox-', elementRef, changeDetectorRef, ngZone, tabIndex, animationMode, options);
  }

  protected _createChangeEvent(isChecked: boolean) {
    const event = new MatCheckboxChange();
    event.source = this;
    event.checked = isChecked;
    return event;
  }

  protected _getAnimationTargetElement() {
    return this._elementRef.nativeElement;
  }

  override ngAfterViewInit() {
    super.ngAfterViewInit();

    this._focusMonitor.monitor(this._elementRef, true).subscribe(focusOrigin => {
      if (!focusOrigin) {
        this._onBlur();
      }
    });
  }

  ngOnDestroy() {
    this._focusMonitor.stopMonitoring(this._elementRef);
  }

  /**
   * Event handler for checkbox input element.
   * Toggles checked state if element is not disabled.
   * Do not toggle on (change) event since IE doesn't fire change event when
   *   indeterminate checkbox is clicked.
   * @param event
   */
  _onInputClick(event: Event) {
    // We have to stop propagation for click events on the visual hidden input element.
    // By default, when a user clicks on a label element, a generated click event will be
    // dispatched on the associated input element. Since we are using a label element as our
    // root container, the click event on the `checkbox` will be executed twice.
    // The real click event will bubble up, and the generated click event also tries to bubble up.
    // This will lead to multiple click events.
    // Preventing bubbling for the second event will solve that issue.
    event.stopPropagation();
    super._handleInputClick();
  }

  /**
   * Focuses the checkbox.
   *
   * 聚焦复选框。
   *
   */
  focus(origin?: FocusOrigin, options?: FocusOptions): void {
    if (origin) {
      this._focusMonitor.focusVia(this._inputElement, origin, options);
    } else {
      this._inputElement.nativeElement.focus(options);
    }
  }
}
