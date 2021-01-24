/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {FactoryProvider, Injectable, Optional, SkipSelf, OnDestroy, Directive} from '@angular/core';
import {DateAdapter} from '@angular/material/core';
import {Observable, Subject} from 'rxjs';

/**
 * A class representing a range of dates.
 *
 * 表示日期范围的类。
 *
 */
export class DateRange<D> {
  /**
   * Ensures that objects with a `start` and `end` property can't be assigned to a variable that
   * expects a `DateRange`
   *
   * 确保带有 `start` 属性和 `end` 属性的对象无法赋值给 `DateRange` 型变量。
   *
   */
  // tslint:disable-next-line:no-unused-variable
  private _disableStructuralEquivalency: never;

  constructor(
    /** The start date of the range. */
    readonly start: D | null,
    /** The end date of the range. */
    readonly end: D | null) {}
}

/**
 * Conditionally picks the date type, if a DateRange is passed in.
 *
 * 如果传入了 DateRange，它会有条件地选择日期类型。
 *
 * @docs-private
 */
export type ExtractDateTypeFromSelection<T> = T extends DateRange<infer D> ? D : NonNullable<T>;

/**
 * Event emitted by the date selection model when its selection changes.
 *
 * 日期选择模型在选择模型改变时发出的事件。
 *
 */
export interface DateSelectionModelChange<S> {
  /**
   * New value for the selection.
   *
   * 选择的新值。
   *
   */
  selection: S;

  /**
   * Object that triggered the change.
   *
   * 触发变更的对象。
   *
   */
  source: unknown;
}

/**
 * A selection model containing a date selection.
 *
 * 包含选定日期的选择模型。
 *
 */
@Directive()
export abstract class MatDateSelectionModel<S, D = ExtractDateTypeFromSelection<S>>
    implements OnDestroy {
  private _selectionChanged = new Subject<DateSelectionModelChange<S>>();

  /**
   * Emits when the selection has changed.
   *
   * 当选择发生变化时会触发。
   *
   */
  selectionChanged: Observable<DateSelectionModelChange<S>> = this._selectionChanged;

  protected constructor(
    /** The current selection. */
    readonly selection: S,
    protected _adapter: DateAdapter<D>) {
    this.selection = selection;
  }

  /**
   * Updates the current selection in the model.
   *
   * 更新模型中的当前选择。
   *
   * @param value New selection that should be assigned.
   *
   * 应该赋值的新选择。
   *
   * @param source Object that triggered the selection change.
   *
   * 触发了选择更改的对象。
   *
   */
  updateSelection(value: S, source: unknown) {
    (this as {selection: S}).selection = value;
    this._selectionChanged.next({selection: value, source});
  }

  ngOnDestroy() {
    this._selectionChanged.complete();
  }

  protected _isValidDateInstance(date: D): boolean {
    return this._adapter.isDateInstance(date) && this._adapter.isValid(date);
  }

  /**
   * Adds a date to the current selection.
   *
   * 在当前选择里添加一个日期。
   *
   */
  abstract add(date: D | null): void;

  /**
   * Checks whether the current selection is valid.
   *
   * 检查当前选择是否有效。
   *
   */
  abstract isValid(): boolean;

  /**
   * Checks whether the current selection is complete.
   *
   * 检查当前选择是否已完成。
   *
   */
  abstract isComplete(): boolean;

  /**
   * Clones the selection model.
   *
   * 克隆选择模型。
   *
   * @deprecated To be turned into an abstract method.
   *
   * 将会变成一个抽象方法。
   * @breaking-change 12.0.0
   */
  clone(): MatDateSelectionModel<S, D> {
    if (typeof ngDevMode === 'undefined' || ngDevMode) {
      throw Error('Not implemented');
    }

    return null!;
  }
}

/**
 *  A selection model that contains a single date.
 *
 * 包含单个日期的选择模型。
 *
 */
@Injectable()
export class MatSingleDateSelectionModel<D> extends MatDateSelectionModel<D | null, D> {
  constructor(adapter: DateAdapter<D>) {
    super(null, adapter);
  }

  /**
   * Adds a date to the current selection. In the case of a single date selection, the added date
   * simply overwrites the previous selection
   *
   * 在当前选择里添加一个日期。对于单个日期选择，添加的日期只会改写之前的选择。
   *
   */
  add(date: D | null) {
    super.updateSelection(date, this);
  }

  /**
   * Checks whether the current selection is valid.
   *
   * 检查当前选择是否有效。
   *
   */
  isValid(): boolean {
    return this.selection != null && this._isValidDateInstance(this.selection);
  }

  /**
   * Checks whether the current selection is complete. In the case of a single date selection, this
   * is true if the current selection is not null.
   *
   * 检查当前选择是否已完成。在单选日期的情况下，如果当前选择不为 null，则为 true。
   *
   */
  isComplete() {
    return this.selection != null;
  }

  /**
   * Clones the selection model.
   *
   * 克隆选择模型。
   *
   */
  clone() {
    const clone = new MatSingleDateSelectionModel<D>(this._adapter);
    clone.updateSelection(this.selection, this);
    return clone;
  }
}

/**
 *  A selection model that contains a date range.
 *
 * 一个包含日期范围的选择模型。
 *
 */
@Injectable()
export class MatRangeDateSelectionModel<D> extends MatDateSelectionModel<DateRange<D>, D> {
  constructor(adapter: DateAdapter<D>) {
    super(new DateRange<D>(null, null), adapter);
  }

  /**
   * Adds a date to the current selection. In the case of a date range selection, the added date
   * fills in the next `null` value in the range. If both the start and the end already have a date,
   * the selection is reset so that the given date is the new `start` and the `end` is null.
   *
   * 在当前选择中添加一个日期。对于日期范围选择，添加的日期会填充该范围内的下一个 `null` 值。如果 start 和 end 都有日期，那就重置一下当前选择，以便把指定的日期作为新的 `start`，而其 `end` 是 null。
   *
   */
  add(date: D | null): void {
    let {start, end} = this.selection;

    if (start == null) {
      start = date;
    } else if (end == null) {
      end = date;
    } else {
      start = date;
      end = null;
    }

    super.updateSelection(new DateRange<D>(start, end), this);
  }

  /**
   * Checks whether the current selection is valid.
   *
   * 检查当前选择是否有效。
   *
   */
  isValid(): boolean {
    const {start, end} = this.selection;

    // Empty ranges are valid.
    if (start == null && end == null) {
      return true;
    }

    // Complete ranges are only valid if both dates are valid and the start is before the end.
    if (start != null && end != null) {
      return this._isValidDateInstance(start) && this._isValidDateInstance(end) &&
             this._adapter.compareDate(start, end) <= 0;
    }

    // Partial ranges are valid if the start/end is valid.
    return (start == null || this._isValidDateInstance(start)) &&
           (end == null || this._isValidDateInstance(end));
  }

  /**
   * Checks whether the current selection is complete. In the case of a date range selection, this
   * is true if the current selection has a non-null `start` and `end`.
   *
   * 检查当前选择是否已完成。对于日期范围选择，如果当前选择的 `start` 和 `end` 都是非 null，则为 true。
   *
   */
  isComplete(): boolean {
    return this.selection.start != null && this.selection.end != null;
  }

  /**
   * Clones the selection model.
   *
   * 克隆选择模型。
   *
   */
  clone() {
    const clone = new MatRangeDateSelectionModel<D>(this._adapter);
    clone.updateSelection(this.selection, this);
    return clone;
  }
}

/** @docs-private */
export function MAT_SINGLE_DATE_SELECTION_MODEL_FACTORY(
    parent: MatSingleDateSelectionModel<unknown>, adapter: DateAdapter<unknown>) {
  return parent || new MatSingleDateSelectionModel(adapter);
}

/**
 * Used to provide a single selection model to a component.
 *
 * 用于为组件提供单选模型。
 *
 */
export const MAT_SINGLE_DATE_SELECTION_MODEL_PROVIDER: FactoryProvider = {
  provide: MatDateSelectionModel,
  deps: [[new Optional(), new SkipSelf(), MatDateSelectionModel], DateAdapter],
  useFactory: MAT_SINGLE_DATE_SELECTION_MODEL_FACTORY,
};


/** @docs-private */
export function MAT_RANGE_DATE_SELECTION_MODEL_FACTORY(
    parent: MatSingleDateSelectionModel<unknown>, adapter: DateAdapter<unknown>) {
  return parent || new MatRangeDateSelectionModel(adapter);
}

/**
 * Used to provide a range selection model to a component.
 *
 * 用于为组件提供范围选择模型。
 *
 */
export const MAT_RANGE_DATE_SELECTION_MODEL_PROVIDER: FactoryProvider = {
  provide: MatDateSelectionModel,
  deps: [[new Optional(), new SkipSelf(), MatDateSelectionModel], DateAdapter],
  useFactory: MAT_RANGE_DATE_SELECTION_MODEL_FACTORY,
};
