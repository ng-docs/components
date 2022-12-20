# Customizing Angular Material component styles

# 自定义 Angular Material 组件样式

Angular Material supports customizing component styles via Sass API as described in the [theming
guide][]. This document provides guidance on defining custom CSS rules that directly style
Angular Material components.

Angular Material 支持通过 Sass API 自定义组件样式，如[主题指南][]中所述。本文档提供了一个指南，用于指导如何定义自定义 CSS 规则，以便直接设置 Angular Material 组件的样式。

[theming guide]: https://material.angular.io/guide/theming

[主题指南]: https://material.angular.cn/guide/theming

## Targeting custom styles

## 定位自定义样式

### Component host elements

### 组件的宿主元素

For any Angular Material component, you can safely define custom CSS for a component's host element
that affect the positioning or layout of that component, such as `margin`, `position`, `top`,
`left`, `transform`, and `z-index`. You should apply such styles by defining a custom CSS
class and applying that class to the component's host element.

对于任何 Angular Material 组件，你可以安全地为组件的宿主元素自定义 CSS，以便影响组件的位置或布局，例如 `margin`、`position`、`top`、`left`、`transform` 和 `z-index`。你应该通过自定义 CSS 类并将该类应用于组件的宿主元素来应用这个类。

Avoid defining custom styles that would affect the size or internal layout of the component, such as
`padding`, `height`, `width`, or `overflow`. You can specify `display: none` to hide a component,
but avoid specifying any other `display` value. Overriding these properties can break components
in unexpected ways as the internal styles change between releases.

要避免定义会影响组件大小或内部布局的自定义样式，例如 `padding`、`height`、`width` 或 `overflow`。你可以指定 `display: none` 来隐藏组件，但尽量不要指定任何其他 `display` 值。当其内部样式在发行版之间发生变化时，覆盖这些属性可能会以意想不到的方式破坏组件。

### Internal component elements

### 组件的内部元素

Avoid any custom styles or overrides on internal elements within a Angular Material components.
The DOM structure and CSS classes applied for each component may change at any time, causing custom
styles to break.

避免在 Angular Material 组件中的内部元素上使用任何自定义样式或进行 CSS 覆盖。各个组件的 DOM 结构和 CSS 类都可能随时更改，从而导致这些自定义样式被破坏。

## Applying styles to Angular Material components

## 将样式应用于 Angular Material 组件

While Angular Material does not support defining custom styles or CSS overrides on components'
internal elements, you might choose to do this anyway. There are three points to consider while
customizing styles for Angular Material components: view encapsulation, CSS specificity, and
rendering location.

虽然 Angular Material 不支持在组件的内部元素上定义自定义样式或进行 CSS 覆盖，但是你仍然可以选择这样做。自定义 Angular Material 组件的样式时，需要考虑三点：视图封装、CSS 特异度和渲染位置。

### View encapsulation

### 视图封装

By default, Angular scopes component styles to exclusively affect that component's view. This means
that the styles you author affect only the elements directly within your component template.
Encapsulated styles do *not* affect elements that are children of other components within your
template. You can read more about view encapsulation in the
[Angular documentation](https://angular.io/guide/component-styles#view-encapsulation). You may
also wish to review
[_The State of CSS in Angular_](https://blog.angular.io/the-state-of-css-in-angular-4a52d4bd2700)
on the Angular blog.

默认情况下，Angular 范围化组件的样式只会影响该组件的视图本身。也就是说你写的任何样式都只会影响到你这个组件模板中的直属元素。 封装过的样式**不会**影响到你模板中用到的其它组件的任何子元素。你可以到 [Angular 官方文档](https://angular.cn/guide/component-styles#view-encapsulation)中了解关于视图封装的更多知识。还可以到 Angular 官方博客中读一下 [*Angular 中 CSS 的状态*](https://blog.angular.cn/the-state-of-css-in-angular-4a52d4bd2700)。

#### Bypassing encapsulation

#### 绕过封装

Angular Material disables style encapsulation for all components in the library. However, the
default style encapsulation in your own components still prevents custom styles from leaking into
Angular Material components.

Angular Material 禁用了库中所有组件的样式封装。但是，在你自己的组件中使用默认的样式封装方式仍然可以防止自定义样式泄漏到 Angular Material 组件中。

If your component enables view encapsulation, your component styles will only
affect the elements explicitly defined in your template. To affect descendants of components used
in your template, you can use one of the following approaches:

如果你的组件启用了视图封装，那么它的样式只会影响到模板中显式定义的元素。要影响模板中使用的组件的后代，可以使用以下方法之一：

1. Define custom styles in a global stylesheet declared in the `styles` array of your `angular.json`
   configuration file.

   在 `angular.json` 配置文件的 `styles` 数组中声明的全局样式表中自定义样式。

2. Disable view encapsulation for your component. This approach effectively turns your component
   styles into global CSS.

   禁用组件的视图封装。这种方法可以有效地将你的组件样式转换为全局 CSS。

3. Apply the deprecated `::ng-deep` pseudo-class to a CSS rule. Any CSS rule with `::ng-deep`
   becomes a global style. [See the Angular documentation for more on `::ng-deep`][ng-deep].

   将已弃用的 `::ng-deep` 伪类应用于 CSS 规则。 任何 `::ng-deep` CSS 规则都将成为全局样式。请参阅 Angular 文档以获取有关 [`::ng-deep`][ng-deep] 的更多信息。

All of these approaches involve creating global CSS that isn't affected by style encapsulation.
Global CSS affects all elements in your application. Global CSS class names may collide with class
names defined by components. Global CSS is often a source of hard-to-diagnose bugs and is generally
difficult to maintain.

所有这些方法都可以创建不受样式封装影响的全局 CSS。这些全局 CSS 会影响应用程序中的所有元素。其类名可能与组件中定义的类名冲突。全局 CSS 容易导致难以诊断的错误，并且通常很难维护。

[ng-deep]: https://angular.io/guide/component-styles#deprecated-deep--and-ng-deep

### CSS specificity

### CSS 特异度

Each CSS declaration has a level of *specificity* based on the type and number of selectors used.
More specific styles take precedence over less specific styles. Angular Material generally attempts
to use the least specific selectors possible. However, Angular Material may change component style
specificity at any time, making custom overrides brittle and prone to breaking.

每个 CSS 声明都具有一个*特异度*级别，取决于所用到的选择器的类型和数量。特异度较高的样式也会有较高的优先级。Angular Material 自己会在组件中使用尽可能小的特异度。不过，Angular Material 将来也可能更改组件样式的特异度，这可能会让你的自定义覆盖规则变得脆弱、容易被破坏。

You can read more about specificity and how it is calculated on the
[MDN web docs](https://developer.mozilla.org/en-US/docs/Web/CSS/Specificity).

你可以到 [MDN Web 文档](https://developer.mozilla.org/en-US/docs/Web/CSS/Specificity)中深入了解特异度及其计算方法。

### Rendering location

### 渲染位置

Some Angular Material components render elements that are not direct DOM descendants of the
component's host element. In particular, overlay-based components such as `MatDialog`, `MatMenu`,
`MatTooltip`, etc. render into an overlay container element directly on the document body. Because
these components render elements outside of your application's components, component-specific styles
will not apply to these elements. You can define styles for these elements as global styles.

某些 Angular Material 组件所渲染的元素不是该组件的宿主元素的直接 DOM 后代。特别是，基于浮层的组件（例如 `MatDialog`、`MatMenu`、`MatTooltip` 等）会直接渲染到 body 上的浮层容器元素中。因为这些组件会在应用程序的组件之外渲染元素，所以特定于组件的样式不适用于这些元素。你可以将这些元素的样式定义为全局样式。

#### Styling overlay components

#### 为浮层组件设置样式

Overlay-based components have a `panelClass` property, or similar, that let you target the
overlay pane. The following example shows how to add an `outline` style with `MatDialog`.

基于浮层的组件具有一个 `panelClass` 属性或类似属性，可用于定位浮层面板。下面的示例演示了如何为 `MatDialog` 添加 `outline` 样式。

```scss
// Add this to your global stylesheet after including theme mixins.
.my-outlined-dialog {
  outline: 2px solid purple;
}
```

```ts
this.dialog.open(MyDialogComponent, {panelClass: 'my-outlined-dialog'})
```

You should always apply an application-specific prefix to global CSS classes to avoid naming
collisions.

你应该始终将应用程序特有的前缀应用于全局 CSS 类，以避免命名冲突。