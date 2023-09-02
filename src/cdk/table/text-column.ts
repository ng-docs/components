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
  Inject,
  Input,
  OnDestroy,
  OnInit,
  Optional,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import {CdkCellDef, CdkColumnDef, CdkHeaderCellDef} from './cell';
import {CdkTable} from './table';
import {
  getTableTextColumnMissingParentTableError,
  getTableTextColumnMissingNameError,
} from './table-errors';
import {TEXT_COLUMN_OPTIONS, TextColumnOptions} from './tokens';

/**
 * Column that simply shows text content for the header and row cells. Assumes that the table
 * is using the native table implementation \(`<table>`\).
 *
 * 只显示表头行和行单元格的文本内容的列。假设该表正在使用原生表格实现（ `<table>` ）。
 *
 * By default, the name of this column will be the header text and data property accessor.
 * The header text can be overridden with the `headerText` input. Cell values can be overridden with
 * the `dataAccessor` input. Change the text justification to the start or end using the `justify`
 * input.
 *
 * 默认情况下，该列的名称就是表头文本和数据属性访问器。输入属性 `headerText` 可以改写表头文本。输入属性 `dataAccessor` 可以改写单元格的值。 输入属性 `justify` 把文本对齐方式修改为对齐到开头或结尾。
 *
 */
@Component({
  selector: 'cdk-text-column',
  template: `
    <ng-container cdkColumnDef>
      <th cdk-header-cell *cdkHeaderCellDef [style.text-align]="justify">
        {{headerText}}
      </th>
      <td cdk-cell *cdkCellDef="let data" [style.text-align]="justify">
        {{dataAccessor(data, name)}}
      </td>
    </ng-container>
  `,
  encapsulation: ViewEncapsulation.None,
  // Change detection is intentionally not set to OnPush. This component's template will be provided
  // to the table to be inserted into its view. This is problematic when change detection runs since
  // the bindings in this template will be evaluated _after_ the table's view is evaluated, which
  // mean's the template in the table's view will not have the updated value (and in fact will cause
  // an ExpressionChangedAfterItHasBeenCheckedError).
  // tslint:disable-next-line:validate-decorators
  changeDetection: ChangeDetectionStrategy.Default,
})
export class CdkTextColumn<T> implements OnDestroy, OnInit {
  /**
   * Column name that should be used to reference this column.
   *
   * 要用来引用这个列的列名。
   *
   */
  @Input()
  get name(): string {
    return this._name;
  }
  set name(name: string) {
    this._name = name;

    // With Ivy, inputs can be initialized before static query results are
    // available. In that case, we defer the synchronization until "ngOnInit" fires.
    this._syncColumnDefName();
  }
  _name: string;

  /**
   * Text label that should be used for the column header. If this property is not
   * set, the header text will default to the column name with its first letter capitalized.
   *
   * 要作为列表头的文本标签。如果未设置此属性，则表头文本默认使用列名的首字母大写形式。
   *
   */
  @Input() headerText: string;

  /**
   * Accessor function to retrieve the data rendered for each cell. If this
   * property is not set, the data cells will render the value found in the data's property matching
   * the column's name. For example, if the column is named `id`, then the rendered value will be
   * value defined by the data's `id` property.
   *
   * 访问器函数用来检索为要每个单元格渲染的数据。如果未设置此属性，数据单元格将渲染数据属性中与该列名匹配的值。 例如，如果列的名字是 `id`，那么渲染的值就是 data 的 `id` 属性定义的值。
   *
   */
  @Input() dataAccessor: (data: T, name: string) => string;

  /**
   * Alignment of the cell values.
   *
   * 单元格中值的对齐方式。
   *
   */
  @Input() justify: 'start' | 'end' | 'center' = 'start';

  /** @docs-private */
  @ViewChild(CdkColumnDef, {static: true}) columnDef: CdkColumnDef;

  /**
   * The column cell is provided to the column during `ngOnInit` with a static query.
   * Normally, this will be retrieved by the column using `ContentChild`, but that assumes the
   * column definition was provided in the same view as the table, which is not the case with this
   * component.
   *
   * `ngOnInit` 期间，通过静态查询，列单元格会被提供给列。
   * 通常情况下，会通过对这个列使用 `ContentChild` 检索它，但这要求列的定义是在同一视图中提供的，但本组件中并非如此。
   *
   * @docs-private
   */
  @ViewChild(CdkCellDef, {static: true}) cell: CdkCellDef;

  /**
   * The column headerCell is provided to the column during `ngOnInit` with a static query.
   * Normally, this will be retrieved by the column using `ContentChild`, but that assumes the
   * column definition was provided in the same view as the table, which is not the case with this
   * component.
   *
   * 该列的 headerCell 是在 `ngOnInit` 中通过静态查询提供给列的。
   * 通常情况下，会通过对这个列使用 `ContentChild` 检索它，但这要求列的定义是在同一视图中提供的，但本组件中并非如此。
   *
   * @docs-private
   */
  @ViewChild(CdkHeaderCellDef, {static: true}) headerCell: CdkHeaderCellDef;

  constructor(
    // `CdkTextColumn` is always requiring a table, but we just assert it manually
    // for better error reporting.
    // tslint:disable-next-line: lightweight-tokens
    @Optional() private _table: CdkTable<T>,
    @Optional() @Inject(TEXT_COLUMN_OPTIONS) private _options: TextColumnOptions<T>,
  ) {
    this._options = _options || {};
  }

  ngOnInit() {
    this._syncColumnDefName();

    if (this.headerText === undefined) {
      this.headerText = this._createDefaultHeaderText();
    }

    if (!this.dataAccessor) {
      this.dataAccessor =
        this._options.defaultDataAccessor || ((data: T, name: string) => (data as any)[name]);
    }

    if (this._table) {
      // Provide the cell and headerCell directly to the table with the static `ViewChild` query,
      // since the columnDef will not pick up its content by the time the table finishes checking
      // its content and initializing the rows.
      this.columnDef.cell = this.cell;
      this.columnDef.headerCell = this.headerCell;
      this._table.addColumnDef(this.columnDef);
    } else if (typeof ngDevMode === 'undefined' || ngDevMode) {
      throw getTableTextColumnMissingParentTableError();
    }
  }

  ngOnDestroy() {
    if (this._table) {
      this._table.removeColumnDef(this.columnDef);
    }
  }

  /**
   * Creates a default header text. Use the options' header text transformation function if one
   * has been provided. Otherwise simply capitalize the column name.
   *
   * 创建默认的表头文本。如果提供了表头文本的转换函数，请使用这些选项。否则，只需要将列名大写。
   *
   */
  _createDefaultHeaderText() {
    const name = this.name;

    if (!name && (typeof ngDevMode === 'undefined' || ngDevMode)) {
      throw getTableTextColumnMissingNameError();
    }

    if (this._options && this._options.defaultHeaderTextTransform) {
      return this._options.defaultHeaderTextTransform(name);
    }

    return name[0].toUpperCase() + name.slice(1);
  }

  /**
   * Synchronizes the column definition name with the text column name.
   *
   * 将列定义名称与列名文本同步。
   *
   */
  private _syncColumnDefName() {
    if (this.columnDef) {
      this.columnDef.name = this.name;
    }
  }
}
