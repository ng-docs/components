**Warning: this component is still experimental. It may have bugs and the API may change at any
time**

**警告：这个组件仍然是实验性的。它可能有 bug，API 可能会随时更改**

### Scrolling over items with different sizes

### 滚动不同大小的条目

When the items have different or unknown sizes, you can use the `AutoSizeVirtualScrollStrategy`.
This can be added to your viewport by using the `autosize` directive.

如果这些项的大小不同或者未知，你可以使用 `AutoSizeVirtualScrollStrategy`。
可以通过 `autosize` 指令将它添加到视口中。

```html
<cdk-virtual-scroll-viewport autosize>
  ...
</cdk-virtual-scroll-viewport>
```

The `autosize` strategy is configured through two inputs: `minBufferPx` and `maxBufferPx`.

`autosize` 策略是通过两个输入属性 `minBufferPx` 和 `maxBufferPx` 进行配置的。

**`minBufferPx`** determines the minimum space outside virtual scrolling viewport that will be
filled with content. Increasing this will increase the amount of content a user will see before more
content must be rendered. However, too large a value will cause more content to be rendered than is
necessary.

**`minBufferPx`** 用于确定虚拟滚动视口外面的最小空间，它会被内容填充。增加这些值会增加用户在渲染更多内容之前会看到的内容量。但是，太大的值会导致所渲染的内容多于必要的内容。

**`maxBufferPx`** determines the amount of content that will be added incrementally as the viewport
is scrolled. This should be greater than the size of `minBufferPx` so that one "render" is needed at
a time.

**`maxBufferPx`** 用于确定滚动视口时会逐步添加的内容量。它应该大于 `minBufferPx` 的大小，以便同一时刻只需要渲染一次。

```html
<cdk-virtual-scroll-viewport autosize minBufferPx="50" maxBufferPx="100">
  ...
</cdk-virtual-scroll-viewport>
```

Because the auto size strategy needs to measure the size of the elements, its performance may not
be as good as the fixed size strategy. 

由于自动调整大小策略需要测量元素的大小，因此它的性能可能不如固定大小的策略。
