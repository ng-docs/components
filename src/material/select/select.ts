/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ActiveDescendantKeyManager, LiveAnnouncer} from '@angular/cdk/a11y';
import {Directionality} from '@angular/cdk/bidi';
import {
  BooleanInput,
  coerceBooleanProperty,
  coerceNumberProperty,
  NumberInput,
} from '@angular/cdk/coercion';
import {SelectionModel} from '@angular/cdk/collections';
import {
  A,
  DOWN_ARROW,
  ENTER,
  hasModifierKey,
  LEFT_ARROW,
  RIGHT_ARROW,
  SPACE,
  UP_ARROW,
} from '@angular/cdk/keycodes';
import {
  CdkConnectedOverlay,
  CdkOverlayOrigin,
  ConnectedPosition,
  Overlay,
  ScrollStrategy,
} from '@angular/cdk/overlay';
import {ViewportRuler} from '@angular/cdk/scrolling';
import {
  AfterContentInit,
  AfterViewInit,
  Attribute,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  ContentChildren,
  Directive,
  DoCheck,
  ElementRef,
  EventEmitter,
  Inject,
  InjectionToken,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  Optional,
  Output,
  QueryList,
  Self,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  FormGroupDirective,
  NgControl,
  NgForm,
  Validators,
} from '@angular/forms';
import {
  CanDisable,
  CanDisableRipple,
  CanUpdateErrorState,
  ErrorStateMatcher,
  HasTabIndex,
  MatOptgroup,
  MatOption,
  MatOptionSelectionChange,
  MAT_OPTGROUP,
  MAT_OPTION_PARENT_COMPONENT,
  mixinDisabled,
  mixinDisableRipple,
  mixinErrorState,
  mixinTabIndex,
  _countGroupLabelsBeforeOption,
  _getOptionScrollPosition,
  _MatOptionBase,
} from '@angular/material/core';
import {MatFormField, MatFormFieldControl, MAT_FORM_FIELD} from '@angular/material/form-field';
import {defer, merge, Observable, Subject} from 'rxjs';
import {
  distinctUntilChanged,
  filter,
  map,
  startWith,
  switchMap,
  take,
  takeUntil,
} from 'rxjs/operators';
import {matSelectAnimations} from './select-animations';
import {
  getMatSelectDynamicMultipleError,
  getMatSelectNonArrayValueError,
  getMatSelectNonFunctionValueError,
} from './select-errors';

let nextUniqueId = 0;

/** Injection token that determines the scroll handling while a select is open. */
export const MAT_SELECT_SCROLL_STRATEGY = new InjectionToken<() => ScrollStrategy>(
  'mat-select-scroll-strategy',
);

/** @docs-private */
export function MAT_SELECT_SCROLL_STRATEGY_PROVIDER_FACTORY(
  overlay: Overlay,
): () => ScrollStrategy {
  return () => overlay.scrollStrategies.reposition();
}

/**
 * Object that can be used to configure the default options for the select module.
 *
 * 可用于配置选择框模块默认选项的对象。
 *
 */
export interface MatSelectConfig {
  /**
   * Whether option centering should be disabled.
   *
   * 是否应禁止选项居中。
   *
   */
  disableOptionCentering?: boolean;

  /**
   * Time to wait in milliseconds after the last keystroke before moving focus to an item.
   *
   * 在将焦点移动到某个条目前，在最后一次按键后要等待的时间（以毫秒为单位）。
   *
   */
  typeaheadDebounceInterval?: number;

  /**
   * Class or list of classes to be applied to the menu's overlay panel.
   *
   * 要应用于菜单浮层面板的类或类列表。
   *
   */
  overlayPanelClass?: string | string[];
}

/**
 * Injection token that can be used to provide the default options the select module.
 *
 * 这个注入令牌可以用来为选择框模块提供默认选项。
 *
 */
export const MAT_SELECT_CONFIG = new InjectionToken<MatSelectConfig>('MAT_SELECT_CONFIG');

/** @docs-private */
export const MAT_SELECT_SCROLL_STRATEGY_PROVIDER = {
  provide: MAT_SELECT_SCROLL_STRATEGY,
  deps: [Overlay],
  useFactory: MAT_SELECT_SCROLL_STRATEGY_PROVIDER_FACTORY,
};

/**
 * Injection token that can be used to reference instances of `MatSelectTrigger`. It serves as
 * alternative token to the actual `MatSelectTrigger` class which could cause unnecessary
 * retention of the class and its directive metadata.
 */
export const MAT_SELECT_TRIGGER = new InjectionToken<MatSelectTrigger>('MatSelectTrigger');

/** Change event object that is emitted when the select value has changed. */
export class MatSelectChange {
  constructor(
    /**
     * Reference to the select that emitted the change event.
     *
     * 对发出此变更事件的选择框的引用。
     */
    public source: MatSelect,
    /**
     * Current value of the select that emitted the event.
     *
     * 发出此事件的Current value of the select。
     *
     */
    public value: any,
  ) {}
}

// Boilerplate for applying mixins to MatSelect.
/** @docs-private */
const _MatSelectMixinBase = mixinDisableRipple(
  mixinTabIndex(
    mixinDisabled(
      mixinErrorState(
        class {
          /**
           * Emits whenever the component state changes and should cause the parent
           * form-field to update. Implemented as part of `MatFormFieldControl`.
           *
           * 每当组件状态更改并会导致父表单字段更新时发出。作为 `MatFormFieldControl` 的一部分实现。
           *
           * @docs-private
           */
          readonly stateChanges = new Subject<void>();

          constructor(
            public _elementRef: ElementRef,
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
      ),
    ),
  ),
);

/** Base class with all of the `MatSelect` functionality. */
@Directive()
export abstract class _MatSelectBase<C>
  extends _MatSelectMixinBase
  implements
    AfterContentInit,
    OnChanges,
    OnDestroy,
    OnInit,
    DoCheck,
    ControlValueAccessor,
    CanDisable,
    HasTabIndex,
    MatFormFieldControl<any>,
    CanUpdateErrorState,
    CanDisableRipple
{
  /**
   * All of the defined select options.
   *
   * 所有已定义的选择框选项。
   *
   */
  abstract options: QueryList<_MatOptionBase>;

  // TODO(crisbeto): this is only necessary for the non-MDC select, but it's technically a
  // public API so we have to keep it. It should be deprecated and removed eventually.
  /**
   * All of the defined groups of options.
   *
   * 所有已定义的选项组。
   *
   */
  abstract optionGroups: QueryList<MatOptgroup>;

  /**
   * User-supplied override of the trigger element.
   *
   * 用户提供的触发器元素，会代替默认的。
   *
   */
  abstract customTrigger: {};

  /**
   * This position config ensures that the top "start" corner of the overlay
   * is aligned with with the top "start" of the origin by default (overlapping
   * the trigger completely). If the panel cannot fit below the trigger, it
   * will fall back to a position above the trigger.
   *
   * 这个定位选项用于确保默认情况下浮层的顶部 “start” 角对齐到其源的顶部 “start” 角（完全盖住此触发器）。
   * 如果此面板无法放在触发器的下方，它就会回到触发器上方的某个位置。
   *
   */
  abstract _positions: ConnectedPosition[];

  /**
   * Scrolls a particular option into the view.
   *
   * 把一个特定的选项滚动到视图中。
   *
   */
  protected abstract _scrollOptionIntoView(index: number): void;

  /**
   * Called when the panel has been opened and the overlay has settled on its final position.
   *
   * 当面板打开并且浮层已经固定在其最终位置时调用。
   *
   */
  protected abstract _positioningSettled(): void;

  /**
   * Creates a change event object that should be emitted by the select.
   *
   * 创建一个应该由本选择框发出的 change 事件对象。
   *
   */
  protected abstract _getChangeEvent(value: any): C;

  /**
   * Factory function used to create a scroll strategy for this select.
   *
   * 这个工厂函数用于为这个选择框创建一个滚动策略。
   *
   */
  private _scrollStrategyFactory: () => ScrollStrategy;

  /**
   * Whether or not the overlay panel is open.
   *
   * 浮层面板是否打开。
   *
   */
  private _panelOpen = false;

  /**
   * Comparison function to specify which option is displayed. Defaults to object equality.
   *
   * 比较函数，用于指定要显示哪个选项。默认为比较对象引用。
   *
   */
  private _compareWith = (o1: any, o2: any) => o1 === o2;

  /**
   * Unique id for this input.
   *
   * 此输入框元素的唯一 ID。
   *
   */
  private _uid = `mat-select-${nextUniqueId++}`;

  /**
   * Current `aria-labelledby` value for the select trigger.
   *
   * 此选择框触发器的当前 `aria-labelledby` 值。
   *
   */
  private _triggerAriaLabelledBy: string | null = null;

  /**
   * Keeps track of the previous form control assigned to the select.
   * Used to detect if it has changed.
   *
   * 跟踪分配给此选择框的前一个表单控件。用于检测是否已更改。
   *
   */
  private _previousControl: AbstractControl | null | undefined;

  /**
   * Emits whenever the component is destroyed.
   *
   * 只要组件被销毁，就会触发。
   *
   */
  protected readonly _destroy = new Subject<void>();

  /**
   * Implemented as part of MatFormFieldControl.
   *
   * 作为 MatFormFieldControl 的一部分实现。
   *
   * @docs-private
   */
  @Input('aria-describedby') userAriaDescribedBy: string;

  /**
   * Deals with the selection logic.
   *
   * 处理选择逻辑。
   *
   */
  _selectionModel: SelectionModel<MatOption>;

  /**
   * Manages keyboard events for options in the panel.
   *
   * 管理面板中各选项的键盘事件。
   *
   */
  _keyManager: ActiveDescendantKeyManager<MatOption>;

  /** `View -> model callback called when value changes` */
  _onChange: (value: any) => void = () => {};

  /** `View -> model callback called when select has been touched` */
  _onTouched = () => {};

  /**
   * ID for the DOM node containing the select's value.
   *
   * 包含选择框值的 DOM 节点的 ID。
   *
   */
  _valueId = `mat-select-value-${nextUniqueId++}`;

  /**
   * Emits when the panel element is finished transforming in.
   *
   * 当面板元素完成转换时会触发。
   *
   */
  readonly _panelDoneAnimatingStream = new Subject<string>();

  /**
   * Strategy that will be used to handle scrolling while the select panel is open.
   *
   * 当选择面板打开时，用来处理滚动的策略。
   *
   */
  _scrollStrategy: ScrollStrategy;

  _overlayPanelClass: string | string[] = this._defaultOptions?.overlayPanelClass || '';

  /**
   * Whether the select is focused.
   *
   * 此选择框是否拥有焦点。
   *
   */
  get focused(): boolean {
    return this._focused || this._panelOpen;
  }
  private _focused = false;

  /**
   * A name for this control that can be used by `mat-form-field`.
   *
   * 这个控件的名字，可以被 `mat-form-field` 使用。
   *
   */
  controlType = 'mat-select';

  /**
   * Trigger that opens the select.
   *
   * 用于打开选择框的触发器。
   *
   */
  @ViewChild('trigger') trigger: ElementRef;

  /**
   * Panel containing the select options.
   *
   * 包含选择框选项的面板。
   *
   */
  @ViewChild('panel') panel: ElementRef;

  /**
   * Overlay pane containing the options.
   *
   * 包含此选项的浮层窗格。
   *
   */
  @ViewChild(CdkConnectedOverlay)
  protected _overlayDir: CdkConnectedOverlay;

  /**
   * Classes to be passed to the select panel. Supports the same syntax as `ngClass`.
   *
   * 要传递给选择框面板的类。语法与 `ngClass` 相同。
   *
   */
  @Input() panelClass: string | string[] | Set<string> | {[key: string]: any};

  /**
   * Placeholder to be shown if no value has been selected.
   *
   * 如果没有选定任何值，就会显示此占位符。
   *
   */
  @Input()
  get placeholder(): string {
    return this._placeholder;
  }
  set placeholder(value: string) {
    this._placeholder = value;
    this.stateChanges.next();
  }
  private _placeholder: string;

  /**
   * Whether the component is required.
   *
   * 该组件是否必填项。
   *
   */
  @Input()
  get required(): boolean {
    return this._required ?? this.ngControl?.control?.hasValidator(Validators.required) ?? false;
  }
  set required(value: BooleanInput) {
    this._required = coerceBooleanProperty(value);
    this.stateChanges.next();
  }
  private _required: boolean | undefined;

  /**
   * Whether the user should be allowed to select multiple options.
   *
   * 是否允许用户选择多个选项。
   *
   */
  @Input()
  get multiple(): boolean {
    return this._multiple;
  }
  set multiple(value: BooleanInput) {
    if (this._selectionModel && (typeof ngDevMode === 'undefined' || ngDevMode)) {
      throw getMatSelectDynamicMultipleError();
    }

    this._multiple = coerceBooleanProperty(value);
  }
  private _multiple: boolean = false;

  /**
   * Whether to center the active option over the trigger.
   *
   * 是否要把活动选项置于触发器的中心位置。
   *
   */
  @Input()
  get disableOptionCentering(): boolean {
    return this._disableOptionCentering;
  }
  set disableOptionCentering(value: BooleanInput) {
    this._disableOptionCentering = coerceBooleanProperty(value);
  }
  private _disableOptionCentering = this._defaultOptions?.disableOptionCentering ?? false;

  /**
   * Function to compare the option values with the selected values. The first argument
   * is a value from an option. The second is a value from the selection. A boolean
   * should be returned.
   *
   * 比较选项值和选定值的函数。第一个参数就是选项中的值。第二个参数是选定的值。应该返回一个布尔值。
   *
   */
  @Input()
  get compareWith() {
    return this._compareWith;
  }
  set compareWith(fn: (o1: any, o2: any) => boolean) {
    if (typeof fn !== 'function' && (typeof ngDevMode === 'undefined' || ngDevMode)) {
      throw getMatSelectNonFunctionValueError();
    }
    this._compareWith = fn;
    if (this._selectionModel) {
      // A different comparator means the selection could change.
      this._initializeSelection();
    }
  }

  /**
   * Value of the select control.
   *
   * 选择框控件的值。
   *
   */
  @Input()
  get value(): any {
    return this._value;
  }
  set value(newValue: any) {
    const hasAssigned = this._assignValue(newValue);

    if (hasAssigned) {
      this._onChange(newValue);
    }
  }
  private _value: any;

  /**
   * Aria label of the select.
   *
   * 此选择框的 aria-label。
   *
   */
  @Input('aria-label') ariaLabel: string = '';

  /**
   * Input that can be used to specify the `aria-labelledby` attribute.
   *
   * 用来指定 `aria-labelledby` 属性的输入属性。
   *
   */
  @Input('aria-labelledby') ariaLabelledby: string;

  /**
   * Object used to control when error messages are shown.
   *
   * 用于控制何时显示错误信息的对象。
   *
   */
  @Input() override errorStateMatcher: ErrorStateMatcher;

  /**
   * Time to wait in milliseconds after the last keystroke before moving focus to an item.
   *
   * 在将焦点移动到某个条目之前，最后一次按键后要等待的时间（以毫秒为单位）。
   *
   */
  @Input()
  get typeaheadDebounceInterval(): number {
    return this._typeaheadDebounceInterval;
  }
  set typeaheadDebounceInterval(value: NumberInput) {
    this._typeaheadDebounceInterval = coerceNumberProperty(value);
  }
  private _typeaheadDebounceInterval: number;

  /**
   * Function used to sort the values in a select in multiple mode.
   * Follows the same logic as `Array.prototype.sort`.
   *
   * 函数用于对多选模式选择框中的值进行排序。与 `Array.prototype.sort` 的逻辑相同。
   *
   */
  @Input() sortComparator: (a: MatOption, b: MatOption, options: MatOption[]) => number;

  /**
   * Unique id of the element.
   *
   * 元素的唯一 id。
   *
   */
  @Input()
  get id(): string {
    return this._id;
  }
  set id(value: string) {
    this._id = value || this._uid;
    this.stateChanges.next();
  }
  private _id: string;

  /**
   * Combined stream of all of the child options' change events.
   *
   * 所有子选项的 'change' 事件的组合流。
   *
   */
  readonly optionSelectionChanges: Observable<MatOptionSelectionChange> = defer(() => {
    const options = this.options;

    if (options) {
      return options.changes.pipe(
        startWith(options),
        switchMap(() => merge(...options.map(option => option.onSelectionChange))),
      );
    }

    return this._ngZone.onStable.pipe(
      take(1),
      switchMap(() => this.optionSelectionChanges),
    );
  }) as Observable<MatOptionSelectionChange>;

  /**
   * Event emitted when the select panel has been toggled.
   *
   * 切换选择框面板时会发生事件。
   *
   */
  @Output() readonly openedChange: EventEmitter<boolean> = new EventEmitter<boolean>();

  /**
   * Event emitted when the select has been opened.
   *
   * 当选择框被打开时会发出本事件。
   *
   */
  @Output('opened') readonly _openedStream: Observable<void> = this.openedChange.pipe(
    filter(o => o),
    map(() => {}),
  );

  /**
   * Event emitted when the select has been closed.
   *
   * 选择框关闭后会触发的事件。
   *
   */
  @Output('closed') readonly _closedStream: Observable<void> = this.openedChange.pipe(
    filter(o => !o),
    map(() => {}),
  );

  /**
   * Event emitted when the selected value has been changed by the user.
   *
   * 当用户更改了选定值时发出的事件。
   *
   */
  @Output() readonly selectionChange: EventEmitter<C> = new EventEmitter<C>();

  /**
   * Event that emits whenever the raw value of the select changes. This is here primarily
   * to facilitate the two-way binding for the `value` input.
   *
   * 每当选择框原始值发生变化时都会发出本事件。这主要是为了方便对 `value` 输入属性的双向绑定。
   *
   * @docs-private
   */
  @Output() readonly valueChange: EventEmitter<any> = new EventEmitter<any>();

  constructor(
    protected _viewportRuler: ViewportRuler,
    protected _changeDetectorRef: ChangeDetectorRef,
    protected _ngZone: NgZone,
    _defaultErrorStateMatcher: ErrorStateMatcher,
    elementRef: ElementRef,
    @Optional() private _dir: Directionality,
    @Optional() _parentForm: NgForm,
    @Optional() _parentFormGroup: FormGroupDirective,
    @Optional() @Inject(MAT_FORM_FIELD) protected _parentFormField: MatFormField,
    @Self() @Optional() ngControl: NgControl,
    @Attribute('tabindex') tabIndex: string,
    @Inject(MAT_SELECT_SCROLL_STRATEGY) scrollStrategyFactory: any,
    private _liveAnnouncer: LiveAnnouncer,
    @Optional() @Inject(MAT_SELECT_CONFIG) private _defaultOptions?: MatSelectConfig,
  ) {
    super(elementRef, _defaultErrorStateMatcher, _parentForm, _parentFormGroup, ngControl);

    if (this.ngControl) {
      // Note: we provide the value accessor through here, instead of
      // the `providers` to avoid running into a circular import.
      this.ngControl.valueAccessor = this;
    }

    // Note that we only want to set this when the defaults pass it in, otherwise it should
    // stay as `undefined` so that it falls back to the default in the key manager.
    if (_defaultOptions?.typeaheadDebounceInterval != null) {
      this._typeaheadDebounceInterval = _defaultOptions.typeaheadDebounceInterval;
    }

    this._scrollStrategyFactory = scrollStrategyFactory;
    this._scrollStrategy = this._scrollStrategyFactory();
    this.tabIndex = parseInt(tabIndex) || 0;

    // Force setter to be called in case id was not specified.
    this.id = this.id;
  }

  ngOnInit() {
    this._selectionModel = new SelectionModel<MatOption>(this.multiple);
    this.stateChanges.next();

    // We need `distinctUntilChanged` here, because some browsers will
    // fire the animation end event twice for the same animation. See:
    // https://github.com/angular/angular/issues/24084
    this._panelDoneAnimatingStream
      .pipe(distinctUntilChanged(), takeUntil(this._destroy))
      .subscribe(() => this._panelDoneAnimating(this.panelOpen));
  }

  ngAfterContentInit() {
    this._initKeyManager();

    this._selectionModel.changed.pipe(takeUntil(this._destroy)).subscribe(event => {
      event.added.forEach(option => option.select());
      event.removed.forEach(option => option.deselect());
    });

    this.options.changes.pipe(startWith(null), takeUntil(this._destroy)).subscribe(() => {
      this._resetOptions();
      this._initializeSelection();
    });
  }

  ngDoCheck() {
    const newAriaLabelledby = this._getTriggerAriaLabelledby();
    const ngControl = this.ngControl;

    // We have to manage setting the `aria-labelledby` ourselves, because part of its value
    // is computed as a result of a content query which can cause this binding to trigger a
    // "changed after checked" error.
    if (newAriaLabelledby !== this._triggerAriaLabelledBy) {
      const element: HTMLElement = this._elementRef.nativeElement;
      this._triggerAriaLabelledBy = newAriaLabelledby;
      if (newAriaLabelledby) {
        element.setAttribute('aria-labelledby', newAriaLabelledby);
      } else {
        element.removeAttribute('aria-labelledby');
      }
    }

    if (ngControl) {
      // The disabled state might go out of sync if the form group is swapped out. See #17860.
      if (this._previousControl !== ngControl.control) {
        if (
          this._previousControl !== undefined &&
          ngControl.disabled !== null &&
          ngControl.disabled !== this.disabled
        ) {
          this.disabled = ngControl.disabled;
        }

        this._previousControl = ngControl.control;
      }

      this.updateErrorState();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    // Updating the disabled state is handled by `mixinDisabled`, but we need to additionally let
    // the parent form field know to run change detection when the disabled state changes.
    if (changes['disabled'] || changes['userAriaDescribedBy']) {
      this.stateChanges.next();
    }

    if (changes['typeaheadDebounceInterval'] && this._keyManager) {
      this._keyManager.withTypeAhead(this._typeaheadDebounceInterval);
    }
  }

  ngOnDestroy() {
    this._keyManager?.destroy();
    this._destroy.next();
    this._destroy.complete();
    this.stateChanges.complete();
  }

  /**
   * Toggles the overlay panel open or closed.
   *
   * 浮层面板是否打开或关闭。
   *
   */
  toggle(): void {
    this.panelOpen ? this.close() : this.open();
  }

  /**
   * Opens the overlay panel.
   *
   * 打开浮层面板
   *
   */
  open(): void {
    if (this._canOpen()) {
      this._panelOpen = true;
      this._keyManager.withHorizontalOrientation(null);
      this._highlightCorrectOption();
      this._changeDetectorRef.markForCheck();
    }
  }

  /**
   * Closes the overlay panel and focuses the host element.
   *
   * 关闭浮层窗格并让宿主元素获得焦点。
   *
   */
  close(): void {
    if (this._panelOpen) {
      this._panelOpen = false;
      this._keyManager.withHorizontalOrientation(this._isRtl() ? 'rtl' : 'ltr');
      this._changeDetectorRef.markForCheck();
      this._onTouched();
    }
  }

  /**
   * Sets the select's value. Part of the ControlValueAccessor interface
   * required to integrate with Angular's core forms API.
   *
   * 设置选择框的值。作为 ControlValueAccessor 接口的一部分，需要与 Angular 的核心表单 API 集成。
   *
   * @param value New value to be written to the model.
   *
   * 要写入模型的新值。
   *
   */
  writeValue(value: any): void {
    this._assignValue(value);
  }

  /**
   * Saves a callback function to be invoked when the select's value
   * changes from user input. Part of the ControlValueAccessor interface
   * required to integrate with Angular's core forms API.
   *
   * 保存一个回调函数，并在选择框的值因为用户输入而改变时调用它。
   * 作为 ControlValueAccessor 接口的一部分，需要与 Angular 的核心表单 API 集成。
   *
   * @param fn Callback to be triggered when the value changes.
   *
   * 当值发生变化时，会触发的回调函数。
   *
   */
  registerOnChange(fn: (value: any) => void): void {
    this._onChange = fn;
  }

  /**
   * Saves a callback function to be invoked when the select is blurred
   * by the user. Part of the ControlValueAccessor interface required
   * to integrate with Angular's core forms API.
   *
   * 保存一个回调函数，并在用户让此选择框失焦时调用它。作为 ControlValueAccessor 接口的一部分，需要与 Angular 的核心表单 API 集成。
   *
   * @param fn Callback to be triggered when the component has been touched.
   *
   * 当该组件被接触过时，会触发的回调函数。
   *
   */
  registerOnTouched(fn: () => {}): void {
    this._onTouched = fn;
  }

  /**
   * Disables the select. Part of the ControlValueAccessor interface required
   * to integrate with Angular's core forms API.
   *
   * 禁用此选择框。作为 ControlValueAccessor 接口的一部分，需要与 Angular 的核心表单 API 集成。
   *
   * @param isDisabled Sets whether the component is disabled.
   *
   * 设置是否禁用该组件。
   *
   */
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this._changeDetectorRef.markForCheck();
    this.stateChanges.next();
  }

  /**
   * Whether or not the overlay panel is open.
   *
   * 浮层面板是否打开了。
   *
   */
  get panelOpen(): boolean {
    return this._panelOpen;
  }

  /**
   * The currently selected option.
   *
   * 当前选定的选项。
   *
   */
  get selected(): MatOption | MatOption[] {
    return this.multiple ? this._selectionModel?.selected || [] : this._selectionModel?.selected[0];
  }

  /**
   * The value displayed in the trigger.
   *
   * 触发器中显示的值。
   *
   */
  get triggerValue(): string {
    if (this.empty) {
      return '';
    }

    if (this._multiple) {
      const selectedOptions = this._selectionModel.selected.map(option => option.viewValue);

      if (this._isRtl()) {
        selectedOptions.reverse();
      }

      // TODO(crisbeto): delimiter should be configurable for proper localization.
      return selectedOptions.join(', ');
    }

    return this._selectionModel.selected[0].viewValue;
  }

  /**
   * Whether the element is in RTL mode.
   *
   * 该元素是否处于 RTL 模式。
   *
   */
  _isRtl(): boolean {
    return this._dir ? this._dir.value === 'rtl' : false;
  }

  /**
   * Handles all keydown events on the select.
   *
   * 处理选择框中所有 keydown 事件。
   *
   */
  _handleKeydown(event: KeyboardEvent): void {
    if (!this.disabled) {
      this.panelOpen ? this._handleOpenKeydown(event) : this._handleClosedKeydown(event);
    }
  }

  /**
   * Handles keyboard events while the select is closed.
   *
   * 此选择框关闭后，处理键盘事件。
   *
   */
  private _handleClosedKeydown(event: KeyboardEvent): void {
    const keyCode = event.keyCode;
    const isArrowKey =
      keyCode === DOWN_ARROW ||
      keyCode === UP_ARROW ||
      keyCode === LEFT_ARROW ||
      keyCode === RIGHT_ARROW;
    const isOpenKey = keyCode === ENTER || keyCode === SPACE;
    const manager = this._keyManager;

    // Open the select on ALT + arrow key to match the native <select>
    if (
      (!manager.isTyping() && isOpenKey && !hasModifierKey(event)) ||
      ((this.multiple || event.altKey) && isArrowKey)
    ) {
      event.preventDefault(); // prevents the page from scrolling down when pressing space
      this.open();
    } else if (!this.multiple) {
      const previouslySelectedOption = this.selected;
      manager.onKeydown(event);
      const selectedOption = this.selected;

      // Since the value has changed, we need to announce it ourselves.
      if (selectedOption && previouslySelectedOption !== selectedOption) {
        // We set a duration on the live announcement, because we want the live element to be
        // cleared after a while so that users can't navigate to it using the arrow keys.
        this._liveAnnouncer.announce((selectedOption as MatOption).viewValue, 10000);
      }
    }
  }

  /**
   * Handles keyboard events when the selected is open.
   *
   * 当选择框打开时，处理键盘事件。
   *
   */
  private _handleOpenKeydown(event: KeyboardEvent): void {
    const manager = this._keyManager;
    const keyCode = event.keyCode;
    const isArrowKey = keyCode === DOWN_ARROW || keyCode === UP_ARROW;
    const isTyping = manager.isTyping();

    if (isArrowKey && event.altKey) {
      // Close the select on ALT + arrow key to match the native <select>
      event.preventDefault();
      this.close();
      // Don't do anything in this case if the user is typing,
      // because the typing sequence can include the space key.
    } else if (
      !isTyping &&
      (keyCode === ENTER || keyCode === SPACE) &&
      manager.activeItem &&
      !hasModifierKey(event)
    ) {
      event.preventDefault();
      manager.activeItem._selectViaInteraction();
    } else if (!isTyping && this._multiple && keyCode === A && event.ctrlKey) {
      event.preventDefault();
      const hasDeselectedOptions = this.options.some(opt => !opt.disabled && !opt.selected);

      this.options.forEach(option => {
        if (!option.disabled) {
          hasDeselectedOptions ? option.select() : option.deselect();
        }
      });
    } else {
      const previouslyFocusedIndex = manager.activeItemIndex;

      manager.onKeydown(event);

      if (
        this._multiple &&
        isArrowKey &&
        event.shiftKey &&
        manager.activeItem &&
        manager.activeItemIndex !== previouslyFocusedIndex
      ) {
        manager.activeItem._selectViaInteraction();
      }
    }
  }

  _onFocus() {
    if (!this.disabled) {
      this._focused = true;
      this.stateChanges.next();
    }
  }

  /**
   * Calls the touched callback only if the panel is closed. Otherwise, the trigger will
   * "blur" to the panel when it opens, causing a false positive.
   *
   * 只有当面板关闭时才调用“被接触过”回调。否则，触发器会在面板打开时“失焦”，造成误报。
   *
   */
  _onBlur() {
    this._focused = false;
    this._keyManager?.cancelTypeahead();

    if (!this.disabled && !this.panelOpen) {
      this._onTouched();
      this._changeDetectorRef.markForCheck();
      this.stateChanges.next();
    }
  }

  /**
   * Callback that is invoked when the overlay panel has been attached.
   *
   * 附着到浮层面板时调用的回调函数。
   *
   */
  _onAttached(): void {
    this._overlayDir.positionChange.pipe(take(1)).subscribe(() => {
      this._changeDetectorRef.detectChanges();
      this._positioningSettled();
    });
  }

  /**
   * Returns the theme to be used on the panel.
   *
   * 返回要在面板上使用的主题。
   *
   */
  _getPanelTheme(): string {
    return this._parentFormField ? `mat-${this._parentFormField.color}` : '';
  }

  /**
   * Whether the select has a value.
   *
   * 此选择框是否有值。
   *
   */
  get empty(): boolean {
    return !this._selectionModel || this._selectionModel.isEmpty();
  }

  private _initializeSelection(): void {
    // Defer setting the value in order to avoid the "Expression
    // has changed after it was checked" errors from Angular.
    Promise.resolve().then(() => {
      if (this.ngControl) {
        this._value = this.ngControl.value;
      }

      this._setSelectionByValue(this._value);
      this.stateChanges.next();
    });
  }

  /**
   * Sets the selected option based on a value. If no option can be
   * found with the designated value, the select trigger is cleared.
   *
   * 根据值设置选定的选项。如果找不到指定值的选项，就清除选择框的触发器。
   *
   */
  private _setSelectionByValue(value: any | any[]): void {
    this._selectionModel.selected.forEach(option => option.setInactiveStyles());
    this._selectionModel.clear();

    if (this.multiple && value) {
      if (!Array.isArray(value) && (typeof ngDevMode === 'undefined' || ngDevMode)) {
        throw getMatSelectNonArrayValueError();
      }

      value.forEach((currentValue: any) => this._selectOptionByValue(currentValue));
      this._sortValues();
    } else {
      const correspondingOption = this._selectOptionByValue(value);

      // Shift focus to the active item. Note that we shouldn't do this in multiple
      // mode, because we don't know what option the user interacted with last.
      if (correspondingOption) {
        this._keyManager.updateActiveItem(correspondingOption);
      } else if (!this.panelOpen) {
        // Otherwise reset the highlighted option. Note that we only want to do this while
        // closed, because doing it while open can shift the user's focus unnecessarily.
        this._keyManager.updateActiveItem(-1);
      }
    }

    this._changeDetectorRef.markForCheck();
  }

  /**
   * Finds and selects and option based on its value.
   *
   * 根据值在选项中查找，并选定它。
   *
   * @returns Option that has the corresponding value.
   *
   * 具有相应值的选项。
   */
  private _selectOptionByValue(value: any): MatOption | undefined {
    const correspondingOption = this.options.find((option: MatOption) => {
      // Skip options that are already in the model. This allows us to handle cases
      // where the same primitive value is selected multiple times.
      if (this._selectionModel.isSelected(option)) {
        return false;
      }

      try {
        // Treat null as a special reset value.
        return option.value != null && this._compareWith(option.value, value);
      } catch (error) {
        if (typeof ngDevMode === 'undefined' || ngDevMode) {
          // Notify developers of errors in their comparator.
          console.warn(error);
        }
        return false;
      }
    });

    if (correspondingOption) {
      this._selectionModel.select(correspondingOption);
    }

    return correspondingOption;
  }

  /**
   * Assigns a specific value to the select. Returns whether the value has changed.
   *
   * 将特定值赋值给此选择框。返回此值是否已更改。
   *
   */
  private _assignValue(newValue: any | any[]): boolean {
    // Always re-assign an array, because it might have been mutated.
    if (newValue !== this._value || (this._multiple && Array.isArray(newValue))) {
      if (this.options) {
        this._setSelectionByValue(newValue);
      }

      this._value = newValue;
      return true;
    }
    return false;
  }

  /**
   * Sets up a key manager to listen to keyboard events on the overlay panel.
   *
   * 设置一个按键管理器来监听浮层面板上的键盘事件。
   *
   */
  private _initKeyManager() {
    this._keyManager = new ActiveDescendantKeyManager<MatOption>(this.options)
      .withTypeAhead(this._typeaheadDebounceInterval)
      .withVerticalOrientation()
      .withHorizontalOrientation(this._isRtl() ? 'rtl' : 'ltr')
      .withHomeAndEnd()
      .withPageUpDown()
      .withAllowedModifierKeys(['shiftKey']);

    this._keyManager.tabOut.subscribe(() => {
      if (this.panelOpen) {
        // Select the active item when tabbing away. This is consistent with how the native
        // select behaves. Note that we only want to do this in single selection mode.
        if (!this.multiple && this._keyManager.activeItem) {
          this._keyManager.activeItem._selectViaInteraction();
        }

        // Restore focus to the trigger before closing. Ensures that the focus
        // position won't be lost if the user got focus into the overlay.
        this.focus();
        this.close();
      }
    });

    this._keyManager.change.subscribe(() => {
      if (this._panelOpen && this.panel) {
        this._scrollOptionIntoView(this._keyManager.activeItemIndex || 0);
      } else if (!this._panelOpen && !this.multiple && this._keyManager.activeItem) {
        this._keyManager.activeItem._selectViaInteraction();
      }
    });
  }

  /**
   * Drops current option subscriptions and IDs and resets from scratch.
   *
   * 删除当前选项的订阅和 ID，并重置为初始状态。
   *
   */
  private _resetOptions(): void {
    const changedOrDestroyed = merge(this.options.changes, this._destroy);

    this.optionSelectionChanges.pipe(takeUntil(changedOrDestroyed)).subscribe(event => {
      this._onSelect(event.source, event.isUserInput);

      if (event.isUserInput && !this.multiple && this._panelOpen) {
        this.close();
        this.focus();
      }
    });

    // Listen to changes in the internal state of the options and react accordingly.
    // Handles cases like the labels of the selected options changing.
    merge(...this.options.map(option => option._stateChanges))
      .pipe(takeUntil(changedOrDestroyed))
      .subscribe(() => {
        // `_stateChanges` can fire as a result of a change in the label's DOM value which may
        // be the result of an expression changing. We have to use `detectChanges` in order
        // to avoid "changed after checked" errors (see #14793).
        this._changeDetectorRef.detectChanges();
        this.stateChanges.next();
      });
  }

  /**
   * Invoked when an option is clicked.
   *
   * 单击某个选项时调用。
   *
   */
  private _onSelect(option: MatOption, isUserInput: boolean): void {
    const wasSelected = this._selectionModel.isSelected(option);

    if (option.value == null && !this._multiple) {
      option.deselect();
      this._selectionModel.clear();

      if (this.value != null) {
        this._propagateChanges(option.value);
      }
    } else {
      if (wasSelected !== option.selected) {
        option.selected
          ? this._selectionModel.select(option)
          : this._selectionModel.deselect(option);
      }

      if (isUserInput) {
        this._keyManager.setActiveItem(option);
      }

      if (this.multiple) {
        this._sortValues();

        if (isUserInput) {
          // In case the user selected the option with their mouse, we
          // want to restore focus back to the trigger, in order to
          // prevent the select keyboard controls from clashing with
          // the ones from `mat-option`.
          this.focus();
        }
      }
    }

    if (wasSelected !== this._selectionModel.isSelected(option)) {
      this._propagateChanges();
    }

    this.stateChanges.next();
  }

  /**
   * Sorts the selected values in the selected based on their order in the panel.
   *
   * 根据面板中的顺序对选定的值进行排序。
   *
   */
  private _sortValues() {
    if (this.multiple) {
      const options = this.options.toArray();

      this._selectionModel.sort((a, b) => {
        return this.sortComparator
          ? this.sortComparator(a, b, options)
          : options.indexOf(a) - options.indexOf(b);
      });
      this.stateChanges.next();
    }
  }

  /**
   * Emits change event to set the model value.
   *
   * 发出 change 事件以设置模型的值。
   *
   */
  private _propagateChanges(fallbackValue?: any): void {
    let valueToEmit: any = null;

    if (this.multiple) {
      valueToEmit = (this.selected as MatOption[]).map(option => option.value);
    } else {
      valueToEmit = this.selected ? (this.selected as MatOption).value : fallbackValue;
    }

    this._value = valueToEmit;
    this.valueChange.emit(valueToEmit);
    this._onChange(valueToEmit);
    this.selectionChange.emit(this._getChangeEvent(valueToEmit));
    this._changeDetectorRef.markForCheck();
  }

  /**
   * Highlights the selected item. If no option is selected, it will highlight
   * the first item instead.
   *
   * 突出显示选定条目。如果没有选定的选项，它会突出显示第一个条目。
   *
   */
  private _highlightCorrectOption(): void {
    if (this._keyManager) {
      if (this.empty) {
        this._keyManager.setFirstItemActive();
      } else {
        this._keyManager.setActiveItem(this._selectionModel.selected[0]);
      }
    }
  }

  /**
   * Whether the panel is allowed to open.
   *
   * 该面板是否允许打开。
   *
   */
  protected _canOpen(): boolean {
    return !this._panelOpen && !this.disabled && this.options?.length > 0;
  }

  /**
   * Focuses the select element.
   *
   * 让此选择框元素获得焦点。
   *
   */
  focus(options?: FocusOptions): void {
    this._elementRef.nativeElement.focus(options);
  }

  /**
   * Gets the aria-labelledby for the select panel.
   *
   * 获取选择框面板的 aria-labelledby。
   *
   */
  _getPanelAriaLabelledby(): string | null {
    if (this.ariaLabel) {
      return null;
    }

    const labelId = this._parentFormField?.getLabelId();
    const labelExpression = labelId ? labelId + ' ' : '';
    return this.ariaLabelledby ? labelExpression + this.ariaLabelledby : labelId;
  }

  /**
   * Determines the `aria-activedescendant` to be set on the host.
   *
   * 确定是否要在宿主上设置 `aria-activedescendant`
   *
   */
  _getAriaActiveDescendant(): string | null {
    if (this.panelOpen && this._keyManager && this._keyManager.activeItem) {
      return this._keyManager.activeItem.id;
    }

    return null;
  }

  /**
   * Gets the aria-labelledby of the select component trigger.
   *
   * 获取此选择框组件触发器的 aria-labelledby。
   *
   */
  private _getTriggerAriaLabelledby(): string | null {
    if (this.ariaLabel) {
      return null;
    }

    const labelId = this._parentFormField?.getLabelId();
    let value = (labelId ? labelId + ' ' : '') + this._valueId;

    if (this.ariaLabelledby) {
      value += ' ' + this.ariaLabelledby;
    }

    return value;
  }

  /**
   * Called when the overlay panel is done animating.
   *
   * 当浮层面板播放完动画时调用。
   *
   */
  protected _panelDoneAnimating(isOpen: boolean) {
    this.openedChange.emit(isOpen);
  }

  /**
   * Implemented as part of MatFormFieldControl.
   *
   *是 MatFormFieldControl 实现的一部分。
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

  /**
   * Implemented as part of MatFormFieldControl.
   *
   *是 MatFormFieldControl 实现的一部分。
   *
   * @docs-private
   */
  onContainerClick() {
    this.focus();
    this.open();
  }

  /**
   * Implemented as part of MatFormFieldControl.
   *
   *是 MatFormFieldControl 实现的一部分。
   *
   * @docs-private
   */
  get shouldLabelFloat(): boolean {
    return this._panelOpen || !this.empty || (this._focused && !!this._placeholder);
  }
}

/**
 * Allows the user to customize the trigger that is displayed when the select has a value.
 */
@Directive({
  selector: 'mat-select-trigger',
  providers: [{provide: MAT_SELECT_TRIGGER, useExisting: MatSelectTrigger}],
})
export class MatSelectTrigger {}

@Component({
  selector: 'mat-select',
  exportAs: 'matSelect',
  templateUrl: 'select.html',
  styleUrls: ['select.css'],
  inputs: ['disabled', 'disableRipple', 'tabIndex'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'role': 'combobox',
    'aria-autocomplete': 'none',
    'aria-haspopup': 'listbox',
    'class': 'mat-mdc-select',
    '[attr.id]': 'id',
    '[attr.tabindex]': 'tabIndex',
    '[attr.aria-controls]': 'panelOpen ? id + "-panel" : null',
    '[attr.aria-expanded]': 'panelOpen',
    '[attr.aria-label]': 'ariaLabel || null',
    '[attr.aria-required]': 'required.toString()',
    '[attr.aria-disabled]': 'disabled.toString()',
    '[attr.aria-invalid]': 'errorState',
    '[attr.aria-activedescendant]': '_getAriaActiveDescendant()',
    '[class.mat-mdc-select-disabled]': 'disabled',
    '[class.mat-mdc-select-invalid]': 'errorState',
    '[class.mat-mdc-select-required]': 'required',
    '[class.mat-mdc-select-empty]': 'empty',
    '[class.mat-mdc-select-multiple]': 'multiple',
    '(keydown)': '_handleKeydown($event)',
    '(focus)': '_onFocus()',
    '(blur)': '_onBlur()',
  },
  animations: [matSelectAnimations.transformPanel],
  providers: [
    {provide: MatFormFieldControl, useExisting: MatSelect},
    {provide: MAT_OPTION_PARENT_COMPONENT, useExisting: MatSelect},
  ],
})
export class MatSelect extends _MatSelectBase<MatSelectChange> implements OnInit, AfterViewInit {
  @ContentChildren(MatOption, {descendants: true}) options: QueryList<MatOption>;
  @ContentChildren(MAT_OPTGROUP, {descendants: true}) optionGroups: QueryList<MatOptgroup>;
  @ContentChild(MAT_SELECT_TRIGGER) customTrigger: MatSelectTrigger;

  _positions: ConnectedPosition[] = [
    {
      originX: 'start',
      originY: 'bottom',
      overlayX: 'start',
      overlayY: 'top',
    },
    {
      originX: 'start',
      originY: 'top',
      overlayX: 'start',
      overlayY: 'bottom',
      panelClass: 'mat-mdc-select-panel-above',
    },
  ];

  /** Ideal origin for the overlay panel. */
  _preferredOverlayOrigin: CdkOverlayOrigin | ElementRef | undefined;

  /** Width of the overlay panel. */
  _overlayWidth: number;

  override get shouldLabelFloat(): boolean {
    // Since the panel doesn't overlap the trigger, we
    // want the label to only float when there's a value.
    return this.panelOpen || !this.empty || (this.focused && !!this.placeholder);
  }

  override ngOnInit() {
    super.ngOnInit();
    this._viewportRuler
      .change()
      .pipe(takeUntil(this._destroy))
      .subscribe(() => {
        if (this.panelOpen) {
          this._overlayWidth = this._getOverlayWidth();
          this._changeDetectorRef.detectChanges();
        }
      });
  }

  ngAfterViewInit() {
    // Note that it's important that we read this in `ngAfterViewInit`, because
    // reading it earlier will cause the form field to return a different element.
    if (this._parentFormField) {
      this._preferredOverlayOrigin = this._parentFormField.getConnectedOverlayOrigin();
    }
  }

  override open() {
    this._overlayWidth = this._getOverlayWidth();
    super.open();
    // Required for the MDC form field to pick up when the overlay has been opened.
    this.stateChanges.next();
  }

  override close() {
    super.close();
    // Required for the MDC form field to pick up when the overlay has been closed.
    this.stateChanges.next();
  }

  /**
   * Scrolls the active option into view.
   *
   * 把活动选项滚动进视图。
   *
   */
  protected _scrollOptionIntoView(index: number): void {
    const option = this.options.toArray()[index];

    if (option) {
      const panel: HTMLElement = this.panel.nativeElement;
      const labelCount = _countGroupLabelsBeforeOption(index, this.options, this.optionGroups);
      const element = option._getHostElement();

      if (index === 0 && labelCount === 1) {
        // If we've got one group label before the option and we're at the top option,
        // scroll the list to the top. This is better UX than scrolling the list to the
        // top of the option, because it allows the user to read the top group's label.
        panel.scrollTop = 0;
      } else {
        panel.scrollTop = _getOptionScrollPosition(
          element.offsetTop,
          element.offsetHeight,
          panel.scrollTop,
          panel.offsetHeight,
        );
      }
    }
  }

  protected _positioningSettled() {
    this._scrollOptionIntoView(this._keyManager.activeItemIndex || 0);
  }

  protected _getChangeEvent(value: any) {
    return new MatSelectChange(this, value);
  }

  /** Gets how wide the overlay panel should be. */
  private _getOverlayWidth() {
    const refToMeasure =
      this._preferredOverlayOrigin instanceof CdkOverlayOrigin
        ? this._preferredOverlayOrigin.elementRef
        : this._preferredOverlayOrigin || this._elementRef;
    return refToMeasure.nativeElement.getBoundingClientRect().width;
  }
}
