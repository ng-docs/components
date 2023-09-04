`<mat-form-field>` is a component used to wrap several Angular Material components and apply common
[Text field](https://material.io/guidelines/components/text-fields.html) styles such as the
underline, floating label, and hint messages.

`<mat-form-field>` 是一个组件，用于把几个 Angular Material 组件包装在一起，并应用上常见的[文本输入框](https://material.io/guidelines/components/text-fields.html)样式，比如下划线、浮动标签和提示信息。

In this document, "form field" refers to the wrapper component `<mat-form-field>` and
"form field control" refers to the component that the `<mat-form-field>` is wrapping
(e.g. the input, textarea, select, etc.)

该文档中，"表单字段"（form field）是指包装组件 `<mat-form-field>`，而 "表单字段控件"（form field control）是指被 `<mat-form-field>` 包装的组件（如文本框、多行文本框、选择框等）。

The following Angular Material components are designed to work inside a `<mat-form-field>`:

在设计上，下列 Angular Material 组件可用在 `<mat-form-field>` 中：

* [`<input matNativeControl>` & `<textarea matNativeControl>`](https://material.angular.io/components/input/overview)

  [`<input matNativeControl>` 和 `<textarea matNativeControl>`](https://material.angular.io/components/input/overview)

* [`<select matNativeControl>`](https://material.angular.io/components/select/overview)

* [`<mat-select>`](https://material.angular.io/components/select/overview)

* [`<mat-chip-list>`](https://material.angular.io/components/chips/overview)

<!-- example(form-field-overview) -->

### Form field appearance variants

### 表单字段外观的变体形式

`mat-form-field` supports two different appearance variants which can be set via the `appearance`
input: `fill` and `outline`. The `fill` appearance displays the form field with a filled background
box and an underline, while the `outline` appearance shows the form field with a border all the way
around.

`mat-form-field` 支持两种不同的外观变体，可以通过输入属性 `appearance` 进行设置：`fill` 和 `outline`。
`fill` 外观显示的表单字段除了下划线之外还带有填充的背景。
`outline` 外观会显示一个带四周边框的表单字段，而不仅有下划线。

Out of the box, if you do not specify an `appearance` for the `<mat-form-field>` it will default to
`fill`. However, this can be configured using a global provider to choose a different default
appearance for your app.

开箱即用的情况下，如果你没有为 `<mat-form-field>` 指定 `appearance`，它将默认为 `legacy`。但是，这可以使用全局的提供者进行配置，为你的应用程序选择不同的默认外观。

```ts
@NgModule({
  providers: [
    {provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: {appearance: 'outline'}}
  ]
})
```

第二个重要的不同点是 `standard`、`fill` 或 `outline` 不会把占位符（placeholder）提升为标签。
对于 `legacy` 外观来说，指定 `<input placeholder="placeholder">` 将导致为 `mat-form-field` 添加一个浮动标签。
对于新外观，它只会给输入框添加一个标准的占位符。如果你想使用浮动标签，请往 `mat-form-field` 中添加一个 `<mat-label>`。

<!-- example(form-field-appearance) -->

### Floating label

### 浮动标签

The floating label is a text label displayed on top of the form field control when
the control does not contain any text or when `<select matNativeControl>` does not show any option
text. By default, when text is present the floating label floats above the form field control. The
label for a form field can be specified by adding a `mat-label` element.

当控件不包含任何文本时，显示在表单字段控件顶部的那个文本标签就叫做浮动标签。
默认情况下，如果存在文本，则浮动标签将显示在表单字段控件的上方。
可以通过添加 `mat-label` 元素来为表单字段指定浮动标签。

If the form field control is marked with a `required` attribute, an asterisk will be appended to the
label to indicate the fact that it is a required field. If unwanted, this can be disabled by
setting the `hideRequiredMarker` property on `<mat-form-field>`

如果表单字段控件带有 `required` 属性，则该标签会带有一个星号后缀，以表明该字段是必填的。
如果不希望显示星号，则可以通过为 `<mat-form-field>` 添加 `hideRequiredMarker` 属性来禁止显示它。

The `floatLabel` property of `<mat-form-field>` can be used to change this default floating
behavior. It can be set to `always` to float the label even when no text is present in the form
field control, or to `auto` to restore the default behavior.

`<mat-form-field>` 的 `floatLabel` 属性可以用来修改默认的浮动行为。它可以设置为 `never`，以便当表单字段控件中有文本时隐藏该标签，而不是浮起它。也可以设置为 `always`，以便当表单字段控件中没有文本时也仍然浮起该标签。
它也可以设置为 `auto` 来恢复默认行为。

<!-- example(form-field-label) -->

The floating label behavior can be adjusted globally by providing a value for
`MAT_FORM_FIELD_DEFAULT_OPTIONS` in your application's root module. Like the `floatLabel` input,
the option can be either set to `always` or `auto`.

浮动标签的行为可以通过在应用的根模块中通过注入令牌 `MAT_LABEL_GLOBAL_OPTIONS` 进行全局性调整。
就像 `floatLabel` 输入框一样，该选项可以设为 `always`、`never` 或 `auto` 之一。

```ts
@NgModule({
  providers: [
    {provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: {floatLabel: 'always'}}
  ]
})
```

### Hint labels

### 提示标签

Hint labels are additional descriptive text that appears below the form field's underline. A
`<mat-form-field>` can have up to two hint labels; one start-aligned (left in an LTR language, right
in RTL), and one end-aligned.

提示标签是显示在表单字段下划线下方的额外的描述性文本。`<mat-form-field>` 最多能有两个提示标签：
一个向开始处对齐（LTR 语言下向左，RTL 语言下向右 —— 如阿拉伯语），一个向末尾处对齐。

Hint labels are specified in one of two ways: either by using the `hintLabel` property of
`<mat-form-field>`, or by adding a `<mat-hint>` element inside the form field. When adding a hint
via the `hintLabel` property, it will be treated as the start hint. Hints added via the
`<mat-hint>` hint element can be added to either side by setting the `align` property on
`<mat-hint>` to either `start` or `end`. Attempting to add multiple hints to the same side will
raise an error.

提示标签可以用两种方式指定：`<mat-form-field>` 的 `hintLabel` 属性或在表单字段中添加一个 `<mat-hint>` 元素。
当通过 `hintLabel` 属性添加提示时，它会被视为开始提示。通过 `<mat-hint>` 元素添加提示时，可以把它的 `align` 属性设置为 `start` 或 `end` 来控制放在哪一侧。试图往同一侧添加多个提示将会引发错误。

<!-- example(form-field-hint) -->

### Error messages

### 错误信息

Error messages can be shown under the form field underline by adding `mat-error` elements inside the
form field. Errors are hidden initially and will be displayed on invalid form fields after the user
has interacted with the element or the parent form has been submitted. Since the errors occupy the
same space as the hints, the hints are hidden when the errors are shown.

通过往表单字段中添加 `mat-error` 元素，就可以在表单字段的下划线下方显示错误信息。
错误信息最初是隐藏的，在用户与元素进行过交互或提交了父表单后，无效表单字段上的错误信息就会显示出来。
由于错误信息和提示信息占用相同的空间，因此在显示错误时就会隐藏提示。

If a form field can have more than one error state, it is up to the consumer to toggle which
messages should be displayed. This can be done with CSS, `ngIf` or `ngSwitch`. Multiple error
messages can be shown at the same time if desired, but the `<mat-form-field>` only reserves enough
space to display one error message at a time. Ensuring that enough space is available to display
multiple errors is up to the user.

如果表单字段可以有多个错误状态，则由消费者决定应该显示哪些。这可以借助 CSS、`ngIf` 或 `ngSwitch` 来实现。
如果需要，也可以同时显示多个错误信息，但是 `<mat-form-field>` 所保留的空间只够一次显示一条错误信息的。
使用者需要自己保证有足够的空间显示多个错误。

<!-- example(form-field-error) -->

### Prefix & suffix

### 前缀与后缀

Custom content can be included before and after the input tag, as a prefix or suffix. It will be
included within the visual container that wraps the form control as per the Material specification.

自定义内容可以作为前缀或后缀加在输入框标记之前或之后。根据 Material 规范，它要位于包裹着表单控件的视觉容器内部。

Adding the `matPrefix` directive to an element inside the `<mat-form-field>` will designate it as
the prefix. Similarly, adding `matSuffix` will designate it as the suffix.

把 `matPrefix` 指令添加到 `<mat-form-field>` 内的某个元素上就会把该元素用作前缀，而 `matSuffix` 会把它用作后缀。

If the prefix/suffix content is purely text-based, it is recommended to use the `matTextPrefix` or
`matTextSuffix` directives which ensure that the text is aligned with the form control.

如果前缀/后缀的内容是完全基于文本的，建议使用 `matTextPrefix` 或 `matTextSuffix` 指令，它们可以确保此文本与表单控件对齐。

<!-- example(form-field-prefix-suffix) -->

### Custom form field controls

### 自定义表单字段控件

In addition to the form field controls that Angular Material provides, it is possible to create
custom form field controls that work with `<mat-form-field>` in the same way. For additional
information on this see the guide on
[Creating Custom mat-form-field Controls](/guide/creating-a-custom-form-field-control).

除了 Angular Material 提供的表单字段控件之外，也同样可以创建能和 `<mat-form-field>` 协同工作的自定义表单字段控件。
欲知详情，参见[创建自定义 mat-form-field 控件](/guide/creating-a-custom-form-field-control)。

### Theming

### 主题

`<mat-form-field>` has a `color` property which can be set to `primary`, `accent`, or `warn`. This
will set the color of the form field underline and floating label based on the theme colors
of your app.

`<mat-form-field>` 有一个 `color` 属性，它可以设置为 `primary`、`accent` 或 `warn`。
这将会根据应用的主题颜色来设置表单字段的下划线和浮动标签的颜色。

<!-- example(form-field-theming) -->

### Accessibility

### 无障碍性

By itself, `MatFormField` does not apply any additional accessibility treatment to a control.
However, several of the form field's optional features interact with the control contained within
the form field.

就其本身而言， `MatFormField` 不会对控件应用任何额外的无障碍性处理。但是，表单字段的一些可选特性会与表单字段中包含的控件交互。

When you provide a label via `<mat-label>`, `MatFormField` automatically associates this label with
the field's control via a native `<label>` element, using the `for` attribute to reference the
control's ID.

当你通过 `<mat-label>` 提供标签时， `MatFormField` 会通过原生 `<label>` 元素自动将此标签与字段的控件相关联，使用 `for` 属性来引用控件的 ID。

If a floating label is specified, it will be automatically used as the label for the form
field control. If no floating label is specified, the user should label the form field control
themselves using `aria-label`, `aria-labelledby` or `<label for=...>`.

如果指定了浮动标签，它就会自动用作表单字段控件的标签。如果没有指定浮动标签，用户就应该使用 `aria-label`、`aria-labelledby` 或 `<label for=...>` 来给表单字段控件提供标签。

When you provide informational text via `<mat-hint>` or `<mat-error>`, `MatFormField` automatically
adds these elements' IDs to the control's `aria-describedby` attribute. Additionally, `MatError`
applies `aria-live="polite"` by default such that assistive technology will announce errors when
they appear.

当你通过 `<mat-hint>` 或 `<mat-error>` 来提供信息文本时， `MatFormField` 会自动将这些元素的 ID 添加到控件的 `aria-describedby` 属性中。此外， `MatError` 会应用 `aria-live="polite"` ，这样辅助技术就会在错误出现时播报这些错误。

### Troubleshooting

### 排查问题

#### Error: A hint was already declared for align="..."

#### Error: A hint was already declared for align="..." <br>（在 align="..." 声明的位置已经有一个提示信息了）

This error occurs if you have added multiple hints for the same side. Keep in mind that the
`hintLabel` property adds a hint to the start side.

该错误会在你往同一侧添加了多个提示信息时出现。记住，`hintLabel` 属性会在开始侧添加一个提示信息。

#### Error: mat-form-field must contain a MatFormFieldControl

#### Error: mat-form-field must contain a MatFormFieldControl <br>（mat-form-field 内必须有一个 MatFormFieldControl）

This error occurs when you have not added a form field control to your form field. If your form
field contains a native `<input>` or `<textarea>` element, make sure you've added the `matInput`
directive to it and have imported `MatInputModule`. Other components that can act as a form field
control include `<mat-select>`, `<mat-chip-list>`, and any custom form field controls you've
created.

该错误会在你没有往表单字段中添加过表单字段控件时出现。如果你的表单字段包含了原生的 `<input>` 或 `<textarea>` 元素，
请确保你往它们上添加过 `matInput` 指令，并且导入过 `MatInputModule`。
可以充当表单字段控件的其它组件包括 `<mat-select>`、`<mat-chip-list>` 以及你创建的任何自定义表单字段控件。
