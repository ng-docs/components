The `@angular/cdk/listbox` module provides directives to help create custom listbox interactions
based on the [WAI ARIA listbox pattern][aria].

`@angular/cdk/listbox` 模块提供指令来帮助创建基于[WAI ARIA 列表框模式][aria]的自定义列表框交互。

By using `@angular/cdk/listbox` you get all the expected behaviors for an accessible experience,
including bidi layout support, keyboard interaction, and focus management. All directives apply
their associated ARIA roles to their host element.

通过使用 `@angular/cdk/listbox`，你可以获得无障碍体验的所有预期行为，包括双向布局支持、键盘交互和焦点管理。所有指令都将其关联的 ARIA 角色应用于其宿主元素。

### Supported ARIA Roles

### 支持的 ARIA 角色

The directives in `@angular/cdk/listbox` set the appropriate roles on their host element.

`@angular/cdk/listbox` 中的指令在其宿主元素上设置适当的角色。

| Directive | ARIA Role |
| --------- |-----------|
| 指令 | ARIA 角色   |
| cdkOption | option    |
| cdkListbox | listbox   |

### CSS Styles and Classes

### CSS 样式和类

The `@angular/cdk/listbox` is designed to be highly customizable to your needs. It therefore does not
make any assumptions about how elements should be styled. You are expected to apply any required
CSS styles, but the directives do apply CSS classes to make it easier for you to add custom styles.
The available CSS classes are listed below, by directive.

`@angular/cdk/listbox` 旨在根据你的需要进行高度定制。因此，它不会对元素的样式进行任何假设。你应该应用任何所需的 CSS 样式，但这些指令确实应用了 CSS 类，以便你更轻松地添加自定义样式。下面按指令列出了可用的 CSS 类。

| Directive | CSS Class         | Applied... |
| :-------- |-------------------| ---------- |
| 指令 | CSS 类             | 何时应用 |
| cdkOption | .cdk-option       | Always |
| cdkOption | .cdk-option       | 总是 |
| cdkOption | .cdk-option-active | If the option is active |
| cdkOption | .cdk-option-active | 如果选项处于活动状态 |
| cdkListbox | .cdk-listbox      | Always |
| cdkListbox | .cdk-listbox      | 总是 |

In addition to CSS classes, these directives add aria attributes that can be targeted in CSS.

除了 CSS 类之外，这些指令还添加了可以在 CSS 中定位的 aria 属性。

| Directive | Attribute Selector               | Applied... |
| :-------- |----------------------------------| ---------- |
| 指令 | Attribute 选择器                    | 何时应用 |
| cdkOption | \[aria-disabled="true"]          | If the option is disabled |
| cdkOption | \[aria-disabled="true"]          | 如果该选项已禁用 |
| cdkOption | \[aria-disabled="false"]         | If the option is not disabled |
| cdkOption | \[aria-disabled="false"]         | 如果该选项未禁用 |
| cdkOption | \[aria-selected="true"]          | If the option is selected |
| cdkOption | \[aria-selected="true"]          | 如果选定了该选项 |
| cdkOption | \[aria-selected="false"]         | If the option is not selected |
| cdkOption | \[aria-selected="false"]         | 如果未选定该选项 |
| cdkListbox | \[aria-disabled="true"]          | If the listbox is disabled |
| cdkListbox | \[aria-disabled="true"]          | 如果列表框已禁用 |
| cdkListbox | \[aria-disabled="false"]         | If the listbox is not disabled |
| cdkListbox | \[aria-disabled="false"]         | 如果列表框没有禁用 |
| cdkListbox | \[aria-multiselectable="true"]   | If the listbox is multiple selection |
| cdkListbox | \[aria-multiselectable="true"]   | 如果列表框是多选 |
| cdkListbox | \[aria-multiselectable="false"]  | If the listbox is single selection |
| cdkListbox | \[aria-multiselectable="false"]  | 如果列表框是单选 |
| cdkListbox | \[aria-orientation="horizontal"] | If the listbox is oriented horizontally |
| cdkListbox | \[aria-orientation="horizontal"] | 如果列表框是水平的 |
| cdkListbox | \[aria-orientation="vertical"]   | If the listbox is oriented vertically |
| cdkListbox | \[aria-orientation="vertical"]   | 如果列表框是垂直的 |

### Getting started

### 入门指南

Import the `CdkListboxModule` into the `NgModule` in which you want to create a listbox. You can
then apply listbox directives to build your custom listbox. A typical listbox consists of the
following directives:

将此 `CdkListboxModule` 导入到要在其中创建列表框的 `NgModule` 中。然后你可以应用列表框指令来构建你的自定义列表框。典型的列表框由以下指令组成：

- `cdkListbox` - Added to the container element containing the options to be selected

  `cdkListbox` - 添加到包含要选择的选项的容器元素上

- `cdkOption` - Added to each selectable option in the listbox

  `cdkOption` - 添加到列表框中的每个可选选项上

<!-- example({
  "example": "cdk-listbox-overview",
  "file": "cdk-listbox-overview-example.html",
  "region": "listbox"
}) -->

### Option values

### 选项值

Each option in a listbox is bound to the value it represents when selected, e.g.
`<li cdkOption="red">Red</li>`. Within a single listbox, each option must have a unique value. If 
an option is not explicitly given a value, its value is considered to be `''` \(empty string\), e.g.
`<li cdkOption>No color preference</li>`.

列表框中的每个选项都会绑定到它在被选中时代表的值，例如 `<li cdkOption="red">Red</li>` 。在单个列表框中，每个选项都必须具有唯一值。如果一个选项没有被明确地赋予一个值，它的值被认为是 `''` （空字符串），例如 `<li cdkOption>No color preference</li>` 。

<!-- example({
  "example": "cdk-listbox-overview",
  "file": "cdk-listbox-overview-example.html",
  "region": "option"
}) -->

### Single vs multiple selection

### 单选与多选

Listboxes only support a single selected option at a time by default, but adding 
`cdkListboxMultiple` will enable selecting more than one option.

默认情况下，列表框一次只支持一个选定的选项，但添加 `cdkListboxMultiple` 将允许选择多个选项。

<!-- example({
  "example": "cdk-listbox-multiple",
  "file": "cdk-listbox-multiple-example.html",
  "region": "listbox"
}) -->

### Listbox value

### 列表框的值

The listbox's value is an array containing the values of the selected option\(s\). This is true even
for the single selection listbox, whose value is an array containing a single element. The listbox's
value can be bound using `[cdkListboxValue]` and `(cdkListboxValueChange)`.

此列表框的值是一个数组，其中包含所选选项的值。即使对于单选列表框亦是如此，它的值是一个包含单个元素的数组。可以使用 `[cdkListboxValue]` 和 `(cdkListboxValueChange)` 绑定列表框的值。

<!-- example({
  "example": "cdk-listbox-value-binding",
  "file": "cdk-listbox-value-binding-example.html",
  "region": "listbox"
}) -->

Internally the listbox compares the listbox value against the individual option values using
`Object.is` to determine which options should appear selected. If your option values are complex
objects, you should provide a custom comparison function instead. This can be set via the
`cdkListboxCompareWith` input on the listbox.

在内部，列表框使用 `Object.is` 将列表框值与各个选项值进行比较，以确定应该选择哪些选项。如果你的选项值是复杂的对象，你应该提供一个自定义的比较函数。这可以通过列表框上的 `cdkListboxCompareWith` 输入属性设置。

<!-- example({
  "example": "cdk-listbox-compare-with",
  "file": "cdk-listbox-compare-with-example.html",
  "region": "listbox"
}) -->

### Angular Forms support

### Angular 表单支持

The CDK Listbox supports both template driven forms and reactive forms.

CDK 列表框支持模板驱动表单和响应式表单。

<!-- example({
  "example": "cdk-listbox-template-forms",
  "file": "cdk-listbox-template-forms-example.html",
  "region": "listbox"
}) -->

<!-- example({
  "example": "cdk-listbox-reactive-forms",
  "file": "cdk-listbox-reactive-forms-example.html",
  "region": "listbox"
}) -->

#### Forms validation

#### 表单验证

The CDK listbox integrates with Angular's form validation API and has the following built-in
validation errors:

CDK 列表框与 Angular 的表单验证 API 集成，并具有以下内置验证错误：

- `cdkListboxUnexpectedOptionValues` - Raised when the bound value contains values that do not
  appear as option value in the listbox. The validation error contains a `values` property that
  lists the invalid values

  `cdkListboxUnexpectedOptionValues` - 当绑定值包含未作为选项值出现在列表框中的值时引发。验证错误包含一个列出无效值的 `values` 属性

- `cdkListboxUnexpectedMultipleValues` - Raised when a single-selection listbox is bound to a value
  containing multiple selected options.

  `cdkListboxUnexpectedMultipleValues` - 当单选列表框绑定到包含多个选定选项的值时引发。

<!-- example({
  "example": "cdk-listbox-forms-validation",
  "file": "cdk-listbox-forms-validation-example.ts",
  "region": "errors"
}) -->

### Disabling options

### 禁用候选项

You can disable options for selection by setting `cdkOptionDisabled`.
In addition, the entire listbox control can be disabled by setting `cdkListboxDisabled` on the
listbox element.

你可以通过设置 `cdkOptionDisabled` 来禁用候选项。此外，可以通过在列表框元素上设置 `cdkListboxDisabled` 来禁用整个列表框控件。

<!-- example({
  "example": "cdk-listbox-disabled",
  "file": "cdk-listbox-disabled-example.html",
  "region": "listbox"
}) -->

### Accessibility

### 无障碍性

The directives defined in `@angular/cdk/listbox` follow accessibility best practices as defined
in the [ARIA spec][aria]. Keyboard interaction is supported as defined in the
[ARIA listbox keyboard interaction spec][keyboard] _without_ the optional selection follows focus
logic \(TODO: should we make this an option?\).

`@angular/cdk/listbox` 中定义的指令遵循[ARIA 规范][aria]中定义的无障碍性最佳实践。支持键盘交互，如[ARIA 列表框键盘交互规范][keyboard]中所定义，*没有*可选的选择结果会遵循焦点逻辑（TODO：我们应该将其作为一个选项吗？）。

#### Listbox label

#### 列表框标签

Always give the listbox a meaningful label for screen readers. If your listbox has a visual label,
you can associate it with the listbox using `aria-labelledby`, otherwise you should provide a
screen-reader-only label with `aria-label`.

始终为列表框提供一个对屏幕阅读器有意义的标签。如果你的列表框有一个可视标签，你可以使用 `aria-labelledby` 将它与列表框相关联，否则你应该使用 `aria-label` 提供一个屏幕阅读器专用标签。

#### Roving tabindex vs active descendant

#### 非固定 tabindex 与活动后代

By default, the CDK listbox uses the [roving tabindex][roving-tabindex] strategy to manage focus.
If you prefer to use the [aria-activedescendant][activedescendant] strategy instead, set
`useActiveDescendant=true` on the listbox.

默认情况下，CDK 列表框使用[非固定 tabindex][roving-tabindex]策略来管理焦点。如果你更喜欢使用[aria-activedescendant][activedescendant]策略，请在列表框中设置 `useActiveDescendant=true` 。

<!-- example({
  "example": "cdk-listbox-activedescendant",
  "file": "cdk-listbox-activedescendant-example.html",
  "region": "listbox"
}) -->

#### Orientation

#### 方向

Listboxes assume a vertical orientation by default, but can be customized by setting the
`cdkListboxOrientation` input. Note that this only affects the keyboard navigation. You
will still need to adjust your CSS styles to change the visual appearance.

默认情况下，列表框采用垂直方向，但可以通过设置 `cdkListboxOrientation` 输入属性进行自定义。请注意，这只会影响键盘导航。你仍然需要调整 CSS 样式以更改视觉外观。

<!-- example({
  "example": "cdk-listbox-horizontal",
  "file": "cdk-listbox-horizontal-example.html",
  "region": "listbox"
}) -->

#### Option typeahead

#### 预先输入选项

The CDK listbox supports typeahead based on the option text. If the typeahead text for your options
needs to be different than the display text \(e.g. to exclude emoji\), this can be accomplished by
setting the `cdkOptionTypeaheadLabel` on the option.

CDK 列表框支持基于选项文本的预先输入。如果选项的预先输入文本需要与显示文本不同（例如，排除表情符号），这可以通过在选项上设置 `cdkOptionTypeaheadLabel` 来实现。

<!-- example({
  "example": "cdk-listbox-custom-typeahead",
  "file": "cdk-listbox-custom-typeahead-example.html",
  "region": "listbox"
}) -->

#### Keyboard navigation options

#### 键盘导航选项

When using keyboard navigation to navigate through the options, the navigation wraps when attempting
to navigate past the start or end of the options. To change this, set
`cdkListboxNavigationWrapDisabled` on the listbox.

使用键盘导航浏览选项时，导航会在尝试浏览选项的开头或结尾时回绕。要更改此设置，请用列表框上的 `cdkListboxNavigationWrapDisabled` 。

Keyboard navigation skips disabled options by default. To change this set
`cdkListboxNavigatesDisabledOptions` on the listbox.

默认情况下，键盘导航会跳过禁用的选项。要更改此设置，请用列表框上的 `cdkListboxNavigatesDisabledOptions` 。

<!-- example({
  "example": "cdk-listbox-custom-navigation",
  "file": "cdk-listbox-custom-navigation-example.html",
  "region": "listbox"
}) -->

<!-- links -->

[aria]: https://www.w3.org/WAI/ARIA/apg/patterns/listbox/ "WAI ARIA Listbox Pattern"

[keyboard]: https://www.w3.org/WAI/ARIA/apg/patterns/listbox/#keyboard-interaction-11 "WAI ARIA Listbox Keyboard Interaction"

[roving-tabindex]: https://developer.mozilla.org/en-US/docs/Web/Accessibility/Keyboard-navigable_JavaScript_widgets#technique_1_roving_tabindex "MDN Roving Tabindex Technique"

[activedescendant]: https://developer.mozilla.org/en-US/docs/Web/Accessibility/Keyboard-navigable_JavaScript_widgets#technique_2_aria-activedescendant "MDN aria-activedescendant Technique"
