/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Platform} from '@angular/cdk/platform';
import {Inject, Injectable, Optional} from '@angular/core';
import {DateAdapter, MAT_DATE_LOCALE} from './date-adapter';

/**
 * Matches strings that have the form of a valid RFC 3339 string
 * (<https://tools.ietf.org/html/rfc3339>). Note that the string may not actually be a valid date
 * because the regex will match strings an with out of bounds month, date, etc.
 *
 * 匹配具有有效 RFC 3339 字符串（ <https://tools.ietf.org/html/rfc3339> ）形式的字符串。请注意，该字符串实际上可能不是有效的日期，因为正则表达式将匹配具有超出范围的月份、日期等的字符串。
 *
 */
const ISO_8601_REGEX =
  /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|(?:(?:\+|-)\d{2}:\d{2}))?)?$/;

/**
 * Creates an array and fills it with values.
 *
 * 创建一个数组，并用值填充它。
 *
 */
function range<T>(length: number, valueFunction: (index: number) => T): T[] {
  const valuesArray = Array(length);
  for (let i = 0; i < length; i++) {
    valuesArray[i] = valueFunction(i);
  }
  return valuesArray;
}

/**
 * Adapts the native JS Date for use with cdk-based components that work with dates.
 *
 * 调整原生 JS 日期，以与可用于日期的基于 cdk 的组件一起使用。
 *
 */
@Injectable()
export class NativeDateAdapter extends DateAdapter<Date> {
  /**
   * @deprecated No longer being used. To be removed.
   *
   * 不再使用。即将被删除。
   *
   * @breaking-change 14.0.0
   */
  useUtcForDisplay: boolean = false;

  constructor(
    @Optional() @Inject(MAT_DATE_LOCALE) matDateLocale: string,
    /**
     * @deprecated No longer being used. To be removed.
     * @breaking-change 14.0.0
     */
    _platform?: Platform,
  ) {
    super();
    super.setLocale(matDateLocale);
  }

  getYear(date: Date): number {
    return date.getFullYear();
  }

  getMonth(date: Date): number {
    return date.getMonth();
  }

  getDate(date: Date): number {
    return date.getDate();
  }

  getDayOfWeek(date: Date): number {
    return date.getDay();
  }

  getMonthNames(style: 'long' | 'short' | 'narrow'): string[] {
    const dtf = new Intl.DateTimeFormat(this.locale, {month: style, timeZone: 'utc'});
    return range(12, i => this._format(dtf, new Date(2017, i, 1)));
  }

  getDateNames(): string[] {
    const dtf = new Intl.DateTimeFormat(this.locale, {day: 'numeric', timeZone: 'utc'});
    return range(31, i => this._format(dtf, new Date(2017, 0, i + 1)));
  }

  getDayOfWeekNames(style: 'long' | 'short' | 'narrow'): string[] {
    const dtf = new Intl.DateTimeFormat(this.locale, {weekday: style, timeZone: 'utc'});
    return range(7, i => this._format(dtf, new Date(2017, 0, i + 1)));
  }

  getYearName(date: Date): string {
    const dtf = new Intl.DateTimeFormat(this.locale, {year: 'numeric', timeZone: 'utc'});
    return this._format(dtf, date);
  }

  getFirstDayOfWeek(): number {
    // We can't tell using native JS Date what the first day of the week is, we default to Sunday.
    return 0;
  }

  getNumDaysInMonth(date: Date): number {
    return this.getDate(
      this._createDateWithOverflow(this.getYear(date), this.getMonth(date) + 1, 0),
    );
  }

  clone(date: Date): Date {
    return new Date(date.getTime());
  }

  createDate(year: number, month: number, date: number): Date {
    if (typeof ngDevMode === 'undefined' || ngDevMode) {
      // Check for invalid month and date (except upper bound on date which we have to check after
      // creating the Date).
      if (month < 0 || month > 11) {
        throw Error(`Invalid month index "${month}". Month index has to be between 0 and 11.`);
      }

      if (date < 1) {
        throw Error(`Invalid date "${date}". Date has to be greater than 0.`);
      }
    }

    let result = this._createDateWithOverflow(year, month, date);
    // Check that the date wasn't above the upper bound for the month, causing the month to overflow
    if (result.getMonth() != month && (typeof ngDevMode === 'undefined' || ngDevMode)) {
      throw Error(`Invalid date "${date}" for month with index "${month}".`);
    }

    return result;
  }

  today(): Date {
    return new Date();
  }

  parse(value: any, parseFormat?: any): Date | null {
    // We have no way using the native JS Date to set the parse format or locale, so we ignore these
    // parameters.
    if (typeof value == 'number') {
      return new Date(value);
    }
    return value ? new Date(Date.parse(value)) : null;
  }

  format(date: Date, displayFormat: Object): string {
    if (!this.isValid(date)) {
      throw Error('NativeDateAdapter: Cannot format invalid date.');
    }

    const dtf = new Intl.DateTimeFormat(this.locale, {...displayFormat, timeZone: 'utc'});
    return this._format(dtf, date);
  }

  addCalendarYears(date: Date, years: number): Date {
    return this.addCalendarMonths(date, years * 12);
  }

  addCalendarMonths(date: Date, months: number): Date {
    let newDate = this._createDateWithOverflow(
      this.getYear(date),
      this.getMonth(date) + months,
      this.getDate(date),
    );

    // It's possible to wind up in the wrong month if the original month has more days than the new
    // month. In this case we want to go to the last day of the desired month.
    // Note: the additional + 12 % 12 ensures we end up with a positive number, since JS % doesn't
    // guarantee this.
    if (this.getMonth(newDate) != (((this.getMonth(date) + months) % 12) + 12) % 12) {
      newDate = this._createDateWithOverflow(this.getYear(newDate), this.getMonth(newDate), 0);
    }

    return newDate;
  }

  addCalendarDays(date: Date, days: number): Date {
    return this._createDateWithOverflow(
      this.getYear(date),
      this.getMonth(date),
      this.getDate(date) + days,
    );
  }

  toIso8601(date: Date): string {
    return [
      date.getUTCFullYear(),
      this._2digit(date.getUTCMonth() + 1),
      this._2digit(date.getUTCDate()),
    ].join('-');
  }

  /**
   * Returns the given value if given a valid Date or null. Deserializes valid ISO 8601 strings
   * (<https://www.ietf.org/rfc/rfc3339.txt>) into valid Dates and empty string into null. Returns an
   * invalid date for all other values.
   *
   * 如果给定有效的 Date 或 null，则返回给定的值。将有效的 ISO 8601 字符串（ <https://www.ietf.org/rfc/rfc3339.txt> ）反序列化为有效的日期，并将空字符串转换为 null。返回所有其他值的无效日期。
   *
   */
  override deserialize(value: any): Date | null {
    if (typeof value === 'string') {
      if (!value) {
        return null;
      }
      // The `Date` constructor accepts formats other than ISO 8601, so we need to make sure the
      // string is the right format first.
      if (ISO_8601_REGEX.test(value)) {
        let date = new Date(value);
        if (this.isValid(date)) {
          return date;
        }
      }
    }
    return super.deserialize(value);
  }

  isDateInstance(obj: any) {
    return obj instanceof Date;
  }

  isValid(date: Date) {
    return !isNaN(date.getTime());
  }

  invalid(): Date {
    return new Date(NaN);
  }

  /**
   * Creates a date but allows the month and date to overflow.
   *
   * 创建日期，但允许月份和日期溢出。
   *
   */
  private _createDateWithOverflow(year: number, month: number, date: number) {
    // Passing the year to the constructor causes year numbers <100 to be converted to 19xx.
    // To work around this we use `setFullYear` and `setHours` instead.
    const d = new Date();
    d.setFullYear(year, month, date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Pads a number to make it two digits.
   *
   * 填充数字以使其为两位数。
   *
   * @param n The number to pad.
   *
   * 要填充的数字。
   *
   * @returns The padded number.
   *
   * 填充后的数字。
   *
   */
  private _2digit(n: number) {
    return ('00' + n).slice(-2);
  }

  /**
   * When converting Date object to string, javascript built-in functions may return wrong
   * results because it applies its internal DST rules. The DST rules around the world change
   * very frequently, and the current valid rule is not always valid in previous years though.
   * We work around this problem building a new Date object which has its internal UTC
   * representation with the local date and time.
   *
   * 将 Date 对象转换为字符串时，javascript 内置函数可能会返回错误结果，因为它应用了其内部 DST 规则。世界各地的 DST 规则变化非常频繁，尽管当前有效的规则在前几年并不总是有效的。为了解决这个问题，我们构建了一个新的 Date 对象，该对象具有内部 UTC 表示以及本地日期和时间。
   *
   * @param dtf Intl.DateTimeFormat object, containing the desired string format. It must have
   *    timeZone set to 'utc' to work fine.
   *
   * Intl.DateTimeFormat 对象，包含所需的字符串格式。必须将 timeZone 设置为 'utc' 才能正常工作。
   *
   * @param date Date from which we want to get the string representation according to dtf
   *
   * 我们要根据 dtf 获取字符串表示形式的日期
   *
   * @returns A Date object with its UTC representation based on the passed in date info
   *
   * 基于传入的日期信息及其 UTC 表示形式的 Date 对象
   *
   */
  private _format(dtf: Intl.DateTimeFormat, date: Date) {
    // Passing the year to the constructor causes year numbers <100 to be converted to 19xx.
    // To work around this we use `setUTCFullYear` and `setUTCHours` instead.
    const d = new Date();
    d.setUTCFullYear(date.getFullYear(), date.getMonth(), date.getDate());
    d.setUTCHours(date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());
    return dtf.format(d);
  }
}
