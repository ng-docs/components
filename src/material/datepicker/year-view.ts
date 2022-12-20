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
  ViewChild,
  ViewEncapsulation,
  OnDestroy,
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

/**
 * An internal component used to display a single year in the datepicker.
 *
 * 一个内部组件，用于在日期选择器中显示一年。
 *
 * @docs-private
 */
@Component({
  selector: 'mat-year-view',
  templateUrl: 'year-view.html',
  exportAs: 'matYearView',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatYearView<D> implements AfterContentInit, OnDestroy {
  private _rerenderSubscription = Subscription.EMPTY;

  /**
   * Flag used to filter out space/enter keyup events that originated outside of the view.
   *
   * 用于过滤掉源自视图之外的空格/输入键事件的标志。
   *
   */
  private _selectionKeyPressed: boolean;

  /**
   * The date to display in this year view (everything other than the year is ignored).
   *
   * 要在今年视图中显示的日期（忽略该年份以外的所有内容）。
   *
   */
  @Input()
  get activeDate(): D {
    return this._activeDate;
  }
  set activeDate(value: D) {
    let oldActiveDate = this._activeDate;
    const validDate =
      this._dateAdapter.getValidDateOrNull(this._dateAdapter.deserialize(value)) ||
      this._dateAdapter.today();
    this._activeDate = this._dateAdapter.clampDate(validDate, this.minDate, this.maxDate);
    if (this._dateAdapter.getYear(oldActiveDate) !== this._dateAdapter.getYear(this._activeDate)) {
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

    this._setSelectedMonth(value);
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
   * A function used to filter which dates are selectable.
   *
   * 用来过滤可选择哪些日期的函数。
   *
   */
  @Input() dateFilter: (date: D) => boolean;

  /**
   * Function that can be used to add custom CSS classes to date cells.
   *
   * 可用于把自定义 CSS 类添加到日期单元格的函数。
   *
   */
  @Input() dateClass: MatCalendarCellClassFunction<D>;

  /**
   * Emits when a new month is selected.
   *
   * 选定新月份后会发出通知。
   *
   */
  @Output() readonly selectedChange: EventEmitter<D> = new EventEmitter<D>();

  /**
   * Emits the selected month. This doesn't imply a change on the selected date
   *
   * 选定月份时会发出通知。这并不会更改选定日期
   *
   */
  @Output() readonly monthSelected: EventEmitter<D> = new EventEmitter<D>();

  /**
   * Emits when any date is activated.
   *
   * 激活任何日期时，都会发出通知。
   *
   */
  @Output() readonly activeDateChange: EventEmitter<D> = new EventEmitter<D>();

  /**
   * The body of calendar table
   *
   * 日历表的正文
   *
   */
  @ViewChild(MatCalendarBody) _matCalendarBody: MatCalendarBody;

  /**
   * Grid of calendar cells representing the months of the year.
   *
   * 日历单元格表示一年中的月份。
   *
   */
  _months: MatCalendarCell[][];

  /**
   * The label for this year (e.g. "2017").
   *
   * 今年的标签（例如“2017”）。
   *
   */
  _yearLabel: string;

  /**
   * The month in this year that today falls on. Null if today is in a different year.
   *
   * 今天在这一年中的月份。如果今天不在这一年，那就为空。
   *
   */
  _todayMonth: number | null;

  /**
   * The month in this year that the selected Date falls on.
   * Null if the selected Date is in a different year.
   *
   * 选定的日期在这一年中的月份。如果选定的日期在不同的年份，则为空。
   *
   */
  _selectedMonth: number | null;

  constructor(
    readonly _changeDetectorRef: ChangeDetectorRef,
    @Optional() @Inject(MAT_DATE_FORMATS) private _dateFormats: MatDateFormats,
    @Optional() public _dateAdapter: DateAdapter<D>,
    @Optional() private _dir?: Directionality,
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

  ngOnDestroy() {
    this._rerenderSubscription.unsubscribe();
  }

  /**
   * Handles when a new month is selected.
   *
   * 选定新的月份后处理。
   *
   */
  _monthSelected(event: MatCalendarUserEvent<number>) {
    const month = event.value;

    const selectedMonth = this._dateAdapter.createDate(
      this._dateAdapter.getYear(this.activeDate),
      month,
      1,
    );
    this.monthSelected.emit(selectedMonth);

    const selectedDate = this._getDateFromMonth(month);
    this.selectedChange.emit(selectedDate);
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

    this.activeDate = this._getDateFromMonth(month);

    if (this._dateAdapter.compareDate(oldActiveDate, this.activeDate)) {
      this.activeDateChange.emit(this.activeDate);
    }
  }

  /**
   * Handles keydown events on the calendar body when calendar is in year view.
   *
   * 当日历显示年份视图时，处理日历主体上的 keydown 事件。
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
        this.activeDate = this._dateAdapter.addCalendarMonths(this._activeDate, isRtl ? 1 : -1);
        break;
      case RIGHT_ARROW:
        this.activeDate = this._dateAdapter.addCalendarMonths(this._activeDate, isRtl ? -1 : 1);
        break;
      case UP_ARROW:
        this.activeDate = this._dateAdapter.addCalendarMonths(this._activeDate, -4);
        break;
      case DOWN_ARROW:
        this.activeDate = this._dateAdapter.addCalendarMonths(this._activeDate, 4);
        break;
      case HOME:
        this.activeDate = this._dateAdapter.addCalendarMonths(
          this._activeDate,
          -this._dateAdapter.getMonth(this._activeDate),
        );
        break;
      case END:
        this.activeDate = this._dateAdapter.addCalendarMonths(
          this._activeDate,
          11 - this._dateAdapter.getMonth(this._activeDate),
        );
        break;
      case PAGE_UP:
        this.activeDate = this._dateAdapter.addCalendarYears(
          this._activeDate,
          event.altKey ? -10 : -1,
        );
        break;
      case PAGE_DOWN:
        this.activeDate = this._dateAdapter.addCalendarYears(
          this._activeDate,
          event.altKey ? 10 : 1,
        );
        break;
      case ENTER:
      case SPACE:
        // Note that we only prevent the default action here while the selection happens in
        // `keyup` below. We can't do the selection here, because it can cause the calendar to
        // reopen if focus is restored immediately. We also can't call `preventDefault` on `keyup`
        // because it's too late (see #23305).
        this._selectionKeyPressed = true;
        break;
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
   * Handles keyup events on the calendar body when calendar is in year view.
   *
   * 当日历在年视图中时处理日历正文上的键盘事件。
   *
   */
  _handleCalendarBodyKeyup(event: KeyboardEvent): void {
    if (event.keyCode === SPACE || event.keyCode === ENTER) {
      if (this._selectionKeyPressed) {
        this._monthSelected({value: this._dateAdapter.getMonth(this._activeDate), event});
      }

      this._selectionKeyPressed = false;
    }
  }

  /**
   * Initializes this year view.
   *
   * 初始化今年的视图。
   *
   */
  _init() {
    this._setSelectedMonth(this.selected);
    this._todayMonth = this._getMonthInCurrentYear(this._dateAdapter.today());
    this._yearLabel = this._dateAdapter.getYearName(this.activeDate);

    let monthNames = this._dateAdapter.getMonthNames('short');
    // First row of months only contains 5 elements so we can fit the year label on the same row.
    this._months = [
      [0, 1, 2, 3],
      [4, 5, 6, 7],
      [8, 9, 10, 11],
    ].map(row => row.map(month => this._createCellForMonth(month, monthNames[month])));
    this._changeDetectorRef.markForCheck();
  }

  /**
   * Focuses the active cell after the microtask queue is empty.
   *
   * 在微任务队列为空之后，让这个活动单元格获得焦点。
   *
   */
  _focusActiveCell() {
    this._matCalendarBody._focusActiveCell();
  }

  /**
   * Schedules the matCalendarBody to focus the active cell after change detection has run
   *
   * 在变更检测运行后安排 matCalendarBody 聚焦于活动单元格
   *
   */
  _focusActiveCellAfterViewChecked() {
    this._matCalendarBody._scheduleFocusActiveCellAfterViewChecked();
  }

  /**
   * Gets the month in this year that the given Date falls on.
   * Returns null if the given Date is in another year.
   *
   * 获取指定日期在当前年的月份。如果指定的日期在另一年，则返回 null。
   *
   */
  private _getMonthInCurrentYear(date: D | null) {
    return date && this._dateAdapter.getYear(date) == this._dateAdapter.getYear(this.activeDate)
      ? this._dateAdapter.getMonth(date)
      : null;
  }

  /**
   * Takes a month and returns a new date in the same day and year as the currently active date.
   *  The returned date will have the same month as the argument date.
   *
   * 接受一个月份，并返回与当前活动日期在同一天和同一年的新日期。返回的日期的月份将与参数月份相同。
   *
   */
  private _getDateFromMonth(month: number) {
    const normalizedDate = this._dateAdapter.createDate(
      this._dateAdapter.getYear(this.activeDate),
      month,
      1,
    );

    const daysInMonth = this._dateAdapter.getNumDaysInMonth(normalizedDate);

    return this._dateAdapter.createDate(
      this._dateAdapter.getYear(this.activeDate),
      month,
      Math.min(this._dateAdapter.getDate(this.activeDate), daysInMonth),
    );
  }

  /**
   * Creates an MatCalendarCell for the given month.
   *
   * 为指定的月份创建一个 MatCalendarCell。
   *
   */
  private _createCellForMonth(month: number, monthName: string) {
    const date = this._dateAdapter.createDate(this._dateAdapter.getYear(this.activeDate), month, 1);
    const ariaLabel = this._dateAdapter.format(date, this._dateFormats.display.monthYearA11yLabel);
    const cellClasses = this.dateClass ? this.dateClass(date, 'year') : undefined;

    return new MatCalendarCell(
      month,
      monthName.toLocaleUpperCase(),
      ariaLabel,
      this._shouldEnableMonth(month),
      cellClasses,
    );
  }

  /**
   * Whether the given month is enabled.
   *
   * 指定的月份是否已启用。
   *
   */
  private _shouldEnableMonth(month: number) {
    const activeYear = this._dateAdapter.getYear(this.activeDate);

    if (
      month === undefined ||
      month === null ||
      this._isYearAndMonthAfterMaxDate(activeYear, month) ||
      this._isYearAndMonthBeforeMinDate(activeYear, month)
    ) {
      return false;
    }

    if (!this.dateFilter) {
      return true;
    }

    const firstOfMonth = this._dateAdapter.createDate(activeYear, month, 1);

    // If any date in the month is enabled count the month as enabled.
    for (
      let date = firstOfMonth;
      this._dateAdapter.getMonth(date) == month;
      date = this._dateAdapter.addCalendarDays(date, 1)
    ) {
      if (this.dateFilter(date)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Tests whether the combination month/year is after this.maxDate, considering
   * just the month and year of this.maxDate
   *
   * 测试这个月/年组合是否在 this.maxDate 之后，只考虑 this.maxDate 中的月份和年份
   *
   */
  private _isYearAndMonthAfterMaxDate(year: number, month: number) {
    if (this.maxDate) {
      const maxYear = this._dateAdapter.getYear(this.maxDate);
      const maxMonth = this._dateAdapter.getMonth(this.maxDate);

      return year > maxYear || (year === maxYear && month > maxMonth);
    }

    return false;
  }

  /**
   * Tests whether the combination month/year is before this.minDate, considering
   * just the month and year of this.minDate
   *
   * 测试这个月/年组合是否在 this.minDate 之前，只考虑 this.minDate 中的月份和年份
   *
   */
  private _isYearAndMonthBeforeMinDate(year: number, month: number) {
    if (this.minDate) {
      const minYear = this._dateAdapter.getYear(this.minDate);
      const minMonth = this._dateAdapter.getMonth(this.minDate);

      return year < minYear || (year === minYear && month < minMonth);
    }

    return false;
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
   * Sets the currently-selected month based on a model value.
   *
   * 根据模型的值设置当前选定的月份。
   *
   */
  private _setSelectedMonth(value: DateRange<D> | D | null) {
    if (value instanceof DateRange) {
      this._selectedMonth =
        this._getMonthInCurrentYear(value.start) || this._getMonthInCurrentYear(value.end);
    } else {
      this._selectedMonth = this._getMonthInCurrentYear(value);
    }
  }
}
