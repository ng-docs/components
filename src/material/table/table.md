The `mat-table` provides a Material Design styled data-table that can be used to display rows of
data.

`mat-table` 提供了一个支持 Material Design 样式的表格，可用来显示多行数据。

This table builds on the foundation of the CDK data-table and uses a similar interface for its
data input and template, except that its element and attribute selectors will be prefixed
with `mat-` instead of `cdk-`. For more information on the interface and a detailed look at how
the table is implemented, see the
[guide covering the CDK data-table](https://material.angular.io/guide/cdk-table).

此表格基于 CDK 中的 data-table 构建，并在数据输入和模板上采用了相同的接口，只是它的元素选择器和属性选择器都使用 `mat-` 前缀，而不是 `cdk-` 前缀。
对于该接口的更多信息以及表格的具体实现方式，参见 [CDK data-table 指南](/guide/cdk-table)。

### Getting Started

### 快速上手

<!-- example(table-basic) -->

#### 1. Write your mat-table and provide data

#### 1. 编写你的 mat-table 并提供数据

Begin by adding the `<table mat-table>` component to your template and passing in data.

先把 `<table mat-table>` 组件添加到模板中，并传入数据。

The simplest way to provide data to the table is by passing a data array to the table's `dataSource`
input. The table will take the array and render a row for each object in the data array.

为表格提供数据的最简单方式就是给它的输入属性 `dataSource` 提供一个数组型数据。
该表格将会接收这个数组，并把数组型数据中的每一个对象渲染成一行。

```html
<table mat-table [dataSource]="myDataArray">
  ...
</table>
```

Since the table optimizes for performance, it will not automatically check for changes to the data
array. Instead, when objects are added, removed, or moved on the data array, you can trigger an
update to the table's rendered rows by calling its `renderRows()` method.

为了优化表格的性能，它不会自动检查数组型数据的变更。而是要在每次在数据表中添加、删除或移动对象时，通过调用它的 `renderRows` 方法来更新表格的各行。

While an array is the _simplest_ way to bind data into the data source, it is also
the most limited. For more complex applications, using a `DataSource` instance
is recommended. See the section "Advanced data sources" below for more information.

虽然数组是把数据绑定到数据源的*最简单的*方式，但它也受限最严重。对于更复杂的应用，建议使用 `DataSource` 实例。参见稍后的 "高级数据源" 部分了解更多。

#### 2. Define the column templates

#### 2. 定义列模板

Next, write your table's column templates.

接着，编写表格的列模板。

Each column definition should be given a unique name and contain the content for its header and row
cells.

每个列定义都应该有一个唯一的名字，并且包含其表头单元格和行内单元格的内容。

Here's a simple column definition with the name `'score'`. The header cell contains the text
"Score" and each row cell will render the `score` property of each row's data.

下面是一个名为 `'username'` 的简单列定义。
表头单元格包含一个文本 "Name"，每个行内单元格将会渲染出每行数据中 `name` 属性的值。

```html
<ng-container matColumnDef="score">
  <th mat-header-cell *matHeaderCellDef> Score </th>
  <td mat-cell *matCellDef="let user"> {{user.score}} </td>
</ng-container>
```

Note that the cell templates are not restricted to only showing simple string values, but are
flexible and allow you to provide any template.

请注意，单元格模板不仅限于显示简单的字符串值，它非常灵活，可以让你提供任何模板。

If your column is only responsible for rendering a single string value for the header and cells,
you can instead define your column using the `mat-text-column`. The following column definition is
equivalent to the one above.

如果你的列只负责为表头和单元格渲染一个字符串值，可以改用 `mat-text-column` 来定义它。下面的列定义与上面的列定义是等价的。

```html
<mat-text-column name="score"></mat-text-column>
```

Check out the API docs and examples of the `mat-text-column` to see how you can customize the header
text, text alignment, and cell data accessor.  Note that this is not compatible with the flex-layout
table. Also, a data accessor should be provided if your data may have its properties minified
since the string name will no longer match after minification.

查看 API 文档和 `mat-text-column` 的例子，以了解如何自定义表头文本、文本对齐方式和单元格数据访问器。请注意，这与 flex-layout 表不兼容。此外，如果数据的属性最小化过，则应提供数据访问器，因为属性名和字符串名称在最小化后将不再匹配。

#### 3. Define the row templates

#### 3. 定义行模板

Finally, once you have defined your columns, you need to tell the table which columns will be
rendered in the header and data rows.

最后，一旦你定义了各个列，就要告诉表格该在表头和数据行中显示哪些列。

To start, create a variable in your component that contains the list of the columns you want to
render.

先在组件中创建一个变量，其中包含你要渲染的列数组。

```ts
columnsToDisplay = ['userName', 'age'];
```

Then add `mat-header-row` and `mat-row` to the content of your `mat-table` and provide your
column list as inputs.

然后，把 `mat-header-row` 和 `mat-row` 作为内容添加到 `mat-table` 中，并提供你的列数组作为输入。

```html
<tr mat-header-row *matHeaderRowDef="columnsToDisplay"></tr>
<tr mat-row *matRowDef="let myRowData; columns: columnsToDisplay"></tr>
```

Note that this list of columns provided to the rows can be in any order, not necessarily the order in
which you wrote the column definitions. Also, you do not necessarily have to include every column
that was defined in your template.

注意，提供给各行的列数组可以使用任意顺序，不要求和定义列的顺序一致。同样的，你也不必包含模板中定义的每一列。

This means that by changing your column list provided to the rows, you can easily re-order and
include/exclude columns dynamically.

这意味着通过调整提供给各行的列顺序，你可以轻易调整列序和动态包含/排除某些列。

### Advanced data sources

### 高级数据结构

The simplest way to provide data to your table is by passing a data array. More complex use-cases
may benefit from a more flexible approach involving an Observable stream or by encapsulating your
data source logic into a `DataSource` class.

为表格提供数据的最简单方式是传入一个数组型数据。对于更复杂的用例，则可以从一些更灵活的方式中受益，比如使用 Observable 流，或把你的数据源逻辑封装进 `DataSource` 类中。

#### Observable stream of data arrays

#### 数组型数据的 Observable 流

An alternative approach to providing data to the table is by passing an Observable stream that emits
the data array to be rendered each time it is changed. The table will listen to this stream and
automatically trigger an update to the rows each time a new data array is emitted.

为表格提供数据的另一种方法是传入一个 Observable 流，每当它变化时都会发出一个要渲染的数组型数据。
表格会监听这个流，每当它发出新的数组型数据时，就会自动触发一次更新。

#### DataSource

#### DataSource（数据源）

For most real-world applications, providing the table a `DataSource` instance will be the best way to
manage data. The `DataSource` is meant to serve as a place to encapsulate any sorting, filtering,
pagination, and data retrieval logic specific to the application.

对于大多数真实世界中的应用，为表格提供一个 `DataSource` 实例都会是管理数据的最佳方式。
`DataSource` 旨在封装此应用特有的排序、过滤、分页和数据接收逻辑。

A `DataSource` is simply a class that has at a minimum the following methods: `connect` and
`disconnect`. The `connect` method will be called by the table to provide an `Observable` that emits
the data array that should be rendered. The table will call `disconnect` when the table is destroyed,
which may be the right time to clean up any subscriptions that may have been registered in the
`connect` method.

DataSource 是一个至少拥有两个函数的类：`connect` 和 `disconnect`。
表格会调用 `connect` 函数，以接收一个流，流中会发出要渲染的数组型数据。当表格销毁时，就会调用 `disconnect`，它是清理 `connect` 期间所做的各种订阅的最佳时机。

Although Angular Material provides a ready-made table `DataSource` class, `MatTableDataSource`, you may
want to create your own custom `DataSource` class for more complex use cases. This can be done by
extending the abstract `DataSource` class with a custom `DataSource` class that then implements the
`connect` and `disconnect` methods. For use cases where the custom `DataSource` must also inherit
functionality by extending a different base class, the `DataSource` base class can be
implemented instead (`MyCustomDataSource extends SomeOtherBaseClass implements DataSource`) to
respect Typescript's restriction to only implement one base class.

虽然 Angular Material 提供了现成的表格 `DataSource` 类 `MatTableDataSource`，但是你可能希望针对更复杂的用例创建自己的 `DataSource` 类。你可以用一个自定义的 `DataSource` 类来扩展抽象类 `DataSource`，然后实现其 `connect` 和 `disconnect` 方法。对于这些复杂用例，自定义 `DataSource` 必须通过扩展其他基类（ `MyCustomDataSource extends SomeOtherBaseClass implements DataSource` ）来继承其功能，以遵守 Typescript 的限制，即只能实现一个基类。

### Styling Columns

### 样式列

Each table cell has an automatically generated class based on which column it appears in. The format for this
generated class is `mat-column-NAME`. For example, cells in a column named "symbol" can be targeted with the
selector `.mat-column-symbol`.

每个表格单元格都有一个基于它出现在哪一列自动生成的类。这个生成的类的格式是 `mat-column-NAME` 。例如，可以使用选择器 `.mat-column-symbol` 将名为“symbol”的列中的单元格作为目标。

<!-- example(table-column-styling) -->

### Row Templates

### 行模板

Event handlers and property binding on the row templates will be applied to each row rendered by the table. For example,
adding a `(click)` handler to the row template will cause each individual row to call the handler when clicked.

行模板上的事件处理程序和属性绑定将应用于表中渲染的每一行。例如，向行模板添加 `(click)` 处理程序将导致每个单独的行在单击时调用处理程序。

<!-- example(table-row-binding) -->

### Features

### 特性

The `MatTable` is focused on a single responsibility: efficiently render rows of data in a
performant and accessible way.

`MatTable` 专注于一个职责：以高效且具有无障碍性的方式执行数据渲染。

You'll notice that the table itself doesn't come out of the box with a lot of features, but expects
that the table will be included in a composition of components that fills out its features.

你可能注意到了，表格本身并没有自带很多特性，而是把该表格作为一个组件联合体的一部分，来补全其它特性。

For example, you can add sorting and pagination to the table by using MatSort and MatPaginator and
mutating the data provided to the table according to their outputs.

比如，你可以把 `MatSort` 和 `MatPaginator` 添加到表格中，以提供排序和分页特性，并根据它们的输出来修改要传给表格的数据。

To simplify the use case of having a table that can sort, paginate, and filter an array of data,
the Angular Material library comes with a `MatTableDataSource` that has already implemented
the logic of determining what rows should be rendered according to the current table state. To add
these feature to the table, check out their respective sections below.

对于那些可以对数组型数据进行排序、分页和过滤功能的表格，为了简化其用法，Angular Material 库自带了一个 `MatTableDataSource`，它已经实现了根据当前表格的状态来决定要显示哪些列的逻辑。
要给表格添加这些特性，请查看其相关部分的文档。

#### Pagination

#### 分页

To paginate the table's data, add a `<mat-paginator>` after the table.

要想对表格数据进行分页，请在表格后添加一个 `<mat-paginator>`。

If you are using the `MatTableDataSource` for your table's data source, simply provide the
`MatPaginator` to your data source. It will automatically listen for page changes made by the user
and send the right paged data to the table.

如果你正在用 `MatTableDataSource` 作为表格的数据源，那么只要把 `MatPaginator` 提供给这个数据源就可以了。
它将会自动监听用户所做的页码变更，并把正确分页之后的数据发给该表格。

Otherwise if you are implementing the logic to paginate your data, you will want to listen to the
paginator's `(page)` output and pass the right slice of data to your table.

而如果你自己实现了数据分页逻辑，那就要监听该分页器的 `(page)` 输出，并把进行了正确的切片之后的数据发给表格。

For more information on using and configuring the `<mat-paginator>`, check out the
[mat-paginator docs](https://material.angular.io/components/paginator/overview).

要了解使用和配置 `<mat-paginator>` 的更多信息，参见 [mat-paginator 的文档](/components/paginator/overview)。

The `MatPaginator` is one provided solution to paginating your table's data, but it is not the only
option. In fact, the table can work with any custom pagination UI or strategy since the `MatTable`
and its interface is not tied to any one specific implementation.

`MatPaginator` 提供了一个对表格数据进行分页的解决方案，不过它不是唯一的选项。
事实上，该表格可以和任何自定义的分页器 UI 或策略类协同工作，因为 `MatTable` 及其接口并没有绑死在任何特定的实现上。

<!-- example(table-pagination) -->

#### Sorting

#### 排序

To add sorting behavior to the table, add the `matSort` directive to the table and add
`mat-sort-header` to each column header cell that should trigger sorting. Note that you have to import `MatSortModule` in order to initialize the `matSort` directive (see [API docs](https://material.angular.io/components/sort/api)).

要想为表格添加排序行为，请给它添加 `matSort` 指令并把 `mat-sort-header` 指令添加到每个允许触发排序功能的表头上。

```html
<!-- Name Column -->
<ng-container matColumnDef="position">
  <th mat-header-cell *matHeaderCellDef mat-sort-header> Name </th>
  <td mat-cell *matCellDef="let element"> {{element.position}} </td>
</ng-container>
```

If you are using the `MatTableDataSource` for your table's data source, provide the `MatSort`
directive to the data source and it will automatically listen for sorting changes and change the
order of data rendered by the table.

如果你正在用 `MatTableDataSource` 作为数据源，可以把 `MatSort` 提供给数据源，这样它就会自动监听排序的更改，并据此修改表格中数据的排序顺序。

By default, the `MatTableDataSource` sorts with the assumption that the sorted column's name
matches the data property name that the column displays. For example, the following column
definition is named `position`, which matches the name of the property displayed in the row cell.

默认情况下，`MatTableDataSource` 会假设已排序列的名称和该列所显示的属性名是一致的。比如，下面的列定义名叫 `position`，它和要显示在单元格中的属性名是一样的。

Note that if the data properties do not match the column names, or if a more complex data property
accessor is required, then a custom `sortingDataAccessor` function can be set to override the
default data accessor on the `MatTableDataSource`.

注意，如果数据属性与列名不一致，或需要更复杂的数据属性访问器，那么可以设置一个自定义的 `sortingDataAccessor` 函数，以覆盖 `MatTableDataSource` 上默认的数据访问器。

If you are not using the `MatTableDataSource`, but instead implementing custom logic to sort your
data, listen to the sort's `(matSortChange)` event and re-order your data according to the sort state.
If you are providing a data array directly to the table, don't forget to call `renderRows()` on the
table, since it will not automatically check the array for changes.

如果你没有使用 `MatTableDataSource` 而是自己实现了数据排序逻辑，那么可以监听此排序器的 `(matSortChange)` 事件，并根据其排序状态重新排序你的数据。
如果你要直接给表格提供一个数组型数据，别忘了调用表格的 `renderRows()` 函数，因为它不会自动检查对数组的修改。

<!-- example(table-sorting) -->

For more information on using and configuring the sorting behavior, check out the
[matSort docs](https://material.angular.io/components/sort/overview).

要了解使用和配置排序行为的更多信息，参见 [matSort 的文档](/components/sort/overview)。

The `MatSort` is one provided solution to sorting your table's data, but it is not the only option.
In fact, the table can work with any custom sorting UI or strategy since the `MatTable` and
its interface is not tied to any one specific implementation.

`MatSort` 是用来排序表格数据的一个现成的解决方案，但它不是唯一的选择。
事实上，表格可以和任何一个自定义的排序 UI 或策略类协同工作，因为 `MatTable` 及其接口没有绑死到任何一个特定的实现。

#### Filtering

#### 过滤

Angular Material does not provide a specific component to be used for filtering the `MatTable`
since there is no single common approach to adding a filter UI to table data.

Angular Material 没有提供用于过滤 `MatTable` 的具体组件，因为没有一种简单通用的方式可以为表格数据添加过滤界面。

A general strategy is to add an input where users can type in a filter string and listen to this
input to change what data is offered from the data source to the table.

通常的策略是添加一个输入框，用户可以在其中输入过滤字符串，并监听此输入，以修改从数据源提供给表格的数据。

If you are using the `MatTableDataSource`, simply provide the filter string to the
`MatTableDataSource`. The data source will reduce each row data to a serialized form and will filter
out the row if it does not contain the filter string. By default, the row data reducing function
will concatenate all the object values and convert them to lowercase.

如果你正在使用 `MatTableDataSource` 只要将过滤字符串提供给 `MatTableDataSource` 就可以了。
数据源将会把每一行数据进行缩减，并根据本行有没有包含该过滤字符串进行筛选。
默认情况下，行数据的缩减函数会把传给它的对象的所有值都连接起来，并转换成小写。

For example, the data object `{id: 123, name: 'Mr. Smith', favoriteColor: 'blue'}` will be reduced
to `123mr. smithblue`. If your filter string was `blue` then it would be considered a match because
it is contained in the reduced string, and the row would be displayed in the table.

比如，数据 `{id: 123, name: 'Mr. Smith', favoriteColor: 'blue'}` 将会缩减成 `123mr. smithblue`。
如果你的过滤字符串是 `blue`，那么它就是匹配的，因为它包含在缩减后的字符串中，这一行就会显示在表格中。

To override the default filtering behavior, a custom `filterPredicate` function can be set which
takes a data object and filter string and returns true if the data object is considered a match.

要覆盖这种默认的过滤行为，可以设置一个自定义的 `filterPredicate` 函数，它可以接受一个数据对象和过滤器字符串，如果认为该数据对象是匹配的，就返回 `true`。

If you want to show a message when not data matches the filter, you can use the `*matNoDataRow`
directive.

如果你想在过滤器匹配不上数据时显示某种信息，可以使用 `*matNoDataRow` 指令。

<!--- example(table-filtering) -->

#### Selection

#### 选取

Right now there is no formal support for adding a selection UI to the table, but Angular Material
does offer the right components and pieces to set this up. The following steps are one solution but
it is not the only way to incorporate row selection in your table.

目前，还没有对给表格添加选取界面提供正式的支持。不过 Angular Material 提供了一些组件和代码片段来支持它。
下面这些步骤是为表格添加列选择功能的解决方案之一（但不是唯一的）。

##### 1. Add a selection model

##### 1. 添加选取模式

Get started by setting up a `SelectionModel` from `@angular/cdk/collections` that will maintain the
selection state.

首先建立来自 `@angular/cdk/collections` 的 `SelectionModel`，它用来维护选取状态。

```js
const initialSelection = [];
const allowMultiSelect = true;
this.selection = new SelectionModel<MyDataType>(allowMultiSelect, initialSelection);
```

##### 2. Define a selection column

##### 2. 定义选择列

Add a column definition for displaying the row checkboxes, including a main toggle checkbox for
the header. The column name should be added to the list of displayed columns provided to the
header and data row.

添加一个列定义，以显示本行的检查框，包括给标题行的主控检查框。
其列名也要添加到提供给表头和数据行的待显示列数组中。

```html
<ng-container matColumnDef="select">
  <th mat-header-cell *matHeaderCellDef>
    <mat-checkbox (change)="$event ? toggleAllRows() : null"
                  [checked]="selection.hasValue() && isAllSelected()"
                  [indeterminate]="selection.hasValue() && !isAllSelected()">
    </mat-checkbox>
  </th>
  <td mat-cell *matCellDef="let row">
    <mat-checkbox (click)="$event.stopPropagation()"
                  (change)="$event ? selection.toggle(row) : null"
                  [checked]="selection.isSelected(row)">
    </mat-checkbox>
  </td>
</ng-container>
```

##### 3. Add event handling logic

##### 3. 添加事件处理逻辑

Implement the behavior in your component's logic to handle the header's main toggle and checking
if all rows are selected.

在组件逻辑中实现一些行为，以处理表头的主控开关，并检查是否所有的行都被选中了。

```js
/** Whether the number of selected elements matches the total number of rows. */
isAllSelected() {
  const numSelected = this.selection.selected.length;
  const numRows = this.dataSource.data.length;
  return numSelected == numRows;
}

/** Selects all rows if they are not all selected; otherwise clear selection. */
toggleAllRows() {
  this.isAllSelected() ?
      this.selection.clear() :
      this.dataSource.data.forEach(row => this.selection.select(row));
}
```

##### 4. Include overflow styling

##### 4. 包含 overflow 样式

Finally, adjust the styling for the select column so that its overflow is not hidden. This allows
the ripple effect to extend beyond the cell.

最后，调整选取列的样式，让它的 overflow 不是 hidden。这样就可以让涟漪效果延伸到单元格之外。

```css
.mat-column-select {
  overflow: initial;
}
```

<!--- example(table-selection) -->

#### Footer row

#### 表尾

A footer row can be added to the table by adding a footer row definition to the table and adding
footer cell templates to column definitions. The footer row will be rendered after the rendered
data rows.

添加一个表尾的定义并为其指定一个单元格模板，可以为表格添加一个表尾。表尾会显示在所有数据行之后。

```html
<ng-container matColumnDef="cost">
  <th mat-header-cell *matHeaderCellDef> Cost </th>
  <td mat-cell *matCellDef="let data"> {{data.cost}} </td>
  <td mat-footer-cell *matFooterCellDef> {{totalCost}} </td>
</ng-container>

...

<tr mat-header-row *matHeaderRowDef="columnsToDisplay"></tr>
<tr mat-row *matRowDef="let myRowData; columns: columnsToDisplay"></tr>
<tr mat-footer-row *matFooterRowDef="columnsToDisplay"></tr>
```

<!--- example(table-footer-row) -->

#### Sticky Rows and Columns

#### 钉住某些行和列

By using `position: sticky` styling, the table's rows and columns can be fixed so that they do not
leave the viewport even when scrolled. The table provides inputs that will automatically apply the
correct CSS styling so that the rows and columns become sticky.

通过使用 `position: sticky` 样式，可以固定住表格的某些行和列，这样它们在滚动时就不会离开视野。
表格所提供的输入属性将会自动应用正确的 CSS 样式，以便这些行和列能被钉住。

In order to fix the header row to the top of the scrolling viewport containing the table, you can
add a `sticky` input to the `matHeaderRowDef`.

要想把表头行固定到包含此表格的视野顶部，你可以给 `matHeaderRowDef` 添加输入属性 `sticky`。

<!--- example(table-sticky-header) -->

Similarly, this can also be applied to the table's footer row. Note that if you are using the native
`<table>` and using Safari, then the footer will only stick if `sticky` is applied to all the
rendered footer rows.

同样的，我们也可以钉住表格的表尾。注意，如果你正在使用原生的 `<table>` 和 Safari，那么只有当所有的尾行都带有 `sticky` 的时候，表尾才会被钉住。

<!--- example(table-sticky-footer) -->

It is also possible to fix cell columns to the start or end of the horizontally scrolling viewport.
To do this, add the `sticky` or `stickyEnd` directive to the `ng-container` column definition.

还可以把一些列的单元格固定在水平滚动视图的头部和尾部，只要把 `sticky` 或 `stickyEnd` 指令添加到 `ng-container` 的列定义上就可以了。

<!--- example(table-sticky-columns) -->

This feature is supported by Chrome, Firefox, Safari, and Edge. It is not supported in IE, but
it does fail gracefully so that the rows simply do not stick.

该特性受到 Chrome、Firefox、Safari 和 Edge 的支持。IE 不支持它，但它会优雅的失败，其后果只是那些列没有钉住而已。

Note that on Safari mobile when using the flex-based table, a cell stuck in more than one direction
will struggle to stay in the correct position as you scroll. For example, if a header row is stuck
to the top and the first column is stuck, then the top-left-most cell will appear jittery as you
scroll.

注意，在移动版的 Safari 上，如果使用 Flex 布局的表格，当滚动时，钉在多于一个方向的单元格将难以保持在正确的位置上。
比如，如果表头钉在顶部，而且第一列也钉住了，那么当滚动时，其左上角的单元格将会不断抖动。

Also, sticky positioning in Edge will appear shaky for special cases. For example, if the scrolling
container has a complex box shadow and has sibling elements, the stuck cells will appear jittery.
There is currently an [open issue with Edge](https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/17514118/)
to resolve this.

此外，在一些特殊情况下，Edge 中的定位也会不稳定。比如，如果滚动容器具有复杂的阴影而且还有兄弟元素，那么钉住的单元格就会抖动。
这里是 [Edge 上关于此问题的 Issue](https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/17514118/)。

#### Multiple row templates

#### 多行模板

When using the `multiTemplateDataRows` directive to support multiple rows for each data object, the context of `*matRowDef` is the same except that the `index` value is replaced by `dataIndex` and `renderIndex`.

当使用 `multiTemplateDataRows` 指令以支持让每个数据对象对应多行时，`*matRowDef` 中使用同一个上下文，不过其 `index` 值要换成 `dataIndex` 和 `renderIndex`。

### Accessibility

### 无障碍性

By default, `MatTable` applies `role="table"`, assuming the table's contains primarily static
content. You can change the role by explicitly setting `role="grid"` or `role="treegrid"` on the
table element. While changing the role will update child element roles, such as changing
`role="cell"` to `role="gridcell"`, this does _not_ apply additional keyboard input handling or
focus management to the table.

默认情况下， `MatTable` 会应用 `role="table"`，这里假设表格主要包含静态内容。你可以通过在 table 元素上显式设置 `role="grid"` 或 `role="treegrid"` 来更改其角色。虽然更改角色会更新子元素角色，例如将 `role="cell"` 更改为 `role="gridcell"` ，但这*不会*对表格应用额外的键盘输入处理或焦点管理逻辑。

Always provide an accessible label for your tables via `aria-label` or `aria-labelledby` on the
table element.

始终通过表格元素上的 `aria-label` 或 `aria-labelledby` 为你的表格提供无障碍标签。

### Tables with `display: flex`

### 使用 `display: flex` 的表格

The `MatTable` does not require that you use a native HTML table. Instead, you can use an
alternative approach that uses `display: flex` for the table's styles.

`MatTable` 不要求你使用原生 HTML 表格，所以你可以用另一种基于 `display: flex` 的方式来控制表格的样式。

This alternative approach replaces the native table element tags with the `MatTable` directive
selectors. For example, `<table mat-table>` becomes `<mat-table>`; `<tr mat-row>` becomes
`<mat-row>`. The following shows a previous example using this alternative template:

这种方式把原生的 `table` 元素标记替换成 `MatTable` 指令的选择器。
比如 `<table mat-table>` 变成了 `<mat-table>`；`<tr mat-row>` 变成了 `<mat-row>`。下面的例子用这种方式改写了以前的例子：

```html
<mat-table [dataSource]="dataSource">
  <!-- User name Definition -->
  <ng-container matColumnDef="username">
    <mat-header-cell *matHeaderCellDef> User name </mat-header-cell>
    <mat-cell *matCellDef="let row"> {{row.username}} </mat-cell>
  </ng-container>

  <!-- Age Definition -->
  <ng-container matColumnDef="age">
    <mat-header-cell *matHeaderCellDef> Age </mat-header-cell>
    <mat-cell *matCellDef="let row"> {{row.age}} </mat-cell>
  </ng-container>

  <!-- Title Definition -->
  <ng-container matColumnDef="title">
    <mat-header-cell *matHeaderCellDef> Title </mat-header-cell>
    <mat-cell *matCellDef="let row"> {{row.title}} </mat-cell>
  </ng-container>

  <!-- Header and Row Declarations -->
  <mat-header-row *matHeaderRowDef="['username', 'age', 'title']"></mat-header-row>
  <mat-row *matRowDef="let row; columns: ['username', 'age', 'title']"></mat-row>
</mat-table>
```

Note that this approach means you cannot include certain native-table features such colspan/rowspan
or have columns that resize themselves based on their content.

注意，这种方法意味着你不能使用某些原生表格的专属特性，比如 colspan/rowspan 或一些能根据其内容自动调整自身大小的列。

### Tables with `MatRipple`

### 带有 `MatRipple` 的表格

By default, `MatTable` does not set up Material Design ripples for rows. A ripple effect can be
added to table rows by using the `MatRipple` directive from `@angular/material/core`. Due to
limitations in browsers, ripples cannot be applied native `th` or `tr` elements. The recommended
approach for setting up ripples is using the non-native `display: flex` variant of `MatTable`.

默认情况下， `MatTable` 不会为行设置 Material Design 涟漪。可以使用来自 `@angular/material/core` 的 `MatRipple` 指令将涟漪效果添加到表行。由于浏览器的限制，涟漪不能应用于原生 `th` 或 `tr` 元素。设置涟漪的推荐方法是使用 `MatTable` 的非原生 `display: flex` 变体。

<!--- example(table-with-ripples) -->

More details about ripples on native table rows and their limitations can be found [in this issue](https://github.com/angular/components/issues/11883#issuecomment-634942981).

有关原生表行上的涟漪及其限制的更多详细信息，请参见[本错误](https://github.com/angular/components/issues/11883#issuecomment-634942981)。
