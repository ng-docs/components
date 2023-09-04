`<mat-progress-spinner>` and `<mat-spinner>` are a circular indicators of progress and activity.

`<mat-progress-spinner>` 和 `<mat-spinner>` 是一个表示进度和活动的圆形指示符。

<!-- example(progress-spinner-overview) -->

### Progress mode

### 进度模式

The progress-spinner supports two modes, "determinate" and "indeterminate".
The `<mat-spinner>` component is an alias for `<mat-progress-spinner mode="indeterminate">`.

进度圈支持两种模式：确定（"determinate"）和待定（"indeterminate"）。

| Mode          | Description                                                                 |
| ------------- | --------------------------------------------------------------------------- |
| 模式          | 说明                                                                        |
| determinate   | Standard progress indicator, fills from 0% to 100%                          |
| determinate   | 标准的进度指示符，填充 0% 到 100%                                           |
| indeterminate | Indicates that something is happening without conveying a discrete progress |
| indeterminate | 表示正在发生某些事情，却没有传达离散的进度                                  |

The default mode is "determinate". In this mode, the progress is set via the `value` property,
which can be a whole number between 0 and 100.

默认模式是确定的（"determinate"）。在该模式下，进度要通过 `value` 属性进行设置，它可以是 0 到 100 之间的整数。

In "indeterminate" mode, the `value` property is ignored.

在 "indeterminate" 模式下，会忽略 `value` 属性。

### Theming

### 主题

The color of a progress-spinner can be changed by using the `color` property. By default,
progress-spinners use the theme's primary color. This can be changed to `'accent'` or `'warn'`.

进度圈的颜色可以通过 `color` 属性进行修改。默认情况下，进度圈使用主题的主色调（primary）。
它可以修改为 `'accent'` 或 `'warn'`。

### Accessibility

### 无障碍性

`MatLegacyProgressSpinner` implements the ARIA `role="progressbar"` pattern. By default, the spinner
sets `aria-valuemin` to `0` and `aria-valuemax` to `100`. Avoid changing these values, as this may
cause incompatibility with some assistive technology.

`MatProgressSpinner` 实现了 ARIA `role="progressbar"` 模式。默认情况下，微调器将 `aria-valuemin` 设置为 `0` ，将 `aria-valuemax` 为 `100` 。尽量不要更改这些值，因为这可能会导致与某些辅助技术不兼容。

Always provide an accessible label via `aria-label` or `aria-labelledby` for each spinner.

始终通过 `aria-label` 或 `aria-labelledby` 为每个微调器提供无障碍标签。
