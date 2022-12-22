# Avoiding duplicated theming styles

# 避免重复的主题样式

As explained in the [theming guide](./theming.md), a theme in Angular Material consists of
configurations for the `color`, `density` and `typography` systems. As some of these individual
systems have default configurations, some usage patterns may cause duplication in the CSS output.

正如[主题指南](./theming.md)中所解释的，Angular Material 中的主题包括 `color`（颜色）、`density`（密集度）和 `typography`（排版）体系的配置。由于某些独立体系具有其默认配置，因此在某些使用模式下可能导致重复的 CSS 输出。

Below are examples of patterns that generate duplicative theme styles:

下面是一个会生成重复主题样式的使用模式的例子：

**Example #1**

**例子＃1**

```scss
@use '@angular/material' as mat;

$light-theme: mat.define-light-theme((color: ...));
$dark-theme: mat.define-dark-theme((color: ...));

// Generates styles for all systems configured in the theme. In this case, color styles
// and default density styles are generated. Density is in themes by default.
@include mat.all-component-themes($light-theme);

.dark-theme {
  // Generates styles for all systems configured in the theme. In this case, color styles
  // and the default density styles are generated. **Note** that this is a problem because it
  // means that density styles are generated *again*, even though only the color should change.
  @include mat.all-component-themes($dark-theme);
}
```

To fix this, you can use the dedicated mixin for color styles for the `.dark-theme`
selector. Replace the `all-component-themes` mixin and include the dark theme using the
`all-component-colors` mixin. For example:

为了解决这个问题，你可以使用专门的 mixin 作为 `.dark-theme` 选择器的颜色样式。请替换 `all-component-themes` mixin 并使用 `all-component-colors` mixin 来包含黑色主题。例如：

```scss
@use '@angular/material' as mat;

...
@include mat.all-component-themes($light-theme);

.dark-theme {
  // This mixin only generates the color styles now.
  @include mat.all-component-colors($dark-theme);
}
```

Typography can also be configured via Sass mixin; see `all-component-typographies`.

排版也可以通过 Sass mixin 进行配置。参见 `all-component-typographies` 。

**Example #2**

**例子＃2**

Theme styles could also be duplicated if individual theme mixins are used. For example:

如果使用了一些独立的主题 mixins，主题样式也可能重复。例如：

```scss
@use '@angular/material' as mat;

@include mat.all-component-themes($my-theme);

.my-custom-dark-button {
  // This will also generate the default density styles again.
  @include mat.button-theme($my-theme);
}
```

To avoid this duplication of styles, use the dedicated mixin for the color system and
extract the configuration for the color system from the theme.

为了避免这种样式重复，可以使用专用的 mixin 作为颜色体系，并从主题中提取颜色体系的配置。

```scss
@use '@angular/material' as mat;

.my-custom-dark-button {
  // This will only generate the color styles for `mat-button`.
  @include mat.button-color($my-theme);
}
```

## Disabling duplication warnings

## 禁用重复警告

If your application intentionally duplicates styles, a global Sass variable can be
set to disable duplication warnings from Angular Material. For example:

如果你的应用要故意重复样式，可以设置一个全局 Sass 变量，以禁用 Angular Material 中的重复警告。例如：

```scss
@use '@angular/material' as mat;

mat.$theme-ignore-duplication-warnings: true;

// Include themes as usual.
@include mat.all-component-themes($light-theme);

...
```
