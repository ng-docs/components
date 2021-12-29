`<mat-radio-button>` provides the same functionality as a native `<input type="radio">` enhanced with
Material Design styling and animations.

`<mat-radio>` 提供了与原生元素 `<input type="radio">` 相同的功能，但用 Material Design 的样式和动画进行了增强。

<!-- example(radio-overview) -->

All radio-buttons with the same `name` comprise a set from which only one may be selected at a time.

所有具有相同 `name` 的单选按钮会构成一个集合，一次只能选择一个。

### Radio-button label

### 单选按钮的标签

The radio-button label is provided as the content to the `<mat-radio-button>` element. The label can
be positioned before or after the radio-button by setting the `labelPosition` property to `'before'`
or `'after'`.

单选按钮的标签是通过 `<mat-radio-button>` 元素的内容提供的。
该标签可以通过把 `labelPosition` 属性的值设置为 `'before'` 或 `'after'` 来把该标签定位在单选按钮的前面或后面。

If you don't want the label to appear next to the radio-button, you can use
[`aria-label`](https://www.w3.org/TR/wai-aria/states_and_properties#aria-label) or
[`aria-labelledby`](https://www.w3.org/TR/wai-aria/states_and_properties#aria-labelledby) to
specify an appropriate label.

如果你不想让此标签出现在单选按钮的紧后面，你可以用 [`aria-label`](https://www.w3.org/TR/wai-aria/states_and_properties#aria-label) 或 
[`aria-labelledby`](https://www.w3.org/TR/wai-aria/states_and_properties#aria-labelledby) 来指定一个合适的标签。

### Radio groups

### 单选组

Radio-buttons should typically be placed inside of an `<mat-radio-group>` unless the DOM structure
would make that impossible (e.g., radio-buttons inside of table cells). The radio-group has a
`value` property that reflects the currently selected radio-button inside of the group.

除非 DOM 结构不允许（比如在表格单元格中的单选按钮），否则单选按钮通常都要放在 `<mat-radio-group>` 的内部。
单选组具有一个 `value` 属性，用于表示该组中当前选中的单选按钮。

Individual radio-buttons inside of a radio-group will inherit the `name` of the group.

单选组中的每个单选按钮都会继承该组的 `name`。

### Use with `@angular/forms`

### 和 `@angular/forms` 一起使用

`<mat-radio-group>` is compatible with `@angular/forms` and supports both `FormsModule`
and `ReactiveFormsModule`.

`<mat-radio-group>` 与 `@angular/forms` 兼容，并且同时支持 `FormsModule` 和 `ReactiveFormsModule`。


### Default Color Configuration

### 默认颜色配置

The default color for radio buttons can be configured globally using the `MAT_RADIO_DEFAULT_OPTIONS` provider

可以使用 `MAT_RADIO_DEFAULT_OPTIONS` 提供者全局配置单选按钮的默认颜色

```
providers: [{
    provide: MAT_RADIO_DEFAULT_OPTIONS,
    useValue: { color: 'accent' },
}]
```

### Accessibility

`MatRadioButton` uses an internal `<input type="radio">` to provide an accessible experience.
This internal radio button receives focus and is automatically labelled by the text content of the
`<mat-radio-button>` element. Avoid adding other interactive controls into the content of
`<mat-radio-button>`, as this degrades the experience for users of assistive technology.

Always provide an accessible label via `aria-label` or `aria-labelledby` for radio buttons without
descriptive text content. For dynamic labels and descriptions, `MatRadioButton` provides input
properties for binding `aria-label`, `aria-labelledby`, and `aria-describedby`. This means that you
should not use the `attr.` prefix when binding these properties, as demonstrated below.

```html
<mat-radio-button [aria-label]="getMultipleChoiceAnswer()">
</mat-radio-button>
```

Prefer placing all radio buttons inside of a `<mat-radio-group>` rather than creating standalone
radio buttons because groups are easier to use exclusively with a keyboard. 

You should provide an accessible label for all `<mat-radio-group>` elements via `aria-label` or
`aria-labelledby`. 
