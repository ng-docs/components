`<mat-menu>` is a floating panel containing list of options.

`<mat-menu>` 是一个包含选项列表的浮动面板。

<!-- example(menu-overview) -->

By itself, the `<mat-menu>` element does not render anything. The menu is attached to and opened
via application of the `matMenuTriggerFor` directive:

`<mat-menu>` 元素本身不会渲染任何东西。要用 `matMenuTriggerFor` 指令来附着到所属元素并打开此菜单：

<!-- example({"example": "menu-overview",
              "file": "menu-overview-example.html",
              "region": "mat-menu-trigger-for"}) -->

### Toggling the menu programmatically

### 以编程方式切换菜单

The menu exposes an API to open/close programmatically. Please note that in this case, an
`matMenuTriggerFor` directive is still necessary to attach the menu to a trigger element in the DOM.

菜单对外暴露了一个 API，用于以编程的方式打开/关闭它。注意，在这种情况下，仍然必须用 `matMenuTriggerFor` 来把菜单附着到 DOM 中的某个触发器元素上。

```ts
class MyComponent {
  @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;

  someMethod() {
    this.trigger.openMenu();
  }
}
```

### Icons

### 图标

Menus support displaying `mat-icon` elements before the menu item text.

菜单支持在菜单项的文本之前显示 `mat-icon` 元素上。

<!-- example({"example": "menu-icons",
              "file": "menu-icons-example.html"}) -->

### Customizing menu position

### 自定义菜单位置

By default, the menu will display below (y-axis), after (x-axis), without overlapping
its trigger. The position can be changed using the `xPosition` (`before | after`) and `yPosition`
(`above | below`) attributes. The menu can be forced to overlap the trigger using the
`overlapTrigger` attribute.

默认情况下，菜单将会显示在触发器的下方（Y 轴）、后方（X 轴）并与触发器元素重叠。
此位置可以使用 `xPosition` (`before | after`) 和 `yPosition` (`above | below`) 属性进行修改。
还可以用 `[overlapTrigger]="false"` 属性来强迫菜单不要与触发器重叠。

<!-- example({"example": "menu-position",
              "file": "menu-position-example.html",
              "region": "menu-position"}) -->

### Nested menu

### 内嵌菜单

Material supports the ability for an `mat-menu-item` to open a sub-menu. To do so, you have to define
your root menu and sub-menus, in addition to setting the `[matMenuTriggerFor]` on the `mat-menu-item`
that should trigger the sub-menu:

Material 支持让 `mat-menu-item` 再打开子菜单。要做到这一点，你要先定义根菜单和子菜单，然后在 `mat-menu-item` 上设置 `[matMenuTriggerFor]` 以触发子菜单：

<!-- example({"example": "menu-nested",
              "file": "menu-nested-example.html",
              "region": "sub-menu"}) -->

### Lazy rendering

### 惰性渲染

By default, the menu content will be initialized even when the panel is closed. To defer
initialization until the menu is open, the content can be provided as an `ng-template`
with the `matMenuContent` attribute:

默认情况下，即使菜单面板是关闭的，其内容也会被初始化。要想等到菜单打开时才进行初始化，可以用一个带 `matMenuContent` 属性的 `ng-template` 来提供其内容：

```html
<mat-menu #appMenu="matMenu">
  <ng-template matMenuContent>
    <button mat-menu-item>Settings</button>
    <button mat-menu-item>Help</button>
  </ng-template>
</mat-menu>

<button mat-icon-button [matMenuTriggerFor]="appMenu">
  <mat-icon>more_vert</mat-icon>
</button>
```

### Passing in data to a menu

### 给菜单传入数据

When using lazy rendering, additional context data can be passed to the menu panel via
the `matMenuTriggerData` input. This allows for a single menu instance to be rendered
with a different set of data, depending on the trigger that opened it:

当使用惰性渲染时，可以通过输入属性 `matMenuTriggerData` 来把额外的上下文数据传给菜单。
这会允许使用不同的数据集渲染同一个菜单实例 —— 取决于在哪个触发器上打开它：

```html
<mat-menu #appMenu="matMenu">
  <ng-template matMenuContent let-name="name">
    <button mat-menu-item>Settings</button>
    <button mat-menu-item>Log off {{name}}</button>
  </ng-template>
</mat-menu>

<button mat-icon-button [matMenuTriggerFor]="appMenu" [matMenuTriggerData]="{name: 'Sally'}">
  <mat-icon>more_vert</mat-icon>
</button>

<button mat-icon-button [matMenuTriggerFor]="appMenu" [matMenuTriggerData]="{name: 'Bob'}">
  <mat-icon>more_vert</mat-icon>
</button>
```

### Keyboard interaction

### 键盘交互

| Keyboard shortcut | Action |
| ----------------- | ------ |
| 键盘快捷键 | 操作 |
| <kbd>Down Arrow</kbd> | Focus the next menu item. |
| <kbd>Down Arrow</kbd> | 聚焦下一个菜单项。 |
| <kbd>Up Arrow</kbd> | Focus the previous menu item. |
| <kbd>Up Arrow</kbd> | 聚焦上一个菜单项。 |
| <kbd>Left Arrow</kbd> | Close the current menu if it is a sub-menu. |
| <kbd>Left Arrow</kbd> | 如果是子菜单，则关闭当前菜单。 |
| <kbd>Right Arrow</kbd> | Opens the current menu item's sub-menu. |
| <kbd>Right Arrow</kbd> | 打开当前菜单项的子菜单。 |
| <kbd>Enter</kbd> | Activate the focused menu item. |
| <kbd>Enter</kbd> | 激活焦点菜单项。 |
| <kbd>Escape</kbd> | Close all open menus. |
| <kbd>Escape</kbd> | 关闭所有打开的菜单。 |

### Accessibility

### 无障碍性

Angular Material's menu component consists of two connected parts: the trigger and the pop-up menu.

Angular Material 的菜单组件由两个相互关连的部分组成：触发器和弹出菜单。

The menu trigger is a standard button element augmented with `aria-haspopup`, `aria-expanded`, and
`aria-controls` to create the relationship to the pop-up panel.

菜单触发器是一个标准按钮元素，增加了 `aria-haspopup` 、 `aria-expanded` 和 `aria-controls`，以创建与弹出面板的联系。

The pop-up menu implements the `role="menu"` pattern, handling keyboard interaction and focus
management. Upon opening, the trigger will focus the first focusable menu item. Upon close, the menu
will return focus to its trigger. Avoid creating a menu in which all items are disabled, instead
hiding or disabling the menu trigger. 

弹出菜单实现了 `role="menu"` 模式，它会处理键盘交互和焦点管理。打开后，触发器将聚焦第一个可聚焦的菜单项。关闭后，菜单会将焦点返回到其触发器。请避免创建会禁用所有条目的菜单，而是隐藏或禁用菜单触发器。

Angular Material does not support the `menuitemcheckbox` or `menuitemradio` roles.

Angular Material 不支持 `menuitemcheckbox` 或 `menuitemradio` 角色。

Always provide an accessible label via `aria-label` or `aria-labelledby` for any menu
triggers or menu items without descriptive text content.

总是要通过 `aria-label` 或 `aria-labelledby` 来为没有描述性文本内容的任何菜单触发器或菜单项提供无障碍标签。

MatMenu should not contain any interactive controls aside from MatMenuItem.
