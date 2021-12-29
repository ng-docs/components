`<mat-button-toggle>` are on/off toggles with the appearance of a button. These toggles can be
configured to behave as either radio-buttons or checkboxes. While they can be standalone, they are
typically part of a `mat-button-toggle-group`.

`<mat-button-toggle>` 是一个具有按钮外观的双态开关。
这些开关的行为可以配置得像单选按钮或检查框一样。虽然它们也可以独立使用，但一般会作为 `mat-button-toggle-group` 中的一部分。

<!-- example(button-toggle-overview) -->

### Exclusive selection vs. multiple selection

### 单选与多选

By default, `mat-button-toggle-group` acts like a radio-button group- only one item can be selected.
In this mode, the `value` of the `mat-button-toggle-group` will reflect the value of the selected
button and `ngModel` is supported.

默认情况下，`mat-button-toggle-group` 的表现很像单选按钮组 —— 只能选中一个元素。
在这种模式下，`mat-button-toggle-group` 的 `value` 表示当前选中的按钮，还支持 `ngModel`。

Adding the `multiple` attribute allows multiple items to be selected (checkbox behavior). In this
mode the values of the toggles are not used, the `mat-button-toggle-group` does not have a value,
and `ngModel` is not supported.

添加 `multiple` 属性将会允许同时选中多个条目（就像检查框那样）。
在这种模式下，这些开关的值是没用的，`mat-button-toggle-group` 没有值，不支持 `ngModel`。

<!-- example(button-toggle-mode) -->

### Appearance

### 外观

By default, the appearance of `mat-button-toggle-group` and `mat-button-toggle` will follow the
latest Material Design guidelines. If you want to, you can switch back to the appearance that was
following the previous Material Design spec by using the `appearance` input. The `appearance` can
be configured globally using the `MAT_BUTTON_TOGGLE_DEFAULT_OPTIONS` injection token.

默认情况下，`mat-button-toggle-group` 和 `mat-button-toggle` 的外观将遵循最新的 Material 设计准则。如果需要，也可以使用输入属性 `appearance` 切换回上一版 Material Design 规范的外观。可以使用 `MAT_BUTTON_TOGGLE_DEFAULT_OPTIONS` 注入令牌来全局配置 `appearance`。

<!-- example(button-toggle-appearance) -->

### Use with `@angular/forms`
`<mat-button-toggle-group>` is compatible with `@angular/forms` and supports both `FormsModule`
and `ReactiveFormsModule`.

### Orientation

### 方向

The button-toggles can be rendered in a vertical orientation by adding the `vertical` attribute.

通过添加 `vertical` 属性，按钮开关组可以沿垂直方向渲染。

### Accessibility
`MatButtonToggle` internally uses native `button` elements with `aria-pressed` to convey toggle
state. If a toggle contains only an icon, you should specify a meaningful label via `aria-label`
or `aria-labelledby`. For dynamic labels, `MatButtonToggle` provides input properties for binding
`aria-label` and `aria-labelledby`. This means that you should not use the `attr.` prefix when
binding these properties, as demonstrated below.

```html
<mat-button-toggle [aria-label]="alertsEnabled ? 'Disable alerts' : 'Enable alerts'">
  <mat-icon>notifications</mat-icon>
</mat-button-toggle>
```

The `MatButtonToggleGroup` surrounding the individual buttons applies
`role="group"` to convey the association between the individual toggles. Each
`<mat-button-toggle-group>` element should be given a label with `aria-label` or `aria-labelledby`
that communicates the collective meaning of all toggles. For example, if you have toggles for
"Bold", "Italic", and "Underline", you might label the parent group "Font styles".
