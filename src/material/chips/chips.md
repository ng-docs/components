Chips allow users to view information, make selections, filter content, and enter data.

纸片允许用户查看信息、进行选择、过滤内容和输入数据。

### Static Chips

### 静态纸片

Chips are always used inside a container. To create chips, start with a `<mat-chip-set>` element. Then, nest `<mat-chip>` elements inside the `<mat-chip-set>`.

纸片总是在容器内使用。要创建纸片，请从 `<mat-chip-set>` 元素开始。然后，将 `<mat-chip>` 元素嵌套在 `<mat-chip-set>` 中。

<!-- example(chips-overview) -->

By default, `<mat-chip>` renders a chip with Material Design styles applied. For a chip with no styles applied, use `<mat-basic-chip>`.

默认情况下， `<mat-chip>` 会渲染应用了 Material Design 样式的纸片。对于未应用样式的纸片，请使用 `<mat-basic-chip>` 。

*Hint: `<mat-basic-chip>` receives the `mat-mdc-basic-chip` CSS class in addition to the `mat-mdc-chip` class.*

*提示： `<mat-basic-chip>` 除了 `mat-mdc-chip` 类之外还接收 `mat-mdc-basic-chip` CSS 类。*

#### Disabled appearance

#### 禁用态外观

Although `<mat-chip>` is not interactive, you can set the `disabled` Input to give it disabled appearance.

虽然 `<mat-chip>` 不是交互式的，但你可以设置 `disabled` 输入以使其具有禁用态外观。

```html
<mat-chip disabled>Orange</mat-chip>
```

### Selection Chips

### 选定纸片

Use `<mat-chip-listbox>` and `<mat-chip-option>` for selecting one or many items from a list. Start with creating a `<mat-chip-listbox>` element. If the user may select more than one option, add the `multiple` attribute. Nest a `<mat-chip-option>` element inside the `<mat-chip-listbox>` for each available option.

使用 `<mat-chip-listbox>` 和 `<mat-chip-option>` 从列表中选择一个或多个条目。从创建一个 `<mat-chip-listbox>` 元素开始。如果用户可以选择多个选项，请添加 `multiple` 属性。在 `<mat-chip-listbox>` 中为每个可用选项嵌套一个 `<mat-chip-option>` 元素。

#### Disabled `<mat-chip-option>`

#### 禁用 `<mat-chip-option>`

Use the `disabled` Input to disable a `<mat-chip-option>`. This gives the `<mat-chip-option>` a disabled appearance and prevents the user from interacting with it.

使用输入属性 `disabled` 来禁用 `<mat-chip-option>` 。这为 `<mat-chip-option>` 提供了禁用的外观，并阻止用户与其交互。

```html
<mat-chip-option disabled>Orange</mat-chip-option>
```

#### Keyboard Interactions

#### 键盘交互

Users can move through the chips using the arrow keys and select/deselect them with space. Chips also gain focus when clicked, ensuring keyboard navigation starts at the currently focused chip.

用户可以使用箭头键在纸片中移动，并使用空格选定/取消选定它们。单击时条状图也会获得焦点，确保键盘导航从当前聚焦的条状图开始。

### Chips connected to an input field

### 连接到输入字段的纸片

Use `<mat-chip-grid>` and `<mat-chip-row>` for assisting users with text entry.

使用 `<mat-chip-grid>` 和 `<mat-chip-row>` 来帮助用户输入文本。

Chips are always used inside a container. To create chips connected to an input field, start by creating a `<mat-chip-grid>` as the container. Add an `<input/>` element, and register it to the `<mat-chip-grid>` by passing the `matChipInputFor` Input. Always use an `<input/>` element with `<mat-chip-grid>`. Nest a `<mat-chip-row>` element inside the `<mat-chip-grid>` for each piece of data entered by the user. An example of using chips for text input.

纸片总是在容器内使用。要创建连接到输入字段的纸片，首先创建一个 `<mat-chip-grid>` 作为容器。添加一个 `<input/>` 元素，并通过把 `matChipInputFor` 传给 Input 将其注册到 `<mat-chip-grid>` 。始终将 `<input/>` 元素与 `<mat-chip-grid>` 一起使用。为用户输入的每条数据在 `<mat-chip-grid>` 中嵌套一个 `<mat-chip-row>` 元素。使用纸片进行文本输入的示例。

<!-- example(chips-input) -->

#### Disabled `<mat-chip-row>`

#### 禁用 `<mat-chip-row>`

Use the `disabled` Input to disable a `<mat-chip-row>`. This  gives the `<mat-chip-row>` a disabled appearance and prevents the user from interacting with it.

使用 `disabled` 的输入来禁用 `<mat-chip-row>` 。这为 `<mat-chip-row>` 提供了禁用的外观，并阻止用户与其交互。

```html
<mat-chip-row disabled>Orange</mat-chip-row>
```

#### Keyboard Interactions

#### 键盘交互

Users can move through the chips using the arrow keys and select/deselect them with the space. Chips also gain focus when clicked, ensuring keyboard navigation starts at the appropriate chip.

用户可以使用方向键在纸片之间移动，也可以用空格键选择它们或取消选择。 在点击时，纸片还会获得焦点，以确保会从合适的纸片开始导航。

Users can press delete to remove a chip. Pressing delete triggers the `removed` Output on the chip, so be sure to implement `removed` if you require that functionality.

用户可以按删除键删除纸片。按删除键会触发纸片上 `removed` 的输出属性，因此如果你需要该功能，请务必实现 `removed` 。

#### Autocomplete

#### 自动完成

An example of chip input with autocomplete.

具有自动完成功能的纸片输入示例。

<!-- example(chips-autocomplete) -->

### Icons

### 图标

You can add icons to chips to identify entities (like individuals) and provide additional functionality.

你可以向纸片添加图标以标识出实体（如个人）并提供附加功能。

#### Adding up to two icons with content projection

#### 添加最多两个带有内容投影的图标

You can add two additional icons to an individual chip. A chip has two slots to display icons using content projection. All variants of chips support adding icons including `<mat-chip>`, `<mat-chip-option>`, and `<mat-chip-row>`.

你可以向单个纸片添加两个额外的图标。一块纸片有两个插槽，可以使用内容投影来显示图标。所有纸片变体都支持添加图标，包括 `<mat-chip>` 、 `<mat-chip-option>` 和 `<mat-chip-row>` 。

A chip has a front slot for adding an avatar image. To add an avatar, nest an element with `matChipAvatar` attribute inside of `<mat-chip>`.

纸片有一个用于添加头像图像的正面插槽。要添加头像，请在 `<mat-chip>` 中嵌套一个具有 `matChipAvatar` 属性的元素。

<!-- example(chips-avatar) -->

You can add an additional icon to the back slot by nesting an element with either the `matChipTrailingIcon` or `matChipRemove` attribute.

你可以通过使用 `matChipTrailingIcon` 或 `matChipRemove` 属性嵌套元素来向后槽添加额外的图标。

#### Remove Button

#### 删除按钮

Sometimes the end user would like the ability to remove a chip. You can provide that functionality using `matChipRemove`. `matChipRemove` renders to the back slot of a chip and triggers the `removed` Output when clicked.

有时最终用户希望能够移除纸片。你可以使用 `matChipRemove` 提供该功能。 `matChipRemove` 会渲染到纸片的后插槽，并在单击时触发 `removed` 的输出。

To create a remove button, nest a `<button>` element with `matChipRemove` attribute inside the `<mat-chip-option>`. Be sure to implement the `removed` Output.

要创建移除按钮，请在 `<mat-chip-option>` 中嵌套一个具有 `matChipRemove` 属性的 `<button>` 元素。请务必实现 `removed` 输出属性。

```html
 <mat-chip-option>
  Orange
  <button matChipRemove aria-label="Remove orange">
    <mat-icon>cancel</mat-icon>
  </button>
</mat-chip-option>
```

See the [accessibility](#accessibility) section for best practices on implementing the `removed` Output and creating accessible icons.

有关如何创建无障碍图标的信息，请参阅[无障碍性](#accessibility)部分。

### Orientation

### 方向

By default, chips are displayed horizontally. To stack chips vertically, apply the `mat-mdc-chip-set-stacked` class to `<mat-chip-set>`, `<mat-chip-listbox>` or `<mat-chip-grid>`. 

默认情况下，纸片是水平显示的。要垂直堆叠纸片，请将 `mat-mdc-chip-set-stacked` 类应用于 `<mat-chip-set>` 、 `<mat-chip-listbox>` 或 `<mat-chip-grid>` 。

<!-- example(chips-stacked) -->

### Specifying global configuration defaults

### 指定全局配置默认值

Use the `MAT_CHIPS_DEFAULT_OPTIONS` token to specify default options for the chips module.

使用 `MAT_CHIPS_DEFAULT_OPTIONS` 令牌指定纸片模块的默认选项。

```html
@NgModule({
  providers: [
    {
      provide: MAT_CHIPS_DEFAULT_OPTIONS,
      useValue: {
        separatorKeyCodes: [COMMA, SPACE]
      }
    }
  ]
})
```

### Theming

### 主题

By default, chips use the primary color. Specify the `color` property to change the color to `accent` or `warn`.

默认情况下，纸片使用原色。指定 `color` 属性以将颜色更改为 `accent` 或 `warn` 。

### Interaction Patterns

### 交互模式

The chips components support 3 user interaction patterns, each with its own container and chip elements:

纸片组件支持 3 种用户交互模式，每种模式都有自己的容器和纸片元素：

#### Listbox

`<mat-chip-listbox>` and `<mat-chip-option>` : These elements implement a listbox accessibility pattern. Use them to present set of user selectable options.

`<mat-chip-listbox>` 和 `<mat-chip-option>` ：这些元素实现了列表框无障碍模式。使用它们来渲染一组可供用户选定的选项。

```html
<mat-chip-listbox aria-label="select a shirt size">
  <mat-chip-option> Small </mat-chip-option>
  <mat-chip-option> Medium </mat-chip-option>
  <mat-chip-option> Large </mat-chip-option>
</mat-chip-listbox>
```

#### Text Entry

#### 文字输入

`<mat-chip-grid>` and `<mat-chip-row>` : These elements implement a grid accessibility pattern. Use them as part of a free form input that allows users to enter text to add chips.

`<mat-chip-grid>` 和 `<mat-chip-row>` ：这些元素实现了网格无障碍性模式。将它们用作自由表单输入的一部分，允许用户输入文本以添加纸片。

```html
<mat-form-field>
  <mat-chip-grid #myChipGrid [(ngModel)]="mySelection"
  aria-label="enter sandwich fillings">
    <mat-chip-row *ngFor="let filling of fillings"
                 (removed)="remove(filling)">
      {{filling.name}}
      <button matChipRemove>
        <mat-icon>cancel</mat-icon>
      </button>
    </mat-chip-row>
    <input [matChipInputFor]="myChipGrid"
           [matChipInputSeparatorKeyCodes]="separatorKeysCodes"
           (matChipInputTokenEnd)="add($event)" />
  </mat-chip-grid>
</mat-form-field>
```

#### Static Content

#### 静态内容

`<mat-chip-set>` and `<mat-chip>` as an unordered list : Present a list of items that are not interactive. This interaction pattern mimics using `ul` and `li` elements. Apply role="list" to the `<mat-list>`. Apply role="listitem" to each `<mat-list-item>`.

`<mat-chip-set>` 和 `<mat-chip>` 作为无序列表：表示一个非交互式条目列表。这种交互模式模仿使用 `ul` 和 `li` 元素。将 role="list" 应用于 `<mat-list>` 。将 role="listitem" 应用于每个 `<mat-list-item>` 。

```html
<mat-chip-set role="list">
  <mat-chip role="listitem"> Sugar </mat-chip>
  <mat-chip role="listitem"> Spice </mat-chip>
  <mat-chip role="listitem"> Everything Nice </mat-chip>
</mat-chip-set>
```

`<mat-chip-set>` and `<mat-chip>` : These elements do not implement any specific accessibility pattern. Add the appropriate accessibility depending on the context. Note that Angular Material does not intend `<mat-chip>`, `<mat-basic-chip>`, and `<mat-chip-set>` to be interactive.

`<mat-chip-set>` 和 `<mat-chip>` ：这些元素不实现任何特定的无障碍模式。根据上下文添加适当的辅助功能。请注意，Angular Material 并不打算让 `<mat-chip>` 、 `<mat-basic-chip>` 和 `<mat-chip-set>` 进行交互。

```html
<mat-chip-set>
  <mat-chip> John </mat-chip>
  <mat-chip> Paul </mat-chip>
  <mat-chip> James </mat-chip>
</mat-chip-set>
```

### Accessibility

### 无障碍性

The [Interaction Patterns](#interaction-patterns) section describes the three variants of chips available. Choose the chip variant that best matches your use case.

[交互模式](#interaction-patterns)部分描述了可用纸片的三种变体。选择最适合你的用例的纸片变体。

For both MatChipGrid and MatChipListbox, always apply an accessible label to the control via `aria-label` or `aria-labelledby`.

对于 MatChipGrid 和 MatChipListbox，始终通过 `aria-label` 或 `aria-labelledby` 将无障碍标签应用于控件。

Always apply MatChipRemove to a `<button>` element, never a `<mat-icon>` element.

始终将 MatChipRemove 应用于 `<button>` 元素，而不是 `<mat-icon>` 元素。

When using MatChipListbox, never nest other interactive controls inside of the `<mat-chip-option>` element. Nesting controls degrades the experience for assistive technology users.

使用 MatChipListbox 时，切勿在 `<mat-chip-option>` 元素内嵌套其他交互式控件。嵌套控件会降低辅助技术用户的体验。

By default, `MatChipListbox` displays a checkmark to identify selected items. While you can hide the checkmark indicator for single-selection via `hideSingleSelectionIndicator`, this makes the component less accessible by making it harder or impossible for users to visually identify selected items.

When using `MatChipRemove`, you should always communicate removals for assistive technology. One way to accomplish this is by sending a message with `LiveAnnouncer`. Otherwise, removing a chip may only be communicated visually.

When a chip is editable, provide instructions to assistive technology how to edit the chip using a keyboard. One way to accomplish this is adding an `aria-description` attribute with instructions to press enter to edit the chip.
