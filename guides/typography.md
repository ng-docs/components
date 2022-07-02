# Customizing Typography

# 自定义排版

## What is typography?

## 什么是排版？

Typography is a way of arranging type to make text legible, readable, and appealing when displayed.
Angular Material's [theming system][theming-system] supports customizing the typography settings
for the library's components. Additionally, Angular Material provides APIs for applying typography
styles to elements in your own application.

排版是一种排列字体的方式，使文本在显示时清晰易读且吸引人。Angular Material 的[主题体系][theming-system]支持自定义库组件的排版设置。此外，Angular Material 提供了用于将排版样式应用于你的应用程序中元素的 API。

Angular Material's theming APIs are built with [Sass](https://sass-lang.com). This document assumes
familiary with CSS and Sass basics, including variables, functions, and mixins.

Angular Material 的主题 API 是用 [Sass](https://sass-lang.com) 构建的。本文档假设你熟悉 CSS 和 Sass 基础知识，包括变量、函数和 mixin。

[theming-system]: https://material.angular.io/guide/theming

## Including font assets

## 包含字体资产

Angular Material's typography APIs lets you specify any font-face. The default font-face value is
configured to [Google's Roboto font][roboto] with the 300, 400, and 500 font-weight styles. To use
Roboto, your application must load the font, which is not included with Angular Material. The
easiest way to load Roboto, or any other custom font, is by using Google Fonts. The following
snippet can be placed in your application's `<head>` to load Roboto from Google Fonts.

Angular Material 的排版 API 允许你指定任何字体。默认 font-face 值配置为具有 300、400 和 500 三种字体粗细风格的 [Google Roboto 字体][roboto]。要使用 Roboto，你的应用程序必须加载字体，该字体不包含在 Angular Material 中。加载 Roboto 或任何其他自定义字体的最简单方法是使用 Google 字体。以下代码段可以放置在你的应用程序的 `<head>` 中，以从 Google Fonts 中加载 Roboto。

```html
<link rel="preconnect" href="https://fonts.gstatic.com">
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&display=swap" rel="stylesheet">
```

See [Getting Started with the Google Fonts API][fonts-api] for more about using Google Fonts. Also
note that, by default, [the Angular CLI inlines assets from Google Fonts to reduce render-blocking
requests][font-inlining].

有关使用 Google Fonts 的更多信息，请参阅 [Google Fonts API 入门][fonts-api]。另请注意，默认情况下， [Angular CLI 会内联来自 Google Fonts 的资产以减少会阻塞渲染的请求][font-inlining]。

[roboto]: https://fonts.google.com/share?selection.family=Roboto:wght@300;400;500

[fonts-api]: https://developers.google.com/fonts/docs/getting_started

[font-inlining]: https://angular.io/guide/workspace-config#fonts-optimization-options

## Typography levels

## 排版级别

A **typography level** is a collection of typographic styles that corresponds to a specific
part of an application's structure, such as a header. Each level includes styles for font family,
font weight, font size, and letter spacing. Angular Material uses the [typography levels
from the 2014 version of the Material Design specification][2014-typography], outlined in the
table below.

**排版级别**是与应用程序结构的特定部分（例如标题）相对应的排版样式的集合。每个级别包括字体系列、字体粗细、字体大小和字母间距的样式。 Angular Material 使用 [2014 版 Material Design 规范中的排版级别][2014-typography]，如下表所示。

| Name | Description |
| ---- | ----------- |
| 名称 | 说明 |
| `display-4` | 112px, one-off header, usually at the top of the page (e.g. a hero header). |
| `display-4` | 112px，一次性标题，通常在页面顶部（例如英雄的标题）。 |
| `display-3` | 56px, one-off header, usually at the top of the page (e.g. a hero header). |
| `display-3` | 56px，一次性标题，通常在页面顶部（例如英雄的标题）。 |
| `display-2` | 45px, one-off header, usually at the top of the page (e.g. a hero header). |
| `display-2` | 45px，一次性标题，通常在页面顶部（例如英雄的标题）。 |
| `display-1` | 34px, one-off header, usually at the top of the page (e.g. a hero header). |
| `display-1` | 34px，一次性标题，通常在页面顶部（例如英雄的标题）。 |
| `headline` | Section heading corresponding to the `<h1>` tag. |
| `headline` | 对应于 `<h1>` 标签的部分标题。 |
| `title` | Section heading corresponding to the `<h2>` tag. |
| `title` | 对应于 `<h2>` 标签的部分标题。 |
| `subheading-2` | Section heading corresponding to the `<h3>` tag. |
| `subheading-2` | 对应于 `<h3>` 标签的部分标题。 |
| `subheading-1` | Section heading corresponding to the `<h4>` tag. |
| `subheading-1` | 对应于 `<h4>` 标签的部分标题。 |
| `body-1` | Base body text. |
| `body-1` | 基本正文。 |
| `body-2` | Bolder body text. |
| `body-2` | 更粗的正文。 |
| `caption` | Smaller body and hint text. |
| `caption` | 较小的正文和提示文本。 |
| `button` | Buttons and anchors. |
| `button` | 按钮和锚点。 |
| `input` | Form input fields. |
| `input` | 表单输入字段。 |

[2014-typography]: https://material.io/archive/guidelines/style/typography.html#typography-styles

### Define a level

### 定义一个级别

You can define a typography level with the `define-typography-level` Sass function. This function
accepts, in order, CSS values for `font-size`, `line-height`, `font-weight`, `font-family`, and
`letter-spacing`. You can also specify the parameters by name, as demonstrated in the example below.

你可以使用 Sass 函数 `define-typography-level` 来定义排版级别。此函数依次接受 `font-size` 、 `line-height` 、 `font-weight` 、 `font-family` 和 `letter-spacing` 这些 CSS 值。你还可以按名称指定参数，如下例所示。

```scss
@use '@angular/material' as mat;

$my-custom-level: mat.define-typography-level(
  $font-family: Roboto,
  $font-weight: 400,
  $font-size: 1rem,
  $line-height: 1,
  $letter-spacing: normal,
);
```

## Typography config

## 排版配置

A **typography config** is a collection of all typography levels. Angular Material represents this
config as a Sass map. This map contains the styles for each level, keyed by name. You can create
a typography config with the `define-typography-config` Sass function. Every parameter for
`define-typography-config` is optional; the styles for a level will default to Material Design's
baseline if unspecified.

**排版配置**是所有排版级别的集合。 Angular Material 将此配置表示为 Sass 映射表。此主题体系的映射表包含每个级别的样式，按名称键入。你可以使用 Sass 函数 `define-typography-config` 创建一个排版配置。 `define-typography-config` 的每个参数都是可选的；如果未指定，级别的样式将默认为 Material Design 的基线级别。

```scss
@use '@angular/material' as mat;

$my-custom-typography-config: mat.define-typography-config(
  $display-4: mat.define-typography-level(112px, 112px, 300, $letter-spacing: -0.05em),
  $display-3: mat.define-typography-level(56px, 56px, 400, $letter-spacing: -0.02em),
  $display-2: mat.define-typography-level(45px, 48px, 400, $letter-spacing: -0.005em),
  $display-1: mat.define-typography-level(34px, 40px, 400),
  $headline:  mat.define-typography-level(24px, 32px, 400),
  // ...
);
```

To customize component typography for your entire application, you can pass your custom typography
config to the `core` mixin described in the [theming guide][theming-system].

要为整个应用程序的组件排版进行自定义，你可以将自定义排版配置传给[主题指南][theming-system]中描述的 `core` mixin。

```scss
@use '@angular/material' as mat;

$my-custom-typography: mat.define-typography-config(
  $headline:  mat.define-typography-level(3rem, 1, 700),
);

@include mat.core($my-custom-typography);
```

Passing your typography config to `core` mixin will apply your specified values to all Angular
Material components. If a config is not specified, `core` will emit the default Material Design
typography styles.

将你的排版配置传递给 `core` mixin 会将你指定的值应用于所有 Angular Material 组件。如果未指定配置， `core` 将生成默认的 Material Design 排版样式。

### Typography configs and theming

### 排版配置和主题

In addition to the `core` mixin, you can specify your typography config when including any `theme`
mixin, as described in the [theming guide][theming-system]. Because the `core` mixin always emits
typography styles, specifying a typography config to a theme mixin results in duplicate typography
CSS. You should only provide a typography config when applying your theme if you need to specify
multiple typography styles that are conditionally applied based on your application's behavior.

除了 `core` mixin 之外，你还可以在包含任何 `theme` mixin 时指定排版配置，如[主题指南][theming-system]中所述。因为 `core` mixin 总是生成排版样式，为主题 mixin 指定排版配置会导致重复的排版 CSS。如果你需要指定根据应用程序的行为有条件地应用的多种排版样式，则在应用主题时，你应该只提供排版配置。

The following example shows a typical theme definition and a "kids theme" that only applies when
the `".kids-theme"` CSS class is present. You can [see the theming guide for more guidance on
defining multiple themes](https://material.angular.io/guide/theming#defining-multiple-themes).

下面的示例显示了一个典型的主题定义和一个“kids 主题”，它仅在 `".kids-theme"` CSS 类存在时才适用。你可以[查看主题指南以获取有关定义多个主题的更多指导](https://material.angular.io/guide/theming#defining-multiple-themes)。

```scss
@use '@angular/material' as mat;

@include mat.core();

$my-primary: mat.define-palette(mat.$indigo-palette, 500);
$my-accent: mat.define-palette(mat.$pink-palette, A200, A100, A400);

$my-theme: mat.define-light-theme((
 color: (
   primary: $my-primary,
   accent: $my-accent,
 )
));

@include mat.all-component-themes($my-theme);

.kids-theme {
  $kids-primary: mat.define-palette(mat.$cyan-palette);
  $kids-accent: mat.define-palette(mat.$yellow-palette);
  $kids-typography: mat.define-typography-config(
    // Specify "Comic Sans" as the default font family for all levels.
    $font-family: 'Comic Sans',
  );

  $kids-theme: mat.define-light-theme((
   color: (
     primary: $my-primary,
     accent: $my-accent,
   ),
   typography: $kids-typography,
  ));

  @include mat.all-component-themes($kids-theme);
}
```

Each component also has a `typography` mixin that emits only the typography styles for that
component, based on a provided typography config. The following example demonstrates applying
typography styles only for the button component.

每个组件还有一个 `typography` mixin，它根据提供的排版配置生成该组件的排版样式。以下示例演示了如何仅为按钮组件应用排版样式。

```scss
@use '@angular/material' as mat;

$kids-typography: mat.define-typography-config(
  // Specify "Comic Sans" as the default font family for all levels.
  $font-family: 'Comic Sans',
);

// Now we have sweet buttons with Comic Sans.
@include mat.button-typography($kids-typography);
```

## Using typography styles in your application

## 在应用程序中使用排版样式

In addition to styles shared between components, the `core` mixin includes CSS classes for styling
your application. These CSS classes correspond to the typography levels in your typography config.
This mixin also emits styles for native header elements scoped within the `.mat-typography` CSS
class. The table below lists the CSS classes emitted and the native elements styled.

除了组件之间共享的样式之外， `core` mixin 还包括用于设置应用程序样式的 CSS 类。这些 CSS 类对应于你的排版配置中的排版级别。此 mixin 还为 `.mat-typography` CSS 类范围内的原生 header 元素生成样式。下表列出了生成的 CSS 类和样式化的原生元素。

| CSS class | Level name | Native elements |
| --------- | ---------- | --------------- |
| CSS 类 | 级别名称 | 原生元素 |
| `.mat-display-4` | `display-4` | None |
| `.mat-display-4` | `display-4` | 无 |
| `.mat-display-3` | `display-3` | None |
| `.mat-display-3` | `display-3` | 无 |
| `.mat-display-2` | `display-2` | None |
| `.mat-display-2` | `display-2` | 无 |
| `.mat-display-1` | `display-1` | None |
| `.mat-display-1` | `display-1` | 无 |
| `.mat-h1` or `.mat-headline` | `headline` | `<h1>` |
| `.mat-h1` 或 `.mat-headline` | `headline` | `<h1>` |
| `.mat-h2` or `.mat-title` | `title` | `<h2>` |
| `.mat-h2` 或 `.mat-title` | `title` | `<h2>` |
| `.mat-h3` or `.mat-subheading-2` | `subheading-2` | `<h3>` |
| `.mat-h3` 或 `.mat-subheading-2` | `subheading-2` | `<h3>` |
| `.mat-h4` or `.mat-subheading-1` | `subheading-1` | `<h4>` |
| `.mat-h4` 或 `.mat-subheading-1` | `subheading-1` | `<h4>` |
| `.mat-h5` | None | `<h5>` |
| `.mat-h5` | 无 | `<h5>` |
| `.mat-h6` | None | `<h6>` |
| `.mat-h6` | 无 | `<h6>` |
| `.mat-body` or `.mat-body-1` | `body-1` | Body text |
| `.mat-body` 或 `.mat-body-1` | `body-1` | 文章主体 |
| `.mat-body-strong` or `.mat-body-2` | `body-2` | None |
| `.mat-body-strong` 或 `.mat-body-2` | `body-2` | 无 |
| `.mat-small` or `.mat-caption` | `caption` | None |
| `.mat-small` 或 `.mat-caption` | `caption` | 无 |

In addition to the typographic styles, these style rules also include a `margin-bottom` for
headers and paragraphs. For `body-1` styles, text is styled within the provided CSS selector.

除了排版样式，这些样式规则还包括 header 和 p 的 `margin-bottom` 。对于 `body-1` 样式，文本在所提供的 CSS 选择器中设置样式。

The `.mat-h5` and `.mat-h6` styles don't directly correspond to a specific Material Design
typography level. The `.mat-h5` style uses the `body-1` level with the font-size scaled down by
`0.83`. The `.mat-h6` style uses the `body-1` level with the font-size scaled down by `0.67`.

`.mat-h5` 和 `.mat-h6` 样式不直接对应于特定的 Material Design 排版级别。 `.mat-h5` 样式使用 `body-1` 级别，字体大小按比例缩小至 `0.83` 倍。 `.mat-h6` 样式使用 `body-1` 级别，字体大小按比例缩小至 `0.67` 倍。

The `button` and `input` typography levels do not map to CSS classes.

`button` 和 `input` 的排版级别没有映射到 CSS 类。

You can also manually emit the CSS rules for these CSS classes and native elements by calling the `typography-hierarchy`
mixin. This mixin accepts a typography config and a CSS selector under which the styles are scopes (defaulting to
`.mat-typography`).

你还可以通过调用 `typography-hierarchy` mixin 手动为这些 CSS 类和原生元素生成 CSS 规则。这个 mixin 接受一个排版配置和一个 CSS 选择器，此选择器下的样式是范围化的（默认为 `.mat-typography` ）。

The following example demonstrates usage of the typography styles emitted by the `core` mixin.

以下示例演示了 `core` mixin 生成的排版样式的用法。

```html
<body>
  <!-- This header will *not* be styled because it is outside `.mat-typography` -->
  <h1>Top header</h1>

  <!-- This paragraph will be styled as `body-1` via the `.mat-body` CSS class applied -->
  <p class="mat-body">Introductory text</p>

  <div class="mat-typography">
    <!-- This header will be styled as `title` because it is inside `.mat-typography` -->
    <h2>Inner header</h2>

    <!-- This paragraph will be styled as `body-1` because it is inside `.mat-typography` -->
    <p>Some inner text</p>
  </div>
</body>
```

### Reading typography values from a config

### 从配置中读取排版值

You can read typography style values from a typography config via the following Sass functions. Each
accepts a typography config and a level.

你可以通过以下 Sass 函数从排版配置中读取排版样式值。它们都接受一个排版配置和一个级别参数。

| Function | Example usage |
| -------- | ------------- |
| 功能 | 示例用法 |
| `font-size` | `mat.font-size($config, 'body-1');` |
| `font-family` | `mat.font-family($config, 'body-1');` |
| `font-weight` | `mat.font-weight($config, 'body-1');` |
| `line-height` | `mat.line-height($config, 'body-1');` |
| `letter-spacing` | `mat.letter-spacing($config, 'body-1');` |

Additionally, you can use the `typography-level` Sass mixin to directly emit the CSS styles for a
given typography level.

此外，你可以使用 Sass mixin `typography-level` 直接生成给定排版级别的 CSS 样式。

```scss
@use '@angular/material' as mat;

// Use the default configuration.
$my-typography: mat.define-typography-config();

.some-class-name {
  @include mat.typography-level($my-typography, 'body-1');
}
```
