/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Direction, Directionality} from '@angular/cdk/bidi';
import {BooleanInput, coerceBooleanProperty} from '@angular/cdk/coercion';
import {
  CollectionViewer,
  DataSource,
  _DisposeViewRepeaterStrategy,
  _RecycleViewRepeaterStrategy,
  isDataSource,
  _VIEW_REPEATER_STRATEGY,
  _ViewRepeater,
  _ViewRepeaterItemChange,
  _ViewRepeaterItemInsertArgs,
  _ViewRepeaterOperation,
} from '@angular/cdk/collections';
import {Platform} from '@angular/cdk/platform';
import {ViewportRuler} from '@angular/cdk/scrolling';
import {DOCUMENT} from '@angular/common';
import {
  AfterContentChecked,
  Attribute,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  ContentChildren,
  Directive,
  ElementRef,
  EmbeddedViewRef,
  EventEmitter,
  Inject,
  Input,
  IterableChangeRecord,
  IterableDiffer,
  IterableDiffers,
  NgZone,
  OnDestroy,
  OnInit,
  Optional,
  Output,
  QueryList,
  SkipSelf,
  TemplateRef,
  TrackByFunction,
  ViewChild,
  ViewContainerRef,
  ViewEncapsulation,
} from '@angular/core';
import {
  BehaviorSubject,
  isObservable,
  Observable,
  of as observableOf,
  Subject,
  Subscription,
} from 'rxjs';
import {take, takeUntil} from 'rxjs/operators';
import {CdkColumnDef} from './cell';
import {_CoalescedStyleScheduler, _COALESCED_STYLE_SCHEDULER} from './coalesced-style-scheduler';
import {
  BaseRowDef,
  CdkCellOutlet,
  CdkCellOutletMultiRowContext,
  CdkCellOutletRowContext,
  CdkFooterRowDef,
  CdkHeaderRowDef,
  CdkNoDataRow,
  CdkRowDef,
} from './row';
import {StickyStyler} from './sticky-styler';
import {
  getTableDuplicateColumnNameError,
  getTableMissingMatchingRowDefError,
  getTableMissingRowDefsError,
  getTableMultipleDefaultRowDefsError,
  getTableUnknownColumnError,
  getTableUnknownDataSourceError,
} from './table-errors';
import {STICKY_POSITIONING_LISTENER, StickyPositioningListener} from './sticky-position-listener';
import {CDK_TABLE} from './tokens';

/**
 * Enables the recycle view repeater strategy, which reduces rendering latency. Not compatible with
 * tables that animate rows.
 *
 * 启用复写器的视图回收策略，从而减少渲染延迟。与为各个表行设置动画的表格不兼容。
 *
 */
@Directive({
  selector: 'cdk-table[recycleRows], table[cdk-table][recycleRows]',
  providers: [{provide: _VIEW_REPEATER_STRATEGY, useClass: _RecycleViewRepeaterStrategy}],
})
export class CdkRecycleRows {}

/**
 * Interface used to provide an outlet for rows to be inserted into.
 *
 * 本接口用来为要插入的行提供出口地标。
 *
 */
export interface RowOutlet {
  viewContainer: ViewContainerRef;
}

/**
 * Possible types that can be set as the data source for a `CdkTable`.
 *
 * 可以被设置为 `CdkTable` 的数据源的可能的类型。
 *
 */
export type CdkTableDataSourceInput<T> = readonly T[] | DataSource<T> | Observable<readonly T[]>;

/**
 * Provides a handle for the table to grab the view container's ng-container to insert data rows.
 *
 * 为表格提供一个抓手来抓取视图容器的 ng-container，以插入数据行。
 *
 * @docs-private
 */
@Directive({selector: '[rowOutlet]'})
export class DataRowOutlet implements RowOutlet {
  constructor(public viewContainer: ViewContainerRef, public elementRef: ElementRef) {}
}

/**
 * Provides a handle for the table to grab the view container's ng-container to insert the header.
 *
 * 为表格提供一个抓手来抓取视图容器的 ng-container，以插入表头。
 *
 * @docs-private
 */
@Directive({selector: '[headerRowOutlet]'})
export class HeaderRowOutlet implements RowOutlet {
  constructor(public viewContainer: ViewContainerRef, public elementRef: ElementRef) {}
}

/**
 * Provides a handle for the table to grab the view container's ng-container to insert the footer.
 *
 * 为表格提供一个抓手来抓取视图容器的 ng-container，以插入表尾。
 *
 * @docs-private
 */
@Directive({selector: '[footerRowOutlet]'})
export class FooterRowOutlet implements RowOutlet {
  constructor(public viewContainer: ViewContainerRef, public elementRef: ElementRef) {}
}

/**
 * Provides a handle for the table to grab the view
 * container's ng-container to insert the no data row.
 *
 * 为表格提供一个抓手来抓取视图容器的 ng-container，以插入无数据行。
 *
 * @docs-private
 */
@Directive({selector: '[noDataRowOutlet]'})
export class NoDataRowOutlet implements RowOutlet {
  constructor(public viewContainer: ViewContainerRef, public elementRef: ElementRef) {}
}

/**
 * The table template that can be used by the mat-table. Should not be used outside of the
 * material library.
 *
 * mat-table 中可以使用的表格模板。不应该在 Material 库之外使用。
 *
 * @docs-private
 */
export const CDK_TABLE_TEMPLATE =
  // Note that according to MDN, the `caption` element has to be projected as the **first**
  // element in the table. See https://developer.mozilla.org/en-US/docs/Web/HTML/Element/caption
  `
  <ng-content select="caption"></ng-content>
  <ng-content select="colgroup, col"></ng-content>
  <ng-container headerRowOutlet></ng-container>
  <ng-container rowOutlet></ng-container>
  <ng-container noDataRowOutlet></ng-container>
  <ng-container footerRowOutlet></ng-container>
`;

/**
 * Interface used to conveniently type the possible context interfaces for the render row.
 *
 * 本接口是为渲染行提供上下文接口的便利类型。
 *
 * @docs-private
 */
export interface RowContext<T>
  extends CdkCellOutletMultiRowContext<T>,
    CdkCellOutletRowContext<T> {}

/**
 * Class used to conveniently type the embedded view ref for rows with a context.
 *
 * 本类是为带上下文的行提供嵌入式视图的便利类型。
 *
 * @docs-private
 */
abstract class RowViewRef<T> extends EmbeddedViewRef<RowContext<T>> {}

/**
 * Set of properties that represents the identity of a single rendered row.
 *
 * 用来表示单渲染行标识的属性集。
 *
 * When the table needs to determine the list of rows to render, it will do so by iterating through
 * each data object and evaluating its list of row templates to display (when multiTemplateDataRows
 * is false, there is only one template per data object). For each pair of data object and row
 * template, a `RenderRow` is added to the list of rows to render. If the data object and row
 * template pair has already been rendered, the previously used `RenderRow` is added; else a new
 * `RenderRow` is \* created. Once the list is complete and all data objects have been iterated
 * through, a diff is performed to determine the changes that need to be made to the rendered rows.
 *
 * 当表格需要确定要渲染的行的列表时，它会迭代遍历每个数据对象并评估它要显示的行模板的列表（当 multiTemplateDataRows 为 false 时，每个数据对象只有一个模板）。
 * 每对数据对象和行模板都会把一个 `RenderRow` 添加到要渲染的行列表中。如果已经渲染过这个数据对象和行模板对，就会添加以前用过的 `RenderRow`，否则就会创建一个新的 `RenderRow`。
 * 一旦列表完成、迭代完所有的数据对象之后，才会执行 diff 来确定需要对渲染行进行的更改。
 * @docs-private
 */
export interface RenderRow<T> {
  data: T;
  dataIndex: number;
  rowDef: CdkRowDef<T>;
}

/**
 * A data table that can render a header row, data rows, and a footer row.
 * Uses the dataSource input to determine the data to be rendered. The data can be provided either
 * as a data array, an Observable stream that emits the data array to render, or a DataSource with a
 * connect function that will return an Observable stream that emits the data array to render.
 *
 * 一个可以渲染表头行、数据行和表尾行的数据表格。使用输入属性 dataSource 来确定要渲染的数据。 这些数据既可以提供为数据数组，也可以提供为要渲染数组的 Observable 流，还提供为一个带有 connect 函数的 DataSource，该函数将返回一个发出要渲染的数组的 Observable 流。
 *
 */
@Component({
  selector: 'cdk-table, table[cdk-table]',
  exportAs: 'cdkTable',
  template: CDK_TABLE_TEMPLATE,
  styleUrls: ['table.css'],
  host: {
    'class': 'cdk-table',
    '[class.cdk-table-fixed-layout]': 'fixedLayout',
    'ngSkipHydration': '',
  },
  encapsulation: ViewEncapsulation.None,
  // The "OnPush" status for the `MatTable` component is effectively a noop, so we are removing it.
  // The view for `MatTable` consists entirely of templates declared in other views. As they are
  // declared elsewhere, they are checked when their declaration points are checked.
  // tslint:disable-next-line:validate-decorators
  changeDetection: ChangeDetectionStrategy.Default,
  providers: [
    {provide: CDK_TABLE, useExisting: CdkTable},
    {provide: _VIEW_REPEATER_STRATEGY, useClass: _DisposeViewRepeaterStrategy},
    {provide: _COALESCED_STYLE_SCHEDULER, useClass: _CoalescedStyleScheduler},
    // Prevent nested tables from seeing this table's StickyPositioningListener.
    {provide: STICKY_POSITIONING_LISTENER, useValue: null},
  ],
})
export class CdkTable<T> implements AfterContentChecked, CollectionViewer, OnDestroy, OnInit {
  private _document: Document;

  /**
   * Latest data provided by the data source.
   *
   * 数据源提供的最新数据。
   *
   */
  protected _data: readonly T[];

  /**
   * Subject that emits when the component has been destroyed.
   *
   * 组件被销毁后发出通知的主体对象。
   *
   */
  private readonly _onDestroy = new Subject<void>();

  /**
   * List of the rendered rows as identified by their `RenderRow` object.
   *
   * 以 `RenderRow` 对象为标识的渲染行列表。
   *
   */
  private _renderRows: RenderRow<T>[];

  /**
   * Subscription that listens for the data provided by the data source.
   *
   * 用于监听数据源提供的数据的订阅。
   *
   */
  private _renderChangeSubscription: Subscription | null;

  /**
   * Map of all the user's defined columns (header, data, and footer cell template) identified by
   * name. Collection populated by the column definitions gathered by `ContentChildren` as well as
   * any custom column definitions added to `_customColumnDefs`.
   *
   * 从列名到所有用户自定义列（表头、数据行和表尾的模板）的映射表。
   * 内含所有通过 `ContentChildren` 收集的列定义和添加到 `_customColumnDefs` 的所有自定义列定义。
   *
   */
  private _columnDefsByName = new Map<string, CdkColumnDef>();

  /**
   * Set of all row definitions that can be used by this table. Populated by the rows gathered by
   * using `ContentChildren` as well as any custom row definitions added to `_customRowDefs`.
   *
   * 这个表格可以使用的所有行定义的集合。内含所有通过 `ContentChildren` 收集的行定义和添加到 `_customRowDefs` 的所有自定义行定义。
   *
   */
  private _rowDefs: CdkRowDef<T>[];

  /**
   * Set of all header row definitions that can be used by this table. Populated by the rows
   * gathered by using `ContentChildren` as well as any custom row definitions added to
   * `_customHeaderRowDefs`.
   *
   * 这个表格可以使用的所有表头行定义的集合。内含所有通过 `ContentChildren` 收集的行定义和添加到 `_customRowDefs` 的所有自定义行定义。
   *
   */
  private _headerRowDefs: CdkHeaderRowDef[];

  /**
   * Set of all row definitions that can be used by this table. Populated by the rows gathered by
   * using `ContentChildren` as well as any custom row definitions added to
   * `_customFooterRowDefs`.
   *
   * 这个表格可以使用的所有表尾行定义的集合。内含所有通过 `ContentChildren` 收集的行定义和添加到 `_customRowDefs` 的所有自定义行定义。
   *
   */
  private _footerRowDefs: CdkFooterRowDef[];

  /**
   * Differ used to find the changes in the data provided by the data source.
   *
   * 用于查找数据源提供的数据变化的差分器。
   *
   */
  private _dataDiffer: IterableDiffer<RenderRow<T>>;

  /**
   * Stores the row definition that does not have a when predicate.
   *
   * 存储那些不带 when 谓词的行定义。
   *
   */
  private _defaultRowDef: CdkRowDef<T> | null;

  /**
   * Column definitions that were defined outside of the direct content children of the table.
   * These will be defined when, e.g., creating a wrapper around the cdkTable that has
   * column definitions as *its* content child.
   *
   * 在表格的直接内容子组件之外定义的列定义。比如创建 cdkTable 的包装器中有某些列定义作为*其*子内容等情况。
   *
   */
  private _customColumnDefs = new Set<CdkColumnDef>();

  /**
   * Data row definitions that were defined outside of the direct content children of the table.
   * These will be defined when, e.g., creating a wrapper around the cdkTable that has
   * built-in data rows as *its* content child.
   *
   * 在表格的直接内容子组件之外定义的数据行定义。比如创建 cdkTable 的包装器中有某些内置数据行作为*其*子内容等情况。
   *
   */
  private _customRowDefs = new Set<CdkRowDef<T>>();

  /**
   * Header row definitions that were defined outside of the direct content children of the table.
   * These will be defined when, e.g., creating a wrapper around the cdkTable that has
   * built-in header rows as *its* content child.
   *
   * 在表格的直接内容子组件之外定义的表头行定义。比如创建 cdkTable 的包装器中有某些内置表头行作为*其*子内容等情况。
   *
   */
  private _customHeaderRowDefs = new Set<CdkHeaderRowDef>();

  /**
   * Footer row definitions that were defined outside of the direct content children of the table.
   * These will be defined when, e.g., creating a wrapper around the cdkTable that has a
   * built-in footer row as *its* content child.
   *
   * 在表格的直接内容子组件之外定义的表尾行定义。比如创建 cdkTable 的包装器中有某些内置表尾行作为*其*子内容等情况。
   *
   */
  private _customFooterRowDefs = new Set<CdkFooterRowDef>();

  /**
   * No data row that was defined outside of the direct content children of the table.
   *
   * 在表格的直接内容子组件之外定义的无数据行。
   *
   */
  private _customNoDataRow: CdkNoDataRow | null;

  /**
   * Whether the header row definition has been changed. Triggers an update to the header row after
   * content is checked. Initialized as true so that the table renders the initial set of rows.
   *
   * 表头行定义是否已更改。在检查内容后，触发对表头行的更新。初始化为 true，以便表格会渲染初始行的集合。
   *
   */
  private _headerRowDefChanged = true;

  /**
   * Whether the footer row definition has been changed. Triggers an update to the footer row after
   * content is checked. Initialized as true so that the table renders the initial set of rows.
   *
   * 表尾行定义是否已更改。在检查内容后，触发对表尾行的更新。初始化为 true，以便表格会渲染初始行的集合。
   *
   */
  private _footerRowDefChanged = true;

  /**
   * Whether the sticky column styles need to be updated. Set to `true` when the visible columns
   * change.
   *
   * 粘性列的样式是否需要更新。当可见列发生变化时，设置为 `true`
   *
   */
  private _stickyColumnStylesNeedReset = true;

  /**
   * Whether the sticky styler should recalculate cell widths when applying sticky styles. If
   * `false`, cached values will be used instead. This is only applicable to tables with
   * {@link fixedLayout} enabled. For other tables, cell widths will always be recalculated.
   *
   * 应用粘性样式时，粘性样式器是否应该重新计算单元格的宽度。如果为 `false`，则会改为使用缓存的值。这仅适用于已启用 {@link fixedLayout} 的表格。对于其他表格，我们总会重新计算单元格的宽度。
   *
   */
  private _forceRecalculateCellWidths = true;

  /**
   * Cache of the latest rendered `RenderRow` objects as a map for easy retrieval when constructing
   * a new list of `RenderRow` objects for rendering rows. Since the new list is constructed with
   * the cached `RenderRow` objects when possible, the row identity is preserved when the data
   * and row template matches, which allows the `IterableDiffer` to check rows by reference
   * and understand which rows are added/moved/removed.
   *
   * 最新渲染的 `RenderRow` 对象的缓存，存为映射表结构，以便于为渲染行构造新的 `RenderRow` 对象时进行检索。
   * 由于新列表会尽可能用缓存的 `RenderRow` 对象构造，所以当数据和行模板匹配时，就会保留行标识，
   * 这样 `IterableDiffer` 就可以通过引用来检查行，并了解有哪些行被添加/移动/删除了。
   *
   * Implemented as a map of maps where the first key is the `data: T` object and the second is the
   * `CdkRowDef<T>` object. With the two keys, the cache points to a `RenderRow<T>` object that
   * contains an array of created pairs. The array is necessary to handle cases where the data
   * array contains multiple duplicate data objects and each instantiated `RenderRow` must be
   * stored.
   *
   * 实现为映射表的映射表，第一个键是 `data: T` 对象，第二个是 `CdkRowDef<T>` 对象。使用这两个键，缓存就会指向一个包含一个包含已创建键值对数组的 `RenderRow<T>` 对象。这种对象数组在包含多个重复数据对象并且必须存储每个 `RenderRow` 实例的情况下是必要的。
   *
   */
  private _cachedRenderRowsMap = new Map<T, WeakMap<CdkRowDef<T>, RenderRow<T>[]>>();

  /**
   * Whether the table is applied to a native `<table>`.
   *
   * 表格是否应用于原生 `<table>`。
   *
   */
  protected _isNativeHtmlTable: boolean;

  /**
   * Utility class that is responsible for applying the appropriate sticky positioning styles to
   * the table's rows and cells.
   *
   * 这个实用工具类负责把相应的粘性定位样式应用到表格的行和单元格中。
   *
   */
  private _stickyStyler: StickyStyler;

  /**
   * CSS class added to any row or cell that has sticky positioning applied. May be overridden by
   * table subclasses.
   *
   * CSS 类被添加到任何已应用了粘性定位的行或单元格中。可以被表格的子类改写。
   *
   */
  protected stickyCssClass: string = 'cdk-table-sticky';

  /**
   * Whether to manually add position: sticky to all sticky cell elements. Not needed if
   * the position is set in a selector associated with the value of stickyCssClass. May be
   * overridden by table subclasses
   *
   * 是否要为所有粘性单元格元素手动添加 position: sticky。如果 position 是在与 stickyCssClass 值相关联的选择器中设置的，则不需要。可以被表格的子类所改写
   *
   */
  protected needsPositionStickyOnElement = true;

  /**
   * Whether the no data row is currently showing anything.
   *
   * 无数据行当前是否正在显示任何内容。
   *
   */
  private _isShowingNoDataRow = false;

  /**
   * Tracking function that will be used to check the differences in data changes. Used similarly
   * to `ngFor` `trackBy` function. Optimize row operations by identifying a row based on its data
   * relative to the function to know if a row should be added/removed/moved.
   * Accepts a function that takes two parameters, `index` and `item`.
   *
   * 跟踪函数，用于检查数据变化的差异。类似于 `ngFor` 的 `trackBy` 函数。
   * 可以优化行操作，方法是根据该函数处理后的数据来标识一行，以了解该行是否应添加/删除/移动。接受带两个参数 `index` 和 `item` 的函数。
   *
   */
  @Input()
  get trackBy(): TrackByFunction<T> {
    return this._trackByFn;
  }
  set trackBy(fn: TrackByFunction<T>) {
    if ((typeof ngDevMode === 'undefined' || ngDevMode) && fn != null && typeof fn !== 'function') {
      console.warn(`trackBy must be a function, but received ${JSON.stringify(fn)}.`);
    }
    this._trackByFn = fn;
  }
  private _trackByFn: TrackByFunction<T>;

  /**
   * The table's source of data, which can be provided in three ways (in order of complexity):
   *
   * 该表格的数据源可以通过三种方式提供（按复杂程度排序）：
   *
   * - Simple data array (each object represents one table row)
   *
   *   简单数据数组（每个对象代表格一个表格行）
   *
   * - Stream that emits a data array each time the array changes
   *
   *   每当数组发生变化时都会发出数据数组的流
   *
   * - `DataSource` object that implements the connect/disconnect interface.
   *
   *   那些实现了 connect / disconnect 接口的 `DataSource`。
   *
   * If a data array is provided, the table must be notified when the array's objects are
   * added, removed, or moved. This can be done by calling the `renderRows()` function which will
   * render the diff since the last table render. If the data array reference is changed, the table
   * will automatically trigger an update to the rows.
   *
   * 如果提供了数组，那么在添加、删除或移动该数组的对象时，都必须通知该表格。
   * 这可以通过调用 `renderRows()` 函数来完成，它会渲染自上次渲染表格以来的差异部分。如果数据数组的引用发生了变化，该表格会自动触发对行的更新。
   *
   * When providing an Observable stream, the table will trigger an update automatically when the
   * stream emits a new array of data.
   *
   * 当提供一个可观察的流时，如果该流发出一个新的数据数组，该表格就会自动触发一次更新。
   *
   * Finally, when providing a `DataSource` object, the table will use the Observable stream
   * provided by the connect function and trigger updates when that stream emits new data array
   * values. During the table's ngOnDestroy or when the data source is removed from the table, the
   * table will call the DataSource's `disconnect` function (may be useful for cleaning up any
   * subscriptions registered during the connect process).
   *
   * 最后，在提供 `DataSource` 对象时，该表格将使用 connect 函数提供的 Observable 流，并在该流发出新的数据数组值时触发更新。
   * 在表格的 ngOnDestroy 中，或者从表格中删除了数据源时，该表格会调用数据源的 `disconnect` 函数（这可能对清理在连接过程中注册的所有订阅很有帮助）。
   */
  @Input()
  get dataSource(): CdkTableDataSourceInput<T> {
    return this._dataSource;
  }
  set dataSource(dataSource: CdkTableDataSourceInput<T>) {
    if (this._dataSource !== dataSource) {
      this._switchDataSource(dataSource);
    }
  }
  private _dataSource: CdkTableDataSourceInput<T>;

  /**
   * Whether to allow multiple rows per data object by evaluating which rows evaluate their 'when'
   * predicate to true. If `multiTemplateDataRows` is false, which is the default value, then each
   * dataobject will render the first row that evaluates its when predicate to true, in the order
   * defined in the table, or otherwise the default row which does not have a when predicate.
   *
   * 通过计算哪些行的 'when' 谓词结果为 true 来允许其数据对象对应于多行。
   * 如果 `multiTemplateDataRows` 为 false（这是默认值），那么每个数据对象都会渲染到其谓词结果为 true 的第一行（按照表格中定义的顺序），
   * 否则就使用默认行（即没有 when 谓词的行）。
   *
   */
  @Input()
  get multiTemplateDataRows(): boolean {
    return this._multiTemplateDataRows;
  }
  set multiTemplateDataRows(v: BooleanInput) {
    this._multiTemplateDataRows = coerceBooleanProperty(v);

    // In Ivy if this value is set via a static attribute (e.g. <table multiTemplateDataRows>),
    // this setter will be invoked before the row outlet has been defined hence the null check.
    if (this._rowOutlet && this._rowOutlet.viewContainer.length) {
      this._forceRenderDataRows();
      this.updateStickyColumnStyles();
    }
  }
  _multiTemplateDataRows: boolean = false;

  /**
   * Whether to use a fixed table layout. Enabling this option will enforce consistent column widths
   * and optimize rendering sticky styles for native tables. No-op for flex tables.
   *
   * 是否使用固定（fixed）表格布局。启用此选项会强制让所有列宽一致，并优化渲染原生表格的粘性样式。对弹性（flex）表格无效。
   *
   */
  @Input()
  get fixedLayout(): boolean {
    return this._fixedLayout;
  }
  set fixedLayout(v: BooleanInput) {
    this._fixedLayout = coerceBooleanProperty(v);

    // Toggling `fixedLayout` may change column widths. Sticky column styles should be recalculated.
    this._forceRecalculateCellWidths = true;
    this._stickyColumnStylesNeedReset = true;
  }
  private _fixedLayout: boolean = false;

  /**
   * Emits when the table completes rendering a set of data rows based on the latest data from the
   * data source, even if the set of rows is empty.
   *
   * 当表格使用来自数据源的最新数据渲染完一组数据行时发出，即使该组行是空的。
   *
   */
  @Output()
  readonly contentChanged = new EventEmitter<void>();

  // TODO(andrewseguin): Remove max value as the end index
  //   and instead calculate the view on init and scroll.
  /**
   * Stream containing the latest information on what rows are being displayed on screen.
   * Can be used by the data source to as a heuristic of what data should be provided.
   *
   * 这个流包含哪些行正显示在屏幕上的最新信息。可以被数据源用作该提供哪些数据的线索。
   *
   * @docs-private
   */
  readonly viewChange = new BehaviorSubject<{start: number; end: number}>({
    start: 0,
    end: Number.MAX_VALUE,
  });

  // Outlets in the table's template where the header, data rows, and footer will be inserted.
  @ViewChild(DataRowOutlet, {static: true}) _rowOutlet: DataRowOutlet;
  @ViewChild(HeaderRowOutlet, {static: true}) _headerRowOutlet: HeaderRowOutlet;
  @ViewChild(FooterRowOutlet, {static: true}) _footerRowOutlet: FooterRowOutlet;
  @ViewChild(NoDataRowOutlet, {static: true}) _noDataRowOutlet: NoDataRowOutlet;

  /**
   * The column definitions provided by the user that contain what the header, data, and footer
   * cells should render for each column.
   *
   * 用户提供的列定义，包含每个列应该渲染的表头、数据和表尾单元格。
   *
   */
  @ContentChildren(CdkColumnDef, {descendants: true}) _contentColumnDefs: QueryList<CdkColumnDef>;

  /**
   * Set of data row definitions that were provided to the table as content children.
   *
   * 作为内容子组件提供给表格的数据行定义集。
   *
   */
  @ContentChildren(CdkRowDef, {descendants: true}) _contentRowDefs: QueryList<CdkRowDef<T>>;

  /**
   * Set of header row definitions that were provided to the table as content children.
   *
   * 表头行定义的集合，以内容子组件的形式提供给表格。
   *
   */
  @ContentChildren(CdkHeaderRowDef, {
    descendants: true,
  })
  _contentHeaderRowDefs: QueryList<CdkHeaderRowDef>;

  /**
   * Set of footer row definitions that were provided to the table as content children.
   *
   * 表尾行定义的集合，以内容子组件的形式提供给表格。
   *
   */
  @ContentChildren(CdkFooterRowDef, {
    descendants: true,
  })
  _contentFooterRowDefs: QueryList<CdkFooterRowDef>;

  /**
   * Row definition that will only be rendered if there's no data in the table.
   *
   * 只有在表格中没有数据时才会渲染的行定义。
   *
   */
  @ContentChild(CdkNoDataRow) _noDataRow: CdkNoDataRow;

  constructor(
    protected readonly _differs: IterableDiffers,
    protected readonly _changeDetectorRef: ChangeDetectorRef,
    protected readonly _elementRef: ElementRef,
    @Attribute('role') role: string,
    @Optional() protected readonly _dir: Directionality,
    @Inject(DOCUMENT) _document: any,
    private _platform: Platform,
    @Inject(_VIEW_REPEATER_STRATEGY)
    protected readonly _viewRepeater: _ViewRepeater<T, RenderRow<T>, RowContext<T>>,
    @Inject(_COALESCED_STYLE_SCHEDULER)
    protected readonly _coalescedStyleScheduler: _CoalescedStyleScheduler,
    private readonly _viewportRuler: ViewportRuler,
    /**
     * @deprecated `_stickyPositioningListener` parameter to become required.
     * @breaking-change 13.0.0
     */
    @Optional()
    @SkipSelf()
    @Inject(STICKY_POSITIONING_LISTENER)
    protected readonly _stickyPositioningListener: StickyPositioningListener,
    /**
     * @deprecated `_ngZone` parameter to become required.
     * @breaking-change 14.0.0
     */
    @Optional()
    protected readonly _ngZone?: NgZone,
  ) {
    if (!role) {
      this._elementRef.nativeElement.setAttribute('role', 'table');
    }

    this._document = _document;
    this._isNativeHtmlTable = this._elementRef.nativeElement.nodeName === 'TABLE';
  }

  ngOnInit() {
    this._setupStickyStyler();

    if (this._isNativeHtmlTable) {
      this._applyNativeTableSections();
    }

    // Set up the trackBy function so that it uses the `RenderRow` as its identity by default. If
    // the user has provided a custom trackBy, return the result of that function as evaluated
    // with the values of the `RenderRow`'s data and index.
    this._dataDiffer = this._differs.find([]).create((_i: number, dataRow: RenderRow<T>) => {
      return this.trackBy ? this.trackBy(dataRow.dataIndex, dataRow.data) : dataRow;
    });

    this._viewportRuler
      .change()
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this._forceRecalculateCellWidths = true;
      });
  }

  ngAfterContentChecked() {
    // Cache the row and column definitions gathered by ContentChildren and programmatic injection.
    this._cacheRowDefs();
    this._cacheColumnDefs();

    // Make sure that the user has at least added header, footer, or data row def.
    if (
      !this._headerRowDefs.length &&
      !this._footerRowDefs.length &&
      !this._rowDefs.length &&
      (typeof ngDevMode === 'undefined' || ngDevMode)
    ) {
      throw getTableMissingRowDefsError();
    }

    // Render updates if the list of columns have been changed for the header, row, or footer defs.
    const columnsChanged = this._renderUpdatedColumns();
    const rowDefsChanged = columnsChanged || this._headerRowDefChanged || this._footerRowDefChanged;
    // Ensure sticky column styles are reset if set to `true` elsewhere.
    this._stickyColumnStylesNeedReset = this._stickyColumnStylesNeedReset || rowDefsChanged;
    this._forceRecalculateCellWidths = rowDefsChanged;

    // If the header row definition has been changed, trigger a render to the header row.
    if (this._headerRowDefChanged) {
      this._forceRenderHeaderRows();
      this._headerRowDefChanged = false;
    }

    // If the footer row definition has been changed, trigger a render to the footer row.
    if (this._footerRowDefChanged) {
      this._forceRenderFooterRows();
      this._footerRowDefChanged = false;
    }

    // If there is a data source and row definitions, connect to the data source unless a
    // connection has already been made.
    if (this.dataSource && this._rowDefs.length > 0 && !this._renderChangeSubscription) {
      this._observeRenderChanges();
    } else if (this._stickyColumnStylesNeedReset) {
      // In the above case, _observeRenderChanges will result in updateStickyColumnStyles being
      // called when it row data arrives. Otherwise, we need to call it proactively.
      this.updateStickyColumnStyles();
    }

    this._checkStickyStates();
  }

  ngOnDestroy() {
    [
      this._rowOutlet.viewContainer,
      this._headerRowOutlet.viewContainer,
      this._footerRowOutlet.viewContainer,
      this._cachedRenderRowsMap,
      this._customColumnDefs,
      this._customRowDefs,
      this._customHeaderRowDefs,
      this._customFooterRowDefs,
      this._columnDefsByName,
    ].forEach(def => {
      def.clear();
    });

    this._headerRowDefs = [];
    this._footerRowDefs = [];
    this._defaultRowDef = null;
    this._onDestroy.next();
    this._onDestroy.complete();

    if (isDataSource(this.dataSource)) {
      this.dataSource.disconnect(this);
    }
  }

  /**
   * Renders rows based on the table's latest set of data, which was either provided directly as an
   * input or retrieved through an Observable stream (directly or from a DataSource).
   * Checks for differences in the data since the last diff to perform only the necessary
   * changes (add/remove/move rows).
   *
   * 根据表格中最新的数据集来渲染行，这些数据既可以直接输入，也可以从一个可观察的流中检索出来（直接获取或从 DataSource 获取）。检查自上次 diff 之后的数据差异，以便只进行必要的修改（添加/删除/移动行）。
   *
   * If the table's data source is a DataSource or Observable, this will be invoked automatically
   * each time the provided Observable stream emits a new data array. Otherwise if your data is
   * an array, this function will need to be called to render any changes.
   *
   * 如果表格的数据源是 DataSource 或者 Observable，每当提供的 Observable 流发出一个新的数据数组时，都会自动调用它。如果你的数据是数组，那么就需要手动调用这个函数来渲染任何变化。
   *
   */
  renderRows() {
    this._renderRows = this._getAllRenderRows();
    const changes = this._dataDiffer.diff(this._renderRows);
    if (!changes) {
      this._updateNoDataRow();
      this.contentChanged.next();
      return;
    }
    const viewContainer = this._rowOutlet.viewContainer;

    this._viewRepeater.applyChanges(
      changes,
      viewContainer,
      (
        record: IterableChangeRecord<RenderRow<T>>,
        _adjustedPreviousIndex: number | null,
        currentIndex: number | null,
      ) => this._getEmbeddedViewArgs(record.item, currentIndex!),
      record => record.item.data,
      (change: _ViewRepeaterItemChange<RenderRow<T>, RowContext<T>>) => {
        if (change.operation === _ViewRepeaterOperation.INSERTED && change.context) {
          this._renderCellTemplateForItem(change.record.item.rowDef, change.context);
        }
      },
    );

    // Update the meta context of a row's context data (index, count, first, last, ...)
    this._updateRowIndexContext();

    // Update rows that did not get added/removed/moved but may have had their identity changed,
    // e.g. if trackBy matched data on some property but the actual data reference changed.
    changes.forEachIdentityChange((record: IterableChangeRecord<RenderRow<T>>) => {
      const rowView = <RowViewRef<T>>viewContainer.get(record.currentIndex!);
      rowView.context.$implicit = record.item.data;
    });

    this._updateNoDataRow();

    // Allow the new row data to render before measuring it.
    // @breaking-change 14.0.0 Remove undefined check once _ngZone is required.
    if (this._ngZone && NgZone.isInAngularZone()) {
      this._ngZone.onStable.pipe(take(1), takeUntil(this._onDestroy)).subscribe(() => {
        this.updateStickyColumnStyles();
      });
    } else {
      this.updateStickyColumnStyles();
    }

    this.contentChanged.next();
  }

  /**
   * Adds a column definition that was not included as part of the content children.
   *
   * 添加一个未包含在内容子组件中的列定义。
   *
   */
  addColumnDef(columnDef: CdkColumnDef) {
    this._customColumnDefs.add(columnDef);
  }

  /**
   * Removes a column definition that was not included as part of the content children.
   *
   * 删除那些未包含在内容子组件中的列定义。
   *
   */
  removeColumnDef(columnDef: CdkColumnDef) {
    this._customColumnDefs.delete(columnDef);
  }

  /**
   * Adds a row definition that was not included as part of the content children.
   *
   * 添加一个未包含在内容子组件中的行定义。
   *
   */
  addRowDef(rowDef: CdkRowDef<T>) {
    this._customRowDefs.add(rowDef);
  }

  /**
   * Removes a row definition that was not included as part of the content children.
   *
   * 删除那些未包含在内容子组件中的行定义。
   *
   */
  removeRowDef(rowDef: CdkRowDef<T>) {
    this._customRowDefs.delete(rowDef);
  }

  /**
   * Adds a header row definition that was not included as part of the content children.
   *
   * 添加一个未包含在内容子组件中的表头行定义。
   *
   */
  addHeaderRowDef(headerRowDef: CdkHeaderRowDef) {
    this._customHeaderRowDefs.add(headerRowDef);
    this._headerRowDefChanged = true;
  }

  /**
   * Removes a header row definition that was not included as part of the content children.
   *
   * 删除那些未包含在内容子组件中的表头行定义。
   *
   */
  removeHeaderRowDef(headerRowDef: CdkHeaderRowDef) {
    this._customHeaderRowDefs.delete(headerRowDef);
    this._headerRowDefChanged = true;
  }

  /**
   * Adds a footer row definition that was not included as part of the content children.
   *
   * 添加一个未包含在内容子组件中的表尾行定义。
   *
   */
  addFooterRowDef(footerRowDef: CdkFooterRowDef) {
    this._customFooterRowDefs.add(footerRowDef);
    this._footerRowDefChanged = true;
  }

  /**
   * Removes a footer row definition that was not included as part of the content children.
   *
   * 删除一个未包含在内容子组件中的表尾行定义。
   *
   */
  removeFooterRowDef(footerRowDef: CdkFooterRowDef) {
    this._customFooterRowDefs.delete(footerRowDef);
    this._footerRowDefChanged = true;
  }

  /**
   * Sets a no data row definition that was not included as a part of the content children.
   *
   * 设置一个没有包含在内容子组件中的无数据行定义。
   *
   */
  setNoDataRow(noDataRow: CdkNoDataRow | null) {
    this._customNoDataRow = noDataRow;
  }

  /**
   * Updates the header sticky styles. First resets all applied styles with respect to the cells
   * sticking to the top. Then, evaluating which cells need to be stuck to the top. This is
   * automatically called when the header row changes its displayed set of columns, or if its
   * sticky input changes. May be called manually for cases where the cell content changes outside
   * of these events.
   *
   * 更新表头的粘性样式。首先，对于已粘附在顶部的单元格，重置所有已应用的样式。然后，评估哪些单元格需要粘附在上面。当表头行所显示的一组列发生变化时，或者其粘性属性发生变化时，会自动调用它。如果单元格内容在上述事件之外发生了变化，可以手动调用。
   *
   */
  updateStickyHeaderRowStyles(): void {
    const headerRows = this._getRenderedRows(this._headerRowOutlet);
    const tableElement = this._elementRef.nativeElement as HTMLElement;

    // Hide the thead element if there are no header rows. This is necessary to satisfy
    // overzealous a11y checkers that fail because the `rowgroup` element does not contain
    // required child `row`.
    const thead = tableElement.querySelector('thead');
    if (thead) {
      thead.style.display = headerRows.length ? '' : 'none';
    }

    const stickyStates = this._headerRowDefs.map(def => def.sticky);
    this._stickyStyler.clearStickyPositioning(headerRows, ['top']);
    this._stickyStyler.stickRows(headerRows, stickyStates, 'top');

    // Reset the dirty state of the sticky input change since it has been used.
    this._headerRowDefs.forEach(def => def.resetStickyChanged());
  }

  /**
   * Updates the footer sticky styles. First resets all applied styles with respect to the cells
   * sticking to the bottom. Then, evaluating which cells need to be stuck to the bottom. This is
   * automatically called when the footer row changes its displayed set of columns, or if its
   * sticky input changes. May be called manually for cases where the cell content changes outside
   * of these events.
   *
   * 更新表尾的粘性样式。首先，对于已粘附在底部的单元格，重置所有已应用的样式。然后，评估哪些单元格需要粘附在底部。当表尾行所显示的一组列发生变化时，或者其粘性属性发生变化时，会自动调用它。如果单元格内容在上述事件之外发生了变化，可以手动调用。
   *
   */
  updateStickyFooterRowStyles(): void {
    const footerRows = this._getRenderedRows(this._footerRowOutlet);
    const tableElement = this._elementRef.nativeElement as HTMLElement;

    // Hide the tfoot element if there are no footer rows. This is necessary to satisfy
    // overzealous a11y checkers that fail because the `rowgroup` element does not contain
    // required child `row`.
    const tfoot = tableElement.querySelector('tfoot');
    if (tfoot) {
      tfoot.style.display = footerRows.length ? '' : 'none';
    }

    const stickyStates = this._footerRowDefs.map(def => def.sticky);
    this._stickyStyler.clearStickyPositioning(footerRows, ['bottom']);
    this._stickyStyler.stickRows(footerRows, stickyStates, 'bottom');
    this._stickyStyler.updateStickyFooterContainer(this._elementRef.nativeElement, stickyStates);

    // Reset the dirty state of the sticky input change since it has been used.
    this._footerRowDefs.forEach(def => def.resetStickyChanged());
  }

  /**
   * Updates the column sticky styles. First resets all applied styles with respect to the cells
   * sticking to the left and right. Then sticky styles are added for the left and right according
   * to the column definitions for each cell in each row. This is automatically called when
   * the data source provides a new set of data or when a column definition changes its sticky
   * input. May be called manually for cases where the cell content changes outside of these events.
   *
   * 更新列的粘性样式。首先，对于已粘附在左右两侧的单元格，重置所有已应用的样式。然后，根据每一行中每个单元格的列定义，评估哪些单元格需要粘附在左侧或右侧。当列定义的粘性属性发生变化时，会自动调用它。如果单元格内容在上述事件之外发生了变化，可以手动调用。
   *
   */
  updateStickyColumnStyles() {
    const headerRows = this._getRenderedRows(this._headerRowOutlet);
    const dataRows = this._getRenderedRows(this._rowOutlet);
    const footerRows = this._getRenderedRows(this._footerRowOutlet);

    // For tables not using a fixed layout, the column widths may change when new rows are rendered.
    // In a table using a fixed layout, row content won't affect column width, so sticky styles
    // don't need to be cleared unless either the sticky column config changes or one of the row
    // defs change.
    if ((this._isNativeHtmlTable && !this._fixedLayout) || this._stickyColumnStylesNeedReset) {
      // Clear the left and right positioning from all columns in the table across all rows since
      // sticky columns span across all table sections (header, data, footer)
      this._stickyStyler.clearStickyPositioning(
        [...headerRows, ...dataRows, ...footerRows],
        ['left', 'right'],
      );
      this._stickyColumnStylesNeedReset = false;
    }

    // Update the sticky styles for each header row depending on the def's sticky state
    headerRows.forEach((headerRow, i) => {
      this._addStickyColumnStyles([headerRow], this._headerRowDefs[i]);
    });

    // Update the sticky styles for each data row depending on its def's sticky state
    this._rowDefs.forEach(rowDef => {
      // Collect all the rows rendered with this row definition.
      const rows: HTMLElement[] = [];
      for (let i = 0; i < dataRows.length; i++) {
        if (this._renderRows[i].rowDef === rowDef) {
          rows.push(dataRows[i]);
        }
      }

      this._addStickyColumnStyles(rows, rowDef);
    });

    // Update the sticky styles for each footer row depending on the def's sticky state
    footerRows.forEach((footerRow, i) => {
      this._addStickyColumnStyles([footerRow], this._footerRowDefs[i]);
    });

    // Reset the dirty state of the sticky input change since it has been used.
    Array.from(this._columnDefsByName.values()).forEach(def => def.resetStickyChanged());
  }

  /**
   * Get the list of RenderRow objects to render according to the current list of data and defined
   * row definitions. If the previous list already contained a particular pair, it should be reused
   * so that the differ equates their references.
   *
   * 根据当前的数据列表和行定义，获得要渲染的 RenderRow 对象列表。如果以前的列表中已经包含了一个特定的配对，那就应该复用它，以便让差分器认为它没变。
   *
   */
  private _getAllRenderRows(): RenderRow<T>[] {
    const renderRows: RenderRow<T>[] = [];

    // Store the cache and create a new one. Any re-used RenderRow objects will be moved into the
    // new cache while unused ones can be picked up by garbage collection.
    const prevCachedRenderRows = this._cachedRenderRowsMap;
    this._cachedRenderRowsMap = new Map();

    // For each data object, get the list of rows that should be rendered, represented by the
    // respective `RenderRow` object which is the pair of `data` and `CdkRowDef`.
    for (let i = 0; i < this._data.length; i++) {
      let data = this._data[i];
      const renderRowsForData = this._getRenderRowsForData(data, i, prevCachedRenderRows.get(data));

      if (!this._cachedRenderRowsMap.has(data)) {
        this._cachedRenderRowsMap.set(data, new WeakMap());
      }

      for (let j = 0; j < renderRowsForData.length; j++) {
        let renderRow = renderRowsForData[j];

        const cache = this._cachedRenderRowsMap.get(renderRow.data)!;
        if (cache.has(renderRow.rowDef)) {
          cache.get(renderRow.rowDef)!.push(renderRow);
        } else {
          cache.set(renderRow.rowDef, [renderRow]);
        }
        renderRows.push(renderRow);
      }
    }

    return renderRows;
  }

  /**
   * Gets a list of `RenderRow<T>` for the provided data object and any `CdkRowDef` objects that
   * should be rendered for this data. Reuses the cached RenderRow objects if they match the same
   * `(T, CdkRowDef)` pair.
   *
   * 获取所提供的数据对象的 `RenderRow<T>` 列表，以及应为该数据渲染的 `CdkRowDef`。
   * 如果它们匹配同一个 `(T, CdkRowDef)` 对，则复用已缓存的 RenderRow 对象。
   *
   */
  private _getRenderRowsForData(
    data: T,
    dataIndex: number,
    cache?: WeakMap<CdkRowDef<T>, RenderRow<T>[]>,
  ): RenderRow<T>[] {
    const rowDefs = this._getRowDefs(data, dataIndex);

    return rowDefs.map(rowDef => {
      const cachedRenderRows = cache && cache.has(rowDef) ? cache.get(rowDef)! : [];
      if (cachedRenderRows.length) {
        const dataRow = cachedRenderRows.shift()!;
        dataRow.dataIndex = dataIndex;
        return dataRow;
      } else {
        return {data, rowDef, dataIndex};
      }
    });
  }

  /**
   * Update the map containing the content's column definitions.
   *
   * 修改包含内容列定义的映射表。
   *
   */
  private _cacheColumnDefs() {
    this._columnDefsByName.clear();

    const columnDefs = mergeArrayAndSet(
      this._getOwnDefs(this._contentColumnDefs),
      this._customColumnDefs,
    );
    columnDefs.forEach(columnDef => {
      if (
        this._columnDefsByName.has(columnDef.name) &&
        (typeof ngDevMode === 'undefined' || ngDevMode)
      ) {
        throw getTableDuplicateColumnNameError(columnDef.name);
      }
      this._columnDefsByName.set(columnDef.name, columnDef);
    });
  }

  /**
   * Update the list of all available row definitions that can be used.
   *
   * 更新所有可用的行定义列表。
   *
   */
  private _cacheRowDefs() {
    this._headerRowDefs = mergeArrayAndSet(
      this._getOwnDefs(this._contentHeaderRowDefs),
      this._customHeaderRowDefs,
    );
    this._footerRowDefs = mergeArrayAndSet(
      this._getOwnDefs(this._contentFooterRowDefs),
      this._customFooterRowDefs,
    );
    this._rowDefs = mergeArrayAndSet(this._getOwnDefs(this._contentRowDefs), this._customRowDefs);

    // After all row definitions are determined, find the row definition to be considered default.
    const defaultRowDefs = this._rowDefs.filter(def => !def.when);
    if (
      !this.multiTemplateDataRows &&
      defaultRowDefs.length > 1 &&
      (typeof ngDevMode === 'undefined' || ngDevMode)
    ) {
      throw getTableMultipleDefaultRowDefsError();
    }
    this._defaultRowDef = defaultRowDefs[0];
  }

  /**
   * Check if the header, data, or footer rows have changed what columns they want to display or
   * whether the sticky states have changed for the header or footer. If there is a diff, then
   * re-render that section.
   *
   * 检查表头，数据或表尾的行是否已更改了要显示的列，或者，表头或表尾的粘性状态是否已更改。如果有差异，就重新渲染那个区段。
   *
   */
  private _renderUpdatedColumns(): boolean {
    const columnsDiffReducer = (acc: boolean, def: BaseRowDef) => acc || !!def.getColumnsDiff();

    // Force re-render data rows if the list of column definitions have changed.
    const dataColumnsChanged = this._rowDefs.reduce(columnsDiffReducer, false);
    if (dataColumnsChanged) {
      this._forceRenderDataRows();
    }

    // Force re-render header/footer rows if the list of column definitions have changed.
    const headerColumnsChanged = this._headerRowDefs.reduce(columnsDiffReducer, false);
    if (headerColumnsChanged) {
      this._forceRenderHeaderRows();
    }

    const footerColumnsChanged = this._footerRowDefs.reduce(columnsDiffReducer, false);
    if (footerColumnsChanged) {
      this._forceRenderFooterRows();
    }

    return dataColumnsChanged || headerColumnsChanged || footerColumnsChanged;
  }

  /**
   * Switch to the provided data source by resetting the data and unsubscribing from the current
   * render change subscription if one exists. If the data source is null, interpret this by
   * clearing the row outlet. Otherwise start listening for new data.
   *
   * 通过重置数据来切换到所提供的数据源，并取消订阅对当前渲染变化的通知（如果有）。如果该数据源为 null，就理解为清除该行的出口地标。否则就开始监听新数据。
   *
   */
  private _switchDataSource(dataSource: CdkTableDataSourceInput<T>) {
    this._data = [];

    if (isDataSource(this.dataSource)) {
      this.dataSource.disconnect(this);
    }

    // Stop listening for data from the previous data source.
    if (this._renderChangeSubscription) {
      this._renderChangeSubscription.unsubscribe();
      this._renderChangeSubscription = null;
    }

    if (!dataSource) {
      if (this._dataDiffer) {
        this._dataDiffer.diff([]);
      }
      this._rowOutlet.viewContainer.clear();
    }

    this._dataSource = dataSource;
  }

  /**
   * Set up a subscription for the data provided by the data source.
   *
   * 提供对数据源提供的数据的订阅。
   *
   */
  private _observeRenderChanges() {
    // If no data source has been set, there is nothing to observe for changes.
    if (!this.dataSource) {
      return;
    }

    let dataStream: Observable<readonly T[]> | undefined;

    if (isDataSource(this.dataSource)) {
      dataStream = this.dataSource.connect(this);
    } else if (isObservable(this.dataSource)) {
      dataStream = this.dataSource;
    } else if (Array.isArray(this.dataSource)) {
      dataStream = observableOf(this.dataSource);
    }

    if (dataStream === undefined && (typeof ngDevMode === 'undefined' || ngDevMode)) {
      throw getTableUnknownDataSourceError();
    }

    this._renderChangeSubscription = dataStream!
      .pipe(takeUntil(this._onDestroy))
      .subscribe(data => {
        this._data = data || [];
        this.renderRows();
      });
  }

  /**
   * Clears any existing content in the header row outlet and creates a new embedded view
   * in the outlet using the header row definition.
   *
   * 清除表头行出口地标中的所有现有内容，并使用表头行定义在该出口地标中创建一个新的嵌入式视图。
   *
   */
  private _forceRenderHeaderRows() {
    // Clear the header row outlet if any content exists.
    if (this._headerRowOutlet.viewContainer.length > 0) {
      this._headerRowOutlet.viewContainer.clear();
    }

    this._headerRowDefs.forEach((def, i) => this._renderRow(this._headerRowOutlet, def, i));
    this.updateStickyHeaderRowStyles();
  }

  /**
   * Clears any existing content in the footer row outlet and creates a new embedded view
   * in the outlet using the footer row definition.
   *
   * 清除表尾行出口地标中的所有现有内容，并使用表尾行定义在该出口地标中创建一个新的嵌入式视图。
   *
   */
  private _forceRenderFooterRows() {
    // Clear the footer row outlet if any content exists.
    if (this._footerRowOutlet.viewContainer.length > 0) {
      this._footerRowOutlet.viewContainer.clear();
    }

    this._footerRowDefs.forEach((def, i) => this._renderRow(this._footerRowOutlet, def, i));
    this.updateStickyFooterRowStyles();
  }

  /**
   * Adds the sticky column styles for the rows according to the columns' stick states.
   *
   * 根据列的粘性状态添加各行的粘性列样式。
   *
   */
  private _addStickyColumnStyles(rows: HTMLElement[], rowDef: BaseRowDef) {
    const columnDefs = Array.from(rowDef.columns || []).map(columnName => {
      const columnDef = this._columnDefsByName.get(columnName);
      if (!columnDef && (typeof ngDevMode === 'undefined' || ngDevMode)) {
        throw getTableUnknownColumnError(columnName);
      }
      return columnDef!;
    });
    const stickyStartStates = columnDefs.map(columnDef => columnDef.sticky);
    const stickyEndStates = columnDefs.map(columnDef => columnDef.stickyEnd);
    this._stickyStyler.updateStickyColumns(
      rows,
      stickyStartStates,
      stickyEndStates,
      !this._fixedLayout || this._forceRecalculateCellWidths,
    );
  }

  /**
   * Gets the list of rows that have been rendered in the row outlet.
   *
   * 获取已渲染在行出口地标中的行列表。
   *
   */
  _getRenderedRows(rowOutlet: RowOutlet): HTMLElement[] {
    const renderedRows: HTMLElement[] = [];

    for (let i = 0; i < rowOutlet.viewContainer.length; i++) {
      const viewRef = rowOutlet.viewContainer.get(i)! as EmbeddedViewRef<any>;
      renderedRows.push(viewRef.rootNodes[0]);
    }

    return renderedRows;
  }

  /**
   * Get the matching row definitions that should be used for this row data. If there is only
   * one row definition, it is returned. Otherwise, find the row definitions that has a when
   * predicate that returns true with the data. If none return true, return the default row
   * definition.
   *
   * 获取那些应该用在行数据中的匹配行定义。如果只有一个行定义，就返回它。否则，找到具有 when 谓词并且谓词对该数据返回 true 的行定义。如果全都不返回 true，则返回默认的行定义。
   *
   */
  _getRowDefs(data: T, dataIndex: number): CdkRowDef<T>[] {
    if (this._rowDefs.length == 1) {
      return [this._rowDefs[0]];
    }

    let rowDefs: CdkRowDef<T>[] = [];
    if (this.multiTemplateDataRows) {
      rowDefs = this._rowDefs.filter(def => !def.when || def.when(dataIndex, data));
    } else {
      let rowDef =
        this._rowDefs.find(def => def.when && def.when(dataIndex, data)) || this._defaultRowDef;
      if (rowDef) {
        rowDefs.push(rowDef);
      }
    }

    if (!rowDefs.length && (typeof ngDevMode === 'undefined' || ngDevMode)) {
      throw getTableMissingMatchingRowDefError(data);
    }

    return rowDefs;
  }

  private _getEmbeddedViewArgs(
    renderRow: RenderRow<T>,
    index: number,
  ): _ViewRepeaterItemInsertArgs<RowContext<T>> {
    const rowDef = renderRow.rowDef;
    const context: RowContext<T> = {$implicit: renderRow.data};
    return {
      templateRef: rowDef.template,
      context,
      index,
    };
  }

  /**
   * Creates a new row template in the outlet and fills it with the set of cell templates.
   * Optionally takes a context to provide to the row and cells, as well as an optional index
   * of where to place the new row template in the outlet.
   *
   * 在出口地标中创建一个新的行模板，并用一组单元格模板填充它。（可选）为行和单元格提供一个上下文，和一个可选的索引，以表明要把新的行模板放在该出口地标的什么位置。
   *
   */
  private _renderRow(
    outlet: RowOutlet,
    rowDef: BaseRowDef,
    index: number,
    context: RowContext<T> = {},
  ): EmbeddedViewRef<RowContext<T>> {
    // TODO(andrewseguin): enforce that one outlet was instantiated from createEmbeddedView
    const view = outlet.viewContainer.createEmbeddedView(rowDef.template, context, index);
    this._renderCellTemplateForItem(rowDef, context);
    return view;
  }

  private _renderCellTemplateForItem(rowDef: BaseRowDef, context: RowContext<T>) {
    for (let cellTemplate of this._getCellTemplates(rowDef)) {
      if (CdkCellOutlet.mostRecentCellOutlet) {
        CdkCellOutlet.mostRecentCellOutlet._viewContainer.createEmbeddedView(cellTemplate, context);
      }
    }

    this._changeDetectorRef.markForCheck();
  }

  /**
   * Updates the index-related context for each row to reflect any changes in the index of the rows,
   * e.g. first/last/even/odd.
   *
   * 为每一行更新与索引相关的上下文，以反映行索引中的任何变化，比如 first / last / even / odd。
   *
   */
  private _updateRowIndexContext() {
    const viewContainer = this._rowOutlet.viewContainer;
    for (let renderIndex = 0, count = viewContainer.length; renderIndex < count; renderIndex++) {
      const viewRef = viewContainer.get(renderIndex) as RowViewRef<T>;
      const context = viewRef.context as RowContext<T>;
      context.count = count;
      context.first = renderIndex === 0;
      context.last = renderIndex === count - 1;
      context.even = renderIndex % 2 === 0;
      context.odd = !context.even;

      if (this.multiTemplateDataRows) {
        context.dataIndex = this._renderRows[renderIndex].dataIndex;
        context.renderIndex = renderIndex;
      } else {
        context.index = this._renderRows[renderIndex].dataIndex;
      }
    }
  }

  /**
   * Gets the column definitions for the provided row def.
   *
   * 从已提供的行定义中获取列定义。
   *
   */
  private _getCellTemplates(rowDef: BaseRowDef): TemplateRef<any>[] {
    if (!rowDef || !rowDef.columns) {
      return [];
    }
    return Array.from(rowDef.columns, columnId => {
      const column = this._columnDefsByName.get(columnId);

      if (!column && (typeof ngDevMode === 'undefined' || ngDevMode)) {
        throw getTableUnknownColumnError(columnId);
      }

      return rowDef.extractCellTemplate(column!);
    });
  }

  /**
   * Adds native table sections (e.g. tbody) and moves the row outlets into them.
   *
   * 添加一些原生表格区段（比如 tbody）并把行的出口地标移到其中。
   *
   */
  private _applyNativeTableSections() {
    const documentFragment = this._document.createDocumentFragment();
    const sections = [
      {tag: 'thead', outlets: [this._headerRowOutlet]},
      {tag: 'tbody', outlets: [this._rowOutlet, this._noDataRowOutlet]},
      {tag: 'tfoot', outlets: [this._footerRowOutlet]},
    ];

    for (const section of sections) {
      const element = this._document.createElement(section.tag);
      element.setAttribute('role', 'rowgroup');

      for (const outlet of section.outlets) {
        element.appendChild(outlet.elementRef.nativeElement);
      }

      documentFragment.appendChild(element);
    }

    // Use a DocumentFragment so we don't hit the DOM on each iteration.
    this._elementRef.nativeElement.appendChild(documentFragment);
  }

  /**
   * Forces a re-render of the data rows. Should be called in cases where there has been an input
   * change that affects the evaluation of which rows should be rendered, e.g. toggling
   * `multiTemplateDataRows` or adding/removing row definitions.
   *
   * 强制重新渲染数据行。如果输入的更改会影响应该渲染哪些行的评估，就调用它，例如切换 multiTemplateDataRows 标志或添加/删除行定义。
   *
   */
  private _forceRenderDataRows() {
    this._dataDiffer.diff([]);
    this._rowOutlet.viewContainer.clear();
    this.renderRows();
  }

  /**
   * Checks if there has been a change in sticky states since last check and applies the correct
   * sticky styles. Since checking resets the "dirty" state, this should only be performed once
   * during a change detection and after the inputs are settled (after content check).
   *
   * 检查自上次检查以来粘性状态是否发生了变化，并应用了正确的粘性样式。
   * 由于变更检查重置了 “dirty” 状态，所以在变更检测过程中以及输入结束后（内容检查完成）之后，才会执行此操作。
   *
   */
  private _checkStickyStates() {
    const stickyCheckReducer = (
      acc: boolean,
      d: CdkHeaderRowDef | CdkFooterRowDef | CdkColumnDef,
    ) => {
      return acc || d.hasStickyChanged();
    };

    // Note that the check needs to occur for every definition since it notifies the definition
    // that it can reset its dirty state. Using another operator like `some` may short-circuit
    // remaining definitions and leave them in an unchecked state.

    if (this._headerRowDefs.reduce(stickyCheckReducer, false)) {
      this.updateStickyHeaderRowStyles();
    }

    if (this._footerRowDefs.reduce(stickyCheckReducer, false)) {
      this.updateStickyFooterRowStyles();
    }

    if (Array.from(this._columnDefsByName.values()).reduce(stickyCheckReducer, false)) {
      this._stickyColumnStylesNeedReset = true;
      this.updateStickyColumnStyles();
    }
  }

  /**
   * Creates the sticky styler that will be used for sticky rows and columns. Listens
   * for directionality changes and provides the latest direction to the styler. Re-applies column
   * stickiness when directionality changes.
   *
   * 创建一个粘性样式器，它将用于粘性行和列。监听方向性的变化并为样式器提供最新的方向。方向性发生变化时重新应用列的粘性样式。
   *
   */
  private _setupStickyStyler() {
    const direction: Direction = this._dir ? this._dir.value : 'ltr';
    this._stickyStyler = new StickyStyler(
      this._isNativeHtmlTable,
      this.stickyCssClass,
      direction,
      this._coalescedStyleScheduler,
      this._platform.isBrowser,
      this.needsPositionStickyOnElement,
      this._stickyPositioningListener,
    );
    (this._dir ? this._dir.change : observableOf<Direction>())
      .pipe(takeUntil(this._onDestroy))
      .subscribe(value => {
        this._stickyStyler.direction = value;
        this.updateStickyColumnStyles();
      });
  }

  /**
   * Filters definitions that belong to this table from a QueryList.
   *
   * 从 QueryList 中过滤只属于当前表格的定义。
   *
   */
  private _getOwnDefs<I extends {_table?: any}>(items: QueryList<I>): I[] {
    return items.filter(item => !item._table || item._table === this);
  }

  /**
   * Creates or removes the no data row, depending on whether any data is being shown.
   *
   * 创建或删除无数据行，具体取决于是否正在显示任何数据。
   *
   */
  private _updateNoDataRow() {
    const noDataRow = this._customNoDataRow || this._noDataRow;

    if (!noDataRow) {
      return;
    }

    const shouldShow = this._rowOutlet.viewContainer.length === 0;

    if (shouldShow === this._isShowingNoDataRow) {
      return;
    }

    const container = this._noDataRowOutlet.viewContainer;

    if (shouldShow) {
      const view = container.createEmbeddedView(noDataRow.templateRef);
      const rootNode: HTMLElement | undefined = view.rootNodes[0];

      // Only add the attributes if we have a single root node since it's hard
      // to figure out which one to add it to when there are multiple.
      if (view.rootNodes.length === 1 && rootNode?.nodeType === this._document.ELEMENT_NODE) {
        rootNode.setAttribute('role', 'row');
        rootNode.classList.add(noDataRow._contentClassName);
      }
    } else {
      container.clear();
    }

    this._isShowingNoDataRow = shouldShow;
  }
}

/**
 * Utility function that gets a merged list of the entries in an array and values of a Set.
 *
 * 实用工具函数，用于获取数组条目和 Set 值的合并列表。
 *
 */
function mergeArrayAndSet<T>(array: T[], set: Set<T>): T[] {
  return array.concat(Array.from(set));
}
