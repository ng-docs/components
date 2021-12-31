# Theme your own components with Angular Material's theming system

# 使用 Angular Material 的主题体系为你自己的组件设置主题

You can use Angular Material's Sass-based theming system for your own custom components.

你可以将 Angular Material 基于 Sass 的主题体系用于自定义组件。

## Reading style values from a theme

## 从主题中读取样式值

As described in the [theming guide][theme-map], a theme is a Sass map that contains style values to
customize components. Angular Material provides APIs for reading values from this data structure.

如[主题指南][theme-map]中所述，主题是一个 Sass 映射表，其中包含用于自定义组件的样式值。 Angular Material 提供了一些用于从该数据结构中读取值的 API。

[theme-map]: https://material.angular.io/guide/theming#themes

### Reading color values

### 读取颜色值

To read color values from a theme, you can use the `get-color-config` Sass function. This function
returns a Sass map containing the theme's primary, accent, and warn palettes, as well as a flag
indicating whether dark mode is set.

要从主题中读取颜色值，你可以使用 Sass 函数 `get-color-config`。此函数返回一个 Sass 映射表，其中包含主题的 `primary`（主要）调色板、`accent`（强调）调色板和 `warn`（警告）调色板，以及指示是否设置了暗模式的标志。

```scss
@use 'sass:map';
@use '@angular/material' as mat;

$color-config:    mat.get-color-config($theme);
$primary-palette: map.get($color-config, 'primary');
$accent-palette:  map.get($color-config, 'accent');
$warn-palette:    map.get($color-config, 'warn');
$is-dark-theme:   map.get($color-config, 'is-dark');
```

See the [theming guide][theme-read-hues] for more information on reading hues from palettes.

关于从调色板读取色调的更多信息，请参阅[主题指南][theme-read-hues]。

[theme-read-hues]: https://material.angular.io/guide/theming#reading-hues-from-palettes

### Reading typography values

### 读取排版值

To read typography values from a theme, you can use the `get-typography-config` Sass function. See
the [Typography guide][typography-config] for more information about the typography config data
structure and for APIs for reading values from this config.

要从主题中读取排版值，你可以使用 Sass 函数 `get-typography-config`。有关排版配置数据结构和用来从此配置中读取值的 API 的更多信息，请参阅[排版指南][typography-config]。

[typography-config]: https://material.angular.io/guide/typography#typography-config

```scss
@use '@angular/material' as mat;

$typography-config: mat.get-typography-config($theme);
$my-font-family: mat.font-family($typography-config);
```

## Separating theme styles

## 分离主题样式

Angular Material components each have a Sass file that defines mixins for customizing
that component's color and typography. For example, `MatButton` has mixins for `button-color` and
`button-typography`. Each mixin emits all color and typography styles for that component,
respectively.

每个 Angular Material 组件都有一个 Sass 文件，该文件定义了用于自定义该组件的颜色和排版的 mixin。例如：`MatButton` 具有 `button-color` 和 `button-typography` 这两个 mixin。它们分别生成该组件的所有颜色和排版样式。

You can mirror this structure in your components by defining your own mixins. These mixins
should accept an Angular Material theme, from which they can read color and typography values. You
can then include these mixins in your application along with Angular Material's own mixins.

你可以通过定义自己的 mixin，在你的组件中模仿这种结构。这些 mixin 应该接受一个 Angular Material 主题，它们可以从中读取颜色和排版值。然后，你可以将这些 mixin 与 Angular Material 自己的 mixins 一起包含在你的应用程序中。

## Step-by-step example

## 分步示例

To illustrate participation in Angular Material's theming system, we can look at an example of a
custom carousel component. The carousel starts with a single file, `carousel.scss`, that contains
structural, color, and typography styles. This file is included in the `styleUrls` of the component.

为了说明如何融入 Angular Material 的主题体系，我们可以看一个自定义轮播组件的示例。 此轮播组件从单一文件 `carousel.scss` 开始，其中包含结构、颜色和排版样式。该文件包含在组件的 `styleUrls` 中。

```scss
// carousel.scss

.my-carousel {
  display: flex;
  font-family: serif;
}

.my-carousel-button {
  border-radius: 50%;
  color: blue;
}
```

### Step 1: Extract theme-based styles to a separate file

### 步骤 1：将基于主题的样式提取到单独的文件中

To change this file to participate in Angular Material's theming system, we split the styles into
two files, with the color and typography styles moved into mixins. By convention, the new file
name ends with `-theme`. Additionally, the file starts with an underscore (`_`), indicating that
this is a Sass partial file. See the [Sass documentation][sass-partials] for more information about
partial files.

为了更改此文件以融入 Angular Material 的主题体系，我们将这些样式拆分为两个文件，把颜色和排版样式移动到 mixin 中。按照惯例，新文件名以 `-theme` 结尾。此外，该文件以下划线 (`_`) 开头，以表明这是一个 Sass “部分（partial）文件”。关于“部分文件”的更多信息，请参阅 [Sass 文档][sass-partials]。

[sass-partials]: https://sass-lang.com/guide#topic-4

```scss
// carousel.scss

.my-carousel {
  display: flex;
}

.my-carousel-button {
  border-radius: 50%;
}
```

```scss
// _carousel-theme.scss

@mixin color($theme) {
  .my-carousel-button {
    color: blue;
  }
}

@mixin typography($theme) {
  .my-carousel {
    font-family: serif;
  }
}
```

### Step 2: Use values from the theme

### 第 2 步：使用主题中的值

Now that theme theme-based styles reside in mixins, we can extract the values we need from the
theme passed into the mixins.

现在，这些基于主题的样式都存在于 mixin 中，我们可以从传给这些 mixin 的主题中提取我们需要的值。

```scss
// _carousel-theme.scss

@use 'sass:map';
@use '@angular/material' as mat;

@mixin color($theme) {
  // Get the color config from the theme.
  $color-config: mat.get-color-config($theme);

  // Get the primary color palette from the color-config.
  $primary-palette: map.get($color-config, 'primary');

  .my-carousel-button {
    // Read the 500 hue from the primary color palette.
    color: mat.get-color-from-palette($primary-palette, 500);
  }
}

@mixin typography($theme) {
  // Get the typography config from the theme.
  $typography-config: mat.get-typography-config($theme);

  .my-carousel {
    font-family: mat.font-family($typography-config);
  }
}
```

### Step 3: Add a theme mixin

### 第 3 步：添加主题 mixin

For convenience, we can add a `theme` mixin that includes both color and typography.
This theme mixin should only emit the styles for each color and typography, respectively, if they
have a config specified.

为方便起见，我们可以添加一个包含颜色和排版的 `theme` mixin。如果指定了配置，则此主题 mixin 应仅生成每种颜色和排版的样式。

```scss
// _carousel-theme.scss

@use 'sass:map';
@use '@angular/material' as mat;

@mixin color($theme) {
  // Get the color config from the theme.
  $color-config: mat.get-color-config($theme);

  // Get the primary color palette from the color-config.
  $primary-palette: map.get($color-config, 'primary');

  .my-carousel-button {
    // Read the 500 hue from the primary color palette.
    color: mat.get-color-from-palette($primary-palette, 500);
  }
}

@mixin typography($theme) {
  // Get the typography config from the theme.
  $typography-config: mat.get-typography-config($theme);

  .my-carousel {
    font-family: mat.font-family($typography-config);
  }
}

@mixin theme($theme) {
  $color-config: mat.get-color-config($theme);
  @if $color-config != null {
    @include color($theme);
  }

  $typography-config: mat.get-typography-config($theme);
  @if $typography-config != null {
    @include typography($theme);
  }
}
```

### Step 4: Include the theme mixin in your application

### 第 4 步：在你的应用程序中包含主题 mixin

Now that you've defined the carousel component's theme mixin, you can include this mixin along with
the other theme mixins in your application.

现在你已经定义了轮播组件的主题 mixin，可以将此 mixin 与其他主题 mixin 一起包含在你的应用程序中。

```scss
@use '@angular/material' as mat;
@use './path/to/carousel-theme' as carousel;

@include mat.core();

$my-primary: mat.define-palette(mat.$indigo-palette, 500);
$my-accent: mat.define-palette(mat.$pink-palette, A200, A100, A400);

$my-theme: mat.define-light-theme((
 color: (
   primary: $my-primary,
   accent: $my-accent,
 ),
 typography: mat.define-typography-config(
    $font-family: serif,
  );
));

@include mat.all-component-themes($my-theme);
@include carousel.theme($my-theme);
```
