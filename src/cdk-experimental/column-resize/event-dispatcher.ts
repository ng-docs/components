/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Injectable, NgZone} from '@angular/core';
import {combineLatest, MonoTypeOperatorFunction, Observable, Subject} from 'rxjs';
import {distinctUntilChanged, map, share, skip, startWith} from 'rxjs/operators';

import {_closest} from '@angular/cdk-experimental/popover-edit';

import {HEADER_ROW_SELECTOR} from './selectors';

/**
 * Coordinates events between the column resize directives.
 *
 * 协调列 resize 指令之间的事件。
 *
 */
@Injectable()
export class HeaderRowEventDispatcher {
  /**
   * Emits the currently hovered header cell or null when no header cells are hovered.
   * Exposed publicly for events to feed in, but subscribers should use headerCellHoveredDistinct,
   * defined below.
   *
   * 在没有悬停标题单元格时发出当前悬停的标题单元格或 null。公开暴露一些事件以供传入，但订阅者应使用 headerCellHoveredDistinct，定义如下。
   *
   */
  readonly headerCellHovered = new Subject<Element | null>();

  /**
   * Emits the header cell for which a user-triggered resize is active or null
   * when no resize is in progress.
   *
   * 当用户触发调整大小时发出处于活动状态的标题单元格，或者当没有在调整大小时发出 null。
   *
   */
  readonly overlayHandleActiveForCell = new Subject<Element | null>();

  constructor(private readonly _ngZone: NgZone) {}

  /**
   * Distinct and shared version of headerCellHovered.
   *
   * headerCellHovered 的不同和共享版本。
   *
   */
  readonly headerCellHoveredDistinct = this.headerCellHovered.pipe(distinctUntilChanged(), share());

  /**
   * Emits the header that is currently hovered or hosting an active resize event \(with active
   * taking precedence\).
   *
   * 发出当前悬停的或作为活动 resize 事件宿主的标题（活动优先）。
   *
   */
  readonly headerRowHoveredOrActiveDistinct = combineLatest([
    this.headerCellHoveredDistinct.pipe(
      map(cell => _closest(cell, HEADER_ROW_SELECTOR)),
      startWith(null),
      distinctUntilChanged(),
    ),
    this.overlayHandleActiveForCell.pipe(
      map(cell => _closest(cell, HEADER_ROW_SELECTOR)),
      startWith(null),
      distinctUntilChanged(),
    ),
  ]).pipe(
    skip(1), // Ignore initial [null, null] emission.
    map(([hovered, active]) => active || hovered),
    distinctUntilChanged(),
    share(),
  );

  private readonly _headerRowHoveredOrActiveDistinctReenterZone =
    this.headerRowHoveredOrActiveDistinct.pipe(this._enterZone(), share());

  // Optimization: Share row events observable with subsequent callers.
  // At startup, calls will be sequential by row (and typically there's only one).
  private _lastSeenRow: Element | null = null;
  private _lastSeenRowHover: Observable<boolean> | null = null;

  /**
   * Emits whether the specified row should show its overlay controls.
   * Emission occurs within the NgZone.
   *
   * 发出指定行是否应显示其浮层控件。这个事件是在 NgZone 内发出的。
   *
   */
  resizeOverlayVisibleForHeaderRow(row: Element): Observable<boolean> {
    if (row !== this._lastSeenRow) {
      this._lastSeenRow = row;
      this._lastSeenRowHover = this._headerRowHoveredOrActiveDistinctReenterZone.pipe(
        map(hoveredRow => hoveredRow === row),
        distinctUntilChanged(),
        share(),
      );
    }

    return this._lastSeenRowHover!;
  }

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
}
