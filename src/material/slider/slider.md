`<mat-slider>` allows for the selection of a value from a range via mouse, touch, or keyboard,
similar to `<input type="range">`.

像 `<input type="range">` 一样，`<mat-slider>` 允许通过鼠标、触摸或键盘来从范围中选择一个值。

<!-- example(slider-overview) -->

_Note: the sliding behavior for this component requires that HammerJS is loaded on the page._

*注意：该组件的滑动行为要求本页面中加载过 HammerJS 库。*

### Selecting a value

### 选择一个值

By default the minimum value of the slider is `0`, the maximum value is `100`, and the thumb moves
in increments of `1`. These values can be changed by setting the `min`, `max`, and `step` attributes
respectively. The initial value is set to the minimum value unless otherwise specified.

默认情况下，滑杆（slider）的最小值是 `0`，最大值是 `100`，滑块（thumb）移动时的增量是 `1`。
这些值可以通过设置 `min`、`max` 和 `step` 属性进行修改。除非另行指定，否则其初始值就等于最小值。

```html
<mat-slider min="1" max="5" step="0.5" value="1.5">
  <input matSliderThumb>
</mat-slider>
```

### Selecting a range

### 选择范围

A `<mat-slider>` can be converted into a range slider by projecting both a `matStartThumb` and a
`matEndThumb` into it. Each of the thumbs has an independent value, but they won't be allowed to
overlap and they're still bound by the same `min` and `max` from the slider.

还可以指定 `invert` 属性，来翻转坐标轴（滑块会沿着它移动）。
翻转后的水平滑杆，其最小值在右侧，而最大值在左侧；翻转后的垂直滑杆，其最小值在上部，而最大值在底部。

```html
<mat-slider>
  <input matSliderStartThumb>
  <input matSliderEndThumb>
</mat-slider>
```

<!-- example(slider-range) -->

### Thumb label

### 滑块标签

By default, the exact selected value of a slider is not visible to the user. However, this value can
be added to the thumb by adding the `discrete` attribute.

[Material Design 规范](https://material.io/design/components/sliders.html#discrete-slider)建议只为那些用来显示离散值（比如 1~5 的打分值）的滑杆使用 `thumbLabel` 属性（同时设置 `tickInterval="1"`）。

```html
<mat-slider discrete>
  <input matSliderThumb>
</mat-slider>
```

### Formatting the thumb label

### 格式化滑块标签

By default, the value in the slider's thumb label will be the same as the model value, however this
may end up being too large to fit into the label. If you want to control the value that is being
displayed, you can do so using the `displayWith` input.

默认情况下，滑块标签上的值会始终和模型的值相同，不过它可能太大，而没办法放进标签中。
如果你要控制要显示的值，你可以使用输入属性 `displayWith` 来实现。

<!-- example(slider-formatting) -->

### Tick marks

### 刻度标记

By default, sliders do not show tick marks along the thumb track. This can be enabled using the
`showTickMarks` attribute.

默认情况下，滑杆不会在滑块的导轨（track）上显示刻度标记，不过可以使用 `tickInterval` 属性来启用它。`tickInterval` 的值应该是一个表示刻度之间步长的数字。比如 `tickInterval` 为 `3` 而 `step` 为 `4` 时，将会每隔 `3` 步画出一个标记，每 `12` 个值重复一轮。

```html
<mat-slider showTickMarks>
  <input matSliderThumb>
</mat-slider>
```

[Material Design 规范](https://material.io/design/components/sliders.html#discrete-slider) 建议只为那些用来显示离散值（比如 1~5 的打分值）的滑杆设置 `tickInterval` 属性（同时把 `thumbLabel` 属性设置为 `1`）。

### Keyboard interaction

### 键盘交互

The slider has the following keyboard bindings:

滑杆具有下列键盘绑定：

| Key         | Action                                                      |
| ----------- | ----------------------------------------------------------- |
| 按键        | 操作                                                        |
| Right arrow | Increment the slider value by one step (decrements in RTL). |
| 右方向键    | 滑杆的值增加一步（在 RTL 下则减小）。                       |
| Up arrow    | Increment the slider value by one step.                     |
| 上方向键    | 滑杆的值增加一步。                                          |
| Left arrow  | Decrement the slider value by one step (increments in RTL). |
| 左方向键    | 滑杆的值减小一步（在 RTL 下则增加）。                       |
| Down arrow  | Decrement the slider value by one step.                     |
| 下方向键    | 滑杆的值减小一步。                                          |
| Page up     | Increment the slider value by 10 steps.                     |
| 上翻页      | 滑杆的值增加 10 步。                                        |
| Page down   | Decrement the slider value by 10 steps.                     |
| 下翻页      | 滑杆的值减小 10 步。                                        |
| End         | Set the value to the maximum possible.                      |
| End         | 设置为可能的最大值。                                        |
| Home        | Set the value to the minimum possible.                      |
| Home        | 设置为可能的最小值。                                        |

### Accessibility

### 无障碍性

`MatSlider` uses an internal `<input type="range">` to provide an accessible experience. The input
receives focus and it can be labelled using `aria-label` or `aria-labelledby`.

`MatSlider` 实现了 ARIA `role="slider"` 模式，它会处理键盘输入和焦点管理。始终要通过 `aria-label` 或 `aria-labelledby` 为每个滑块提供无障碍标签。
