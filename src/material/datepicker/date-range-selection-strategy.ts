/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Injectable, InjectionToken, Optional, SkipSelf, FactoryProvider} from '@angular/core';
import {DateAdapter} from '@angular/material/core';
import {DateRange} from './date-selection-model';

/**
 * Injection token used to customize the date range selection behavior.
 *
 * 用于自定义选择日期范围的行为的注入令牌。
 *
 */
export const MAT_DATE_RANGE_SELECTION_STRATEGY = new InjectionToken<
  MatDateRangeSelectionStrategy<any>
>('MAT_DATE_RANGE_SELECTION_STRATEGY');

/**
 * Object that can be provided in order to customize the date range selection behavior.
 *
 * 可以提供的对象是为了自定义日期范围的选择行为。
 *
 */
export interface MatDateRangeSelectionStrategy<D> {
  /**
   * Called when the user has finished selecting a value.
   *
   * 当用户选择完一个值时调用。
   *
   * @param date Date that was selected. Will be null if the user cleared the selection.
   *
   * 被选定的日期。如果用户清除了该选项，则该值为 null。
   *
   * @param currentRange Range that is currently show in the calendar.
   *
   * 当前显示在日历表中的范围。
   *
   * @param event DOM event that triggered the selection. Currently only corresponds to a `click`
   *    event, but it may get expanded in the future.
   *
   * 触发了此次选择的 DOM 事件。目前，它只对应一个 `click` 事件，但以后可能会进一步扩展。
   *
   */
  selectionFinished(date: D | null, currentRange: DateRange<D>, event: Event): DateRange<D>;

  /**
   * Called when the user has activated a new date \(e.g. by hovering over
   * it or moving focus\) and the calendar tries to display a date range.
   *
   * 当用户激活一个新日期时（例如，通过将鼠标悬停在此区域或移动焦点上）以及当日历尝试显示一个日期范围时，就会调用它。
   *
   * @param activeDate Date that the user has activated. Will be null if the user moved
   *    focus to an element that's no a calendar cell.
   *
   * 用户已激活的日期。如果用户把焦点移到了一个不是日历单元格的元素上，它就是 null。
   * @param currentRange Range that is currently shown in the calendar.
   *
   * 当前在日历里显示的范围。
   * @param event DOM event that caused the preview to be changed. Will be either a
   *    `mouseenter`/`mouseleave` or `focus`/`blur` depending on how the user is navigating.
   *
   * 导致预览发生变化的 DOM 事件。可能是 `mouseenter`/`mouseleave` 或 `focus`/`blur`，具体取决于用户的导航方式。
   */
  createPreview(activeDate: D | null, currentRange: DateRange<D>, event: Event): DateRange<D>;

  /**
   * Called when the user has dragged a date in the currently selected range to another
   * date. Returns the date updated range that should result from this interaction.
   *
   * 当用户将当前选定范围内的日期拖到另一个日期时调用。返回应由此交互产生的日期更新范围。
   *
   * @param dateOrigin The date the user started dragging from.
   *
   * 用户开始拖动的日期。
   *
   * @param originalRange The originally selected date range.
   *
   * 最初选择的日期范围。
   *
   * @param newDate The currently targeted date in the drag operation.
   *
   * 拖动操作中的当前目标日期。
   *
   * @param event DOM event that triggered the updated drag state. Will be
   *     `mouseenter`/`mouseup` or `touchmove`/`touchend` depending on the device type.
   *
   * 触发更新拖动状态的 DOM 事件。将是 `mouseenter` / `mouseup` 或 `touchmove` / `touchend` 之一，具体取决于设备类型。
   *
   */
  createDrag?(
    dragOrigin: D,
    originalRange: DateRange<D>,
    newDate: D,
    event: Event,
  ): DateRange<D> | null;
}

/**
 * Provides the default date range selection behavior.
 *
 * 提供默认的日期范围选择行为。
 *
 */
@Injectable()
export class DefaultMatCalendarRangeStrategy<D> implements MatDateRangeSelectionStrategy<D> {
  constructor(private _dateAdapter: DateAdapter<D>) {}

  selectionFinished(date: D, currentRange: DateRange<D>) {
    let {start, end} = currentRange;

    if (start == null) {
      start = date;
    } else if (end == null && date && this._dateAdapter.compareDate(date, start) >= 0) {
      end = date;
    } else {
      start = date;
      end = null;
    }

    return new DateRange<D>(start, end);
  }

  createPreview(activeDate: D | null, currentRange: DateRange<D>) {
    let start: D | null = null;
    let end: D | null = null;

    if (currentRange.start && !currentRange.end && activeDate) {
      start = currentRange.start;
      end = activeDate;
    }

    return new DateRange<D>(start, end);
  }

  createDrag(dragOrigin: D, originalRange: DateRange<D>, newDate: D) {
    let start = originalRange.start;
    let end = originalRange.end;

    if (!start || !end) {
      // Can't drag from an incomplete range.
      return null;
    }

    const adapter = this._dateAdapter;

    const isRange = adapter.compareDate(start, end) !== 0;
    const diffYears = adapter.getYear(newDate) - adapter.getYear(dragOrigin);
    const diffMonths = adapter.getMonth(newDate) - adapter.getMonth(dragOrigin);
    const diffDays = adapter.getDate(newDate) - adapter.getDate(dragOrigin);

    if (isRange && adapter.sameDate(dragOrigin, originalRange.start)) {
      start = newDate;
      if (adapter.compareDate(newDate, end) > 0) {
        end = adapter.addCalendarYears(end, diffYears);
        end = adapter.addCalendarMonths(end, diffMonths);
        end = adapter.addCalendarDays(end, diffDays);
      }
    } else if (isRange && adapter.sameDate(dragOrigin, originalRange.end)) {
      end = newDate;
      if (adapter.compareDate(newDate, start) < 0) {
        start = adapter.addCalendarYears(start, diffYears);
        start = adapter.addCalendarMonths(start, diffMonths);
        start = adapter.addCalendarDays(start, diffDays);
      }
    } else {
      start = adapter.addCalendarYears(start, diffYears);
      start = adapter.addCalendarMonths(start, diffMonths);
      start = adapter.addCalendarDays(start, diffDays);
      end = adapter.addCalendarYears(end, diffYears);
      end = adapter.addCalendarMonths(end, diffMonths);
      end = adapter.addCalendarDays(end, diffDays);
    }

    return new DateRange<D>(start, end);
  }
}

/** @docs-private */
export function MAT_CALENDAR_RANGE_STRATEGY_PROVIDER_FACTORY(
  parent: MatDateRangeSelectionStrategy<unknown>,
  adapter: DateAdapter<unknown>,
) {
  return parent || new DefaultMatCalendarRangeStrategy(adapter);
}

/** @docs-private */
export const MAT_CALENDAR_RANGE_STRATEGY_PROVIDER: FactoryProvider = {
  provide: MAT_DATE_RANGE_SELECTION_STRATEGY,
  deps: [[new Optional(), new SkipSelf(), MAT_DATE_RANGE_SELECTION_STRATEGY], DateAdapter],
  useFactory: MAT_CALENDAR_RANGE_STRATEGY_PROVIDER_FACTORY,
};
