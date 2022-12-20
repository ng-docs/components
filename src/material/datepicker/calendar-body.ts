/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewEncapsulation,
  NgZone,
  OnChanges,
  SimpleChanges,
  OnDestroy,
  AfterViewChecked,
} from '@angular/core';
import {take} from 'rxjs/operators';

/**
 * Extra CSS classes that can be associated with a calendar cell.
 *
 * 可以与日历单元格关联的额外 CSS 类。
 *
 */
export type MatCalendarCellCssClasses = string | string[] | Set<string> | {[key: string]: any};

/**
 * Function that can generate the extra classes that should be added to a calendar cell.
 *
 * 一个函数，可以生成要添加到日历单元格中的额外类。
 *
 */
export type MatCalendarCellClassFunction<D> = (
  date: D,
  view: 'month' | 'year' | 'multi-year',
) => MatCalendarCellCssClasses;

/**
 * An internal class that represents the data corresponding to a single calendar cell.
 *
 * 一个内部类，表示与单个日历单元格对应的数据。
 *
 * @docs-private
 */
export class MatCalendarCell<D = any> {
  constructor(
    public value: number,
    public displayValue: string,
    public ariaLabel: string,
    public enabled: boolean,
    public cssClasses: MatCalendarCellCssClasses = {},
    public compareValue = value,
    public rawValue?: D,
  ) {}
}

/**
 * Event emitted when a date inside the calendar is triggered as a result of a user action.
 *
 * 当用户操作后发出日历中日期的事件。
 *
 */
export interface MatCalendarUserEvent<D> {
  value: D;
  event: Event;
}

let calendarBodyId = 1;

/**
 * An internal component used to display calendar data in a table.
 *
 * 一个内部组件，用于在表中显示日历数据。
 *
 * @docs-private
 */
@Component({
  selector: '[mat-calendar-body]',
  templateUrl: 'calendar-body.html',
  styleUrls: ['calendar-body.css'],
  host: {
    'class': 'mat-calendar-body',
  },
  exportAs: 'matCalendarBody',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatCalendarBody<D = any> implements OnChanges, OnDestroy, AfterViewChecked {
  /**
   * Used to skip the next focus event when rendering the preview range.
   * We need a flag like this, because some browsers fire focus events asynchronously.
   *
   * 用于在渲染预览范围时跳过下一个获得焦点事件。我们需要一个这样的标志，因为有些浏览器会异步激活焦点事件。
   *
   */
  private _skipNextFocus: boolean;

  /**
   * Used to focus the active cell after change detection has run.
   *
   * 用于在变更检测运行后聚焦到活动单元格。
   *
   */
  private _focusActiveCellAfterViewChecked = false;

  /**
   * The label for the table. (e.g. "Jan 2017").
   *
   * 表格的标签。（例如“2017 年 1 月”）。
   *
   */
  @Input() label: string;

  /**
   * The cells to display in the table.
   *
   * 一些要在此表格中显示的单元格。
   *
   */
  @Input() rows: MatCalendarCell[][];

  /**
   * The value in the table that corresponds to today.
   *
   * 表中与今天对应的值。
   *
   */
  @Input() todayValue: number;

  /**
   * Start value of the selected date range.
   *
   * 选定日期范围的起始值。
   *
   */
  @Input() startValue: number;

  /**
   * End value of the selected date range.
   *
   * 选定日期范围的结束值。
   *
   */
  @Input() endValue: number;

  /**
   * The minimum number of free cells needed to fit the label in the first row.
   *
   * 第一行标签所需的最小空闲单元格数。
   *
   */
  @Input() labelMinRequiredCells: number;

  /**
   * The number of columns in the table.
   *
   * 表中的列数
   *
   */
  @Input() numCols: number = 7;

  /**
   * The cell number of the active cell in the table.
   *
   * 表中活动单元格的单元号。
   *
   */
  @Input() activeCell: number = 0;

  ngAfterViewChecked() {
    if (this._focusActiveCellAfterViewChecked) {
      this._focusActiveCell();
      this._focusActiveCellAfterViewChecked = false;
    }
  }

  /**
   * Whether a range is being selected.
   *
   * 是否正在选择一个范围。
   *
   */
  @Input() isRange: boolean = false;

  /**
   * The aspect ratio (width / height) to use for the cells in the table. This aspect ratio will be
   * maintained even as the table resizes.
   *
   * 要用于表中单元格的宽高比（width / height）。即使表格调整大小，这个宽高比也会保持不变。
   *
   */
  @Input() cellAspectRatio: number = 1;

  /**
   * Start of the comparison range.
   *
   * 比较范围的起始日期。
   *
   */
  @Input() comparisonStart: number | null;

  /**
   * End of the comparison range.
   *
   * 比较范围的结束日期。
   *
   */
  @Input() comparisonEnd: number | null;

  /**
   * Start of the preview range.
   *
   * 预览范围的起始日期。
   *
   */
  @Input() previewStart: number | null = null;

  /**
   * End of the preview range.
   *
   * 预览范围的结束日期。
   *
   */
  @Input() previewEnd: number | null = null;

  /**
   * ARIA Accessible name of the `<input matStartDate/>`
   *
   * `<input matStartDate/>` 的 ARIA 无障碍名称
   *
   */
  @Input() startDateAccessibleName: string | null;

  /**
   * ARIA Accessible name of the `<input matEndDate/>`
   *
   * `<input matEndDate/>` 的 ARIA 无障碍名称
   *
   */
  @Input() endDateAccessibleName: string | null;

  /**
   * Emits when a new value is selected.
   *
   * 当选择新值时会发出通知。
   *
   */
  @Output() readonly selectedValueChange = new EventEmitter<MatCalendarUserEvent<number>>();

  /**
   * Emits when the preview has changed as a result of a user action.
   *
   * 当预览因用户操作而发生变化时发出通知。
   *
   */
  @Output() readonly previewChange = new EventEmitter<
    MatCalendarUserEvent<MatCalendarCell | null>
  >();

  @Output() readonly activeDateChange = new EventEmitter<MatCalendarUserEvent<number>>();

  /**
   * Emits the date at the possible start of a drag event.
   *
   * 在拖动事件可能开始时发出此日期。
   *
   */
  @Output() readonly dragStarted = new EventEmitter<MatCalendarUserEvent<D>>();

  /**
   * Emits the date at the conclusion of a drag, or null if mouse was not released on a date.
   *
   * 在拖动结束时发出此日期，如果鼠标未在某个日期释放则为 null。
   *
   */
  @Output() readonly dragEnded = new EventEmitter<MatCalendarUserEvent<D | null>>();

  /**
   * The number of blank cells to put at the beginning for the first row.
   *
   * 要放在第一行开头处的空白单元格数。
   *
   */
  _firstRowOffset: number;

  /**
   * Padding for the individual date cells.
   *
   * 用于各个日期单元格的内衬距。
   *
   */
  _cellPadding: string;

  /**
   * Width of an individual cell.
   *
   * 单个单元格的宽度。
   *
   */
  _cellWidth: string;

  private _didDragSinceMouseDown = false;

  constructor(private _elementRef: ElementRef<HTMLElement>, private _ngZone: NgZone) {
    _ngZone.runOutsideAngular(() => {
      const element = _elementRef.nativeElement;
      element.addEventListener('mouseenter', this._enterHandler, true);
      element.addEventListener('touchmove', this._touchmoveHandler, true);
      element.addEventListener('focus', this._enterHandler, true);
      element.addEventListener('mouseleave', this._leaveHandler, true);
      element.addEventListener('blur', this._leaveHandler, true);
      element.addEventListener('mousedown', this._mousedownHandler);
      element.addEventListener('touchstart', this._mousedownHandler);
      window.addEventListener('mouseup', this._mouseupHandler);
      window.addEventListener('touchend', this._touchendHandler);
    });
  }

  /**
   * Called when a cell is clicked.
   *
   * 当单击一个单元格时调用。
   *
   */
  _cellClicked(cell: MatCalendarCell, event: MouseEvent): void {
    // Ignore "clicks" that are actually canceled drags (eg the user dragged
    // off and then went back to this cell to undo).
    if (this._didDragSinceMouseDown) {
      return;
    }

    if (cell.enabled) {
      this.selectedValueChange.emit({value: cell.value, event});
    }
  }

  _emitActiveDateChange(cell: MatCalendarCell, event: FocusEvent): void {
    if (cell.enabled) {
      this.activeDateChange.emit({value: cell.value, event});
    }
  }

  /**
   * Returns whether a cell should be marked as selected.
   *
   * 返回是否应该把一个单元格标记为已选。
   *
   */
  _isSelected(value: number) {
    return this.startValue === value || this.endValue === value;
  }

  ngOnChanges(changes: SimpleChanges) {
    const columnChanges = changes['numCols'];
    const {rows, numCols} = this;

    if (changes['rows'] || columnChanges) {
      this._firstRowOffset = rows && rows.length && rows[0].length ? numCols - rows[0].length : 0;
    }

    if (changes['cellAspectRatio'] || columnChanges || !this._cellPadding) {
      this._cellPadding = `${(50 * this.cellAspectRatio) / numCols}%`;
    }

    if (columnChanges || !this._cellWidth) {
      this._cellWidth = `${100 / numCols}%`;
    }
  }

  ngOnDestroy() {
    const element = this._elementRef.nativeElement;
    element.removeEventListener('mouseenter', this._enterHandler, true);
    element.removeEventListener('touchmove', this._touchmoveHandler, true);
    element.removeEventListener('focus', this._enterHandler, true);
    element.removeEventListener('mouseleave', this._leaveHandler, true);
    element.removeEventListener('blur', this._leaveHandler, true);
    element.removeEventListener('mousedown', this._mousedownHandler);
    element.removeEventListener('touchstart', this._mousedownHandler);
    window.removeEventListener('mouseup', this._mouseupHandler);
    window.removeEventListener('touchend', this._touchendHandler);
  }

  /**
   * Returns whether a cell is active.
   *
   * 返回单元是否处于活动状态。
   *
   */
  _isActiveCell(rowIndex: number, colIndex: number): boolean {
    let cellNumber = rowIndex * this.numCols + colIndex;

    // Account for the fact that the first row may not have as many cells.
    if (rowIndex) {
      cellNumber -= this._firstRowOffset;
    }

    return cellNumber == this.activeCell;
  }

  /**
   * Focuses the active cell after the microtask queue is empty.
   *
   * 当微任务队列为空之后，让这个活动单元格获得焦点。
   *
   * Adding a 0ms setTimeout seems to fix Voiceover losing focus when pressing PageUp/PageDown
   * (issue #24330).
   *
   * 添加 0ms 的 setTimeout 似乎可以修复 Voiceover 在按下 PageUp/PageDown 时失去焦点的问题（问题 #24330）。
   *
   * Determined a 0ms by gradually increasing duration from 0 and testing two use cases with screen
   * reader enabled:
   *
   * 通过从 0 逐渐增加持续时间并在启用屏幕阅读器的情况下测试两个用例来确定 0ms：
   *
   * 1. Pressing PageUp/PageDown repeatedly with pausing between each key press.
   *
   *    重复按 PageUp/PageDown 并在每次按键之间暂停。
   *
   * 2. Pressing and holding the PageDown key with repeated keys enabled.
   *
   *    在启用重复键的情况下按住 PageDown 键。
   *
   * Test 1 worked roughly 95-99% of the time with 0ms and got a little bit better as the duration
   * increased. Test 2 got slightly better until the duration was long enough to interfere with
   * repeated keys. If the repeated key speed was faster than the timeout duration, then pressing
   * and holding pagedown caused the entire page to scroll.
   *
   * 测试 1 大约 95-99% 的时间在 0 毫秒内工作，并且随着持续时间的增加而变得更好一些。测试 2 稍微好一点，直到持续时间长到足以干扰重复键。如果重复按键速度快于超时持续时间，则按住 pagedown 会导致整个页面滚动。
   *
   * Since repeated key speed can verify across machines, determined that any duration could
   * potentially interfere with repeated keys. 0ms would be best because it almost entirely
   * eliminates the focus being lost in Voiceover (#24330) without causing unintended side effects.
   * Adding delay also complicates writing tests.
   *
   * 由于重复按键速度可以跨机器验证，因此确定任何持续时间都可能会干扰重复按键。 0ms 是最好的，因为它几乎完全消除了 Voiceover (#24330) 中丢失的焦点，而不会导致意外的副作用。添加延迟也会使编写测试变得复杂。
   *
   */
  _focusActiveCell(movePreview = true) {
    this._ngZone.runOutsideAngular(() => {
      this._ngZone.onStable.pipe(take(1)).subscribe(() => {
        setTimeout(() => {
          const activeCell: HTMLElement | null = this._elementRef.nativeElement.querySelector(
            '.mat-calendar-body-active',
          );

          if (activeCell) {
            if (!movePreview) {
              this._skipNextFocus = true;
            }

            activeCell.focus();
          }
        });
      });
    });
  }

  /**
   * Focuses the active cell after change detection has run and the microtask queue is empty.
   *
   * 在变更检测已运行且微任务队列为空后聚焦活动单元格。
   *
   */
  _scheduleFocusActiveCellAfterViewChecked() {
    this._focusActiveCellAfterViewChecked = true;
  }

  /**
   * Gets whether a value is the start of the main range.
   *
   * 获取某个值是否位于该范围的起始日期。
   *
   */
  _isRangeStart(value: number) {
    return isStart(value, this.startValue, this.endValue);
  }

  /**
   * Gets whether a value is the end of the main range.
   *
   * 获取某个值是否位于该范围的结束日期。
   *
   */
  _isRangeEnd(value: number) {
    return isEnd(value, this.startValue, this.endValue);
  }

  /**
   * Gets whether a value is within the currently-selected range.
   *
   * 获取某个值是否在当前选定范围内。
   *
   */
  _isInRange(value: number): boolean {
    return isInRange(value, this.startValue, this.endValue, this.isRange);
  }

  /**
   * Gets whether a value is the start of the comparison range.
   *
   * 获取某个值是否为比较范围的起始日期。
   *
   */
  _isComparisonStart(value: number) {
    return isStart(value, this.comparisonStart, this.comparisonEnd);
  }

  /**
   * Whether the cell is a start bridge cell between the main and comparison ranges.
   *
   * 该单元格是否为主要和比较范围之间的起始过渡单元格。
   *
   */
  _isComparisonBridgeStart(value: number, rowIndex: number, colIndex: number) {
    if (!this._isComparisonStart(value) || this._isRangeStart(value) || !this._isInRange(value)) {
      return false;
    }

    let previousCell: MatCalendarCell | undefined = this.rows[rowIndex][colIndex - 1];

    if (!previousCell) {
      const previousRow = this.rows[rowIndex - 1];
      previousCell = previousRow && previousRow[previousRow.length - 1];
    }

    return previousCell && !this._isRangeEnd(previousCell.compareValue);
  }

  /**
   * Whether the cell is an end bridge cell between the main and comparison ranges.
   *
   * 该单元格是否为主要和比较范围之间的结尾过渡单元格。
   *
   */
  _isComparisonBridgeEnd(value: number, rowIndex: number, colIndex: number) {
    if (!this._isComparisonEnd(value) || this._isRangeEnd(value) || !this._isInRange(value)) {
      return false;
    }

    let nextCell: MatCalendarCell | undefined = this.rows[rowIndex][colIndex + 1];

    if (!nextCell) {
      const nextRow = this.rows[rowIndex + 1];
      nextCell = nextRow && nextRow[0];
    }

    return nextCell && !this._isRangeStart(nextCell.compareValue);
  }

  /**
   * Gets whether a value is the end of the comparison range.
   *
   * 获取某个值是否为比较范围的结束日期。
   *
   */
  _isComparisonEnd(value: number) {
    return isEnd(value, this.comparisonStart, this.comparisonEnd);
  }

  /**
   * Gets whether a value is within the current comparison range.
   *
   * 获取某个值是否在当前比较范围内。
   *
   */
  _isInComparisonRange(value: number) {
    return isInRange(value, this.comparisonStart, this.comparisonEnd, this.isRange);
  }

  /**
   * Gets whether a value is the same as the start and end of the comparison range.
   * For context, the functions that we use to determine whether something is the start/end of
   * a range don't allow for the start and end to be on the same day, because we'd have to use
   * much more specific CSS selectors to style them correctly in all scenarios. This is fine for
   * the regular range, because when it happens, the selected styles take over and still show where
   * the range would've been, however we don't have these selected styles for a comparison range.
   * This function is used to apply a class that serves the same purpose as the one for selected
   * dates, but it only applies in the context of a comparison range.
   *
   * 获取某个值是否与比较范围的起始日期和结束日期相同。其上下文是，我们用来判断某些东西是否为某个范围起始日期/结束日期的函数不允许其起始日期和结束日期在同一天，因为我们必须使用更多特定的 CSS 选择器来设置样式。对于常规范围来说，最好在所有情况下都能正确使用，因为当它发生时，“已选”样式会接管并显示该范围的位置，但是我们没有为比较范围使用“已选”样式。这个函数用来应用一个与“已选”日期相同用途的类，但它只适用于比较范围的上下文中。
   *
   */
  _isComparisonIdentical(value: number) {
    // Note that we don't need to null check the start/end
    // here, because the `value` will always be defined.
    return this.comparisonStart === this.comparisonEnd && value === this.comparisonStart;
  }

  /**
   * Gets whether a value is the start of the preview range.
   *
   * 获取某个值是否为预览范围的起始日期。
   *
   */
  _isPreviewStart(value: number) {
    return isStart(value, this.previewStart, this.previewEnd);
  }

  /**
   * Gets whether a value is the end of the preview range.
   *
   * 获取某个值是否为预览范围的结束日期。
   *
   */
  _isPreviewEnd(value: number) {
    return isEnd(value, this.previewStart, this.previewEnd);
  }

  /**
   * Gets whether a value is inside the preview range.
   *
   * 获取某个值是否在预览范围内。
   *
   */
  _isInPreview(value: number) {
    return isInRange(value, this.previewStart, this.previewEnd, this.isRange);
  }

  /**
   * Gets ids of aria descriptions for the start and end of a date range.
   *
   * 获取日期范围开始和结束的 ARIA 描述的 ID。
   *
   */
  _getDescribedby(value: number): string | null {
    if (!this.isRange) {
      return null;
    }

    if (this.startValue === value && this.endValue === value) {
      return `${this._startDateLabelId} ${this._endDateLabelId}`;
    } else if (this.startValue === value) {
      return this._startDateLabelId;
    } else if (this.endValue === value) {
      return this._endDateLabelId;
    }
    return null;
  }

  /**
   * Event handler for when the user enters an element
   * inside the calendar body (e.g. by hovering in or focus).
   *
   * 一个事件处理器，用于用户在日历体中进入某个元素时（例如，通过悬停或聚焦）。
   *
   */
  private _enterHandler = (event: Event) => {
    if (this._skipNextFocus && event.type === 'focus') {
      this._skipNextFocus = false;
      return;
    }

    // We only need to hit the zone when we're selecting a range.
    if (event.target && this.isRange) {
      const cell = this._getCellFromElement(event.target as HTMLElement);

      if (cell) {
        this._ngZone.run(() => this.previewChange.emit({value: cell.enabled ? cell : null, event}));
      }
    }
  };

  private _touchmoveHandler = (event: TouchEvent) => {
    if (!this.isRange) return;

    const target = getActualTouchTarget(event);
    const cell = target ? this._getCellFromElement(target as HTMLElement) : null;

    if (target !== event.target) {
      this._didDragSinceMouseDown = true;
    }

    // If the initial target of the touch is a date cell, prevent default so
    // that the move is not handled as a scroll.
    if (getCellElement(event.target as HTMLElement)) {
      event.preventDefault();
    }

    this._ngZone.run(() => this.previewChange.emit({value: cell?.enabled ? cell : null, event}));
  };

  /**
   * Event handler for when the user's pointer leaves an element
   * inside the calendar body (e.g. by hovering out or blurring).
   *
   * 事件处理函数，表示当用户的指针在日历体中离开某个元素时（比如结束悬停或失焦）。
   *
   */
  private _leaveHandler = (event: Event) => {
    // We only need to hit the zone when we're selecting a range.
    if (this.previewEnd !== null && this.isRange) {
      if (event.type !== 'blur') {
        this._didDragSinceMouseDown = true;
      }

      // Only reset the preview end value when leaving cells. This looks better, because
      // we have a gap between the cells and the rows and we don't want to remove the
      // range just for it to show up again when the user moves a few pixels to the side.
      if (
        event.target &&
        this._getCellFromElement(event.target as HTMLElement) &&
        !(
          (event as MouseEvent).relatedTarget &&
          this._getCellFromElement((event as MouseEvent).relatedTarget as HTMLElement)
        )
      ) {
        this._ngZone.run(() => this.previewChange.emit({value: null, event}));
      }
    }
  };

  /**
   * Triggered on mousedown or touchstart on a date cell.
   * Respsonsible for starting a drag sequence.
   */
  private _mousedownHandler = (event: Event) => {
    if (!this.isRange) return;

    this._didDragSinceMouseDown = false;
    // Begin a drag if a cell within the current range was targeted.
    const cell = event.target && this._getCellFromElement(event.target as HTMLElement);
    if (!cell || !this._isInRange(cell.rawValue)) {
      return;
    }

    this._ngZone.run(() => {
      this.dragStarted.emit({
        value: cell.rawValue,
        event,
      });
    });
  };

  /** Triggered on mouseup anywhere. Respsonsible for ending a drag sequence. */
  private _mouseupHandler = (event: Event) => {
    if (!this.isRange) return;

    const cellElement = getCellElement(event.target as HTMLElement);
    if (!cellElement) {
      // Mouseup happened outside of datepicker. Cancel drag.
      this._ngZone.run(() => {
        this.dragEnded.emit({value: null, event});
      });
      return;
    }

    if (cellElement.closest('.mat-calendar-body') !== this._elementRef.nativeElement) {
      // Mouseup happened inside a different month instance.
      // Allow it to handle the event.
      return;
    }

    this._ngZone.run(() => {
      const cell = this._getCellFromElement(cellElement);
      this.dragEnded.emit({value: cell?.rawValue ?? null, event});
    });
  };

  /** Triggered on touchend anywhere. Respsonsible for ending a drag sequence. */
  private _touchendHandler = (event: TouchEvent) => {
    const target = getActualTouchTarget(event);

    if (target) {
      this._mouseupHandler({target} as unknown as Event);
    }
  };

  /**
   * Finds the MatCalendarCell that corresponds to a DOM node.
   *
   * 找到与 DOM 节点对应的 MatCalendarCell。
   *
   */
  private _getCellFromElement(element: HTMLElement): MatCalendarCell | null {
    const cell = getCellElement(element);

    if (cell) {
      const row = cell.getAttribute('data-mat-row');
      const col = cell.getAttribute('data-mat-col');

      if (row && col) {
        return this.rows[parseInt(row)][parseInt(col)];
      }
    }

    return null;
  }

  private _id = `mat-calendar-body-${calendarBodyId++}`;

  _startDateLabelId = `${this._id}-start-date`;

  _endDateLabelId = `${this._id}-end-date`;
}

/**
 * Checks whether a node is a table cell element.
 *
 * 检查某个节点是否为表格单元格元素。
 *
 */
function isTableCell(node: Node | undefined | null): node is HTMLTableCellElement {
  return node?.nodeName === 'TD';
}

/**
 * Gets the date table cell element that is or contains the specified element.
 * Or returns null if element is not part of a date cell.
 *
 * 获取属于或包含指定元素的日期单元格元素。或者，如果元素不是日期单元格的一部分，则返回 null。
 *
 */
function getCellElement(element: HTMLElement): HTMLElement | null {
  let cell: HTMLElement | undefined;
  if (isTableCell(element)) {
    cell = element;
  } else if (isTableCell(element.parentNode)) {
    cell = element.parentNode as HTMLElement;
  } else if (isTableCell(element.parentNode?.parentNode)) {
    cell = element.parentNode!.parentNode as HTMLElement;
  }

  return cell?.getAttribute('data-mat-row') != null ? cell : null;
}

/**
 * Checks whether a value is the start of a range.
 *
 * 检查某个值是否为范围的起始日期。
 *
 */
function isStart(value: number, start: number | null, end: number | null): boolean {
  return end !== null && start !== end && value < end && value === start;
}

/**
 * Checks whether a value is the end of a range.
 *
 * 检查某个值是否为范围的结束日期。
 *
 */
function isEnd(value: number, start: number | null, end: number | null): boolean {
  return start !== null && start !== end && value >= start && value === end;
}

/**
 * Checks whether a value is inside of a range.
 *
 * 检查某个值是否在某个范围内。
 *
 */
function isInRange(
  value: number,
  start: number | null,
  end: number | null,
  rangeEnabled: boolean,
): boolean {
  return (
    rangeEnabled &&
    start !== null &&
    end !== null &&
    start !== end &&
    value >= start &&
    value <= end
  );
}

/**
 * Extracts the element that actually corresponds to a touch event's location
 * (rather than the element that initiated the sequence of touch events).
 *
 * 提取实际对应于触控事件位置的元素（而不是启动触控事件序列的元素）。
 *
 */
function getActualTouchTarget(event: TouchEvent): Element | null {
  const touchLocation = event.changedTouches[0];
  return document.elementFromPoint(touchLocation.clientX, touchLocation.clientY);
}
