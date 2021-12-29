/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';

/**
 * Datepicker data that requires internationalization.
 *
 * 需要国际化的日期选择器数据。
 *
 */
@Injectable({providedIn: 'root'})
export class MatDatepickerIntl {
  /**
   * Stream that emits whenever the labels here are changed. Use this to notify
   * components if the labels have changed after initialization.
   *
   * 只要这里的标签发生了变化就会发出流。如果标签在初始化后发生了变化，用它来通知组件。
   *
   */
  readonly changes: Subject<void> = new Subject<void>();

  /**
   * A label for the calendar popup (used by screen readers).
   *
   * 日历弹出框的标签（由屏幕阅读器使用）。
   *
   */
  calendarLabel: string = 'Calendar';

  /**
   * A label for the button used to open the calendar popup (used by screen readers).
   *
   * 该按钮的标签，用于打开日历弹出框（由屏幕阅读器使用）。
   *
   */
  openCalendarLabel: string = 'Open calendar';

  /**
   * Label for the button used to close the calendar popup.
   *
   * 该按钮的标签用于关闭日历弹出窗口。
   *
   */
  closeCalendarLabel: string = 'Close calendar';

  /**
   * A label for the previous month button (used by screen readers).
   *
   * 上个月按钮的标签（由屏幕阅读器使用）。
   *
   */
  prevMonthLabel: string = 'Previous month';

  /**
   * A label for the next month button (used by screen readers).
   *
   * 下个月按钮的标签（由屏幕阅读器使用）。
   *
   */
  nextMonthLabel: string = 'Next month';

  /**
   * A label for the previous year button (used by screen readers).
   *
   * 上一年按钮的标签（由屏幕阅读器使用）。
   *
   */
  prevYearLabel: string = 'Previous year';

  /**
   * A label for the next year button (used by screen readers).
   *
   * 下一年按钮的标签（由屏幕阅读器使用）。
   *
   */
  nextYearLabel: string = 'Next year';

  /**
   * A label for the previous multi-year button (used by screen readers).
   *
   * 前一个多年按钮的标签（由屏幕阅读器使用）。
   *
   */
  prevMultiYearLabel: string = 'Previous 24 years';

  /**
   * A label for the next multi-year button (used by screen readers).
   *
   * 下一个多年按钮的标签（由屏幕阅读器使用）。
   *
   */
  nextMultiYearLabel: string = 'Next 24 years';

  /**
   * A label for the 'switch to month view' button (used by screen readers).
   *
   * “切换到月份视图”按钮的标签（由屏幕阅读器使用）。
   *
   */
  switchToMonthViewLabel: string = 'Choose date';

  /**
   * A label for the 'switch to year view' button (used by screen readers).
   *
   * “切换到年份视图”按钮的标签（由屏幕阅读器使用）。
   *
   */
  switchToMultiYearViewLabel: string = 'Choose month and year';

  /**
   * Formats a range of years.
   *
   * 格式化年份范围。
   *
   */
  formatYearRange(start: string, end: string): string {
    return `${start} \u2013 ${end}`;
  }
}
