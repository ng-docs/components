The `@angular/cdk/drag-drop` module provides you with a way to easily and declaratively create
drag-and-drop interfaces, with support for free dragging, sorting within a list, transferring items
between lists, animations, touch devices, custom drag handles, previews, and placeholders,
in addition to horizontal lists and locking along an axis.

`@angular/cdk/drag-drop` 模块为你提供了一种方便易用、声明性地创建可拖放界面的方式，它支持自由拖动、在列表中排序、在列表之间转移条目、动画、触摸设备、自定义拖动把手、预览和占位符，以及水平列表和轴向锁定。

### Getting started

### 快速起步

Start by importing `DragDropModule` into the `NgModule` where you want to use drag-and-drop
features. You can now add the `cdkDrag` directive to elements to make them draggable. When
outside of a `cdkDropList` element, draggable elements can be freely moved around the page.
You can add `cdkDropList` elements to constrain where elements may be dropped.

首先，将 `DragDropModule` 导入到要使用拖放功能的 `NgModule` 中。这样你就可以把 `cdkDrag` 指令添加到元素中，让它们变得可拖动了。当没有 `cdkDropList` 元素的时候，可拖动元素可以在页面中自由移动。你可以添加 `cdkDropList` 元素来约束元素可以被扔在哪里。

<!-- example(cdk-drag-drop-overview) -->

### Reordering lists

### 重新排序列表

Adding `cdkDropList` around a set of `cdkDrag` elements groups the draggables into a
reorderable collection. Items will automatically rearrange as an element moves. Note
that this will *not* update your data model; you can listen to the `cdkDropListDropped` event to
update the data model once the user finishes dragging.

在一组 `cdkDrag` 元素外添加一个 `cdkDropList` 包装可以把这些可拖曳元素分组成一个可重新排序的集合。当元素移动时，这些条目会自动重新排序。注意，这*不会*更新你的数据模型，你可以监听 `cdkDropListDropped` 事件，以便在用户完成拖放操作后更新数据模型。

<!-- example(cdk-drag-drop-sorting) -->

### Transferring items between lists

### 在列表之间转移条目

The `cdkDropList` directive supports transferring dragged items between connected drop zones.
You can connect one or more `cdkDropList` instances together by setting the `cdkDropListConnectedTo`
property or by wrapping the elements in an element with the `cdkDropListGroup` attribute.

`cdkDropList` 指令支持在相互连接的拖放区之间转移要拖动的项。你可以把一个或多个 `cdkDropList` 实例连接起来，方法是设置 `cdkDropListConnectedTo` 属性，或把这些元素包含在带有 `cdkDropListGroup` 属性的元素中。

<!-- example(cdk-drag-drop-connected-sorting) -->

Note that `cdkDropListConnectedTo` works both with a direct reference to another `cdkDropList`, or
by referencing the `id` of another drop container:

注意，`cdkDropListConnectedTo` 既可以直接引用其它拖放容器（`cdkDropList`）的实例，也可以引用其它拖放容器的 `id` ：

```html
<!-- This is valid -->
<div cdkDropList #listOne="cdkDropList" [cdkDropListConnectedTo]="[listTwo]"></div>
<div cdkDropList #listTwo="cdkDropList" [cdkDropListConnectedTo]="[listOne]"></div>

<!-- This is valid as well -->
<div cdkDropList id="list-one" [cdkDropListConnectedTo]="['list-two']"></div>
<div cdkDropList id="list-two" [cdkDropListConnectedTo]="['list-one']"></div>
```

If you have an unknown number of connected drop lists, you can use the `cdkDropListGroup` directive
to set up the connection automatically. Note that any new `cdkDropList` that is added under a group
will be connected to all other lists automatically.

如果有一个未知数量的连接拖放列表，你也可以使用 `cdkDropListGroup` 指令来自动建立连接。注意，添加到组下的所有新 `cdkDropList` 都会自动和其它的列表连接起来。

```html
<div cdkDropListGroup>
  <!-- All lists in here will be connected. -->
  <div cdkDropList *ngFor="let list of lists"></div>
</div>
```

<!-- example(cdk-drag-drop-connected-sorting-group) -->

### Attaching data

### 附着数据

You can associate some arbitrary data with both `cdkDrag` and `cdkDropList` by setting `cdkDragData`
or `cdkDropListData`, respectively. Events fired from both directives include this data, allowing
you to easily identify the origin of the drag or drop interaction.

你可以把通过设置 `cdkDragData` 或 `cdkDropListData` 来分别让 `cdkDrag` 和 `cdkDropList` 与任意数据关联起来。这两个指令触发的事件都包含这些数据，可以让你轻松地识别出拖放的来源。

```html
<div cdkDropList [cdkDropListData]="list" *ngFor="let list of lists" (cdkDropListDropped)="drop($event)">
  <div cdkDrag [cdkDragData]="item" *ngFor="let item of list"></div>
</div>
```

### Styling

### 样式

The `cdkDrag` and `cdkDropList` directive include only those styles strictly necessary for
functionality. The application can then customize the elements by styling CSS classes added
by the directives:

`cdkDrag` 和 `cdkDropList` 指令只包含使用此功能时必需的那些样式。然后，该应用可以通过那些由指令添加的 CSS 类来定制这些元素：

| Selector                   | Description                                                                                                                                                                                      |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 选择器                     | 说明                                                                                                                                                                                             |
| `.cdk-drop-list`           | Corresponds to the `cdkDropList` container.                                                                                                                                                      |
| `.cdk-drop-list`           | 对应于 `cdkDropList` 容器。                                                                                                                                                                      |
| `.cdk-drag`                | Corresponds to a `cdkDrag` instance.                                                                                                                                                             |
| `.cdk-drag`                | 对应于 `cdkDrag` 实例。                                                                                                                                                                          |
| `.cdk-drag-disabled`       | Class that is added to a disabled `cdkDrag`.                                                                                                                                                     |
| `.cdk-drag-disabled`       | 要添加到已禁用的 `cdkDrag` 上的类。                                                                                                                                                              |
| `.cdk-drag-handle`         | Class that is added to the host element of the cdkDragHandle directive.                                                                                                                          |
| `.cdk-drag-handle`         | 要添加到 cdkDragHandle 指令的宿主元素上的类。                                                                                                                                                    |
| `.cdk-drag-preview`        | This is the element that will be rendered next to the user's cursor as they're dragging an item in a sortable list. By default the element looks exactly like the element that is being dragged. |
| `.cdk-drag-preview`        | 这是当用户在可排序列表中拖动一个条目时，要渲染在用户光标附近的元素。默认情况下，该元素看上去和被拖动的元素完全一样。                                                                             |
| `.cdk-drag-placeholder`    | This is element that will be shown instead of the real element as it's being dragged inside a `cdkDropList`. By default this will look exactly like the element that is being sorted.            |
| `.cdk-drag-placeholder`    | 这是一个在拖入 `cdkDropList` 时要显示的元素，但不是真正的元素。默认情况下，它看上去和要排序的元素完全一样。                                                                                      |
| `.cdk-drop-list-dragging`  | A class that is added to `cdkDropList` while the user is dragging an item.                                                                                                                       |
| `.cdk-drop-list-dragging`  | 当用户拖动条目时，添加到 `cdkDropList` 上的类。                                                                                                                                                  |
| `.cdk-drop-list-disabled`  | A class that is added to `cdkDropList` when it is disabled.                                                                                                                                      |
| `.cdk-drop-list-disabled`  | 当 `cdkDropList` 禁用时添加的一个类。                                                                                                                                                            |
| `.cdk-drop-list-receiving` | A class that is added to `cdkDropList` when it can receive an item that is being dragged inside a connected drop list.                                                                           |
| `.cdk-drop-list-receiving` | 当 `cdkDropList` 可以接受某个拖动进关联拖放列表时，添加到 `cdkDropList` 上的类。                                                                                                                 |

### Animations

### 动画

The drag-and-drop module supports animations both while sorting an element inside a list, as well as
animating it from the position that the user dropped it to its final place in the list. To set up
your animations, you have to define a `transition` that targets the `transform` property. The
following classes can be used for animations:

拖放模块既支持对列表中的元素进行排序时的动画，也支持用户将其拖放到列表中最终位置时的动画。要设置动画，你就必须定义一个以包含 `transform` 属性的 `transition`。动画中可以使用下列如下 CSS 类：

* `.cdk-drag` - If you add a `transition` to this class, it'll animate as the user is sorting
    through a list.

  `.cdk-drag` - 如果你把 `transition` 添加到该类中，当用户在列表中进行排序时，它就会播放动画。

* `.cdk-drag-animating` - This class is added to a `cdkDrag` when the user has stopped dragging.
    If you add a `transition` to it, the CDK will animate the element from its drop position to
    the final position inside the `cdkDropList` container.

  `.cdk-drag-animating` - 当用户停止拖动时，该类就会添加到 `cdkDrag` 上。如果你给它添加了一个 `transition`，那么 CDK 就会把该元素从它的拖放位置动画到其在 `cdkDropList` 容器内的最终位置。

Example animations:

动画示例：

```css
/* Animate items as they're being sorted. */
.cdk-drop-list-dragging .cdk-drag {
  transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
}

/* Animate an item that has been dropped. */
.cdk-drag-animating {
  transition: transform 300ms cubic-bezier(0, 0, 0.2, 1);
}
```

### Customizing the drag area using a handle

### 使用拖动把手自定义拖曳区域

By default, the user can drag the entire `cdkDrag` element to move it around. If you want to
restrict the user to only be able to do so using a handle element, you can do it by adding the
`cdkDragHandle` directive to an element inside of `cdkDrag`. Note that you can have as many
`cdkDragHandle` elements as you want:

默认情况下，用户都可以拖动整个 `cdkDrag` 元素来移动它。如果要限制用户只能使用某个拖动把手元素，你可以把 `cdkDragHandle` 指令添加到 `cdkDrag` 内部的某个元素上。注意，你可以有任意多个 `cdkDragHandle` 元素：

<!-- example(cdk-drag-drop-handle) -->

### Customizing the drag preview

### 自定义拖动预览图

When a `cdkDrag` element is picked up, it will create a preview element visible while dragging.
By default, this will be a clone of the original element positioned next to the user's cursor.
This preview can be customized, though, by providing a custom template via `*cdkDragPreview`.
Using the default configuration the custom preview won't match the size of the original dragged
element, because the CDK doesn't make assumptions about the element's content. If you want the
size to be matched, you can pass `true` to the `matchSize` input.

当拾起 `cdkDrag` 元素时，它会在拖动过程中创建一个可见的预览元素。默认情况下，这将是位于用户光标旁边的原始元素的克隆体。但是，通过由 `*cdkDragPreview` 提供的自定义模板，可以自定义此预览。
使用此默认配置时，自定义预览不会匹配原始被拖动元素的大小，因为 CDK 不能对该元素的内容做任何假设。如果你希望匹配其大小，可以给输入参数 `matchSize` 传入 `true`。

Note that the cloned element will remove its `id` attribute in order to avoid having multiple
elements with the same `id` on the page. This will cause any CSS that targets that `id` not
to be applied.

注意，克隆元素时会删除它的 `id` 属性，以免在页面中拥有多个具有相同 `id` 的元素。这会导致任何以此 `id` 为目标的 CSS 都不能应用在这个预览元素上。

<!-- example(cdk-drag-drop-custom-preview) -->

### Drag preview insertion point

### 拖动预览器插入点

By default, the preview of a `cdkDrag` will be inserted into the `<body>` of the page in order to
avoid issues with `z-index` and `overflow: hidden`. This may not be desireable in some cases,
because the preview won't retain its inherited styles. You can control where the preview is inserted
using the `cdkDragPreviewContainer` input on `cdkDrag`. The possible values are:

默认情况下，`cdkDrag` 的预览器将插入到页面的 `<body>` 中，以避免出现 `z-index` 和 `overflow: hidden` 相关的问题。在某些情况下，这可能是无效的，因为此预览器不会保留其继承的样式。你可以使用 cdkDrag 上的 `cdkDragPreviewContainer` 输入来控制插入预览器的 `cdkDrag` 。可能的值为：

| Value                         | Description                                                                      | Advantages                                                                                                                  | Disadvantages                                                                                                                                                             |
| ----------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 值                            | 说明                                                                             | 优点                                                                                                                        | 缺点                                                                                                                                                                      |
| `global`                      | Default value. Preview is inserted into the `<body>` or the closest shadow root. | Preview won't be affected by `z-index` or `overflow: hidden`. It also won't affect `:nth-child` selectors and flex layouts. | Doesn't retain inherited styles.                                                                                                                                          |
| `global`                      | 默认值。预览器被插入到 `<body>` 或最近的 Shadow Root 中。                        | 预览器不会受到 `z-index` 或 `overflow: hidden` 的影响。它也不会影响 `:nth-child` 选择器和 flex 布局。                       | 不保留继承的样式。                                                                                                                                                        |
| `parent`                      | Preview is inserted inside the parent of the item that is being dragged.         | Preview inherits the same styles as the dragged item.                                                                       | Preview may be clipped by `overflow: hidden` or be placed under other elements due to `z-index`. Furthermore, it can affect `:nth-child` selectors and some flex layouts. |
| `parent`                      | 预览器被插入到被拖动条目的父节点内。                                             | 预览器继承与拖动条目相同的样式。                                                                                            | 由于 `z-index` 的影响，预览器可能会被 `overflow: hidden` 裁剪或被放置在其他元素下。此外，它会影响 `:nth-child` 选择器和一些 flex 布局。                                   |
| `ElementRef` or `HTMLElement` | Preview will be inserted into the specified element.                             | Preview inherits styles from the specified container element.                                                               | Preview may be clipped by `overflow: hidden` or be placed under other elements due to `z-index`. Furthermore, it can affect `:nth-child` selectors and some flex layouts. |
| `ElementRef` 或 `HTMLElement` | 预览器将插入到指定的元素内部。                                                   | 预览器从指定的容器元素继承样式。                                                                                            | 由于 `z-index` 的影响，预览器可能会被 `overflow: hidden` 裁剪或被放置在其他元素下。此外，它会影响 `:nth-child` 选择器和一些 flex 布局。                                   |

### Customizing the drag placeholder

### 自定义拖动占位符

While a `cdkDrag` element is being dragged, the CDK will create a placeholder element that will
show where it will be placed when it's dropped. By default the placeholder is a clone of the element
that is being dragged, however you can replace it with a custom one using the `*cdkDragPlaceholder`
directive:

在拖动 `cdkDrag` 元素的同时，CDK 会创建一个占位符元素，它会显示在要放置的位置上。默认的占位符是被拖元素的克隆体，但你可以使用 `*cdkDragPlaceholder` 指令来把它替换为自定义的版本：

<!-- example(cdk-drag-drop-custom-placeholder) -->

### List orientation

### 列出方向

The `cdkDropList` directive assumes that lists are vertical by default. This can be
changed by setting the `orientation` property to `"horizontal"`.

默认情况下，`cdkDropList` 指令假设列表是垂直的。可以把 `orientation` 属性设置为 `"horizontal"` 来改变它。

<!-- example(cdk-drag-drop-horizontal-sorting) -->

### Restricting movement within an element

### 把移动限制在某个元素内部

If you want to stop the user from being able to drag a `cdkDrag` element outside of another element,
you can pass a CSS selector to the `cdkDragBoundary` attribute. The attribute works by accepting a
selector and looking up the DOM until it finds an element that matches it. If a match is found,
it'll be used as the boundary outside of which the element can't be dragged. `cdkDragBoundary` can
also be used when `cdkDrag` is placed inside a `cdkDropList`.

如果想阻止用户把某个 `cdkDrag` 元素拖到另一个元素外部，你可以把一个 CSS 选择器传递给 `cdkDragBoundary` 属性。该属性的工作原理是接受一个选择器并查找该 DOM，直到找到一个与之匹配的元素。如果找到了匹配项，它就会用作该元素无法拖出的边界。当 `cdkDrag` 位于 `cdkDropList` 中时，也可以用 `cdkDragBoundary` 来达到相同效果。

<!-- example(cdk-drag-drop-boundary) -->

### Restricting movement along an axis

### 限定沿轴的移动

By default, `cdkDrag` allows free movement in all directions. To restrict dragging to a
specific axis, you can set `cdkDragLockAxis` on `cdkDrag` or `cdkDropListLockAxis` on `cdkDropList`
to either `"x"` or `"y"`.

默认情况下，`cdkDrag` 允许所有方向的自由移动。要想限定只能沿特定的轴移动，可以把 `cdkDrag` 上的 `cdkDragLockAxis` 或 `cdkDropList` 上的 `lockAxis` 设置为 `"x"` 或 `"y"`。

<!-- example(cdk-drag-drop-axis-lock) -->

### Alternate drag root element

### 替代拖动根元素

If there's an element that you want to make draggable, but you don't have direct access to it, you
can use the `cdkDragRootElement` attribute. The attribute works by accepting a selector and looking
up the DOM until it finds an element that matches the selector. If an element is found, it'll become
the element that is moved as the user is dragging. This is useful for cases like making a dialog
draggable.

如果你想要把某个元素做成可拖动的，但却无法直接访问它，你可以借助 `cdkDragRootElement` 属性。该属性的工作原理是接受一个选择器并查找 DOM，直到它找到一个与该选择器匹配的元素。如果找到了某个元素，它就会成为用户在拖动时所移动的替代元素。这对于让对话框可拖动之类的场景非常有用。

<!-- example(cdk-drag-drop-root-element) -->

### Controlling which items can be moved into a container

### 控制哪些条目可以移入容器

By default, all `cdkDrag` items from one container can be moved into another connected container.
If you want more fine-grained control over which items can be dropped, you can use the
`cdkDropListEnterPredicate` which will be called whenever an item is about to enter a
new container. Depending on whether the predicate returns `true` or `false`, the item may or may not
be allowed into the new container.

默认情况下，一个容器中的所有 `cdkDrag` 项都可以移动到另一个相连的容器中。如果你想对可拖放的条目进行更精细的控制，你可以使用 `cdkDropListEnterPredicate`，它会在条目即将进入新容器时调用。根据它是返回的是 `true` 还是 `false`，可以允许或不允许该条目进入新容器。

<!-- example(cdk-drag-drop-enter-predicate) -->

### Disabled dragging

### 禁用拖动功能

If you want to disable dragging for a particular drag item, you can do so by setting the
`cdkDragDisabled` input on a `cdkDrag` item. Furthermore, you can disable an entire list
using the `cdkDropListDisabled` input on a `cdkDropList` or a particular handle via
`cdkDragHandleDisabled` on `cdkDragHandle`.

如果要对特定的条目禁用拖曳，你可以在 `cdkDrag` 条目上设置输入属性 `cdkDragDisabled`。你还可以使用 `cdkDropList` 上的输入属性 `cdkDropListDisabled` 来禁用整个列表或 `cdkDragHandle` 上的 `cdkDragHandleDisabled` 来进行特定的拖动手柄。

<!-- example(cdk-drag-drop-disabled) -->

### Disabled sorting

### 禁用排序

There are cases where draggable items can be dragged out of one list into another, however
the user shouldn't be able to sort them within the source list. For these cases you can set the
`cdkDropListSortingDisabled` input which will prevent the items in a `cdkDropList` from sorting,
in addition to preserving the dragged item's initial position in the source list, if the user
decides to return the item.

某些情况下，可拖动的条目可以从一个列表拖到另一个列表中，但用户不应该在源列表中对它们进行排序。对于这些情况，你可以设置 `cdkDropListSortingDisabled` 输入，它会阻止 `cdkDropList` 保留被拖动条目在源列表中的初始位置（如果用户决定退回该条目）。

<!-- example(cdk-drag-drop-disabled-sorting) -->

### Delayed dragging

### 延迟拖动

By default as soon as the user puts their pointer down on a `cdkDrag`, the dragging sequence will
be started. This might not be desirable in cases like fullscreen draggable elements on touch
devices where the user might accidentally trigger a drag as they're scrolling the page. For
cases like these you can delay the dragging sequence using the `cdkDragStartDelay` input which
will wait for the user to hold down their pointer for the specified number of milliseconds before
moving the element.

默认情况下，只要用户把指针放在 `cdkDrag`，就会启动拖动序列。这种对于触摸设备上的全屏可拖动元素等情况可能并不理想，因为用户在滚动页面时可能会意外触发拖动。对于这类情况，你可以使用输入属性 `cdkDragStartDelay` 来延迟拖动，它会先等待用户按住指定的毫秒数之后才开始移动此元素。

<!-- example(cdk-drag-drop-delay) -->

### Changing the standalone drag position

### 改变独立的拖动位置

By default, standalone `cdkDrag` elements move from their normal DOM position only when manually
moved by a user. The element's position can be explicitly set, however, via the
`cdkDragFreeDragPosition` input. Applications commonly use this, for example, to restore a
draggable's position after a user has navigated away and then returned.

默认情况下，独立的 `cdkDrag` 元素只有当用户手动移动时，才会从其常规 DOM 位置移开。通过输入属性 `cdkDragFreeDragPosition` 可以显式设置该元素的位置。例如，应用程序通常会这样做：当用户导航离开后，自动还原可拖动对象的位置，然后返回。

<!-- example(cdk-drag-drop-free-drag-position) -->

### Controlling whether an item can be sorted into a particular index

### 控制是否可以把一个条目排序到一个特定的序号上

`cdkDrag` items can be sorted into any position inside of a `cdkDropList` by default. You can change
this behavior by setting a `cdkDropListSortPredicate`. The predicate function will be called
whenever an item is about to be moved into a new index. If the predicate returns `true`, the
item will be moved into the new index, otherwise it will keep its current position.

默认情况下，`cdkDrag` 的条目可以放到 `cdkDropList` 中的任意位置（序号）上。你可以通过设置 `cdkDropListSortPredicate` 来改变这种行为。每当一个条目要移到一个新的序号上时，就会调用一个谓词函数。如果该谓词返回 `true`，则该项将被移入新序号，否则会保持当前位置。

<!-- example(cdk-drag-drop-sort-predicate) -->
