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
  NumberInput
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
  ConnectedPosition,
  Overlay,
  ScrollStrategy,
} from '@angular/cdk/overlay';
import {ViewportRuler} from '@angular/cdk/scrolling';
import {
  AfterContentInit,
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
import {ControlValueAccessor, FormGroupDirective, NgControl, NgForm} from '@angular/forms';
import {
  _countGroupLabelsBeforeOption,
  _getOptionScrollPosition,
  CanDisable,
  CanDisableCtor,
  CanDisableRipple,
  CanDisableRippleCtor,
  CanUpdateErrorState,
  CanUpdateErrorStateCtor,
  ErrorStateMatcher,
  HasTabIndex,
  HasTabIndexCtor,
  MAT_OPTGROUP,
  MAT_OPTION_PARENT_COMPONENT,
  MatOptgroup,
  MatOption,
  MatOptionSelectionChange,
  mixinDisabled,
  mixinDisableRipple,
  mixinErrorState,
  mixinTabIndex,
  _MatOptionBase,
} from '@angular/material/core';
import {MAT_FORM_FIELD, MatFormField, MatFormFieldControl} from '@angular/material/form-field';
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

/**
 * The following style constants are necessary to save here in order
 * to properly calculate the alignment of the selected option over
 * the trigger element.
 *
 * 这里保存下列样式常量是为了正确计算选定的选项在触发器元素上的对齐方式。
 *
 */

/** The max height of the select's overlay panel. */
export const SELECT_PANEL_MAX_HEIGHT = 256;

/** The panel's padding on the x-axis. */
export const SELECT_PANEL_PADDING_X = 16;

/** The panel's x axis padding if it is indented (e.g. there is an option group). */
export const SELECT_PANEL_INDENT_PADDING_X = SELECT_PANEL_PADDING_X * 2;

/** The height of the select items in `em` units. */
export const SELECT_ITEM_HEIGHT_EM = 3;

// TODO(josephperrott): Revert to a constant after 2018 spec updates are fully merged.
/**
 * Distance between the panel edge and the option text in
 * multi-selection mode.
 *
 * 面板边缘与多选模式下的选项文本之间的距离。
 *
 * Calculated as:
 * (SELECT_PANEL_PADDING_X \* 1.5) + 16 = 40
 * The padding is multiplied by 1.5 because the checkbox's margin is half the padding.
 * The checkbox width is 16px.
 */
export const SELECT_MULTIPLE_PANEL_PADDING_X = SELECT_PANEL_PADDING_X * 1.5 + 16;

/**
 * The select panel will only "fit" inside the viewport if it is positioned at
 * this value or more away from the viewport boundary.
 */
export const SELECT_PANEL_VIEWPORT_PADDING = 8;

/**
 * Injection token that determines the scroll handling while a select is open.
 *
 * 当选择器被打开时，本注入令牌决定滚动时的处理方式。
 *
 */
export const MAT_SELECT_SCROLL_STRATEGY =
    new InjectionToken<() => ScrollStrategy>('mat-select-scroll-strategy');

/** @docs-private */
export function MAT_SELECT_SCROLL_STRATEGY_PROVIDER_FACTORY(overlay: Overlay):
    () => ScrollStrategy {
  return () => overlay.scrollStrategies.reposition();
}

/**
 * Object that can be used to configure the default options for the select module.
 *
 * 可用于配置选择器模块默认选项的对象。
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
 * 这个注入令牌可以用来为选择器模块提供默认选项。
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
 * Change event object that is emitted when the select value has changed.
 *
 * 当选择器的值发生更改后触发的事件对象。
 *
 */
export class MatSelectChange {
  constructor(
    /** Reference to the select that emitted the change event. */
    public source: MatSelect,
    /** Current value of the select that emitted the event. */
    public value: any) { }
}

// Boilerplate for applying mixins to MatSelect.
/** @docs-private */
class MatSelectBase {
  constructor(public _elementRef: ElementRef,
              public _defaultErrorStateMatcher: ErrorStateMatcher,
              public _parentForm: NgForm,
              public _parentFormGroup: FormGroupDirective,
              public ngControl: NgControl) {}
}
const _MatSelectMixinBase:
    CanDisableCtor &
    HasTabIndexCtor &
    CanDisableRippleCtor &
    CanUpdateErrorStateCtor &
    typeof MatSelectBase =
        mixinDisableRipple(mixinTabIndex(mixinDisabled(mixinErrorState(MatSelectBase))));

/**
 * Injection token that can be used to reference instances of `MatSelectTrigger`. It serves as
 * alternative token to the actual `MatSelectTrigger` class which could cause unnecessary
 * retention of the class and its directive metadata.
 *
 * 这个注入令牌可以用来引用 `MatSelectTrigger` 的实例。它可以作为实际 `MatSelectTrigger` 类的备用令牌，直接使用实际类可能导致该类及其元数据无法被优化掉。
 *
 */
export const MAT_SELECT_TRIGGER = new InjectionToken<MatSelectTrigger>('MatSelectTrigger');

/**
 * Allows the user to customize the trigger that is displayed when the select has a value.
 *
 * 当选择器具有值时，允许用户自定义要显示的触发器。
 *
 */
@Directive({
  selector: 'mat-select-trigger',
  providers: [{provide: MAT_SELECT_TRIGGER, useExisting: MatSelectTrigger}],
})
export class MatSelectTrigger {}

/**
 * Base class with all of the `MatSelect` functionality.
 *
 * 具备所有 `MatSelect` 功能的基类。
 *
 */
@Directive()
export abstract class _MatSelectBase<C> extends _MatSelectMixinBase implements AfterContentInit,
    OnChanges, OnDestroy, OnInit, DoCheck, ControlValueAccessor, CanDisable, HasTabIndex,
    MatFormFieldControl<any>, CanUpdateErrorState, CanDisableRipple {

  /**
   * All of the defined select options.
   *
   * 所有已定义的选择器选项。
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
   * 创建一个应该由本选择器发出的 change 事件对象。
   *
   */
  protected abstract _getChangeEvent(value: any): C;

  /**
   * Factory function used to create a scroll strategy for this select.
   *
   * 这个工厂函数用于为这个选择器创建一个滚动策略。
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
   * 此输入元素的唯一 ID。
   *
   */
  private _uid = `mat-select-${nextUniqueId++}`;

  /**
   * Current `ariar-labelledby` value for the select trigger.
   *
   * 此选择器触发器的当前 `aria-labelledby` 值。
   *
   */
  private _triggerAriaLabelledBy: string | null = null;

  /**
   * Emits whenever the component is destroyed.
   *
   * 只要组件被销毁，就会触发。
   *
   */
  protected readonly _destroy = new Subject<void>();

  /**
   * The aria-describedby attribute on the select for improved a11y.
   *
   * 此选择器的 aria-describedby 属性，用于提升无障碍性。
   *
   */
  _ariaDescribedby: string;

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
   * 包含选择器值的 DOM 节点的 ID。
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
   * 此选择器是否拥有焦点。
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
   * 用于打开选择器的触发器。
   *
   */
  @ViewChild('trigger') trigger: ElementRef;

  /**
   * Panel containing the select options.
   *
   * 包含选择器选项的面板。
   *
   */
  @ViewChild('panel') panel: ElementRef;

  /** Overlay pane containing the options. */
  @ViewChild(CdkConnectedOverlay)
  protected _overlayDir: CdkConnectedOverlay;

  /**
   * Classes to be passed to the select panel. Supports the same syntax as `ngClass`.
   *
   * 要传递给选择器面板的类。语法与 `ngClass` 相同。
   *
   */
  @Input() panelClass: string|string[]|Set<string>|{[key: string]: any};

  /**
   * Placeholder to be shown if no value has been selected.
   *
   * 如果没有选定任何值，就会显示此占位符。
   *
   */
  @Input()
  get placeholder(): string { return this._placeholder; }
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
  get required(): boolean { return this._required; }
  set required(value: boolean) {
    this._required = coerceBooleanProperty(value);
    this.stateChanges.next();
  }
  private _required: boolean = false;

  /**
   * Whether the user should be allowed to select multiple options.
   *
   * 是否允许用户选择多个选项。
   *
   */
  @Input()
  get multiple(): boolean { return this._multiple; }
  set multiple(value: boolean) {
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
  get disableOptionCentering(): boolean { return this._disableOptionCentering; }
  set disableOptionCentering(value: boolean) {
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
  get compareWith() { return this._compareWith; }
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
   * 选择器控件的值。
   *
   */
  @Input()
  get value(): any { return this._value; }
  set value(newValue: any) {
    // Always re-assign an array, because it might have been mutated.
    if (newValue !== this._value || (this._multiple && Array.isArray(newValue))) {
      if (this.options) {
        this._setSelectionByValue(newValue);
      }

      this._value = newValue;
    }
  }
  private _value: any;

  /** Aria label of the select. */
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
  @Input() errorStateMatcher: ErrorStateMatcher;

  /**
   * Time to wait in milliseconds after the last keystroke before moving focus to an item.
   *
   * 在将焦点移动到某个条目之前，最后一次按键后要等待的时间（以毫秒为单位）。
   *
   */
  @Input()
  get typeaheadDebounceInterval(): number { return this._typeaheadDebounceInterval; }
  set typeaheadDebounceInterval(value: number) {
    this._typeaheadDebounceInterval = coerceNumberProperty(value);
  }
  private _typeaheadDebounceInterval: number;

  /**
   * Function used to sort the values in a select in multiple mode.
   * Follows the same logic as `Array.prototype.sort`.
   *
   * 函数用于对多选模式选择器中的值进行排序。与 `Array.prototype.sort` 的逻辑相同。
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
  get id(): string { return this._id; }
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
        switchMap(() => merge(...options.map(option => option.onSelectionChange)))
      );
    }

    return this._ngZone.onStable
      .pipe(take(1), switchMap(() => this.optionSelectionChanges));
  }) as Observable<MatOptionSelectionChange>;

  /**
   * Event emitted when the select panel has been toggled.
   *
   * 切换选择器面板时会发生事件。
   *
   */
  @Output() readonly openedChange: EventEmitter<boolean> = new EventEmitter<boolean>();

  /**
   * Event emitted when the select has been opened.
   *
   * 当选择器被打开时会发出本事件。
   *
   */
  @Output('opened') readonly _openedStream: Observable<void> =
      this.openedChange.pipe(filter(o => o), map(() => {}));

  /**
   * Event emitted when the select has been closed.
   *
   * 选择器关闭后会触发的事件。
   *
   */
  @Output('closed') readonly _closedStream: Observable<void> =
      this.openedChange.pipe(filter(o => !o), map(() => {}));

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
   * 每当选择器原始值发生变化时都会发出本事件。这主要是为了方便对 `value` 输入属性的双向绑定。
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
    @Self() @Optional() public ngControl: NgControl,
    @Attribute('tabindex') tabIndex: string,
    @Inject(MAT_SELECT_SCROLL_STRATEGY) scrollStrategyFactory: any,
    private _liveAnnouncer: LiveAnnouncer,
    @Optional() @Inject(MAT_SELECT_CONFIG) private _defaultOptions?: MatSelectConfig) {
    super(elementRef, _defaultErrorStateMatcher, _parentForm,
          _parentFormGroup, ngControl);

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

    if (this.ngControl) {
      this.updateErrorState();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    // Updating the disabled state is handled by `mixinDisabled`, but we need to additionally let
    // the parent form field know to run change detection when the disabled state changes.
    if (changes['disabled']) {
      this.stateChanges.next();
    }

    if (changes['typeaheadDebounceInterval'] && this._keyManager) {
      this._keyManager.withTypeAhead(this._typeaheadDebounceInterval);
    }
  }

  ngOnDestroy() {
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
   * 设置选择器的值。作为 ControlValueAccessor 接口的一部分，需要与 Angular 的核心表单 API 集成。
   *
   * @param value New value to be written to the model.
   *
   * 要写入模型的新值。
   *
   */
  writeValue(value: any): void {
    this.value = value;
  }

  /**
   * Saves a callback function to be invoked when the select's value
   * changes from user input. Part of the ControlValueAccessor interface
   * required to integrate with Angular's core forms API.
   *
   * 保存一个回调函数，并在选择器的值因为用户输入而改变时调用它。
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
   * 保存一个回调函数，并在用户让此选择器失焦时调用它。作为 ControlValueAccessor 接口的一部分，需要与 Angular 的核心表单 API 集成。
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
   * 禁用此选择器。作为 ControlValueAccessor 接口的一部分，需要与 Angular 的核心表单 API 集成。
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
    return this.multiple ? this._selectionModel.selected : this._selectionModel.selected[0];
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
   * 处理选择器中所有 keydown 事件。
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
   * 此选择器关闭后，处理键盘事件。
   *
   */
  private _handleClosedKeydown(event: KeyboardEvent): void {
    const keyCode = event.keyCode;
    const isArrowKey = keyCode === DOWN_ARROW || keyCode === UP_ARROW ||
                       keyCode === LEFT_ARROW || keyCode === RIGHT_ARROW;
    const isOpenKey = keyCode === ENTER || keyCode === SPACE;
    const manager = this._keyManager;

    // Open the select on ALT + arrow key to match the native <select>
    if (!manager.isTyping() && (isOpenKey && !hasModifierKey(event)) ||
      ((this.multiple || event.altKey) && isArrowKey)) {
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
   * 当选择器打开时，处理键盘事件。
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
    } else if (!isTyping && (keyCode === ENTER || keyCode === SPACE) && manager.activeItem &&
      !hasModifierKey(event)) {
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

      if (this._multiple && isArrowKey && event.shiftKey && manager.activeItem &&
          manager.activeItemIndex !== previouslyFocusedIndex) {
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
   * 只有当面板关闭时才调用“被接触过”回调。否则，触发器会在面板打开时“失去焦点”，造成误报。
   *
   */
  _onBlur() {
    this._focused = false;

    if (!this.disabled && !this.panelOpen) {
      this._onTouched();
      this._changeDetectorRef.markForCheck();
      this.stateChanges.next();
    }
  }

  /**
   * Callback that is invoked when the overlay panel has been attached.
   *
   * 附加到浮层面板时调用的回调函数。
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
   * 此选择器是否有值。
   *
   */
  get empty(): boolean {
    return !this._selectionModel || this._selectionModel.isEmpty();
  }

  private _initializeSelection(): void {
    // Defer setting the value in order to avoid the "Expression
    // has changed after it was checked" errors from Angular.
    Promise.resolve().then(() => {
      this._setSelectionByValue(this.ngControl ? this.ngControl.value : this._value);
      this.stateChanges.next();
    });
  }

  /**
   * Sets the selected option based on a value. If no option can be
   * found with the designated value, the select trigger is cleared.
   *
   * 根据值设置选定的选项。如果找不到指定值的选项，就清除选择器的触发器。
   *
   */
  private _setSelectionByValue(value: any | any[]): void {
    this._selectionModel.selected.forEach(option => option.setInactiveStyles());
    this._selectionModel.clear();

    if (this.multiple && value) {
      if (!Array.isArray(value) && (typeof ngDevMode === 'undefined' || ngDevMode)) {
        throw getMatSelectNonArrayValueError();
      }

      value.forEach((currentValue: any) => this._selectValue(currentValue));
      this._sortValues();
    } else {
      const correspondingOption = this._selectValue(value);

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
  private _selectValue(value: any): MatOption | undefined {
    const correspondingOption = this.options.find((option: MatOption) => {
      // Skip options that are already in the model. This allows us to handle cases
      // where the same primitive value is selected multiple times.
      if (this._selectionModel.isSelected(option)) {
        return false;
      }

      try {
        // Treat null as a special reset value.
        return option.value != null && this._compareWith(option.value,  value);
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
      .withAllowedModifierKeys(['shiftKey']);

    this._keyManager.tabOut.pipe(takeUntil(this._destroy)).subscribe(() => {
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

    this._keyManager.change.pipe(takeUntil(this._destroy)).subscribe(() => {
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
        this._changeDetectorRef.markForCheck();
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
        option.selected ? this._selectionModel.select(option) :
                          this._selectionModel.deselect(option);
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
        return this.sortComparator ? this.sortComparator(a, b, options) :
                                     options.indexOf(a) - options.indexOf(b);
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
   * 让此选择器元素获得焦点。
   *
   */
  focus(options?: FocusOptions): void {
    this._elementRef.nativeElement.focus(options);
  }

  /**
   * Gets the aria-labelledby for the select panel.
   *
   * 获取选择器面板的 aria-labelledby。
   *
   */
  _getPanelAriaLabelledby(): string | null {
    if (this.ariaLabel) {
      return null;
    }

    const labelId = this._parentFormField?.getLabelId();
    const labelExpression = (labelId ? labelId + ' ' : '');
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

  /** Gets the aria-labelledby of the select component trigger. */
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
    this._ariaDescribedby = ids.join(' ');
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

  static ngAcceptInputType_required: BooleanInput;
  static ngAcceptInputType_multiple: BooleanInput;
  static ngAcceptInputType_disableOptionCentering: BooleanInput;
  static ngAcceptInputType_typeaheadDebounceInterval: NumberInput;
  static ngAcceptInputType_disabled: BooleanInput;
  static ngAcceptInputType_disableRipple: BooleanInput;
  static ngAcceptInputType_tabIndex: NumberInput;
}

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
    // TODO(crisbeto): the value for aria-haspopup should be `listbox`, but currently it's difficult
    // to sync into Google, because of an outdated automated a11y check which flags it as an invalid
    // value. At some point we should try to switch it back to being `listbox`.
    'aria-haspopup': 'true',
    'class': 'mat-select',
    '[attr.id]': 'id',
    '[attr.tabindex]': 'tabIndex',
    '[attr.aria-controls]': 'panelOpen ? id + "-panel" : null',
    '[attr.aria-expanded]': 'panelOpen',
    '[attr.aria-label]': 'ariaLabel || null',
    '[attr.aria-required]': 'required.toString()',
    '[attr.aria-disabled]': 'disabled.toString()',
    '[attr.aria-invalid]': 'errorState',
    '[attr.aria-describedby]': '_ariaDescribedby || null',
    '[attr.aria-activedescendant]': '_getAriaActiveDescendant()',
    '[class.mat-select-disabled]': 'disabled',
    '[class.mat-select-invalid]': 'errorState',
    '[class.mat-select-required]': 'required',
    '[class.mat-select-empty]': 'empty',
    '[class.mat-select-multiple]': 'multiple',
    '(keydown)': '_handleKeydown($event)',
    '(focus)': '_onFocus()',
    '(blur)': '_onBlur()',
  },
  animations: [
    matSelectAnimations.transformPanelWrap,
    matSelectAnimations.transformPanel
  ],
  providers: [
    {provide: MatFormFieldControl, useExisting: MatSelect},
    {provide: MAT_OPTION_PARENT_COMPONENT, useExisting: MatSelect}
  ],
})
export class MatSelect extends _MatSelectBase<MatSelectChange> implements OnInit {
  /**
   * The scroll position of the overlay panel, calculated to center the selected option.
   *
   * 浮层面板的滚动位置，计算为选定项的中心位置。
   *
   */
  private _scrollTop = 0;

  /**
   * The last measured value for the trigger's client bounding rect.
   *
   * 触发器的 BoundingClientRect 的最后一次测量值。
   *
   */
  _triggerRect: ClientRect;

  /**
   * The cached font-size of the trigger element.
   *
   * 缓存的触发器元素字体大小。
   *
   */
  _triggerFontSize = 0;

  /**
   * The value of the select panel's transform-origin property.
   *
   * 选择面板的 transform-origin 属性的值。
   *
   */
  _transformOrigin: string = 'top';

  /**
   * The y-offset of the overlay panel in relation to the trigger's top start corner.
   * This must be adjusted to align the selected option text over the trigger text.
   * when the panel opens. Will change based on the y-position of the selected option.
   *
   * 浮层面板相对于触发器顶部 "start" 角的 y 偏移量。
   * 必须调整它，以便在触发器文本上对齐选定的选项文本。面板打开时会根据选定选项的 y 坐标进行更改。
   *
   */
  _offsetY = 0;

  @ContentChildren(MatOption, {descendants: true}) options: QueryList<MatOption>;

  @ContentChildren(MAT_OPTGROUP, {descendants: true}) optionGroups: QueryList<MatOptgroup>;

  @ContentChild(MAT_SELECT_TRIGGER) customTrigger: MatSelectTrigger;

  _positions: ConnectedPosition[] = [
    {
      originX: 'start',
      originY: 'top',
      overlayX: 'start',
      overlayY: 'top',
    },
    {
      originX: 'start',
      originY: 'bottom',
      overlayX: 'start',
      overlayY: 'bottom',
    },
  ];

  /**
   * Calculates the scroll position of the select's overlay panel.
   *
   * 计算选择器的浮层面板的滚动位置。
   *
   * Attempts to center the selected option in the panel. If the option is
   * too high or too low in the panel to be scrolled to the center, it clamps the
   * scroll position to the min or max scroll positions respectively.
   *
   * 试图让选定的选项在面板中居中。如果面板中的选项太高或太低而无法滚动到中心位置，它会在最小或最大滚动位置之间夹取此位置。
   *
   */
  _calculateOverlayScroll(selectedIndex: number, scrollBuffer: number,
                          maxScroll: number): number {
    const itemHeight = this._getItemHeight();
    const optionOffsetFromScrollTop = itemHeight * selectedIndex;
    const halfOptionHeight = itemHeight / 2;

    // Starts at the optionOffsetFromScrollTop, which scrolls the option to the top of the
    // scroll container, then subtracts the scroll buffer to scroll the option down to
    // the center of the overlay panel. Half the option height must be re-added to the
    // scrollTop so the option is centered based on its middle, not its top edge.
    const optimalScrollPosition = optionOffsetFromScrollTop - scrollBuffer + halfOptionHeight;
    return Math.min(Math.max(0, optimalScrollPosition), maxScroll);
  }

  ngOnInit() {
    super.ngOnInit();
    this._viewportRuler.change().pipe(takeUntil(this._destroy)).subscribe(() => {
      if (this.panelOpen) {
        this._triggerRect = this.trigger.nativeElement.getBoundingClientRect();
        this._changeDetectorRef.markForCheck();
      }
    });
  }

  open(): void {
    if (super._canOpen()) {
      super.open();
      this._triggerRect = this.trigger.nativeElement.getBoundingClientRect();
      // Note: The computed font-size will be a string pixel value (e.g. "16px").
      // `parseInt` ignores the trailing 'px' and converts this to a number.
      this._triggerFontSize =
          parseInt(getComputedStyle(this.trigger.nativeElement).fontSize || '0');
      this._calculateOverlayPosition();

      // Set the font size on the panel element once it exists.
      this._ngZone.onStable.pipe(take(1)).subscribe(() => {
        if (this._triggerFontSize && this._overlayDir.overlayRef &&
            this._overlayDir.overlayRef.overlayElement) {
          this._overlayDir.overlayRef.overlayElement.style.fontSize = `${this._triggerFontSize}px`;
        }
      });
    }
  }

  /**
   * Scrolls the active option into view.
   *
   * 把活动选项滚动进视图。
   *
   */
  protected _scrollOptionIntoView(index: number): void {
    const labelCount = _countGroupLabelsBeforeOption(index, this.options, this.optionGroups);
    const itemHeight = this._getItemHeight();

    this.panel.nativeElement.scrollTop = _getOptionScrollPosition(
      (index + labelCount) * itemHeight,
      itemHeight,
      this.panel.nativeElement.scrollTop,
      SELECT_PANEL_MAX_HEIGHT
    );
  }

  protected _positioningSettled() {
    this._calculateOverlayOffsetX();
    this.panel.nativeElement.scrollTop = this._scrollTop;
  }

  protected _panelDoneAnimating(isOpen: boolean) {
    if (this.panelOpen) {
      this._scrollTop = 0;
    } else {
      this._overlayDir.offsetX = 0;
      this._changeDetectorRef.markForCheck();
    }

    super._panelDoneAnimating(isOpen);
  }

  protected _getChangeEvent(value: any) {
    return new MatSelectChange(this, value);
  }

  /**
   * Sets the x-offset of the overlay panel in relation to the trigger's top start corner.
   * This must be adjusted to align the selected option text over the trigger text when
   * the panel opens. Will change based on LTR or RTL text direction. Note that the offset
   * can't be calculated until the panel has been attached, because we need to know the
   * content width in order to constrain the panel within the viewport.
   *
   * 设置浮层面板相对于触发器顶部起始角的 x 偏移量。当面板打开时，必须调整它，以便让触发器文本与选定项的文本对齐。
   * 会根据 LTR 或 RTL 的而改变文本方向。请注意，在连接面板之前，无法计算偏移量，因为我们需要知道内容的宽度才能在视口中约束此面板。
   *
   */
  private _calculateOverlayOffsetX(): void {
    const overlayRect = this._overlayDir.overlayRef.overlayElement.getBoundingClientRect();
    const viewportSize = this._viewportRuler.getViewportSize();
    const isRtl = this._isRtl();
    const paddingWidth = this.multiple ? SELECT_MULTIPLE_PANEL_PADDING_X + SELECT_PANEL_PADDING_X :
                                         SELECT_PANEL_PADDING_X * 2;
    let offsetX: number;

    // Adjust the offset, depending on the option padding.
    if (this.multiple) {
      offsetX = SELECT_MULTIPLE_PANEL_PADDING_X;
    } else if (this.disableOptionCentering) {
      offsetX = SELECT_PANEL_PADDING_X;
    } else {
      let selected = this._selectionModel.selected[0] || this.options.first;
      offsetX = selected && selected.group ? SELECT_PANEL_INDENT_PADDING_X : SELECT_PANEL_PADDING_X;
    }

    // Invert the offset in LTR.
    if (!isRtl) {
      offsetX *= -1;
    }

    // Determine how much the select overflows on each side.
    const leftOverflow = 0 - (overlayRect.left + offsetX - (isRtl ? paddingWidth : 0));
    const rightOverflow = overlayRect.right + offsetX - viewportSize.width
                          + (isRtl ? 0 : paddingWidth);

    // If the element overflows on either side, reduce the offset to allow it to fit.
    if (leftOverflow > 0) {
      offsetX += leftOverflow + SELECT_PANEL_VIEWPORT_PADDING;
    } else if (rightOverflow > 0) {
      offsetX -= rightOverflow + SELECT_PANEL_VIEWPORT_PADDING;
    }

    // Set the offset directly in order to avoid having to go through change detection and
    // potentially triggering "changed after it was checked" errors. Round the value to avoid
    // blurry content in some browsers.
    this._overlayDir.offsetX = Math.round(offsetX);
    this._overlayDir.overlayRef.updatePosition();
  }

  /**
   * Calculates the y-offset of the select's overlay panel in relation to the
   * top start corner of the trigger. It has to be adjusted in order for the
   * selected option to be aligned over the trigger when the panel opens.
   *
   * 计算选择器的浮层面板相对于触发器顶部起始角的 y 偏移量。必须对它进行调整，以便当面板打开时，选定的选项可以与触发器对齐。
   *
   */
  private _calculateOverlayOffsetY(selectedIndex: number, scrollBuffer: number,
                                  maxScroll: number): number {
    const itemHeight = this._getItemHeight();
    const optionHeightAdjustment = (itemHeight - this._triggerRect.height) / 2;
    const maxOptionsDisplayed = Math.floor(SELECT_PANEL_MAX_HEIGHT / itemHeight);
    let optionOffsetFromPanelTop: number;

    // Disable offset if requested by user by returning 0 as value to offset
    if (this.disableOptionCentering) {
      return 0;
    }

    if (this._scrollTop === 0) {
      optionOffsetFromPanelTop = selectedIndex * itemHeight;
    } else if (this._scrollTop === maxScroll) {
      const firstDisplayedIndex = this._getItemCount() - maxOptionsDisplayed;
      const selectedDisplayIndex = selectedIndex - firstDisplayedIndex;

      // The first item is partially out of the viewport. Therefore we need to calculate what
      // portion of it is shown in the viewport and account for it in our offset.
      let partialItemHeight =
          itemHeight - (this._getItemCount() * itemHeight - SELECT_PANEL_MAX_HEIGHT) % itemHeight;

      // Because the panel height is longer than the height of the options alone,
      // there is always extra padding at the top or bottom of the panel. When
      // scrolled to the very bottom, this padding is at the top of the panel and
      // must be added to the offset.
      optionOffsetFromPanelTop = selectedDisplayIndex * itemHeight + partialItemHeight;
    } else {
      // If the option was scrolled to the middle of the panel using a scroll buffer,
      // its offset will be the scroll buffer minus the half height that was added to
      // center it.
      optionOffsetFromPanelTop = scrollBuffer - itemHeight / 2;
    }

    // The final offset is the option's offset from the top, adjusted for the height difference,
    // multiplied by -1 to ensure that the overlay moves in the correct direction up the page.
    // The value is rounded to prevent some browsers from blurring the content.
    return Math.round(optionOffsetFromPanelTop * -1 - optionHeightAdjustment);
  }

  /**
   * Checks that the attempted overlay position will fit within the viewport.
   * If it will not fit, tries to adjust the scroll position and the associated
   * y-offset so the panel can open fully on-screen. If it still won't fit,
   * sets the offset back to 0 to allow the fallback position to take over.
   *
   * 检查尝试的浮层位置是否适合视口。如果它不适合，尝试调整滚动位置和相关的 y 偏移量，这样面板就可以在屏幕上完全打开。如果它仍然不适合，则把偏移量设置回 0，以允许使用回退位置。
   *
   */
  private _checkOverlayWithinViewport(maxScroll: number): void {
    const itemHeight = this._getItemHeight();
    const viewportSize = this._viewportRuler.getViewportSize();

    const topSpaceAvailable = this._triggerRect.top - SELECT_PANEL_VIEWPORT_PADDING;
    const bottomSpaceAvailable =
        viewportSize.height - this._triggerRect.bottom - SELECT_PANEL_VIEWPORT_PADDING;

    const panelHeightTop = Math.abs(this._offsetY);
    const totalPanelHeight =
        Math.min(this._getItemCount() * itemHeight, SELECT_PANEL_MAX_HEIGHT);
    const panelHeightBottom = totalPanelHeight - panelHeightTop - this._triggerRect.height;

    if (panelHeightBottom > bottomSpaceAvailable) {
      this._adjustPanelUp(panelHeightBottom, bottomSpaceAvailable);
    } else if (panelHeightTop > topSpaceAvailable) {
     this._adjustPanelDown(panelHeightTop, topSpaceAvailable, maxScroll);
    } else {
      this._transformOrigin = this._getOriginBasedOnOption();
    }
  }

  /**
   * Adjusts the overlay panel up to fit in the viewport.
   *
   * 向上调整浮层面板以适合视口。
   *
   */
  private _adjustPanelUp(panelHeightBottom: number, bottomSpaceAvailable: number) {
    // Browsers ignore fractional scroll offsets, so we need to round.
    const distanceBelowViewport = Math.round(panelHeightBottom - bottomSpaceAvailable);

    // Scrolls the panel up by the distance it was extending past the boundary, then
    // adjusts the offset by that amount to move the panel up into the viewport.
    this._scrollTop -= distanceBelowViewport;
    this._offsetY -= distanceBelowViewport;
    this._transformOrigin = this._getOriginBasedOnOption();

    // If the panel is scrolled to the very top, it won't be able to fit the panel
    // by scrolling, so set the offset to 0 to allow the fallback position to take
    // effect.
    if (this._scrollTop <= 0) {
      this._scrollTop = 0;
      this._offsetY = 0;
      this._transformOrigin = `50% bottom 0px`;
    }
  }

  /**
   * Adjusts the overlay panel down to fit in the viewport.
   *
   * 向下调整浮层面板以适应视口。
   *
   */
  private _adjustPanelDown(panelHeightTop: number, topSpaceAvailable: number,
                           maxScroll: number) {
    // Browsers ignore fractional scroll offsets, so we need to round.
    const distanceAboveViewport = Math.round(panelHeightTop - topSpaceAvailable);

    // Scrolls the panel down by the distance it was extending past the boundary, then
    // adjusts the offset by that amount to move the panel down into the viewport.
    this._scrollTop += distanceAboveViewport;
    this._offsetY += distanceAboveViewport;
    this._transformOrigin = this._getOriginBasedOnOption();

    // If the panel is scrolled to the very bottom, it won't be able to fit the
    // panel by scrolling, so set the offset to 0 to allow the fallback position
    // to take effect.
    if (this._scrollTop >= maxScroll) {
      this._scrollTop = maxScroll;
      this._offsetY = 0;
      this._transformOrigin = `50% top 0px`;
      return;
    }
  }

  /**
   * Calculates the scroll position and x- and y-offsets of the overlay panel.
   *
   * 计算浮层面板的滚动位置和 x 和 y 偏移量。
   *
   */
  private _calculateOverlayPosition(): void {
    const itemHeight = this._getItemHeight();
    const items = this._getItemCount();
    const panelHeight = Math.min(items * itemHeight, SELECT_PANEL_MAX_HEIGHT);
    const scrollContainerHeight = items * itemHeight;

    // The farthest the panel can be scrolled before it hits the bottom
    const maxScroll = scrollContainerHeight - panelHeight;

    // If no value is selected we open the popup to the first item.
    let selectedOptionOffset: number;

    if (this.empty) {
      selectedOptionOffset = 0;
    } else {
      selectedOptionOffset =
          Math.max(this.options.toArray().indexOf(this._selectionModel.selected[0]), 0);
    }

    selectedOptionOffset += _countGroupLabelsBeforeOption(selectedOptionOffset, this.options,
        this.optionGroups);

    // We must maintain a scroll buffer so the selected option will be scrolled to the
    // center of the overlay panel rather than the top.
    const scrollBuffer = panelHeight / 2;
    this._scrollTop = this._calculateOverlayScroll(selectedOptionOffset, scrollBuffer, maxScroll);
    this._offsetY = this._calculateOverlayOffsetY(selectedOptionOffset, scrollBuffer, maxScroll);

    this._checkOverlayWithinViewport(maxScroll);
  }

  /**
   * Sets the transform origin point based on the selected option.
   *
   * 基于选定的选项设置变换的原点。
   *
   */
  private _getOriginBasedOnOption(): string {
    const itemHeight = this._getItemHeight();
    const optionHeightAdjustment = (itemHeight - this._triggerRect.height) / 2;
    const originY = Math.abs(this._offsetY) - optionHeightAdjustment + itemHeight / 2;
    return `50% ${originY}px 0px`;
  }

  /**
   * Calculates the height of the select's options.
   *
   * 计算选择器选项的高度。
   *
   */
  private _getItemHeight(): number {
    return this._triggerFontSize * SELECT_ITEM_HEIGHT_EM;
  }

  /**
   * Calculates the amount of items in the select. This includes options and group labels.
   *
   * 计算选择器中的条目数量。包括选项和组标签。
   *
   */
  private _getItemCount(): number {
    return this.options.length + this.optionGroups.length;
  }

}
