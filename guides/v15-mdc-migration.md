# Migrating to MDC-based Angular Material Components

# 迁移到基于 MDC 的 Angular Material Components

In Angular Material v15, many of the components have been refactored to be based on the official
[Material Design Components for Web (MDC)](https://github.com/material-components/material-components-web).
The components from the following imports have been refactored:

在 Angular Material v15 中，许多组件已经重构为基于官方的 [Material Design Components for Web (MDC)](https://github.com/material-components/material-components-web) 。来自以下导入的组件已被重构：

| Import path | Summary of changes |
| ----------- | ------------------ |
| 导入路径 | 变更摘要 |
| @angular/material/autocomplete | Style changes only |
| @angular/material/autocomplete | 仅样式变更 |
| @angular/material/button | Style changes, API changes |
| @angular/material/button | 样式变更，API 变更 |
| @angular/material/card | Style changes only |
| @angular/material/card | 仅样式变更 |
| @angular/material/checkbox | Style changes, changes to event behavior |
| @angular/material/checkbox | 样式变更，事件行为变更 |
| @angular/material/chips | Complete rewrite |
| @angular/material/chips | 完全重写 |
| @angular/material/core | Style changes only |
| @angular/material/core | 仅样式变更 |
| @angular/material/dialog | Style changes, changes to change detection behavior |
| @angular/material/dialog | 样式变更，变更检测行为的变更 |
| @angular/material/form-field | Style changes, some appearances removed, API changes |
| @angular/material/form-field | 样式变更、某些外观已删除、API 变更 |
| @angular/material/input | Style changes only |
| @angular/material/input | 仅样式变更 |
| @angular/material/list | Style changes, API changes |
| @angular/material/list | 样式变更，API 变更 |
| @angular/material/menu | Style changes, API changes |
| @angular/material/menu | 样式变更，API 变更 |
| @angular/material/paginator | Style changes only |
| @angular/material/paginator | 仅样式变更 |
| @angular/material/progress-bar | Style changes only |
| @angular/material/progress-bar | 仅样式变更 |
| @angular/material/progress-spinner | Style changes only |
| @angular/material/progress-spinner | 仅样式变更 |
| @angular/material/radio | Style changes only |
| @angular/material/radio | 仅样式变更 |
| @angular/material/select | Style changes only |
| @angular/material/select | 仅样式变更 |
| @angular/material/slide-toggle | Style changes only |
| @angular/material/slide-toggle | 仅样式变更 |
| @angular/material/slider | Complete rewrite |
| @angular/material/slider | 完全重写 |
| @angular/material/snack-bar | Style changes, API changes |
| @angular/material/snack-bar | 样式变更，API 变更 |
| @angular/material/table | Style changes only |
| @angular/material/table | 仅样式变更 |
| @angular/material/tabs | Style changes, API changes |
| @angular/material/tabs | 样式变更，API 变更 |
| @angular/material/tooltip | Style changes only |
| @angular/material/tooltip | 仅样式变更 |

The refactored components offer several benefits over the old implementations, including:

重构的组件提供了一些优于旧实现的优势，包括：

* Improved accessibility

  改进的无障碍性

* Better adherence to the Material Design spec

  更好地遵守 Material Design 规范

* Faster adoption of future versions of the Material Design spec, due to being based on common
  infrastructure

  由于基于通用基础设施，未来版本的 Material Design 规范的采纳速度更快

## What has changed?

## 发生了哪些变化？

The new components have different internal DOM and CSS styles. However, most of the TypeScript APIs
and component/directive selectors for the new components have been kept as close as possible to the
old implementation. This makes it straightforward to migrate your application and get it running
with the new components.

新组件具有不同的内部 DOM 和 CSS 样式。但是，新组件的大多数 TypeScript API 和组件/指令选择器都尽可能接近旧实现。这使得迁移你的应用程序并使其与新组件一起运行变得更简单。

Due to the new DOM and CSS, you will likely find that some styles in your application need to be
adjusted, particularly if your CSS is overriding styles on internal elements on any of the migrated
components.

由于新的 DOM 和 CSS，你可能会发现应用程序中的某些样式需要调整，尤其是当你的 CSS 覆盖了任何已迁移组件的内部元素的样式时。

There are a few components with larger changes to their APIs that were necessary in order to
integrate with MDC. These components include:

为了与 MDC 集成，有一些组件对其 API 进行了较大变更。这些组件包括：

* form-field

  表单字段

* chips

  纸片

* slider

  滑块

* list

  列表

See below for a [comprehensive list of changes](#comprehensive-list-of-changes) for all components.

有关所有组件的[完整变更列表，](#comprehensive-list-of-changes)请参见下文。

The old implementation of each new component is now deprecated, but still available from a "legacy"
import. For example, you can import the old `mat-button` implementation can be used by importing the
legacy button module.

每个新组件的旧实现现在均已被弃用，但仍然可以从 “legacy” 导入中获得。例如，你可以导入旧的 `mat-button` 实现，可以通过导入 `legacy-button` 模块来使用它。

```ts
import {MatLegacyButtonModule} from '@angular/material/legacy-button';
```

## How to Migrate

## 如何迁移

You can start your migration by running Angular Material's automated refactoring tool. This tool,
implemented as an [Angular Schematic](https://angular.io/guide/schematics), updates the majority
your code to the new component versions. While some follow-up is necessary, you can reduce the
manual effort by following these best practices:

你可以通过运行 Angular Material 的自动重构工具来开始迁移。该工具实现为一个 [Angular 原理图](https://angular.io/guide/schematics)，能将你的大部分代码更新为新的组件版本。虽然需要进行一些跟进，但你可以通过遵循这些最佳实践来减少手动工作：

You can reduce the amount of manual effort needed by ensuring that your application follows good
practices before migrating.

通过确保你的应用程序在迁移之前遵循了某些良好实践，你可以减少所需的手动工作量。

* Avoid overriding styles on internal Angular Material elements in your CSS as much as possible. If
  you find yourself frequently overriding styles on internal elements, consider using a component
  that is designed for more style customization, such as the ones available in the
  [Angular CDK](/cdk).

  尽可能避免覆盖 CSS 中内部 Angular Material 元素的样式。如果你发现自己经常覆盖内部元素的样式，请考虑使用专为更多样式定制而设计的组件，例如 [Angular CDK](/cdk) 中可用的组件。

* Use [component harnesses](/guide/using-component-harnesses) to interact with Angular Material
  components in tests rather than inspecting internal elements, properties, or methods of the
  component. Using component harnesses makes your tests easier to understand and more robust to
  changes in Angular Material

  使用[组件挽具](/guide/using-component-harnesses)在测试中与 Angular Material 组件交互，而不是检查组件的内部元素、属性或方法。使用组件挽具使你的测试更易于理解，并且对 Angular Material 中的更改更健壮

### 1. Update to Angular Material v15

### 1. 更新到 Angular Material v15

Angular Material includes a schematic to help migrate applications to use the new MDC-based
components. To get started, upgrade your application to Angular Material 15.

Angular Material 包含一个示意图，可帮助迁移应用程序以使用新的基于 MDC 的组件。首先，将你的应用程序升级到 Angular Material 15。

```shell
ng update @angular/material^15
```

As part of this update, a schematic will run to automatically move your application to use the
"legacy" imports containing the old component implementations. This provides a quick path to getting
your application running on v15 with minimal manual changes.

作为此更新的一部分，将运行原理图以自动移动你的应用程序以使用包含旧组件实现的“遗留”导入。这提供了一种让你的应用程序在 v15 上运行的快速途径，只需最少的手动更改。

### 2. Run the migration tool

### 2.运行迁移工具

After upgrading to v15, you can run the migration tool to switch from the legacy component
implementations to the new MDC-based ones.

升级到 v15 后，你可以运行迁移工具以从遗留组件实现切换到基于 MDC 的新组件实现。

```shell
ng generate @angular/material:mdc-migration
```

This command updates your TypeScript, styles, and templates to the new implementations, updating as
much as it can automatically.

此命令将你的 TypeScript、样式和模板更新为新的实现，并尽可能自动更新。

#### Running a Partial Migration

#### 运行部分迁移

Depending on the size and complexity of your application, you may want to migrate a single component
or small group of components at a time, rather than all components at once.

根据应用程序的大小和复杂性，你可能希望一次迁移单个组件或一小组组件，而不是一次迁移所有组件。

You may also want to migrate your app one module at a time instead of all together. You can use both
the old implementation and new implementation in the same application, as long as they aren't used
in the same `NgModule`.

你可能还希望一次迁移你的应用程序一个模块，而不是一起迁移。你可以在同一个应用程序中同时使用旧实现和新实现，只要它们不在同一个 `NgModule` 中使用。

The script will prompt you for the directory and components you want to migrate.

该脚本将提示你输入要迁移的目录和组件。

### 3. Check for TODOs left by the migration tool.

### 3. 检查迁移工具留下的 TODO。

In situations where the migration tool is not able to automatically update your code, it will
attempt to add comments for a human to follow up. These TODO comments follow a common format, so
they can be easily identified.

在迁移工具无法自动更新你的代码的情况下，它会尝试添加注释以供人工跟进。这些 TODO 注释遵循通用格式，因此可以轻松识别。

```ts
// TODO(mdc-migration): ...
```

To search for all comments left by the migration tool, search for `TODO(mdc-migration):` in your
IDE.

要搜索迁移工具留下的所有注释，请在你的 IDE 中搜索 `TODO(mdc-migration):`

### 4. Verify Your Application

### 4. 验证你的申请

After running the migration and addressing the TODOs, manually verify that everything is working
correctly.

在运行迁移并解决 TODO 之后，手动验证一切是否正常工作。

Run your tests and confirm that they pass. It's possible that your tests depended on internal DOM or
async timing details of the old component implementations and may need to be updated. If you find
you need to update some tests, consider using [component harnesses](./using-component-harnesses) to
make the tests more robust.

运行你的测试并确认它们通过。你的测试可能依赖于内部 DOM 或旧组件实现的异步计时细节，并且可能需要更新。如果你发现需要更新某些测试，请考虑使用[组件挽具](./using-component-harnesses)来使测试更加健壮。

Run your application and verify that the new components look right. Due to the changes in internal
DOM and CSS of the components, you may need to tweak some of your application's styles.

运行你的应用程序并验证新组件是否正确。由于组件内部 DOM 和 CSS 的变化，你可能需要调整应用程序的某些样式。

## Comprehensive List of Changes

## 综合变更清单

### Library-wide Changes

### 库范围内的变化

* Component size, color, spacing, shadows, and animations all change slightly across the board.
  These changes generally improve spec-compliance and accessibility.

  组件大小、颜色、间距、阴影和动画都在整体上略有变化。这些更改通常会提高规范合规性和无障碍性。

* The DOM structure for all components has changed to improve accessibility and better follow the
  Material Design spec.

  所有组件的 DOM 结构均已更改，以提高无障碍性并更好地遵循 Material Design 规范。

* CSS classes applied to components use the `mat-mdc-` prefix, whereas before it was simply a `mat-`
  prefix. Elements that roughly correspond to element in the old implementation have been given the
  same class name (aside from the prefix). For example, the button’s host class is `mat-mdc-button`
  instead of `mat-button`. However, not all elements in the previous implementation have an
  equivalent element in the new implementation.

  应用于组件的 CSS 类使用 `mat-mdc-` 前缀，而之前它只是一个 `mat-` 前缀。大致对应于旧实现中的元素的元素已被赋予相同的类名（除了前缀）。例如，按钮的宿主类是 `mat-mdc-button` 而不再是 `mat-button` 。但是，并非以前实现中的所有元素在新实现中都具有等效元素。

### Theming

### 主题

* Default typography levels defined by `mat.define-typography-config` have been updated to reflect
  changes to the Material Design spec.

  `mat.define-typography-config` 定义的默认排版级别已更新，以反映对 Material Design 规范的更改。

* All components now have themeable density. Styles for the default density level (0) will be
  included by default when you include a theme mixin.

  所有组件现在都具有可主题化的密集度。当你包含主题混合时，默认密集度级别 (0) 的样式将默认包含在内。

  ```scss
  @import '@angular/material' as mat;

  $theme: mat.define-light-theme((
    color: ...
  ));

  // Adds density level 0 styles
  @include mat.all-component-themes($theme);
  ```

  If you prefer a different default density level, you can set it in your theme config:

  如果你喜欢不同的默认密集度级别，可以在主题配置中设置它：

  <!-- TODO(wagnermaciel): link to density docs for more info once they exist. -->

  ```scss
  $theme: mat.define-light-theme((
    color: ...,
    density: -1
  ));
  ```

### Autocomplete

### 自动完成

* Long options now wrap instead of truncating.

  长选项现在将换行而不再是截断。

* Option heights are no longer capped at `48px`.

  选项高度不再以 `48px` 为上限。

* Option list now has an `8px` top and bottom padding.

  选项列表现在有一个 `8px` 的顶部和底部内衬距。

* Options list now has an animation when opening and closing.

  选项列表现在当打开和关闭时会有一个动画。

### Button

### 按钮

* Icon button height and width are `48px` instead of `40px`.

  图标按钮的高度和宽度是 `48px` 而不再是 `40px` 。

* State colors (hover, focus, active) are slightly different to improve text contrast ratios.

  各种状态颜色（悬停、焦点、活动）略有不同，以提高文本对比度。

* Letter-spacing is `1.25px` instead of `normal`.

  字母间距是 `1.25px` 而不再是 `normal` 了。

* FAB supports text with the `extended` input attribute.

  FAB 支持具有 `extended` 输入属性的文本。

* Theming mixins are split into three separate mixins:

  主题 mixin 被分成三个独立的 mixin：

  - Normal button (default, raised, stroked, flat): `mat.mdc-button-theme`

    普通按钮（ default - 默认、raised - 凸起、stroked - 描边、flat - 扁平）： `mat.mdc-button-theme`

  - Icon button: `mat.mdc-icon-button-theme`

    图标按钮： `mat.mdc-icon-button-theme`

  - FAB: `mat.mdc-fab-theme`

* Icons in the button content are placed before the button text. Add the `iconPositionEnd` attribute to place them after the button text.

  按钮内容中的图标放置在按钮文本之前。添加 `iconPositionEnd` 属性可以将它们放在按钮文本之后。

* Icons in the button content inherit the text `font-size`. Buttons with only icons and no text do
  not align properly (this does not apply to the icon-button).

  按钮内容中的图标继承文本的 `font-size` 。只有图标而没有文本的按钮不能正确对齐（这不适用于图标按钮）。

### Card

### 卡片

* By default, mat-card does not apply any internal padding. Instead, this padding is defined on the
  card content areas: `<mat-card-content>`, `<mat-card-header>`, and `<mat-card-actions>`.

  默认情况下，mat-card 不应用任何内衬距。相反，此内衬距是在卡片内容区域定义的： `<mat-card-content>` 、 `<mat-card-header>` 和 `<mat-card-actions>` 。

* `<mat-card-content>` no longer sets any typography styles, users are free to add whatever
  typography styles make sense for their application, either to `<mat-card-content>` itself or any
  child elements as appropriate. For example:

  `<mat-card-content>` 不再设置任何排版样式，用户可以自由添加对其应用程序有意义的任何排版样式，无论是 `<mat-card-content>` 本身还是任何适当的子元素。例如：

  ```scss
  @use '@angular/material' as mat;
  @include mat.typography-hierarchy();
  ```

  ```html
  <mat-card>
    <mat-card-content class="mat-body-1">...</mat-card-content>
  </mat-card>
  ```

### Checkbox

### 复选框

* Clicks on the checkbox now trigger directly on the native checkbox element rather than a shim div.
  Native checkboxes have bizarre behavior when calling `preventDefault` on their `click` event, so
  users should not call `preventDefault` on `click`.

  单击复选框现在直接触发原生复选框元素，而不再是 shim div。原生复选框在其 `click` 事件上调用 `preventDefault` 时会有古怪的行为，因此用户不应在 `click` 上调用 `preventDefault` 。

* Checkbox touch targets are larger, now 40px instead of 16px, which is more accessible. Be sure to
  allow enough space in your layout so that the touch target does not overlap other components. If
  you are not concerned with accessibility you can match the previous size by using density -1 for
  the checkbox.

  复选框触控目标更大，现在为 40px 而不再是 16px，这样会更具无障碍性。请务必在布局中留出足够的空间，以使触控目标不会与其他组件重叠。如果你不关心无障碍性，你可以通过为复选框使用密集度 -1 来匹配以前的大小。

  ```scss
  @use '@angular/material' as mat;
  @include mat.checkbox-density(-1);
  ```

* Checkbox color may be changed to white or black due to a change in heuristics based on the
  application’s theme. Previously, the check’s color would be set to the theme’s background color.
  With MDC, it is determined by whether white or black has the most contrast against the primary
  color.

  由于基于应用程序主题的启发式更改，复选框颜色可能会更改为白色或黑色。以前，检查框的颜色会设置为主题的背景颜色。对于 MDC，它是从白色或黑色中与原色对比度最大的那一个选出的。

* Focus state is slightly darker, improving contrast ratio.

  聚焦状态稍微调暗，提高对比度。

* Text styles are not inherited; you will need to specifically target the checkbox’s `label` to
  override typography properties.

  文本样式不再被继承；你需要专门针对复选框的 `label` 来覆盖排版属性。

* After toggling a checkbox with the mouse, the ripple will remain visible instead of animating out.

  用鼠标选中复选框后，涟漪将保持可见而不是动画后消失。

### Chips

### 纸片

* The chips component has been split into multiple variants corresponding with more appropriate
  interaction patterns for accessibility. The original `mat-chip-list` used `role="listbox"`, but
  this interaction pattern is not suited for all use-cases. The new chips have:

  纸片组件已分为多个变体，分别对应于更合适的无障碍性交互模式。原始的 `mat-chip-list` 使用 `role="listbox"` ，但这种交互模式并不适合所有用例。这些新的纸片组件有：

  * `<mat-chip-listbox>` with `<mat-chip-option>` - this is the closest to the previous interaction
    pattern. This is the only variant that supports selection state for chips. This pattern aligns
    with the filter chips pattern specified in the Material Design spec. This pattern should be used
    when you want the user to select one or more values from a list of options.

    `<mat-chip-listbox>` 和 `<mat-chip-option>` - 这是最接近之前的交互模式。这是唯一支持纸片选择状态的变体。此模式与 Material Design 规范中指定的过滤器纸片模式一致。当你希望用户从选项列表中选择一个或多个值时，应使用此模式。

  * `<mat-chip-grid>` with `<mat-chip-row>` - this pattern should be used for any text input + chips
    interaction.

    `<mat-chip-grid>` 和 `<mat-chip-row>` - 这种模式应用于任何文本输入+纸片交互。

  * `<mat-chip-set>` with `<mat-chip>` - this variant has no accessibility pattern and assumes one
    will be applied at the application level. This allows the application to implement a custom
    accessibility pattern with the chips visuals.

    `<mat-chip-set>` 和 `<mat-chip>` - 此变体没有无障碍模式，并假设只在应用程序级别应用一个。这允许应用程序使用纸片视觉效果实现自定义无障碍模式。

* The migration tool always changes the legacy `<mat-chip-list>` to `<mat-chip-listbox>` to minimize
   differences before and after. You should separately consider changing to `<mat-chip-grid>` or
   `<mat-chip-set>` on a case-by-case basis. See [Chips Interaction Patterns](/components/chips/overview#interaction-patterns) for more guidence on
   choosing the appropriate component for your use case.

  迁移工具总是会将遗留的 `<mat-chip-list>` 更改为 `<mat-chip-listbox>` 以最小化前后的差异。你应该根据具体情况分别考虑将其更改为 `<mat-chip-grid>` 或 `<mat-chip-set>` 。有关如何为你的用例选择适当组件的更多指南，请参阅[纸片交互模式](/components/chips/overview#interaction-patterns)。

### Dialog

### 对话

* The `.mat-dialog-container` does not contain a 24px padding anymore. Instead, the inner dialog
  directives are responsible for adding the right padding. This will be apparent if your dialog does
  not use any of the directives like `<mat-dialog-content>`.

  `.mat-dialog-container` 不再包含 24px 的内衬距。相反，内部对话框指令会负责添加正确的内衬距。如果你的对话框不使用任何像 `<mat-dialog-content>` 这样的指令，这将很明显。

* `mat-dialog-content` uses the font-settings specified by the Material Design spec, which includes
  a rather roomy line-height. If you have an information-dense dialog that doesn't look good with
  these settings, you can avoid using `<mat-dialog-content>` and just use a div with custom padding,
  or use custom typography settings that can be applied with the `mat.mdc-dialog-typography` mixin.

  `mat-dialog-content` 会使用 Material Design 规范指定的字体设置，其中包括相当宽敞的行高。如果你有一个信息密集的对话框，这些设置看起来不太好，你可以避免使用 `<mat-dialog-content>` 并只使用带有自定义内衬距的 div，或者使用可以与 `mat.mdc-dialog-typography` 一起应用的自定义排版设置 `mat.mdc-dialog-typography` mixin。

* The old dialog triggered an extra change detection, which may have masked change detection issues
  in your application that need to be fixed when migrating.

  旧对话框会触发额外的变更检测，这可能掩盖了应用程序中的变更检测问题，这需要在迁移时修复。

### Form Field

### 表单字段

* The "legacy" and "standard" form-field appearance settings no longer exist, as these have been
  dropped from the Material Design spec.

  “旧版 - legacy”和“标准 - standard”表单字段外观设置不再存在，因为它们已从 Material Design 规范中删除。

* The removed "legacy" appearance promoted input placeholders to the floating label if the label was
  not specified. All newer appearance settings require explicitly specifying a `<mat-label>` if one
  was not provided before. This change addresses an accessibility best practice of not using labels
  and placeholders interchangeably.

  如果未指定标签，则删除的“旧版 - legacy”外观会将输入框占位符提升为浮动标签。如果之前未提供，则所有较新的外观设置都需要明确指定 `<mat-label>`。此更改解决了不互换使用标签和占位符的无障碍性最佳实践。

* By default, MatFormField still reserves exactly one line of space below the field for hint or
  error text. However, there is a new option `@Input() subscriptSizing: 'fixed'|'dynamic'`. When
  this setting is set to `fixed` (default), the form-field reserves enough space in the layout to
  show one line of hint or error text. When set to `dynamic`, the form-field expands and contracts
  the amount of space it takes in the layout to fit the error / hint that is currently shown.

  默认情况下，MatFormField 仍然会在字段下方保留一行空间用于提示或错误文本。但是，有一个新选项 `@Input() subscriptSizing: 'fixed'|'dynamic'` 。当此设置设置为 `fixed` （默认）时，表单字段在布局中保留足够的空间来显示一行提示或错误文本。当设置为 `dynamic` 时，表单字段会扩展和收缩它在布局中占用的空间量以适应当前显示的错误/提示。

* The text inside `<mat-hint>` is larger and darker in order to meet W3C text guidelines.

  `<mat-hint>` 中的文本变得更大更暗，以满足 W3C 文本指南。

* While the previous form-field had a single directive for prefixes (`matPrefix`) and a single
  directive for suffixes (`matSuffix`), the MDC-based form-field distinguishes between text
  prefix/suffixes which are baseline aligned with the input text, and icon prefix/suffixes which are
  center aligned in the form-field. Use `matTextPrefix` or `matTextSuffix` to indicate a text
  prefix/suffix, and `matIconPrefix` or `matIconSuffix` to indicate an icon prefix/suffix. The old
  `matSuffix` and `matPrefix` APIs will behave like icons, though they are now deprecated.

  虽然以前的表单字段有一个前缀指令 ( `matPrefix` ) 和一个后缀指令 ( `matSuffix` )，但基于 MDC 的表单字段把它们分成了与输入文本基线对齐的文本前缀/后缀和在表单字段中居中对齐的图标前缀/后缀。使用 `matTextPrefix` 或 `matTextSuffix` 标出文本前缀/后缀，使用 `matIconPrefix` 或 `matIconSuffix` 标出图标前缀/后缀。旧的 `matSuffix` 和 `matPrefix` API 会表现得像图标前缀/后缀，不过它们现在已被弃用。

* The `floatLabel` input no longer accepts `'never'`. `floatLabel="never"` was only supported by the
  legacy form-field appearance which has been dropped. It was used to achieve a floating label that
  behaved like a placeholder. If you need this behavior, use the `placeholder` property on `<input>`
  instead.

  `floatLabel` 输入属性不再接受 `'never'` 值。 `floatLabel="never"` 仅受已删除的旧式表单字段外观的支持。它用于实现行为上类似于占位符的浮动标签。如果你需要此行为，请改用 `<input>` 上的 `placeholder` 属性。

* Custom form field controls may need their styles adjusted to account for the fact that the
  surrounding form field DOM and styles have changed.

  自定义表单字段控件可能需要调整其样式以说明围绕它的表单字段 DOM 和样式已更改的事实。

### Input

### 输入框

* MatInput must be inside `<mat-form-field>`. Previously it was (unintentionally) possible to use an
  `<input matInput>` without the form field if the page loaded form field styles elsewhere.

  MatInput 必须用在 `<mat-form-field>` 内。以前，如果页面在其他地方加载了表单字段样式，则可能会（无意中）用到不在表单字段中的 `<input matInput>` 。

* The MDC-based MatInput hides the native calendar picker indicator associated with
  `<input matInput type="date">`, if you want this indicator to appear for your inputs, use the
  following styles:

  基于 MDC 的 MatInput 隐藏了与 `<input matInput type="date">` 关联的原生日历选择器指示器，如果你希望此指示器出现在你的输入中，请使用以下样式：

  ```scss
  .mat-mdc-input-element::-webkit-calendar-picker-indicator {
    display: block;
  }
  ```

### List

### 列表

* The API has been reworked to support text wrapping and better integration with the Material Design
  specification.

  此 API 已经过重新设计以支持文本换行并更好地与 Material Design 规范集成。

* Previously, list items were commonly created using multiple `span` elements with the `matLine`
  directive applied. Each `span` resulting in a line, and the first one becoming the primary line.
  With the new API, the `matLine` directive has been split into two more granular and meaningful
  directives:

  以前，列表项通常是使用应用了 `matLine` 指令的多个 `span` 元素创建的。每个 `span` 产生一条线，第一个成为主线。使用新 API 时，`matLine` 指令已拆分为两个更细粒度、更有意义的指令：

  * `matListItemTitle`
  * `matListItemLine`

* Text outside of a `matListItemLine` (so-called "unscoped content") will result in an additional
  line being acquired (as if the content was put into a line).

  `matListItemLine` 之外的文本（所谓的“未限定范围的内容”）将导致获取额外的一行（就好像其内容被放进了一行）。

  ```html
  <mat-list-item>
    <span matListItemTitle>Title</span>
    Second line
  </mat-list-item>
  ```

* The list automatically infers the number of lines of text content. For example, in the snippet
  above, the list item renders space for two lines. With the new API, you can set an explicit number
  of lines on the `<mat-list-item>` to manually control wrapping.

  该列表会自动推断文本内容的行数。例如，在上面的代码片段中，列表项会渲染成两行的空间。使用新的 API，你可以在 `<mat-list-item>` 上设置明确的行数以手动控制换行。

  ```html
  <mat-list-item lines="3">
    <span matListItemTitle>Title</span>
    This text will wrap into the third line. Space for three lines is acquired by the
    list item.
  </mat-list-item>
  ```

  Note that text inside a `matListItemTitle` or `matListItemLine` will never wrap. Only unscoped
  content will wrap/take up the remaining space based on explicit number of lines provided.

  请注意，`matListItemTitle` 或 `matListItemLine` 中的文本永远不会换行。根据提供的明确行数，只有未限定范围的内容才会包装/占用剩余空间。

* Aside from the differences in how lines are composed, some other directives have been renamed to
  use more explicit naming:

  除了行的组成方式不同之外，其他一些指令已经重命名，以便使用更明确的名称：

  * `matListIcon` is now `matListItemIcon`

    `matListIcon` 现在是 `matListItemIcon`

  * `matListAvatar` is now `matListItemAvatar`

    `matListAvatar` 现在是 `matListItemAvatar`

* Lastly, also a new directive (`matListItemMeta`) is available to put content into the meta section
  of a list item (usually the end of the list item). Previously unscoped content in a list item was
  put into the meta section.

  最后，还有一个新指令 ( `matListItemMeta` ) 可用于将内容放入列表项的元（meta）部分（通常是列表项的末尾）。列表项中以前未限定范围的内容会被放入元部分。

* Recommended migration steps for common use of a list item:

  常用列表项的推荐迁移步骤：

  1. Change the first `matLine` to `matListItemTitle`

     将第一个 `matLine` 更改为 `matListItemTitle`

  2. Change all other `matLine`'s to `matListItemLine`

     将所有其他 `matLine` 更改为 `matListItemLine`

  3. Change all `matListIcon` to `matListItemIcon`

     将所有 `matListIcon` 更改为 `matListItemIcon`

  4. Change all `matListAvatar` to `matListItemAvatar`

     将所有 `matListAvatar` 更改为 `matListItemAvatar`

  5. Wrap all unscoped content (content outside a `matLine`) in a `matListItemMeta` container.

     将所有未限定范围的内容（ `matLine` 之外的内容）包装在 `matListItemMeta` 容器中。

### Menu

### 菜单

* The icon for a menu item appears before the text, regardless of the order in the DOM.

  无论在 DOM 中的顺序如何，菜单项的图标总是会出现在文本之前。

  * If you have a piece of content such as an `<img>` that you want to use in place of a
    `<mat-icon>` use `ngProjectAs="mat-icon"` to project it into the icon slot.

    如果你有一段内容，例如 `<img>` ，你想用它来代替 `<mat-icon>` 使用 `ngProjectAs="mat-icon"` 将它投射到图标槽中。

  * If you need your icon to appear at the end of the item (not officially supported by the spec)
    you can wrap both the text and your icon in a span, for example:

    如果你需要图标出现在条目的末尾（规范未正式支持），你可以将文本和图标包裹在一个 span 内，例如：

    ```html
    <span>
      <span>Text</span>
      <mat-icon>end_icon</mat-icon>
    </span>
    ```

* The text in menu items wraps instead of being hidden with an ellipses.

  菜单项中的文本将换行而不再用省略号隐藏。

* Menu item heights are no longer capped at `48px`.

  菜单项高度不再以 `48px` 为上限。

* Menu elevation starts from level 8, instead of level 4.

  菜单纵深从第 8 级开始，而不再是第 4 级。

### Option / Optgroup

### 选项/选项组

* Long options now wrap instead of truncating with an ellipsis.

  长选项现在将换行而不再用省略号截断。

* Option heights are no longer capped at `48px`.

  选项高度不再以 `48px` 为上限。

### Paginator

### 分页器

* The form-field inside of `mat-paginator` only supports the `appearance` options offered by the new
  form-field (`fill` and `outline`).

  `mat-paginator` 中的表单字段仅支持新表单字段提供的 `appearance` 选项（ `fill` 和 `outline` ）。

### Progress Bar

### 进度条

* Visibility on internal elements is now set to `visible`. Setting `visibility: hidden` will no
  longer hide all internal elements. Instead, style it with `opacity: 0`, `display: none`, or
  remove it completely with `ngIf`.

  内部元素的可见性现在设置为 `visible` 。设置 `visibility: hidden` 将不再隐藏所有内部元素。要改为使用 `opacity: 0` 、 `display: none` 设置样式，或使用 `ngIf` 完全删除它。

* Height is always set to 4px and does not get shorter or taller using `height` styles.

  高度始终设置为 4px，并且不会使用 `height` 样式来变短或变高。

### Progress Spinner

### 进度圈

* Host element is no longer `display: block` which may affect layout. To fix layout issues add
  `display: block` back to the element.

  宿主元素不再是 `display: block` 的。要修复布局问题，请将 `display: block` 添加回此元素。

### Radio

### 单选

* Radio button labels are no longer `width: 100%`. This helps prevent users from accidentally
  selecting a radio when clicking on whitespace that appears inert on the page.

  单选按钮标签不再是 `width: 100%`。这有助于防止用户在偶然单击页面上的空白时意外选中单选按钮。

* Labels are smaller and further away from the radio button to align with the Material Design spec.

  标签更小，距离单选按钮更远，以符合 Material Design 规范。

* The touch target is now much larger and more accessible. Be sure to allow enough space in your
  layout so that the touch target does not overlap other components. If you are not concerned with
  accessibility you can match the previous size by using density -1 for the radio.

  触控目标现在更大且更具无障碍性。请务必在布局中留出足够的空间，以使触控目标不会与其他组件重叠。如果你不关心无障碍性，你可以通过对单选按钮使用密集度 -1 来匹配以前的大小。

  ```scss
  @use '@angular/material' as mat;
  @include mat.radio-density(-1);
  ```

### Select

### 选择框

* `MatSelect` no longer aligns the selected option in the dropdown menu with the trigger text.

  `MatSelect` 不再将下拉菜单中的选定选项与触发器文本对齐。

* Long options now wrap instead of truncating.

  长选项现在将换行而不再截断。

* Option heights are no longer capped at `48px`.

  选项高度不再以 `48px` 为上限。

* Option list now has an `8px` top and bottom padding.

  选项列表现在有一个 `8px` 的顶部和底部内衬距。

* Option list animation has changed.

  选项列表动画已更改。

* Previously the dropdown menu width could be wider than the parent form-field, but now the dropdown
  is the same width as the form-field

  以前下拉菜单的宽度可能比父表单字段宽，但现在下拉菜单的宽度与表单字段的宽度相同

### Slide Toggle

### 滑动开关

* To improve accessibility, the MDC-based version uses `<button role="switch">` to represent the
  toggle rather than `<input type="checkbox">`. Slide toggle will no longer respond to native form
  validation. Consider alternative approaches to form validation.

  为了提高无障碍性，基于 MDC 的版本使用 `<button role="switch">` 来表示切换而不再是 `<input type="checkbox">` 。滑动开关将不再响应原生表单验证。要考虑表单验证的替代方法。

* The touch target is much larger and more accessible. Be sure to allow enough space in your
  layout so that the touch target does not overlap other components. If you are not concerned with
  accessibility you can match the previous size by using density -1 for the slide-toggle.

  触控目标更大且更具无障碍性。请务必在布局中留出足够的空间，以使触控目标不会与其他组件重叠。如果你不关心无障碍性，你可以通过使用密集度 -1 进行滑动开关来匹配以前的大小。

  ```scss
  @use '@angular/material' as mat;
  @include mat.slide-toggle-density(-1);
  ```

* The label is closer to the enabled toggle

  标签离已启用的开关更近了

### Slider

### 滑块

* Sliders now work with mobile device screen readers.

  滑块现在可与移动设备屏幕阅读器配合使用。

* The slider template API has changed from a single `<mat-slider>` element to a `<mat-slider>`
  element which contains one or two `<input>` elements (depending on whether the slider should)
  be a standard or range slider. E.g.

  滑块模板 API 已从单个 `<mat-slider>` 元素更改为包含一个或两个 `<input>` 元素（取决于滑块是否应为标准滑块或范围滑块）的 `<mat-slider>` 元素。例如

  ```html
    <!-- Single slider -->
    <mat-slider>
      <input matSliderThumb>
    </mat-slider>

    <!-- Range slider -->
    <mat-slider>
      <input matSliderStartThumb>
      <input matSliderEndThumb>
    </mat-slider>
  ```

* The new `discrete` property on the `<mat-slider>` now controls whether the slider has tick marks
  and a value indicator tooltip. It replaces `thumbLabel`.

  `<mat-slider>` 上的新 `discrete` 属性现在控制滑块是否具有刻度线和值指示器工具提示。它取代了 `thumbLabel` 。

  ```html
  <!-- Before -->
  <mat-slider thumbLabel></mat-slider>

  <!-- After -->
  <mat-slider discrete>
    <input matSliderThumb>
  </mat-slider>
  ```

* The `tickInterval` property has been removed. To switch to the new API, use `showTickMarks` to
  create a slider with tick marks, and the interval for your tick marks will match your slider's
  `step`. The `tickInterval` property is under consideration to be added back in future releases.

  `tickInterval` 属性已被删除。要切换到新 API，请使用 `showTickMarks` 创建带有刻度线的滑块，刻度线的间隔将与滑块的 `step` 相匹配。 `tickInterval` 属性正在考虑在未来的版本中加回来。

  ```html
  <!-- Before -->
  <mat-slider tickInterval="5" step="5"></mat-slider>

  <!-- After -->
  <mat-slider step="5" showTickMarks>
    <input matSliderThumb>
  </mat-slider>
  ```

* The `displayValue` property has been removed. The suggested alternative for controlling the
  value indicator text is to provide a function via `displayWith`.

  `displayValue` 属性已被删除。控制值指示器文本的建议替代方法是通过 `displayWith` 提供一个函数。

  ```html
  <!-- Before -->
  <mat-slider [displayValue]="myDisplayValue"></mat-slider>

  <!-- After -->
  <mat-slider [displayWith]="myDisplayWithFn">
    <input matSliderThumb>
  </mat-slider>
  ```

* The `valueText` property is now removed in favor of directly using the native input's
  aria-valuetext or providing a `displayWith` function.

  现在删除了 `valueText` 属性，以支持直接使用原生输入框的 aria-valuetext 或提供 `displayWith` 函数。

  ```html
  <!-- Before -->
  <mat-slider [valueText]="myValueText"></mat-slider>

  <!-- After (Option 1) -->
  <mat-slider>
    <input [attr.aria-valuetext]="myValueText" matSliderThumb>
  </mat-slider>

  <!-- After (Option 2) -->
  <mat-slider [displayWith]="myDisplayWithFn">
    <input matSliderThumb>
  </mat-slider>
  ```

* The slider API has also changed such that there are two new components: `MatSliderThumb` and
  `MatSliderRangeThumb`. They provide the following properties:

  滑块 API 也发生了变化，因此有两个新组件： `MatSliderThumb` 和 `MatSliderRangeThumb` 。它们提供以下属性：

  - `@Input() value: number`

  - `@Output() valueChange: EventEmitter<number>`

  - `@Output() dragEnd: EventEmitter<MatSliderDragEvent>`

  - `@Output() dragStart: EventEmitter<MatSliderDragEvent>`

  - `percentage: number`

    And the following methods:

    以及以下方法：

  - `blur`

  - `focus`

* To accommodate range sliders, the implementation has changed from the `<mat-slider>` element being
  the form control to the `<mat-slider>` element containing 1-2 `<input>` elements (the slider
  "thumbs") that act as the form control(s). The value, associated events (`input`, `change`), and
  labels (`aria-label`) now live on the `<input>` elements instead.

  为了适应范围滑块，实现已从作为表单控件的 `<mat-slider>` 元素更改为包含 1-2 个 `<input>` 元素（滑块的“Thumbs”）作为表单控件的 `<mat-slider>` 元素。值、关联事件（ `input` 、 `change` ）和标签（ `aria-label` ）现在改为放在 `<input>` 元素上。

* Vertical sliders and inverted sliders are no longer supported, as they are no longer part of the
  Material Design spec. As a result, the `invert` and `vertical` properties have been removed.

  不再支持垂直滑块和反转滑块，因为它们不再是 Material Design 规范的一部分。因此，`invert` 和 `vertical` 属性已被删除。

### Snack Bar

### 快餐栏

* For simple, text-based snack-bars, there are no significant changes.

  对于简单的、基于文本的快餐栏，没有重大变化。

* For simple snack-bars with an action button, they use the MDC-based mat-button, so your
  application will need to include the Sass theming mixin for the MDC-based button.

  对于带有操作按钮的简单快餐栏，它们使用基于 MDC 的 mat-button，因此你的应用程序需要包含用于基于 MDC 的按钮的 Sass 主题 mixin。

* For snack-bars that use custom structured content (if you call `MatSnackBar.openFromComponent` or
  `MatSnackBar.openFromTemplate`), you should use the following new directives to annotate your
  content:

  对于使用自定义结构化内容的快餐栏（如果你调用 `MatSnackBar.openFromComponent` 或 `MatSnackBar.openFromTemplate` ），你应该使用以下新指令来标记出你的内容：

  * `matSnackBarLabel` to mark the text displayed to users

    用 `matSnackBarLabel` 标记显示给用户的文本

  * `matSnackBarActions` to mark the element containing the action buttons

    用 `matSnackBarActions` 标记包含操作按钮的元素

  * `matSnackBarAction` to mark individual action buttons

    用 `matSnackBarAction` 标记单个操作按钮

  * If you do not specify any of these directives, it will treat the entire custom component /
    template as text.

    如果你不指定这些指令中的任何一个，它将把整个自定义组件/模板视为文本。

* Tests that open a snack-bar now require calling `flush()` before attempting to access the content
  of the snackbar. Updating your tests to use [component harnesses](./using-component-harnesses)
  before running the migration tool should make this transition seamless.

  打开快餐栏的测试现在需要在尝试访问快餐栏的内容之前调用 `flush()`。在运行迁移工具之前更新你的测试以使用[组件挽具](./using-component-harnesses)应该可以无缝过渡。

### Table

### 表格

* All cells have a `16px` left and right padding instead of just the leftmost and rightmost cells
  having a padding of `24px`.

  所有单元格都有 `16px` 的左右内衬距，而不再是只有最左边和最右边的单元格有 `24px` 的内衬距。

* Header cells have the same color and text size as the data rows instead of having more grayish and
  smaller text.

  标题单元格具有与数据行相同的颜色和文本大小，而不再是具有更浅的灰色和更小的文本。

* Cell text no longer wraps by default. Cell wrapping can be enabled by applying
  `white-space: normal` to the table cells.

  默认情况下，单元格文本不再换行。可以通过把 `white-space: normal` 应用到单元格来为其启用换行。

* Row height is `52px` instead of `48px`.

  行高是 `52px` 而不再是 `48px` 。

* Cell box-sizing is `border-box` instead of `content-box`. This may affect custom width styles.

  单元格的 box-sizing 是 `border-box` 而不再是 `content-box` 。这可能会影响自定义宽度样式。

* The table's last row does not include a bottom border row because the table is expected to have a
  border.

  表格的最后一行不再包含底部边框线，因为表格应该有自己的边框。

* The paginator property of the `MatTableDataSource` has a generic interface that matches most, but
  not all of the paginator API. You may need to explicitly type the paginator to access the full
  API, for example: `new MatTableDataSource<MyData, MatPaginator>();`

  `MatTableDataSource` 的 paginator 属性有一个通用接口，可以匹配大多数但不是所有的 paginator API。你可能需要明确指定分页器的类型才能访问完整的 API，例如： `new MatTableDataSource<MyData, MatPaginator>();`

* Flex tables (`<mat-table>`) display a border on the cells instead of rows.

  弹性表格 ( `<mat-table>` ) 会在单元格而不是行上显示边框。

* Flex table (`<mat-table>`) row height is set with `height` instead of `min-height`.

  弹性表格 ( `<mat-table>` ) 用 `height` 设置行高而不再是 `min-height` 。

### Tabs

### 选项卡

* Header label text color matches the theme color when the tab header is selected.

  选择选项卡标题时，标题标签文本颜色会与主题颜色匹配。

* Header labels stretch to fill the container's width. This can be turned off by
  setting the `<mat-tab-group>` input `mat-stretch-tabs` to `false`.

  标头标签会拉伸以填充容器的宽度。这可以通过将 `<mat-tab-group>` 的输入属性 `mat-stretch-tabs` 设置为 `false` 来关闭。

* The `<mat-tab-nav-bar>` requires a reference to a `<mat-tab-nav-panel>` using the `tabPanel`
  input. The `<mat-tab-nav-panel>` must wrap the content connected to the nav-bar. This allows the
  component to provide correct labeling for assistive technology.

  `<mat-tab-nav-bar>` 需要使用 `tabPanel` 输入属性来引用 `<mat-tab-nav-panel>` 。 `<mat-tab-nav-panel>` 必须包裹已连接到导航栏的内容。这允许组件为无障碍技术提供正确的标签。

  ```html
  <!-- Before -->
  <mat-tab-nav-bar>...</mat-tab-nav-bar>

  <!-- After -->
  <mat-tab-nav-bar [tabPanel]="tabPanel">...</mat-tab-nav-bar>
  <mat-tab-nav-panel #tabPanel>...</mat-tab-nav-panel>
  ```

### Tooltip

### 工具提示

* Background color is opaque instead of slightly transparent. This improves accessibility.

  背景颜色是不透明的，而不再是稍微透明的。这提高了无障碍性。

* Default font-size is `12px` instead of `10px`.

  默认字体大小是 `12px` 而不再是 `10px` 。

* Line height is `normal` instead of `16px`.

  行高是 `normal`，而不再是 `16px` 。

* Text overflow is `ellipsis` instead of `clip`.

  文本溢出是 `ellipsis` 而不再是 `clip` 。

* There is a new minimum width of `40px`.

  有一个新的最小宽度 `40px` 。

* Text alignment for single line tooltips is `center`. Multi-line tooltips use `left` alignment.

  单行工具提示的文本对齐方式为 `center` 。多行工具提示使用 `left` 对齐。
