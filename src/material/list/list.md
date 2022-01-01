`<mat-list>` is a container component that wraps and formats a series of line items. As the base 
list component, it provides Material Design styling, but no behavior of its own.

`<mat-list>` 是一个容器组件，用于包装和格式化一系列条目。
作为最基本的列表组件，它提供了 Material Design 的样式，但是并没有定义属于自己的行为。

<!-- example(list-overview) -->

### Simple lists

### 简单列表

An `<mat-list>` element contains a number of `<mat-list-item>` elements.

每个 `<mat-list>` 元素包含一组 `<mat-list-item>` 元素。

```html
<mat-list>
 <mat-list-item> Pepper </mat-list-item>
 <mat-list-item> Salt </mat-list-item>
 <mat-list-item> Paprika </mat-list-item>
</mat-list>
```

### Navigation lists

### 导航列表

Use `mat-nav-list` tags for navigation lists (i.e. lists that have anchor tags).

使用 `mat-nav-list` 标记来表示导航列表（即带链接的列表）。

Simple navigation lists can use the `mat-list-item` attribute on anchor tag elements directly:

简单导航列表可以直接把 `mat-list-item` 属性用在链接上：

```html
<mat-nav-list>
   <a mat-list-item href="..." *ngFor="let link of links"> {{ link }} </a>
</mat-nav-list>
```

For more complex navigation lists (e.g. with more than one target per item), wrap the anchor 
element in an `<mat-list-item>`.

对于更复杂的导航列表（比如：每个条目具有多个目标时），可以把链接包裹在 `<mat-list-item>` 中。

```html
<mat-nav-list>
  <mat-list-item *ngFor="let link of links">
     <a matLine href="...">{{ link }}</a>
     <button mat-icon-button (click)="showInfo(link)">
        <mat-icon>info</mat-icon>
     </button>
  </mat-list-item>
</mat-nav-list>
```

### Action lists

### 动作列表

Use the `<mat-action-list>` element when each item in the list performs some _action_. Each item
in an action list is a `<button>` element.

当列表中的每个项都要执行某种*动作*时，使用 `<mat-action-list>` 元素。动作列表中的每一项都是一个 `<button>` 元素。

Simple action lists can use the `mat-list-item` attribute on button tag elements directly:

简单的动作列表可以直接用 `mat-list-item` 属性添加在 `button` 元素上。

```html
<mat-action-list>
  <button mat-list-item (click)="save()"> Save </button>
  <button mat-list-item (click)="undo()"> Undo </button>
</mat-action-list>
```

### Selection lists

### 选取列表

A selection list provides an interface for selecting values, where each list item is an option.

选取列表提供了一种可以选取值的界面，列表中的每个条目都是一个选项。

<!-- example(list-selection) -->

The options within a selection-list should not contain further interactive controls, such
as buttons and anchors.

选取列表中的选项不应该包含可交互控件，比如按钮或链接。

### Multi-line lists

### 多行列表

For lists that require multiple lines per item, annotate each line with an `matLine` attribute.
Whichever heading tag is appropriate for your DOM hierarchy should be used (not necessarily `<h3>`
as shown in the example).

对于每个条目需要多行内容的列表，可以给每一行标注 `matLine` 属性。
这里应该使用一个在你的 DOM 层次下最恰当的标题标记（不一定要要像下面的例子中这样用 `<h3>`）。

```html
<!-- two line list -->
<mat-list>
  <mat-list-item *ngFor="let message of messages">
    <h3 matLine> {{message.from}} </h3>
    <p matLine>
      <span> {{message.subject}} </span>
      <span class="demo-2"> -- {{message.content}} </span>
    </p>
  </mat-list-item>
</mat-list>

<!-- three line list -->
<mat-list>
  <mat-list-item *ngFor="let message of messages">
    <h3 matLine> {{message.from}} </h3>
    <p matLine> {{message.subject}} </p>
    <p matLine class="demo-2"> {{message.content}} </p>
  </mat-list-item>
</mat-list>
```

### Lists with icons

### 带图标的列表

To add an icon to your list item, use the `matListIcon` attribute.

要想给列表条目添加图标，请使用 `matListIcon` 属性。

```html
<mat-list>
  <mat-list-item *ngFor="let message of messages">
    <mat-icon matListIcon>folder</mat-icon>
    <h3 matLine> {{message.from}} </h3>
    <p matLine>
      <span> {{message.subject}} </span>
      <span class="demo-2"> -- {{message.content}} </span>
    </p>
  </mat-list-item>
</mat-list>
```

### Lists with avatars

### 带头像的列表

To include an avatar image, add an image tag with an `matListAvatar` attribute. 

要包含一个头像，请添加一个带有 `matListAvatar` 属性的图像标记。

```html
<mat-list>
  <mat-list-item *ngFor="let message of messages">
    <img matListAvatar src="..." alt="...">
    <h3 matLine> {{message.from}} </h3>
    <p matLine>
      <span> {{message.subject}} </span>
      <span class="demo-2"> -- {{message.content}} </span>
    </p>
  </mat-list-item>
</mat-list>
```

### Dense lists

### 密集列表

Lists are also available in "dense layout" mode, which shrinks the font size and height of the list
to suit UIs that may need to display more information. To enable this mode, add a `dense` attribute
to the main `mat-list` tag.

列表还能用在 "密集布局" 模式下，该模式会缩小列表的字体大小和高度，以适应那些需要显示更多信息的 UI。
要启用此模式，请给主标记 `mat-list` 添加 `dense` 属性。

```html
<mat-list dense>
 <mat-list-item> Pepper </mat-list-item>
 <mat-list-item> Salt </mat-list-item>
 <mat-list-item> Paprika </mat-list-item>
</mat-list>
```

### Lists with multiple sections

### 带有多个分区的列表

Subheader can be added to a list by annotating a heading tag with an `matSubheader` attribute. 
To add a divider, use `<mat-divider>`.

可以通过带 `matSubheader` 属性的标题标记来为列表添加子标题。
要想添加分隔符，可以用 `<mat-divider>`。

```html
<mat-list>
   <h3 matSubheader>Folders</h3>
   <mat-list-item *ngFor="let folder of folders">
      <mat-icon matListIcon>folder</mat-icon>
      <h4 matLine>{{folder.name}}</h4>
      <p matLine class="demo-2"> {{folder.updated}} </p>
   </mat-list-item>
   <mat-divider></mat-divider>
   <h3 matSubheader>Notes</h3>
   <mat-list-item *ngFor="let note of notes">
      <mat-icon matListIcon>note</mat-icon>
      <h4 matLine>{{note.name}}</h4>
      <p matLine class="demo-2"> {{note.updated}} </p>
   </mat-list-item>
</mat-list>
```

### Accessibility

### 无障碍性

Angular Material offers multiple varieties of list so that you can choose the type that best applies
to your use-case.

Angular Material 提供了多种列表，以便你可以选择最适合你的用例的那种。

#### Navigation

#### 导航

You should use `MatNavList` when every item in the list is an anchor that navigate to another URL.
The root `<mat-nav-list>` element sets `role="navigation"` and should contain only anchor elements
with the `mat-list-item` attribute. You should not nest any interactive elements inside these
anchors, including buttons and checkboxes. 

当列表中的每个项目都是导航到另一个 URL 的锚点时，你应该使用 `MatNavList` 。根 `<mat-nav-list>` 元素会设置 `role="navigation"` 并且应该只包含具有 `mat-list-item` 属性的锚点元素。你不应在这些锚点内嵌套任何交互元素，包括按钮和复选框。

Always provide an accessible label for the `<mat-nav-list>` element via `aria-label` or
`aria-labelledby`.

始终通过 `aria-label` 或 `aria-labelledby` 为 `<mat-nav-list>` 元素提供无障碍标签。

#### Selection

#### 选取结果

You should use `MatSelectionList` and `MatListOption` for lists that allow the user to select one
or more values. This list variant uses the `role="listbox"` interaction pattern, handling all
associated keyboard input and focus management. You should not nest any interactive elements inside
these options, including buttons and anchors. 

对于允许用户选择一个或多个值的列表，你应该使用 `MatSelectionList` 和 `MatListOption` 。此列表变体使用 `role="listbox"` 交互模式，处理所有相关的键盘输入和焦点管理。你不应在这些选项中嵌套任何交互元素，包括按钮和锚点。

Always provide an accessible label for the `<mat-selection-list>` element via `aria-label` or
`aria-labelledby` that describes the selection being made.

始终通过 `aria-label` 或 `aria-labelledby` 为 `<mat-selection-list>` 元素提供一个无障碍标签，以描述正在进行的选择。

#### Custom scenarios

#### 自定义方案

By default, the list assumes that it will be used in a purely decorative fashion and thus sets no
roles, ARIA attributes, or keyboard shortcuts. This is equivalent to having a sequence of `<div>`
elements on the page. Any interactive content within the list should be given an appropriate
accessibility treatment based on the specific workflow of your application.

默认情况下，列表组件假定自己是纯装饰性的，因此不设置任何角色、ARIA 属性或键盘快捷键。
这相当于页面上有一系列 `<div>` 元素。列表内部的任何交互式内容都应该根据应用程序的特定工作流进行适当的无障碍性处理。

If the list is used to present a list of non-interactive content items, then the list element should
be given `role="list"` and each list item should be given `role="listitem"`.

如果列表组件用于渲染非交互式内容项的列表，那么列表元素应该带有 `role="list"` 属性，并且每个列表条目都应该带有 `role="listitem"` 属性。
