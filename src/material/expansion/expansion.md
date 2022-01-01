`<mat-expansion-panel>` provides an expandable details-summary view.

`<mat-expansion-panel>` 提供了一个可展开的 "摘要-详情" 型视图。

<!-- example(expansion-overview) -->

### Expansion-panel content

### 可展开面板内容

Each expansion-panel must include a header and may optionally include an action bar.

每个可展开面板都必须包含一个头部，以及一个可选的动作条。

#### Header

#### 头部

The `<mat-expansion-panel-header>` shows a summary of the panel content and acts
as the control for expanding and collapsing. This header may optionally contain an
`<mat-panel-title>` and an `<mat-panel-description>`, which format the content of the
header to align with Material Design specifications.

`<mat-expansion-panel-header>` 用于显示面板内容的摘要，并且用作展开和折叠的控制器。
这个头部可以包含一个可选的 `<mat-panel-title>` 和 `<mat-panel-description>`，它们根据 Material Design 规范来格式化头部的内容。

<!-- example({"example": "expansion-overview",
              "file": "expansion-overview-example.html", 
              "region": "basic-panel"}) -->

By default, the expansion-panel header includes a toggle icon at the end of the
header to indicate the expansion state. This icon can be hidden via the
`hideToggle` property.

默认情况下，可展开面板的头部会在头的尾部包含一个开关图标，来表示展开状态。该图标可以通过 `hideToggle` 属性进行隐藏。

<!-- example({"example": "expansion-overview",
              "file": "expansion-overview-example.html", 
              "region": "hide-toggle"}) -->         

#### Action bar

#### 动作条

Actions may optionally be included at the bottom of the panel, visible only when the expansion
is in its expanded state.

面板的底部可以包含一个可选的动作条，只有当它处于展开状态时才可见。

<!-- example({"example": "expansion-steps",
              "file": "expansion-steps-example.html", 
              "region": "action-bar"}) -->

#### Disabling a panel

#### 禁用面板

Expansion panels can be disabled using the `disabled` attribute. A disabled expansion panel can't
be toggled by the user, but can still be manipulated programmatically.

可展开面板可以使用 `disabled` 属性来禁用。禁用的可展开面板不能由用户进行切换，但仍然可以通过程序进行切换。

<!-- example({"example": "expansion-expand-collapse-all",
              "file": "expansion-expand-collapse-all-example.html", 
              "region": "disabled"}) -->

### Accordion

### 手风琴

Multiple expansion-panels can be combined into an accordion. The `multi="true"` input allows the
expansions state to be set independently of each other. When `multi="false"` (default) just one
panel can be expanded at a given time:

多个可展开面板可以组合成一个手风琴。输入属性 `multi="true"` 允许面板的折叠状态与其它面板相互独立。当 `multi="false"` 时（默认值），则同一时刻只能有一个面板处于展开状态：

<!-- example({"example": "expansion-expand-collapse-all",
              "file": "expansion-expand-collapse-all-example.html", 
              "region": "multi"}) -->

### Lazy rendering

### 惰性渲染

By default, the expansion panel content will be initialized even when the panel is closed.
To instead defer initialization until the panel is open, the content should be provided as
an `ng-template`:

默认情况下，即使可展开面板是关闭的，其内容也已经初始化过了。
要想把初始化过程推迟到面板展开时才初始化，则该内容应该在 `ng-template` 中提供：

```html
<mat-expansion-panel>
  <mat-expansion-panel-header>
    This is the expansion title
  </mat-expansion-panel-header>

  <ng-template matExpansionPanelContent>
    Some deferred content
  </ng-template>
</mat-expansion-panel>
```

### Accessibility

### 无障碍性

`MatExpansionPanel` imitates the experience of the native `<details>` and `<summary>` elements.
The expansion panel header applies `role="button"` and the `aria-controls` attribute with the
content element's ID.

`MatExpansionPanel` 模仿了原生 `<details>` 和 `<summary>` 元素的体验。扩展面板标题要应用 `role="button"` 和带有内容元素 ID 的 `aria-controls` 属性。

Because expansion panel headers are buttons, avoid adding interactive controls as children
of `<mat-expansion-panel-header>`, including buttons and anchors.

由于可展开面板的标题是按钮，请避免将可交互控件添加为 `<mat-expansion-panel-header>` 的子项，包括按钮和锚点。
