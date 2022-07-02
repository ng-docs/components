/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  InjectionToken,
  Optional,
  ViewEncapsulation,
} from '@angular/core';
import {MatPaginatorIntl, _MatPaginatorBase} from '@angular/material/paginator';
import {MatFormFieldAppearance} from '@angular/material-experimental/mdc-form-field';

// Note that while `MatPaginatorDefaultOptions` and `MAT_PAGINATOR_DEFAULT_OPTIONS` are identical
// between the MDC and non-MDC versions, we have to duplicate them, because the type of
// `formFieldAppearance` is narrower in the MDC version.

/**
 * Object that can be used to configure the default options for the paginator module.
 *
 * 可用于配置分页器模块默认选项的对象。
 *
 */
export interface MatPaginatorDefaultOptions {
  /**
   * Number of items to display on a page. By default set to 50.
   *
   * 分页上显示的条目数。默认情况下，设置为 50。
   *
   */
  pageSize?: number;

  /**
   * The set of provided page size options to display to the user.
   *
   * 要显示给用户的分页大小选项的集合。
   *
   */
  pageSizeOptions?: number[];

  /**
   * Whether to hide the page size selection UI from the user.
   *
   * 是否隐藏给用户的分页大小选择界面。
   *
   */
  hidePageSize?: boolean;

  /**
   * Whether to show the first/last buttons UI to the user.
   *
   * 是否要向用户显示第一个/最后一个按钮界面。
   *
   */
  showFirstLastButtons?: boolean;

  /**
   * The default form-field appearance to apply to the page size options selector.
   *
   * 要应用于分页大小选项选择器的默认表单字段外观。
   *
   */
  formFieldAppearance?: MatFormFieldAppearance;
}

/**
 * Injection token that can be used to provide the default options for the paginator module.
 *
 * 这个注入令牌可以用来为分页器模块提供默认选项。
 *
 */
export const MAT_PAGINATOR_DEFAULT_OPTIONS = new InjectionToken<MatPaginatorDefaultOptions>(
  'MAT_PAGINATOR_DEFAULT_OPTIONS',
);

let nextUniqueId = 0;

/**
 * Component to provide navigation between paged information. Displays the size of the current
 * page, user-selectable options to change that size, what items are being shown, and
 * navigational button to go to the previous or next page.
 *
 * 用于提供分页式信息导航的组件。显示当前分页的大小、用户可选的改变分页大小的选项、要显示的条目以及用于转到上一页或下一页的导航按钮。
 *
 */
@Component({
  selector: 'mat-paginator',
  exportAs: 'matPaginator',
  templateUrl: 'paginator.html',
  styleUrls: ['paginator.css'],
  inputs: ['disabled'],
  host: {
    'class': 'mat-mdc-paginator',
    'role': 'group',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class MatPaginator extends _MatPaginatorBase<MatPaginatorDefaultOptions> {
  /** If set, styles the "page size" form field with the designated style. */
  _formFieldAppearance?: MatFormFieldAppearance;

  /** ID for the DOM node containing the pagiators's items per page label. */
  readonly _pageSizeLabelId = `mat-paginator-page-size-label-${nextUniqueId++}`;

  constructor(
    intl: MatPaginatorIntl,
    changeDetectorRef: ChangeDetectorRef,
    @Optional() @Inject(MAT_PAGINATOR_DEFAULT_OPTIONS) defaults?: MatPaginatorDefaultOptions,
  ) {
    super(intl, changeDetectorRef, defaults);
    this._formFieldAppearance = defaults?.formFieldAppearance || 'outline';
  }
}
