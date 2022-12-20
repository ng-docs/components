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
  Directive,
  EventEmitter,
  Inject,
  InjectionToken,
  Input,
  OnDestroy,
  OnInit,
  Optional,
  Output,
  ViewEncapsulation,
} from '@angular/core';
import {MatFormFieldAppearance} from '@angular/material/form-field';
import {
  CanDisable,
  HasInitialized,
  mixinDisabled,
  mixinInitialized,
  ThemePalette,
} from '@angular/material/core';
import {Subscription} from 'rxjs';
import {
  BooleanInput,
  coerceBooleanProperty,
  coerceNumberProperty,
  NumberInput,
} from '@angular/cdk/coercion';
import {MatPaginatorIntl} from './paginator-intl';

/**
 * The default page size if there is no page size and there are no provided page size options.
 *
 * 默认分页大小（如果没有分页大小且没有提供分页大小选项）。
 *
 */
const DEFAULT_PAGE_SIZE = 50;

/** Object that can used to configure the underlying `MatSelect` inside a `MatPaginator`. */
export interface MatPaginatorSelectConfig {
  /** Whether to center the active option over the trigger. */
  disableOptionCentering?: boolean;

  /** Classes to be passed to the select panel. */
  panelClass?: string | string[] | Set<string> | {[key: string]: any};
}

/**
 * Change event object that is emitted when the user selects a
 * different page size or navigates to another page.
 *
 * 当用户选择不同的分页大小或导航到另一个分页时，会改变这个事件对象。
 *
 */
export class PageEvent {
  /**
   * The current page index.
   *
   * 当前的分页索引。
   *
   */
  pageIndex: number;

  /**
   * Index of the page that was selected previously.
   *
   * 以前选择过的分页索引。
   *
   * @breaking-change 8.0.0 To be made into a required property.
   *
   * 8.0.0 要求成为必要属性。
   */
  previousPageIndex?: number;

  /** The current page size. */
  pageSize: number;

  /** The current total number of items being paged. */
  length: number;
}

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

// Boilerplate for applying mixins to _MatPaginatorBase.
/** @docs-private */
const _MatPaginatorMixinBase = mixinDisabled(mixinInitialized(class {}));

/**
 * Base class with all of the `MatPaginator` functionality.
 *
 * 具备所有 `MatPaginator` 功能的基类。
 *
 * @docs-private
 */
@Directive()
export abstract class _MatPaginatorBase<
    O extends {
      pageSize?: number;
      pageSizeOptions?: number[];
      hidePageSize?: boolean;
      showFirstLastButtons?: boolean;
    },
  >
  extends _MatPaginatorMixinBase
  implements OnInit, OnDestroy, CanDisable, HasInitialized
{
  private _initialized: boolean;
  private _intlChanges: Subscription;

  /**
   * Theme color to be used for the underlying form controls.
   *
   * 要用于底层表单的主题颜色。
   *
   */
  @Input() color: ThemePalette;

  /**
   * The zero-based page index of the displayed list of items. Defaulted to 0.
   *
   * 显示的条目列表中从零开始的分页索引。默认为 0。
   *
   */
  @Input()
  get pageIndex(): number {
    return this._pageIndex;
  }
  set pageIndex(value: NumberInput) {
    this._pageIndex = Math.max(coerceNumberProperty(value), 0);
    this._changeDetectorRef.markForCheck();
  }
  private _pageIndex = 0;

  /**
   * The length of the total number of items that are being paginated. Defaulted to 0.
   *
   * 被分页的条目总长度。默认为 0。
   *
   */
  @Input()
  get length(): number {
    return this._length;
  }
  set length(value: NumberInput) {
    this._length = coerceNumberProperty(value);
    this._changeDetectorRef.markForCheck();
  }
  private _length = 0;

  /**
   * Number of items to display on a page. By default set to 50.
   *
   * 每页显示的条目数。默认情况下，设置为 50。
   *
   */
  @Input()
  get pageSize(): number {
    return this._pageSize;
  }
  set pageSize(value: NumberInput) {
    this._pageSize = Math.max(coerceNumberProperty(value), 0);
    this._updateDisplayedPageSizeOptions();
  }
  private _pageSize: number;

  /**
   * The set of provided page size options to display to the user.
   *
   * 要显示给用户的分页大小选项的集合。
   *
   */
  @Input()
  get pageSizeOptions(): number[] {
    return this._pageSizeOptions;
  }
  set pageSizeOptions(value: number[] | readonly number[]) {
    this._pageSizeOptions = (value || []).map(p => coerceNumberProperty(p));
    this._updateDisplayedPageSizeOptions();
  }
  private _pageSizeOptions: number[] = [];

  /**
   * Whether to hide the page size selection UI from the user.
   *
   * 是否隐藏用户的分页大小选择器界面。
   *
   */
  @Input()
  get hidePageSize(): boolean {
    return this._hidePageSize;
  }
  set hidePageSize(value: BooleanInput) {
    this._hidePageSize = coerceBooleanProperty(value);
  }
  private _hidePageSize = false;

  /**
   * Whether to show the first/last buttons UI to the user.
   *
   * 是否要向用户显示第一个/最后一个按钮界面。
   *
   */
  @Input()
  get showFirstLastButtons(): boolean {
    return this._showFirstLastButtons;
  }
  set showFirstLastButtons(value: BooleanInput) {
    this._showFirstLastButtons = coerceBooleanProperty(value);
  }
  private _showFirstLastButtons = false;

  /**
   * Used to configure the underlying `MatSelect` inside the paginator.
   *
   * 用于配置分页器内部的底层 `MatSelect` 。
   *
   */
  @Input() selectConfig: MatPaginatorSelectConfig = {};

  /**
   * Event emitted when the paginator changes the page size or page index.
   *
   * 当分页器改变分页大小或分页索引时会发生事件。
   *
   */
  @Output() readonly page: EventEmitter<PageEvent> = new EventEmitter<PageEvent>();

  /**
   * Displayed set of page size options. Will be sorted and include current page size.
   *
   * 要显示的分页大小选项集。将被排序并且包含当前分页大小。
   *
   */
  _displayedPageSizeOptions: number[];

  constructor(
    public _intl: MatPaginatorIntl,
    private _changeDetectorRef: ChangeDetectorRef,
    defaults?: O,
  ) {
    super();
    this._intlChanges = _intl.changes.subscribe(() => this._changeDetectorRef.markForCheck());

    if (defaults) {
      const {pageSize, pageSizeOptions, hidePageSize, showFirstLastButtons} = defaults;

      if (pageSize != null) {
        this._pageSize = pageSize;
      }

      if (pageSizeOptions != null) {
        this._pageSizeOptions = pageSizeOptions;
      }

      if (hidePageSize != null) {
        this._hidePageSize = hidePageSize;
      }

      if (showFirstLastButtons != null) {
        this._showFirstLastButtons = showFirstLastButtons;
      }
    }
  }

  ngOnInit() {
    this._initialized = true;
    this._updateDisplayedPageSizeOptions();
    this._markInitialized();
  }

  ngOnDestroy() {
    this._intlChanges.unsubscribe();
  }

  /**
   * Advances to the next page if it exists.
   *
   * 如果存在，就进入下一页。
   *
   */
  nextPage(): void {
    if (!this.hasNextPage()) {
      return;
    }

    const previousPageIndex = this.pageIndex;
    this.pageIndex = this.pageIndex + 1;
    this._emitPageEvent(previousPageIndex);
  }

  /**
   * Move back to the previous page if it exists.
   *
   * 如果存在，就回到上一页。
   *
   */
  previousPage(): void {
    if (!this.hasPreviousPage()) {
      return;
    }

    const previousPageIndex = this.pageIndex;
    this.pageIndex = this.pageIndex - 1;
    this._emitPageEvent(previousPageIndex);
  }

  /**
   * Move to the first page if not already there.
   *
   * 如果不在第一页，请移动到第一页。
   *
   */
  firstPage(): void {
    // hasPreviousPage being false implies at the start
    if (!this.hasPreviousPage()) {
      return;
    }

    const previousPageIndex = this.pageIndex;
    this.pageIndex = 0;
    this._emitPageEvent(previousPageIndex);
  }

  /**
   * Move to the last page if not already there.
   *
   * 如果不在最后一页，就移动到最后一页。
   *
   */
  lastPage(): void {
    // hasNextPage being false implies at the end
    if (!this.hasNextPage()) {
      return;
    }

    const previousPageIndex = this.pageIndex;
    this.pageIndex = this.getNumberOfPages() - 1;
    this._emitPageEvent(previousPageIndex);
  }

  /**
   * Whether there is a previous page.
   *
   * 是否有上一页。
   *
   */
  hasPreviousPage(): boolean {
    return this.pageIndex >= 1 && this.pageSize != 0;
  }

  /**
   * Whether there is a next page.
   *
   * 是否有下一页。
   *
   */
  hasNextPage(): boolean {
    const maxPageIndex = this.getNumberOfPages() - 1;
    return this.pageIndex < maxPageIndex && this.pageSize != 0;
  }

  /**
   * Calculate the number of pages
   *
   * 计算页数
   *
   */
  getNumberOfPages(): number {
    if (!this.pageSize) {
      return 0;
    }

    return Math.ceil(this.length / this.pageSize);
  }

  /**
   * Changes the page size so that the first item displayed on the page will still be
   * displayed using the new page size.
   *
   * 更改分页大小，以便原来分页上显示的第一个条目在新的分页大小下仍然可见。
   *
   * For example, if the page size is 10 and on the second page (items indexed 10-19) then
   * switching so that the page size is 5 will set the third page as the current page so
   * that the 10th item will still be displayed.
   *
   * 例如，如果分页大小为 10，目标在第二页（索引为 10-19 的条目）上，那么切换到分页大小为 5 时，会把第三页设置为当前分页，这样第 10 条仍然会把它显示出来。
   *
   */
  _changePageSize(pageSize: number) {
    // Current page needs to be updated to reflect the new page size. Navigate to the page
    // containing the previous page's first item.
    const startIndex = this.pageIndex * this.pageSize;
    const previousPageIndex = this.pageIndex;

    this.pageIndex = Math.floor(startIndex / pageSize) || 0;
    this.pageSize = pageSize;
    this._emitPageEvent(previousPageIndex);
  }

  /**
   * Checks whether the buttons for going forwards should be disabled.
   *
   * 检查是否应禁用前进按钮。
   *
   */
  _nextButtonsDisabled() {
    return this.disabled || !this.hasNextPage();
  }

  /**
   * Checks whether the buttons for going backwards should be disabled.
   *
   * 检查是否应禁用后退按钮。
   *
   */
  _previousButtonsDisabled() {
    return this.disabled || !this.hasPreviousPage();
  }

  /**
   * Updates the list of page size options to display to the user. Includes making sure that
   * the page size is an option and that the list is sorted.
   *
   * 更新要显示给用户的分页大小选项列表。包括确保分页大小是一个选项，以及该列表是排序过的。
   *
   */
  private _updateDisplayedPageSizeOptions() {
    if (!this._initialized) {
      return;
    }

    // If no page size is provided, use the first page size option or the default page size.
    if (!this.pageSize) {
      this._pageSize =
        this.pageSizeOptions.length != 0 ? this.pageSizeOptions[0] : DEFAULT_PAGE_SIZE;
    }

    this._displayedPageSizeOptions = this.pageSizeOptions.slice();

    if (this._displayedPageSizeOptions.indexOf(this.pageSize) === -1) {
      this._displayedPageSizeOptions.push(this.pageSize);
    }

    // Sort the numbers using a number-specific sort function.
    this._displayedPageSizeOptions.sort((a, b) => a - b);
    this._changeDetectorRef.markForCheck();
  }

  /**
   * Emits an event notifying that a change of the paginator's properties has been triggered.
   *
   * 发出一个事件，以通知此事件分页器属性发生了修改。
   *
   */
  private _emitPageEvent(previousPageIndex: number) {
    this.page.emit({
      previousPageIndex,
      pageIndex: this.pageIndex,
      pageSize: this.pageSize,
      length: this.length,
    });
  }
}

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
  /**
   * If set, styles the "page size" form field with the designated style.
   *
   * 如果设置了，则用指定的样式为“分页大小”表单字段设置样式。
   *
   */
  _formFieldAppearance?: MatFormFieldAppearance;

  /** ID for the DOM node containing the paginator's items per page label. */
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
