/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  BehaviorSubject,
  combineLatest,
  merge,
  Observable,
  of as observableOf,
  Subject,
  Subscription,
} from 'rxjs';
import {DataSource} from '@angular/cdk/collections';
import {MatSort, Sort} from '@angular/material/sort';
import {_isNumberValue} from '@angular/cdk/coercion';
import {map} from 'rxjs/operators';

/**
 * Interface that matches the required API parts for the MatPaginator's PageEvent.
 * Decoupled so that users can depend on either the legacy or MDC-based paginator.
 *
 * 与 MatPaginator 的 PageEvent 所需的 API 部分匹配的接口。这种解耦让用户可以依赖旧版或基于 MDC 的分页器。
 *
 */
export interface MatTableDataSourcePageEvent {
  pageIndex: number;
  pageSize: number;
  length: number;
}

/**
 * Interface that matches the required API parts of the MatPaginator.
 * Decoupled so that users can depend on either the legacy or MDC-based paginator.
 *
 * 与 MatPaginator 所需的 API 部分匹配的接口。这种解耦让用户可以依赖旧版或基于 MDC 的分页器。
 *
 */
export interface MatTableDataSourcePaginator {
  page: Subject<MatTableDataSourcePageEvent>;
  pageIndex: number;
  initialized: Observable<void>;
  pageSize: number;
  length: number;
  firstPage: () => void;
  lastPage: () => void;
}

/**
 * Corresponds to `Number.MAX_SAFE_INTEGER`. Moved out into a variable here due to
 * flaky browser support and the value not being defined in Closure's typings.
 *
 * 对应于 `Number.MAX_SAFE_INTEGER` 。由于不稳定的浏览器支持和未在 Closure 的类型中定义的值，移出到此处的变量中。
 *
 */
const MAX_SAFE_INTEGER = 9007199254740991;

/**
 * Shared base class with MDC-based implementation.
 *
 * 与基于 MDC 实现共享的基类。
 *
 */
export class _MatTableDataSource<
  T,
  P extends MatTableDataSourcePaginator = MatTableDataSourcePaginator,
> extends DataSource<T> {
  /**
   * Stream that emits when a new data array is set on the data source.
   *
   * 当在数据源上设置新的数组时会发出流。
   *
   */
  private readonly _data: BehaviorSubject<T[]>;

  /**
   * Stream emitting render data to the table (depends on ordered data changes).
   *
   * 把数据渲染到表格中的事件流（取决于有序数据的变化）。
   *
   */
  private readonly _renderData = new BehaviorSubject<T[]>([]);

  /**
   * Stream that emits when a new filter string is set on the data source.
   *
   * 当数据源上设置了新的过滤字符串时，会发出流。
   *
   */
  private readonly _filter = new BehaviorSubject<string>('');

  /**
   * Used to react to internal changes of the paginator that are made by the data source itself.
   *
   * 用于对数据源本身对分页器的内部更改作出反应。
   *
   */
  private readonly _internalPageChanges = new Subject<void>();

  /**
   * Subscription to the changes that should trigger an update to the table's rendered rows, such
   * as filtering, sorting, pagination, or base data changes.
   *
   * 订阅那些应该触发表格中渲染行更新的变更，比如过滤、排序、分页或基础数据的变化。
   *
   */
  _renderChangesSubscription: Subscription | null = null;

  /**
   * The filtered set of data that has been matched by the filter string, or all the data if there
   * is no filter. Useful for knowing the set of data the table represents.
   * For example, a 'selectAll()' function would likely want to select the set of filtered data
   * shown to the user rather than all the data.
   *
   * 通过过滤器字符串过滤过的数据集，如果没有过滤器，则全是数据。
   * 需要知道表格所展现的数据集时，这非常有用。比如，'selectAll()' 函数可能会想给用户展示一组过滤过的数据，而不是所有的数据。
   *
   */
  filteredData: T[];

  /**
   * Array of data that should be rendered by the table, where each object represents one row.
   *
   * 要由表格渲染的数据数组，其中每个对象代表一行。
   *
   */
  get data() {
    return this._data.value;
  }

  set data(data: T[]) {
    data = Array.isArray(data) ? data : [];
    this._data.next(data);
    // Normally the `filteredData` is updated by the re-render
    // subscription, but that won't happen if it's inactive.
    if (!this._renderChangesSubscription) {
      this._filterData(data);
    }
  }

  /**
   * Filter term that should be used to filter out objects from the data array. To override how
   * data objects match to this filter string, provide a custom function for filterPredicate.
   *
   * 要用来从数据数组中过滤对象的过滤器关键词。
   * 要改写数据对象与此过滤器字符串的匹配方式，请为 filterPredicate 提供一个自定义函数。
   *
   */
  get filter(): string {
    return this._filter.value;
  }

  set filter(filter: string) {
    this._filter.next(filter);
    // Normally the `filteredData` is updated by the re-render
    // subscription, but that won't happen if it's inactive.
    if (!this._renderChangesSubscription) {
      this._filterData(this.data);
    }
  }

  /**
   * Instance of the MatSort directive used by the table to control its sorting. Sort changes
   * emitted by the MatSort will trigger an update to the table's rendered data.
   *
   * 该表格使用 MatSort 指令的实例来控制它的排序。MatSort 发出的排序变化会触发对该表格所渲染数据的更新。
   *
   */
  get sort(): MatSort | null {
    return this._sort;
  }

  set sort(sort: MatSort | null) {
    this._sort = sort;
    this._updateChangeSubscription();
  }

  private _sort: MatSort | null;

  /**
   * Instance of the paginator component used by the table to control what page of the data is
   * displayed. Page changes emitted by the paginator will trigger an update to the
   * table's rendered data.
   *
   * 该表格使用的 MatPaginator 组件实例，用来控制要显示哪页数据。MatPaginator 发出的页面更改会触发表格渲染数据的更新。
   *
   * Note that the data source uses the paginator's properties to calculate which page of data
   * should be displayed. If the paginator receives its properties as template inputs,
   * e.g. `[pageLength]=100` or `[pageIndex]=1`, then be sure that the paginator's view has been
   * initialized before assigning it to this data source.
   *
   * 注意，数据源会使用此分页器的属性来计算应该显示哪个页面的数据。如果分页器要通过模板输入接收其属性，比如 `[pageLength]=100` 或者 `[pageIndex]=1`，那就要确保此分页器的视图已经初始化了，然后再赋值给这个数据源。
   *
   */
  get paginator(): P | null {
    return this._paginator;
  }

  set paginator(paginator: P | null) {
    this._paginator = paginator;
    this._updateChangeSubscription();
  }

  private _paginator: P | null;

  /**
   * Data accessor function that is used for accessing data properties for sorting through
   * the default sortData function.
   * This default function assumes that the sort header IDs (which defaults to the column name)
   * matches the data's properties (e.g. column Xyz represents data['Xyz']).
   * May be set to a custom function for different behavior.
   *
   * 数据访问器函数，用于访问数据属性，以便通过默认的 sortData 函数进行排序。
   * 这个默认函数假设排序头的 ID（默认为列名）与数据的属性相匹配（比如列 Xyz 对应 data['Xyz']）。可以为不同的行为设置同一个自定义函数。
   *
   * @param data Data object that is being accessed.
   *
   * 正在访问的数据对象
   *
   * @param sortHeaderId The name of the column that represents the data.
   *
   * 用来代表数据列的名字。
   *
   */
  sortingDataAccessor: (data: T, sortHeaderId: string) => string | number = (
    data: T,
    sortHeaderId: string,
  ): string | number => {
    const value = (data as unknown as Record<string, any>)[sortHeaderId];

    if (_isNumberValue(value)) {
      const numberValue = Number(value);

      // Numbers beyond `MAX_SAFE_INTEGER` can't be compared reliably so we
      // leave them as strings. For more info: https://goo.gl/y5vbSg
      return numberValue < MAX_SAFE_INTEGER ? numberValue : value;
    }

    return value;
  };

  /**
   * Gets a sorted copy of the data array based on the state of the MatSort. Called
   * after changes are made to the filtered data or when sort changes are emitted from MatSort.
   * By default, the function retrieves the active sort and its direction and compares data
   * by retrieving data using the sortingDataAccessor. May be overridden for a custom implementation
   * of data ordering.
   *
   * 根据 MatSort 的状态获取一个数据数组的已排序副本。在对已过滤的数据进行更改或从 MatSort 发出排序更改时调用。
   * 默认情况下，使用该函数检索主动排序及其方向，并借助 sortingDataAccessor 检索数据来进行比较。可以改写为自定义的数据排序实现。
   *
   * @param data The array of data that should be sorted.
   *
   * 那些要排序的数据数组。
   *
   * @param sort The connected MatSort that holds the current sort state.
   *
   * 已连接的 MatSort，保存着当前排序状态。
   *
   */
  sortData: (data: T[], sort: MatSort) => T[] = (data: T[], sort: MatSort): T[] => {
    const active = sort.active;
    const direction = sort.direction;
    if (!active || direction == '') {
      return data;
    }

    return data.sort((a, b) => {
      let valueA = this.sortingDataAccessor(a, active);
      let valueB = this.sortingDataAccessor(b, active);

      // If there are data in the column that can be converted to a number,
      // it must be ensured that the rest of the data
      // is of the same type so as not to order incorrectly.
      const valueAType = typeof valueA;
      const valueBType = typeof valueB;

      if (valueAType !== valueBType) {
        if (valueAType === 'number') {
          valueA += '';
        }
        if (valueBType === 'number') {
          valueB += '';
        }
      }

      // If both valueA and valueB exist (truthy), then compare the two. Otherwise, check if
      // one value exists while the other doesn't. In this case, existing value should come last.
      // This avoids inconsistent results when comparing values to undefined/null.
      // If neither value exists, return 0 (equal).
      let comparatorResult = 0;
      if (valueA != null && valueB != null) {
        // Check if one value is greater than the other; if equal, comparatorResult should remain 0.
        if (valueA > valueB) {
          comparatorResult = 1;
        } else if (valueA < valueB) {
          comparatorResult = -1;
        }
      } else if (valueA != null) {
        comparatorResult = 1;
      } else if (valueB != null) {
        comparatorResult = -1;
      }

      return comparatorResult * (direction == 'asc' ? 1 : -1);
    });
  };

  /**
   * Checks if a data object matches the data source's filter string. By default, each data object
   * is converted to a string of its properties and returns true if the filter has
   * at least one occurrence in that string. By default, the filter string has its whitespace
   * trimmed and the match is case-insensitive. May be overridden for a custom implementation of
   * filter matching.
   *
   * 检查数据对象是否与数据源的过滤字符串匹配。默认情况下，会把每个数据对象都转换为其属性的字符串，如果该过滤器在该字符串中至少出现过一次，则返回 true。默认情况下，会修剪掉过滤字符串的空白，并且匹配时不区分大小写。可以改写为过滤器匹配算法的自定义实现。
   *
   * @param data Data object used to check against the filter.
   *
   * 要让这个过滤器检查的数据对象。
   *
   * @param filter Filter string that has been set on the data source.
   *
   * 在数据源上设置过的过滤字符串。
   *
   * @returns Whether the filter matches against the data
   *
   * 过滤器是否匹配此数据
   */
  filterPredicate: (data: T, filter: string) => boolean = (data: T, filter: string): boolean => {
    // Transform the data into a lowercase string of all property values.
    const dataStr = Object.keys(data as unknown as Record<string, any>)
      .reduce((currentTerm: string, key: string) => {
        // Use an obscure Unicode character to delimit the words in the concatenated string.
        // This avoids matches where the values of two columns combined will match the user's query
        // (e.g. `Flute` and `Stop` will match `Test`). The character is intended to be something
        // that has a very low chance of being typed in by somebody in a text field. This one in
        // particular is "White up-pointing triangle with dot" from
        // https://en.wikipedia.org/wiki/List_of_Unicode_characters
        return currentTerm + (data as unknown as Record<string, any>)[key] + '◬';
      }, '')
      .toLowerCase();

    // Transform the filter by converting it to lowercase and removing whitespace.
    const transformedFilter = filter.trim().toLowerCase();

    return dataStr.indexOf(transformedFilter) != -1;
  };

  constructor(initialData: T[] = []) {
    super();
    this._data = new BehaviorSubject<T[]>(initialData);
    this._updateChangeSubscription();
  }

  /**
   * Subscribe to changes that should trigger an update to the table's rendered rows. When the
   * changes occur, process the current state of the filter, sort, and pagination along with
   * the provided base data and send it to the table for rendering.
   *
   * 订阅那些应该导致表格中更新已渲染行的变化。当发生这些变化时，根据过滤器、排序和分页器的当前状态对所提供的基础数据进行处理，并把它发送到表格中进行渲染。
   *
   */
  _updateChangeSubscription() {
    // Sorting and/or pagination should be watched if sort and/or paginator are provided.
    // The events should emit whenever the component emits a change or initializes, or if no
    // component is provided, a stream with just a null event should be provided.
    // The `sortChange` and `pageChange` acts as a signal to the combineLatests below so that the
    // pipeline can progress to the next step. Note that the value from these streams are not used,
    // they purely act as a signal to progress in the pipeline.
    const sortChange: Observable<Sort | null | void> = this._sort
      ? (merge(this._sort.sortChange, this._sort.initialized) as Observable<Sort | void>)
      : observableOf(null);
    const pageChange: Observable<MatTableDataSourcePageEvent | null | void> = this._paginator
      ? (merge(
          this._paginator.page,
          this._internalPageChanges,
          this._paginator.initialized,
        ) as Observable<MatTableDataSourcePageEvent | void>)
      : observableOf(null);
    const dataStream = this._data;
    // Watch for base data or filter changes to provide a filtered set of data.
    const filteredData = combineLatest([dataStream, this._filter]).pipe(
      map(([data]) => this._filterData(data)),
    );
    // Watch for filtered data or sort changes to provide an ordered set of data.
    const orderedData = combineLatest([filteredData, sortChange]).pipe(
      map(([data]) => this._orderData(data)),
    );
    // Watch for ordered data or page changes to provide a paged set of data.
    const paginatedData = combineLatest([orderedData, pageChange]).pipe(
      map(([data]) => this._pageData(data)),
    );
    // Watched for paged data changes and send the result to the table to render.
    this._renderChangesSubscription?.unsubscribe();
    this._renderChangesSubscription = paginatedData.subscribe(data => this._renderData.next(data));
  }

  /**
   * Returns a filtered data array where each filter object contains the filter string within
   * the result of the filterTermAccessor function. If no filter is set, returns the data array
   * as provided.
   *
   * 返回一个过滤后的数据数组，其中每个过滤器对象都包含 filterTermAccessor 函数结果中的过滤字符串。如果没有设置过滤器，则返回所提供的数据数组。
   *
   */
  _filterData(data: T[]) {
    // If there is a filter string, filter out data that does not contain it.
    // Each data object is converted to a string using the function defined by filterTermAccessor.
    // May be overridden for customization.
    this.filteredData =
      this.filter == null || this.filter === ''
        ? data
        : data.filter(obj => this.filterPredicate(obj, this.filter));

    if (this.paginator) {
      this._updatePaginator(this.filteredData.length);
    }

    return this.filteredData;
  }

  /**
   * Returns a sorted copy of the data if MatSort has a sort applied, otherwise just returns the
   * data array as provided. Uses the default data accessor for data lookup, unless a
   * sortDataAccessor function is defined.
   *
   * 如果 MatSort 已应用了排序，则返回数据的有序副本，否则只返回所提供的数据数组。
   * 除非定义了 sortDataAccessor 函数，否则使用默认的数据访问器进行数据查询。
   *
   */
  _orderData(data: T[]): T[] {
    // If there is no active sort or direction, return the data without trying to sort.
    if (!this.sort) {
      return data;
    }

    return this.sortData(data.slice(), this.sort);
  }

  /**
   * Returns a paged slice of the provided data array according to the provided paginator's page
   * index and length. If there is no paginator provided, returns the data array as provided.
   *
   * 根据所提供的 MatPaginator 的页号和分页长度返回所提供的数据数组的分页切片。如果没有提供分页器，就返回所提供的数据数组。
   *
   */
  _pageData(data: T[]): T[] {
    if (!this.paginator) {
      return data;
    }

    const startIndex = this.paginator.pageIndex * this.paginator.pageSize;
    return data.slice(startIndex, startIndex + this.paginator.pageSize);
  }

  /**
   * Updates the paginator to reflect the length of the filtered data, and makes sure that the page
   * index does not exceed the paginator's last page. Values are changed in a resolved promise to
   * guard against making property changes within a round of change detection.
   *
   * 更新分页器来反映过滤后数据的长度，并确保页面索引不会超出分页器的最后一页。会在已解析的 Promise 中修改这些值，以免在一轮变更检测中进行属性更改。
   *
   */
  _updatePaginator(filteredDataLength: number) {
    Promise.resolve().then(() => {
      const paginator = this.paginator;

      if (!paginator) {
        return;
      }

      paginator.length = filteredDataLength;

      // If the page index is set beyond the page, reduce it to the last page.
      if (paginator.pageIndex > 0) {
        const lastPageIndex = Math.ceil(paginator.length / paginator.pageSize) - 1 || 0;
        const newPageIndex = Math.min(paginator.pageIndex, lastPageIndex);

        if (newPageIndex !== paginator.pageIndex) {
          paginator.pageIndex = newPageIndex;

          // Since the paginator only emits after user-generated changes,
          // we need our own stream so we know to should re-render the data.
          this._internalPageChanges.next();
        }
      }
    });
  }

  /**
   * Used by the MatTable. Called when it connects to the data source.
   *
   * 由 MatTable 使用。当连接数据源时调用。
   *
   * @docs-private
   */
  connect() {
    if (!this._renderChangesSubscription) {
      this._updateChangeSubscription();
    }

    return this._renderData;
  }

  /**
   * Used by the MatTable. Called when it disconnects from the data source.
   *
   * 由 MatTable 使用。当断开数据源连接时调用。
   *
   * @docs-private
   */
  disconnect() {
    this._renderChangesSubscription?.unsubscribe();
    this._renderChangesSubscription = null;
  }
}

/**
 * Data source that accepts a client-side data array and includes native support of filtering,
 * sorting (using MatSort), and pagination (using MatPaginator).
 *
 * 可接受客户端数据的数据源，包括原生支持的过滤、排序（使用 MatSort）和分页（使用 MatPaginator）。
 *
 * Allows for sort customization by overriding sortingDataAccessor, which defines how data
 * properties are accessed. Also allows for filter customization by overriding filterTermAccessor,
 * which defines how row data is converted to a string for filter matching.
 *
 * 可以通过改写 sortingDataAccessor 来进行自定义排序，它定义了要如何访问数据属性。
 * 还允许通过改写 filterTermAccessor 来自定义过滤器，它定义了要如何将行数据转换成字符串以进行过滤匹配。
 *
 * **Note:** This class is meant to be a simple data source to help you get started. As such
 * it isn't equipped to handle some more advanced cases like robust i18n support or server-side
 * interactions. If your app needs to support more advanced use cases, consider implementing your
 * own `DataSource`.
 *
 * **注意：**这个类是一个简单的数据源，可以帮助你入门。因此，它无法处理某些更高级的案例，比如提供强大的 i18n 支持或服务器端交互。
 * 如果你的应用需要支持更高级的用例，可以考虑实现自己的 `DataSource`。
 *
 */
export class MatTableDataSource<
  T,
  P extends MatTableDataSourcePaginator = MatTableDataSourcePaginator,
> extends _MatTableDataSource<T, P> {}
