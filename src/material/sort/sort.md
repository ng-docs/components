The `matSort` and `mat-sort-header` are used, respectively, to add sorting state and display
to tabular data.

`matSort` 和 `mat-sort-header` 用于为表格型数据添加排序状态并显示出来。

<!-- example(sort-overview) -->

### Adding sort to table headers

### 为表头添加排序功能

To add sorting behavior and styling to a set of table headers, add the `<mat-sort-header>` component
to each header and provide an `id` that will identify it. These headers should be contained within a
parent element with the `matSort` directive, which will emit a `matSortChange` event when the user
 triggers sorting on the header.

要想为表头添加排序行为和样式，请把 `<mat-sort-header>` 组件添加到每个表头中，并提供一个 `id` 来标识它。
这些表头应该包含在一个带有 `matSort` 指令的父元素中，当用户在表头上触发排序时，该指令将会发出一个 `matSortChange` 事件。

Users can trigger the sort header through a mouse click or keyboard action. When this happens, the
`matSort` will emit a `matSortChange` event that contains the ID of the header triggered and the
direction to sort (`asc` or `desc`).

用户可以通过鼠标点击或键盘动作来为表头触发排序。这时，`matSort` 就会发出一个 `matSortChange` 事件，其中包含触发排序的表头和排序的方向（`asc` 或 `desc`）。

#### Changing the sort order

#### 修改排序方向

By default, a sort header starts its sorting at `asc` and then `desc`. Triggering the sort header
after `desc` will remove sorting.

默认情况下，排序表头的排序方向先从 `asc` 开始，再点就变成 `desc`，再点一次则会移除排序。

To reverse the sort order for all headers, set the `matSortStart` to `desc` on the `matSort`
directive. To reverse the order only for a specific header, set the `start` input only on the header
instead.

要想逆转所有表头的排序顺序，请把 `matSort` 指令的 `matSortStart` 属性设置为 `desc`。
如果要对某个特定的表头逆转排序顺序，请设置那个表头自身的输入属性 `start`。

To prevent the user from clearing the sort state from an already sorted column, set
`matSortDisableClear` to `true` on the `matSort` to affect all headers, or set `disableClear` to
`true` on a specific header.

要想阻止该用户从已经排序的列上清除排序状态，请把 `matSort` 的 `matSortDisableClear` 属性设置为 `true` 来影响所有表头，如果只想针对特定的表头，请把该表头的 `disableClear` 设置为 `true`。

#### Disabling sorting

#### 禁用排序

If you want to prevent the user from changing the sorting order of any column, you can use the
`matSortDisabled` binding on the `mat-sort`, or the `disabled` on a single `mat-sort-header`.

如果你要阻止用户修改所有列的排序状态，可以绑定 `mat-sort` 的 `matSortDisabled` 属性；如果只想针对单个 `mat-sort-header`，请绑定它的 `disabled` 属性。

#### Using sort with the mat-table

#### 在 mat-table 上使用排序

When used on a `mat-table` header, it is not required to set a `mat-sort-header` id on because
by default it will use the id of the column.

当使用 `mat-table` 中的表头时，不需要为它设置 `mat-sort-header`，因为默认情况下它将会使用列本身的 id。

<!-- example(table-sorting) -->

### Accessibility

### 无障碍性

When you apply `MatSortHeader` to a header cell element, the component wraps the content of the
header cell inside a button. The text content of the header cell then becomes the accessible
label for the sort button. However, the header cell text typically describes the column and does
not indicate that interacting with the control performs a sorting action. To clearly communicate
that the header performs sorting, always use the `sortActionDescription` input to provide a
description for the button element, such as "Sort by last name".

当你将 `MatSortHeader` 应用于标题单元格元素时，该组件会将标题单元格的内容包装在按钮内。然后标题单元格的文本内容就会成为排序按钮的无障碍标签。但是，标题单元格文本通常会描述列，而不会用来与控件交互执行排序操作。要清楚地表达标题如何执行排序，请始终使用输入属性 `sortActionDescription` 来提供按钮元素的描述，例如“按姓氏排序”。

`MatSortHeader` applies the `aria-sort` attribute to communicate the active sort state to
assistive technology. However, most screen readers do not announce changes to the value of
`aria-sort`, meaning that screen reader users do not receive feedback that sorting occurred. To
remedy this, use the `matSortChange` event on the `MatSort` directive to announce state
updates with the `LiveAnnouncer` service from `@angular/cdk/a11y`.

`MatSortHeader` 应用 `aria-sort` 属性将当前排序状态传达给辅助技术。但是，大多数屏幕阅读器不会播报 `aria-sort` 值的更改，这意味着屏幕阅读器用户不会收到排序发生的反馈。要解决此问题，请使用 `MatSort` 指令上的 `matSortChange` 事件通过来自 `@angular/cdk/a11y` 的 `LiveAnnouncer` 服务播报本次状态更新。

If your application contains many tables and sort headers, consider creating a custom
directives to consistently apply `sortActionDescription` and announce sort state changes. 

如果你的应用程序包含许多表和排序标头，请考虑创建自定义指令以一致地应用 `sortActionDescription` 并播报排序状态更改。
