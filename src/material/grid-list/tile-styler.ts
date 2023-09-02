/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {QueryList} from '@angular/core';
import {MatGridTile} from './grid-tile';
import {TileCoordinator} from './tile-coordinator';

/**
 * RegExp that can be used to check whether a value will
 * be allowed inside a CSS `calc()` expression.
 *
 * 这个 RegExp 可以用来检查 CSS `calc()` 表达式中是否允许一个值。
 *
 */
const cssCalcAllowedValue = /^-?\d+((\.\d+)?[A-Za-z%$]?)+$/;

/**
 * Object that can be styled by the `TileStyler`.
 *
 * 可以由 `TileStyler` 添加样式的对象。
 *
 */
export interface TileStyleTarget {
  _setListStyle(style: [string, string | null] | null): void;
  _tiles: QueryList<MatGridTile>;
}

/**
 * Sets the style properties for an individual tile, given the position calculated by the
 * Tile Coordinator.
 *
 * 根据图块协调器计算出的位置，设置各个图块的样式属性。
 *
 * @docs-private
 */
export abstract class TileStyler {
  _gutterSize: string;
  _rows: number = 0;
  _rowspan: number = 0;
  _cols: number;
  _direction: string;

  /**
   * Adds grid-list layout info once it is available. Cannot be processed in the constructor
   * because these properties haven't been calculated by that point.
   *
   * 网格列表布局信息一旦可用，就会添加它们。无法在构造函数中处理，因为那时候这些属性还没有计算过。
   *
   * @param gutterSize Size of the grid's gutter.
   *
   * 网格间隙的大小。
   *
   * @param tracker Instance of the TileCoordinator.
   *
   * 图块协调器（TileCoordinator）的实例
   *
   * @param cols Amount of columns in the grid.
   *
   * 网格中的列数。
   *
   * @param direction Layout direction of the grid.
   *
   * 网格的布局方向。
   *
   */
  init(gutterSize: string, tracker: TileCoordinator, cols: number, direction: string): void {
    this._gutterSize = normalizeUnits(gutterSize);
    this._rows = tracker.rowCount;
    this._rowspan = tracker.rowspan;
    this._cols = cols;
    this._direction = direction;
  }

  /**
   * Computes the amount of space a single 1x1 tile would take up \(width or height\).
   * Used as a basis for other calculations.
   *
   * 计算单个 1x1 图块占用的空间量（宽度或高度）。用作其它计算的基础。
   *
   * @param sizePercent Percent of the total grid-list space that one 1x1 tile would take up.
   *
   * 一个 1x1 图块占用的网格列表总空间的百分比。
   * @param gutterFraction Fraction of the gutter size taken up by one 1x1 tile.
   *
   * 一个 1x1 的图块占间隙尺寸的多大比例。
   *
   * @return The size of a 1x1 tile as an expression that can be evaluated via CSS calc\(\).
   *
   * 1x1 图块的大小表达式，可以通过 CSS calc\(\) 来计算。
   *
   */
  getBaseTileSize(sizePercent: number, gutterFraction: number): string {
    // Take the base size percent (as would be if evenly dividing the size between cells),
    // and then subtracting the size of one gutter. However, since there are no gutters on the
    // edges, each tile only uses a fraction (gutterShare = numGutters / numCells) of the gutter
    // size. (Imagine having one gutter per tile, and then breaking up the extra gutter on the
    // edge evenly among the cells).
    return `(${sizePercent}% - (${this._gutterSize} * ${gutterFraction}))`;
  }

  /**
   * Gets The horizontal or vertical position of a tile, e.g., the 'top' or 'left' property value.
   *
   * 获取图块的水平或垂直位置，例如'top'或'left'属性值。
   *
   * @param offset Number of tiles that have already been rendered in the row/column.
   *
   * 那些已在行/列中渲染过的图块数量。
   * @param baseSize Base size of a 1x1 tile \(as computed in getBaseTileSize\).
   *
   * 1x1 图块的基本大小（在 getBaseTileSize 中计算）。
   *
   * @return Position of the tile as a CSS calc\(\) expression.
   *
   * 图块位置的 CSS calc\(\) 表达式形式。
   *
   */
  getTilePosition(baseSize: string, offset: number): string {
    // The position comes the size of a 1x1 tile plus gutter for each previous tile in the
    // row/column (offset).
    return offset === 0 ? '0' : calc(`(${baseSize} + ${this._gutterSize}) * ${offset}`);
  }

  /**
   * Gets the actual size of a tile, e.g., width or height, taking rowspan or colspan into account.
   *
   * 获取图块的实际大小，比如 width: height，考虑了 rowspan 或 colspan。
   *
   * @param baseSize Base size of a 1x1 tile \(as computed in getBaseTileSize\).
   *
   * 1x1 图块的基本大小（在 getBaseTileSize 中计算）。
   *
   * @param span The tile's rowspan or colspan.
   *
   * 图块的 rowspan 或 colspan。
   * @return Size of the tile as a CSS calc\(\) expression.
   *
   * 图块大小的 CSS calc\(\) 表达式形式。
   *
   */
  getTileSize(baseSize: string, span: number): string {
    return `(${baseSize} * ${span}) + (${span - 1} * ${this._gutterSize})`;
  }

  /**
   * Sets the style properties to be applied to a tile for the given row and column index.
   *
   * 为指定的行和列索引设置要应用于图块的样式属性。
   *
   * @param tile Tile to which to apply the styling.
   *
   * 要应用样式的图块。
   *
   * @param rowIndex Index of the tile's row.
   *
   * 图块的行索引。
   *
   * @param colIndex Index of the tile's column.
   *
   * 图块的列索引。
   *
   */
  setStyle(tile: MatGridTile, rowIndex: number, colIndex: number): void {
    // Percent of the available horizontal space that one column takes up.
    let percentWidthPerTile = 100 / this._cols;

    // Fraction of the vertical gutter size that each column takes up.
    // For example, if there are 5 columns, each column uses 4/5 = 0.8 times the gutter width.
    let gutterWidthFractionPerTile = (this._cols - 1) / this._cols;

    this.setColStyles(tile, colIndex, percentWidthPerTile, gutterWidthFractionPerTile);
    this.setRowStyles(tile, rowIndex, percentWidthPerTile, gutterWidthFractionPerTile);
  }

  /**
   * Sets the horizontal placement of the tile in the list.
   *
   * 在列表中设置图块的水平位置。
   *
   */
  setColStyles(tile: MatGridTile, colIndex: number, percentWidth: number, gutterWidth: number) {
    // Base horizontal size of a column.
    let baseTileWidth = this.getBaseTileSize(percentWidth, gutterWidth);

    // The width and horizontal position of each tile is always calculated the same way, but the
    // height and vertical position depends on the rowMode.
    let side = this._direction === 'rtl' ? 'right' : 'left';
    tile._setStyle(side, this.getTilePosition(baseTileWidth, colIndex));
    tile._setStyle('width', calc(this.getTileSize(baseTileWidth, tile.colspan)));
  }

  /**
   * Calculates the total size taken up by gutters across one axis of a list.
   *
   * 计算列表中某个轴上的装订线占用的总大小。
   *
   */
  getGutterSpan(): string {
    return `${this._gutterSize} * (${this._rowspan} - 1)`;
  }

  /**
   * Calculates the total size taken up by tiles across one axis of a list.
   *
   * 计算图块在列表中某个轴上占用的总大小。
   *
   * @param tileHeight Height of the tile.
   *
   * 图块的高度。
   *
   */
  getTileSpan(tileHeight: string): string {
    return `${this._rowspan} * ${this.getTileSize(tileHeight, 1)}`;
  }

  /**
   * Sets the vertical placement of the tile in the list.
   * This method will be implemented by each type of TileStyler.
   *
   * 在列表中设置图块的垂直位置。这个方法会由 TileStyler 的每种类型进行实现。
   *
   * @docs-private
   */
  abstract setRowStyles(
    tile: MatGridTile,
    rowIndex: number,
    percentWidth: number,
    gutterWidth: number,
  ): void;

  /**
   * Calculates the computed height and returns the correct style property to set.
   * This method can be implemented by each type of TileStyler.
   *
   * 对已计算高度进行计算，并返回要设置的正确样式属性。这个方法会由 TileStyler 的每种类型进行实现。
   *
   * @docs-private
   */
  getComputedHeight(): [string, string] | null {
    return null;
  }

  /**
   * Called when the tile styler is swapped out with a different one. To be used for cleanup.
   *
   * 当把图块样式器换成另一个时调用。用来做清理工作。
   *
   * @param list Grid list that the styler was attached to.
   *
   * 样式表所在的网格列表。
   *
   * @docs-private
   */
  abstract reset(list: TileStyleTarget): void;
}

/**
 * This type of styler is instantiated when the user passes in a fixed row height.
 * Example `<mat-grid-list cols="3" rowHeight="100px">`
 *
 * 当用户传入固定的行高时，就会实例化这种类型的样式器。例如 `<mat-grid-list cols="3" rowHeight="100px">`
 *
 * @docs-private
 */
export class FixedTileStyler extends TileStyler {
  constructor(public fixedRowHeight: string) {
    super();
  }

  override init(gutterSize: string, tracker: TileCoordinator, cols: number, direction: string) {
    super.init(gutterSize, tracker, cols, direction);
    this.fixedRowHeight = normalizeUnits(this.fixedRowHeight);

    if (
      !cssCalcAllowedValue.test(this.fixedRowHeight) &&
      (typeof ngDevMode === 'undefined' || ngDevMode)
    ) {
      throw Error(`Invalid value "${this.fixedRowHeight}" set as rowHeight.`);
    }
  }

  override setRowStyles(tile: MatGridTile, rowIndex: number): void {
    tile._setStyle('top', this.getTilePosition(this.fixedRowHeight, rowIndex));
    tile._setStyle('height', calc(this.getTileSize(this.fixedRowHeight, tile.rowspan)));
  }

  override getComputedHeight(): [string, string] {
    return ['height', calc(`${this.getTileSpan(this.fixedRowHeight)} + ${this.getGutterSpan()}`)];
  }

  override reset(list: TileStyleTarget) {
    list._setListStyle(['height', null]);

    if (list._tiles) {
      list._tiles.forEach(tile => {
        tile._setStyle('top', null);
        tile._setStyle('height', null);
      });
    }
  }
}

/**
 * This type of styler is instantiated when the user passes in a width:height ratio
 * for the row height.  Example `<mat-grid-list cols="3" rowHeight="3:1">`
 *
 * 当用户为行高传入宽高比时，就会实例化这种类型的样式器。例如 `<mat-grid-list cols="3" rowHeight="3:1">`
 *
 * @docs-private
 */
export class RatioTileStyler extends TileStyler {
  /**
   * Ratio width:height given by user to determine row height.
   *
   * 用户指定的宽高比，用于确定行高。
   *
   */
  rowHeightRatio: number;
  baseTileHeight: string;

  constructor(value: string) {
    super();
    this._parseRatio(value);
  }

  setRowStyles(
    tile: MatGridTile,
    rowIndex: number,
    percentWidth: number,
    gutterWidth: number,
  ): void {
    let percentHeightPerTile = percentWidth / this.rowHeightRatio;
    this.baseTileHeight = this.getBaseTileSize(percentHeightPerTile, gutterWidth);

    // Use padding-top and margin-top to maintain the given aspect ratio, as
    // a percentage-based value for these properties is applied versus the *width* of the
    // containing block. See http://www.w3.org/TR/CSS2/box.html#margin-properties
    tile._setStyle('marginTop', this.getTilePosition(this.baseTileHeight, rowIndex));
    tile._setStyle('paddingTop', calc(this.getTileSize(this.baseTileHeight, tile.rowspan)));
  }

  override getComputedHeight(): [string, string] {
    return [
      'paddingBottom',
      calc(`${this.getTileSpan(this.baseTileHeight)} + ${this.getGutterSpan()}`),
    ];
  }

  reset(list: TileStyleTarget) {
    list._setListStyle(['paddingBottom', null]);

    list._tiles.forEach(tile => {
      tile._setStyle('marginTop', null);
      tile._setStyle('paddingTop', null);
    });
  }

  private _parseRatio(value: string): void {
    const ratioParts = value.split(':');

    if (ratioParts.length !== 2 && (typeof ngDevMode === 'undefined' || ngDevMode)) {
      throw Error(`mat-grid-list: invalid ratio given for row-height: "${value}"`);
    }

    this.rowHeightRatio = parseFloat(ratioParts[0]) / parseFloat(ratioParts[1]);
  }
}

/**
 * This type of styler is instantiated when the user selects a "fit" row height mode.
 * In other words, the row height will reflect the total height of the container divided
 * by the number of rows.  Example `<mat-grid-list cols="3" rowHeight="fit">`
 *
 * 当用户选择了行高的“适应”模式时，就会实例化这种类型的样式器。换句话说，行高会反映出容器的总高度除以行数。
 * 例如 `<mat-grid-list cols="3" rowHeight="fit">`
 *
 * @docs-private
 */
export class FitTileStyler extends TileStyler {
  setRowStyles(tile: MatGridTile, rowIndex: number): void {
    // Percent of the available vertical space that one row takes up.
    let percentHeightPerTile = 100 / this._rowspan;

    // Fraction of the horizontal gutter size that each column takes up.
    let gutterHeightPerTile = (this._rows - 1) / this._rows;

    // Base vertical size of a column.
    let baseTileHeight = this.getBaseTileSize(percentHeightPerTile, gutterHeightPerTile);

    tile._setStyle('top', this.getTilePosition(baseTileHeight, rowIndex));
    tile._setStyle('height', calc(this.getTileSize(baseTileHeight, tile.rowspan)));
  }

  reset(list: TileStyleTarget) {
    if (list._tiles) {
      list._tiles.forEach(tile => {
        tile._setStyle('top', null);
        tile._setStyle('height', null);
      });
    }
  }
}

/**
 * Wraps a CSS string in a calc function
 *
 * 把一个 CSS 字符串包裹在 calc 函数中
 *
 */
function calc(exp: string): string {
  return `calc(${exp})`;
}

/**
 * Appends pixels to a CSS string if no units are given.
 *
 * 如果没有给出单位，就把像素追加到 CSS 字符串中。
 *
 */
function normalizeUnits(value: string): string {
  return value.match(/([A-Za-z%]+)$/) ? value : `${value}px`;
}
