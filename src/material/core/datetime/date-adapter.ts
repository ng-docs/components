/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {inject, InjectionToken, LOCALE_ID} from '@angular/core';
import {Observable, Subject} from 'rxjs';

/**
 * InjectionToken for datepicker that can be used to override default locale code.
 *
 * 日期选择器的 InjectionToken，可用于覆盖默认语言环境代码。
 *
 */
export const MAT_DATE_LOCALE = new InjectionToken<{}>('MAT_DATE_LOCALE', {
  providedIn: 'root',
  factory: MAT_DATE_LOCALE_FACTORY,
});

/** @docs-private */
export function MAT_DATE_LOCALE_FACTORY(): {} {
  return inject(LOCALE_ID);
}

/**
 * Adapts type `D` to be usable as a date by cdk-based components that work with dates.
 *
 * 将类型 `D` 适配成可与那些基于 cdk 的组件配合使用的日期对象。
 *
 */
export abstract class DateAdapter<D, L = any> {
  /**
   * The locale to use for all dates.
   *
   * 所有日期要使用的语言环境。
   *
   */
  protected locale: L;
  protected readonly _localeChanges = new Subject<void>();

  /**
   * A stream that emits when the locale changes.
   *
   * 语言环境更改时发出的流。
   *
   */
  readonly localeChanges: Observable<void> = this._localeChanges;

  /**
   * Gets the year component of the given date.
   *
   * 获取给定日期的年份部分。
   *
   * @param date The date to extract the year from.
   *
   * 要从中提取年份的日期。
   *
   * @returns
   *
   * The year component.
   *
   * 年份部分。
   *
   */
  abstract getYear(date: D): number;

  /**
   * Gets the month component of the given date.
   *
   * 获取给定日期的月份部分。
   *
   * @param date The date to extract the month from.
   *
   * 要从中提取月份的日期。
   *
   * @returns
   *
   * The month component (0-indexed, 0 = January).
   *
   * 月份组成部分（从 0 开始的索引，0 表示一月）。
   *
   */
  abstract getMonth(date: D): number;

  /**
   * Gets the date of the month component of the given date.
   *
   * 获取给定日期的月份部分。
   *
   * @param date The date to extract the date of the month from.
   *
   * 要从中提取月份日期的日期。
   *
   * @returns
   *
   * The month component (1-indexed, 1 = first of month).
   *
   * 月份的组成部分（从 1 开始的索引，1 表示月初）。
   *
   */
  abstract getDate(date: D): number;

  /**
   * Gets the day of the week component of the given date.
   *
   * 获取给定日期的星期几部分。
   *
   * @param date The date to extract the day of the week from.
   *
   * 要从中提取星期几的日期。
   *
   * @returns
   *
   * The month component (0-indexed, 0 = Sunday).
   *
   * 月份组成部分（从 0 开始的索引，0 表示星期日）。
   *
   */
  abstract getDayOfWeek(date: D): number;

  /**
   * Gets a list of names for the months.
   *
   * 获取月份的名称列表。
   *
   * @param style The naming style (e.g. long = 'January', short = 'Jan', narrow = 'J').
   *
   * 命名样式（例如 long = 'January', short = 'Jan', narrow = 'J'）。
   *
   * @returns
   *
   * An ordered list of all month names, starting with January.
   *
   * 从一月开始的所有月份名称的有序列表。
   *
   */
  abstract getMonthNames(style: 'long' | 'short' | 'narrow'): string[];

  /**
   * Gets a list of names for the dates of the month.
   *
   * 获取月份日期的名称列表。
   *
   * @returns
   *
   * An ordered list of all date of the month names, starting with '1'.
   *
   * 月份名称的所有日期的有序列表，从 “1” 开始。
   *
   */
  abstract getDateNames(): string[];

  /**
   * Gets a list of names for the days of the week.
   *
   * 获取星期几的名称列表。
   *
   * @param style The naming style (e.g. long = 'Sunday', short = 'Sun', narrow = 'S').
   *
   * 命名样式（例如，long = 'Sunday', short = 'Sun', narrow = 'S'）。
   *
   * @returns
   *
   * An ordered list of all weekday names, starting with Sunday.
   *
   * 从星期天开始的所有工作日名称的有序列表。
   *
   */
  abstract getDayOfWeekNames(style: 'long' | 'short' | 'narrow'): string[];

  /**
   * Gets the name for the year of the given date.
   *
   * 获取给定日期的年份的名称。
   *
   * @param date The date to get the year name for.
   *
   * 要获取年份名称的日期。
   *
   * @returns
   *
   * The name of the given year (e.g. '2017').
   *
   * 给定年份的名称（例如 “2017”）。
   *
   */
  abstract getYearName(date: D): string;

  /**
   * Gets the first day of the week.
   *
   * 获取一周的第一天。
   *
   * @returns
   *
   * The first day of the week (0-indexed, 0 = Sunday).
   *
   * 一周的第一天（从 0 开始的索引，0 表示星期日）。
   *
   */
  abstract getFirstDayOfWeek(): number;

  /**
   * Gets the number of days in the month of the given date.
   *
   * 获取给定日期的月份中的天数。
   *
   * @param date The date whose month should be checked.
   *
   * 要检查其月份的日期。
   *
   * @returns
   *
   * The number of days in the month of the given date.
   *
   * 给定日期的月份中的天数。
   *
   */
  abstract getNumDaysInMonth(date: D): number;

  /**
   * Clones the given date.
   *
   * 克隆给定日期。
   *
   * @param date The date to clone
   *
   * 要克隆的日期
   *
   * @returns
   *
   * A new date equal to the given date.
   *
   * 等于给定日期的新日期。
   *
   */
  abstract clone(date: D): D;

  /**
   * Creates a date with the given year, month, and date. Does not allow over/under-flow of the
   * month and date.
   *
   * 创建具有给定年份、月份和日期的日期对象。不允许月份和日期的上溢/下溢。
   *
   * @param year The full year of the date. (e.g. 89 means the year 89, not the year 1989).
   *
   * 日期中的完整年份。（例如 89 表示 89 年，而不是 1989 年）。
   *
   * @param month The month of the date (0-indexed, 0 = January). Must be an integer 0 - 11.
   *
   * 日期中的月份（0 索引，0 =一月）。必须为 0 到 11 的整数。
   *
   * @param date The date of month of the date. Must be an integer 1 - length of the given month.
   *
   * 日期中的月内日期。必须为整数 1 ~ 给定月份的天数。
   *
   * @returns
   *
   * The new date, or null if invalid.
   *
   * 新日期；如果无效，则为 null。
   *
   */
  abstract createDate(year: number, month: number, date: number): D;

  /**
   * Gets today's date.
   *
   * 获取今天的日期。
   *
   * @returns
   *
   * Today's date.
   *
   * 今天的日期。
   *
   */
  abstract today(): D;

  /**
   * Parses a date from a user-provided value.
   *
   * 根据用户提供的值解析日期。
   *
   * @param value The value to parse.
   *
   * 要解析的值。
   *
   * @param parseFormat The expected format of the value being parsed
   *     (type is implementation-dependent).
   *
   * 要解析值的预期格式（类型取决于实现）。
   *
   * @returns
   *
   * The parsed date.
   *
   * 解析后的日期。
   *
   */
  abstract parse(value: any, parseFormat: any): D | null;

  /**
   * Formats a date as a string according to the given format.
   *
   * 根据给定的格式将日期格式化为字符串。
   *
   * @param date The value to format.
   *
   * 要格式化的值。
   *
   * @param displayFormat The format to use to display the date as a string.
   *
   * 用于将日期显示为字符串的格式。
   *
   * @returns
   *
   * The formatted date string.
   *
   * 格式化后的日期字符串。
   *
   */
  abstract format(date: D, displayFormat: any): string;

  /**
   * Adds the given number of years to the date. Years are counted as if flipping 12 pages on the
   * calendar for each year and then finding the closest date in the new month. For example when
   * adding 1 year to Feb 29, 2016, the resulting date will be Feb 28, 2017.
   *
   * 将给定的年数添加到日期。年份的添加方式就像在日历上翻过 12 个月一样，然后查找新月份中与之最接近的日期。例如，当把 1 年添加到 2016 年 2 月 29 日时，其结果日期将是 2017 年 2 月 28 日。
   *
   * @param date The date to add years to.
   *
   * 要添加年份的日期。
   *
   * @param years The number of years to add (may be negative).
   *
   * 要增加的年数（可能为负）。
   *
   * @returns
   *
   * A new date equal to the given one with the specified number of years added.
   *
   * 一个等于给定日期加上指定年数的新日期。
   *
   */
  abstract addCalendarYears(date: D, years: number): D;

  /**
   * Adds the given number of months to the date. Months are counted as if flipping a page on the
   * calendar for each month and then finding the closest date in the new month. For example when
   * adding 1 month to Jan 31, 2017, the resulting date will be Feb 28, 2017.
   *
   * 将给定的月数添加到日期。月份的计算方式就像在日历上翻过一页一样，然后在新月份中找到最接近的日期。例如，当把 1 个月添加到 2017 年 1 月 31 日时，结果日期将是 2017 年 2 月 28 日。
   *
   * @param date The date to add months to.
   *
   * 要添加月份的日期。
   *
   * @param months The number of months to add (may be negative).
   *
   * 要添加的月数（可能为负）。
   *
   * @returns
   *
   * A new date equal to the given one with the specified number of months added.
   *
   * 一个等于给定的日期加上指定的月份数的新日期。
   *
   */
  abstract addCalendarMonths(date: D, months: number): D;

  /**
   * Adds the given number of days to the date. Days are counted as if moving one cell on the
   * calendar for each day.
   *
   * 将给定的天数添加到日期。天数的计算方式就像在日历上移动一个单元格一样。
   *
   * @param date The date to add days to.
   *
   * 要添加天数的日期。
   *
   * @param days The number of days to add (may be negative).
   *
   * 要添加的天数（可能为负）。
   *
   * @returns
   *
   * A new date equal to the given one with the specified number of days added.
   *
   * 一个等于给定的日期加上指定的天数的新日期。
   *
   */
  abstract addCalendarDays(date: D, days: number): D;

  /**
   * Gets the RFC 3339 compatible string (https://tools.ietf.org/html/rfc3339) for the given date.
   * This method is used to generate date strings that are compatible with native HTML attributes
   * such as the `min` or `max` attribute of an `<input>`.
   *
   * 获取给定日期的 RFC 3339 兼容字符串（ https://tools.ietf.org/html/rfc3339）此方法用于生成与原生> HTML 属性（例如 `<input` `min` 或 `max` 属性）兼容的日期字符串。
   *
   * @param date The date to get the ISO date string for.
   *
   * 要获取 ISO 日期字符串的日期。
   * @returns
   *
   * The ISO date string date string.
   *
   * ISO 日期字符串日期字符串。
   */
  abstract toIso8601(date: D): string;

  /**
   * Checks whether the given object is considered a date instance by this DateAdapter.
   *
   * 检查此 DateAdapter 是否将给定对象视为日期实例。
   *
   * @param obj The object to check
   *
   * 要检查的对象
   *
   * @returns
   *
   * Whether the object is a date instance.
   *
   * 该对象是否为日期实例。
   *
   */
  abstract isDateInstance(obj: any): boolean;

  /**
   * Checks whether the given date is valid.
   *
   * 检查给定日期是否有效。
   *
   * @param date The date to check.
   *
   * 要检查的日期。
   *
   * @returns
   *
   * Whether the date is valid.
   *
   * 此日期是否有效。
   *
   */
  abstract isValid(date: D): boolean;

  /**
   * Gets date instance that is not valid.
   *
   * 获取无效的日期实例。
   *
   * @returns
   *
   * An invalid date.
   *
   * 无效的日期。
   *
   */
  abstract invalid(): D;

  /**
   * Given a potential date object, returns that same date object if it is
   * a valid date, or `null` if it's not a valid date.
   *
   * 给定一个潜在的日期对象，如果该日期对象是有效日期，则返回该日期对象；如果它不是有效日期，则返回 `null`。
   *
   * @param obj The object to check.
   *
   * 要检查的对象。
   *
   * @returns
   *
   * A date or `null`.
   *
   * 日期或 `null`。
   *
   */
  getValidDateOrNull(obj: unknown): D | null {
    return this.isDateInstance(obj) && this.isValid(obj as D) ? (obj as D) : null;
  }

  /**
   * Attempts to deserialize a value to a valid date object. This is different from parsing in that
   * deserialize should only accept non-ambiguous, locale-independent formats (e.g. a ISO 8601
   * string). The default implementation does not allow any deserialization, it simply checks that
   * the given value is already a valid date object or null. The `<mat-datepicker>` will call this
   * method on all of its `@Input()` properties that accept dates. It is therefore possible to
   * support passing values from your backend directly to these properties by overriding this method
   * to also deserialize the format used by your backend.
   *
   * 尝试将某个值反序列化为有效的日期对象。这与解析的不同之处在于，反序列化应仅接受无歧义的、与语言环境无关的格式（例如，ISO 8601 字符串）。其默认实现不允许任何反序列化，它只是检查给定的值是否已经是有效的日期对象或 null。`<mat-datepicker>` 将在其所有接受日期的 `@Input()` 上调用此方法。因此，可以通过重写此方法来反序列化后端使用的格式，从而支持将各种值从后端直接传递给这些属性。
   *
   * @param value The value to be deserialized into a date object.
   *
   * 要反序列化为日期对象的值。
   *
   * @returns
   *
   * The deserialized date object, either a valid date, null if the value can be
   *     deserialized into a null date (e.g. the empty string), or an invalid date.
   *
   * 反序列化后的日期对象，可以是有效日期，如果可以将该值反序列化为空日期（例如，空字符串），则为 null 或无效日期。
   *
   */
  deserialize(value: any): D | null {
    if (value == null || (this.isDateInstance(value) && this.isValid(value))) {
      return value;
    }
    return this.invalid();
  }

  /**
   * Sets the locale used for all dates.
   *
   * 设置所有日期使用的语言环境。
   *
   * @param locale The new locale.
   *
   * 新的语言环境。
   *
   */
  setLocale(locale: L) {
    this.locale = locale;
    this._localeChanges.next();
  }

  /**
   * Compares two dates.
   *
   * 比较两个日期。
   *
   * @param first The first date to compare.
   *
   * 要比较的第一个日期。
   *
   * @param second The second date to compare.
   *
   * 要比较的第二个日期。
   *
   * @returns
   *
   * 0 if the dates are equal, a number less than 0 if the first date is earlier,
   *     a number greater than 0 if the first date is later.
   *
   * 如果日期相等，则为 0；如果第一个日期较早，则小于 0；如果第一个日期较晚，则大于 0。
   *
   */
  compareDate(first: D, second: D): number {
    return (
      this.getYear(first) - this.getYear(second) ||
      this.getMonth(first) - this.getMonth(second) ||
      this.getDate(first) - this.getDate(second)
    );
  }

  /**
   * Checks if two dates are equal.
   *
   * 检查两个日期是否相等。
   *
   * @param first The first date to check.
   *
   * 要检查的第一个日期。
   *
   * @param second The second date to check.
   *
   * 要检查的第二个日期。
   *
   * @returns
   *
   * Whether the two dates are equal.
   *     Null dates are considered equal to other null dates.
   *
   * 两个日期是否相等。空日期视为等于其他空日期。
   *
   */
  sameDate(first: D | null, second: D | null): boolean {
    if (first && second) {
      let firstValid = this.isValid(first);
      let secondValid = this.isValid(second);
      if (firstValid && secondValid) {
        return !this.compareDate(first, second);
      }
      return firstValid == secondValid;
    }
    return first == second;
  }

  /**
   * Clamp the given date between min and max dates.
   *
   * 将给定日期限制在最小日期和最大日期之间。
   *
   * @param date The date to clamp.
   *
   * 要限制的日期。
   *
   * @param min The minimum value to allow. If null or omitted no min is enforced.
   *
   * 允许的最小值。如果为 null 或省略，则不强制执行 min。
   *
   * @param max The maximum value to allow. If null or omitted no max is enforced.
   *
   * 允许的最大值。如果为 null 或省略，则不强制使用 max。
   *
   * @returns
   *
   * `min` if `date` is less than `min`, `max` if date is greater than `max`,
   *     otherwise `date`.
   *
   * 如果 `date` 小于 `min` 则为 `min`，如果日期大于 `max` 则为 `max`，否则为 `date`。
   *
   */
  clampDate(date: D, min?: D | null, max?: D | null): D {
    if (min && this.compareDate(date, min) < 0) {
      return min;
    }
    if (max && this.compareDate(date, max) > 0) {
      return max;
    }
    return date;
  }
}
