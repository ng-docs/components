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
import {MatLegacyFormFieldAppearance} from '@angular/material/legacy-form-field';
import {_MatPaginatorBase, MatPaginatorIntl} from '@angular/material/paginator';

/**
 * Object that can be used to configure the default options for the paginator module.
 *
 * 可用于配置分页器模块默认选项的对象。
 *
 * @deprecated
 *
 * Use `MatPaginatorDefaultOptions` from `@angular/material/paginator` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
export interface MatLegacyPaginatorDefaultOptions {
  /**
   * Number of items to display on a page. By default set to 50.
   *
   * 每页显示的条目数。默认情况下，设置为 50。
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
   * 是否隐藏用户的分页大小选择器界面。
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
  formFieldAppearance?: MatLegacyFormFieldAppearance;
}

/**
 * Injection token that can be used to provide the default options for the paginator module.
 *
 * 这个注入令牌可以用来为分页器模块提供默认选项。
 *
 * @deprecated
 *
 * Use `MAT_PAGINATOR_DEFAULT_OPTIONS` from `@angular/material/paginator` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
export const MAT_LEGACY_PAGINATOR_DEFAULT_OPTIONS =
  new InjectionToken<MatLegacyPaginatorDefaultOptions>('MAT_LEGACY_PAGINATOR_DEFAULT_OPTIONS');

/**
 * Component to provide navigation between paged information. Displays the size of the current
 * page, user-selectable options to change that size, what items are being shown, and
 * navigational button to go to the previous or next page.
 *
 * 用于提供分页式信息导航的组件。显示当前分页的大小、用户可选的改变分页大小的选项、要显示的条目以及用于转到上一页或下一页的导航按钮。
 *
 * @deprecated
 *
 * Use `MatPaginator` from `@angular/material/paginator` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
@Component({
  selector: 'mat-paginator',
  exportAs: 'matPaginator',
  templateUrl: 'paginator.html',
  styleUrls: ['paginator.css'],
  inputs: ['disabled'],
  host: {
    'class': 'mat-paginator',
    'role': 'group',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class MatLegacyPaginator extends _MatPaginatorBase<MatLegacyPaginatorDefaultOptions> {
  /**
   * If set, styles the "page size" form field with the designated style.
   *
   * 如果设置，则使用指定样式为“页面大小”的表单字段设置样式。
   *
   */
  _formFieldAppearance?: MatLegacyFormFieldAppearance;

  constructor(
    intl: MatPaginatorIntl,
    changeDetectorRef: ChangeDetectorRef,
    @Optional()
    @Inject(MAT_LEGACY_PAGINATOR_DEFAULT_OPTIONS)
    defaults?: MatLegacyPaginatorDefaultOptions,
  ) {
    super(intl, changeDetectorRef, defaults);

    if (defaults && defaults.formFieldAppearance != null) {
      this._formFieldAppearance = defaults.formFieldAppearance;
    }
  }
}
