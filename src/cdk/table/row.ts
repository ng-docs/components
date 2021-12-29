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
  Directive,
  IterableChanges,
  IterableDiffer,
  IterableDiffers,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  TemplateRef,
  ViewContainerRef,
  ViewEncapsulation,
  Inject,
  Optional,
} from '@angular/core';
import {CanStick, CanStickCtor, mixinHasStickyInput} from './can-stick';
import {CdkCellDef, CdkColumnDef} from './cell';
import {CDK_TABLE} from './tokens';

/**
 * The row template that can be used by the mat-table. Should not be used outside of the
 * material library.
 *
 * 供 mat-table 使用的行模板。不应该在 Material 库之外使用。
 *
 */
export const CDK_ROW_TEMPLATE = `<ng-container cdkCellOutlet></ng-container>`;

/**
 * Base class for the CdkHeaderRowDef and CdkRowDef that handles checking their columns inputs
 * for changes and notifying the table.
 *
 * CdkHeaderRowDef 和 CdkRowDef 的基类，负责处理各列的输入变更并通知表格。
 *
 */
@Directive()
export abstract class BaseRowDef implements OnChanges {
  /**
   * The columns to be displayed on this row.
   *
   * 要在行上显示的列。
   *
   */
  columns: Iterable<string>;

  /**
   * Differ used to check if any changes were made to the columns.
   *
   * 差分器，用于检查是否对列有任何更改。
   *
   */
  protected _columnsDiffer: IterableDiffer<any>;

  constructor(
    /** @docs-private */ public template: TemplateRef<any>,
    protected _differs: IterableDiffers,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    // Create a new columns differ if one does not yet exist. Initialize it based on initial value
    // of the columns property or an empty array if none is provided.
    if (!this._columnsDiffer) {
      const columns = (changes['columns'] && changes['columns'].currentValue) || [];
      this._columnsDiffer = this._differs.find(columns).create();
      this._columnsDiffer.diff(columns);
    }
  }

  /**
   * Returns the difference between the current columns and the columns from the last diff, or null
   * if there is no difference.
   *
   * 返回当前列和最后一个差分过的列之间的差异，如果没有差别，则返回 null。
   *
   */
  getColumnsDiff(): IterableChanges<any> | null {
    return this._columnsDiffer.diff(this.columns);
  }

  /**
   * Gets this row def's relevant cell template from the provided column def.
   *
   * 从提供的列定义中获取对此行的定义有用的相关单元格模板。
   *
   */
  extractCellTemplate(column: CdkColumnDef): TemplateRef<any> {
    if (this instanceof CdkHeaderRowDef) {
      return column.headerCell.template;
    }
    if (this instanceof CdkFooterRowDef) {
      return column.footerCell.template;
    } else {
      return column.cell.template;
    }
  }
}

// Boilerplate for applying mixins to CdkHeaderRowDef.
/** @docs-private */
class CdkHeaderRowDefBase extends BaseRowDef {}
const _CdkHeaderRowDefBase: CanStickCtor & typeof CdkHeaderRowDefBase =
  mixinHasStickyInput(CdkHeaderRowDefBase);

/**
 * Header row definition for the CDK table.
 * Captures the header row's template and other header properties such as the columns to display.
 *
 * CDK 表格的表头行定义。存放表头行的模板和其他标题属性，比如要显示的列。
 *
 */
@Directive({
  selector: '[cdkHeaderRowDef]',
  inputs: ['columns: cdkHeaderRowDef', 'sticky: cdkHeaderRowDefSticky'],
})
export class CdkHeaderRowDef extends _CdkHeaderRowDefBase implements CanStick, OnChanges {
  constructor(
    template: TemplateRef<any>,
    _differs: IterableDiffers,
    @Inject(CDK_TABLE) @Optional() public _table?: any,
  ) {
    super(template, _differs);
  }

  // Prerender fails to recognize that ngOnChanges in a part of this class through inheritance.
  // Explicitly define it so that the method is called as part of the Angular lifecycle.
  override ngOnChanges(changes: SimpleChanges): void {
    super.ngOnChanges(changes);
  }
}

// Boilerplate for applying mixins to CdkFooterRowDef.
/** @docs-private */
class CdkFooterRowDefBase extends BaseRowDef {}
const _CdkFooterRowDefBase: CanStickCtor & typeof CdkFooterRowDefBase =
  mixinHasStickyInput(CdkFooterRowDefBase);

/**
 * Footer row definition for the CDK table.
 * Captures the footer row's template and other footer properties such as the columns to display.
 *
 * CDK 表的表尾行定义，存放表尾行的模板和其他表尾属性，比如要显示的列。
 *
 */
@Directive({
  selector: '[cdkFooterRowDef]',
  inputs: ['columns: cdkFooterRowDef', 'sticky: cdkFooterRowDefSticky'],
})
export class CdkFooterRowDef extends _CdkFooterRowDefBase implements CanStick, OnChanges {
  constructor(
    template: TemplateRef<any>,
    _differs: IterableDiffers,
    @Inject(CDK_TABLE) @Optional() public _table?: any,
  ) {
    super(template, _differs);
  }

  // Prerender fails to recognize that ngOnChanges in a part of this class through inheritance.
  // Explicitly define it so that the method is called as part of the Angular lifecycle.
  override ngOnChanges(changes: SimpleChanges): void {
    super.ngOnChanges(changes);
  }
}

/**
 * Data row definition for the CDK table.
 * Captures the header row's template and other row properties such as the columns to display and
 * a when predicate that describes when this row should be used.
 *
 * CDK 表的数据行定义。存放数据行的模板和其他行属性，比如要显示的列和描述何时应该使用该行的谓词。
 *
 */
@Directive({
  selector: '[cdkRowDef]',
  inputs: ['columns: cdkRowDefColumns', 'when: cdkRowDefWhen'],
})
export class CdkRowDef<T> extends BaseRowDef {
  /**
   * Function that should return true if this row template should be used for the provided index
   * and row data. If left undefined, this row will be considered the default row template to use
   * when no other when functions return true for the data.
   * For every row, there must be at least one when function that passes or an undefined to default.
   *
   * 如果要把这个行模板用于所提供的索引和行数据，该函数应返回 true。如果未定义，那么当该函数对该数据返回 true 时，该行将被认为是默认的行模板。对于每一行，必须至少有一个函数能通过或者为 undefined 以便作为默认值。
   *
   */
  when: (index: number, rowData: T) => boolean;

  // TODO(andrewseguin): Add an input for providing a switch function to determine
  //   if this template should be used.
  constructor(
    template: TemplateRef<any>,
    _differs: IterableDiffers,
    @Inject(CDK_TABLE) @Optional() public _table?: any,
  ) {
    super(template, _differs);
  }
}

/**
 * Context provided to the row cells when `multiTemplateDataRows` is false
 *
 * 当 `multiTemplateDataRows` 为 false 时，提供给行单元格的上下文
 *
 */
export interface CdkCellOutletRowContext<T> {
  /**
   * Data for the row that this cell is located within.
   *
   * 该单元格所在行的数据。
   *
   */
  $implicit?: T;

  /**
   * Index of the data object in the provided data array.
   *
   * 数据对象在所提供的数据组中的索引。
   *
   */
  index?: number;

  /**
   * Length of the number of total rows.
   *
   * 总行数的长度。
   *
   */
  count?: number;

  /**
   * True if this cell is contained in the first row.
   *
   * 如果此单元格包含在第一行，则为 True。
   *
   */
  first?: boolean;

  /**
   * True if this cell is contained in the last row.
   *
   * 如果此单元格包含在最后一行，则为 True。
   *
   */
  last?: boolean;

  /**
   * True if this cell is contained in a row with an even-numbered index.
   *
   * 如果此单元格包含在具有偶数索引的行中，则返回 true。
   *
   */
  even?: boolean;

  /**
   * True if this cell is contained in a row with an odd-numbered index.
   *
   * 如果此单元格包含在具有奇数索引的行中，则返回 true。
   *
   */
  odd?: boolean;
}

/**
 * Context provided to the row cells when `multiTemplateDataRows` is true. This context is the same
 * as CdkCellOutletRowContext except that the single `index` value is replaced by `dataIndex` and
 * `renderIndex`.
 *
 * `multiTemplateDataRows` 为 true 时，提供给行单元格的上下文。这个上下文与 CdkCellOutletRowContext 相同，除非单个的 `index` 值被置换为了 `dataIndex` 和 `renderIndex`。
 *
 */
export interface CdkCellOutletMultiRowContext<T> {
  /**
   * Data for the row that this cell is located within.
   *
   * 该单元格所在行的数据。
   *
   */
  $implicit?: T;

  /**
   * Index of the data object in the provided data array.
   *
   * 数据对象提供的数据对象索引。
   *
   */
  dataIndex?: number;

  /**
   * Index location of the rendered row that this cell is located within.
   *
   * 该单元格所在的渲染行的索引位置。
   *
   */
  renderIndex?: number;

  /**
   * Length of the number of total rows.
   *
   * 总行数的长度。
   *
   */
  count?: number;

  /**
   * True if this cell is contained in the first row.
   *
   * 如果此单元格包含在第一行，则为 True。
   *
   */
  first?: boolean;

  /**
   * True if this cell is contained in the last row.
   *
   * 如果此单元格包含在最后一行，则为 True。
   *
   */
  last?: boolean;

  /**
   * True if this cell is contained in a row with an even-numbered index.
   *
   * 如果此单元格包含在具有偶数索引的行中，则返回 true。
   *
   */
  even?: boolean;

  /**
   * True if this cell is contained in a row with an odd-numbered index.
   *
   * 如果此单元格包含在具有奇数索引的行中，则返回 true。
   *
   */
  odd?: boolean;
}

/**
 * Outlet for rendering cells inside of a row or header row.
 *
 * 用于渲染行或表头行内的单元格的出口地标。
 *
 * @docs-private
 */
@Directive({selector: '[cdkCellOutlet]'})
export class CdkCellOutlet implements OnDestroy {
  /**
   * The ordered list of cells to render within this outlet's view container
   *
   * 要在该出口地标的视图容器中渲染的有序单元格列表
   *
   */
  cells: CdkCellDef[];

  /**
   * The data context to be provided to each cell
   *
   * 要提供给每个单元格的数据上下文
   *
   */
  context: any;

  /**
   * Static property containing the latest constructed instance of this class.
   * Used by the CDK table when each CdkHeaderRow and CdkRow component is created using
   * createEmbeddedView. After one of these components are created, this property will provide
   * a handle to provide that component's cells and context. After init, the CdkCellOutlet will
   * construct the cells with the provided context.
   *
   * 包含该类最新构造实例的静态属性。当使用 createEmbeddedView 创建每个 CdkHeaderRow 和 CdkRow 组件时，由 CDK 表使用。在创建其中一个组件之后，该属性将提供一个抓手来提供该组件的单元格和上下文。初始化之后，CdkCellOutlet 会使用提供的上下文构造单元格。
   *
   */
  static mostRecentCellOutlet: CdkCellOutlet | null = null;

  constructor(public _viewContainer: ViewContainerRef) {
    CdkCellOutlet.mostRecentCellOutlet = this;
  }

  ngOnDestroy() {
    // If this was the last outlet being rendered in the view, remove the reference
    // from the static property after it has been destroyed to avoid leaking memory.
    if (CdkCellOutlet.mostRecentCellOutlet === this) {
      CdkCellOutlet.mostRecentCellOutlet = null;
    }
  }
}

/**
 * Header template container that contains the cell outlet. Adds the right class and role.
 *
 * 包含单元格出口的头模板容器。添加合适的类和角色。
 *
 */
@Component({
  selector: 'cdk-header-row, tr[cdk-header-row]',
  template: CDK_ROW_TEMPLATE,
  host: {
    'class': 'cdk-header-row',
    'role': 'row',
  },
  // See note on CdkTable for explanation on why this uses the default change detection strategy.
  // tslint:disable-next-line:validate-decorators
  changeDetection: ChangeDetectionStrategy.Default,
  encapsulation: ViewEncapsulation.None,
})
export class CdkHeaderRow {}

/**
 * Footer template container that contains the cell outlet. Adds the right class and role.
 *
 * 包含单元格出口的表尾模板容器。添加合适的类和角色。
 *
 */
@Component({
  selector: 'cdk-footer-row, tr[cdk-footer-row]',
  template: CDK_ROW_TEMPLATE,
  host: {
    'class': 'cdk-footer-row',
    'role': 'row',
  },
  // See note on CdkTable for explanation on why this uses the default change detection strategy.
  // tslint:disable-next-line:validate-decorators
  changeDetection: ChangeDetectionStrategy.Default,
  encapsulation: ViewEncapsulation.None,
})
export class CdkFooterRow {}

/**
 * Data row template container that contains the cell outlet. Adds the right class and role.
 *
 * 包含单元格出口的数据行模板容器。添加合适的类和角色。
 *
 */
@Component({
  selector: 'cdk-row, tr[cdk-row]',
  template: CDK_ROW_TEMPLATE,
  host: {
    'class': 'cdk-row',
    'role': 'row',
  },
  // See note on CdkTable for explanation on why this uses the default change detection strategy.
  // tslint:disable-next-line:validate-decorators
  changeDetection: ChangeDetectionStrategy.Default,
  encapsulation: ViewEncapsulation.None,
})
export class CdkRow {}

/**
 * Row that can be used to display a message when no data is shown in the table.
 *
 * 当表中没有数据时，可以用来显示一条消息的行。
 *
 */
@Directive({
  selector: 'ng-template[cdkNoDataRow]',
})
export class CdkNoDataRow {
  _contentClassName = 'cdk-no-data-row';
  constructor(public templateRef: TemplateRef<any>) {}
}
