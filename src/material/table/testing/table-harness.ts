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
  ContentContainerComponentHarness,
  HarnessPredicate,
  parallel,
} from '@angular/cdk/testing';
import {
  MatFooterRowHarness,
  MatHeaderRowHarness,
  MatRowHarness,
  MatRowHarnessColumnsText,
} from './row-harness';
import {RowHarnessFilters, TableHarnessFilters} from './table-harness-filters';

/**
 * Text extracted from a table organized by columns.
 *
 * 从按列组织的表中提取的文本。
 *
 */
export interface MatTableHarnessColumnsText {
  [columnName: string]: {
    text: string[];
    headerText: string[];
    footerText: string[];
  };
}

interface RowBase extends ComponentHarness {
  getCellTextByColumnName(): Promise<MatRowHarnessColumnsText>;
  getCellTextByIndex(): Promise<string[]>;
}

export abstract class _MatTableHarnessBase<
  HeaderRowType extends ComponentHarnessConstructor<HeaderRow> & {
    with: (options?: RowHarnessFilters) => HarnessPredicate<HeaderRow>;
  },
  HeaderRow extends RowBase,
  RowType extends ComponentHarnessConstructor<Row> & {
    with: (options?: RowHarnessFilters) => HarnessPredicate<Row>;
  },
  Row extends RowBase,
  FooterRowType extends ComponentHarnessConstructor<FooterRow> & {
    with: (options?: RowHarnessFilters) => HarnessPredicate<FooterRow>;
  },
  FooterRow extends RowBase,
> extends ContentContainerComponentHarness<string> {
  protected abstract _headerRowHarness: HeaderRowType;
  protected abstract _rowHarness: RowType;
  protected abstract _footerRowHarness: FooterRowType;

  /**
   * Gets all of the header rows in a table.
   *
   * 获取表中的所有标题行。
   *
   */
  async getHeaderRows(filter: RowHarnessFilters = {}): Promise<HeaderRow[]> {
    return this.locatorForAll(this._headerRowHarness.with(filter))();
  }

  /**
   * Gets all of the regular data rows in a table.
   *
   * 获取表中的所有常规数据行。
   *
   */
  async getRows(filter: RowHarnessFilters = {}): Promise<Row[]> {
    return this.locatorForAll(this._rowHarness.with(filter))();
  }

  /**
   * Gets all of the footer rows in a table.
   *
   * 获取表中的所有表尾行。
   *
   */
  async getFooterRows(filter: RowHarnessFilters = {}): Promise<FooterRow[]> {
    return this.locatorForAll(this._footerRowHarness.with(filter))();
  }

  /**
   * Gets the text inside the entire table organized by rows.
   *
   * 获取按行组织的整个表中的文本。
   *
   */
  async getCellTextByIndex(): Promise<string[][]> {
    const rows = await this.getRows();
    return parallel(() => rows.map(row => row.getCellTextByIndex()));
  }

  /**
   * Gets the text inside the entire table organized by columns.
   *
   * 获取按列组织的整个表中的文本。
   *
   */
  async getCellTextByColumnName(): Promise<MatTableHarnessColumnsText> {
    const [headerRows, footerRows, dataRows] = await parallel(() => [
      this.getHeaderRows(),
      this.getFooterRows(),
      this.getRows(),
    ]);

    const text: MatTableHarnessColumnsText = {};
    const [headerData, footerData, rowsData] = await parallel(() => [
      parallel(() => headerRows.map(row => row.getCellTextByColumnName())),
      parallel(() => footerRows.map(row => row.getCellTextByColumnName())),
      parallel(() => dataRows.map(row => row.getCellTextByColumnName())),
    ]);

    rowsData.forEach(data => {
      Object.keys(data).forEach(columnName => {
        const cellText = data[columnName];

        if (!text[columnName]) {
          text[columnName] = {
            headerText: getCellTextsByColumn(headerData, columnName),
            footerText: getCellTextsByColumn(footerData, columnName),
            text: [],
          };
        }

        text[columnName].text.push(cellText);
      });
    });

    return text;
  }
}

/**
 * Harness for interacting with an MDC-based mat-table in tests.
 *
 * 在测试中与标准 mat-table 进行交互的测试工具。
 *
 */
export class MatTableHarness extends _MatTableHarnessBase<
  typeof MatHeaderRowHarness,
  MatHeaderRowHarness,
  typeof MatRowHarness,
  MatRowHarness,
  typeof MatFooterRowHarness,
  MatFooterRowHarness
> {
  /**
   * The selector for the host element of a `MatTableHarness` instance.
   *
   * `MatTableHarness` 实例的宿主元素选择器。
   *
   */
  static hostSelector = '.mat-mdc-table';
  protected _headerRowHarness = MatHeaderRowHarness;
  protected _rowHarness = MatRowHarness;
  protected _footerRowHarness = MatFooterRowHarness;

  /**
   * Gets a `HarnessPredicate` that can be used to search for a table with specific attributes.
   *
   * 获取一个 `HarnessPredicate`，该 HarnessPredicate 可用于搜索具有特定属性的表。
   *
   * @param options Options for narrowing the search
   *
   * 收窄搜索范围的选项
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 使用给定选项配置过的 `HarnessPredicate`
   *
   */
  static with<T extends MatTableHarness>(
    this: ComponentHarnessConstructor<T>,
    options: TableHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options);
  }
}

/**
 * Extracts the text of cells only under a particular column.
 *
 * 仅提取特定列下的单元格文本。
 *
 */
function getCellTextsByColumn(rowsData: MatRowHarnessColumnsText[], column: string): string[] {
  const columnTexts: string[] = [];

  rowsData.forEach(data => {
    Object.keys(data).forEach(columnName => {
      if (columnName === column) {
        columnTexts.push(data[columnName]);
      }
    });
  });

  return columnTexts;
}
