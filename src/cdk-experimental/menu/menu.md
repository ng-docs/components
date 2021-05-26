The `@angular/cdk-experimental/menu` module provides directives to help create custom menu
interactions based on the [WAI ARIA specification][aria].

`@angular/cdk-experimental/menu` 模块提供了一些指令来帮助你根据 [WAI ARIA 规范][aria]创建自定义菜单交互。

By using `@angular/cdk-experimental/menu` you get all of the expected behaviors for an accessible
experience, including bidi layout support, keyboard interaction, and focus management. All
directives apply their associated ARIA roles to their host element.

通过使用 `@angular/cdk-experimental/menu` 你可以让所有行为满足无障碍性的要求，包括双向布局支持、键盘交互和焦点管理。所有指令都会把它们关联的 ARIA 角色应用到它们的宿主元素上。

### Supported ARIA Roles

### 锁支持的 ARIA 角色

The directives in `@angular/cdk-experimental/menu` set the appropriate roles on their host element.

`@angular/cdk-experimental/menu` 中的指令会在宿主元素上设置相应的角色。

| Directive           | ARIA Role        |
| ------------------- | ---------------- |
| 指令           | ARIA 角色        |
| CdkMenuBar          | menubar          |
| CdkMenu             | menu             |
| CdkMenuGroup        | group            |
| CdkMenuItem         | menuitem         |
| CdkMenuItemRadio    | menuitemradio    |
| CdkMenuItemCheckbox | menuitemcheckbox |

### Getting started

### 快速上手

Import the `CdkMenuModule` into the `NgModule` in which you want to create menus. You can then apply
menu directives to build your custom menu. A typical menu consists of the following directives:

把 `CdkMenuModule` 导入到你要创建菜单的 `NgModule` 中。然后，你可以用这些菜单指令来构建自定义菜单。一个典型的菜单包含以下指令：

- `cdkMenuTriggerFor` - links a trigger button to a menu you intend to open

  `cdkMenuTriggerFor` - 把触发器按钮链接到你要打开的菜单

- `cdkMenuPanel` - wraps the menu and provides a link between the `cdkMenuTriggerFor` and the
  `cdkMenu`

  `cdkMenuPanel` - 包装菜单并提供 `cdkMenuTriggerFor` 和 `cdkMenu` 之间的链接

- `cdkMenu` - the actual menu you want to open

  `cdkMenu` - 要打开的实际菜单

- `cdkMenuItem` - added to each button

  `cdkMenuItem` - 添加到每个按钮

<!-- example({
  "example": "cdk-menu-standalone-menu",
  "file": "cdk-menu-standalone-menu-example.html"
  }) -->

Most menu interactions consist of two parts: a trigger and a menu panel.

大多数菜单交互都由两部分组成：触发器和菜单面板。

#### Triggers

#### 触发器

You must add the `cdkMenuItem` and `cdkMenuTriggerFor` directives to triggers like so,

你必须把 `cdkMenuItem` 和 `cdkMenuTriggerFor` 指令添加到触发器中，就像这样，

```html
<button cdkMenuItem [cdkMenuTriggerFor]="menu">Click me!</button>
```

Adding `cdkMenuItem` gives you keyboard navigation and focus management. Associating a trigger with
a menu is done through the `cdkMenuTriggerFor` directive and you must provide a template reference
variable to it. Once both of these directives are set, you can toggle the associated menu
programmatically, using a mouse or using a keyboard.

添加 `cdkMenuItem` 能让你进行键盘导航和焦点管理。通过 `cdkMenuTriggerFor` 指令就可以把触发器和菜单联系起来，你必须给它提供一个模板引用变量。一旦设置了这两个指令，你就可以用鼠标或键盘或以编程方式切换其关联的菜单。

#### Menu panels

#### 菜单面板

You must wrap pop-up menus with an `ng-template` with the `cdkMenuPanel` directive and a reference
variable which must be of type `cdkMenuPanel`. Further, the `cdkMenu` must also reference the
`cdkMenuPanel`.

你必须使用带有 `cdkMenuPanel` 指令的 `ng-template` 来包装弹出菜单，并且其引用变量必须是 `cdkMenuPanel` 类型的。此外，`cdkMenu` 也必须引用这个 `cdkMenuPanel`。

```html
<ng-template cdkMenuPanel #panel="cdkMenuPanel">
  <div cdkMenu [cdkMenuPanel]="panel">
    <!-- some content -->
  </div>
</ng-template>
```

Note that Angular CDK provides no styles; you must add styles as part of building your custom menu.

注意，Angular CDK 没有提供样式;在构建自定义菜单时，你必须添加一些样式。

### Menu Bars

### 菜单栏

The `CdkMenuBar` directive follows the [ARIA menubar][menubar] spec and behaves similar to a desktop
app menubar. It consists of at least one `CdkMenuItem` which triggers a submenu. A menubar can be
layed out horizontally or vertically (defaulting to horizontal). If the layout changes, you must set
the `orientation` attribute to match in order for the keyboard navigation to work properly and for
menus to open up in the correct location.

`CdkMenuBar` 指令遵循 [ARIA 菜单栏][menubar]规范，其行为类似桌面应用 de 菜单栏。它包括至少一个触发子菜单的 `CdkMenuItem`。菜单栏可以使用水平或垂直布局（默认为水平布局）。如果该布局发生了变化，你必须先设置与之匹配的 `orientation` 属性。这样才能让键盘导航正常工作，并让菜单在正确的位置打开。

<!-- example({
  "example": "cdk-menu-menubar",
  "file": "cdk-menu-menubar-example.html"
  }) -->

### Context Menus

### 上下文菜单

A context menu opens when a user right-clicks within some container element. You can mark a
container element with the `cdkContextMenuTriggerFor`, which behaves like `cdkMenuTriggerFor` except
that it responds to the browser's native `contextmenu` event. Custom context menus appear next to
the cursor, similarly to native context menus.

当用户右键单击某个容器元素时，就会打开一个上下文菜单。`cdkContextMenuTriggerFor` 标记一个容器元素，它的行为类似于 `cdkMenuTriggerFor`，不过它会响应浏览器的原生事件 `contextmenu`。自定义上下文菜单会出现在光标旁边，类似于原生的上下文菜单。

<!-- example({
  "example": "cdk-menu-context",
  "file": "cdk-menu-context-example.html"
  }) -->

You can nest context menu container elements. Upon right-click, the menu associated with the closest
container element will open.

上下文菜单容器元素可以嵌套。右键单击，就会打开与最近的容器元素关联的菜单。

```html
<div [cdkContextMenuTriggerFor]="outer">
  My outer context
  <div [cdkContextMenuTriggerFor]="inner">My inner context</div>
</div>
```

In the example above, right clicking on "My inner context" will open up the "inner" menu and right
clicking inside "My outer context" will open up the "outer" menu.

在上面的例子中，右键单击 "My inner context" 将打开 "inner" 菜单，在 "My outer context" 中右键单击将打开 "outer" 菜单。

### Inline Menus

### 内联菜单

An _inline menu_ is a menu that lives directly on the page rather than a pop-up associated with a
trigger. You can use an inline menu when you want a persistent menu interaction on a page. Menu
items within an inline menus are logically grouped together and you can navigate through them using
your keyboard.

*内联菜单*是一个直接在页面内生成的菜单，而不是一个与触发器关联的弹出窗口。如果要在页面上进行持久的菜单交互，可以使用内联菜单。内联菜单中的菜单项在逻辑上是一个组，你可以用键盘在它们中导航。

<!-- example({
  "example": "cdk-menu-inline",
  "file": "cdk-menu-inline-example.html"
  }) -->

### Menu Items

### 菜单项

Both menu and menubar elements should exclusively contain menuitem elements. This directive allows
the items to be navigated to via keyboard interaction.

menu 和 menubar 元素都应该只包含 menuitem 元素。该指令允许通过键盘交互来在条目间导航。

A menuitem by itself can provide some user defined action by hooking into the `cdkMenuItemTriggered`
output. An example may be a close button which performs some closing logic.

menuitem 通过挂接 `cdkMenuItemTriggered` 的输出属性来提供一些自定义动作。例子之一是关闭按钮，它要执行一些关闭逻辑。

```html
<ng-template cdkMenuPanel #panel="cdkMenuPanel">
  <div cdkMenu [cdkMenuPanel]="panel">
    <button cdkMenuItem (cdkMenuItemTriggered)="closeApp()">Close</button>
  </div>
</ng-template>
```

You can create nested menus by using a menuitem as the trigger for another menu.

你可以使用 menuitem 作为另一个菜单的触发器来创建嵌套菜单。

```html
<ng-template cdkMenuPanel #panel="cdkMenuPanel">
  <div cdkMenu [cdkMenuPanel]="panel">
    <button cdkMenuItem [cdkMenuTriggerFor]="submenu">Open Submenu</button>
  </div>
</ng-template>
```

A menuitem also has two sub-types, neither of which should trigger a menu: CdkMenuItemCheckbox and
CdkMenuItemRadio

menuitem 还有两个子类型，它们都不会触发菜单：`CdkMenuItemCheckbox` 和 `CdkMenuItemRadio`

#### Menu Item Checkboxes

#### 复选菜单项

A `cdkMenuItemCheckbox` is a special type of menuitem that behaves as a checkbox. You can use this
type of menuitem to toggle items on and off. An element with the `cdkMenuItemCheckbox` directive
does not need the additional `cdkMenuItem` directive.

`cdkMenuItemCheckbox` 是一种特殊类型的 menuitem，它的行为类似于复选框。你可以尝试使用这类 menuitem 来打开或关闭这些条目。带有 `cdkMenuItemCheckbox` 指令的元素不需要额外的 `cdkMenuItem` 指令。

#### Menu Item Radios

#### 单选菜单项

A `cdkMenuItemRadio` is a special type of menuitem that behaves as a radio button. You can use this
type of menuitem for menus with exclusively selectable items. An element with the `cdkMenuItemRadio`
directive does not need the additional `cdkMenuItem` directive.

`cdkMenuItemRadio` 是一种特殊类型的 menuitem，它的行为类似于单选按钮。你可以把这种类型的 menuitem 用于排它性的可选条目。带有 `cdkMenuItemRadio` 指令的元素不需要额外的 `cdkMenuItem` 指令。

#### Groups

#### 菜单组

By default `cdkMenu` acts as a group for `cdkMenuItemRadio` elements. Elements with
`cdkMenuItemRadio` added as children of a `cdkMenu` will be logically grouped and only a single item
can have the checked state.

默认情况下，`cdkMenu` 会把多个 `cdkMenuItemRadio` 视为一个组。当把带有 `cdkMenuItemRadio` 的菜单项添加为 `cdkMenu` 的子项时，就会在逻辑上视为一组，只有一个条目可处于选中状态。

If you would like to have unrelated groups of radio buttons within a single menu you should use the
`cdkMenuGroup` directive.

如果你想在单个菜单中使用多个互不相关的单选按钮组，就应该使用 `cdkMenuGroup` 指令。

```html
<ng-template cdkMenuPanel #panel="cdkMenuPanel">
  <div cdkMenu [cdkMenuPanel]="panel">
    <!-- Font size -->
    <div cdkMenuGroup>
      <button cdkMenuItemRadio>Small</button>
      <button cdkMenuItemRadio>Medium</button>
      <button cdkMenuItemRadio>Large</button>
    </div>
    <hr />
    <!-- Paragraph alignment -->
    <div cdkMenuGroup>
      <button cdkMenuItemRadio>Left</button>
      <button cdkMenuItemRadio>Center</button>
      <button cdkMenuItemRadio>Right</button>
    </div>
  </div>
</ng-template>
```

Note however that when the menu is closed and reopened any state is lost. You must subscribe to the
groups `change` output, or to `cdkMenuItemToggled` on each radio item and track changes your self.
Finally, you can provide state for each item using the `checked` attribute.

但请注意，当菜单关闭并重新打开时，任何状态都会丢失。你必须订阅这些组的 `change` 输出，或者订阅每个单选项的 `cdkMenuItemToggled`，并自行追踪其变化。最后，你还可以使用 `checked` 属性来为每个条目提供状态。

<!-- example({
  "example": "cdk-menu-standalone-stateful-menu",
  "file": "cdk-menu-standalone-stateful-menu-example.html"
  }) -->

### Smart Menu Aim

### 智能菜单瞄准（Aim）

`@angular/cdk-experimental/menu` intelligently predicts when a user intends to navigate to an open
submenu and prevent premature closeouts. This functionality prevents users from having to hunt
through the open menus in a maze-like fashion to reach their destination.

`@angular/cdk-experimental/menu` 可以智能地预测用户打算导航到的子菜单，以免过早结束。这种功能可以防止用户用走迷宫的方式浏览打开的菜单才能到达目的地。

![menu aim diagram][diagram]

As demonstrated in the diagram above we first track the user's mouse movements within a menu. Next,
when a user mouses into a sibling menu item (e.g. Share button) the sibling item asks the Menu Aim
service if it can perform its close actions. In order to determine if the current submenu can be
closed out, the Menu Aim service calculates the slope between a selected target coordinate in the
submenu and the previous mouse point, and the slope between the target and the current mouse point.
If the slope of the current mouse point is greater than the slope of the previous that means the
user is moving towards the submenu and we shouldn't close out. Users however may sometimes stop
short in a sibling item after moving towards the submenu. The service is intelligent enough the
detect this intention and will trigger the next menu.

如上图所示，我们首先在菜单中跟踪用户的鼠标移动。接下来，当用户将鼠标停留在同级菜单项（例如，Share 按钮）中时，同级项会询问 Menu Aim 服务是否可以执行其关闭动作。为了确定当前子菜单是否可以关闭，Menu Aim 服务会计算子菜单中所选目标坐标和前一个鼠标点之间的斜率，以及目标和当前鼠标点之间的斜率。如果当前鼠标点的斜率大于之前的斜率，则意味着该用户正在朝着该子菜单移动，我们不应该关闭它。然而，用户有时也可能会在移动到子菜单后停留在同级条目中。该服务非常智能，可以检测到这个意图并触发下一个菜单。

### Accessibility

### 无障碍性

The set of directives defined in `@angular/cdk-experimental/menu` follow accessibility best
practices as defined in the [ARIA spec][menubar]. Specifically, the menus are aware of left-to-right
and right-to-left layouts and opened appropriately. You should however add any necessary CSS styles.
Menu items should always have meaningful labels, whether through text content, `aria-label`, or
`aria-labelledby`. Finally, keyboard interaction is supported as defined in the [ARIA menubar
keyboard interaction spec][keyboard].

`@angular/cdk-experimental/menu` 定义的指令集遵循 [ARIA 规范][menubar]中定义的无障碍性最佳实践。具体来说，菜单会注意到从左到右和从右到左的布局并以适当的方式打开。但是你应该添加任何必要的 CSS 样式。菜单项应该总是带着有意义的标签，无论是通过文本内容，`aria-label` 还是 `aria-labelledby`。最后，要支持 [ARIA 菜单栏键盘交互规范][keyboard]中所定义的键盘交互。

<!-- links -->

[aria]: https://www.w3.org/TR/wai-aria-1.1/ 'ARIA Spec'
[menubar]: https://www.w3.org/TR/wai-aria-practices-1.1/#menu 'ARIA Menubar Pattern'
[keyboard]:
  https://www.w3.org/TR/wai-aria-practices-1.1/#keyboard-interaction-12
  'ARIA Menubar Keyboard Interaction'
[diagram]: menuaim.png 'Menu Aim Diagram'
