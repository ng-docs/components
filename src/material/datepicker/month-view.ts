/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  DOWN_ARROW,
  END,
  ENTER,
  HOME,
  LEFT_ARROW,
  PAGE_DOWN,
  PAGE_UP,
  RIGHT_ARROW,
  UP_ARROW,
  SPACE,
  ESCAPE,
  hasModifierKey,
} from '@angular/cdk/keycodes';
import {
  AfterContentInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Inject,
  Input,
  Optional,
  Output,
  ViewEncapsulation,
  ViewChild,
  OnDestroy,
  SimpleChanges,
  OnChanges,
} from '@angular/core';
import {DateAdapter, MAT_DATE_FORMATS, MatDateFormats} from '@angular/material/core';
import {Directionality} from '@angular/cdk/bidi';
import {
  MatCalendarBody,
  MatCalendarCell,
  MatCalendarUserEvent,
  MatCalendarCellClassFunction,
} from './calendar-body';
import {createMissingDateImplError} from './datepicker-errors';
import {Subscription} from 'rxjs';
import {startWith} from 'rxjs/operators';
import {DateRange} from './date-selection-model';
import {
  MatDateRangeSelectionStrategy,
  MAT_DATE_RANGE_SELECTION_STRATEGY,
} from './date-range-selection-strategy';

const DAYS_PER_WEEK = 7;

/**
 * An internal component used to display a single month in the datepicker.
 *
 * 一个用来在日期选择器中显示单个月的内部组件。
 *
 * @docs-private
 */
@Component({
  selector: 'mat-month-view',
  templateUrl: 'month-view.html',
  exportAs: 'matMonthView',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatMonthView<D> implements AfterContentInit, OnChanges, OnDestroy {
  private _rerenderSubscription = Subscription.EMPTY;

  /**
   * Flag used to filter out space/enter keyup events that originated outside of the view.
   *
   * 用于过滤掉源自视图之外的空格/输入键事件的标志。
   *
   */
  private _selectionKeyPressed: boolean;

  /**
   * The date to display in this month view (everything other than the month and year is ignored).
   *
   * 要显示在本月视图中的日期（忽略月份和年份以外的所有内容）。
   *
   */
  @Input()
  get activeDate(): D {
    return this._activeDate;
  }
  set activeDate(value: D) {
    const oldActiveDate = this._activeDate;
    const validDate =
      this._dateAdapter.getValidDateOrNull(this._dateAdapter.deserialize(value)) ||
      this._dateAdapter.today();
    this._activeDate = this._dateAdapter.clampDate(validDate, this.minDate, this.maxDate);
    if (!this._hasSameMonthAndYear(oldActiveDate, this._activeDate)) {
      this._init();
    }
  }
  private _activeDate: D;

  /**
   * The currently selected date.
   *
   * 当前选定日期。
   *
   */
  @Input()
  get selected(): DateRange<D> | D | null {
    return this._selected;
  }
  set selected(value: DateRange<D> | D | null) {
    if (value instanceof DateRange) {
      this._selected = value;
    } else {
      this._selected = this._dateAdapter.getValidDateOrNull(this._dateAdapter.deserialize(value));
    }

    this._setRanges(this._selected);
  }
  private _selected: DateRange<D> | D | null;

  /**
   * The minimum selectable date.
   *
   * 最小可选日期。
   *
   */
  @Input()
  get minDate(): D | null {
    return this._minDate;
  }
  set minDate(value: D | null) {
    this._minDate = this._dateAdapter.getValidDateOrNull(this._dateAdapter.deserialize(value));
  }
  private _minDate: D | null;

  /**
   * The maximum selectable date.
   *
   * 最大可选日期。
   *
   */
  @Input()
  get maxDate(): D | null {
    return this._maxDate;
  }
  set maxDate(value: D | null) {
    this._maxDate = this._dateAdapter.getValidDateOrNull(this._dateAdapter.deserialize(value));
  }
  private _maxDate: D | null;

  /**
   * Function used to filter which dates are selectable.
   *
   * 用于过滤哪些日期是可选择的函数。
   *
   */
  @Input() dateFilter: (date: D) => boolean;

  /**
   * Function that can be used to add custom CSS classes to dates.
   *
   * 可以用来为日期添加自定义 CSS 类的函数。
   *
   */
  @Input() dateClass: MatCalendarCellClassFunction<D>;

  /**
   * Start of the comparison range.
   *
   * 比较范围的起点日期。
   *
   */
  @Input() comparisonStart: D | null;

  /**
   * End of the comparison range.
   *
   * 比较范围的结束日期。
   *
   */
  @Input() comparisonEnd: D | null;

  /**
   * ARIA Accessible name of the `<input matStartDate/>`
   *
   * `<input matStartDate/>` 的 ARIA 无障碍名称
   *
   */
  @Input() startDateAccessibleName: string | null;

  /**
   * ARIA Accessible name of the `<input matEndDate/>`
   *
   * `<input matEndDate/>` 的 ARIA 无障碍名称
   *
   */
  @Input() endDateAccessibleName: string | null;

  /**
   * Origin of active drag, or null when dragging is not active.
   *
   * 活动拖动的原点，或当没有活动的拖动时为 null。
   *
   */
  @Input() activeDrag: MatCalendarUserEvent<D> | null = null;

  /**
   * Emits when a new date is selected.
   *
   * 已选择新日期时发出。
   *
   */
  @Output() readonly selectedChange: EventEmitter<D | null> = new EventEmitter<D | null>();

  /**
   * Emits when any date is selected.
   *
   * 选定任何日期时会发出通知。
   *
   */
  @Output() readonly _userSelection: EventEmitter<MatCalendarUserEvent<D | null>> =
    new EventEmitter<MatCalendarUserEvent<D | null>>();

  /**
   * Emits when the user initiates a date range drag via mouse or touch.
   *
   * 当用户通过鼠标或触控启动日期范围拖动时发出。
   *
   */
  @Output() readonly dragStarted = new EventEmitter<MatCalendarUserEvent<D>>();

  /**
   * Emits when the user completes or cancels a date range drag.
   * Emits null when the drag was canceled or the newly selected date range if completed.
   *
   * 当用户完成或取消日期范围拖动时发出。当拖动被取消或新选择的日期范围完成时发出 null。
   *
   */
  @Output() readonly dragEnded = new EventEmitter<MatCalendarUserEvent<DateRange<D> | null>>();

  /**
   * Emits when any date is activated.
   *
   * 激活任何日期时发出。
   *
   */
  @Output() readonly activeDateChange: EventEmitter<D> = new EventEmitter<D>();

  /**
   * The body of calendar table
   *
   * 日历表的表体
   *
   */
  @ViewChild(MatCalendarBody) _matCalendarBody: MatCalendarBody;

  /**
   * The label for this month (e.g. "January 2017").
   *
   * 当前月的标签（例如“2017 年 1 月”）。
   *
   */
  _monthLabel: string;

  /**
   * Grid of calendar cells representing the dates of the month.
   *
   * 表示该月份日期的各个日历单元格。
   *
   */
  _weeks: MatCalendarCell[][];

  /**
   * The number of blank cells in the first row before the 1st of the month.
   *
   * 本月一日前第一行中空白单元格的数量。
   *
   */
  _firstWeekOffset: number;

  /**
   * Start value of the currently-shown date range.
   *
   * 当前显示的日期范围的起始日期。
   *
   */
  _rangeStart: number | null;

  /**
   * End value of the currently-shown date range.
   *
   * 当前显示的日期范围的结束日期。
   *
   */
  _rangeEnd: number | null;

  /**
   * Start value of the currently-shown comparison date range.
   *
   * 当前显示的比较日期范围的起始日期。
   *
   */
  _comparisonRangeStart: number | null;

  /**
   * End value of the currently-shown comparison date range.
   *
   * 当前显示的比较日期范围的结束日期。
   *
   */
  _comparisonRangeEnd: number | null;

  /**
   * Start of the preview range.
   *
   * 预览范围的起始日期。
   *
   */
  _previewStart: number | null;

  /**
   * End of the preview range.
   *
   * 预览范围的结束日期。
   *
   */
  _previewEnd: number | null;

  /**
   * Whether the user is currently selecting a range of dates.
   *
   * 用户当前是否选择了一个日期范围。
   *
   */
  _isRange: boolean;

  /**
   * The date of the month that today falls on. Null if today is in another month.
   *
   * 今天在正显示的月份中的日期。如果正显示的是另一个月，那就为空。
   *
   */
  _todayDate: number | null;

  /**
   * The names of the weekdays.
   *
   * 工作日的名字。
   *
   */
  _weekdays: {long: string; narrow: string}[];

  constructor(
    readonly _changeDetectorRef: ChangeDetectorRef,
    @Optional() @Inject(MAT_DATE_FORMATS) private _dateFormats: MatDateFormats,
    @Optional() public _dateAdapter: DateAdapter<D>,
    @Optional() private _dir?: Directionality,
    @Inject(MAT_DATE_RANGE_SELECTION_STRATEGY)
    @Optional()
    private _rangeStrategy?: MatDateRangeSelectionStrategy<D>,
  ) {
    if (typeof ngDevMode === 'undefined' || ngDevMode) {
      if (!this._dateAdapter) {
        throw createMissingDateImplError('DateAdapter');
      }
      if (!this._dateFormats) {
        throw createMissingDateImplError('MAT_DATE_FORMATS');
      }
    }

    this._activeDate = this._dateAdapter.today();
  }

  ngAfterContentInit() {
    this._rerenderSubscription = this._dateAdapter.localeChanges
      .pipe(startWith(null))
      .subscribe(() => this._init());
  }

  ngOnChanges(changes: SimpleChanges) {
    const comparisonChange = changes['comparisonStart'] || changes['comparisonEnd'];

    if (comparisonChange && !comparisonChange.firstChange) {
      this._setRanges(this.selected);
    }

    if (changes['activeDrag'] && !this.activeDrag) {
      this._clearPreview();
    }
  }

  ngOnDestroy() {
    this._rerenderSubscription.unsubscribe();
  }

  /**
   * Handles when a new date is selected.
   *
   * 选择新日期时的处理方法。
   *
   */
  _dateSelected(event: MatCalendarUserEvent<number>) {
    const date = event.value;
    const selectedDate = this._getDateFromDayOfMonth(date);
    let rangeStartDate: number | null;
    let rangeEndDate: number | null;

    if (this._selected instanceof DateRange) {
      rangeStartDate = this._getDateInCurrentMonth(this._selected.start);
      rangeEndDate = this._getDateInCurrentMonth(this._selected.end);
    } else {
      rangeStartDate = rangeEndDate = this._getDateInCurrentMonth(this._selected);
    }

    if (rangeStartDate !== date || rangeEndDate !== date) {
      this.selectedChange.emit(selectedDate);
    }

    this._userSelection.emit({value: selectedDate, event: event.event});
    this._clearPreview();
    this._changeDetectorRef.markForCheck();
  }

  /**
   * Takes the index of a calendar body cell wrapped in in an event as argument. For the date that
   * corresponds to the given cell, set `activeDate` to that date and fire `activeDateChange` with
   * that date.
   *
   * 将包含在事件中的日历正文单元格的索引作为参数。对于与给定单元格对应的日期，将 `activeDate` 设置为该日期并使用该日期触发 `activeDateChange` 。
   *
   * This function is used to match each component's model of the active date with the calendar
   * body cell that was focused. It updates its value of `activeDate` synchronously and updates the
   * parent's value asynchronously via the `activeDateChange` event. The child component receives an
   * updated value asynchronously via the `activeCell` Input.
   *
   * 此函数用于将每个组件的活动日期模型与聚焦的日历正文单元格匹配。它同步更新其 `activeDate` 的值，并通过 `activeDateChange` 事件异步更新父级的值。子组件通过 `activeCell` 输入异步接收更新值。
   *
   */
  _updateActiveDate(event: MatCalendarUserEvent<number>) {
    const month = event.value;
    const oldActiveDate = this._activeDate;
    this.activeDate = this._getDateFromDayOfMonth(month);

    if (this._dateAdapter.compareDate(oldActiveDate, this.activeDate)) {
      this.activeDateChange.emit(this._activeDate);
    }
  }

  /**
   * Handles keydown events on the calendar body when calendar is in month view.
   *
   * 当日历在月视图中时，处理日历主体上的 keydown 事件。
   *
   */
  _handleCalendarBodyKeydown(event: KeyboardEvent): void {
    // TODO(mmalerba): We currently allow keyboard navigation to disabled dates, but just prevent
    // disabled ones from being selected. This may not be ideal, we should look into whether
    // navigation should skip over disabled dates, and if so, how to implement that efficiently.

    const oldActiveDate = this._activeDate;
    const isRtl = this._isRtl();

    switch (event.keyCode) {
      case LEFT_ARROW:
        this.activeDate = this._dateAdapter.addCalendarDays(this._activeDate, isRtl ? 1 : -1);
        break;
      case RIGHT_ARROW:
        this.activeDate = this._dateAdapter.addCalendarDays(this._activeDate, isRtl ? -1 : 1);
        break;
      case UP_ARROW:
        this.activeDate = this._dateAdapter.addCalendarDays(this._activeDate, -7);
        break;
      case DOWN_ARROW:
        this.activeDate = this._dateAdapter.addCalendarDays(this._activeDate, 7);
        break;
      case HOME:
        this.activeDate = this._dateAdapter.addCalendarDays(
          this._activeDate,
          1 - this._dateAdapter.getDate(this._activeDate),
        );
        break;
      case END:
        this.activeDate = this._dateAdapter.addCalendarDays(
          this._activeDate,
          this._dateAdapter.getNumDaysInMonth(this._activeDate) -
            this._dateAdapter.getDate(this._activeDate),
        );
        break;
      case PAGE_UP:
        this.activeDate = event.altKey
          ? this._dateAdapter.addCalendarYears(this._activeDate, -1)
          : this._dateAdapter.addCalendarMonths(this._activeDate, -1);
        break;
      case PAGE_DOWN:
        this.activeDate = event.altKey
          ? this._dateAdapter.addCalendarYears(this._activeDate, 1)
          : this._dateAdapter.addCalendarMonths(this._activeDate, 1);
        break;
      case ENTER:
      case SPACE:
        this._selectionKeyPressed = true;

        if (this._canSelect(this._activeDate)) {
          // Prevent unexpected default actions such as form submission.
          // Note that we only prevent the default action here while the selection happens in
          // `keyup` below. We can't do the selection here, because it can cause the calendar to
          // reopen if focus is restored immediately. We also can't call `preventDefault` on `keyup`
          // because it's too late (see #23305).
          event.preventDefault();
        }
        return;
      case ESCAPE:
        // Abort the current range selection if the user presses escape mid-selection.
        if (this._previewEnd != null && !hasModifierKey(event)) {
          this._clearPreview();
          // If a drag is in progress, cancel the drag without changing the
          // current selection.
          if (this.activeDrag) {
            this.dragEnded.emit({value: null, event});
          } else {
            this.selectedChange.emit(null);
            this._userSelection.emit({value: null, event});
          }
          event.preventDefault();
          event.stopPropagation(); // Prevents the overlay from closing.
        }
        return;
      default:
        // Don't prevent default or focus active cell on keys that we don't explicitly handle.
        return;
    }

    if (this._dateAdapter.compareDate(oldActiveDate, this.activeDate)) {
      this.activeDateChange.emit(this.activeDate);

      this._focusActiveCellAfterViewChecked();
    }

    // Prevent unexpected default actions such as form submission.
    event.preventDefault();
  }

  /**
   * Handles keyup events on the calendar body when calendar is in month view.
   *
   * 当日历处于月视图时，处理日历正文上的键盘事件。
   *
   */
  _handleCalendarBodyKeyup(event: KeyboardEvent): void {
    if (event.keyCode === SPACE || event.keyCode === ENTER) {
      if (this._selectionKeyPressed && this._canSelect(this._activeDate)) {
        this._dateSelected({value: this._dateAdapter.getDate(this._activeDate), event});
      }

      this._selectionKeyPressed = false;
    }
  }

  /**
   * Initializes this month view.
   *
   * 初始化本月的视图。
   *
   */
  _init() {
    this._setRanges(this.selected);
    this._todayDate = this._getCellCompareValue(this._dateAdapter.today());
    this._monthLabel = this._dateFormats.display.monthLabel
      ? this._dateAdapter.format(this.activeDate, this._dateFormats.display.monthLabel)
      : this._dateAdapter
          .getMonthNames('short')
          [this._dateAdapter.getMonth(this.activeDate)].toLocaleUpperCase();

    let firstOfMonth = this._dateAdapter.createDate(
      this._dateAdapter.getYear(this.activeDate),
      this._dateAdapter.getMonth(this.activeDate),
      1,
    );
    this._firstWeekOffset =
      (DAYS_PER_WEEK +
        this._dateAdapter.getDayOfWeek(firstOfMonth) -
        this._dateAdapter.getFirstDayOfWeek()) %
      DAYS_PER_WEEK;

    this._initWeekdays();
    this._createWeekCells();
    this._changeDetectorRef.markForCheck();
  }

  /**
   * Focuses the active cell after the microtask queue is empty.
   *
   * 在微任务队列为空之后，让这个活动单元格获得焦点。
   *
   */
  _focusActiveCell(movePreview?: boolean) {
    this._matCalendarBody._focusActiveCell(movePreview);
  }

  /**
   * Focuses the active cell after change detection has run and the microtask queue is empty.
   *
   * 在变更检测运行且微任务队列为空后聚焦活动单元。
   *
   */
  _focusActiveCellAfterViewChecked() {
    this._matCalendarBody._scheduleFocusActiveCellAfterViewChecked();
  }

  /**
   * Called when the user has activated a new cell and the preview needs to be updated.
   *
   * 当用户激活了一个新单元格并且需要更新预览时调用。
   *
   */
  _previewChanged({event, value: cell}: MatCalendarUserEvent<MatCalendarCell<D> | null>) {
    if (this._rangeStrategy) {
      // We can assume that this will be a range, because preview
      // events aren't fired for single date selections.
      const value = cell ? cell.rawValue! : null;
      const previewRange = this._rangeStrategy.createPreview(
        value,
        this.selected as DateRange<D>,
        event,
      );
      this._previewStart = this._getCellCompareValue(previewRange.start);
      this._previewEnd = this._getCellCompareValue(previewRange.end);

      if (this.activeDrag && value) {
        const dragRange = this._rangeStrategy.createDrag?.(
          this.activeDrag.value,
          this.selected as DateRange<D>,
          value,
          event,
        );

        if (dragRange) {
          this._previewStart = this._getCellCompareValue(dragRange.start);
          this._previewEnd = this._getCellCompareValue(dragRange.end);
        }
      }

      // Note that here we need to use `detectChanges`, rather than `markForCheck`, because
      // the way `_focusActiveCell` is set up at the moment makes it fire at the wrong time
      // when navigating one month back using the keyboard which will cause this handler
      // to throw a "changed after checked" error when updating the preview state.
      this._changeDetectorRef.detectChanges();
    }
  }

  /**
   * Called when the user has ended a drag. If the drag/drop was successful,
   * computes and emits the new range selection.
   *
   * 当用户结束拖动时调用。如果拖放成功，则计算并发出新的范围选择。
   *
   */
  protected _dragEnded(event: MatCalendarUserEvent<D | null>) {
    if (!this.activeDrag) return;

    if (event.value) {
      // Propagate drag effect
      const dragDropResult = this._rangeStrategy?.createDrag?.(
        this.activeDrag.value,
        this.selected as DateRange<D>,
        event.value,
        event.event,
      );

      this.dragEnded.emit({value: dragDropResult ?? null, event: event.event});
    } else {
      this.dragEnded.emit({value: null, event: event.event});
    }
  }

  /**
   * Takes a day of the month and returns a new date in the same month and year as the currently
   *  active date. The returned date will have the same day of the month as the argument date.
   *
   * 获取一个月中的一天，并返回与当前活动日期同年同月的新日期。返回的日期将与参数日期在一个月中的同一天。
   *
   */
  private _getDateFromDayOfMonth(dayOfMonth: number): D {
    return this._dateAdapter.createDate(
      this._dateAdapter.getYear(this.activeDate),
      this._dateAdapter.getMonth(this.activeDate),
      dayOfMonth,
    );
  }

  /**
   * Initializes the weekdays.
   *
   * 初始化工作日。
   *
   */
  private _initWeekdays() {
    const firstDayOfWeek = this._dateAdapter.getFirstDayOfWeek();
    const narrowWeekdays = this._dateAdapter.getDayOfWeekNames('narrow');
    const longWeekdays = this._dateAdapter.getDayOfWeekNames('long');

    // Rotate the labels for days of the week based on the configured first day of the week.
    let weekdays = longWeekdays.map((long, i) => {
      return {long, narrow: narrowWeekdays[i]};
    });
    this._weekdays = weekdays.slice(firstDayOfWeek).concat(weekdays.slice(0, firstDayOfWeek));
  }

  /**
   * Creates MatCalendarCells for the dates in this month.
   *
   * 为本月的日期创建一些 MatCalendarCell。
   *
   */
  private _createWeekCells() {
    const daysInMonth = this._dateAdapter.getNumDaysInMonth(this.activeDate);
    const dateNames = this._dateAdapter.getDateNames();
    this._weeks = [[]];
    for (let i = 0, cell = this._firstWeekOffset; i < daysInMonth; i++, cell++) {
      if (cell == DAYS_PER_WEEK) {
        this._weeks.push([]);
        cell = 0;
      }
      const date = this._dateAdapter.createDate(
        this._dateAdapter.getYear(this.activeDate),
        this._dateAdapter.getMonth(this.activeDate),
        i + 1,
      );
      const enabled = this._shouldEnableDate(date);
      const ariaLabel = this._dateAdapter.format(date, this._dateFormats.display.dateA11yLabel);
      const cellClasses = this.dateClass ? this.dateClass(date, 'month') : undefined;

      this._weeks[this._weeks.length - 1].push(
        new MatCalendarCell<D>(
          i + 1,
          dateNames[i],
          ariaLabel,
          enabled,
          cellClasses,
          this._getCellCompareValue(date)!,
          date,
        ),
      );
    }
  }

  /**
   * Date filter for the month
   *
   * 本月日期的过滤器
   *
   */
  private _shouldEnableDate(date: D): boolean {
    return (
      !!date &&
      (!this.minDate || this._dateAdapter.compareDate(date, this.minDate) >= 0) &&
      (!this.maxDate || this._dateAdapter.compareDate(date, this.maxDate) <= 0) &&
      (!this.dateFilter || this.dateFilter(date))
    );
  }

  /**
   * Gets the date in this month that the given Date falls on.
   * Returns null if the given Date is in another month.
   *
   * 获取指定的日期在当前月份的天数。如果指定的日期在另一个月，则返回 null。
   *
   */
  private _getDateInCurrentMonth(date: D | null): number | null {
    return date && this._hasSameMonthAndYear(date, this.activeDate)
      ? this._dateAdapter.getDate(date)
      : null;
  }

  /**
   * Checks whether the 2 dates are non-null and fall within the same month of the same year.
   *
   * 检查 2 个日期是否不为空，并且在同一年的同一个月内。
   *
   */
  private _hasSameMonthAndYear(d1: D | null, d2: D | null): boolean {
    return !!(
      d1 &&
      d2 &&
      this._dateAdapter.getMonth(d1) == this._dateAdapter.getMonth(d2) &&
      this._dateAdapter.getYear(d1) == this._dateAdapter.getYear(d2)
    );
  }

  /**
   * Gets the value that will be used to one cell to another.
   *
   * 获取一个 cell 到另一个 cell 中的值。
   *
   */
  private _getCellCompareValue(date: D | null): number | null {
    if (date) {
      // We use the time since the Unix epoch to compare dates in this view, rather than the
      // cell values, because we need to support ranges that span across multiple months/years.
      const year = this._dateAdapter.getYear(date);
      const month = this._dateAdapter.getMonth(date);
      const day = this._dateAdapter.getDate(date);
      return new Date(year, month, day).getTime();
    }

    return null;
  }

  /**
   * Determines whether the user has the RTL layout direction.
   *
   * 确定用户是否具有 RTL 布局方向。
   *
   */
  private _isRtl() {
    return this._dir && this._dir.value === 'rtl';
  }

  /**
   * Sets the current range based on a model value.
   *
   * 根据模型中的值设置当前范围。
   *
   */
  private _setRanges(selectedValue: DateRange<D> | D | null) {
    if (selectedValue instanceof DateRange) {
      this._rangeStart = this._getCellCompareValue(selectedValue.start);
      this._rangeEnd = this._getCellCompareValue(selectedValue.end);
      this._isRange = true;
    } else {
      this._rangeStart = this._rangeEnd = this._getCellCompareValue(selectedValue);
      this._isRange = false;
    }

    this._comparisonRangeStart = this._getCellCompareValue(this.comparisonStart);
    this._comparisonRangeEnd = this._getCellCompareValue(this.comparisonEnd);
  }

  /**
   * Gets whether a date can be selected in the month view.
   *
   * 获取是否可以在月视图中选择日期。
   *
   */
  private _canSelect(date: D) {
    return !this.dateFilter || this.dateFilter(date);
  }

  /** Clears out preview state. */
  private _clearPreview() {
    this._previewStart = this._previewEnd = null;
  }
}
