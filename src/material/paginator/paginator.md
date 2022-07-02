`<mat-paginator>` provides navigation for paged information, typically used with a table.

`<mat-paginator>` 可以为分页信息提供导航功能，通常和表格一起用。

<!-- example(paginator-overview) -->

### Basic use

### 基本用法

Each paginator instance requires:

每个分页器实例都需要：

* The number of items per page (default set to 50)

  每页的条目数（默认为 50）

* The total number of items being paged

  要分页的总条目数

The current page index defaults to 0, but can be explicitly set via pageIndex.

当前页的索引默认为 0，不过可以通过 `pageIndex` 进行显式设置。

When the user interacts with the paginator, a `PageEvent` will be fired that can be used to update
any associated data view.

当用户与分页器交互时，将会触发一个 `PageEvent`，你可以根据它更新相关的数据视图。

### Page size options

### 页面大小选项

The paginator displays a dropdown of page sizes for the user to choose from. The options for this
dropdown can be set via `pageSizeOptions`

分页器会显示一个页大小的下拉框，让用户可以选择页大小。该下拉框的选项可以通过 `pageSizeOptions` 进行设置。

The current pageSize will always appear in the dropdown, even if it is not included in
pageSizeOptions.

即使没有在 `pageSizeOptions` 中指定页大小，它也总会显示在下拉框中。

If you want to customize some of the optional of the `mat-select` inside the `mat-paginator`, you
can use the `selectConfig` input.

### Internationalization

### 国际化

The labels for the paginator can be customized by providing your own instance of `MatPaginatorIntl`.
This will allow you to change the following:

分页器的各种标签可以通过指定你自己的 `MatPaginatorIntl` 实例进行定制。
这将允许你修改：

 1. The label for the length of each page.

   每页大小的标签。
 2. The range text displayed to the user.

   要显示给用户的范围文本。
 3. The tooltip messages on the navigation buttons.

   各个导航按钮上的提示信息。

### Accessibility

### 无障碍性

The paginator uses `role="group"` to semantically group its child controls. You must add an
`aria-label` or `aria-labelledby` attribute to `<mat-paginator>` with a label that describes
the content controlled by the pagination control.

分页器使用 `role="group"` 对其子控件进行语义分组。你必须向 `<mat-paginator>` 添加一个 `aria-label` 或 `aria-labelledby` 属性，并带有一个描述由此分页控件控制的内容的标签。

You can set the `aria-label` attributes for the button and select controls within the paginator in
`MatPaginatorIntl`.

你可以为按钮设置 `aria-label` 属性，并在 `MatPaginatorIntl` 中的分页器中选择控件。
