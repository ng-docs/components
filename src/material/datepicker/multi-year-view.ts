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
  Input,
  Optional,
  Output,
  ViewChild,
  ViewEncapsulation,
  OnDestroy,
} from '@angular/core';
import {DateAdapter} from '@angular/material/core';
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

export const yearsPerPage = 24;

export const yearsPerRow = 4;

/**
 * An internal component used to display a year selector in the datepicker.
 *
 * 一个内部组件，用于在日期选择器中显示年份选择器。
 *
 * @docs-private
 */
@Component({
  selector: 'mat-multi-year-view',
  templateUrl: 'multi-year-view.html',
  exportAs: 'matMultiYearView',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatMultiYearView<D> implements AfterContentInit, OnDestroy {
  private _rerenderSubscription = Subscription.EMPTY;

  /**
   * Flag used to filter out space/enter keyup events that originated outside of the view.
   *
   * 用于过滤掉源自视图之外的空格/输入键事件的标志。
   *
   */
  private _selectionKeyPressed: boolean;

  /**
   * The date to display in this multi-year view (everything other than the year is ignored).
   *
   * 在这个多年视图中显示的日期（忽略该年份以外的所有日期）。
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

    if (
      !isSameMultiYearView(
        this._dateAdapter,
        oldActiveDate,
        this._activeDate,
        this.minDate,
        this.maxDate,
      )
    ) {
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

    this._setSelectedYear(value);
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
   * 用来过滤哪些日期可选择的函数。
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
   * Emits when a new year is selected.
   *
   * 选择新年之后就会发出通知。
   *
   */
  @Output() readonly selectedChange: EventEmitter<D> = new EventEmitter<D>();

  /**
   * Emits the selected year. This doesn't imply a change on the selected date
   *
   * 发出选定的年份。这并不会更改选定日期
   *
   */
  @Output() readonly yearSelected: EventEmitter<D> = new EventEmitter<D>();

  /**
   * Emits when any date is activated.
   *
   * 激活任意日期，都会发出通知。
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
   * Grid of calendar cells representing the currently displayed years.
   *
   * 表示当前显示年份的日历单元格。
   *
   */
  _years: MatCalendarCell[][];

  /**
   * The year that today falls on.
   *
   * 这一年是否今年。
   *
   */
  _todayYear: number;

  /**
   * The year of the selected date. Null if the selected date is null.
   *
   * 选定日期的年份。如果选定日期为 null，则为空。
   *
   */
  _selectedYear: number | null;

  constructor(
    private _changeDetectorRef: ChangeDetectorRef,
    @Optional() public _dateAdapter: DateAdapter<D>,
    @Optional() private _dir?: Directionality,
  ) {
    if (!this._dateAdapter && (typeof ngDevMode === 'undefined' || ngDevMode)) {
      throw createMissingDateImplError('DateAdapter');
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
   * Initializes this multi-year view.
   *
   * 初始化这个多年视图。
   *
   */
  _init() {
    this._todayYear = this._dateAdapter.getYear(this._dateAdapter.today());

    // We want a range years such that we maximize the number of
    // enabled dates visible at once. This prevents issues where the minimum year
    // is the last item of a page OR the maximum year is the first item of a page.

    // The offset from the active year to the "slot" for the starting year is the
    // *actual* first rendered year in the multi-year view.
    const activeYear = this._dateAdapter.getYear(this._activeDate);
    const minYearOfPage =
      activeYear - getActiveOffset(this._dateAdapter, this.activeDate, this.minDate, this.maxDate);

    this._years = [];
    for (let i = 0, row: number[] = []; i < yearsPerPage; i++) {
      row.push(minYearOfPage + i);
      if (row.length == yearsPerRow) {
        this._years.push(row.map(year => this._createCellForYear(year)));
        row = [];
      }
    }
    this._changeDetectorRef.markForCheck();
  }

  /**
   * Handles when a new year is selected.
   *
   * 选择新年之后的处理方法。
   *
   */
  _yearSelected(event: MatCalendarUserEvent<number>) {
    const year = event.value;
    const selectedYear = this._dateAdapter.createDate(year, 0, 1);
    const selectedDate = this._getDateFromYear(year);

    this.yearSelected.emit(selectedYear);
    this.selectedChange.emit(selectedDate);
  }

  /**
   * Takes the index of a calendar body cell wrapped in in an event as argument. For the date that
   * corresponds to the given cell, set `activeDate` to that date and fire `activeDateChange` with
   * that date.
   *
   * 将包含在事件中的日历正文单元格的索引作为参数。对于与给定单元格对应的日期，将 `activeDate` 设置为该日期并使用该日期触发 `activeDateChange` 事件。
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
    const year = event.value;
    const oldActiveDate = this._activeDate;

    this.activeDate = this._getDateFromYear(year);
    if (this._dateAdapter.compareDate(oldActiveDate, this.activeDate)) {
      this.activeDateChange.emit(this.activeDate);
    }
  }

  /**
   * Handles keydown events on the calendar body when calendar is in multi-year view.
   *
   * 当日历处于多年视图时，会在日历主体上处理 keydown 事件。
   *
   */
  _handleCalendarBodyKeydown(event: KeyboardEvent): void {
    const oldActiveDate = this._activeDate;
    const isRtl = this._isRtl();

    switch (event.keyCode) {
      case LEFT_ARROW:
        this.activeDate = this._dateAdapter.addCalendarYears(this._activeDate, isRtl ? 1 : -1);
        break;
      case RIGHT_ARROW:
        this.activeDate = this._dateAdapter.addCalendarYears(this._activeDate, isRtl ? -1 : 1);
        break;
      case UP_ARROW:
        this.activeDate = this._dateAdapter.addCalendarYears(this._activeDate, -yearsPerRow);
        break;
      case DOWN_ARROW:
        this.activeDate = this._dateAdapter.addCalendarYears(this._activeDate, yearsPerRow);
        break;
      case HOME:
        this.activeDate = this._dateAdapter.addCalendarYears(
          this._activeDate,
          -getActiveOffset(this._dateAdapter, this.activeDate, this.minDate, this.maxDate),
        );
        break;
      case END:
        this.activeDate = this._dateAdapter.addCalendarYears(
          this._activeDate,
          yearsPerPage -
            getActiveOffset(this._dateAdapter, this.activeDate, this.minDate, this.maxDate) -
            1,
        );
        break;
      case PAGE_UP:
        this.activeDate = this._dateAdapter.addCalendarYears(
          this._activeDate,
          event.altKey ? -yearsPerPage * 10 : -yearsPerPage,
        );
        break;
      case PAGE_DOWN:
        this.activeDate = this._dateAdapter.addCalendarYears(
          this._activeDate,
          event.altKey ? yearsPerPage * 10 : yearsPerPage,
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
    }

    this._focusActiveCellAfterViewChecked();
    // Prevent unexpected default actions such as form submission.
    event.preventDefault();
  }

  /**
   * Handles keyup events on the calendar body when calendar is in multi-year view.
   *
   * 当日历处于多年视图时，处理日历正文上的键盘事件。
   *
   */
  _handleCalendarBodyKeyup(event: KeyboardEvent): void {
    if (event.keyCode === SPACE || event.keyCode === ENTER) {
      if (this._selectionKeyPressed) {
        this._yearSelected({value: this._dateAdapter.getYear(this._activeDate), event});
      }

      this._selectionKeyPressed = false;
    }
  }

  _getActiveCell(): number {
    return getActiveOffset(this._dateAdapter, this.activeDate, this.minDate, this.maxDate);
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
   * Focuses the active cell after change detection has run and the microtask queue is empty.
   *
   * 在变更检测已运行且微任务队列为空后聚焦活动单元格。
   *
   */
  _focusActiveCellAfterViewChecked() {
    this._matCalendarBody._scheduleFocusActiveCellAfterViewChecked();
  }

  /**
   * Takes a year and returns a new date on the same day and month as the currently active date
   *  The returned date will have the same year as the argument date.
   *
   * 接受一个年份，并返回那一年与当前活动日期相同的日期和月份的新日期 返回的日期将与参数年份相同。
   *
   */
  private _getDateFromYear(year: number) {
    const activeMonth = this._dateAdapter.getMonth(this.activeDate);
    const daysInMonth = this._dateAdapter.getNumDaysInMonth(
      this._dateAdapter.createDate(year, activeMonth, 1),
    );
    const normalizedDate = this._dateAdapter.createDate(
      year,
      activeMonth,
      Math.min(this._dateAdapter.getDate(this.activeDate), daysInMonth),
    );
    return normalizedDate;
  }

  /**
   * Creates an MatCalendarCell for the given year.
   *
   * 为指定的年份创建一个 MatCalendarCell。
   *
   */
  private _createCellForYear(year: number) {
    const date = this._dateAdapter.createDate(year, 0, 1);
    const yearName = this._dateAdapter.getYearName(date);
    const cellClasses = this.dateClass ? this.dateClass(date, 'multi-year') : undefined;

    return new MatCalendarCell(year, yearName, yearName, this._shouldEnableYear(year), cellClasses);
  }

  /**
   * Whether the given year is enabled.
   *
   * 指定年份是否已启用。
   *
   */
  private _shouldEnableYear(year: number) {
    // disable if the year is greater than maxDate lower than minDate
    if (
      year === undefined ||
      year === null ||
      (this.maxDate && year > this._dateAdapter.getYear(this.maxDate)) ||
      (this.minDate && year < this._dateAdapter.getYear(this.minDate))
    ) {
      return false;
    }

    // enable if it reaches here and there's no filter defined
    if (!this.dateFilter) {
      return true;
    }

    const firstOfYear = this._dateAdapter.createDate(year, 0, 1);

    // If any date in the year is enabled count the year as enabled.
    for (
      let date = firstOfYear;
      this._dateAdapter.getYear(date) == year;
      date = this._dateAdapter.addCalendarDays(date, 1)
    ) {
      if (this.dateFilter(date)) {
        return true;
      }
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
   * Sets the currently-highlighted year based on a model value.
   *
   * 根据模型的值设置当前突出显示的年份。
   *
   */
  private _setSelectedYear(value: DateRange<D> | D | null) {
    this._selectedYear = null;

    if (value instanceof DateRange) {
      const displayValue = value.start || value.end;

      if (displayValue) {
        this._selectedYear = this._dateAdapter.getYear(displayValue);
      }
    } else if (value) {
      this._selectedYear = this._dateAdapter.getYear(value);
    }
  }
}

export function isSameMultiYearView<D>(
  dateAdapter: DateAdapter<D>,
  date1: D,
  date2: D,
  minDate: D | null,
  maxDate: D | null,
): boolean {
  const year1 = dateAdapter.getYear(date1);
  const year2 = dateAdapter.getYear(date2);
  const startingYear = getStartingYear(dateAdapter, minDate, maxDate);
  return (
    Math.floor((year1 - startingYear) / yearsPerPage) ===
    Math.floor((year2 - startingYear) / yearsPerPage)
  );
}

/**
 * When the multi-year view is first opened, the active year will be in view.
 * So we compute how many years are between the active year and the *slot* where our
 * "startingYear" will render when paged into view.
 *
 * 第一次打开多年视图时，活动年份就会出现在视图中。因此，我们要计算当前年份和要渲染的 “startingYear” 之间有多少年，以便对视图进行分页。
 *
 */
export function getActiveOffset<D>(
  dateAdapter: DateAdapter<D>,
  activeDate: D,
  minDate: D | null,
  maxDate: D | null,
): number {
  const activeYear = dateAdapter.getYear(activeDate);
  return euclideanModulo(activeYear - getStartingYear(dateAdapter, minDate, maxDate), yearsPerPage);
}

/**
 * We pick a "starting" year such that either the maximum year would be at the end
 * or the minimum year would be at the beginning of a page.
 *
 * 我们挑选一个“起始”年份，以便最大年份位于页尾，而最小年份位于页头。
 *
 */
function getStartingYear<D>(
  dateAdapter: DateAdapter<D>,
  minDate: D | null,
  maxDate: D | null,
): number {
  let startingYear = 0;
  if (maxDate) {
    const maxYear = dateAdapter.getYear(maxDate);
    startingYear = maxYear - yearsPerPage + 1;
  } else if (minDate) {
    startingYear = dateAdapter.getYear(minDate);
  }
  return startingYear;
}

/**
 * Gets remainder that is non-negative, even if first number is negative
 *
 * 取得非负的余数，即便第一个数是负数
 *
 */
function euclideanModulo(a: number, b: number): number {
  return ((a % b) + b) % b;
}
