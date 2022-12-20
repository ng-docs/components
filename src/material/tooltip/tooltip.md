The Angular Material tooltip provides a text label that is displayed when the user hovers
over or longpresses an element.

Angular Material 提示框提供了一种文本标签，当用户的鼠标悬停或长按某个元素时，它就会显示出来。

<!-- example(tooltip-overview) -->

### Positioning

### 定位

The tooltip will be displayed below the element but this can be configured using the
`matTooltipPosition` input.
The tooltip can be displayed above, below, left, or right of the element. By default the position
will be below. If the tooltip should switch left/right positions in an RTL layout direction, then
the positions `before` and `after` should be used instead of `left` and `right`, respectively.

提示框将会显示在本元素的下方，但可以使用输入属性 `matTooltipPosition` 进行配置。
提示框可以显示在元素的上方、下方、左侧或右侧，默认是下方。如果希望该提示框在 RTL 布局下自动调换左右位置，则应该用 `before` 和 `after` 代替 `left` 和 `right`。

| Position | Description |
| -------- | ----------- |
| 位置 | 说明 |
| `above` | Always display above the element |
| `above` | 总是显示在元素上方 |
| `below` | Always display beneath the element |
| `below` | 总是显示在元素下方 |
| `left` | Always display to the left of the element |
| `left` | 总是显示在元素左侧 |
| `right` | Always display to the right of the element |
| `right` | 总是显示在元素右侧 |
| `before` | Display to the left in left-to-right layout and to the right in right-to-left layout |
| `before` | 在 LTR 布局下显示在左侧，RTL 布局下显示在右侧 |
| `after` | Display to the right in left-to-right layout and to the left in right-to-left layout |
| `after` | 在 LTR 布局下显示在右侧，RTL 布局下显示在左侧 |

Based on the position in which the tooltip is shown, the `.mat-tooltip-panel` element will receive a
CSS class that can be used for style (e.g. to add an arrow). The possible classes are
`mat-tooltip-panel-above`, `mat-tooltip-panel-below`, `mat-tooltip-panel-left`,
`mat-tooltip-panel-right`.

根据显示工具提示的位置， `.mat-tooltip-panel` 元素将接收可用于样式的 CSS 类（例如添加箭头）。可能的类是 `mat-tooltip-panel-above` 、 `mat-tooltip-panel-below` 、 `mat-tooltip-panel-left` 、 `mat-tooltip-panel-right` 。

<!-- example(tooltip-position) -->

To display the tooltip relative to the mouse or touch that triggered it, use the
`matTooltipPositionAtOrigin` input.
With this setting turned on, the tooltip will display relative to the origin of the trigger rather
than the host element. In cases where the tooltip is not triggered by a touch event or mouse click,
it will display the same as if this setting was turned off.

要显示相对于触发它的鼠标或触控的工具提示，请使用 `matTooltipPositionAtOrigin` 输入属性。启用此设置后，工具提示将相对于触发器的原点而不是宿主元素显示。在工具提示不是由触控事件或鼠标单击触发的情况下，它的显示方式与此设置关闭时的显示方式相同。

### Showing and hiding

### 显示与隐藏

By default, the tooltip will be immediately shown when the user's mouse hovers over the tooltip's
trigger element and immediately hides when the user's mouse leaves.

默认情况下，当用户把鼠标移到到触发器元素上时，提示框会立刻显示出来；鼠标离开时会立刻隐藏。

On mobile, the tooltip is displayed when the user longpresses the element and hides after a
delay of 1500ms.

在移动设备上，当用户 "长按" 触发器元素时会显示提示框，延迟 1500ms 后自动隐藏。

#### Show and hide delays

#### 延迟显示与隐藏

To add a delay before showing or hiding the tooltip, you can use the inputs `matTooltipShowDelay`
and `matTooltipHideDelay` to provide a delay time in milliseconds.

要想在显示或隐藏提示框之前添加延迟，可以使用输入属性 `matTooltipShowDelay` 和 `matTooltipHideDelay` 来以毫秒为单位指定延迟时间。

The following example has a tooltip that waits one second to display after the user
hovers over the button, and waits two seconds to hide after the user moves the mouse away.

下面的例子中的提示框会在鼠标移到按钮上之后等待一秒钟再显示，当鼠标移开时等待两秒钟再隐藏。

<!-- example(tooltip-delay) -->

#### Changing the default delay behavior

#### 修改默认的延迟行为

You can configure your app's tooltip default show/hide delays by configuring and providing
your options using the `MAT_TOOLTIP_DEFAULT_OPTIONS` injection token.

你可以使用依赖注入令牌 `MAT_TOOLTIP_DEFAULT_OPTIONS` 提供一个选项，来配置应用中提示框的默认显示/隐藏延迟。

<!-- example(tooltip-modified-defaults) -->

#### Manually calling show() and hide()

#### 手动调用 show() 和 hide()

To manually cause the tooltip to show or hide, you can call the `show` and `hide` directive methods,
which both accept a number in milliseconds to delay before applying the display change.

要想手动显示或隐藏提示框，你可以调用该指令的 `show` 和 `hide` 方法，它们可以接受一个以毫秒为单位的数字作为延迟时间。

<!-- example(tooltip-manual) -->

#### Disabling the tooltip from showing

#### 禁止显示提示框

To completely disable a tooltip, set `matTooltipDisabled`. While disabled, a tooltip will never be
shown.

要完全禁用提示框，请设置 `matTooltipDisabled`。禁用之后，则永远不会显示出提示框。

### Accessibility

### 无障碍性

`MatTooltip` adds an `aria-describedby` description that provides a reference
to a visually hidden element containing the tooltip's message. This provides screen-readers
the information needed to read out the tooltip's contents when the end-user focuses on
tooltip's trigger. The element referenced by `aria-describedby` is not the tooltip itself,
but instead an invisible copy of the tooltip content that is always present in the DOM.

`MatTooltip` 会添加一个 `aria-describedby` 描述，它指向一个包含提示信息的不可见元素。
当最终用户把焦点移到用于触发该提示框的元素上时，屏幕阅读器就会读出该提示信息的内容。
`aria-describedby` 所指向的那个元素并不是提示框本身，而是该提示框内容的一个不可见副本，但它会始终存在于 DOM 中。

Avoid interactions that exclusively show a tooltip with pointer events like click and mouseenter.
Always ensure that keyboard users can perform the same set of actions available to mouse and
touch users.

避免只显示带有鼠标指针事件（如单击和鼠标输入）的工具提示的交互。始终确保键盘用户可以执行鼠标和触摸用户可用的相同操作集。
