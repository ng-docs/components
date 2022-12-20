/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Injectable, NgZone} from '@angular/core';
import {combineLatest, MonoTypeOperatorFunction, Observable, pipe, Subject} from 'rxjs';
import {
  audit,
  auditTime,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  skip,
  startWith,
  shareReplay,
} from 'rxjs/operators';

import {CELL_SELECTOR, ROW_SELECTOR} from './constants';
import {closest} from './polyfill';

/**
 * The delay applied to mouse events before hiding or showing hover content.
 *
 * 在隐藏或显示悬停内容之前应用于鼠标事件的延迟。
 *
 */
const MOUSE_EVENT_DELAY_MS = 40;

/**
 * The delay for reacting to focus/blur changes.
 *
 * 对聚焦/失焦变化的反应延迟。
 *
 */
const FOCUS_DELAY = 0;

/**
 * The possible states for hover content:
 * OFF - Not rendered.
 * FOCUSABLE - Rendered in the dom and styled for its contents to be focusable but invisible.
 * ON - Rendered and fully visible.
 *
 * 悬停内容的可能状态：
 * OFF - 未渲染。
 * FOCUSABLE - 在 dom 中渲染并设置其内容可聚焦但不可见的样式。
 * ON - 渲染并完全可见。
 *
 */
export const enum HoverContentState {
  OFF = 0,
  FOCUSABLE,
  ON,
}

// Note: this class is generic, rather than referencing EditRef directly, in order to avoid
// circular imports. If we were to reference it here, importing the registry into the
// class that is registering itself will introduce a circular import.

/**
 * Service for sharing delegated events and state for triggering table edits.
 *
 * 用于共享委托事件和状态以触发表格编辑的服务。
 *
 */
@Injectable()
export class EditEventDispatcher<R> {
  /**
   * A subject that indicates which table cell is currently editing (unless it is disabled).
   *
   * 指示当前正在编辑哪个表格单元格的主体（除非它被禁用）。
   *
   */
  readonly editing = new Subject<Element | null>();

  /**
   * A subject that indicates which table row is currently hovered.
   *
   * 指示当前悬停在哪个表行的主体。
   *
   */
  readonly hovering = new Subject<Element | null>();

  /**
   * A subject that indicates which table row currently contains focus.
   *
   * 指示哪个表行当前包含焦点的主体。
   *
   */
  readonly focused = new Subject<Element | null>();

  /**
   * A subject that indicates all elements in the table matching ROW_SELECTOR.
   *
   * 指示表中与 ROW_SELECTOR 匹配的所有元素的主体。
   *
   */
  readonly allRows = new Subject<NodeList>();

  /**
   * A subject that emits mouse move events from the table indicating the targeted row.
   *
   * 从表格中发出指示目标行的鼠标移动事件的主体。
   *
   */
  readonly mouseMove = new Subject<Element | null>();

  // TODO: Use WeakSet once IE11 support is dropped.
  /**
   * Tracks the currently disabled editable cells - edit calls will be ignored
   * for these cells.
   *
   * 跟踪当前已禁用的可编辑单元格 - 这些单元格的编辑调用将被忽略。
   *
   */
  readonly disabledCells = new WeakMap<Element, boolean>();

  /**
   * The EditRef for the currently active edit lens (if any).
   *
   * 当前活动编辑镜头（如果有）的 EditRef。
   *
   */
  get editRef(): R | null {
    return this._editRef;
  }
  private _editRef: R | null = null;

  // Optimization: Precompute common pipeable operators used per row/cell.
  private readonly _distinctUntilChanged = distinctUntilChanged<
    Element | HoverContentState | boolean | null
  >();
  private readonly _startWithNull = startWith<Element | null>(null);
  private readonly _distinctShare = pipe(
    this._distinctUntilChanged as MonoTypeOperatorFunction<HoverContentState>,
    shareReplay(1),
  );
  private readonly _startWithNullDistinct = pipe(
    this._startWithNull,
    this._distinctUntilChanged as MonoTypeOperatorFunction<Element | null>,
  );

  readonly editingAndEnabled = this.editing.pipe(
    filter(cell => cell == null || !this.disabledCells.has(cell)),
    shareReplay(1),
  );

  /**
   * An observable that emits the row containing focus or an active edit.
   *
   * 发出包含焦点或活动编辑的行的 Observable 。
   *
   */
  readonly editingOrFocused = combineLatest([
    this.editingAndEnabled.pipe(
      map(cell => closest(cell, ROW_SELECTOR)),
      this._startWithNull,
    ),
    this.focused.pipe(this._startWithNull),
  ]).pipe(
    map(([editingRow, focusedRow]) => focusedRow || editingRow),
    this._distinctUntilChanged as MonoTypeOperatorFunction<Element | null>,
    auditTime(FOCUS_DELAY), // Use audit to skip over blur events to the next focused element.
    this._distinctUntilChanged as MonoTypeOperatorFunction<Element | null>,
    shareReplay(1),
  );

  /** Tracks rows that contain hover content with a reference count. */
  private _rowsWithHoverContent = new WeakMap<Element, number>();

  /** The table cell that has an active edit lens (or null). */
  private _currentlyEditing: Element | null = null;

  /** The combined set of row hover content states organized by row. */
  private readonly _hoveredContentStateDistinct = combineLatest([
    this._getFirstRowWithHoverContent(),
    this._getLastRowWithHoverContent(),
    this.editingOrFocused,
    this.hovering.pipe(
      distinctUntilChanged(),
      audit(row =>
        this.mouseMove.pipe(
          filter(mouseMoveRow => row === mouseMoveRow),
          this._startWithNull,
          debounceTime(MOUSE_EVENT_DELAY_MS),
        ),
      ),
      this._startWithNullDistinct,
    ),
  ]).pipe(
    skip(1), // Skip the initial emission of [null, null, null, null].
    map(computeHoverContentState),
    distinctUntilChanged(areMapEntriesEqual),
    // Optimization: Enter the zone before shareReplay so that we trigger a single
    // ApplicationRef.tick for all row updates.
    this._enterZone(),
    shareReplay(1),
  );

  private readonly _editingAndEnabledDistinct = this.editingAndEnabled.pipe(
    distinctUntilChanged(),
    this._enterZone(),
    shareReplay(1),
  );

  // Optimization: Share row events observable with subsequent callers.
  // At startup, calls will be sequential by row.
  private _lastSeenRow: Element | null = null;
  private _lastSeenRowHoverOrFocus: Observable<HoverContentState> | null = null;

  constructor(private readonly _ngZone: NgZone) {
    this._editingAndEnabledDistinct.subscribe(cell => {
      this._currentlyEditing = cell;
    });
  }

  /**
   * Gets an Observable that emits true when the specified element's cell
   * is editing and false when not.
   *
   * 获取一个 Observable，当指定元素的单元格正在编辑时发出 true，否则发出 false。
   *
   */
  editingCell(element: Element | EventTarget): Observable<boolean> {
    let cell: Element | null = null;

    return this._editingAndEnabledDistinct.pipe(
      map(editCell => editCell === (cell || (cell = closest(element, CELL_SELECTOR)))),
      this._distinctUntilChanged as MonoTypeOperatorFunction<boolean>,
    );
  }

  /**
   * Stops editing for the specified cell. If the specified cell is not the current
   * edit cell, does nothing.
   *
   * 停止编辑指定的单元格。如果指定的单元格不是正在编辑的单元格，则不执行任何操作。
   *
   */
  doneEditingCell(element: Element | EventTarget): void {
    const cell = closest(element, CELL_SELECTOR);

    if (this._currentlyEditing === cell) {
      this.editing.next(null);
    }
  }

  /**
   * Sets the currently active EditRef.
   *
   * 设置当前活动的 EditRef。
   *
   */
  setActiveEditRef(ref: R) {
    this._editRef = ref;
  }

  /**
   * Unset the currently active EditRef, if the specified editRef is active.
   *
   * 如果指定的 editRef 处于活动状态，则取消设置当前活动的 EditRef。
   *
   */
  unsetActiveEditRef(ref: R) {
    if (this._editRef !== ref) {
      return;
    }

    this._editRef = null;
  }

  /**
   * Adds the specified table row to be tracked for first/last row comparisons.
   *
   * 添加要跟踪的指定表行以进行第一行/最后一行比较。
   *
   */
  registerRowWithHoverContent(row: Element): void {
    this._rowsWithHoverContent.set(row, (this._rowsWithHoverContent.get(row) || 0) + 1);
  }

  /**
   * Reference decrements and ultimately removes the specified table row from first/last row
   * comparisons.
   *
   * 引用递减并最终从第一行/最后一行比较中删除指定的表行。
   *
   */
  deregisterRowWithHoverContent(row: Element): void {
    const refCount = this._rowsWithHoverContent.get(row) || 0;

    if (refCount <= 1) {
      this._rowsWithHoverContent.delete(row);
    } else {
      this._rowsWithHoverContent.set(row, refCount - 1);
    }
  }

  /**
   * Gets an Observable that emits true when the specified element's row
   * contains the focused element or is being hovered over and false when not.
   * Hovering is defined as when the mouse has momentarily stopped moving over the cell.
   *
   * 获取一个 Observable，当指定元素的行包含焦点元素或悬停在上面时发出 true，否则发出 false。悬停定义为鼠标暂时停止在单元格上移动。
   *
   */
  hoverOrFocusOnRow(row: Element): Observable<HoverContentState> {
    if (row !== this._lastSeenRow) {
      this._lastSeenRow = row;
      this._lastSeenRowHoverOrFocus = this._hoveredContentStateDistinct.pipe(
        map(state => state.get(row) || HoverContentState.OFF),
        this._distinctShare,
      );
    }

    return this._lastSeenRowHoverOrFocus!;
  }

  /**
   * RxJS operator that enters the Angular zone, used to reduce boilerplate in
   * re-entering the zone for stream pipelines.
   */
  private _enterZone<T>(): MonoTypeOperatorFunction<T> {
    return (source: Observable<T>) =>
      new Observable<T>(observer =>
        source.subscribe({
          next: value => this._ngZone.run(() => observer.next(value)),
          error: err => observer.error(err),
          complete: () => observer.complete(),
        }),
      );
  }

  private _getFirstRowWithHoverContent(): Observable<Element | null> {
    return this._mapAllRowsToSingleRow(rows => {
      for (let i = 0, row; (row = rows[i]); i++) {
        if (this._rowsWithHoverContent.has(row as Element)) {
          return row as Element;
        }
      }
      return null;
    });
  }

  private _getLastRowWithHoverContent(): Observable<Element | null> {
    return this._mapAllRowsToSingleRow(rows => {
      for (let i = rows.length - 1, row; (row = rows[i]); i--) {
        if (this._rowsWithHoverContent.has(row as Element)) {
          return row as Element;
        }
      }
      return null;
    });
  }

  private _mapAllRowsToSingleRow(
    mapper: (rows: NodeList) => Element | null,
  ): Observable<Element | null> {
    return this.allRows.pipe(map(mapper), this._startWithNullDistinct);
  }
}

function computeHoverContentState([
  firstRow,
  lastRow,
  activeRow,
  hoverRow,
]: (Element | null)[]): Map<Element, HoverContentState> {
  const hoverContentState = new Map<Element, HoverContentState>();

  // Add focusable rows.
  for (const focussableRow of [
    firstRow,
    lastRow,
    activeRow && activeRow.previousElementSibling,
    activeRow && activeRow.nextElementSibling,
  ]) {
    if (focussableRow) {
      hoverContentState.set(focussableRow as Element, HoverContentState.FOCUSABLE);
    }
  }

  // Add/overwrite with fully visible rows.
  for (const onRow of [activeRow, hoverRow]) {
    if (onRow) {
      hoverContentState.set(onRow, HoverContentState.ON);
    }
  }

  return hoverContentState;
}

function areMapEntriesEqual<K, V>(a: Map<K, V>, b: Map<K, V>): boolean {
  if (a.size !== b.size) {
    return false;
  }

  // TODO: use Map.prototype.entries once we're off IE11.
  for (const aKey of Array.from(a.keys())) {
    if (b.get(aKey) !== a.get(aKey)) {
      return false;
    }
  }

  return true;
}
