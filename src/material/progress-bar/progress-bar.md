`<mat-progress-bar>` is a horizontal progress-bar for indicating progress and activity.

`<mat-progress-bar>` 是一个水平进度条，以指示进度和活动。

### Progress mode

### 进度模式

The progress-bar supports four modes: determinate, indeterminate, buffer and query.

进度条支持四种模式：确定（determinate）、待定（indeterminate）、缓存（buffer）和查询（query）。

#### Determinate

#### 确定（determinate）

Operations where the percentage of the operation complete is known should use the 
determinate indicator.

对于那些已知操作完成度的操作，应该使用确定的指示符。

<!-- example(progress-bar-determinate) -->

This is the default mode and the progress is represented by the `value` property.

这是默认模式，其进度由 `value` 属性表示。

#### Indeterminate

#### 待定（indeterminate）

Operations where the user is asked to wait while something finishes and it’s 
not necessary to indicate how long it will take should use the indeterminate indicator.

对于那些要求用户等待却无法预估它要多久完成的操作时，应该使用待定指示符。

<!-- example(progress-bar-indeterminate) -->

In this mode the `value` property is ignored.

这种模式下，会忽略 `value` 属性的值。

#### Buffer

#### 缓存（buffer）

Use the `buffer` mode of the progress-bar to indicate some activity or loading from the server.

使用进度条的 `buffer` 模式来表示正在进行某些活动，或正在从服务器加载。

<!-- example(progress-bar-buffer) -->

In "buffer" mode, `value` determines the progress of the primary bar while the `bufferValue` is 
used to show the additional buffering progress.

在缓存模式下，`value` 用来表示已完成的主进度，而 `bufferValue` 用于显示额外的缓存进度。

#### Query

#### 查询（query）

Use the `query` mode of the progress-bar to indicate pre-loading before the actual loading starts.

使用进度条的 `query` 模式来表示开始真正加载之前的预加载过程。

<!-- example(progress-bar-query) -->

In "query" mode, the progress-bar renders as an inverted "indeterminate" bar. Once the response 
progress is available, the `mode` should be changed to determinate to convey the progress. In
this mode the `value` property is ignored.

在查询模式下，进度条会渲染成一个反向的 "待定条"。一旦进度值可用，就应该把 `mode` 改为确定（determinate），以表达实际进度。
在这种模式下，会忽略 `value` 属性。

### Theming

### 主题

The color of a progress-bar can be changed by using the `color` property. By default, progress-bars
use the theme's primary color. This can be changed to `'accent'` or `'warn'`.  

进度条的颜色可以用 `color` 属性进行修改。默认情况下，进度条会使用主题的主色调（primary）。它可以修改为 `'accent'` 或 `'warn'`。

### Accessibility

### 无障碍性

`MatProgressBar` implements the ARIA `role="progressbar"` pattern. By default, the progress bar
sets `aria-valuemin` to `0` and `aria-valuemax` to `100`. Avoid changing these values, as this may
cause incompatibility with some assistive technology.

`MatProgressBar` 实现了 ARIA `role="progressbar"` 模式。默认情况下，进度条将 `aria-valuemin` 设置为 `0` ，将 `aria-valuemax` 为 `100` 。避免更改这些值，因为这可能会导致与某些辅助技术不兼容。

Always provide an accessible label via `aria-label` or `aria-labelledby` for each progress bar.

始终通过 `aria-label` 或 `aria-labelledby` 为每个进度条提供无障碍标签。
