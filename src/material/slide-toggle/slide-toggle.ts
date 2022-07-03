/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {FocusMonitor, FocusOrigin} from '@angular/cdk/a11y';
import {BooleanInput, coerceBooleanProperty} from '@angular/cdk/coercion';
import {
  AfterContentInit,
  Attribute,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  Input,
  OnDestroy,
  Output,
  ViewChild,
  ViewEncapsulation,
  Optional,
  Inject,
  Directive,
} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {
  CanColor,
  CanDisable,
  CanDisableRipple,
  HasTabIndex,
  mixinColor,
  mixinDisabled,
  mixinDisableRipple,
  mixinTabIndex,
} from '@angular/material/core';
import {ANIMATION_MODULE_TYPE} from '@angular/platform-browser/animations';
import {
  MAT_SLIDE_TOGGLE_DEFAULT_OPTIONS,
  MatSlideToggleDefaultOptions,
} from './slide-toggle-config';

// Increasing integer for generating unique ids for slide-toggle components.
let nextUniqueId = 0;

/** @docs-private */
export const MAT_SLIDE_TOGGLE_VALUE_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => MatSlideToggle),
  multi: true,
};

/**
 * Change event object emitted by a MatSlideToggle.
 *
 * 修改 MatSlideToggle 发出的事件对象。
 *
 */
export class MatSlideToggleChange {
  constructor(
    /**
     * The source MatSlideToggle of the event.
     *
     * 发出此事件的源 MatSlideToggle。
     */
    public source: MatSlideToggle,
    /**
     * The new `checked` value of the MatSlideToggle.
     *
     * 此 MatSlideToggle 的新 `checked` 值。
     */
    public checked: boolean,
  ) {}
}

// Boilerplate for applying mixins to MatSlideToggle.
/** @docs-private */
const _MatSlideToggleMixinBase = mixinTabIndex(
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
export abstract class _MatSlideToggleBase<T>
  extends _MatSlideToggleMixinBase
  implements
    OnDestroy,
    AfterContentInit,
    ControlValueAccessor,
    CanDisable,
    CanColor,
    HasTabIndex,
    CanDisableRipple
{
  protected _onChange = (_: any) => {};
  private _onTouched = () => {};

  protected _uniqueId: string;
  private _required: boolean = false;
  private _checked: boolean = false;

  protected abstract _createChangeEvent(isChecked: boolean): T;
  abstract focus(options?: FocusOptions, origin?: FocusOrigin): void;

  /**
   * Whether noop animations are enabled.
   *
   * 是否启用 noop 动画。
   *
   */
  _noopAnimations: boolean;

  /**
   * Whether the slide toggle is currently focused.
   *
   * 此滑块开关当前是否拥有焦点。
   *
   */
  _focused: boolean;

  /**
   * Name value will be applied to the input element if present.
   *
   * 如果存在，name 值就会被应用到输入框元素中。
   *
   */
  @Input() name: string | null = null;

  /**
   * A unique id for the slide-toggle input. If none is supplied, it will be auto-generated.
   *
   * 滑块开关输入组件的唯一 id。如果没有提供，它就会自动生成。
   *
   */
  @Input() id: string;

  /**
   * Whether the label should appear after or before the slide-toggle. Defaults to 'after'.
   *
   * 标签应出现在滑块开关之后还是之前。默认为 'after'。
   *
   */
  @Input() labelPosition: 'before' | 'after' = 'after';

  /**
   * Used to set the aria-label attribute on the underlying input element.
   *
   * 用于在底层的 input 元素上设置 aria-label 属性。
   *
   */
  @Input('aria-label') ariaLabel: string | null = null;

  /**
   * Used to set the aria-labelledby attribute on the underlying input element.
   *
   * 用于在底层的 input 元素上设置 aria-labelledby 属性。
   *
   */
  @Input('aria-labelledby') ariaLabelledby: string | null = null;

  /**
   * Used to set the aria-describedby attribute on the underlying input element.
   *
   * 用于在底层输入框元素上设置 aria-describedby 属性。
   *
   */
  @Input('aria-describedby') ariaDescribedby: string;

  /**
   * Whether the slide-toggle is required.
   *
   * 滑块开关是否为必填项。
   *
   */
  @Input()
  get required(): boolean {
    return this._required;
  }
  set required(value: BooleanInput) {
    this._required = coerceBooleanProperty(value);
  }

  /**
   * Whether the slide-toggle element is checked or not.
   *
   * 是否勾选了滑块开关元素。
   *
   */
  @Input()
  get checked(): boolean {
    return this._checked;
  }
  set checked(value: BooleanInput) {
    this._checked = coerceBooleanProperty(value);
    this._changeDetectorRef.markForCheck();
  }
  /**
   * An event will be dispatched each time the slide-toggle changes its value.
   *
   * 每当滑块开关的值发生变化时，都会派发一个事件。
   *
   */
  @Output() readonly change: EventEmitter<T> = new EventEmitter<T>();

  /**
   * An event will be dispatched each time the slide-toggle input is toggled.
   * This event is always emitted when the user toggles the slide toggle, but this does not mean
   * the slide toggle's value has changed.
   *
   * 每次切换滑块开关时，都会派发一个事件。当用户切换滑块开关时，就会发出此事件，但这并不意味着滑块开关的值已经改变。
   *
   */
  @Output() readonly toggleChange: EventEmitter<void> = new EventEmitter<void>();

  /**
   * Returns the unique id for the visual hidden input.
   *
   * 返回不可见输入框的唯一 id。
   *
   */
  get inputId(): string {
    return `${this.id || this._uniqueId}-input`;
  }

  constructor(
    elementRef: ElementRef,
    protected _focusMonitor: FocusMonitor,
    protected _changeDetectorRef: ChangeDetectorRef,
    tabIndex: string,
    public defaults: MatSlideToggleDefaultOptions,
    animationMode: string | undefined,
    idPrefix: string,
  ) {
    super(elementRef);
    this.tabIndex = parseInt(tabIndex) || 0;
    this.color = this.defaultColor = defaults.color || 'accent';
    this._noopAnimations = animationMode === 'NoopAnimations';
    this.id = this._uniqueId = `${idPrefix}${++nextUniqueId}`;
  }

  ngAfterContentInit() {
    this._focusMonitor.monitor(this._elementRef, true).subscribe(focusOrigin => {
      if (focusOrigin === 'keyboard' || focusOrigin === 'program') {
        this._focused = true;
      } else if (!focusOrigin) {
        // When a focused element becomes disabled, the browser *immediately* fires a blur event.
        // Angular does not expect events to be raised during change detection, so any state
        // change (such as a form control's ng-touched) will cause a changed-after-checked error.
        // See https://github.com/angular/angular/issues/17793. To work around this, we defer
        // telling the form control it has been touched until the next tick.
        Promise.resolve().then(() => {
          this._focused = false;
          this._onTouched();
          this._changeDetectorRef.markForCheck();
        });
      }
    });
  }

  ngOnDestroy() {
    this._focusMonitor.stopMonitoring(this._elementRef);
  }

  /**
   * Implemented as part of ControlValueAccessor.
   *
   * 作为 ControlValueAccessor 的一部分实现。
   *
   */
  writeValue(value: any): void {
    this.checked = !!value;
  }

  /**
   * Implemented as part of ControlValueAccessor.
   *
   * 作为 ControlValueAccessor 的一部分实现。
   *
   */
  registerOnChange(fn: any): void {
    this._onChange = fn;
  }

  /**
   * Implemented as part of ControlValueAccessor.
   *
   * 作为 ControlValueAccessor 的一部分实现。
   *
   */
  registerOnTouched(fn: any): void {
    this._onTouched = fn;
  }

  /**
   * Implemented as a part of ControlValueAccessor.
   *
   * 作为 ControlValueAccessor 的一部分实现。
   *
   */
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this._changeDetectorRef.markForCheck();
  }

  /**
   * Toggles the checked state of the slide-toggle.
   *
   * 切换滑块开关的勾选状态。
   *
   */
  toggle(): void {
    this.checked = !this.checked;
    this._onChange(this.checked);
  }

  /**
   * Emits a change event on the `change` output. Also notifies the FormControl about the change.
   *
   * 在 `change` 这个输出属性上发出更改事件。并通知 FormControl 有关更改。
   *
   */
  protected _emitChangeEvent() {
    this._onChange(this.checked);
    this.change.emit(this._createChangeEvent(this.checked));
  }
}

/**
 * Represents a slidable "switch" toggle that can be moved between on and off.
 *
 * 表示一个滑动“切换”开关，它可以在打开和关闭之间移动。
 *
 */
@Component({
  selector: 'mat-slide-toggle',
  exportAs: 'matSlideToggle',
  host: {
    'class': 'mat-slide-toggle',
    '[id]': 'id',
    // Needs to be removed since it causes some a11y issues (see #21266).
    '[attr.tabindex]': 'null',
    '[attr.aria-label]': 'null',
    '[attr.aria-labelledby]': 'null',
    '[attr.name]': 'null',
    '[class.mat-checked]': 'checked',
    '[class.mat-disabled]': 'disabled',
    '[class.mat-slide-toggle-label-before]': 'labelPosition == "before"',
    '[class._mat-animation-noopable]': '_noopAnimations',
  },
  templateUrl: 'slide-toggle.html',
  styleUrls: ['slide-toggle.css'],
  providers: [MAT_SLIDE_TOGGLE_VALUE_ACCESSOR],
  inputs: ['disabled', 'disableRipple', 'color', 'tabIndex'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatSlideToggle extends _MatSlideToggleBase<MatSlideToggleChange> {
  /**
   * Reference to the underlying input element.
   *
   * 对底层输入框元素的引用。
   *
   */
  @ViewChild('input') _inputElement: ElementRef<HTMLInputElement>;

  constructor(
    elementRef: ElementRef,
    focusMonitor: FocusMonitor,
    changeDetectorRef: ChangeDetectorRef,
    @Attribute('tabindex') tabIndex: string,
    @Inject(MAT_SLIDE_TOGGLE_DEFAULT_OPTIONS)
    defaults: MatSlideToggleDefaultOptions,
    @Optional() @Inject(ANIMATION_MODULE_TYPE) animationMode?: string,
  ) {
    super(
      elementRef,
      focusMonitor,
      changeDetectorRef,
      tabIndex,
      defaults,
      animationMode,
      'mat-slide-toggle-',
    );
  }

  protected _createChangeEvent(isChecked: boolean) {
    return new MatSlideToggleChange(this, isChecked);
  }

  /**
   * Method being called whenever the underlying input emits a change event.
   *
   * 每当底层输入框发出更改事件时调用的方法。
   *
   */
  _onChangeEvent(event: Event) {
    // We always have to stop propagation on the change event.
    // Otherwise the change event, from the input element, will bubble up and
    // emit its event object to the component's `change` output.
    event.stopPropagation();
    this.toggleChange.emit();

    // When the slide toggle's config disables toggle change event by setting
    // `disableToggleValue: true`, the slide toggle's value does not change, and the
    // checked state of the underlying input needs to be changed back.
    if (this.defaults.disableToggleValue) {
      this._inputElement.nativeElement.checked = this.checked;
      return;
    }

    // Sync the value from the underlying input element with the component instance.
    this.checked = this._inputElement.nativeElement.checked;

    // Emit our custom change event only if the underlying input emitted one. This ensures that
    // there is no change event, when the checked state changes programmatically.
    this._emitChangeEvent();
  }

  /**
   * Method being called whenever the slide-toggle has been clicked.
   *
   * 只要单击了滑块开关，就会调用该方法。
   *
   */
  _onInputClick(event: Event) {
    // We have to stop propagation for click events on the visual hidden input element.
    // By default, when a user clicks on a label element, a generated click event will be
    // dispatched on the associated input element. Since we are using a label element as our
    // root container, the click event on the `slide-toggle` will be executed twice.
    // The real click event will bubble up, and the generated click event also tries to bubble up.
    // This will lead to multiple click events.
    // Preventing bubbling for the second event will solve that issue.
    event.stopPropagation();
  }

  /**
   * Focuses the slide-toggle.
   *
   * 让此滑块开关获得焦点。
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
   * Method being called whenever the label text changes.
   *
   * 每当标签文本发生变化时就会被调用。
   *
   */
  _onLabelTextChange() {
    // Since the event of the `cdkObserveContent` directive runs outside of the zone, the
    // slide-toggle component will be only marked for check, but no actual change detection runs
    // automatically. Instead of going back into the zone in order to trigger a change detection
    // which causes *all* components to be checked (if explicitly marked or not using OnPush),
    // we only trigger an explicit change detection for the slide-toggle view and its children.
    this._changeDetectorRef.detectChanges();
  }
}
