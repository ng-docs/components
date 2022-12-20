/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  CDK_ROW_TEMPLATE,
  CdkFooterRow,
  CdkFooterRowDef,
  CdkHeaderRow,
  CdkHeaderRowDef,
  CdkRow,
  CdkRowDef,
  CdkNoDataRow,
} from '@angular/cdk/table';
import {ChangeDetectionStrategy, Component, Directive, ViewEncapsulation} from '@angular/core';

/**
 * Header row definition for the mat-table.
 * Captures the header row's template and other header properties such as the columns to display.
 *
 * mat-table 的表头行定义。存放表头行的模板和其他表头属性，比如要显示的列。
 *
 * @deprecated
 *
 * Use `MatHeaderRowDef` from `@angular/material/table` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
@Directive({
  selector: '[matHeaderRowDef]',
  providers: [{provide: CdkHeaderRowDef, useExisting: MatLegacyHeaderRowDef}],
  inputs: ['columns: matHeaderRowDef', 'sticky: matHeaderRowDefSticky'],
})
export class MatLegacyHeaderRowDef extends CdkHeaderRowDef {}

/**
 * Footer row definition for the mat-table.
 * Captures the footer row's template and other footer properties such as the columns to display.
 *
 * mat-table 的表尾行定义。存放表尾行的模板和其他表尾属性，比如要显示的列。
 *
 * @deprecated
 *
 * Use `MatFooterRowDef` from `@angular/material/table` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
@Directive({
  selector: '[matFooterRowDef]',
  providers: [{provide: CdkFooterRowDef, useExisting: MatLegacyFooterRowDef}],
  inputs: ['columns: matFooterRowDef', 'sticky: matFooterRowDefSticky'],
})
export class MatLegacyFooterRowDef extends CdkFooterRowDef {}

/**
 * Data row definition for the mat-table.
 * Captures the data row's template and other properties such as the columns to display and
 * a when predicate that describes when this row should be used.
 *
 * mat-table 的数据行定义。 存放数据行的模板和其他属性，比如要显示的列和描述何时应该使用该行的谓词。
 *
 * @deprecated
 *
 * Use `MatRowDef` from `@angular/material/table` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
@Directive({
  selector: '[matRowDef]',
  providers: [{provide: CdkRowDef, useExisting: MatLegacyRowDef}],
  inputs: ['columns: matRowDefColumns', 'when: matRowDefWhen'],
})
export class MatLegacyRowDef<T> extends CdkRowDef<T> {}

/**
 * Header template container that contains the cell outlet. Adds the right class and role.
 *
 * 包含单元格出口的头模板容器。添加合适的类和角色。
 *
 * @deprecated
 *
 * Use `MatHeaderRow` from `@angular/material/table` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
@Component({
  selector: 'mat-header-row, tr[mat-header-row]',
  template: CDK_ROW_TEMPLATE,
  host: {
    'class': 'mat-header-row',
    'role': 'row',
  },
  // See note on CdkTable for explanation on why this uses the default change detection strategy.
  // tslint:disable-next-line:validate-decorators
  changeDetection: ChangeDetectionStrategy.Default,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'matHeaderRow',
  providers: [{provide: CdkHeaderRow, useExisting: MatLegacyHeaderRow}],
})
export class MatLegacyHeaderRow extends CdkHeaderRow {}

/**
 * Footer template container that contains the cell outlet. Adds the right class and role.
 *
 * 包含单元格出口的表尾模板容器。添加合适的类和角色。
 *
 * @deprecated
 *
 * Use `MatFooterRow` from `@angular/material/table` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
@Component({
  selector: 'mat-footer-row, tr[mat-footer-row]',
  template: CDK_ROW_TEMPLATE,
  host: {
    'class': 'mat-footer-row',
    'role': 'row',
  },
  // See note on CdkTable for explanation on why this uses the default change detection strategy.
  // tslint:disable-next-line:validate-decorators
  changeDetection: ChangeDetectionStrategy.Default,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'matFooterRow',
  providers: [{provide: CdkFooterRow, useExisting: MatLegacyFooterRow}],
})
export class MatLegacyFooterRow extends CdkFooterRow {}

/**
 * Data row template container that contains the cell outlet. Adds the right class and role.
 *
 * 包含单元格出口的数据行模板容器。添加合适的类和角色。
 *
 * @deprecated
 *
 * Use `MatRow` from `@angular/material/table` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
@Component({
  selector: 'mat-row, tr[mat-row]',
  template: CDK_ROW_TEMPLATE,
  host: {
    'class': 'mat-row',
    'role': 'row',
  },
  // See note on CdkTable for explanation on why this uses the default change detection strategy.
  // tslint:disable-next-line:validate-decorators
  changeDetection: ChangeDetectionStrategy.Default,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'matRow',
  providers: [{provide: CdkRow, useExisting: MatLegacyRow}],
})
export class MatLegacyRow extends CdkRow {}

/**
 * Row that can be used to display a message when no data is shown in the table.
 *
 * 当表中没有数据时，可以用来显示一条消息的行。
 *
 * @deprecated
 *
 * Use `MatNoDataRow` from `@angular/material/table` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
@Directive({
  selector: 'ng-template[matNoDataRow]',
  providers: [{provide: CdkNoDataRow, useExisting: MatLegacyNoDataRow}],
})
export class MatLegacyNoDataRow extends CdkNoDataRow {
  override _contentClassName = 'mat-no-data-row';
}
