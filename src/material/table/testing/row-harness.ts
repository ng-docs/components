/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  ComponentHarness,
  ComponentHarnessConstructor,
  HarnessPredicate,
  parallel,
} from '@angular/cdk/testing';
import {
  _MatCellHarnessBase,
  MatCellHarness,
  MatFooterCellHarness,
  MatHeaderCellHarness,
} from './cell-harness';
import {CellHarnessFilters, RowHarnessFilters} from './table-harness-filters';

/**
 * Text extracted from a table row organized by columns.
 *
 * 从按列组织的表行中提取的文本。
 *
 */
export interface MatRowHarnessColumnsText {
  [columnName: string]: string;
}

export abstract class _MatRowHarnessBase<
  CellType extends ComponentHarnessConstructor<Cell> & {
    with: (options?: CellHarnessFilters) => HarnessPredicate<Cell>;
  },
  Cell extends _MatCellHarnessBase,
> extends ComponentHarness {
  protected abstract _cellHarness: CellType;

  /**
   * Gets a list of `MatCellHarness` for all cells in the row.
   *
   * 获取此行中所有单元格的 `MatCellHarness` 列表。
   *
   */
  async getCells(filter: CellHarnessFilters = {}): Promise<Cell[]> {
    return this.locatorForAll(this._cellHarness.with(filter))();
  }

  /**
   * Gets the text of the cells in the row.
   *
   * 获取此行中单元格的文本。
   *
   */
  async getCellTextByIndex(filter: CellHarnessFilters = {}): Promise<string[]> {
    const cells = await this.getCells(filter);
    return parallel(() => cells.map(cell => cell.getText()));
  }

  /**
   * Gets the text inside the row organized by columns.
   *
   * 获取按列组织的此行内的文本。
   *
   */
  async getCellTextByColumnName(): Promise<MatRowHarnessColumnsText> {
    const output: MatRowHarnessColumnsText = {};
    const cells = await this.getCells();
    const cellsData = await parallel(() =>
      cells.map(cell => {
        return parallel(() => [cell.getColumnName(), cell.getText()]);
      }),
    );
    cellsData.forEach(([columnName, text]) => (output[columnName] = text));
    return output;
  }
}

/**
 * Harness for interacting with an MDC-based Angular Material table row.
 *
 * 与标准 Angular Material 表行进行交互的测试工具。
 *
 */
export class MatRowHarness extends _MatRowHarnessBase<typeof MatCellHarness, MatCellHarness> {
  /**
   * The selector for the host element of a `MatRowHarness` instance.
   *
   * `MatRowHarness` 实例的宿主元素选择器。
   *
   */
  static hostSelector = '.mat-mdc-row';
  protected _cellHarness = MatCellHarness;

  /**
   * Gets a `HarnessPredicate` that can be used to search for a table row with specific attributes.
   *
   * 获取一个可用来使用指定属性搜索表行的 `HarnessPredicate`。
   *
   * @param options Options for narrowing the search
   *
   * 收窄搜索范围的选项
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with<T extends MatRowHarness>(
    this: ComponentHarnessConstructor<T>,
    options: RowHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options);
  }
}

/**
 * Harness for interacting with an MDC-based Angular Material table header row.
 *
 * 与标准 Angular Material 表标题行进行交互的测试工具。
 *
 */
export class MatHeaderRowHarness extends _MatRowHarnessBase<
  typeof MatHeaderCellHarness,
  MatHeaderCellHarness
> {
  /**
   * The selector for the host element of a `MatHeaderRowHarness` instance.
   *
   * `MatHeaderRowHarness` 实例的宿主元素选择器。
   *
   */
  static hostSelector = '.mat-mdc-header-row';
  protected _cellHarness = MatHeaderCellHarness;

  /**
   * Gets a `HarnessPredicate` that can be used to search for a table header row with specific
   * attributes.
   *
   * 获取 `HarnessPredicate`，该 HarnessPredicate 可用于搜索具有特定属性的表标题行。
   *
   * @param options Options for narrowing the search
   *
   * 收窄搜索范围的选项
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with<T extends MatHeaderRowHarness>(
    this: ComponentHarnessConstructor<T>,
    options: RowHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options);
  }
}

/**
 * Harness for interacting with an MDC-based Angular Material table footer row.
 *
 * 与标准 Angular Material 表的页脚行进行交互的测试工具。
 *
 */
export class MatFooterRowHarness extends _MatRowHarnessBase<
  typeof MatFooterCellHarness,
  MatFooterCellHarness
> {
  /**
   * The selector for the host element of a `MatFooterRowHarness` instance.
   *
   * `MatFooterRowHarness` 实例的宿主元素选择器。
   *
   */
  static hostSelector = '.mat-mdc-footer-row';
  protected _cellHarness = MatFooterCellHarness;

  /**
   * Gets a `HarnessPredicate` that can be used to search for a table footer row cell with specific
   * attributes.
   *
   * 获取 `HarnessPredicate`，该 HarnessPredicate 可用于搜索具有特定属性的表格页脚行单元格。
   *
   * @param options Options for narrowing the search
   *
   * 收窄搜索范围的选项
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with<T extends MatFooterRowHarness>(
    this: ComponentHarnessConstructor<T>,
    options: RowHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options);
  }
}
