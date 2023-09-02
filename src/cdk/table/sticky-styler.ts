/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

/**
 * Directions that can be used when setting sticky positioning.
 * @docs-private
 */
import {Direction} from '@angular/cdk/bidi';
import {_CoalescedStyleScheduler} from './coalesced-style-scheduler';
import {StickyPositioningListener} from './sticky-position-listener';

export type StickyDirection = 'top' | 'bottom' | 'left' | 'right';

/**
 * List of all possible directions that can be used for sticky positioning.
 *
 * 可用于粘性定位的所有方向列表。
 *
 * @docs-private
 */
export const STICKY_DIRECTIONS: StickyDirection[] = ['top', 'bottom', 'left', 'right'];

/**
 * Applies and removes sticky positioning styles to the `CdkTable` rows and columns cells.
 *
 * 在 `CdkTable` 行列单元格中应用和删除粘性定位样式。
 *
 * @docs-private
 */
export class StickyStyler {
  private _cachedCellWidths: number[] = [];
  private readonly _borderCellCss: Readonly<{[d in StickyDirection]: string}>;

  /**
   * @param _isNativeHtmlTable Whether the sticky logic should be based on a table
   *     that uses the native `<table>` element.
   *
   * 粘性逻辑是否应该基于一个使用原生 `<table>` 元素的表格。
   * @param _stickCellCss The CSS class that will be applied to every row/cell that has
   *     sticky positioning applied.
   *
   * 这个 CSS 类会应用于那些应用了粘性定位的行/单元格。
   * @param direction The directionality context of the table \(ltr/rtl\); affects column positioning
   *     by reversing left/right positions.
   *
   * 该表的方向性上下文（ltr/rtl）；通过反转左/右位置来影响列的定位。
   *
   * @param _isBrowser Whether the table is currently being rendered on the server or the client.
   *
   * 表格当前是在服务器端还是客户端上渲染的。
   * @param _needsPositionStickyOnElement Whether we need to specify position: sticky on cells
   *     using inline styles. If false, it is assumed that position: sticky is included in
   *     the component stylesheet for \_stickCellCss.
   *
   * 我们是否需要使用内联样式指定 position: sticky。如果为 false，则假定 position: sticky 包含在 \_stickCellCss 组件样式表中。
   * @param _positionListener A listener that is notified of changes to sticky rows/columns
   *     and their dimensions.
   *
   * 接收粘性行/列及其规格变更通知的监听器。
   */
  constructor(
    private _isNativeHtmlTable: boolean,
    private _stickCellCss: string,
    public direction: Direction,
    private _coalescedStyleScheduler: _CoalescedStyleScheduler,
    private _isBrowser = true,
    private readonly _needsPositionStickyOnElement = true,
    private readonly _positionListener?: StickyPositioningListener,
  ) {
    this._borderCellCss = {
      'top': `${_stickCellCss}-border-elem-top`,
      'bottom': `${_stickCellCss}-border-elem-bottom`,
      'left': `${_stickCellCss}-border-elem-left`,
      'right': `${_stickCellCss}-border-elem-right`,
    };
  }

  /**
   * Clears the sticky positioning styles from the row and its cells by resetting the `position`
   * style, setting the zIndex to 0, and unsetting each provided sticky direction.
   *
   * 通过重置 `position` 样式，将 zIndex 设置为 0，并取消设置每个提供的粘性方向，清除该行及其单元格中的粘性定位样式。
   *
   * @param rows The list of rows that should be cleared from sticking in the provided directions
   *
   * 那些应该从所提供的粘性方向中清除的行列表
   *
   * @param stickyDirections The directions that should no longer be set as sticky on the rows.
   *
   * 那些不应再把行粘附到的方向。
   *
   */
  clearStickyPositioning(rows: HTMLElement[], stickyDirections: StickyDirection[]) {
    const elementsToClear: HTMLElement[] = [];
    for (const row of rows) {
      // If the row isn't an element (e.g. if it's an `ng-container`),
      // it won't have inline styles or `children` so we skip it.
      if (row.nodeType !== row.ELEMENT_NODE) {
        continue;
      }

      elementsToClear.push(row);
      for (let i = 0; i < row.children.length; i++) {
        elementsToClear.push(row.children[i] as HTMLElement);
      }
    }

    // Coalesce with sticky row/column updates (and potentially other changes like column resize).
    this._coalescedStyleScheduler.schedule(() => {
      for (const element of elementsToClear) {
        this._removeStickyStyle(element, stickyDirections);
      }
    });
  }

  /**
   * Applies sticky left and right positions to the cells of each row according to the sticky
   * states of the rendered column definitions.
   *
   * 根据要渲染的列定义中规定的粘性状态，在每行的单元格中应用要粘附到的左右位置。
   *
   * @param rows The rows that should have its set of cells stuck according to the sticky states.
   *
   * 那些应该让其单元格根据粘性状态粘住的行。
   *
   * @param stickyStartStates A list of boolean states where each state represents whether the cell
   *     in this index position should be stuck to the start of the row.
   *
   * 一个布尔型状态列表，其中每个状态表示该索引位置的单元格是否应该粘在该行的开头。
   *
   * @param stickyEndStates A list of boolean states where each state represents whether the cell
   *     in this index position should be stuck to the end of the row.
   *
   * 一个布尔型状态列表，其中每个状态表示该索引位置的单元格是否应该粘在该行的末尾。
   *
   * @param recalculateCellWidths Whether the sticky styler should recalculate the width of each
   *     column cell. If `false` cached widths will be used instead.
   *
   * 粘性样式器是否应该重新计算每个列单元格的宽度。如果为 `false` 就改用缓存中的宽度。
   *
   */
  updateStickyColumns(
    rows: HTMLElement[],
    stickyStartStates: boolean[],
    stickyEndStates: boolean[],
    recalculateCellWidths = true,
  ) {
    if (
      !rows.length ||
      !this._isBrowser ||
      !(stickyStartStates.some(state => state) || stickyEndStates.some(state => state))
    ) {
      if (this._positionListener) {
        this._positionListener.stickyColumnsUpdated({sizes: []});
        this._positionListener.stickyEndColumnsUpdated({sizes: []});
      }

      return;
    }

    const firstRow = rows[0];
    const numCells = firstRow.children.length;
    const cellWidths: number[] = this._getCellWidths(firstRow, recalculateCellWidths);

    const startPositions = this._getStickyStartColumnPositions(cellWidths, stickyStartStates);
    const endPositions = this._getStickyEndColumnPositions(cellWidths, stickyEndStates);

    const lastStickyStart = stickyStartStates.lastIndexOf(true);
    const firstStickyEnd = stickyEndStates.indexOf(true);

    // Coalesce with sticky row updates (and potentially other changes like column resize).
    this._coalescedStyleScheduler.schedule(() => {
      const isRtl = this.direction === 'rtl';
      const start = isRtl ? 'right' : 'left';
      const end = isRtl ? 'left' : 'right';

      for (const row of rows) {
        for (let i = 0; i < numCells; i++) {
          const cell = row.children[i] as HTMLElement;
          if (stickyStartStates[i]) {
            this._addStickyStyle(cell, start, startPositions[i], i === lastStickyStart);
          }

          if (stickyEndStates[i]) {
            this._addStickyStyle(cell, end, endPositions[i], i === firstStickyEnd);
          }
        }
      }

      if (this._positionListener) {
        this._positionListener.stickyColumnsUpdated({
          sizes:
            lastStickyStart === -1
              ? []
              : cellWidths
                  .slice(0, lastStickyStart + 1)
                  .map((width, index) => (stickyStartStates[index] ? width : null)),
        });
        this._positionListener.stickyEndColumnsUpdated({
          sizes:
            firstStickyEnd === -1
              ? []
              : cellWidths
                  .slice(firstStickyEnd)
                  .map((width, index) => (stickyEndStates[index + firstStickyEnd] ? width : null))
                  .reverse(),
        });
      }
    });
  }

  /**
   * Applies sticky positioning to the row's cells if using the native table layout, and to the
   * row itself otherwise.
   *
   * 如果使用原生表格布局，则对该行的单元格应用粘性定位，否则应用于该行本身。
   *
   * @param rowsToStick The list of rows that should be stuck according to their corresponding
   *     sticky state and to the provided top or bottom position.
   *
   * 行的列表，这些行应该根据对应的粘性状态和所提供的顶部或底部位置进行粘附。
   *
   * @param stickyStates A list of boolean states where each state represents whether the row
   *     should be stuck in the particular top or bottom position.
   *
   * 一个布尔状态列表，其中每个状态表示该行是否应该停留在特定的顶部或底部位置。
   *
   * @param position The position direction in which the row should be stuck if that row should be
   *     sticky.
   *
   * 如果该行应该被粘住，这个参数表输出它应该被粘附到的位置。
   *
   */
  stickRows(rowsToStick: HTMLElement[], stickyStates: boolean[], position: 'top' | 'bottom') {
    // Since we can't measure the rows on the server, we can't stick the rows properly.
    if (!this._isBrowser) {
      return;
    }

    // If positioning the rows to the bottom, reverse their order when evaluating the sticky
    // position such that the last row stuck will be "bottom: 0px" and so on. Note that the
    // sticky states need to be reversed as well.
    const rows = position === 'bottom' ? rowsToStick.slice().reverse() : rowsToStick;
    const states = position === 'bottom' ? stickyStates.slice().reverse() : stickyStates;

    // Measure row heights all at once before adding sticky styles to reduce layout thrashing.
    const stickyOffsets: number[] = [];
    const stickyCellHeights: (number | undefined)[] = [];
    const elementsToStick: HTMLElement[][] = [];
    for (let rowIndex = 0, stickyOffset = 0; rowIndex < rows.length; rowIndex++) {
      if (!states[rowIndex]) {
        continue;
      }

      stickyOffsets[rowIndex] = stickyOffset;
      const row = rows[rowIndex];
      elementsToStick[rowIndex] = this._isNativeHtmlTable
        ? (Array.from(row.children) as HTMLElement[])
        : [row];

      const height = row.getBoundingClientRect().height;
      stickyOffset += height;
      stickyCellHeights[rowIndex] = height;
    }

    const borderedRowIndex = states.lastIndexOf(true);

    // Coalesce with other sticky row updates (top/bottom), sticky columns updates
    // (and potentially other changes like column resize).
    this._coalescedStyleScheduler.schedule(() => {
      for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
        if (!states[rowIndex]) {
          continue;
        }

        const offset = stickyOffsets[rowIndex];
        const isBorderedRowIndex = rowIndex === borderedRowIndex;
        for (const element of elementsToStick[rowIndex]) {
          this._addStickyStyle(element, position, offset, isBorderedRowIndex);
        }
      }

      if (position === 'top') {
        this._positionListener?.stickyHeaderRowsUpdated({
          sizes: stickyCellHeights,
          offsets: stickyOffsets,
          elements: elementsToStick,
        });
      } else {
        this._positionListener?.stickyFooterRowsUpdated({
          sizes: stickyCellHeights,
          offsets: stickyOffsets,
          elements: elementsToStick,
        });
      }
    });
  }

  /**
   * When using the native table in Safari, sticky footer cells do not stick. The only way to stick
   * footer rows is to apply sticky styling to the tfoot container. This should only be done if
   * all footer rows are sticky. If not all footer rows are sticky, remove sticky positioning from
   * the tfoot element.
   *
   * 在 Safari 中使用原生表格时，粘性表尾单元格无法粘住。粘住表尾行的唯一方法就是把粘性样式应用到 tfoot 容器中。
   * 这只在所有的表尾都要粘住的时候才行。如果并非所有的表尾行都要粘住，就要从 tfoot 元素中移除粘性定位。
   *
   */
  updateStickyFooterContainer(tableElement: Element, stickyStates: boolean[]) {
    if (!this._isNativeHtmlTable) {
      return;
    }

    const tfoot = tableElement.querySelector('tfoot')!;

    // Coalesce with other sticky updates (and potentially other changes like column resize).
    this._coalescedStyleScheduler.schedule(() => {
      if (stickyStates.some(state => !state)) {
        this._removeStickyStyle(tfoot, ['bottom']);
      } else {
        this._addStickyStyle(tfoot, 'bottom', 0, false);
      }
    });
  }

  /**
   * Removes the sticky style on the element by removing the sticky cell CSS class, re-evaluating
   * the zIndex, removing each of the provided sticky directions, and removing the
   * sticky position if there are no more directions.
   *
   * 删除此元素上的粘性样式 —— 删除粘性单元格 CSS 类，重新计算 zIndex，移除所提供的每个粘性方向，并删除粘性位置（如果没有更多方向指令）。
   *
   */
  _removeStickyStyle(element: HTMLElement, stickyDirections: StickyDirection[]) {
    for (const dir of stickyDirections) {
      element.style[dir] = '';
      element.classList.remove(this._borderCellCss[dir]);
    }

    // If the element no longer has any more sticky directions, remove sticky positioning and
    // the sticky CSS class.
    // Short-circuit checking element.style[dir] for stickyDirections as they
    // were already removed above.
    const hasDirection = STICKY_DIRECTIONS.some(
      dir => stickyDirections.indexOf(dir) === -1 && element.style[dir],
    );
    if (hasDirection) {
      element.style.zIndex = this._getCalculatedZIndex(element);
    } else {
      // When not hasDirection, _getCalculatedZIndex will always return ''.
      element.style.zIndex = '';
      if (this._needsPositionStickyOnElement) {
        element.style.position = '';
      }
      element.classList.remove(this._stickCellCss);
    }
  }

  /**
   * Adds the sticky styling to the element by adding the sticky style class, changing position
   * to be sticky \(and -webkit-sticky\), setting the appropriate zIndex, and adding a sticky
   * direction and value.
   *
   * 为该元素添加粘性样式 —— 添加粘性样式类，修改粘附到的位置（和-webkit-sticky），设置合适的 zIndex，添加粘附的方向和值。
   *
   */
  _addStickyStyle(
    element: HTMLElement,
    dir: StickyDirection,
    dirValue: number,
    isBorderElement: boolean,
  ) {
    element.classList.add(this._stickCellCss);
    if (isBorderElement) {
      element.classList.add(this._borderCellCss[dir]);
    }
    element.style[dir] = `${dirValue}px`;
    element.style.zIndex = this._getCalculatedZIndex(element);
    if (this._needsPositionStickyOnElement) {
      element.style.cssText += 'position: -webkit-sticky; position: sticky; ';
    }
  }

  /**
   * Calculate what the z-index should be for the element, depending on what directions \(top,
   * bottom, left, right\) have been set. It should be true that elements with a top direction
   * should have the highest index since these are elements like a table header. If any of those
   * elements are also sticky in another direction, then they should appear above other elements
   * that are only sticky top \(e.g. a sticky column on a sticky header\). Bottom-sticky elements
   * \(e.g. footer rows\) should then be next in the ordering such that they are below the header
   * but above any non-sticky elements. Finally, left/right sticky elements \(e.g. sticky columns\)
   * should minimally increment so that they are above non-sticky elements but below top and bottom
   * elements.
   *
   * 根据设置的方向（上，下，左，右），计算该元素的 z-index 值。原则上，具有粘附到顶部的元素应具有最高的索引，因为它们是像表头一样的元素。
   * 如果这些元素中的任何一个同时要粘附到另一个方向，那么它们应该出现在其它仅粘性顶部的元素之上（比如粘性表头上的粘性列）。
   * 底部粘性元素（例如表尾行）应该是顺序中的下一个，这样它们就会低于表头，但会高于任何非粘性元素。
   * 最后，粘附到左/右元素（例如粘性列）应该递增的最少，以便它们位于非粘性元素的上方，但位于顶部和底部元素的下方。
   *
   */
  _getCalculatedZIndex(element: HTMLElement): string {
    const zIndexIncrements = {
      top: 100,
      bottom: 10,
      left: 1,
      right: 1,
    };

    let zIndex = 0;
    // Use `Iterable` instead of `Array` because TypeScript, as of 3.6.3,
    // loses the array generic type in the `for of`. But we *also* have to use `Array` because
    // typescript won't iterate over an `Iterable` unless you compile with `--downlevelIteration`
    for (const dir of STICKY_DIRECTIONS as Iterable<StickyDirection> & StickyDirection[]) {
      if (element.style[dir]) {
        zIndex += zIndexIncrements[dir];
      }
    }

    return zIndex ? `${zIndex}` : '';
  }

  /**
   * Gets the widths for each cell in the provided row.
   *
   * 获取提供的行中每个单元格的宽度。
   *
   */
  _getCellWidths(row: HTMLElement, recalculateCellWidths = true): number[] {
    if (!recalculateCellWidths && this._cachedCellWidths.length) {
      return this._cachedCellWidths;
    }

    const cellWidths: number[] = [];
    const firstRowCells = row.children;
    for (let i = 0; i < firstRowCells.length; i++) {
      let cell: HTMLElement = firstRowCells[i] as HTMLElement;
      cellWidths.push(cell.getBoundingClientRect().width);
    }

    this._cachedCellWidths = cellWidths;
    return cellWidths;
  }

  /**
   * Determines the left and right positions of each sticky column cell, which will be the
   * accumulation of all sticky column cell widths to the left and right, respectively.
   * Non-sticky cells do not need to have a value set since their positions will not be applied.
   *
   * 确定每个粘性列单元格的左右位置，它们分别是左右两侧粘性列单元格宽度的累加。非粘性单元格不需要有值，因为它们的位置不会被应用。
   *
   */
  _getStickyStartColumnPositions(widths: number[], stickyStates: boolean[]): number[] {
    const positions: number[] = [];
    let nextPosition = 0;

    for (let i = 0; i < widths.length; i++) {
      if (stickyStates[i]) {
        positions[i] = nextPosition;
        nextPosition += widths[i];
      }
    }

    return positions;
  }

  /**
   * Determines the left and right positions of each sticky column cell, which will be the
   * accumulation of all sticky column cell widths to the left and right, respectively.
   * Non-sticky cells do not need to have a value set since their positions will not be applied.
   *
   * 确定每个粘性列单元格的左右位置，它们分别是左右两侧粘性列单元格宽度的累加。非粘性单元格不需要有值，因为它们的位置不会被应用。
   *
   */
  _getStickyEndColumnPositions(widths: number[], stickyStates: boolean[]): number[] {
    const positions: number[] = [];
    let nextPosition = 0;

    for (let i = widths.length; i > 0; i--) {
      if (stickyStates[i]) {
        positions[i] = nextPosition;
        nextPosition += widths[i];
      }
    }

    return positions;
  }
}
