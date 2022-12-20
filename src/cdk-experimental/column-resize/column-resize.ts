/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {AfterViewInit, Directive, ElementRef, NgZone, OnDestroy} from '@angular/core';
import {fromEvent, merge, Subject} from 'rxjs';
import {filter, map, mapTo, pairwise, startWith, take, takeUntil} from 'rxjs/operators';

import {_closest} from '@angular/cdk-experimental/popover-edit';

import {ColumnResizeNotifier, ColumnResizeNotifierSource} from './column-resize-notifier';
import {HEADER_CELL_SELECTOR, RESIZE_OVERLAY_SELECTOR} from './selectors';
import {HeaderRowEventDispatcher} from './event-dispatcher';

const HOVER_OR_ACTIVE_CLASS = 'cdk-column-resize-hover-or-active';
const WITH_RESIZED_COLUMN_CLASS = 'cdk-column-resize-with-resized-column';

let nextId = 0;

/**
 * Base class for ColumnResize directives which attach to mat-table elements to
 * provide common events and services for column resizing.
 *
 * ColumnResize 指令的基类，它附着到 mat-table 元素以提供用于列大小调整的通用事件和服务。
 *
 */
@Directive()
export abstract class ColumnResize implements AfterViewInit, OnDestroy {
  protected readonly destroyed = new Subject<void>();

  /* Publicly accessible interface for triggering and being notified of resizes. */
  abstract readonly columnResizeNotifier: ColumnResizeNotifier;

  /* ElementRef that this directive is attached to. Exposed For use by column-level directives */
  abstract readonly elementRef: ElementRef<HTMLElement>;

  protected abstract readonly eventDispatcher: HeaderRowEventDispatcher;
  protected abstract readonly ngZone: NgZone;
  protected abstract readonly notifier: ColumnResizeNotifierSource;

  /**
   * Unique ID for this table instance.
   *
   * 此表实例的唯一 ID。
   *
   */
  protected readonly selectorId = `${++nextId}`;

  /**
   * The id attribute of the table, if specified.
   *
   * 表的 id 属性（如已指定）。
   *
   */
  id?: string;

  ngAfterViewInit() {
    this.elementRef.nativeElement!.classList.add(this.getUniqueCssClass());

    this._listenForRowHoverEvents();
    this._listenForResizeActivity();
    this._listenForHoverActivity();
  }

  ngOnDestroy() {
    this.destroyed.next();
    this.destroyed.complete();
  }

  /**
   * Gets the unique CSS class name for this table instance.
   *
   * 获取此表实例的唯一 CSS 类名称。
   *
   */
  getUniqueCssClass() {
    return `cdk-column-resize-${this.selectorId}`;
  }

  /**
   * Called when a column in the table is resized. Applies a css class to the table element.
   *
   * 调整表中列的大小时调用。将 css 类应用于表格元素。
   *
   */
  setResized() {
    this.elementRef.nativeElement!.classList.add(WITH_RESIZED_COLUMN_CLASS);
  }

  private _listenForRowHoverEvents() {
    this.ngZone.runOutsideAngular(() => {
      const element = this.elementRef.nativeElement!;

      fromEvent<MouseEvent>(element, 'mouseover')
        .pipe(
          map(event => _closest(event.target, HEADER_CELL_SELECTOR)),
          takeUntil(this.destroyed),
        )
        .subscribe(this.eventDispatcher.headerCellHovered);
      fromEvent<MouseEvent>(element, 'mouseleave')
        .pipe(
          filter(
            event =>
              !!event.relatedTarget &&
              !(event.relatedTarget as Element).matches(RESIZE_OVERLAY_SELECTOR),
          ),
          mapTo(null),
          takeUntil(this.destroyed),
        )
        .subscribe(this.eventDispatcher.headerCellHovered);
    });
  }

  private _listenForResizeActivity() {
    merge(
      this.eventDispatcher.overlayHandleActiveForCell.pipe(mapTo(undefined)),
      this.notifier.triggerResize.pipe(mapTo(undefined)),
      this.notifier.resizeCompleted.pipe(mapTo(undefined)),
    )
      .pipe(take(1), takeUntil(this.destroyed))
      .subscribe(() => {
        this.setResized();
      });
  }

  private _listenForHoverActivity() {
    this.eventDispatcher.headerRowHoveredOrActiveDistinct
      .pipe(startWith(null), pairwise(), takeUntil(this.destroyed))
      .subscribe(([previousRow, hoveredRow]) => {
        if (hoveredRow) {
          hoveredRow.classList.add(HOVER_OR_ACTIVE_CLASS);
        }
        if (previousRow) {
          previousRow.classList.remove(HOVER_OR_ACTIVE_CLASS);
        }
      });
  }
}
