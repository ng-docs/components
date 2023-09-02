/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {CdkTextColumn} from '@angular/cdk/table';
import {ChangeDetectionStrategy, Component, ViewEncapsulation} from '@angular/core';

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
 * 默认情况下，该列的名称就是表头文本和数据属性访问器。输入属性 `headerText` 可以改写表头文本。输入属性 `dataAccessor` 可以改写单元格的值。
 * 输入属性 `justify` 把文本对齐方式修改为对齐到开头或结尾。
 *
 */
@Component({
  selector: 'mat-text-column',
  template: `
    <ng-container matColumnDef>
      <th mat-header-cell *matHeaderCellDef [style.text-align]="justify">
        {{headerText}}
      </th>
      <td mat-cell *matCellDef="let data" [style.text-align]="justify">
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
export class MatTextColumn<T> extends CdkTextColumn<T> {}
