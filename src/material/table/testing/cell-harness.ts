/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  HarnessPredicate,
  ComponentHarnessConstructor,
  ContentContainerComponentHarness
} from '@angular/cdk/testing';
import {CellHarnessFilters} from './table-harness-filters';

/**
 * Harness for interacting with a standard Angular Material table cell.
 *
 * 与标准 Angular Material 表的单元格进行交互的测试工具。
 *
 */
export class MatCellHarness extends ContentContainerComponentHarness {
  /**
   * The selector for the host element of a `MatCellHarness` instance.
   *
   * `MatCellHarness` 实例的宿主元素选择器。
   *
   */
  static hostSelector = '.mat-cell';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a table cell with specific attributes.
   *
   * 获取一个可用来使用指定属性搜索表格中单元格的 `HarnessPredicate`。
   *
   * @param options Options for narrowing the search
   *
   * 缩小搜索范围的选项
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with(options: CellHarnessFilters = {}): HarnessPredicate<MatCellHarness> {
    return MatCellHarness._getCellPredicate(MatCellHarness, options);
  }

  /**
   * Gets the cell's text.
   *
   * 获取此单元格的文本。
   *
   */
  async getText(): Promise<string> {
    return (await this.host()).text();
  }

  /**
   * Gets the name of the column that the cell belongs to.
   *
   * 获取此单元格所属的列的名称。
   *
   */
  async getColumnName(): Promise<string> {
    const host = await this.host();
    const classAttribute = await host.getAttribute('class');

    if (classAttribute) {
      const prefix = 'mat-column-';
      const name = classAttribute.split(' ').map(c => c.trim()).find(c => c.startsWith(prefix));

      if (name) {
        return name.split(prefix)[1];
      }
    }

    throw Error('Could not determine column name of cell.');
  }

  protected static _getCellPredicate<T extends MatCellHarness>(
    type: ComponentHarnessConstructor<T>,
    options: CellHarnessFilters): HarnessPredicate<T> {
    return new HarnessPredicate(type, options)
      .addOption('text', options.text,
          (harness, text) => HarnessPredicate.stringMatches(harness.getText(), text))
      .addOption('columnName', options.columnName,
          (harness, name) => HarnessPredicate.stringMatches(harness.getColumnName(), name));
  }
}

/**
 * Harness for interacting with a standard Angular Material table header cell.
 *
 * 与标准 Angular Material 表的标题单元进行交互的测试工具。
 *
 */
export class MatHeaderCellHarness extends MatCellHarness {
  /**
   * The selector for the host element of a `MatHeaderCellHarness` instance.
   *
   * `MatHeaderCellHarness` 实例的宿主元素选择器。
   *
   */
  static hostSelector = '.mat-header-cell';

  /**
   * Gets a `HarnessPredicate` that can be used to search for
   * a table header cell with specific attributes.
   *
   * 获取一个 `HarnessPredicate`，用于搜索具有特定属性的表头单元格。
   *
   * @param options Options for narrowing the search
   *
   * 缩小搜索范围的选项
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with(options: CellHarnessFilters = {}): HarnessPredicate<MatHeaderCellHarness> {
    return MatHeaderCellHarness._getCellPredicate(MatHeaderCellHarness, options);
  }
}

/**
 * Harness for interacting with a standard Angular Material table footer cell.
 *
 * 与标准 Angular Material 表格的页脚单元进行交互的测试工具。
 *
 */
export class MatFooterCellHarness extends MatCellHarness {
  /**
   * The selector for the host element of a `MatFooterCellHarness` instance.
   *
   * `MatFooterCellHarness` 实例的宿主元素选择器。
   *
   */
  static hostSelector = '.mat-footer-cell';

  /**
   * Gets a `HarnessPredicate` that can be used to search for
   * a table footer cell with specific attributes.
   *
   * 获取一个 `HarnessPredicate`，用于搜索具有特定属性的表格页脚单元格。
   *
   * @param options Options for narrowing the search
   *
   * 缩小搜索范围的选项
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with(options: CellHarnessFilters = {}): HarnessPredicate<MatFooterCellHarness> {
    return MatFooterCellHarness._getCellPredicate(MatFooterCellHarness, options);
  }
}
