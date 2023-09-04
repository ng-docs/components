Angular Material tabs organize content into separate views where only one view can be
visible at a time. Each tab's label is shown in the tab header and the active
tab's label is designated with the animated ink bar. When the list of tab labels exceeds the width
of the header, pagination controls appear to let the user scroll left and right across the labels.

Angular Material 的选项卡（tabs）把内容拆分成几个视图，而同一时刻只有一个视图可见。
每个选项卡（tab）的标签都显示在其头部，而激活选项卡的标签通过一个带动画效果的墨水条（ink bar）标记出来。
当选项卡标签的列表超出了标题的宽度时，就会出现一个分页器，让用户可以向左或向右滚动这些标签。

The active tab may be set using the `selectedIndex` input or when the user selects one of the
tab labels in the header.

可以通过输入属性 `selectedIndex` 来设置激活选项卡，也可以由用户在标题中选取一个选项卡的标签来设置。

<!-- example(tab-group-basic) -->

### Events

### 事件

The `selectedTabChange` output event is emitted when the active tab changes.

当激活选项卡发生变化时，会发出一个事件 `selectedTabChange`。

The `focusChange` output event is emitted when the user puts focus on any of the tab labels in
the header, usually through keyboard navigation.

当用户（通常是用键盘导航的方式）把焦点移到头中的任何一个选项卡的标签上时，就会发出一个 `focusChange` 事件。

### Labels

### 标签

If a tab's label is only text then the simple tab-group API can be used.

如果选项卡的标签是纯文本，那么可以使用简单的选项卡组（tab-group） API。

<!-- example({"example": "tab-group-basic",
              "file": "tab-group-basic-example.html"}) -->

For more complex labels, add a template with the `mat-tab-label` directive inside the `mat-tab`.

对于更复杂的标签，可以在 `mat-tab` 中用 `mat-tab-label` 指令来添加一个模板。

<!-- example({"example": "tab-group-custom-label",
              "file": "tab-group-custom-label-example.html",
              "region": "label-directive"}) -->

### Dynamic Height

### 动态高度

By default, the tab group will not change its height to the height of the currently active tab. To
change this, set the `dynamicHeight` input to true. The tab body will animate its height according
 to the height of the active tab.

默认情况下，选项卡组不会把自己的高度调整为当前激活选项卡的高度。如果要改成自动调整的，请把输入属性 `dynamicHeight` 设置为 `true`。
选项卡的卡体会以动画形式把它的高度调整成激活页的高度。

 <!-- example({"example": "tab-group-dynamic-height",
               "file": "tab-group-dynamic-height-example.html",
               "region": "dynamic-height"}) -->

### Tabs and navigation

### 选项卡与导航

While `<mat-tab-group>` is used to switch between views within a single route, `<nav mat-tab-nav-bar>`
provides a tab-like UI for navigating between routes.

`<mat-tab-group>` 用于在单个路由中切换视图，而 `<nav mat-tab-nav-bar>` 提供了一种标签式的 UI，用于在路由之间进行导航。

 <!-- example({"example": "tab-nav-bar-basic",
               "file": "tab-nav-bar-basic-example.html",
               "region": "mat-tab-nav"}) -->

The `mat-tab-nav-bar` is not tied to any particular router; it works with normal `<a>` elements and
uses the `active` property to determine which tab is currently active. The corresponding
`<router-outlet>` must be wrapped in an `<mat-tab-nav-panel>` component and should typically be
placed relatively close to the `mat-tab-nav-bar` (see [Accessibility](#accessibility)).

`mat-tab-nav-bar` 不会绑定到任何特定的路由器；它适用于普通 `<a>` 元素并使用 `active` 属性来确定当前哪个选项卡处于活动状态。相应的 `<router-outlet>` 必须包裹在 `<mat-tab-nav-panel>` 组件中，并且通常应放置在相对靠近 `mat-tab-nav-bar` 的位置（请参阅[无障碍性](#accessibility)）。

### Lazy Loading

### 惰性加载

By default, the tab contents are eagerly loaded. Eagerly loaded tabs
will initalize the child components but not inject them into the DOM
until the tab is activated.

默认情况下，选项卡的内容是立即加载的。立即加载的选项卡会初始化其子组件，但在该选项卡激活之前不会把它插入到 DOM 中。

If the tab contains several complex child components or the tab's contents
rely on DOM calculations during initialization, it is advised
to lazy load the tab's content.

如果该选项卡包含一些复杂的子组件，或者该选项卡的内容在初始化期间依赖于对 DOM 的某些计算，则建议惰性加载该选项卡的内容。

Tab contents can be lazy loaded by declaring the body in a `ng-template`
with the `matTabContent` attribute.

通过在 `ng-template` 上使用 `matTabContent` 属性来声明卡体，可以惰性加载选项卡的内容。

 <!-- example({"example": "tab-group-lazy-loaded",
               "file": "tab-group-lazy-loaded-example.html",
               "region": "mat-tab-content"}) -->

### Label alignment

### 标签对齐

If you want to align the tab labels in the center or towards the end of the container, you can
do so using the `[mat-align-tabs]` attribute.

如果要把选项卡标签对齐到中间或容器的两端，你还可以使用 `[mat-align-tabs]` 属性。

 <!-- example({"example": "tab-group-align",
               "file": "tab-group-align-example.html",
               "region": "align-start"}) -->

### Controlling the tab animation

### 控制选项卡的动画

You can control the duration of the tabs' animation using the `animationDuration` input. If you
want to disable the animation completely, you can do so by setting the properties to `0ms`. The
duration can be configured globally using the `MAT_TABS_CONFIG` injection token.

你可以通过输入参数 `animationDuration` 来控制选项卡动画的持续时间。如果想完全禁用动画，你可以把该属性设置为 `0ms`。这个持续时间可以通过注入 `MAT_TABS_CONFIG` 令牌来进行全局配置。

 <!-- example({"example": "tab-group-animations",
               "file": "tab-group-animations-example.html",
               "region": "slow-animation-duration"}) -->

### Keeping the tab content inside the DOM while it's off-screen

### 将标签内容保留在 DOM 中，即使它在屏幕外

By default the `<mat-tab-group>` will remove the content of off-screen tabs from the DOM until they
come into the view. This is optimal for most cases since it keeps the DOM size smaller, but it
isn't great for others like when a tab has an `<audio>` or `<video>` element, because the content
will be re-initialized whenever the user navigates to the tab. If you want to keep the content of
off-screen tabs in the DOM, you can set the `preserveContent` input to `true`.

默认情况下， `<mat-tab-group>` 将从 DOM 中删除屏幕外选项卡的内容，直到它们进入视图。这对于大多数情况来说是最佳的，因为它可以保持 DOM 的大小更小，但对于其他情况（例如某个选项卡具有 `<audio>` 或 `<video>` 元素）来说，这并不是很好，因为每当用户导航到时内容都会重新初始化选项卡。如果要在 DOM 中保留屏幕外选项卡的内容，可以将 `preserveContent` 输入属性设置为 `true` 。

<!-- example(tab-group-preserve-content) -->

### Accessibility

### 无障碍性

`MatTabGroup` and `MatTabNavBar` both implement the
[ARIA Tabs design pattern](https://www.w3.org/TR/wai-aria-practices-1.1/#tabpanel). Both components
compose `tablist`, `tab`, and `tabpanel` elements with handling for keyboard inputs and focus
management.

`MatTabGroup` 和 `MatTabNavBar` 都实现了 [ARIA Tabs 设计模式](https://www.w3.org/TR/wai-aria-practices-1.1/#tabpanel)。这两个组件组合了 `tablist` 、 `tab` 和 `tabpanel` 元素，并负责处理键盘输入和焦点管理。

When using `MatTabNavBar`, you should place the `<mat-tab-nav-panel>` component relatively close to
if not immediately adjacent to the `<nav mat-tab-nav-bar>` component so that it's easy for screen
reader users to identify the association.

使用 `MatTabNavBar` 时，你应该将 `<mat-tab-nav-panel>` 组件放置在相对靠近（如果不是紧邻） `<nav mat-tab-nav-bar>` 组件的位置，以便屏幕阅读器用户可以轻松识别关联.

#### Labels

#### 标签

Always provide an accessible label via `aria-label` or `aria-describedby` for tabs without
descriptive text content.

始终通过 `aria-label` 或 `aria-describedby` 为没有描述性文本内容的选项卡提供无障碍标签。

When using `MatTabNavGroup`, always specify a label for the `<nav>` element.

使用 `MatTabNavGroup` 时，始终为 `<nav>` 元素指定标签。

#### Keyboard interaction

#### 键盘交互

`MatTabGroup` and `MatTabNavBar` both implement the following keyboard interactions:

`MatTabGroup` 和 `MatTabNavBar` 都实现了以下键盘交互。

| Shortcut           | Action                     |
| ------------------ | -------------------------- |
| 快捷键             | 操作                       |
| `LEFT_ARROW`       | Move focus to previous tab |
| `LEFT_ARROW`       | 把焦点移到前一个选项卡     |
| `RIGHT_ARROW`      | Move focus to next tab     |
| `RIGHT_ARROW`      | 把焦点移到后一个选项卡     |
| `HOME`             | Move focus to first tab    |
| `HOME`             | 把焦点移到第一个选项卡     |
| `END`              | Move focus to last tab     |
| `END`              | 把焦点移到最后一个选项卡   |
| `SPACE` or `ENTER` | Switch to focused tab      |
| `SPACE` 或 `ENTER` | 切换到当前有焦点的选项卡   |
