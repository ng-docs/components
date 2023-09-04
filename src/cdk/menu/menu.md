The `@angular/cdk/menu` module provides directives to help create custom menu
interactions based on the [WAI ARIA specification][aria].

`@angular/cdk/menu` 模块提供了一些指令来帮助创建基于 [WAI ARIA 规范][aria] 的自定义菜单交互。

By using `@angular/cdk/menu` you get all of the expected behaviors for an accessible
experience, including bidi layout support, keyboard interaction, and focus management. All
directives apply their associated ARIA roles to their host element.

通过使用 `@angular/cdk/menu` ，你可以获得无障碍化的所有预期行为，包括双向布局支持、键盘交互和焦点管理。所有指令都会将其关联的 ARIA 角色应用于其宿主元素。

### Supported ARIA Roles

### 支持的 ARIA 角色

The directives in `@angular/cdk/menu` set the appropriate roles on their host element.

`@angular/cdk/menu` 中的指令在其宿主元素上设置适当的角色。

| Directive           | ARIA Role        |
| ------------------- | ---------------- |
| 指令                | ARIA 角色        |
| CdkMenuBar          | menubar          |
| CdkMenu             | menu             |
| CdkMenuGroup        | group            |
| CdkMenuItem         | menuitem         |
| CdkMenuItemRadio    | menuitemradio    |
| CdkMenuItemCheckbox | menuitemcheckbox |
| CdkMenuTrigger      | button           |

### CSS Styles and Classes

### CSS 样式和类

The `@angular/cdk/menu` is designed to be highly customizable to your needs. It therefore does not
make any assumptions about how elements should be styled. You are expected to apply any required
CSS styles, but the directives do apply CSS classes to make it easier for you to add custom styles.
The available CSS classes are listed below, by directive.

`@angular/cdk/menu` 旨在根据你的需求高度定制。因此，它不对元素的样式做出任何假设。你可以应用任何所需的 CSS 样式，但这些指令确实应用了一些 CSS 类，以便你更轻松地添加自定义样式。下面按指令列出了可用的 CSS 类。

| Directive             | CSS Class                | Applied...                                     |
| :-------------------- | ------------------------ | ---------------------------------------------- |
| 指令                  | CSS 类                   | 何时应用                                       |
| `cdkMenu`             | `cdk-menu`               | Always                                         |
| `cdkMenu`             | `cdk-menu`               | 总是                                           |
| `cdkMenu`             | `cdk-menu-inline`        | If the menu is an [inline menu](#menu-content) |
| `cdkMenu`             | `cdk-menu-inline`        | 如果菜单是[内联菜单](#menu-content)            |
| `cdkMenuBar`          | `cdk-menu-bar`           | Always                                         |
| `cdkMenuBar`          | `cdk-menu-bar`           | 总是                                           |
| `cdkMenuGroup`        | `cdk-menu-group`         | Always                                         |
| `cdkMenuGroup`        | `cdk-menu-group`         | 总是                                           |
| `cdkMenuItem`         | `cdk-menu-item`          | Always                                         |
| `cdkMenuItem`         | `cdk-menu-item`          | 总是                                           |
| `cdkMenuItemCheckbox` | `cdk-menu-item`          | Always                                         |
| `cdkMenuItemCheckbox` | `cdk-menu-item`          | 总是                                           |
| `cdkMenuItemCheckbox` | `cdk-menu-item-checkbox` | Always                                         |
| `cdkMenuItemCheckbox` | `cdk-menu-item-checkbox` | 总是                                           |
| `cdkMenuItemRadio`    | `cdk-menu-item`          | Always                                         |
| `cdkMenuItemRadio`    | `cdk-menu-item`          | 总是                                           |
| `cdkMenuItemRadio`    | `cdk-menu-item-radio`    | Always                                         |
| `cdkMenuItemRadio`    | `cdk-menu-item-radio`    | 总是                                           |
| `cdkMenuTriggerFor`   | `cdk-menu-trigger`       | Always                                         |
| `cdkMenuTriggerFor`   | `cdk-menu-trigger`       | 总是                                           |

### Getting started

### 快速上手

Import the `CdkMenuModule` into the `NgModule` in which you want to create menus. You can then apply
menu directives to build your custom menu. A typical menu consists of the following directives:

将 `CdkMenuModule` 导入要在其中创建菜单的 `NgModule` 。然后，你可以应用菜单指令来构建你的自定义菜单。典型的菜单包含以下指令：

- `cdkMenuTriggerFor` - links a trigger element to an `ng-template` containing the menu to be opened

  `cdkMenuTriggerFor` - 将触发器元素链接到包含要打开的菜单的 `ng-template`

- `cdkMenu` - creates the menu content opened by the trigger

  `cdkMenu` - 创建由触发器打开的菜单内容

- `cdkMenuItem` - added to each item in the menu

  `cdkMenuItem` - 添加到菜单中的每个菜单项

<!-- example({
  "example": "cdk-menu-standalone-menu",
  "file": "cdk-menu-standalone-menu-example.html"
  }) -->

Most menu interactions consist of two parts: a trigger and a menu panel.

大多数菜单交互由两部分组成：触发器和菜单面板。

#### Triggers

#### 触发器

You can add `cdkMenuTriggerFor` to any button to make it a trigger for the given menu, or any menu
item to make it a trigger for a submenu. When adding this directive, be sure to pass a reference to
the template containing the menu it should open. Users can toggle the associated menu using a mouse
or keyboard.

你可以将 `cdkMenuTriggerFor` 添加到任何按钮上以使其成为给定菜单的触发器，或者添加到任何菜单项上使其成为子菜单的触发器。添加此指令时，请务必传递对包含它要打开的菜单模板的引用。用户可以使用鼠标或键盘切换相关菜单。

<!-- example({"example":"cdk-menu-standalone-menu",
              "file":"cdk-menu-standalone-menu-example.html",
              "region":"trigger"}) -->

When creating a submenu trigger, add both `cdkMenuItem` and `cdkMenuTriggerFor` like so,

创建子菜单触发器时，像这样添加 `cdkMenuItem` 和 `cdkMenuTriggerFor` ，

<!-- example({"example":"cdk-menu-menubar",
              "file":"cdk-menu-menubar-example.html",
              "region":"file-trigger"}) -->

#### Menu content

#### 菜单内容

There are two types of menus:

有两种类型的菜单：

* _inline menus_ are always present on the page

  *内联菜单*始终出现在页面上

* _pop-up menus_ can be toggled to hide or show by the user

  *弹出菜单*可以由用户切换以隐藏或显示

You can create menus by marking their content element with the `cdkMenu` or `cdkMenuBar`
directives. You can create several types of menu interaction which are discussed below.

你可以通过使用 `cdkMenu` 或 `cdkMenuBar` 指令标记其内容元素来创建菜单。你可以创建下面要讨论的这几种类型的菜单交互。

All type of menus should exclusively contain elements with role `menuitem`, `menuitemcheckbox`,
`menuitemradio`, or `group`. Supporting directives that automatically apply these roles are
discussed below.

所有类型的菜单都应仅包含具有 `menuitem` 、 `menuitemcheckbox` 、 `menuitemradio` 或 `group` 角色的元素。下面讨论自动应用这些角色的支持指令。

Note that Angular CDK provides no styles; you must add styles as part of building your custom menu.

请注意，Angular CDK 不提供样式；你必须添加样式作为构建自定义菜单的一部分。

### Inline Menus

### 内联菜单

An _inline menu_ is a menu that lives directly on the page rather than in a pop-up associated with a
trigger. You can use an inline menu when you want a persistent menu interaction on a page. Menu
items within an inline menus are logically grouped together, and you can navigate through them
using your keyboard. You can create an inline menu by adding the `cdkMenu` directive to the element
you want to serve as the menu content.

*内联菜单*是直接存在于页面上而不是与触发器关联的弹出窗口中的菜单。当你想要在页面上进行持久菜单交互时，可以使用内联菜单。内联菜单中的菜单项在逻辑上分组在一起，你可以使用键盘浏览它们。你可以通过将 `cdkMenu` 指令添加到要用作菜单内容的元素来创建内联菜单。

<!-- example({
  "example": "cdk-menu-inline",
  "file": "cdk-menu-inline-example.html"
  }) -->

### Pop-up Menus

### 弹出菜单

You can create pop-up menus using the `cdkMenu` directive as well. Add this directive to the
element you want to serve as the content for your pop-up menu. Then wrap the content element in an
`ng-template` and reference the template from the `cdkMenuTriggerFor` property of the trigger. This
will allow the trigger to show and hide the menu content as needed.

你也可以使用 `cdkMenu` 指令创建弹出菜单。将此指令添加到要用作弹出菜单内容的元素。然后将内容元素包装在 `ng-template` 中，并从触发器的 `cdkMenuTriggerFor` 属性中引用该模板。这将允许触发器根据需要显示和隐藏菜单内容。

<!-- example({
  "example": "cdk-menu-standalone-menu",
  "file": "cdk-menu-standalone-menu-example.html"
  }) -->

### Menu Bars

### 菜单栏

Menu bars are a type of inline menu that you can create using the `cdkMenuBar` directive. They
follow the [ARIA menubar][menubar] spec and behave similarly to a desktop application menubar. Each
bar consists of at least one `cdkMenuItem` that triggers a submenu.

菜单栏是一种内联菜单，你可以使用 `cdkMenuBar` 指令创建它。它们遵循 [ARIA 菜单栏][menubar] 规范，其行为类似于桌面应用程序菜单栏。每个栏至少包含一个触发子菜单的 `cdkMenuItem` 。

<!-- example({
  "example": "cdk-menu-menubar",
  "file": "cdk-menu-menubar-example.html"
  }) -->

### Context Menus

### 上下文菜单

A context menus is a type of pop-up menu that doesn't have a traditional trigger element, instead
it is triggered when a user right-clicks within some container element. You can mark a
container element with the `cdkContextMenuTriggerFor`, which behaves like `cdkMenuTriggerFor` except
that it responds to the browser's native `contextmenu` event. Custom context menus appear next to
the cursor, similarly to native context menus.

上下文菜单是一种弹出菜单类型，它没有传统的触发元素，而是在用户在某个容器元素中右键单击时触发。你可以使用 `cdkContextMenuTriggerFor` 标记容器元素，其行为类似于 `cdkMenuTriggerFor` ，只是它响应浏览器的原生 `contextmenu` 事件。自定义上下文菜单出现在光标旁边，类似于原生上下文菜单。

<!-- example({
  "example": "cdk-menu-context",
  "file": "cdk-menu-context-example.html"
  }) -->

You can nest context menu container elements. Upon right-click, the menu associated with the closest
container element will open.

你可以嵌套上下文菜单的容器元素。右键单击后，与最近的容器元素关联的菜单将打开。

<!-- example({
  "example": "cdk-menu-nested-context",
  "file": "cdk-menu-nested-context-example.html",
  "region": "triggers"
  }) -->

In the example above, right-clicking on "Inner context menu" will open up the "inner" menu and
right-clicking inside "Outer context menu" will open up the "outer" menu.

在上面的示例中，右键单击“Inner context menu”将打开“内部”菜单，右键单击“Outer context menu”将打开“外部”菜单。

### Menu Items

### 菜单项

The `cdkMenuItem` directive allows users to navigate menu items via keyboard.
You can add a custom action to a menu item with the `cdkMenuItemTriggered` output.

`cdkMenuItem` 指令允许用户通过键盘导航菜单项。你可以使用 `cdkMenuItemTriggered` 输出向菜单项添加自定义操作。

<!-- example({"example":"cdk-menu-standalone-stateful-menu",
              "file":"cdk-menu-standalone-stateful-menu-example.html",
              "region":"reset-item"}) -->

You can create nested menus by using a menu item as the trigger for another menu.

你可以通过使用一个菜单项作为另一个菜单的触发器来创建嵌套菜单。

<!-- example({"example":"cdk-menu-menubar",
              "file":"cdk-menu-menubar-example.html",
              "region":"file-trigger"}) -->

#### Menu Item Checkboxes

#### 复选菜单项

A `cdkMenuItemCheckbox` is a special type of menu item that behaves as a checkbox. You can use this
type of menu item to toggle items on and off. An element with the `cdkMenuItemCheckbox` directive
does not need the additional `cdkMenuItem` directive.

`cdkMenuItemCheckbox` 是一种特殊类型的菜单项，其行为类似于复选框。你可以使用这种类型的菜单项来打开和关闭菜单项。带有 `cdkMenuItemCheckbox` 指令的元素不需要额外的 `cdkMenuItem` 指令。

Checkbox items do not track their own state. You must bind the checked state using the
`cdkMenuItemChecked` input and listen to `cdkMenuItemTriggered` to know when it is toggled. If you
don't bind the state it will reset when the menu is closed and re-opened.

复选菜单项不跟踪它们自己的状态。你必须使用 `cdkMenuItemChecked` 输入属性来绑定选中状态，并监听 `cdkMenuItemTriggered` 以了解它何时切换。如果你不绑定状态，它将在菜单关闭并重新打开时重置。

<!-- example({"example":"cdk-menu-standalone-stateful-menu",
              "file":"cdk-menu-standalone-stateful-menu-example.html",
              "region":"bold-item"}) -->

#### Menu Item Radios

#### 单选菜单项

A `cdkMenuItemRadio` is a special type of menu item that behaves as a radio button. You can use this
type of menu item for menus with exclusively selectable items. An element with the `cdkMenuItemRadio`
directive does not need the additional `cdkMenuItem` directive.

`cdkMenuItemRadio` 是一种特殊类型的菜单项，其行为类似于单选按钮。你可以将这种类型的菜单项用于具有唯一可选菜单项的菜单。带有 `cdkMenuItemRadio` 指令的元素不需要额外的 `cdkMenuItem` 指令。

As with checkbox items, radio items do not track their own state, but you can track it by binding
`cdkMenuItemChecked` and listening for `cdkMenuItemTriggered`. If you do not bind the state the
selection will reset when the menu is closed and reopened.

与复选菜单项一样，单选菜单项不会跟踪它们自己的状态，但你可以通过绑定 `cdkMenuItemChecked` 并监听 `cdkMenuItemTriggered` 来跟踪它。如果你不绑定状态，则在关闭并重新打开菜单时选择将重置。

<!-- example({"example":"cdk-menu-standalone-stateful-menu",
              "file":"cdk-menu-standalone-stateful-menu-example.html",
              "region":"size-items"}) -->

#### Groups

#### 菜单组

By default `cdkMenu` acts as a group for `cdkMenuItemRadio` elements. Elements with
`cdkMenuItemRadio` added as children of a `cdkMenu` will be logically grouped and only a single item
can have the checked state.

默认情况下， `cdkMenu` 会充当 `cdkMenuItemRadio` 元素的组。添加为 `cdkMenu` 子项的带有 `cdkMenuItemRadio` 的元素将在逻辑上视为一组，并且只有一个菜单项可以具有选中状态。

If you would like to have unrelated groups of radio buttons within a single menu you should use the
`cdkMenuGroup` directive.

如果你想在单个菜单中包含不相关的多个单选组，你应该使用 `cdkMenuGroup` 指令。

<!-- example({
  "example": "cdk-menu-standalone-stateful-menu",
  "file": "cdk-menu-standalone-stateful-menu-example.html"
  }) -->

### Smart Menu Aim

### 智能菜单瞄准

`@angular/cdk/menu` is capable of intelligently predicting when a user intends to navigate to an
open submenu and preventing premature closeouts. This functionality prevents users from having to
hunt through the open menus in a maze-like fashion to reach their destination. To enable this
feature for a menu and its sub-menus, add the `cdkMenuTargetAim` directive to the `cdkMenu` or
`cdkMenuBar` element.

`@angular/cdk/menu` 能够智能地预测用户何时打算导航到打开的子菜单并防止过早关闭。此功能可防止用户不得不以迷宫般的方式在打开的菜单中寻找到达目的地。要为菜单及其子菜单启用此功能，请将 `cdkMenuTargetAim` 指令添加到 `cdkMenu` 或 `cdkMenuBar` 元素。

![menu aim diagram][diagram]

As demonstrated in the diagram above we first track the user's mouse movements within a menu. Next,
when a user mouses into a sibling menu item (e.g. Share button) the sibling item asks the Menu Aim
service if it can perform its close actions. In order to determine if the current submenu can be
closed out, the Menu Aim service calculates the slope between a selected target coordinate in the
submenu and the previous mouse point, and the slope between the target and the current mouse point.
If the slope of the current mouse point is greater than the slope of the previous that means the
user is moving towards the submenu, so we shouldn't close out. Users however may sometimes stop
short in a sibling item after moving towards the submenu. The service is intelligent enough to
detect this intention and will trigger the next menu.

如上图所示，我们首先在菜单中跟踪用户的鼠标移动。接下来，当用户将鼠标移入同级菜单项（例如共享按钮）时，同级菜单项会询问 Menu Aim 服务是否可以执行其关闭操作。为了确定当前子菜单是否可以关闭，Menu Aim 服务会计算子菜单中选定目标坐标与前一个鼠标点之间的斜率，以及目标与当前鼠标点之间的斜率。如果当前鼠标点的斜率大于前一个的斜率，则意味着用户正在向子菜单移动，所以我们不应该关闭。然而，用户有时可能会在移动到子菜单后停止在同级菜单项中。该服务足够智能，可以检测到这种意图并触发下一个菜单。

### Accessibility

### 无障碍性

The set of directives defined in `@angular/cdk/menu` follow accessibility best practices as defined
in the [ARIA spec][menubar]. Specifically, the menus are aware of left-to-right and right-to-left
layouts and opened appropriately. You should however add any necessary CSS styles. Menu items should
always have meaningful labels, whether through text content, `aria-label`, or `aria-labelledby`.
Finally, keyboard interaction is supported as defined in the [ARIA menubar keyboard interaction spec][keyboard].

`@angular/cdk/menu` 中定义的指令集遵循 [ARIA 规范][menubar] 中定义的无障碍性最佳实践。具体来说，菜单知道从左到右和从右到左的布局并正确打开。但是，你应该添加任何必要的 CSS 样式。菜单项应始终具有有意义的标签，无论是通过文本内容、 `aria-label` 还是 `aria-labelledby` 。最后，它还支持 [ARIA 菜单栏键盘交互规范][keyboard]中定义的键盘交互。

<!-- links -->

[aria]: https://www.w3.org/TR/wai-aria-1.1/ "ARIA Spec"

[menubar]: https://www.w3.org/TR/wai-aria-practices-1.1/#menu "ARIA Menubar Pattern"

[keyboard]: https://www.w3.org/TR/wai-aria-practices-1.1/#keyboard-interaction-12 "ARIA Menubar Keyboard Interaction"

[diagram]: https://material.angular.io/assets/img/menuaim.png "Menu Aim Diagram"
