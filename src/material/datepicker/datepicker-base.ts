/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Directionality} from '@angular/cdk/bidi';
import {BooleanInput, coerceBooleanProperty, coerceStringArray} from '@angular/cdk/coercion';
import {
  DOWN_ARROW,
  ESCAPE,
  hasModifierKey,
  LEFT_ARROW,
  ModifierKey,
  PAGE_DOWN,
  PAGE_UP,
  RIGHT_ARROW,
  UP_ARROW,
} from '@angular/cdk/keycodes';
import {
  Overlay,
  OverlayConfig,
  OverlayRef,
  ScrollStrategy,
  FlexibleConnectedPositionStrategy,
} from '@angular/cdk/overlay';
import {ComponentPortal, ComponentType, TemplatePortal} from '@angular/cdk/portal';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  ElementRef,
  EventEmitter,
  Inject,
  InjectionToken,
  Input,
  NgZone,
  OnDestroy,
  Optional,
  Output,
  ViewChild,
  ViewContainerRef,
  ViewEncapsulation,
  ChangeDetectorRef,
  Directive,
  OnChanges,
  SimpleChanges,
  OnInit,
  inject,
} from '@angular/core';
import {CanColor, DateAdapter, mixinColor, ThemePalette} from '@angular/material/core';
import {AnimationEvent} from '@angular/animations';
import {merge, Subject, Observable, Subscription} from 'rxjs';
import {filter, take} from 'rxjs/operators';
import {_getFocusedElementPierceShadowDom} from '@angular/cdk/platform';
import {MatCalendar, MatCalendarView} from './calendar';
import {matDatepickerAnimations} from './datepicker-animations';
import {createMissingDateImplError} from './datepicker-errors';
import {MatCalendarUserEvent, MatCalendarCellClassFunction} from './calendar-body';
import {DateFilterFn} from './datepicker-input-base';
import {
  ExtractDateTypeFromSelection,
  MatDateSelectionModel,
  DateRange,
} from './date-selection-model';
import {
  MAT_DATE_RANGE_SELECTION_STRATEGY,
  MatDateRangeSelectionStrategy,
} from './date-range-selection-strategy';
import {MatDatepickerIntl} from './datepicker-intl';
import {DOCUMENT} from '@angular/common';

/**
 * Used to generate a unique ID for each datepicker instance.
 *
 * 用于为每个日期选择器实例生成一个唯一的 ID。
 *
 */
let datepickerUid = 0;

/**
 * Injection token that determines the scroll handling while the calendar is open.
 *
 * 此注入令牌决定了当日历打开时滚动的处理策略。
 *
 */
export const MAT_DATEPICKER_SCROLL_STRATEGY = new InjectionToken<() => ScrollStrategy>(
  'mat-datepicker-scroll-strategy',
);

/** @docs-private */
export function MAT_DATEPICKER_SCROLL_STRATEGY_FACTORY(overlay: Overlay): () => ScrollStrategy {
  return () => overlay.scrollStrategies.reposition();
}

/**
 * Possible positions for the datepicker dropdown along the X axis.
 *
 * 日期选择器下拉列表沿 X 轴的可能位置。
 *
 */
export type DatepickerDropdownPositionX = 'start' | 'end';

/**
 * Possible positions for the datepicker dropdown along the Y axis.
 *
 * 日期选择器下拉列表沿 Y 轴的可能位置。
 *
 */
export type DatepickerDropdownPositionY = 'above' | 'below';

/** @docs-private */
export const MAT_DATEPICKER_SCROLL_STRATEGY_FACTORY_PROVIDER = {
  provide: MAT_DATEPICKER_SCROLL_STRATEGY,
  deps: [Overlay],
  useFactory: MAT_DATEPICKER_SCROLL_STRATEGY_FACTORY,
};

// Boilerplate for applying mixins to MatDatepickerContent.
/** @docs-private */
const _MatDatepickerContentBase = mixinColor(
  class {
    constructor(public _elementRef: ElementRef) {}
  },
);

/**
 * Component used as the content for the datepicker overlay. We use this instead of using
 * MatCalendar directly as the content so we can control the initial focus. This also gives us a
 * place to put additional features of the overlay that are not part of the calendar itself in the
 * future. \(e.g. confirmation buttons\).
 *
 * 用作日期选择器对话框和弹出框的内容组件。我们用它取代直接使用 MatCalendar 作为内容，这样才能控制初始焦点。这也为我们提供了一个未来可以把弹出窗口的其他特性（例如确认按钮）放到日历自身之外的机会。
 *
 * @docs-private
 */
@Component({
  selector: 'mat-datepicker-content',
  templateUrl: 'datepicker-content.html',
  styleUrls: ['datepicker-content.css'],
  host: {
    'class': 'mat-datepicker-content',
    '[@transformPanel]': '_animationState',
    '(@transformPanel.start)': '_handleAnimationEvent($event)',
    '(@transformPanel.done)': '_handleAnimationEvent($event)',
    '[class.mat-datepicker-content-touch]': 'datepicker.touchUi',
  },
  animations: [matDatepickerAnimations.transformPanel, matDatepickerAnimations.fadeInCalendar],
  exportAs: 'matDatepickerContent',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  inputs: ['color'],
})
export class MatDatepickerContent<S, D = ExtractDateTypeFromSelection<S>>
  extends _MatDatepickerContentBase
  implements OnInit, AfterViewInit, OnDestroy, CanColor
{
  private _subscriptions = new Subscription();
  private _model: MatDateSelectionModel<S, D>;

  /**
   * Reference to the internal calendar component.
   *
   * 内部日历组件的引用。
   *
   */
  @ViewChild(MatCalendar) _calendar: MatCalendar<D>;

  /**
   * Reference to the datepicker that created the overlay.
   *
   * 创建该浮层的日期选择器的引用。
   *
   */
  datepicker: MatDatepickerBase<any, S, D>;

  /**
   * Start of the comparison range.
   *
   * 比较范围的起始日期。
   *
   */
  comparisonStart: D | null;

  /**
   * End of the comparison range.
   *
   * 比较范围的结束日期。
   *
   */
  comparisonEnd: D | null;

  /**
   * ARIA Accessible name of the `<input matStartDate/>`
   *
   * `<input matStartDate/>` 的 ARIA 无障碍名称
   *
   */
  startDateAccessibleName: string | null;

  /**
   * ARIA Accessible name of the `<input matEndDate/>`
   *
   * `<input matEndDate/>` 的 ARIA 无障碍名称
   *
   */
  endDateAccessibleName: string | null;

  /**
   * Whether the datepicker is above or below the input.
   *
   * 日期选择器是在输入框的上方还是下方。
   *
   */
  _isAbove: boolean;

  /**
   * Current state of the animation.
   *
   * 动画的当前状态
   *
   */
  _animationState: 'enter-dropdown' | 'enter-dialog' | 'void';

  /**
   * Emits when an animation has finished.
   *
   * 当动画结束时就会触发。
   *
   */
  readonly _animationDone = new Subject<void>();

  /**
   * Whether there is an in-progress animation.
   *
   * 是否有进行中的动画。
   *
   */
  _isAnimating = false;

  /**
   * Text for the close button.
   *
   * 关闭按钮的文本。
   *
   */
  _closeButtonText: string;

  /**
   * Whether the close button currently has focus.
   *
   * 关闭按钮现在是否拥有焦点。
   *
   */
  _closeButtonFocused: boolean;

  /**
   * Portal with projected action buttons.
   *
   * 容纳投影过来的动作按钮的传送点。
   *
   */
  _actionsPortal: TemplatePortal | null = null;

  /**
   * Id of the label for the `role="dialog"` element.
   *
   * 指向 `role="dialog"` 元素的标签的 ID。
   *
   */
  _dialogLabelId: string | null;

  constructor(
    elementRef: ElementRef,
    private _changeDetectorRef: ChangeDetectorRef,
    private _globalModel: MatDateSelectionModel<S, D>,
    private _dateAdapter: DateAdapter<D>,
    @Optional()
    @Inject(MAT_DATE_RANGE_SELECTION_STRATEGY)
    private _rangeSelectionStrategy: MatDateRangeSelectionStrategy<D>,
    intl: MatDatepickerIntl,
  ) {
    super(elementRef);
    this._closeButtonText = intl.closeCalendarLabel;
  }

  ngOnInit() {
    this._animationState = this.datepicker.touchUi ? 'enter-dialog' : 'enter-dropdown';
  }

  ngAfterViewInit() {
    this._subscriptions.add(
      this.datepicker.stateChanges.subscribe(() => {
        this._changeDetectorRef.markForCheck();
      }),
    );
    this._calendar.focusActiveCell();
  }

  ngOnDestroy() {
    this._subscriptions.unsubscribe();
    this._animationDone.complete();
  }

  _handleUserSelection(event: MatCalendarUserEvent<D | null>) {
    const selection = this._model.selection;
    const value = event.value;
    const isRange = selection instanceof DateRange;

    // If we're selecting a range and we have a selection strategy, always pass the value through
    // there. Otherwise don't assign null values to the model, unless we're selecting a range.
    // A null value when picking a range means that the user cancelled the selection (e.g. by
    // pressing escape), whereas when selecting a single value it means that the value didn't
    // change. This isn't very intuitive, but it's here for backwards-compatibility.
    if (isRange && this._rangeSelectionStrategy) {
      const newSelection = this._rangeSelectionStrategy.selectionFinished(
        value,
        selection as unknown as DateRange<D>,
        event.event,
      );
      this._model.updateSelection(newSelection as unknown as S, this);
    } else if (
      value &&
      (isRange || !this._dateAdapter.sameDate(value, selection as unknown as D))
    ) {
      this._model.add(value);
    }

    // Delegate closing the overlay to the actions.
    if ((!this._model || this._model.isComplete()) && !this._actionsPortal) {
      this.datepicker.close();
    }
  }

  _handleUserDragDrop(event: MatCalendarUserEvent<DateRange<D>>) {
    this._model.updateSelection(event.value as unknown as S, this);
  }

  _startExitAnimation() {
    this._animationState = 'void';
    this._changeDetectorRef.markForCheck();
  }

  _handleAnimationEvent(event: AnimationEvent) {
    this._isAnimating = event.phaseName === 'start';

    if (!this._isAnimating) {
      this._animationDone.next();
    }
  }

  _getSelected() {
    return this._model.selection as unknown as D | DateRange<D> | null;
  }

  /**
   * Applies the current pending selection to the global model.
   *
   * 将当前挂起的选择应用于全局模型。
   *
   */
  _applyPendingSelection() {
    if (this._model !== this._globalModel) {
      this._globalModel.updateSelection(this._model.selection, this);
    }
  }

  /**
   * Assigns a new portal containing the datepicker actions.
   *
   * 分配一个包含日期选择器操作的新传送点。
   *
   * @param portal Portal with the actions to be assigned.
   *
   * 带有要分配的动作的传送点。
   *
   * @param forceRerender Whether a re-render of the portal should be triggered. This isn't
   * necessary if the portal is assigned during initialization, but it may be required if it's
   * added at a later point.
   *
   * 是否应触发传送点的重新渲染。如果在初始化期间分配了传送点，则这不是必需的，但如果是稍后添加的则可能需要。
   *
   */
  _assignActions(portal: TemplatePortal<any> | null, forceRerender: boolean) {
    // If we have actions, clone the model so that we have the ability to cancel the selection,
    // otherwise update the global model directly. Note that we want to assign this as soon as
    // possible, but `_actionsPortal` isn't available in the constructor so we do it in `ngOnInit`.
    this._model = portal ? this._globalModel.clone() : this._globalModel;
    this._actionsPortal = portal;

    if (forceRerender) {
      this._changeDetectorRef.detectChanges();
    }
  }
}

/**
 * Form control that can be associated with a datepicker.
 *
 * 可以和日期选择器关联的表单控件。
 *
 */
export interface MatDatepickerControl<D> {
  getStartValue(): D | null;
  getThemePalette(): ThemePalette;
  min: D | null;
  max: D | null;
  disabled: boolean;
  dateFilter: DateFilterFn<D>;
  getConnectedOverlayOrigin(): ElementRef;
  getOverlayLabelId(): string | null;
  stateChanges: Observable<void>;
}

/**
 * A datepicker that can be attached to a {@link MatDatepickerControl}.
 *
 * 一个可以附着到 {@link MatDatepickerControl} 上的日期选择器。
 *
 */
export interface MatDatepickerPanel<
  C extends MatDatepickerControl<D>,
  S,
  D = ExtractDateTypeFromSelection<S>,
> {
  /**
   * Stream that emits whenever the date picker is closed.
   *
   * 只要日期选择器关闭就会发出通知的流。
   *
   */
  closedStream: EventEmitter<void>;
  /**
   * Color palette to use on the datepicker's calendar.
   *
   * 要在日期选择器的日历上使用的调色板。
   *
   */
  color: ThemePalette;
  /**
   * The input element the datepicker is associated with.
   *
   * 日期选择器关联到的输入框元素。
   *
   */
  datepickerInput: C;
  /**
   * Whether the datepicker pop-up should be disabled.
   *
   * 是否应该禁用日期选择器的弹出窗口。
   *
   */
  disabled: boolean;
  /**
   * The id for the datepicker's calendar.
   *
   * 日期选择器日历的 id。
   *
   */
  id: string;
  /**
   * Whether the datepicker is open.
   *
   * 该日期选择器是否已打开。
   *
   */
  opened: boolean;
  /**
   * Stream that emits whenever the date picker is opened.
   *
   * 每当打开日期选择器时就会发出通知的流。
   *
   */
  openedStream: EventEmitter<void>;
  /**
   * Emits when the datepicker's state changes.
   *
   * 当日期选择器的状态发生变化时就会触发。
   *
   */
  stateChanges: Subject<void>;
  /**
   * Opens the datepicker.
   *
   * 打开 datepicker。
   *
   */
  open(): void;
  /**
   * Register an input with the datepicker.
   *
   * 用日期选择器注册一个输入。
   *
   */
  registerInput(input: C): MatDateSelectionModel<S, D>;
}

/**
 * Base class for a datepicker.
 *
 * 日期选择器的基类。
 *
 */
@Directive()
export abstract class MatDatepickerBase<
  C extends MatDatepickerControl<D>,
  S,
  D = ExtractDateTypeFromSelection<S>,
> implements MatDatepickerPanel<C, S, D>, OnDestroy, OnChanges
{
  private _scrollStrategy: () => ScrollStrategy;
  private _inputStateChanges = Subscription.EMPTY;
  private _document = inject(DOCUMENT);

  /**
   * An input indicating the type of the custom header component for the calendar, if set.
   *
   * 一个输入属性，用于指示日历的自定义标头组件的类型（如果已设置）。
   *
   */
  @Input() calendarHeaderComponent: ComponentType<any>;

  /**
   * The date to open the calendar to initially.
   *
   * 打开日历时的初始日期。
   *
   */
  @Input()
  get startAt(): D | null {
    // If an explicit startAt is set we start there, otherwise we start at whatever the currently
    // selected value is.
    return this._startAt || (this.datepickerInput ? this.datepickerInput.getStartValue() : null);
  }
  set startAt(value: D | null) {
    this._startAt = this._dateAdapter.getValidDateOrNull(this._dateAdapter.deserialize(value));
  }
  private _startAt: D | null;

  /**
   * The view that the calendar should start in.
   *
   * 日历应该启动到哪个视图。
   *
   */
  @Input() startView: 'month' | 'year' | 'multi-year' = 'month';

  /**
   * Color palette to use on the datepicker's calendar.
   *
   * 要在日期选择器的日历上使用的调色板。
   *
   */
  @Input()
  get color(): ThemePalette {
    return (
      this._color || (this.datepickerInput ? this.datepickerInput.getThemePalette() : undefined)
    );
  }
  set color(value: ThemePalette) {
    this._color = value;
  }
  _color: ThemePalette;

  /**
   * Whether the calendar UI is in touch mode. In touch mode the calendar opens in a dialog rather
   * than a dropdown and elements have more padding to allow for bigger touch targets.
   *
   * 日历 UI 是否处于触摸模式。在触摸模式下，日历会在一个对话框中打开，而不是下拉框，而且元素有更大的衬距，以允许更大的触摸目标。
   *
   */
  @Input()
  get touchUi(): boolean {
    return this._touchUi;
  }
  set touchUi(value: BooleanInput) {
    this._touchUi = coerceBooleanProperty(value);
  }
  private _touchUi = false;

  /**
   * Whether the datepicker pop-up should be disabled.
   *
   * 是否应该禁用日期选择器的弹出窗口。
   *
   */
  @Input()
  get disabled(): boolean {
    return this._disabled === undefined && this.datepickerInput
      ? this.datepickerInput.disabled
      : !!this._disabled;
  }
  set disabled(value: BooleanInput) {
    const newValue = coerceBooleanProperty(value);

    if (newValue !== this._disabled) {
      this._disabled = newValue;
      this.stateChanges.next(undefined);
    }
  }
  private _disabled: boolean;

  /**
   * Preferred position of the datepicker in the X axis.
   *
   * 日期选择器在 X 轴上的首选位置。
   *
   */
  @Input()
  xPosition: DatepickerDropdownPositionX = 'start';

  /**
   * Preferred position of the datepicker in the Y axis.
   *
   * 日期选择器在 Y 轴上的首选位置。
   *
   */
  @Input()
  yPosition: DatepickerDropdownPositionY = 'below';

  /**
   * Whether to restore focus to the previously-focused element when the calendar is closed.
   * Note that automatic focus restoration is an accessibility feature and it is recommended that
   * you provide your own equivalent, if you decide to turn it off.
   *
   * 当日历关闭时，是否要把焦点恢复到之前拥有焦点的元素。请注意，自动恢复焦点是一种无障碍功能，如果你决定将其关闭，建议你提供自己的等效对象。
   *
   */
  @Input()
  get restoreFocus(): boolean {
    return this._restoreFocus;
  }
  set restoreFocus(value: BooleanInput) {
    this._restoreFocus = coerceBooleanProperty(value);
  }
  private _restoreFocus = true;

  /**
   * Emits selected year in multiyear view.
   * This doesn't imply a change on the selected date.
   *
   * 在多年视图中选出年份时触发。这并不会更改选定日期。
   *
   */
  @Output() readonly yearSelected: EventEmitter<D> = new EventEmitter<D>();

  /**
   * Emits selected month in year view.
   * This doesn't imply a change on the selected date.
   *
   * 在年份视图中选定月份时触发。这并不会更改选定日期。
   *
   */
  @Output() readonly monthSelected: EventEmitter<D> = new EventEmitter<D>();

  /**
   * Emits when the current view changes.
   *
   * 当前视图发生变化时触发。
   *
   */
  @Output() readonly viewChanged: EventEmitter<MatCalendarView> = new EventEmitter<MatCalendarView>(
    true,
  );

  /**
   * Function that can be used to add custom CSS classes to dates.
   *
   * 可以用来为日期添加自定义 CSS 类的函数。
   *
   */
  @Input() dateClass: MatCalendarCellClassFunction<D>;

  /**
   * Emits when the datepicker has been opened.
   *
   * 当日期选择器打开时发出通知。
   *
   */
  @Output('opened') readonly openedStream = new EventEmitter<void>();

  /**
   * Emits when the datepicker has been closed.
   *
   * 当日期选择器已关闭时触发。
   *
   */
  @Output('closed') readonly closedStream = new EventEmitter<void>();

  /**
   * Classes to be passed to the date picker panel.
   * Supports string and string array values, similar to `ngClass`.
   *
   * 要传递给日期选择器面板的类。支持字符串和字符串数组的值，类似于 `ngClass`。
   *
   */
  @Input()
  get panelClass(): string | string[] {
    return this._panelClass;
  }
  set panelClass(value: string | string[]) {
    this._panelClass = coerceStringArray(value);
  }
  private _panelClass: string[];

  /**
   * Whether the calendar is open.
   *
   * 日历是否处于打开状态。
   *
   */
  @Input()
  get opened(): boolean {
    return this._opened;
  }
  set opened(value: BooleanInput) {
    coerceBooleanProperty(value) ? this.open() : this.close();
  }
  private _opened = false;

  /**
   * The id for the datepicker calendar.
   *
   * 日期选择器日历的 id。
   *
   */
  id: string = `mat-datepicker-${datepickerUid++}`;

  /**
   * The minimum selectable date.
   *
   * 最小可选日期。
   *
   */
  _getMinDate(): D | null {
    return this.datepickerInput && this.datepickerInput.min;
  }

  /**
   * The maximum selectable date.
   *
   * 最大可选日期。
   *
   */
  _getMaxDate(): D | null {
    return this.datepickerInput && this.datepickerInput.max;
  }

  _getDateFilter(): DateFilterFn<D> {
    return this.datepickerInput && this.datepickerInput.dateFilter;
  }

  /**
   * A reference to the overlay into which we've rendered the calendar.
   *
   * 当我们渲染日历时，对其浮层的引用。
   *
   */
  private _overlayRef: OverlayRef | null;

  /**
   * Reference to the component instance rendered in the overlay.
   *
   * 指向浮层中已渲染的组件实例的引用。
   *
   */
  private _componentRef: ComponentRef<MatDatepickerContent<S, D>> | null;

  /**
   * The element that was focused before the datepicker was opened.
   *
   * 在打开日期选择器之前拥有焦点的元素。
   *
   */
  private _focusedElementBeforeOpen: HTMLElement | null = null;

  /**
   * Unique class that will be added to the backdrop so that the test harnesses can look it up.
   *
   * 这个独特的类会添加到背景板中，以便测试工具可以查找它。
   *
   */
  private _backdropHarnessClass = `${this.id}-backdrop`;

  /**
   * Currently-registered actions portal.
   *
   * 当前已注册的动作栏传送点。
   *
   */
  private _actionsPortal: TemplatePortal | null;

  /**
   * The input element this datepicker is associated with.
   *
   * 此日期选择器关联到的输入框元素。
   *
   */
  datepickerInput: C;

  /**
   * Emits when the datepicker's state changes.
   *
   * 当日期选择器的状态发生变化时触发。
   *
   */
  readonly stateChanges = new Subject<void>();

  constructor(
    private _overlay: Overlay,
    private _ngZone: NgZone,
    private _viewContainerRef: ViewContainerRef,
    @Inject(MAT_DATEPICKER_SCROLL_STRATEGY) scrollStrategy: any,
    @Optional() private _dateAdapter: DateAdapter<D>,
    @Optional() private _dir: Directionality,
    private _model: MatDateSelectionModel<S, D>,
  ) {
    if (!this._dateAdapter && (typeof ngDevMode === 'undefined' || ngDevMode)) {
      throw createMissingDateImplError('DateAdapter');
    }

    this._scrollStrategy = scrollStrategy;
  }

  ngOnChanges(changes: SimpleChanges) {
    const positionChange = changes['xPosition'] || changes['yPosition'];

    if (positionChange && !positionChange.firstChange && this._overlayRef) {
      const positionStrategy = this._overlayRef.getConfig().positionStrategy;

      if (positionStrategy instanceof FlexibleConnectedPositionStrategy) {
        this._setConnectedPositions(positionStrategy);

        if (this.opened) {
          this._overlayRef.updatePosition();
        }
      }
    }

    this.stateChanges.next(undefined);
  }

  ngOnDestroy() {
    this._destroyOverlay();
    this.close();
    this._inputStateChanges.unsubscribe();
    this.stateChanges.complete();
  }

  /**
   * Selects the given date
   *
   * 选择指定的日期
   *
   */
  select(date: D): void {
    this._model.add(date);
  }

  /**
   * Emits the selected year in multiyear view
   *
   * 在多年视图中选定年份时触发
   *
   */
  _selectYear(normalizedYear: D): void {
    this.yearSelected.emit(normalizedYear);
  }

  /**
   * Emits selected month in year view
   *
   * 在年份视图中选出月份时触发
   *
   */
  _selectMonth(normalizedMonth: D): void {
    this.monthSelected.emit(normalizedMonth);
  }

  /**
   * Emits changed view
   *
   * 视图发生变化时触发
   *
   */
  _viewChanged(view: MatCalendarView): void {
    this.viewChanged.emit(view);
  }

  /**
   * Register an input with this datepicker.
   *
   * 用这个日期选择器注册一个输入框。
   *
   * @param input The datepicker input to register with this datepicker.
   *
   * 要注册这个日期选择器的输入框。
   *
   * @returns
   *
   * Selection model that the input should hook itself up to.
   *
   * 输入应该挂钩到的选择模型。
   *
   */
  registerInput(input: C): MatDateSelectionModel<S, D> {
    if (this.datepickerInput && (typeof ngDevMode === 'undefined' || ngDevMode)) {
      throw Error('A MatDatepicker can only be associated with a single input.');
    }
    this._inputStateChanges.unsubscribe();
    this.datepickerInput = input;
    this._inputStateChanges = input.stateChanges.subscribe(() => this.stateChanges.next(undefined));
    return this._model;
  }

  /**
   * Registers a portal containing action buttons with the datepicker.
   *
   * 使用日期选择器注册一个包含操作按钮的传送点。
   *
   * @param portal Portal to be registered.
   *
   * 要注册的传送点。
   *
   */
  registerActions(portal: TemplatePortal): void {
    if (this._actionsPortal && (typeof ngDevMode === 'undefined' || ngDevMode)) {
      throw Error('A MatDatepicker can only be associated with a single actions row.');
    }
    this._actionsPortal = portal;
    this._componentRef?.instance._assignActions(portal, true);
  }

  /**
   * Removes a portal containing action buttons from the datepicker.
   *
   * 从日期选择器中删除一个包含动作按钮的传送点。
   *
   * @param portal Portal to be removed.
   *
   * 要删除的传送点。
   *
   */
  removeActions(portal: TemplatePortal): void {
    if (portal === this._actionsPortal) {
      this._actionsPortal = null;
      this._componentRef?.instance._assignActions(null, true);
    }
  }

  /**
   * Open the calendar.
   *
   * 打开日历。
   *
   */
  open(): void {
    // Skip reopening if there's an in-progress animation to avoid overlapping
    // sequences which can cause "changed after checked" errors. See #25837.
    if (this._opened || this.disabled || this._componentRef?.instance._isAnimating) {
      return;
    }

    if (!this.datepickerInput && (typeof ngDevMode === 'undefined' || ngDevMode)) {
      throw Error('Attempted to open an MatDatepicker with no associated input.');
    }

    this._focusedElementBeforeOpen = _getFocusedElementPierceShadowDom();
    this._openOverlay();
    this._opened = true;
    this.openedStream.emit();
  }

  /**
   * Close the calendar.
   *
   * 关闭日历。
   *
   */
  close(): void {
    // Skip reopening if there's an in-progress animation to avoid overlapping
    // sequences which can cause "changed after checked" errors. See #25837.
    if (!this._opened || this._componentRef?.instance._isAnimating) {
      return;
    }

    const canRestoreFocus =
      this._restoreFocus &&
      this._focusedElementBeforeOpen &&
      typeof this._focusedElementBeforeOpen.focus === 'function';

    const completeClose = () => {
      // The `_opened` could've been reset already if
      // we got two events in quick succession.
      if (this._opened) {
        this._opened = false;
        this.closedStream.emit();
      }
    };

    if (this._componentRef) {
      const {instance, location} = this._componentRef;
      instance._startExitAnimation();
      instance._animationDone.pipe(take(1)).subscribe(() => {
        const activeElement = this._document.activeElement;

        // Since we restore focus after the exit animation, we have to check that
        // the user didn't move focus themselves inside the `close` handler.
        if (
          canRestoreFocus &&
          (!activeElement ||
            activeElement === this._document.activeElement ||
            location.nativeElement.contains(activeElement))
        ) {
          this._focusedElementBeforeOpen!.focus();
        }

        this._focusedElementBeforeOpen = null;
        this._destroyOverlay();
      });
    }

    if (canRestoreFocus) {
      // Because IE moves focus asynchronously, we can't count on it being restored before we've
      // marked the datepicker as closed. If the event fires out of sequence and the element that
      // we're refocusing opens the datepicker on focus, the user could be stuck with not being
      // able to close the calendar at all. We work around it by making the logic, that marks
      // the datepicker as closed, async as well.
      setTimeout(completeClose);
    } else {
      completeClose();
    }
  }

  /**
   * Applies the current pending selection on the overlay to the model.
   *
   * 把弹出窗口中当前挂起的选择应用到该模型中。
   *
   */
  _applyPendingSelection() {
    this._componentRef?.instance?._applyPendingSelection();
  }

  /**
   * Forwards relevant values from the datepicker to the datepicker content inside the overlay.
   *
   * 将相关值从日期选择器转发到浮层中的日期选择器内容。
   *
   */
  protected _forwardContentValues(instance: MatDatepickerContent<S, D>) {
    instance.datepicker = this;
    instance.color = this.color;
    instance._actionsPortal = this._actionsPortal;
  }

  /**
   * Opens the overlay with the calendar.
   *
   * 打开带有日历的浮层。
   *
   */
  private _openOverlay(): void {
    this._destroyOverlay();

    const isDialog = this.touchUi;
    const portal = new ComponentPortal<MatDatepickerContent<S, D>>(
      MatDatepickerContent,
      this._viewContainerRef,
    );
    const overlayRef = (this._overlayRef = this._overlay.create(
      new OverlayConfig({
        positionStrategy: isDialog ? this._getDialogStrategy() : this._getDropdownStrategy(),
        hasBackdrop: true,
        backdropClass: [
          isDialog ? 'cdk-overlay-dark-backdrop' : 'mat-overlay-transparent-backdrop',
          this._backdropHarnessClass,
        ],
        direction: this._dir,
        scrollStrategy: isDialog ? this._overlay.scrollStrategies.block() : this._scrollStrategy(),
        panelClass: `mat-datepicker-${isDialog ? 'dialog' : 'popup'}`,
      }),
    ));

    this._getCloseStream(overlayRef).subscribe(event => {
      if (event) {
        event.preventDefault();
      }
      this.close();
    });

    // The `preventDefault` call happens inside the calendar as well, however focus moves into
    // it inside a timeout which can give browsers a chance to fire off a keyboard event in-between
    // that can scroll the page (see #24969). Always block default actions of arrow keys for the
    // entire overlay so the page doesn't get scrolled by accident.
    overlayRef.keydownEvents().subscribe(event => {
      const keyCode = event.keyCode;

      if (
        keyCode === UP_ARROW ||
        keyCode === DOWN_ARROW ||
        keyCode === LEFT_ARROW ||
        keyCode === RIGHT_ARROW ||
        keyCode === PAGE_UP ||
        keyCode === PAGE_DOWN
      ) {
        event.preventDefault();
      }
    });

    this._componentRef = overlayRef.attach(portal);
    this._forwardContentValues(this._componentRef.instance);

    // Update the position once the calendar has rendered. Only relevant in dropdown mode.
    if (!isDialog) {
      this._ngZone.onStable.pipe(take(1)).subscribe(() => overlayRef.updatePosition());
    }
  }

  /**
   * Destroys the current overlay.
   *
   * 销毁当前浮层。
   *
   */
  private _destroyOverlay() {
    if (this._overlayRef) {
      this._overlayRef.dispose();
      this._overlayRef = this._componentRef = null;
    }
  }

  /**
   * Gets a position strategy that will open the calendar as a dropdown.
   *
   * 获取将打开日历作为下拉列表的定位策略。
   *
   */
  private _getDialogStrategy() {
    return this._overlay.position().global().centerHorizontally().centerVertically();
  }

  /**
   * Gets a position strategy that will open the calendar as a dropdown.
   *
   * 获取将打开日历作为下拉列表的定位策略。
   *
   */
  private _getDropdownStrategy() {
    const strategy = this._overlay
      .position()
      .flexibleConnectedTo(this.datepickerInput.getConnectedOverlayOrigin())
      .withTransformOriginOn('.mat-datepicker-content')
      .withFlexibleDimensions(false)
      .withViewportMargin(8)
      .withLockedPosition();

    return this._setConnectedPositions(strategy);
  }

  /**
   * Sets the positions of the datepicker in dropdown mode based on the current configuration.
   *
   * 根据当前配置，在下拉模式下设置日期选择器的位置。
   *
   */
  private _setConnectedPositions(strategy: FlexibleConnectedPositionStrategy) {
    const primaryX = this.xPosition === 'end' ? 'end' : 'start';
    const secondaryX = primaryX === 'start' ? 'end' : 'start';
    const primaryY = this.yPosition === 'above' ? 'bottom' : 'top';
    const secondaryY = primaryY === 'top' ? 'bottom' : 'top';

    return strategy.withPositions([
      {
        originX: primaryX,
        originY: secondaryY,
        overlayX: primaryX,
        overlayY: primaryY,
      },
      {
        originX: primaryX,
        originY: primaryY,
        overlayX: primaryX,
        overlayY: secondaryY,
      },
      {
        originX: secondaryX,
        originY: secondaryY,
        overlayX: secondaryX,
        overlayY: primaryY,
      },
      {
        originX: secondaryX,
        originY: primaryY,
        overlayX: secondaryX,
        overlayY: secondaryY,
      },
    ]);
  }

  /**
   * Gets an observable that will emit when the overlay is supposed to be closed.
   *
   * 获取一个可观察对象，它会在应该关闭浮层时会发出事件。
   *
   */
  private _getCloseStream(overlayRef: OverlayRef) {
    const ctrlShiftMetaModifiers: ModifierKey[] = ['ctrlKey', 'shiftKey', 'metaKey'];
    return merge(
      overlayRef.backdropClick(),
      overlayRef.detachments(),
      overlayRef.keydownEvents().pipe(
        filter(event => {
          // Closing on alt + up is only valid when there's an input associated with the datepicker.
          return (
            (event.keyCode === ESCAPE && !hasModifierKey(event)) ||
            (this.datepickerInput &&
              hasModifierKey(event, 'altKey') &&
              event.keyCode === UP_ARROW &&
              ctrlShiftMetaModifiers.every(
                (modifier: ModifierKey) => !hasModifierKey(event, modifier),
              ))
          );
        }),
      ),
    );
  }
}
