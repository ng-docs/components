The autocomplete is a normal text input enhanced by a panel of suggested options.

自动完成器（autocomplete）通过显示一个建议选项面板，来对标准文本框进行增强

### Simple autocomplete

### 简单的自动完成器

Start by creating the autocomplete panel and the options displayed inside it. Each option should be
defined by a `mat-option` tag. Set each option's value property to whatever you'd like the value
of the text input to be when that option is selected.

首先，创建自动完成面板，并在其中显示选项。每个选项都应该用 `mat-option` 标签来定义。把每个选项的 value 属性设置为你希望选择该选项时输入的文本值的值。

<!-- example({"example":"autocomplete-simple",
              "file":"autocomplete-simple-example.html",
              "region":"mat-autocomplete"}) -->

Next, create the input and set the `matAutocomplete` input to refer to the template reference we assigned
to the autocomplete. Let's assume you're using the `formControl` directive from `ReactiveFormsModule` to
track the value of the input.

接下来，创建输入框并设置 `matAutocomplete` 输入属性以引用我们赋值给此自动完成器的模板引用。我们假设你使用 `ReactiveFormsModule` 中的 `formControl` 指令来跟踪输入框的值。

> Note: It is possible to use template-driven forms instead, if you prefer. We use reactive forms
> in this example because it makes subscribing to changes in the input's value easy. For this
> example, be sure to import `ReactiveFormsModule` from `@angular/forms` into your `NgModule`.
> If you are unfamiliar with using reactive forms, you can read more about the subject in the
> [Angular documentation](https://angular.io/guide/reactive-forms).
>
> 注意：如果你愿意，也可以用模板驱动表单代替。我们在这个例子中使用响应式表单，是因为这样比较容易订阅输入值的变化。在这个例子中，要确保你的 `NgModule` 从 `@angular/forms` 中导入了 `ReactiveFormsModule`。
> 如果你对使用响应式表单还不熟，可以阅读 [Angular 官方文档](https://angular.cn/guide/reactive-forms) 中的相关主题。

Now we'll need to link the text input to its panel. We can do this by exporting the autocomplete
panel instance into a local template variable (here we called it "auto"), and binding that variable
to the input's `matAutocomplete` property.

现在，我们需要把这个输入框和它的面板联系起来。我们可以把这个自动完成面板的实例导出给一个局部模板变量（这里叫它 "auto"），然后把这个变量绑定到输入框的 `matAutocomplete` 属性上。

<!-- example({"example":"autocomplete-simple",
              "file":"autocomplete-simple-example.html",
              "region":"input"}) -->

### Adding a custom filter

### 添加自定义过滤器

At this point, the autocomplete panel should be toggleable on focus and options should be
selectable. But if we want our options to filter when we type, we need to add a custom filter.

此刻，自动完成面板应该能根据焦点状态进行切换了，而候选项也是可供选择的。但如果我们希望这些选项能在输入时进行过滤，就要添加一个自定义过滤器。

You can filter the options in any way you like based on the text input\*. Here we will perform a
simple string test on the option value to see if it matches the input value, starting from the
option's first letter. We already have access to the built-in `valueChanges` Observable on the
`FormControl`, so we can simply map the text input's values to the suggested options by passing
them through this filter. The resulting Observable, `filteredOptions`, can be added to the
template in place of the `options` property using the `async` pipe.

可以用任何你喜欢的方式根据已输入的文本对候选项进行过滤。
这里我们对候选项的值执行一个简单的字符串测试，看它是否匹配已输入的值，从候选项的首字母开始。
我们已经能访问该 `FormControl` 的 `valueChanges` 这个 `Observable` 了，所以我们可以通过把它们传给过滤器来找出所建议的选项。
其结果 `filteredOptions` 可以使用 `async` 管道绑定到模板的 `options` 属性中。

Below we are also priming our value change stream with an empty string so that the options are
filtered by that value on init (before there are any value changes).

接下来还要我们往 `valueChanges` 中添加一个空字符串，以便在值初始化后（做任何修改之前）就对选项进行一次过滤。

\*For optimal accessibility, you may want to consider adding text guidance on the page to explain
filter criteria. This is especially helpful for screenreader users if you're using a non-standard
filter that doesn't limit matches to the beginning of the string.

为了获得最佳的无障碍性，你可能还要往该页添加一些文本指南来解释过滤条件。
特别是，如果你使用了非标准过滤器，并且不单从字符串的开头儿进行匹配，那么它将对使用屏幕阅读器的用户有很大帮助。

<!-- example(autocomplete-filter) -->

### Setting separate control and display values

### 分别设置控件值和显示内容

If you want the option's control value (what is saved in the form) to be different than the option's
display value (what is displayed in the text field), you'll need to set the `displayWith`
property on your autocomplete element. A common use case for this might be if you want to save your
data as an object, but display just one of the option's string properties.

如果你希望把选项的控件值（它将保存在表单中）设置得和它的显示值（它将显示在文本框中）不同，那么你就要在你的自动完成元素上设置 `displayWith` 属性。
一种常见的用法是你希望把数据存为对象，却只想显示该选项的某个字符串型属性。

To make this work, create a function on your component class that maps the control value to the
desired display value. Then bind it to the autocomplete's `displayWith` property.

要做到这一点，请在你的组件类上创建一个用于把控件值映射为其显示值的函数。然后把该函数绑定到自动完成器的 `displayWith` 属性上。

<!-- example(autocomplete-display) -->

### Require an option to be selected

### 需要选中一个选项

By default, the autocomplete will accept the value that the user typed into the input field.
Instead, if you want to instead ensure that an option from the autocomplete was selected, you can
enable the `requireSelection` input on `mat-autocomplete`. This will change the behavior of
the autocomplete in the following ways:

默认情况下，自动完成器将接受用户在输入字段中输入的值。但如果你想确保选中自动完成器的选项之一，则可以在 `mat-autocomplete` 上启用 `requireSelection` 输入属性。 这将通过以下方式改变自动完成器的行为：

1. If the user opens the autocomplete, changes its value, but doesn't select anything, the
autocomplete value will be reset back to `null`.

    如果用户打开自动完成器，更改其值，但未选中任何内容，则自动完成器的值将重置回 `null` 。

2. If the user opens and closes the autocomplete without changing the value, the old value will
be preserved.

    如果用户打开并关闭自动完成器而不更改它的值，则将保留旧值。

This behavior can be configured globally using the `MAT_AUTOCOMPLETE_DEFAULT_OPTIONS`
injection token.

可以使用 `MAT_AUTOCOMPLETE_DEFAULT_OPTIONS` 注入令牌来全局配置此行为。

<!-- example(autocomplete-require-selection) -->

### Automatically highlighting the first option

### 自动高亮第一个候选项

If your use case requires for the first autocomplete option to be highlighted when the user opens
the panel, you can do so by setting the `autoActiveFirstOption` input on the `mat-autocomplete`
component. This behavior can be configured globally using the `MAT_AUTOCOMPLETE_DEFAULT_OPTIONS`
injection token.

如果你希望当用户打开自动完成面板时自动高亮第一个选项，可以设置 `mat-autocomplete` 组件的输入属性 `autoActiveFirstOption`。该行为可以通过依赖注入令牌 `MAT_AUTOCOMPLETE_DEFAULT_OPTIONS` 进行全局配置。

<!-- example(autocomplete-auto-active-first-option) -->

### Autocomplete on a custom input element

### 在自定义输入框元素上使用自动完成器

While `mat-autocomplete` supports attaching itself to a `mat-form-field`, you can also set it on
any other `input` element using the `matAutocomplete` attribute. This allows you to customize what
the input looks like without having to bring in the extra functionality from `mat-form-field`.

`mat-autocomplete` 支持把自己附着到 `mat-form-field` 上，你也可以使用 `matAutocomplete` 来把它设置到任何 `input` 元素上。这样你就可以自定义输入框的样子，而无需从 `mat-form-field` 引入额外的功能。

<!-- example(autocomplete-plain-input) -->

### Attaching the autocomplete panel to a different element

### 把自动完成面板附着到另一个元素上

By default the autocomplete panel will be attached to your input element, however in some cases you
may want it to attach to a different container element. You can change the element that the
autocomplete is attached to using the `matAutocompleteOrigin` directive together with the
`matAutocompleteConnectedTo` input:

默认情况下，自动完成面板将会附着在你的输入控件上，不过，有时候你可能希望把它附着到另一个容器元素上。
你可以使用 `matAutocompleteOrigin` 和 `matAutocompleteConnectedTo` 指令来修改它要附着的元素：

```html
<div class="custom-wrapper-example" matAutocompleteOrigin #origin="matAutocompleteOrigin">
  <input
    matInput
    [formControl]="myControl"
    [matAutocomplete]="auto"
    [matAutocompleteConnectedTo]="origin">
</div>

<mat-autocomplete #auto="matAutocomplete">
  <mat-option *ngFor="let option of options" [value]="option">{{option}}</mat-option>
</mat-autocomplete>
```

### Keyboard interaction

### 键盘交互

| Keyboard shortcut                      | Action                                                         |
| -------------------------------------- | -------------------------------------------------------------- |
| 快捷键                                 | 操作                                                           |
| <kbd>Down Arrow</kbd>                  | Navigate to the next option.                                   |
| <kbd>Down Arrow</kbd>                  | 导航到下一个选项。                                             |
| <kbd>Up Arrow</kbd>                    | Navigate to the previous option.                               |
| <kbd>Up Arrow</kbd>                    | 导航到上一个选项。                                             |
| <kbd>Enter</kbd>                       | Select the active option.                                      |
| <kbd>Enter</kbd>                       | 选择活动选项。                                                 |
| <kbd>Escape</kbd>                      | Close the autocomplete panel.                                  |
| <kbd>Escape</kbd>                      | 关闭自动完成面板。                                             |
| <kbd>Alt</kbd> + <kbd>Up Arrow</kbd>   | Close the autocomplete panel.                                  |
| <kbd>Alt</kbd> + <kbd>Up Arrow</kbd>   | 关闭自动完成面板。                                             |
| <kbd>Alt</kbd> + <kbd>Down Arrow</kbd> | Open the autocomplete panel if there are any matching options. |
| <kbd>Alt</kbd> + <kbd>Down Arrow</kbd> | 如果有任何匹配的选项，就打开自动完成面板。                     |

  <kbd>ESCAPE</kbd>: 关闭自动完成面板

### Option groups

### 选项组

`mat-option` can be collected into groups using the `mat-optgroup` element:

可以使用 `mat-optgroup` 元素对 `mat-option` 进行分组：

<!-- example({"example":"autocomplete-optgroup",
              "file":"autocomplete-optgroup-example.html",
              "region":"mat-autocomplete"}) -->

### Accessibility

### 无障碍性

`MatAutocomplete` implements the ARIA combobox interaction pattern. The text input trigger specifies
`role="combobox"` while the content of the pop-up applies `role="listbox"`. Because of this listbox
pattern, you should _not_ put other interactive controls, such as buttons or checkboxes, inside
an autocomplete option. Nesting interactive controls like this interferes with most assistive
technology.

`MatAutocomplete` 实现了 ARIA 组合框交互模式。为文本输入触发器指定 `role="combobox"` 而为弹出窗口的内容应用 `role="listbox"`。由于这种列表框模式，你*不应*将其他交互式控件（例如按钮或复选框）放入自动完成选项中。像这样嵌套交互式控件会干扰大多数辅助技术。

Always provide an accessible label for the autocomplete. This can be done by using a
`<mat-label>` inside of `<mat-form-field>`, a native `<label>` element, the `aria-label`
attribute, or the `aria-labelledby` attribute.

始终为自动完成提供无障碍标签。这可以通过在 `<mat-form-field>` 内部使用 `<mat-label>`、原生 `<label>` 元素、`aria-label` 属性或 `aria-labelledby` 属性来完成。

`MatAutocomplete` preserves focus on the text trigger, using `aria-activedescendant` to support
navigation though the autocomplete options.

`MatAutocomplete` 会保留对文本触发器的焦点，使用 `aria-activedescendant` 可以支持通过自动完成选项进行导航。

By default, `MatAutocomplete` displays a checkmark to identify the selected item. While you can hide
the checkmark indicator via `hideSingleSelectionIndicator`, this makes the component less accessible
by making it harder or impossible for users to visually identify selected items.

默认情况下， `MatAutocomplete` 会显示一个选中标记来标识所选条目。 虽然你也可以通过 `hideSingleSelectionIndicator` 来隐藏单选时的选中标记指示器，但这会使用户更难甚至不可能直观地识别已选条目，从而降低组件的无障碍性。
