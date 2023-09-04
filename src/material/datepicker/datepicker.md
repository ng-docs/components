The datepicker allows users to enter a date either through text input, or by choosing a date from
the calendar. It is made up of several components, directives and [the date implementation module](#choosing-a-date-implementation-and-date-format-settings) that work together.

日期选择器允许用户通过文本框输入一个日期，或用日历选取一个日期。它由一几个协同工作的组件、指令和[日期的实现模块](#choosing-a-date-implementation-and-date-format-settings)组成。

<!-- example(datepicker-overview) -->

### Connecting a datepicker to an input

### 把日期选择器关联到一个输入框

A datepicker is composed of a text input and a calendar pop-up, connected via the `matDatepicker`
property on the text input.

日期选择器由一个文本输入框和一个日历弹出框组成，它们通过文本框上的 `matDatepicker` 联系起来。

There is also an optional datepicker toggle button that gives the user an easy way to open the datepicker pop-up.

还有一个可选的日期选择器切换按钮，它给了用户一种弹出日期选择器的简易方式。

<!-- example({"example":"datepicker-overview",
              "file":"datepicker-overview-example.html",
              "region":"toggle"}) -->

This works exactly the same with an input that is part of an `<mat-form-field>` and the toggle
can easily be used as a prefix or suffix on the Material input:

当输入框作为 `<mat-form-field>` 的一部分时，也完全一样。
切换按钮可以很容易地作为输入框的前缀或后缀：

<!-- example({"example":"datepicker-overview",
              "file":"datepicker-overview-example.html"}) -->

If you want to customize the icon that is rendered inside the `mat-datepicker-toggle`, you can do so
by using the `matDatepickerToggleIcon` directive:

如果你要定制 `mat-datepicker-toggle` 中渲染的图标，可以使用 `matDatepickerToggleIcon` 指令：

<!-- example(datepicker-custom-icon) -->

### Date range selection

### 日期范围选择

If you want your users to select a range of dates, instead of a single date, you can use the
`mat-date-range-input` and `mat-date-range-picker` components. They work in tandem, similarly to the
`mat-datepicker` and the basic datepicker input.

如果你希望用户选择一个日期范围而不是单个日期，可以使用 `mat-date-range-input` 和 `mat-date-range-picker` 组件。它们可以关联使用，类似于 `mat-date-range-input` 和 `mat-datepicker`。

The `mat-date-range-input` component requires two `input` elements for the start and end dates,
respectively:

`mat-date-range-input` 组件要求为开始日期和结束日期分别提供两个 `input` 元素：

```html
<mat-date-range-input>
  <input matStartDate placeholder="Start date">
  <input matEndDate placeholder="End date">
</mat-date-range-input>
```

The `mat-date-range-picker` component acts as the pop-up panel for selecting dates. This works in
the same way as `mat-datepicker`, but allows the user to select multiple times:

`mat-date-range-picker` 组件作为弹出式面板，用于选择日期。其工作方式和 `mat-datepicker` 相同，但允许用户多次选择：

```html
<mat-date-range-picker #picker></mat-date-range-picker>
```

Connect the range picker and range input using the `rangePicker` property:

使用 `rangePicker` 属性把范围选择器和范围输入框联系起来：

```html
<mat-date-range-input [rangePicker]="picker">
  <input matStartDate placeholder="Start date">
  <input matEndDate placeholder="End date">
</mat-date-range-input>

<mat-date-range-picker #picker></mat-date-range-picker>
```

<!-- example(date-range-picker-overview) -->

### Date range input forms integration

### 日期范围输入框的表单集成

The `mat-date-range-input` component can be used together with the `FormGroup` directive from
`@angular/forms` to group the start and end values together and to validate them as a group.

`mat-date-range-input` 组件可以和来自 `@angular/forms` 的 `FormGroup` 指令一起使用，它会把起始值和结束值组合在一起，并把它们作为一个组进行验证。

<!-- example(date-range-picker-forms) -->

### Setting the calendar starting view

### 设置日历的起始视图

The `startView` property of `<mat-datepicker>` can be used to set the view that will show up when
the calendar first opens. It can be set to `month`, `year`, or `multi-year`; by default it will open
to month view.

`<mat-datepicker>` 的 `startView` 属性可用来指定当首次打开日历时，应该使用哪个视图。
它可以是 `month`（月）、`year`（年）或 `multi-year`（多年）之一，默认情况下是月。

The month, year, or range of years that the calendar opens to is determined by first checking if any
date is currently selected, if so it will open to the month or year containing that date. Otherwise
it will open to the month or year containing today's date. This behavior can be overridden by using
the `startAt` property of `<mat-datepicker>`. In this case the calendar will open to the month or
year containing the `startAt` date.

此日历中打开的月份、年份或年份的范围，取决于当前是否选择了某个日期。如果选择了，它就会打开包含该日期的月份或年份。否则，它就打开包含当前日期的月份或年份。
这种行为可以用 `<mat-datepicker>` 的 `startAt` 属性来改写。这种情况下，此日历将打开包含 `startAt` 日期的月份或年份。

<!-- example(datepicker-start-view) -->

#### Watching the views for changes on selected years and months

#### 在选择的年份或月份上监听视图的更改

When a year or a month is selected in `multi-year` and `year` views respectively, the `yearSelected`
and `monthSelected` outputs emit a normalized date representing the chosen year or month. By
"normalized" we mean that the dates representing years will have their month set to January and
their day set to the 1st. Dates representing months will have their day set to the 1st of the
month. For example, if `<mat-datepicker>` is configured to work with javascript native Date
objects, the `yearSelected` will emit `new Date(2017, 0, 1)` if the user selects 2017 in
`multi-year` view. Similarly, `monthSelected` will emit `new Date(2017, 1, 1)` if the user
selects **February** in `year` view and the current date value of the connected `<input>` was
set to something like `new Date(2017, MM, dd)` when the calendar was opened (the month and day are
irrelevant in this case).

如果在 `multi-year` / `year` 视图中选择年 / 月时，输出属性 `yearSelected` / `monthSelected` 将会发出一个表示所选年 / 月的标准化日期。
这里 "标准化" 的意思是：对于年，它会设置为当年的一月一日；对于月，它会设置为当月的第一天。例如：
如果 `<mat-datepicker>` 配置为和 JavaScript 的原生 Date 对象协同工作，则当用户在 `multi-year` 视图中选中 2017 年时，`yearSelected` 将发出 `new Date(2017, 0, 1)`。
同样，如果用户在 `year` 视图中选中了二月，则 `monthSelected` 将会发出 `new Date(2017, 1, 1)`。而当打开日历时相关 `<input>` 的当前日期值会设置为某个类似 `new Date(2017, MM, dd)` 的值（这种情况下月和日是无关的）。

Notice that the emitted value does not affect the current value in the connected `<input>`, which
is only bound to the selection made in the `month` view. So if the end user closes the calendar
after choosing a year in `multi-view` mode (by pressing the `ESC` key, for example), the selected
year, emitted by `yearSelected` output, will not cause any change in the value of the date in the
associated `<input>`.

注意，发出的值不会影响相关 `<input>` 的当前值，当前值只跟你在 `month` 视图中所做选的日期有关。
所以，如果最终用户在 `multi-year` 视图下选择了某一年后关闭了日历（比如通过按下 ESC 键），则由 `yearSelected` 发出的选定年份不会给相关 `<input>` 中的日期值带来任何变化。

The following example uses `yearSelected` and `monthSelected` outputs to emulate a month and year
picker (if you're not familiar with the usage of `MomentDateAdapter` and `MAT_DATE_FORMATS`
you can [read more about them](#choosing-a-date-implementation-and-date-format-settings) below in
this document to fully understand the example).

下面的例子使用输出属性 `yearSelected` 和 `monthSelected` 来模拟月和年的选择器（如果你对 `MomentDateAdapter` 和 `MAT_DATE_FORMATS` 的用法还不熟，可以在稍后部分[阅读它们](#choosing-a-date-implementation-and-date-format-settings)以更好地理解该范例）。

<!-- example(datepicker-views-selection) -->

### Setting the selected date

### 设置选定日期

The type of values that the datepicker expects depends on the type of `DateAdapter` provided in your
application. The `NativeDateAdapter`, for example, works directly with plain JavaScript `Date`
objects. When using the `MomentDateAdapter`, however, the values will all be Moment.js instances.
This use of the adapter pattern allows the datepicker component to work with any arbitrary date
representation with a custom `DateAdapter`.
See [_Choosing a date implementation_](#choosing-a-date-implementation-and-date-format-settings)
for more information.

Datepicker 的值类型取决于你提供的 `DateAdapter` 的类型。
比如，`NativeDateAdapter` 会直接使用普通的 JavaScript `Date` 对象；而使用 `MomentDateAdapter` 时，所有的值都会是 Moment.js 的实例。
这种适配器模式，可以让 Datepicker 组件借助自定义 `DateAdapter` 来处理日期的任何一种表示法。

Depending on the `DateAdapter` being used, the datepicker may automatically deserialize certain date
formats for you as well. For example, both the `NativeDateAdapter` and `MomentDateAdapter` allow
[ISO 8601](https://tools.ietf.org/html/rfc3339) strings to be passed to the datepicker and
automatically converted to the proper object type. This can be convenient when binding data directly
from your backend to the datepicker. However, the datepicker will not accept date strings formatted
in user format such as `"1/2/2017"` as this is ambiguous and will mean different things depending on
the locale of the browser running the code.

根据所使用的 `DateAdapter`，日期选择器还可以自动重新序列化某些日期格式。例如：`NativeDateAdapter` 和 `MomentDateAdapter` 都允许把 [ISO 8601](https://tools.ietf.org/html/rfc3339) 字符串传给日期选择器，
并自动转换成合适的对象类型。
当直接把后端数据类型绑定到日期选择器时，这很方便。不过，日期选择器不接受用户格式的日期字符串（比如 `"1/2/2017"`），
因为它是有二义性的，它会根据执行代码的浏览器的时区设置不同而代表不同的日期。

As with other types of `<input>`, the datepicker works with `@angular/forms` directives such as
`formGroup`, `formControl`, `ngModel`, etc.

像 `<input>` 的其它类型一样，日期选择器也能和 `@angular/forms` 中的指令协同工作，比如 `formGroup`、`formControl`、`ngModel` 等。

<!-- example(datepicker-value) -->

### Changing the datepicker colors

### 修改日期选择器的颜色

The datepicker popup will automatically inherit the color palette (`primary`, `accent`, or `warn`)
from the `mat-form-field` it is attached to. If you would like to specify a different palette for
the popup you can do so by setting the `color` property on `mat-datepicker`.

当日期选择器弹出时，它会自动继承所附着的 `mat-form-field` 的调色板（`primary`、`accent` 或 `warn`）。
如果你要为弹出框另行指定一个调色板，可以设置 `mat-datepicker` 的 `color` 属性。

<!-- example(datepicker-color) -->

### Date validation

### 日期验证

There are three properties that add date validation to the datepicker input. The first two are the
`min` and `max` properties. In addition to enforcing validation on the input, these properties will
disable all dates on the calendar popup before or after the respective values and prevent the user
from advancing the calendar past the `month` or `year` (depending on current view) containing the
`min` or `max` date.

有三个属性可以为日期选择器添加日期验证。前两个是 `min` 和 `max` 属性。除了对输入执行验证之外，这些属性还会禁用日期弹出框中相应值之前或之后的所有日期，并阻止用户将日历推进到包含 `min` 或 `max` 日期之外的 `month` 或 `year`（取决于当前视图）。

<!-- example(datepicker-min-max) -->

The second way to add date validation is using the `matDatepickerFilter` property of the datepicker
input. This property accepts a function of `<D> => boolean` (where `<D>` is the date type used by
the datepicker, see
[_Choosing a date implementation_](#choosing-a-date-implementation-and-date-format-settings)).
A result of `true` indicates that the date is valid and a result of `false` indicates that it is
not. Again this will also disable the dates on the calendar that are invalid. However, one important
difference between using `matDatepickerFilter` vs using `min` or `max` is that filtering out all
dates before or after a certain point, will not prevent the user from advancing the calendar past
that point.

添加验证器的第二种方式是使用日期选择器输入框的 `matDatepickerFilter` 属性。
该属性接受一个 `<D> => boolean` 型的函数（这里的 `<D>` 是日期选择器所用的日期类型，参见[*选择一个日期实现类*](#choosing-a-date-implementation-and-date-format-settings)）。
如果结果是 `true` 则表示该日期是有效的，如果为 `false` 则表示无效。同样，这也会禁用日历上那些无效的日期。
不过，`matDatepickerFilter` 和 `min` 或 `max` 之间有一个重要的差异 —— 如果过滤掉了特定时间点之前或之后的所有日期，并不会阻止用户把日历推进到无效的日期范围内。

<!-- example(datepicker-filter) -->

In this example the user cannot select any date that falls on a Saturday or Sunday, but all of the 
dates which fall on other days of the week are selectable.

在这个例子中（译注：这个例子有问题），用户可以回到 2005 年之前，但那之前的所有日期都是不可选取的。
但日历不能回到 2000 年之前。如果用户手动输入一个 `min` 之前或 `max` 之后或过滤掉的日期，该输入框就会发生有效性错误。

Each validation property has a different error that can be checked:

每个验证属性可以检查出不同的错误：

- A value that violates the `min` property will have a `matDatepickerMin` error.

  违反 `min` 属性的值将给出 `matDatepickerMin` 错误。

- A value that violates the `max` property will have a `matDatepickerMax` error.

  违反 `max` 属性的值将给出 `matDatepickerMax` 错误。

- A value that violates the `matDatepickerFilter` property will have a `matDatepickerFilter` error.

  违反 `matDatepickerFilter` 属性的值将给出 `matDatepickerFilter` 错误。

### Input and change events

### 输入（`input`）事件与变更（`change`）事件

The input's native `(input)` and `(change)` events will only trigger due to user interaction with
the input element; they will not fire when the user selects a date from the calendar popup.
Therefore, the datepicker input also has support for `(dateInput)` and `(dateChange)` events. These
trigger when the user interacts with either the input or the popup.

输入框原生的 `(input)` 和 `(change)` 事件只会因为用户和输入框元素的交互而触发；当用户在日历弹出框中选择日期时则不会触发。
因此，日期选择框的输入还支持 `(dateInput)` 和 `(dateChange)` 事件。无论用户输入还是在弹出框中选择都会触发这两个事件。

The `(dateInput)` event will fire whenever the value changes due to the user typing or selecting a
date from the calendar. The `(dateChange)` event will fire whenever the user finishes typing input
(on `<input>` blur), or when the user chooses a date from the calendar.

每当用户正在输入或正在日历中点选日期时都会触发 `(dateInput)` 事件。
而当用户结束了输入（`<input>` 失焦）或在日历中选好了日期时，就会触发 `(dateChange)` 事件。

<!-- example(datepicker-events) -->

### Disabling parts of the datepicker

### 部分禁用日期选择框

As with any standard `<input>`, it is possible to disable the datepicker input by adding the
`disabled` property. By default, the `<mat-datepicker>` and `<mat-datepicker-toggle>` will inherit
their disabled state from the `<input>`, but this can be overridden by setting the `disabled`
property on the datepicker or toggle elements. This can be useful if you want to disable text input
but allow selection via the calendar or vice-versa.

像任何标准的 `<input>` 一样，也可以通过添加 `disabled` 属性来禁用日期选择器的输入框。
默认情况下，`<mat-datepicker>` 和 `<mat-datepicker-toggle>` 将会从 `<input>` 中继承禁用状态，不过也可以通过设置日期选择器或开关元素的 `disabled` 属性来覆盖它。
如果你想禁用文本框却允许通过日历进行选取（或反之）时，这会很有用。

<!-- example(datepicker-disabled) -->

### Confirmation action buttons

### 确认动作按钮

By default, clicking on a date in the calendar will select it and close the calendar popup. In some
cases this may not be desirable, because the user doesn't have a quick way of going back if they've
changed their mind. If you want your users to be able to cancel their selection and to have to
explicitly accept the value that they've selected, you can add a `<mat-datepicker-actions>` element
inside `<mat-datepicker>` with a "Cancel" and an "Apply" button marked with the
`matDatepickerCancel` and `matDatepickerApply` attributes respectively. Doing so will cause the
datepicker to only assign the value to the data model if the user presses "Apply", whereas pressing
"Cancel" will close popup without changing the value.

默认情况下，单击日历中的某个日期会选择它并关闭日历弹出窗口。在某些情况下，这可能是不可取的，因为如果用户改变主意，用户就无法快速返回。如果你希望你的用户可以取消他们的选择，而必须明确接受他们已经选择的值，你可以在 `<mat-datepicker>` 中添加一个 `<mat-datepicker-actions>` 元素，内含带有 `matDatepickerCancel` 属性的 “Cancel” 按钮和带有 `matDatepickerApply` 属性的 “Apply” 按钮。这样就会让日期选择器只有在用户按下 “Apply” 的情况下才把值赋给数据模型，而按下 “Cancel” 则会关闭弹出窗口而不改变值。

<!-- example({"example":"datepicker-actions",
              "file":"datepicker-actions-example.html",
              "region":"datepicker-actions"}) -->

The actions element is also supported for `<mat-date-range-picker>` where that it is called
`<mat-date-range-picker-actions>` and the buttons are called `matDateRangePickerCancel` and
`matDateRangePickerApply` respectively.

此 actions 元素也支持 `<mat-date-range-picker>`，它叫做 `<mat-date-range-picker-actions>`，其按钮分别叫做 `matDateRangePickerCancel` 和 `matDateRangePickerApply`。

<!-- example({"example":"datepicker-actions",
              "file":"datepicker-actions-example.html",
              "region":"date-range-picker-actions"}) -->

<!-- example(datepicker-actions) -->

### Comparison ranges

### 比较范围

If your users need to compare the date range that they're currently selecting with another range,
you can provide the comparison range start and end dates to the `mat-date-range-input` using the
`comparisonStart` and `comparisonEnd` bindings. The comparison range will be rendered statically
within the calendar, but it will change colors to indicate which dates overlap with the user's
selected range.

如果你的用户需要把他们当前正在选择的日期范围与另一个范围进行比较，你可以使用 `comparisonStart` 和 `comparisonEnd` 绑定来为 `mat-date-range-input` 提供比较范围。比较范围会在日历中静态渲染，但会改变颜色，以便指示哪些日期与用户选定的范围重叠。

<!-- example(date-range-picker-comparison) -->

Note that comparison and overlap colors aren't derived from the current theme, due
to limitations in the Material Design theming system. They can be customized using the
`datepicker-date-range-colors` mixin.

请注意，由于 Material Design 主题体系的限制，比较色和重叠色并非来自当前主题。可以使用 `datepicker-date-range-colors` mixin 来定制它们。

```scss
@use '@angular/material' as mat;

@include mat.datepicker-date-range-colors(
  hotpink, teal, yellow, purple);
```

### Customizing the date selection logic

### 自定义日期选择逻辑

The `mat-date-range-picker` supports custom behaviors for range previews and selection. To customize
this, you first create a class that implements `MatDateRangeSelectionStrategy`, and then provide
the class via the `MAT_DATE_RANGE_SELECTION_STRATEGY` injection token. The following example
uses the range selection strategy to create a custom range picker that limits the user to five-day
ranges.

`mat-date-range-picker` 支持自定义范围预览和选择的行为。为了自定义它，首先要创建一个实现 `MatDateRangeSelectionStrategy` 的类，然后通过 `MAT_DATE_RANGE_SELECTION_STRATEGY` 令牌提供该类。下面的例子使用这种范围选择策略来创建一个自定义范围选择器，它可以把用户限制在五天的范围内。

<!-- example(date-range-picker-selection-strategy) -->

### Touch UI mode

### 触屏 UI 模式

The datepicker normally opens as a popup under the input. However this is not ideal for touch
devices that don't have as much screen real estate and need bigger click targets. For this reason
`<mat-datepicker>` has a `touchUi` property that can be set to `true` in order to enable a more
touch friendly UI where the calendar opens in a large dialog.

正常情况下，日期选择器会在输入框下方打开一个弹出框。不过，这对于触屏设备很不理想，它们屏幕较小，并且需要更大的点击目标。
出于这个原因，`<mat-datepicker>` 有一个 `touchUi` 属性，它可以设置为 `true` 以便在大对话框中打开日历时启用更加友好的 UI。

<!-- example(datepicker-touch) -->

### Manually opening and closing the calendar

### 手动打开和关闭日历

The calendar popup can be programmatically controlled using the `open` and `close` methods on the
`<mat-datepicker>`. It also has an `opened` property that reflects the status of the popup.

日历弹出框可以使用 `<mat-datepicker>` 的 `open` 和 `close` 方法进行程序化控制。
它还有一个 `opened` 属性来反应弹出框的状态。

<!-- example(datepicker-api) -->

### Using `mat-calendar` inline

### 使用 `mat-calendar` 内联

If you want to allow the user to select a date from a calendar that is inlined on the page rather
than contained in a popup, you can use `<mat-calendar>` directly. The calendar's height is
determined automatically based on the width and the number of dates that need to be shown for a
month. If you want to make the calendar larger or smaller, adjust the width rather than the height.

如果要让用户从页面内联日历而不是从包含在弹出窗口中的日历中选择日期，可以直接使用 `<mat-calendar>`。日历的高度是根据一个月需要显示的宽度和日期数自动确定的。如果你想让日历更大或更小，请调整宽度而不是高度。

<!-- example(datepicker-inline-calendar) -->

### Internationalization

### 国际化

Internationalization of the datepicker is configured via four aspects:

日期选择器的国际化配置包括四个方面：

1. The date locale.

   日期语言环境。

1. The date implementation that the datepicker accepts.

   日期选择器所能接受的日期对象实现。

1. The display and parse formats used by the datepicker.

   日期选择器所用的显示和解析格式。

1. The message strings used in the datepicker's UI.

   在日期选择器 UI 中使用的各种消息字符串。

#### Setting the locale code

#### 设置区域代码

By default, the `MAT_DATE_LOCALE` injection token will use the existing `LOCALE_ID` locale code
from `@angular/core`. If you want to override it, you can provide a new value for the
`MAT_DATE_LOCALE` token:

默认情况下，依赖注入令牌 `MAT_DATE_LOCALE` 将会使用来自 `@angular/core` 中的 `LOCALE_ID` 表示的区域代码。
如果你要覆盖它，可以为  `MAT_DATE_LOCALE` 令牌提供一个新值：

```ts
@NgModule({
  providers: [
    {provide: MAT_DATE_LOCALE, useValue: 'en-GB'},
  ],
})
export class MyApp {}
```

It's also possible to set the locale at runtime using the `setLocale` method of the `DateAdapter`.

也可以使用 `DateAdapter` 的 `setLocale` 方法在运行时设置语言环境。

**Note:** if you're using the `MatDateFnsModule`, you have to provide the data object for your
locale to `MAT_DATE_LOCALE` instead of the locale code, in addition to providing a configuration
compatible with `date-fns` to `MAT_DATE_FORMATS`. Locale data for `date-fns` can be imported
from `date-fns/locale`.

**注意：**如果你使用的是 `MatDateFnsModule` ，除了向 MAT_DATE_FORMATS 提供与 `date-fns` `MAT_DATE_FORMATS` 兼容的配置外，还必须将你的语言环境的数据对象提供给 `MAT_DATE_LOCALE` 而不是语言环境代码。 `date-fns` 语言环境数据可以从 `date-fns/locale` 导入。

<!-- example(datepicker-locale) -->

#### Choosing a date implementation and date format settings

#### 选择日期的实现和日期格式设置

The datepicker was built to be date implementation agnostic. This means that it can be made to work
with a variety of different date implementations. However it also means that developers need to make
sure to provide the appropriate pieces for the datepicker to work with their chosen implementation.

日期选择器是和日期的具体实现无关的，也就是说它可以和多种不同的日期协同工作。不过，这也意味着开发者要确保为日期选择器提供恰当的实现来支持所选的日期实现。

The easiest way to ensure this is to import one of the provided date modules:

要做到这一点，最简单的方式是导入已提供的日期模块：

`MatNativeDateModule`

<table>
  <tbody>
    <tr>
      <th align="left" scope="row">Date type</th>
      <td><code>Date</code></td>
    </tr>
    <tr>
      <th align="left" scope="row">Supported locales</th>
      <td>en-US</td>
    </tr>
    <tr>
      <th align="left" scope="row">Dependencies</th>
      <td>None</td>
    </tr>
    <tr>
      <th align="left" scope="row">Import from</th>
      <td><code>@angular/material/core</code></td>
    </tr>
  </tbody>
</table>

`MatDateFnsModule` (installed via `@angular/material-date-fns-adapter`)

`MatDateFnsModule` （通过 `@angular/material-date-fns-adapter` 安装）

<table>
  <tbody>
    <tr>
      <th align="left" scope="row">Date type</th>
      <td><code>Date</code></td>
    </tr>
    <tr>
      <th align="left" scope="row">Supported locales</th>
      <td><a href="https://github.com/date-fns/date-fns/tree/master/src/locale/">See project for details</a></td>
    </tr>
    <tr>
      <th align="left" scope="row">Dependencies</th>
      <td><a href="https://date-fns.org/">date-fns</a></td>
    </tr>
    <tr>
      <th align="left" scope="row">Import from</th>
      <td><code>@angular/material-date-fns-adapter</code></td>
    </tr>
  </tbody>
</table>

`MatLuxonDateModule` (installed via `@angular/material-luxon-adapter`)

`MatLuxonDateModule` （通过 `@angular/material-luxon-adapter` 安装）

<table>
  <tbody>
    <tr>
      <th align="left" scope="row">Date type</th>
      <td><code>DateTime</code></td>
    </tr>
    <tr>
      <th align="left" scope="row">Supported locales</th>
      <td><a href="https://moment.github.io/luxon/">See project for details</a></td>
    </tr>
    <tr>
      <th align="left" scope="row">Dependencies</th>
      <td><a href="https://moment.github.io/luxon/">Luxon</a></td>
    </tr>
    <tr>
      <th align="left" scope="row">Import from</th>
      <td><code>@angular/material-luxon-adapter</code></td>
    </tr>
  </tbody>
</table>

`MatMomentDateModule` (installed via `@angular/material-moment-adapter`)

`MatMomentDateModule` （通过 `@angular/material-moment-adapter` 安装）

<table>
  <tbody>
    <tr>
      <th align="left" scope="row">Date type</th>
      <td><code>Moment</code></td>
    </tr>
    <tr>
      <th align="left" scope="row">Supported locales</th>
      <td><a href="https://github.com/moment/moment/tree/develop/src/locale">See project for details</a></td>
    </tr>
    <tr>
      <th align="left" scope="row">Dependencies</th>
      <td><a href="https://momentjs.com/">Moment.js</a></td>
    </tr>
    <tr>
      <th align="left" scope="row">Import from</th>
      <td><code>@angular/material-moment-adapter</code></td>
    </tr>
  </tbody>
</table>

*Please note: `MatNativeDateModule` is based off the functionality available in JavaScript's
native [`Date` object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Date).
Thus it is not suitable for many locales. One of the biggest shortcomings of the native `Date`
object is the inability to set the parse format. We strongly recommend using an adapter based on
a more robust formatting and parsing library. You can use the `MomentDateAdapter`
or a custom `DateAdapter` that works with the library of your choice.*

*注意：`MatNativeDateModule` 基于 JavaScript 的原生 [`Date` 对象](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Date)所提供的功能，因此不适合多语言环境。原生 `Date` 对象最大的缺点是不能设置解析格式。我们强烈建议使用能和你所选的格式化 / 解析库协同使用的 `MomentDateAdapter` 或自定义 `DateAdapter`。*

These modules include providers for `DateAdapter` and `MAT_DATE_FORMATS`.

这些模块包括了 `DateAdapter` 和 `MAT_DATE_FORMATS` 的服务提供者。

```ts
@NgModule({
  imports: [MatDatepickerModule, MatNativeDateModule],
})
export class MyApp {}
```

Because `DateAdapter` is a generic class, `MatDatepicker` and `MatDatepickerInput` also need to be
made generic. When working with these classes (for example as a `ViewChild`) you should include the
appropriate generic type that corresponds to the `DateAdapter` implementation you are using. For
example:

因为 `DateAdapter` 是一个泛型类，所以 `MatDatepicker` 和 `MatDatepickerInput` 也要做成泛型的。
当使用这些类时（比如作为 `ViewChild`），你要包含与所用的 `DateAdapter` 实现相对应的泛型类。
比如：

```ts
@Component({...})
export class MyComponent {
  @ViewChild(MatDatepicker) datepicker: MatDatepicker<Date>;
}
```

<!-- example(datepicker-moment) -->

By default the `MomentDateAdapter` creates dates in your time zone specific locale. You can change the default behaviour to parse dates as UTC by providing the `MAT_MOMENT_DATE_ADAPTER_OPTIONS` and setting it to `useUtc: true`.

默认情况下，`MomentDateAdapter` 会在时区设置中指定的时区上创建日期。
你可以通过提供 `MAT_MOMENT_DATE_ADAPTER_OPTIONS` 并把它设置为 `useUtc: true` 来把默认行为修改为按照 UTC 格式解析日期。

```ts
@NgModule({
  imports: [MatDatepickerModule, MatMomentDateModule],
  providers: [
    {provide: MAT_MOMENT_DATE_ADAPTER_OPTIONS, useValue: {useUtc: true}}
  ]
})
```

By default the `MomentDateAdapter` will parse dates in a
[forgiving way](https://momentjs.com/guides/#/parsing/forgiving-mode/). This may result in dates
being parsed incorrectly. You can change the default behaviour to
[parse dates strictly](https://momentjs.com/guides/#/parsing/strict-mode/) by providing
the `MAT_MOMENT_DATE_ADAPTER_OPTIONS` and setting it to `strict: true`.

默认情况下，`MomentDateAdapter` 会以[宽容方式](https://momentjs.com/guides/#/parsing/forgiving-mode/)解析日期。这可能导致日期被错误解析。你可以通过提供 `MAT_MOMENT_DATE_ADAPTER_OPTIONS` 并把它设置为 `strict: true` 来修改默认行为以便[严格解析日期](https://momentjs.com/guides/#/parsing/strict-mode/)。

```ts
@NgModule({
  imports: [MatDatepickerModule, MatMomentDateModule],
  providers: [
    {provide: MAT_MOMENT_DATE_ADAPTER_OPTIONS, useValue: {strict: true}}
  ]
})
```

It is also possible to create your own `DateAdapter` that works with any date format your app
requires. This is accomplished by subclassing `DateAdapter` and providing your subclass as the
`DateAdapter` implementation. You will also want to make sure that the `MAT_DATE_FORMATS` provided
in your app are formats that can be understood by your date implementation. See
[_Customizing the parse and display formats_](#customizing-the-parse-and-display-formats) for more
information about `MAT_DATE_FORMATS`.

你还可以创建和应用所需的任何日期格式协同工作的自定义 `DateAdapter`。这可以通过创建 `DateAdapter` 的子类并把它作为 `DateAdapter` 的实现来完成。
你还要确保应用中所提供的 `MAT_DATE_FORMATS` 都是你的日期实现所能理解的格式。要了解关于 `MAT_DATE_FORMATS` 的更多信息，参见[*自定义解析和显示格式*](#customizing-the-parse-and-display-formats)。

```ts
@NgModule({
  imports: [MatDatepickerModule],
  providers: [
    {provide: DateAdapter, useClass: MyDateAdapter},
    {provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS},
  ],
})
export class MyApp {}
```

If you need to work with native `Date` objects, but need custom behavior (for example custom date
parsing), you can consider subclassing `NativeDateAdapter`.

如果你需要使用原生 `Date` 对象，但需要自定义行为（例如自定义日期解析），你可以考虑子类 `NativeDateAdapter` 。

#### Customizing the parse and display formats

#### 自定义解析和显示格式

The `MAT_DATE_FORMATS` object is a collection of formats that the datepicker uses when parsing
and displaying dates. These formats are passed through to the `DateAdapter` so you will want to make
sure that the format objects you're using are compatible with the `DateAdapter` used in your app.

`MAT_DATE_FORMATS` 对象是一组日期选择器在解析和显示日期时所能使用的格式。这些格式都会传给 `DateAdapter`，所以你要确保这些格式对象能和应用中所用的 `DateAdapter` 兼容。

If you want use one of the `DateAdapters` that ships with Angular Material, but use your own
`MAT_DATE_FORMATS`, you can import the `NativeDateModule` or `MomentDateModule`. These modules are
identical to the "Mat"-prefixed versions (`MatNativeDateModule` and `MatMomentDateModule`) except
they do not include the default formats. For example:

如果你要使用随 Angular Material 发布的 `DateAdapter` 之一和自己的 `MAT_DATE_FORMATS`，你可以导入 `NativeDateModule` 或 `MomentDateModule`。
这些模块都具有 "Mat" 前缀（`MatNativeDateModule` 和 `MatMomentDateModule`），除非它们不包含默认格式。比如：

```ts
@NgModule({
  imports: [MatDatepickerModule, NativeDateModule],
  providers: [
    {provide: MAT_DATE_FORMATS, useValue: MY_NATIVE_DATE_FORMATS},
  ],
})
export class MyApp {}
```

<!-- example(datepicker-formats) -->

##### MomentDateModule formats

##### MomentDateModule 的格式

To use custom formats with the `MomentDateModule` you can pick from the parse formats documented
[here](https://momentjs.com/docs/#/parsing/string-format/) and the display formats documented
[here](https://momentjs.com/docs/#/displaying/format/).

要使用 `MomentDateModule` 的自定义格式，你可以从[这里](https://momentjs.com/docs/#/parsing/string-format/)的文档中挑选解析格式，在[这里](https://momentjs.com/docs/#/displaying/format/)的文档中挑选显示格式。

It is also possible to support multiple parse formats. For example:

也可以支持多种解析格式。例如：

```ts
@NgModule({
  imports: [MatDatepickerModule, MomentDateModule],
  providers: [
    {
      provide: MAT_DATE_FORMATS,
      useValue: {
        parse: {
          dateInput: ['l', 'LL'],
        },
        display: {
          dateInput: 'L',
          monthYearLabel: 'MMM YYYY',
          dateA11yLabel: 'LL',
          monthYearA11yLabel: 'MMMM YYYY',
        },
      },
    },
  ],
})
export class MyApp {}
```

#### Customizing the calendar header

#### 自定义日历头

The header section of the calendar (the part containing the view switcher and previous and next
buttons) can be replaced with a custom component if desired. This is accomplished using the
`calendarHeaderComponent` property of `<mat-datepicker>`. It takes a component class and constructs
an instance of the component to use as the header.

你可以用自定义组件代替日历的头部（也就是包含视图切换器、向前和向后按钮的地方）。
这可以通过 `<mat-datepicker>` 的 `calendarHeaderComponent` 属性来实现。
它接受一个组件类，并构建一个该组件的实例，将其用作日历头。

In order to interact with the calendar in your custom header component, you can inject the parent
`MatCalendar` in the constructor. To make sure your header stays in sync with the calendar,
subscribe to the `stateChanges` observable of the calendar and mark your header component for change
detection.

要想在自定义的日历头组件中和日历互动，你可以在它的构造函数中注入父 `MatCalendar`。
要确保你的日历头与日历保持同步，请订阅此日历的 `stateChanges` 事件，并把你的日历头组件标记为已更改的。

<!-- example(datepicker-custom-header) -->

#### Localizing labels and messages

#### 本地化各个标签和消息

The various text strings used by the datepicker are provided through `MatDatepickerIntl`.
Localization of these messages can be done by providing a subclass with translated values in your
application root module.

日期选择器中所用的多种文本字符串都可以由 `MatDatepickerIntl` 提供。
这些消息可以通过在应用的根模块中提供一个带有已翻译内容的子类来进行本地化。

```ts
@NgModule({
  imports: [MatDatepickerModule, MatNativeDateModule],
  providers: [
    {provide: MatDatepickerIntl, useClass: MyIntl},
  ],
})
export class MyApp {}
```

#### Highlighting specific dates

#### 突出显示特定日期

If you want to apply one or more CSS classes to some dates in the calendar (e.g. to highlight a
holiday), you can do so with the `dateClass` input. It accepts a function which will be called
with each of the dates in the calendar and will apply any classes that are returned. The return
value can be anything that is accepted by `ngClass`.

如果你想把一个或多个 CSS 类应用到日历中的某些日期（比如突出显示一个假日），你可以使用输入属性 `dateClass`。它接受一个函数，将对日历中的每个日期调用该函数，并应用其返回的任何类。返回值可以是 `ngClass` 接受的任何值。

<!-- example(datepicker-date-class) -->

### Accessibility

### 无障碍性

The `MatDatepicker` pop-up uses the `role="dialog"` interaction pattern. This dialog then contains
multiple controls, the most prominent being the calendar itself. This calendar implements the
`role="grid"` interaction pattern.

`MatDatepicker` 弹出窗口使用 `role="dialog"` 交互模式。该对话框包含多个控件，最突出的是日历本身。这个日历实现了 `role="grid"` 交互模式。

Always enable [_confirmation action buttons_](#confirmation-action-buttons). This allows assistive
technology users to explicitly confirm their selection before committing a value.

总是启用[*确认操作按钮*](#confirmation-action-buttons)。这允许使用辅助技术的用户在提交值之前明确确认他们的选择。

The `MatDatepickerInput` and `MatDatepickerToggle` directives both apply the `aria-haspopup`
attribute to the native input and button elements, respectively.

`MatDatepickerInput` 和 `MatDatepickerToggle` 会给原生输入框和开关按钮分别加上 `aria-haspopup` 属性，而它们触发的日历弹出框则会带有 `role="dialog"` 属性。

`MatDatepickerIntl` includes strings that are used for `aria-label` attributes. Always provide
the datepicker text input a meaningful label via `<mat-label>`, `aria-label`, `aria-labelledby` or
`MatDatepickerIntl`.

`MatDatepickerIntl` 包含一些要用作 `aria-label` 的字符串。日期选择器的输入框应该具有一个占位符或通过
`aria-label`、`aria-labelledby` 或 `MatDatepickerIntl` 提供一个有意义的标签。

Always communicate the date format (e.g. 'MM/DD/YYYY'). This can be accomplished using `<mat-hint>`
or by providing an additional label adjacent to the form field.

总是传达日期格式（例如“MM/DD/YYYY”）。这可以使用 `<mat-hint>` 或通过在表单字段附近提供额外标签来完成。

`MatDatepickerInput` adds <kbd>>Alt</kbd> + <kbd>Down Arrow</kbd> as a keyboard short to open the
datepicker pop-up. However, ChromeOS intercepts this key combination at the OS level such that the
browser only receives a `PageDown` key event. Because of this behavior, you should always include an
additional means of opening the pop-up, such as `MatDatepickerToggle`.

`MatDatepickerInput` 会添加 <kbd>Alt</kbd> + <kbd>Down Arrow</kbd> 作为键盘快捷键以打开日期选择器弹出窗口。但是，ChromeOS 在操作系统层面拦截了这个组合键，使得浏览器只能接收一个 `PageDown` 键盘事件。由于这种行为，你应该总是提供其他打开弹出窗口的方法，例如 `MatDatepickerToggle` 。

#### Keyboard interaction

#### 键盘快捷键

The datepicker supports the following keyboard shortcuts:

日期选择器支持下列键盘快捷键：

| Keyboard Shortcut                      | Action                    |
| -------------------------------------- | ------------------------- |
| 快捷键                                 | 操作                      |
| <kbd>Alt</kbd> + <kbd>Down Arrow</kbd> | Open the calendar pop-up  |
| <kbd>Alt</kbd>+ <kbd>Down Arrow</kbd>  | 打开日历弹出框            |
| <kbd>Escape</kbd>                      | Close the calendar pop-up |
| `ESCAPE`                               | 关闭日历弹出框            |

In month view:

在月份视图中：

| Shortcut                             | Action                                   |
| ------------------------------------ | ---------------------------------------- |
| 快捷键                               | 操作                                     |
| <kbd>Left Arrow</kbd>                | Go to previous day                       |
| <kbd>Left Arrow</kbd>                | 转到上一天                               |
| <kbd>Right Arrow</kbd>               | Go to next day                           |
| <kbd>Right Arrow</kbd>               | 转到下一天                               |
| <kbd>Up Arrow</kbd>                  | Go to same day in the previous week      |
| <kbd>Up Arrow</kbd>                  | 转到上周的同一天                         |
| <kbd>Down Arrow</kbd>                | Go to same day in the next week          |
| <kbd>Down Arrow</kbd>                | 转到下周的同一天                         |
| <kbd>Home</kbd>                      | Go to the first day of the month         |
| <kbd>Home</kbd>                      | 转到本月初                               |
| <kbd>End</kbd>                       | Go to the last day of the month          |
| <kbd>End</kbd>                       | 转到本月末                               |
| <kbd>Page Up</kbd>                   | Go to the same day in the previous month |
| <kbd>Page Up</kbd>                   | 转到上月的同一天                         |
| <kbd>Alt</kbd> + <kbd>Page Up</kbd>  | Go to the same day in the previous year  |
| <kbd>Alt</kbd>+ <kbd>Page Up</kbd>   | 转到去年的同一天                         |
| <kbd>Page Down</kbd>                 | Go to the same day in the next month     |
| <kbd>Page Down</kbd>                 | 转到下月的同一天                         |
| <kbd>Alt</kbd>+ <kbd>Page Down</kbd> | Go to the same day in the next year      |
| <kbd>Alt</kbd>+ <kbd>Page Down</kbd> | 转到明年的同一天                         |
| <kbd>Enter</kbd>                     | Select current date                      |
| <kbd>Enter</kbd>                     | 选择当前日期                             |

In year view:

在年份视图中：

| Shortcut                             | Action                                    |
| ------------------------------------ | ----------------------------------------- |
| 快捷键                               | 操作                                      |
| <kbd>Left Arrow</kbd>                | Go to previous month                      |
| <kbd>Left Arrow</kbd>                | 转到上月                                  |
| <kbd>Right Arrow</kbd>               | Go to next month                          |
| <kbd>Right Arrow</kbd>               | 转到下月                                  |
| <kbd>Up Arrow</kbd>                  | Go up a row (back 4 months)               |
| <kbd>Up Arrow</kbd>                  | 转到上一行（回退四个月）                  |
| <kbd>Down Arrow</kbd>                | Go down a row (forward 4 months)          |
| <kbd>Down Arrow</kbd>                | 转到下一行（前进四个月）                  |
| <kbd>Home</kbd>                      | Go to the first month of the year         |
| <kbd>Home</kbd>                      | 转到今年的第一个月                        |
| <kbd>End</kbd>                       | Go to the last month of the year          |
| <kbd>End</kbd>                       | 转到今年的最后一月                        |
| <kbd>Page Up</kbd>                   | Go to the same month in the previous year |
| <kbd>Page Up</kbd>                   | 转到去年的同一月                          |
| <kbd>Alt</kbd> + <kbd>Page Up</kbd>  | Go to the same month 10 years back        |
| <kbd>Alt</kbd>+ <kbd>Page Up</kbd>   | 转到十年前的同一月                        |
| <kbd>Page Down</kbd>                 | Go to the same month in the next year     |
| <kbd>Page Down</kbd>                 | 转到明年的同一月                          |
| <kbd>Alt</kbd>+ <kbd>Page Down</kbd> | Go to the same month 10 years forward     |
| <kbd>Alt</kbd>+ <kbd>Page Down</kbd> | 转到十年后的同一月                        |
| <kbd>Enter</kbd>                     | Select current month                      |
| <kbd>Enter</kbd>                     | 选择当前月份                              |

In multi-year view:

在多年视图中：

| Shortcut                             | Action                                    |
| ------------------------------------ | ----------------------------------------- |
| 快捷键                               | 操作                                      |
| <kbd>Left Arrow</kbd>                | Go to previous year                       |
| <kbd>Left Arrow</kbd>                | 转到去年                                  |
| <kbd>Right Arrow</kbd>               | Go to next year                           |
| <kbd>Right Arrow</kbd>               | 转到明年                                  |
| <kbd>Up Arrow</kbd>                  | Go up a row (back 4 years)                |
| <kbd>Up Arrow</kbd>                  | 转到上一行（后退四年）                    |
| <kbd>Down Arrow</kbd>                | Go down a row (forward 4 years)           |
| <kbd>Down Arrow</kbd>                | 转到下一行（前进四年）                    |
| <kbd>Home</kbd>                      | Go to the first year in the current range |
| <kbd>Home</kbd>                      | 转到当前范围内的第一年                    |
| <kbd>End</kbd>                       | Go to the last year in the current range  |
| <kbd>End</kbd>                       | 转到当前范围内的最后一年                  |
| <kbd>Page Up</kbd>                   | Go back 24 years                          |
| <kbd>Page Up</kbd>                   | 后退 24 年                                |
| <kbd>Alt</kbd> + <kbd>Page Up</kbd>  | Go back 240 years                         |
| <kbd>Alt</kbd>+ <kbd>Page Up</kbd>   | 后退 240 年                               |
| <kbd>Page Down</kbd>                 | Go forward 24 years                       |
| <kbd>Page Down</kbd>                 | 前进 24 年                                |
| <kbd>Alt</kbd>+ <kbd>Page Down</kbd> | Go forward 240 years                      |
| <kbd>Alt</kbd>+ <kbd>Page Down</kbd> | 前进 240 年                               |
| <kbd>Enter</kbd>                     | Select current year                       |
| <kbd>Enter</kbd>                     | 选择当前年份                              |

### Troubleshooting

### 排查问题

#### Error: MatDatepicker: No provider found for DateAdapter/MAT_DATE_FORMATS

#### Error: MatDatepicker: No provider found for DateAdapter/MAT_DATE_FORMATS <br>（未找到 DateAdapter/MAT_DATE_FORMATS 的提供者）

This error is thrown if you have not provided all of the injectables the datepicker needs to work.
The easiest way to resolve this is to import the `MatNativeDateModule` or `MatMomentDateModule` in
your application's root module. See
[_Choosing a date implementation_](#choosing-a-date-implementation-and-date-format-settings)) for
more information.

如果你没有提供日期选择器所需的全部可注入对象，就会抛出本错误。
最简单的解决方式是在应用的根模块中导入 `MatNativeDateModule` 或 `MatMomentDateModule` 模块。欲知详情，参见[选择日期的一个实现](#choosing-a-date-implementation-and-date-format-settings)。

#### Error: A MatDatepicker can only be associated with a single input

#### Error: A MatDatepicker can only be associated with a single input <br>（一个 MatDatepicker 只能关联一个输入框）

This error is thrown if more than one `<input>` tries to claim ownership over the same
`<mat-datepicker>` (via the `matDatepicker` attribute on the input). A datepicker can only be
associated with a single input.

如果多个 `<input>` 视图（通过 `matDatepicker` 属性）获取同一个 `<mat-datepicker>` 的所有权，就会抛出本错误。
一个日期选择器只能和一个输入框相关联。

#### Error: Attempted to open an MatDatepicker with no associated input.

#### Error: Attempted to open an MatDatepicker with no associated input. <br>（试图打开一个没有关联到输入框的 MatDatepicker）

This error occurs if your `<mat-datepicker>` is not associated with any `<input>`. To associate an
input with your datepicker, create a template reference for the datepicker and assign it to the
`matDatepicker` attribute on the input:

如果没有给 `<mat-datepicker>` 关联任何 `<input>`，就会发生本错误。
要想把一个输入框和日期选择器关联起来，请创建一个到该日期选择器的模板引用，并把它赋值给输入框上的 `matDatepicker` 属性：

```html
<input [matDatepicker]="picker">
<mat-datepicker #picker></mat-datepicker>
```
