`<mat-select>` is a form control for selecting a value from a set of options, similar to the native
`<select>` element. You can read more about selects in the
[Material Design spec](https://material.io/design/components/menus.html). It is designed to work
inside of a [`<mat-form-field>`](https://material.angular.io/components/form-field/overview)
element.

`<mat-select>` 是一个表单控件，像原生的 `<select>` 元素一样，它用于从一组选项中选取一个值。
你可以阅读 [Material Design 规范](https://material.io/design/components/menus.html)了解更多信息。
它被设计成在 [`<mat-form-field>`](/components/form-field/overview) 元素内部使用的。

To add options to the select, add `<mat-option>` elements to the `<mat-select>`. Each `<mat-option>`
has a `value` property that can be used to set the value that will be selected if the user chooses
this option. The content of the `<mat-option>` is what will be shown to the user.

要想往选择框中添加选项，请为 `<mat-select>` 添加 `<mat-option>` 元素。每个 `<mat-option>` 都有一个 `value` 属性，用于给出当用户选择了该选项时的结果值，而 `<mat-option>` 的内容则会显示给用户。

Angular Material also supports use of the native `<select>` element inside of
`<mat-form-field>`. The native control has several performance, accessibility,
and usability advantages. See [the documentation for
form-field](https://material.angular.io/components/form-field) for more information.

Angular Material 还支持在 `<mat-form-field>` 中使用原生的 `<select>` 元素。
这种原生控件在性能、无障碍性、可用性等方面具有一系列优点。参见 [form-field 的文档](https://material.angular.cn/components/form-field)以了解详情。

To use a native select inside `<mat-form-field>`, import `MatInputModule` and add the
`matNativeControl` attribute to the `<select>` element. 

要在 `<mat-form-field>` 中使用原生 select，请为 `<select>` 元素添加 `matNativeControl` 属性。

<!-- example(select-overview) -->

### Getting and setting the select value

### 获取与设置选择框的值

The `<mat-select>` supports 2-way binding to the `value` property without the need for Angular
forms.

`<mat-select>` 支持对 `value` 属性进行双向绑定，而不需要借助 Angular 的表单支持。

<!-- example(select-value-binding) -->

Both`<mat-select>` and `<select>` support all of the form directives from the core `FormsModule` (`NgModel`) and
`ReactiveFormsModule` (`FormControl`, `FormGroup`, etc.) As with native `<select>`, `<mat-select>`
also supports a `compareWith` function. (Additional information about using a custom `compareWith`
function can be found in the
[Angular forms documentation](https://angular.io/api/forms/SelectControlValueAccessor#caveat-option-selection)).

`<mat-select>` 也支持所有的表单指令，包括来自 `FormsModule` 的 `NgModel` 和来自 `ReactiveFormsModule` 的 `FormControl`、`FormGroup` 等。像原生的 `<select>` 一样，`<mat-select>` 也支持 `compareWith` 函数。（要了解自定义 `compareWith` 的方法，参见 [Angular 表单文档](https://angular.cn/api/forms/SelectControlValueAccessor#caveat-option-selection)。）

<!-- example(select-form) -->

### Form field features

### 表单字段的特性

There are a number of `<mat-form-field>` features that can be used with both `<select>` and `<mat-select>`. These
include error messages, hint text, prefix & suffix, and theming. For additional information about
these features, see the
[form field documentation](https://material.angular.io/components/form-field/overview).

`<mat-form-field>` 的几个特性可以和任何 `<mat-select>` 一起使用。包括：错误信息、提示信息、前缀与后缀、主题。
欲知详情，参见[表单字段的文档](/components/form-field/overview)。

<!-- example(select-hint-error) -->

### Setting a static placeholder

### 设置静态占位符

The placeholder is text shown when the `<mat-form-field>` label is floating but the `<mat-select>`
is empty. It is used to give the user an additional hint about the value they should select. The
placeholder can be specified by setting the `placeholder` attribute on the `<mat-select>` element.
In some cases that `<mat-form-field>` may use the placeholder as the label (see the
[form field label documentation](https://material.angular.io/components/form-field/overview#floating-label)).

占位符是指当 `<mat-form-field>` 浮起，但 `<mat-select>` 为空时显示的文本。
它可以给用户提供一些关于如何进行选择的附加信息。
占位符可以通过 `<mat-select>` 元素上的 `placeholder` 属性来指定。
有些情况下，`<mat-form-field>` 可以把占位符用作标签（参见[表单字段文档](/components/form-field/overview#floating-label)）。

### Disabling the select or individual options

### 禁用选择框或其中的某个选项

It is possible to disable the entire select or individual options in the select by using the
disabled property on the `<select>` or `<mat-select>` and the `<option>` or `<mat-option>` elements respectively.

可以通过 `<mat-select>` 上的 `disabled` 属性禁用整个选择框，或通过 `<mat-option>` 上的 `disabled` 属性单独禁用某一个选项。

<!-- example(select-disabled) -->

### Resetting the select value

### 重置选择框的值

If you want one of your options to reset the select's value, you can omit specifying its value.

如果你希望用某个选项重置选择框的值，那么可以省略它的值。

<!-- example(select-reset) -->

### Creating groups of options

### 创建选项组

The `<mat-optgroup>` element can be used to group common options under a subheading. The name of the
group can be set using the `label` property of `<mat-optgroup>`. Like individual `<mat-option>`
elements, an entire `<mat-optgroup>` can be disabled or enabled by setting the `disabled` property
on the group.

`<mat-optgroup>` 元素可以用来把一些选项分组到子标题下。组的名字可以用 `<mat-optgroup>` 的 `label` 来指定。
像 `<mat-option>` 元素一样，`<mat-optgroup>` 也能通过设置组的 `disabled` 属性来禁用或启用。

<!-- example(select-optgroup) -->

### Multiple selection

### 多选

`<mat-select>` defaults to single-selection mode, but can be configured to allow multiple selection
by setting the `multiple` property. This will allow the user to select multiple values at once. When
using the `<mat-select>` in multiple selection mode, its value will be a sorted list of all selected
values rather than a single value.

`<mat-select>` 默认为单选模式，但是可以通过 `multiple` 属性配置成允许多选的，这样用户就可以同时选择多个值了。
当在多选模式下使用 `<mat-select>` 时，它的值将会是所有选定值的有序列表，而不再是单个值。

Using multiple selection with a native select element (`<select multiple>`) is discouraged
inside `<mat-form-field>`, as the inline listbox appearance is inconsistent with other
Material Design components.

不鼓励在 `<mat-form-field>` 中使用原生选择框（`<select multiple>`）来实现多选功能，因为内联的多项选择框在外观上会与其它 Material 组件不一致。

<!-- example(select-multiple) -->

### Customizing the trigger label

### 定制触发器标签

If you want to display a custom trigger label inside a `<mat-select>`, you can use the
`<mat-select-trigger>` element.

如果你想在选择框内部显示一个自定义的触发器标签，可以使用 `<mat-select-trigger>` 元素。

<!-- example(select-custom-trigger) -->

### Disabling the ripple effect

### 禁用涟漪效果

By default, when a user clicks on a `<mat-option>`, a ripple animation is shown. This can be disabled
by setting the `disableRipple` property on `<mat-select>`.

默认情况下，当用户点击某个 `<mat-option>` 时，就会显示一个涟漪动画。可以通过设置 `<mat-select>` 上的 `disableRipple` 属性来禁用它。

<!-- example(select-no-ripple) -->

### Adding custom styles to the dropdown panel

### 为下拉面板添加自定义样式

In order to facilitate easily styling the dropdown panel, `<mat-select>` has a `panelClass` property
which can be used to apply additional CSS classes to the dropdown panel.

为了便于给下拉面板指定样式，`<mat-select>` 有一个 `panelClass` 属性，可用于为下拉面板指定自定义 CSS 类。

<!-- example(select-panel-class) -->

### Changing when error messages are shown

### 更改错误信息的显示时机

The `<mat-form-field>` allows you to
[associate error messages](https://material.angular.io/components/form-field/overview#error-messages)
with your `<select>` or `<mat-select>`. By default, these error messages are shown when the control is invalid and
either the user has interacted with (touched) the element or the parent form has been submitted. If
you wish to override this behavior (e.g. to show the error as soon as the invalid control is dirty
or when a parent form group is invalid), you can use the `errorStateMatcher` property of the
`<mat-select>`. The property takes an instance of an `ErrorStateMatcher` object. An
`ErrorStateMatcher` must implement a single method `isErrorState` which takes the `FormControl` for
this `<mat-select>` as well as the parent form and returns a boolean indicating whether errors
should be shown. (`true` indicating that they should be shown, and `false` indicating that they
should not.)

`<mat-form-field>` 让你能把[错误信息](/components/form-field/overview#error-messages)和你的 `<mat-select>` 关联起来。
默认情况下，当该控件无效并且用户已经跟它交互过（碰过 touched）或者提交过父表单时才会显示这些错误信息。
如果你要覆盖这种行为（比如当无效控件或父表单组变脏时想尽快显示错误信息），可以使用 `<mat-select>` 的 `errorStateMatcher` 属性。
该属性接收一个 `ErrorStateMatcher` 对象的实例。`ErrorStateMatcher` 必须实现一个 `isErrorState` 方法，它接受该 `<mat-select>` 或其父表单的 `FormControl`，并返回一个 `boolean` 值，以指出是否应该显示错误信息。（`true` 表示应该显示，`false` 表示不该。）

<!-- example(select-error-state-matcher) -->

A global error state matcher can be specified by setting the `ErrorStateMatcher` provider. This
applies to all inputs. For convenience, `ShowOnDirtyErrorStateMatcher` is available in order to
globally cause input errors to show when the input is dirty and invalid.

全局的错误状态匹配器可以通过 `ErrorStateMatcher` 提供者来指定。它将作用于所有输入框。
为方便起见，可以使用 `ShowOnDirtyErrorStateMatcher` 作为全局配置，来要求只有当输入框是脏（dirty）且无效（invalid）时才显示错误信息。

```ts
@NgModule({
  providers: [
    {provide: ErrorStateMatcher, useClass: ShowOnDirtyErrorStateMatcher}
  ]
})
```

### Keyboard interaction

### 键盘交互

| Keyboard shortcut                      | Action                                                                |
|----------------------------------------|-----------------------------------------------------------------------|
| 键盘快捷键                                  | 操作                                                                    |
| <kbd>Down Arrow</kbd>                  | Navigate to the next option.                                          |
| <kbd>Down Arrow</kbd>                  | 导航到下一个选项。                                                             |
| <kbd>Up Arrow</kbd>                    | Navigate to the previous option.                                      |
| <kbd>Up Arrow</kbd>                    | 导航到上一个选项。                                                             |
| <kbd>Enter</kbd>                       | If closed, open the select panel. If open, selects the active option. |
| <kbd>Enter</kbd>                       | 如果关闭，请打开选择面板。如果打开，则选择活动选项。                                            |
| <kbd>Escape</kbd>                      | Close the select panel.                                               |
| <kbd>Escape</kbd>                      | 关闭选择面板。                                                               |
| <kbd>Alt</kbd> + <kbd>Up Arrow</kbd>   | Close the select panel.                                               |
| <kbd>Alt</kbd> + <kbd>Up Arrow</kbd>   | 关闭选择面板。                                                               |
| <kbd>Alt</kbd> + <kbd>Down Arrow</kbd> | Open the select panel if there are any matching options.              |
| <kbd>Alt</kbd> + <kbd>Down Arrow</kbd> | 如果有任何匹配的选项，请打开选择面板。                                                   |

### Accessibility

### 无障碍性

When possible, prefer a native `<select>` element over `MatSelect`. The native control
provides the most accessible experience across the widest range of platforms.

如果可能，更推荐使用原生 `<select>` 元素而不是 `MatSelect` 。原生控件能在最广泛的平台上提供无障碍体验。

`MatSelect` implements the combobox pattern detailed in the [1.2 version of the ARIA
specification](https://www.w3.org/TR/wai-aria-1.2). The combobox trigger controls a `role="listbox"`
element opened in a pop-up. Previous versions of the ARIA specification
required that `role="combobox"` apply to a text input control, but the 1.2 version of the
specification supports a wider variety of interaction patterns. This newer usage of ARIA works
in all browser and screen-reader combinations supported by Angular Material.

`MatSelect` 实现了 [ARIA 规范 1.2 版](https://www.w3.org/TR/wai-aria-1.2)中详述的组合框模式。组合框触发器会控制在弹出窗口中打开的 `role="listbox"` 元素。以前版本的 ARIA 规范要求 `role="combobox"` 应用于文本输入控件，但规范的 1.2 版本支持更广泛的交互模式。 ARIA 的这种新用法适用于 Angular Material 支持的所有浏览器和屏幕阅读器组合。

Because the pop-up uses the `role="listbox"` pattern, you should _not_ put other interactive
controls, such as buttons or checkboxes, inside a select option. Nesting interactive controls like
this interferes with most assistive technology.

由于弹出窗口使用 `role="listbox"` 模式，因此*不应*将其他交互控件（例如按钮或复选框）放入选择选项中。如果这样嵌套可交互控件会干扰大多数辅助技术。

Always provide an accessible label for the select. This can be done by adding a `<mat-label>`
inside of `<mat-form-field>`, the `aria-label` attribute, or the `aria-labelledby` attribute.

始终要为选择框提供一个无障碍标签。这可以通过在 `<mat-form-field>` 中添加一个 `<mat-label>` 组件或 `aria-label`、`aria-labelledby` 属性来实现。

### Troubleshooting

### 排查问题

#### Error: Cannot change `multiple` mode of select after initialization

#### Error: Cannot change `multiple` mode of select after initialization <br>（不能在选择框初始化完成后修改 `multiple` 模式）

This error is thrown if you attempt to bind the `multiple` property on `<mat-select>` to a dynamic
value. (e.g. `[multiple]="isMultiple"` where the value of `isMultiple` changes over the course of
the component's lifetime). If you need to change this dynamically, use `ngIf` or `ngSwitch` instead:

如果你试图把 `<mat-select>` 的 `multiple` 属性绑定到一个动态值，就会抛出此错误。（比如 `[multiple]="isMultiple"` 如果 `isMultiple` 的值在组件生命周期内发生了变化。）如果你确实需要动态修改它，请改用 `ngIf` 或 `ngSwitch`：

```html
<mat-select *ngIf="isMultiple" multiple>
  ...
</mat-select>
<mat-select *ngIf="!isMultiple">
  ...
</mat-select>
```

#### Error: Value must be an array in multiple-selection mode

#### Error: Value must be an array in multiple-selection mode <br>（在多选模式下，值必须是数组）

This error is thrown if you attempt to assign a value other than `null`, `undefined`, or an array to
a `<mat-select multiple>`. For example, something like `mySelect.value = 'option1'`. What you likely
meant to do was `mySelect.value = ['option1']`.

如果你试图给 `<mat-select multiple>` 赋值为除 `null`、`undefined` 或数组之外的值，就会抛出此错误。
比如，`mySelect.value = 'option1'` 就会出错，应该写成 `mySelect.value = ['option1']`。

#### Error: `compareWith` must be a function

#### Error: `compareWith` must be a function <br>（`compareWith` 必须是函数）

This error occurs if you attempt to assign something other than a function to the `compareWith`
property. For more information on proper usage of `compareWith` see the
[Angular forms documentation](https://angular.io/api/forms/SelectControlValueAccessor#caveat-option-selection)).

如果你尝试把函数之外的值赋给 `compareWith` 属性，就会出现此错误。要了解如何正确使用 `compareWith`，请参见 [Angular 表单文档](https://angular.cn/api/forms/SelectControlValueAccessor#caveat-option-selection)。
