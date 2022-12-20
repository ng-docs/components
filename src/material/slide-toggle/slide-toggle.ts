/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  AfterContentInit,
  Attribute,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Directive,
  ElementRef,
  EventEmitter,
  forwardRef,
  Inject,
  Input,
  OnDestroy,
  Optional,
  Output,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {ANIMATION_MODULE_TYPE} from '@angular/platform-browser/animations';
import {FocusMonitor, FocusOrigin} from '@angular/cdk/a11y';
import {
  MAT_SLIDE_TOGGLE_DEFAULT_OPTIONS,
  MatSlideToggleDefaultOptions,
} from './slide-toggle-config';
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
import {BooleanInput, coerceBooleanProperty} from '@angular/cdk/coercion';

/** @docs-private */
export const MAT_SLIDE_TOGGLE_VALUE_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => MatSlideToggle),
  multi: true,
};

/**
 * Change event object emitted by a slide toggle.
 *
 * 修改 MatSlideToggle 发出的事件对象。
 *
 */
export class MatSlideToggleChange {
  constructor(
    /**
     * The source slide toggle of the event.
     *
     * 发出此事件的源 MatSlideToggle。
     */
    public source: MatSlideToggle,
    /**
     * The new `checked` value of the slide toggle.
     *
     * 此 MatSlideToggle 的新 `checked` 值。
     */
    public checked: boolean,
  ) {}
}

// Increasing integer for generating unique ids for slide-toggle components.
let nextUniqueId = 0;

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
        this._changeDetectorRef.markForCheck();
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

@Component({
  selector: 'mat-slide-toggle',
  templateUrl: 'slide-toggle.html',
  styleUrls: ['slide-toggle.css'],
  inputs: ['disabled', 'disableRipple', 'color', 'tabIndex'],
  host: {
    'class': 'mat-mdc-slide-toggle',
    '[id]': 'id',
    // Needs to be removed since it causes some a11y issues (see #21266).
    '[attr.tabindex]': 'null',
    '[attr.aria-label]': 'null',
    '[attr.name]': 'null',
    '[attr.aria-labelledby]': 'null',
    '[class.mat-mdc-slide-toggle-focused]': '_focused',
    '[class.mat-mdc-slide-toggle-checked]': 'checked',
    '[class._mat-animation-noopable]': '_noopAnimations',
  },
  exportAs: 'matSlideToggle',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [MAT_SLIDE_TOGGLE_VALUE_ACCESSOR],
})
export class MatSlideToggle extends _MatSlideToggleBase<MatSlideToggleChange> {
  /** Unique ID for the label element. */
  _labelId: string;

  /** Returns the unique id for the visual hidden button. */
  get buttonId(): string {
    return `${this.id || this._uniqueId}-button`;
  }

  /** Reference to the MDC switch element. */
  @ViewChild('switch') _switchElement: ElementRef<HTMLElement>;

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
      'mat-mdc-slide-toggle-',
    );
    this._labelId = this._uniqueId + '-label';
  }

  /** Method being called whenever the underlying button is clicked. */
  _handleClick() {
    this.toggleChange.emit();

    if (!this.defaults.disableToggleValue) {
      this.checked = !this.checked;
      this._onChange(this.checked);
      this.change.emit(new MatSlideToggleChange(this, this.checked));
    }
  }

  /**
   * Focuses the slide-toggle.
   *
   * 让此滑块开关获得焦点。
   *
   */
  focus(): void {
    this._switchElement.nativeElement.focus();
  }

  protected _createChangeEvent(isChecked: boolean) {
    return new MatSlideToggleChange(this, isChecked);
  }

  _getAriaLabelledBy() {
    if (this.ariaLabelledby) {
      return this.ariaLabelledby;
    }

    // Even though we have a `label` element with a `for` pointing to the button, we need the
    // `aria-labelledby`, because the button gets flagged as not having a label by tools like axe.
    return this.ariaLabel ? null : this._labelId;
  }
}
