# Theming Angular Material

# Angular Material 主题

## What is theming?

## 什么是主题？

Angular Material's theming system lets you customize color, typography, and density styles for components
in your application. The theming system is based on Google's
[Material Design][material-design-theming] specification.

Angular Material 的主题体系允许你为应用程序中的组件自定义颜色、排版和密集度样式。此主题体系基于 Google 的 [Material Design][material-design-theming] 规范。

This document describes the concepts and APIs for customizing colors. For typography customization,
see [Angular Material Typography][mat-typography]. For guidance on building components to be
customizable with this system, see [Theming your own components][theme-your-own].

本文档介绍了自定义颜色的概念和 API。关于排版的定制指南参见 [Angular Material 排版][mat-typography]。关于如何使用此系统来构建自定义组件的指南，请参阅 [主题化你自己的组件][theme-your-own]。

[material-design-theming]: https://material.io/design/material-theming/overview.html

[mat-typography]: https://material.angular.io/guide/typography

[theme-your-own]: https://material.angular.io/guide/theming-your-components

### Sass

Angular Material's theming APIs are built with [Sass](https://sass-lang.com). This document assumes
familiarity with CSS and Sass basics, including variables, functions, and mixins.

Angular Material 的主题 API 是用 [Sass](https://sass-lang.com) 构建的。本文档假设你熟悉 CSS 和 Sass 的基础知识，包括变量、函数和 mixin。

You can use Angular Material without Sass by using a pre-built theme, described in
[Using a pre-built theme](#using-a-pre-built-theme) below. However, using the library's Sass API
directly gives you the most control over the styles in your application.

你可以通过使用预构建的主题在没有 Sass 的情况下使用 Angular Material，如下面的[使用预构建的主题](#using-a-pre-built-theme)所述。但是，直接使用库的 Sass API 能让你最大程度地控制应用程序中的样式。

## Palettes

## 调色板

A **palette** is a collection of colors representing a portion of color space. Each value in this
collection is called a **hue**. In Material Design, each hues in a palette has an identifier number.
These identifier numbers include 50, and then each 100 value between 100 and 900. The numbers order
hues within a palette from lightest to darkest.

**调色板**是代表颜色空间一部分的颜色集合。此集合中的每个值都称为**色调**。在 Material Design 中，调色板中的每个色调都有一个标识符数字。这些数字包括 50，以及 100 到 900 之间间隔 100 的所有值。这些编号会将调色板中的色调从最亮到最暗进行排序。

Angular Material represents a palette as a [Sass map][sass-maps]. This map contains the
palette's hues and another nested map of contrast colors for each of the hues. The contrast colors
serve as text color when using a hue as a background color. The example below demonstrates the
structure of a palette. [See the Material Design color system for more background.][spec-colors]

Angular Material 将调色板表示为 [Sass 映射表][sass-maps]。此映射表包含调色板的色调和每个色调的各个对比色的嵌套映射表。当使用某个色调作为背景色时，就会把其对比色用作文本颜色。下面的示例演示了调色板的结构。 [更多背景信息，请参见 Material Design 的色彩体系][spec-colors]。

```scss
$indigo-palette: (
 50: #e8eaf6,
 100: #c5cae9,
 200: #9fa8da,
 300: #7986cb,
 // ... continues to 900
 contrast: (
   50: rgba(black, 0.87),
   100: rgba(black, 0.87),
   200: rgba(black, 0.87),
   300: white,
   // ... continues to 900
 )
);
```

[sass-maps]: https://sass-lang.com/documentation/values/maps

[spec-colors]: https://material.io/design/color/the-color-system.html

### Create your own palette

### 创建你自己的调色板

You can create your own palette by defining a Sass map that matches the structure described in the
[Palettes](#palettes) section above. The map must define hues for 50 and each hundred between 100
and 900. The map must also define a `contrast` map with contrast colors for each hue.

你可以通过定义与上面[调色板](#palettes)部分中描述的结构相一致的 Sass 映射表来创建自己的调色板。映射表必须定义 50 的色调，以及 100 和 900 之间间隔 100 的每个色调。映射表还必须为每个色调定义具有对比色的 `contrast` 映射表。

You can use [the Material Design palette tool][palette-tool] to help choose the hues in your
palette.

你可以使用 [Material Design 调色板工具][palette-tool]来帮你选择调色板中的色调。

[palette-tool]: https://material.io/design/color/the-color-system.html#tools-for-picking-colors

### Predefined palettes

### 预定义的调色板

Angular Material offers predefined palettes based on the 2014 version of the Material Design
spec. See the [Material Design 2014 color palettes][2014-palettes] for a full list.

Angular Material 提供了基于 2014 版 Material Design 规范的预定义调色板。有关完整列表，请参阅 [Material Design 2014 调色板][2014-palettes]。

In addition to hues numbered from zero to 900, the 2014 Material Design palettes each include
distinct _accent_ hues numbered as `A100`, `A200`, `A400`, and `A700`. Angular Material does not
require these hues, but you can use these hues when defining a theme as described in
[Defining a theme](#defining-a-theme) below.

除了编号从 0 到 900 的色调外，2014 年 Material Design 调色板还包括编号为 `A100`、 `A200`、 `A400` 和 `A700` 的显著*强调*色调。Angular Material 不需要这些色调，但你可以在定义主题时使用这些色调，如下面的[定义主题](#defining-a-theme)中所述。

```scss
@use '@angular/material' as mat;

$my-palette: mat.$indigo-palette;
```

[2014-palettes]: https://material.io/archive/guidelines/style/color.html#color-color-palette

## Themes

## 主题

A **theme** is a collection of color, typography, and density options. Each theme includes three palettes that
determine component colors:

**主题**是颜色、排版和密集度选项的集合。每个主题包括三个确定组件颜色的调色板：

* A **primary** palette for the color that appears most frequently throughout your application

  在整个应用程序中最常出现的颜色的 **primary(主要)** 调色板

* An **accent**, or _secondary_, palette used to selectively highlight key parts of your UI

  用于有选择地突出显示 UI 中某些关键部位的 **accent(强调)** 或 *secondary(辅助)* 调色板

* A **warn**, or _error_, palette used for warnings and error states

  用于警告和错误状态的 **warn(警告)** 或 *error(错误)* 调色板

You can include the CSS styles for a theme in your application in one of two ways: by defining a
custom theme with Sass, or by importing a pre-built theme CSS file.

你可以通过两种方式在应用程序中包含主题的 CSS 样式：使用 Sass 自定义主题，或导入预构建的主题 CSS 文件。

### Custom themes with Sass

### 使用 Sass 自定义主题

A **theme file** is a Sass file that calls Angular Material Sass mixins to output color,
typography, and density CSS styles.

**主题文件**是一个 Sass 文件，它会调用一些 Angular Material 的 Sass mixins 来输出颜色、排版和密集度这些 CSS 样式。

#### The `core` mixin

#### `core` mixin（混入函数）

Angular Material defines a mixin named `core` that includes prerequisite styles for common
features used by multiple components, such as ripples. The `core` mixin must be included exactly
once for your application, even if you define multiple themes. Including the `core` mixin multiple
times will result in duplicate CSS in your application.

Angular Material 定义了一个名为 `core` 的 mixin，其中包含供多个组件使用的通用功能的先决样式，例如涟漪。即使你定义了多个主题，`core` mixin 也只能在应用程序中包含一次。如果多次包含 `core` mixin，将导致应用程序中出现重复的 CSS。

```scss
@use '@angular/material' as mat;

@include mat.core();
```

#### Defining a theme

#### 定义主题

Angular Material represents a theme as a Sass map that contains your color, typography, and density
choices. See [Angular Material Typography][mat-typography] for an in-depth guide to customizing typography. See
[Customizing density](#customizing-density) below for details on adjusting component density.

Angular Material 用 Sass 映射表来表达主题，其中包含你的颜色、排版和密集度选择。有关自定义排版的更多信息，请参阅 [Angular Material 排版][mat-typography]。


Constructing the theme first requires defining your primary and accent palettes, with an optional
warn palette. The `define-palette` Sass function accepts a color palette, described in the
[Palettes](#palettes) section above, as well as four optional hue numbers. These four hues
represent, in order: the "default" hue, a "lighter" hue, a "darker" hue, and a "text" hue.
Components use these hues to choose the most appropriate color for different parts of
themselves.

构建主题首先需要定义你的 `primary`(主要)和 `accent`(重音)调色板，以及可选的 `warn`(警告)调色板。Sass 函数 `define-palette` 接受一个调色板（这在上面的[调色板](#palettes)部分中讲过）以及四个可选的色调数值。这四种色调依次表示：“default(默认)”色调、“lighter(较浅)”色调、“darker(较暗)”色调和“text(文本)”色调。各个组件会使用这些色调为自身的不同部位选择最合适的颜色。

```scss
@use '@angular/material' as mat;

$my-primary: mat.define-palette(mat.$indigo-palette, 500);
$my-accent: mat.define-palette(mat.$pink-palette, A200, A100, A400);

// The "warn" palette is optional and defaults to red if not specified.
$my-warn: mat.define-palette(mat.$red-palette);
```

You can construct a theme by calling either `define-light-theme` or `define-dark-theme` with
the result from `define-palette`. The choice of a light versus a dark theme determines the
background and foreground colors used throughout the components.

你可以通过调用 `define-light-theme` 或 `define-dark-theme` 并以 `define-palette` 的结果为参数，来构建主题。选择使用浅色或深色主题，决定了整个组件使用的背景色和前景色。

```scss
@use '@angular/material' as mat;

$my-primary: mat.define-palette(mat.$indigo-palette, 500);
$my-accent: mat.define-palette(mat.$pink-palette, A200, A100, A400);

// The "warn" palette is optional and defaults to red if not specified.
$my-warn: mat.define-palette(mat.$red-palette);

$my-theme: mat.define-light-theme((
 color: (
   primary: $my-primary,
   accent: $my-accent,
   warn: $my-warn,
 ),
 typography: mat.define-typography-config(),
 density: 0,
));
```

#### Applying a theme to components

#### 将主题应用于组件

The `core-theme` Sass mixin emits prerequisite styles for common features used by multiple
components, such as ripples. This mixin must be included once per theme.

Sass mixin `core-theme` 会为多个组件使用的通用功能（例如涟漪）生成先决样式。每个主题必须包含一次这个 mixin。

Each Angular Material component has a mixin for each color , typography, and density. For example, `MatButton` declares
`button-color`, `button-typography`, and `button-density`. Each mixin emits only the styles corresponding to that
area of customization.

每个 Angular Material 组件都有一个生成颜色、排版和密集度样式的 mixin。比如，`MatButton` 就声明了 `button-color`、`button-typography` 和 `button-density`。每个 mixin 都只会生成与其负责定制化的区域相对应的样式。

Additionally, each component has a "theme" mixin that emits all styles that depend on the theme config.
This theme mixin only emits color, typography, or density styles if you provided a corresponding
configuration to `define-light-theme` or `define-dark-theme`.

此外，每个组件都有一个 `theme` mixin，它会根据主题配置生成所有样式。如果你为 `define-light-theme` 或 `define-dark-theme` 提供了相应的配置，则这个 `theme` mixin 只会生成颜色、排版或密集度样式。

Apply the styles for each of the components used in your application by including each of their
theme Sass mixins.

通过包含 (`include`) 每个主题 Sass mixins，可以为应用程序中使用的每个组件应用样式。

```scss
@use '@angular/material' as mat;

@include mat.core();

$my-primary: mat.define-palette(mat.$indigo-palette, 500);
$my-accent: mat.define-palette(mat.$pink-palette, A200, A100, A400);

$my-theme: mat.define-light-theme((
 color: (
   primary: $my-primary,
   accent: $my-accent,
 ),
 density: 0,
));

// Emit theme-dependent styles for common features used across multiple components.
@include mat.core-theme($my-theme);

// Emit styles for MatButton based on `$my-theme`. Because the configuration
// passed to `define-light-theme` omits typography, `button-theme` will not
// emit any typography styles.
@include mat.button-theme($my-theme);

// Include the theme mixins for other components you use here.
```

As an alternative to listing every component that your application uses, Angular Material offers
Sass mixins that includes styles for all components in the library: `all-component-colors`,
`all-component-typographies`, `all-component-densitites`, and `all-component-themes`. These mixins behave the same as
individual component mixins, except they emit styles for `core-theme` and _all_ 35+ components in Angular
Material. Unless your application uses every single component, this will produce unnecessary CSS.

除了列出应用程序使用的每个组件之外，Angular Material 还提供了一些 Sass mixins，来为本库中的所有组件包含（`include`）样式： `all-component-colors` 、`all-component-typographies`、`all-component-densitites` 和 `all-component-themes` 。这些 mixin 的行为与供单个组件使用的 mixin 是一样的，除了一点：它们会为 `core-theme` 和 Angular Material 中的*所有* 35+ 个组件生成样式。除非你的应用程序要用到每个组件，否则这将生成一些不必要的 CSS。

```scss
@use '@angular/material' as mat;

@include mat.core();

$my-primary: mat.define-palette(mat.$indigo-palette, 500);
$my-accent: mat.define-palette(mat.$pink-palette, A200, A100, A400);

$my-theme: mat.define-light-theme((
 color: (
   primary: $my-primary,
   accent: $my-accent,
 ),
 typography: mat.define-typography-config(),
 density: 0,
));

@include mat.all-component-themes($my-theme);
```

To include the emitted styles in your application, [add your theme file to the `styles` array of
your project's `angular.json` file][adding-styles].

要在你的应用程序中包含所生成的样式，[请将你的主题文件添加到你项目的 `angular.json` 文件的 `styles` 数组中][adding-styles]。

[adding-styles]: https://angular.io/guide/workspace-config#styles-and-scripts-configuration

### Using a pre-built theme

### 使用预构建主题

Angular Material includes four pre-built theme CSS files, each with different palettes selected.
You can use one of these pre-built themes if you don't want to define a custom theme with Sass.

Angular Material 包括四个预构建的主题 CSS 文件，每个文件都选择了不同的调色板。如果你不想使用 Sass 来自定义主题，则可以使用这些预构建的主题之一。

| Theme | Light or dark? | Palettes (primary, accent, warn) |
| ----- | -------------- | -------------------------------- |
| 主题 | 亮还是暗？ | 调色板（primary, accent, warn） |
| `deeppurple-amber.css` | Light | deep-purple, amber, red |
| `deeppurple-amber.css` | 亮 | deep-purple, amber, red |
| `indigo-pink.css` | Light | indigo, pink, red |
| `indigo-pink.css` | 亮 | indigo, pink, red |
| `pink-bluegrey.css` | Dark | pink, bluegrey, red |
| `pink-bluegrey.css` | 暗 | pink, bluegrey, red |
| `purple-green.css` | Dark | purple, green, red |
| `purple-green.css` | 暗 | purple, green, red |

These files include the CSS for every component in the library. To include only the CSS for a subset
of components, you must use the Sass API detailed in [Defining a theme](#defining-a-theme) above.
You can [reference the source code for these pre-built themes][prebuilt] to see examples of complete
theme definitions.

这些文件包括库中每个组件的 CSS。如果要单独包含这些组件的某个子集的 CSS，你必须使用上面[定义主题](#defining-a-theme)中详述的 Sass API。你可以[参考这些预建主题的源代码][prebuilt]查看完整主题定义的示例。

You can find the pre-built theme files in the "prebuilt-themes" directory of Angular Material's
npm package (`@angular/material/prebuilt-themes`). To include the pre-built theme in your
application, [add your chosen CSS file to the `styles` array of your project's `angular.json`
file][adding-styles].

你可以在 Angular Material 的 npm 包 ( `@angular/material/prebuilt-themes` ) 的 `prebuilt-themes` 目录中找到预构建的主题文件。要在你的应用程序中包含预先构建的主题，[请将你选择的 CSS 文件添加到你项目的 `angular.json` 文件的 `styles` 数组中][adding-styles]。

[prebuilt]: https://github.com/angular/components/blob/main/src/material/core/theming/prebuilt

### Defining multiple themes

### 定义多重主题

Using the Sass API described in [Defining a theme](#defining-a-theme), you can also define
_multiple_ themes by repeating the API calls multiple times. You can do this either in the same
theme file or in separate theme files.

使用[定义主题](#defining-a-theme)中描述的 Sass API，你还可以通过多次重复 API 调用来定义*多重*主题。你可以在同一个主题文件或几个单独的主题文件中执行此操作。

#### Multiple themes in one file

#### 一个文件中的多重主题

Defining multiple themes in a single file allows you to support multiple themes without having to
manage loading of multiple CSS assets. The downside, however, is that your CSS will include more
styles than necessary.

在单个文件中定义多重主题，能让你支持多重主题而无需管理多个 CSS 资产文件的加载。然而，代价是你的 CSS 将包含不必要的样式。

To control which theme applies when, `@include` the mixins only within a context specified via
CSS rule declaration. See the [documentation for Sass mixins][sass-mixins] for further background.

要控制何时应用哪个主题， 请在通过 CSS 规则声明指定的上下文中 `@include` 这些 mixin。有关更多背景信息，请参阅 [Sass mixins 文档][sass-mixins]。

[sass-mixins]: https://sass-lang.com/documentation/at-rules/mixin

```scss
@use '@angular/material' as mat;

@include mat.core();

// Define a dark theme
$dark-theme: mat.define-dark-theme((
 color: (
   primary: mat.define-palette(mat.$pink-palette),
   accent: mat.define-palette(mat.$blue-grey-palette),
 ),
  // Only include `typography` and `density` in the default dark theme.
  typography: mat.define-typography-config(),
  density: 0,
));

// Define a light theme
$light-theme: mat.define-light-theme((
 color: (
   primary: mat.define-palette(mat.$indigo-palette),
   accent: mat.define-palette(mat.$pink-palette),
 ),
));

// Apply the dark theme by default
@include mat.core-theme($dark-theme);
@include mat.button-theme($dark-theme);

// Apply the light theme only when the user prefers light themes.
@media (prefers-color-scheme: light) {
 // Use the `-color` mixins to only apply color styles without reapplying the same
 // typography and density styles.
 @include mat.core-color($light-theme);
 @include mat.button-color($light-theme);
}
```

#### Multiple themes across separate files

#### 跨文件的多重主题

You can define multiple themes in separate files by creating multiple theme files per
[Defining a theme](#defining-a-theme), adding each of the files to the `styles` of your
`angular.json`. However, you must additionally set the `inject` option for each of these files to
`false` in order to prevent all the theme files from being loaded at the same time. When setting
this property to `false`, your application becomes responsible for manually loading the desired
file. The approach for this loading depends on your application.

你可以创建多个主题文件，每个文件[定义一个主题](#defining-a-theme)，然后将这些文件添加到 `angular.json` 的 `styles` 中，就可以在几个单独的文件中定义多重主题了。但是，你还必须将每个文件的 `inject` 选项设置为 `false`，以防止同时加载所有主题文件。当此属性为 `false` 时，你的应用程序要负责手动加载所需的文件。加载的方式则取决于你的应用程序。

### Application background color

### 应用背景颜色

By default, Angular Material does not apply any styles to your DOM outside
its own components. If you want to set your application's background color
to match the components' theme, you can either:

默认情况下，Angular Material 不会将任何样式应用到你的 DOM 组件外部。如果想设置应用程序的背景颜色以匹配组件的主题，你可以：

1. Put your application's main content inside `mat-sidenav-container`, assuming you're using `MatSidenav`, or

   假设你正在使用 `MatSidenav` ，请将应用程序的主要内容放入 `mat-sidenav-container` ，或者

2. Apply the `mat-app-background` CSS class to your main content root element (typically `body`).

   将 `mat-app-background` CSS 类应用到你主要内容的根元素（通常是 `body` ）。

### Scoping style customizations

### 范围化样式的自定义方式

You can use Angular Material's Sass mixins to customize component styles within a specific scope
in your application. The CSS rule declaration in which you include a Sass mixin determines its scope.
The example below shows how to customize the color of all buttons inside elements marked with the
`.my-special-section` CSS class.

你可以使用 Angular Material 的各个 Sass mixin 来自定义应用程序中特定范围内的组件样式。包含（include） Sass mixin 的 CSS 规则声明决定了它的作用域。下面的示例展示了如何自定义带有 `.my-special-section` CSS 类的元素内所有按钮的颜色。

```scss
@use '@angular/material' as mat;

.my-special-section {
 $special-primary: mat.define-palette(mat.$orange-palette);
 $special-accent: mat.define-palette(mat.$brown-palette);
 $special-theme: mat.define-dark-theme((
   color: (primary: $special-primary, accent: $special-accent),
 ));

 @include mat.button-color($special-theme);
}
```

### Reading hues from palettes

### 从调色板读取色调

You can use the `get-color-from-palette` function to get specific hues from a palette by their
number identifier. You can also access the contrast color for a particular hue by suffixing the
hue's number identifier with `-contrast`.

你可以使用 `get-color-from-palette` 函数通过数字标识符来从调色板中获取特定色调。你还可以通过在色调的数字标识符后缀 `-contrast` 来获取特定色调的对比色。

```scss
@use '@angular/material' as mat;

$my-palette: mat.define-palette(mat.$indigo-palette);

.my-custom-style {
 background: mat.get-color-from-palette($my-palette, 500);
 color: mat.get-color-from-palette($my-palette, '500-contrast');
}
```

You can also reference colors using the `"default"`, `"lighter"`, `"darker"`, and `"text"` colors
passed to `define-palette`.

你还可以通过传给 `define-palette` 的 `"default"` 、 `"lighter"` 、 `"darker"` 和 `"text"` 来引用这些颜色。

```scss
@use '@angular/material' as mat;

$my-palette: mat.define-palette(mat.$indigo-palette);

.my-custom-darker-style {
 background: mat.get-color-from-palette($my-palette, 'darker');
 color: mat.get-color-from-palette($my-palette, 'darker-contrast');
}
```

## Customizing density

## 自定义密集度

Angular Material's density customization is based on the
[Material Design density guidelines](https://m2.material.io/design/layout/applying-density.html). This system
defines a scale where zero represents the default density. You can decrement the number for _more density_ and increment
the number for _less density_.

Angular Material 的密集度定制是基于 [Material Design 密集度指南](https://m2.material.io/design/layout/applying-density.html)的。该系统定义了一个等级，其中零表示默认密集度。你可以减少该数字以*增加密集度*，增加该数字以*减少密集度*。

The density system is based on a *density scale*. The scale starts with the
default density of `0`. Each whole number step down (`-1`, `-2`, etc.) reduces
the affected sizes by `4px`, down to the minimum size necessary for a component to render coherently.

密集度系统基于某个*密集度等级*。此等级以默认密集度 `0` 开始。每个整数递减（`-1`、`-2` 等）都会将受影响的尺寸减小 `4px` ，直至组件连续渲染所需的最小尺寸。

Components that appear in task-based or pop-up contexts, such as `MatDatepicker`, don't change their size via the
density system. The [Material Design density guidance](https://m2.material.io/design/layout/applying-density.html)
explicitly discourages increasing density for such interactions because they don't compete for space in the
application's layout.

出现在基于任务的或弹出上下文中的组件，例如 `MatDatepicker`，无法通过密集度体系更改它们的大小。 [Material Design 密集度指南](https://m2.material.io/design/layout/applying-density.html)明确反对增加此类交互的密集度，因为它们不会在应用程序的布局中进行空间竞争。

You can apply custom density setting to the entire library or to individual components using their density Sass mixins.

你可以将自定义密集度设置应用于整个库，或使用它们的 density Sass mixin 将其应用于单个组件。

```scss
// You can set a density setting in your theme to apply to all components.
$dark-theme: mat.define-dark-theme((
  color: ...,
  typography: ...,
  density: -2,
));

// Or you can selectively apply the Sass mixin to affect only specific parts of your application.
.the-dense-zone {
  @include mat.button-density(-1);
}
```

## Strong focus indicators

## 强烈焦点指示器

By default, most components indicate browser focus by changing their background color as described
by the Material Design specification. This behavior, however, can fall short of accessibility
requirements, such as [WCAG][], which require a stronger indication of browser focus.

默认情况下，大多数组件通过更改 Material Design 规范中描述的背景颜色来指示浏览器焦点。但是，此行为可能无法满足无障碍性要求，例如 [WCAG][]，后者要求更强烈地指示浏览器焦点。

Angular Material supports rendering highly visible outlines on focused elements. Applications can
enable these strong focus indicators via two Sass mixins:
`strong-focus-indicators` and `strong-focus-indicators-theme`.

Angular Material 支持在有焦点的元素上渲染高度可见的轮廓。应用程序可以通过两个 Sass mixin 启用这些强烈焦点指示器： `strong-focus-indicators` 和 `strong-focus-indicators-theme` 。

The `strong-focus-indicators` mixin emits structural indicator styles for all components. This mixin
should be included exactly once in an application, similar to the `core` mixin described above.

`strong-focus-indicators` mixin 会为所有组件生成结构化指示器样式。这个 mixin 应该在应用程序中只包含一次，类似于上面描述的 `core` mixin。

The `strong-focus-indicators-theme` mixin emits only the indicator's color styles. This mixin should
be included once per theme, similar to the theme mixins described above. Additionally, you can use
this mixin to change the color of the focus indicators in situations in which the default color
would not contrast sufficiently with the background color.

`strong-focus-indicators-theme` mixin 只会生成指示器的颜色样式。这个 mixin 应该包含在每个主题中，类似于上面描述的主题 mixin。此外，在默认颜色与背景颜色对比不足的情况下，你可以使用此 mixin 来更改焦点指示器的颜色。

The following example includes strong focus indicator styles in an application alongside the rest of
the custom theme API.

以下示例在应用程序中包含强烈焦点指示器样式以及自定义主题 API 的其余部分。

```scss
@use '@angular/material' as mat;

@include mat.core();
@include mat.strong-focus-indicators();

$my-primary: mat.define-palette(mat.$indigo-palette, 500);
$my-accent: mat.define-palette(mat.$pink-palette, A200, A100, A400);

$my-theme: mat.define-light-theme((
 color: (
   primary: $my-primary,
   accent: $my-accent,
 )
));

@include mat.all-component-themes($my-theme);
@include mat.strong-focus-indicators-theme($my-theme);
```

### Customizing strong focus indicators

### 自定义强焦点指标

You can pass a configuration map to `strong-focus-indicators` to customize the appearance of the
indicators. This configuration includes `border-style`, `border-width`, and `border-radius`.

你可以将配置映射传递给 `strong-focus-indicators` 以自定义指标的外观。此配置包括 `border-style` 、 `border-width` 和 `border-radius` 。

You also can customize the color of indicators with `strong-focus-indicators-theme`. This mixin
accepts either a theme, as described earlier in this guide, or a CSS color value. When providing a
theme, the indicators will use the default hue of the primary palette.

你还可以使用 `strong-focus-indicators-theme` 自定义指标的颜色。这个 mixin 接受一个主题，如本指南前面所述，或者一个 CSS 颜色值。提供主题时，指标将使用主调色板的默认色调。

The following example includes strong focus indicator styles with custom settings alongside the rest
of the custom theme API.

以下示例包括具有自定义设置的强烈焦点指示器样式以及自定义主题 API 的其余部分。

```scss
@use '@angular/material' as mat;

@include mat.core();
@include mat.strong-focus-indicators((
  border-style: dotted,
  border-width: 4px,
  border-radius: 2px,
));

$my-primary: mat.define-palette(mat.$indigo-palette, 500);
$my-accent: mat.define-palette(mat.$pink-palette, A200, A100, A400);

$my-theme: mat.define-light-theme((
 color: (
   primary: $my-primary,
   accent: $my-accent,
 )
));

@include mat.all-component-themes($my-theme);
@include mat.strong-focus-indicators-theme(purple);
```

[WCAG]: https://www.w3.org/WAI/standards-guidelines/wcag/glance/

## Theming and style encapsulation

## 主题和样式封装

Angular Material assumes that, by default, all theme styles are loaded as global CSS. If you want
to use [Shadow DOM][shadow-dom] in your application, you must load the theme styles within each
shadow root that contains an Angular Material component. You can accomplish this by manually loading
the CSS in each shadow root, or by using [Constructable Stylesheets][constructable-css].

Angular Material 假定，默认情况下，所有主题样式都作为全局 CSS 加载。如果要在应用程序中使用 [Shadow DOM][shadow-dom]，则必须在每个包含 Angular Material 组件的 Shadow Root 中加载主题样式。你可以通过在每个 Shadow Root 中手动加载 CSS 或使用[可构造样式表][constructable-css] 来完成此操作。

[shadow-dom]: https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_shadow_DOM

[constructable-css]: https://developers.google.com/web/updates/2019/02/constructable-stylesheets

## User preference media queries

## 用户偏好媒体查询

Angular Material does not apply styles based on user preference media queries, such as `prefers-color-scheme`
or `prefers-contrast`. Instead, Angular Material's Sass mixins give you the flexibility to
apply theme styles to based on the conditions that make the most sense for your users. This may mean using media
queries directly or reading a saved user preference.

Angular Material 不会根据用户偏好媒体查询来应用样式，例如 `prefers-color-scheme` 或 `prefers-contrast` 。反之，Angular Material 提供了一些 Sass mixin，让你可以根据对用户最有意义的条件灵活地应用主题样式。比如直接使用媒体查询，或读取已保存的用户偏好。

## Style customization outside the theming system

## 主题体系之外的风格定制

Angular Material supports customizing color, typography, and density as outlined in this document. Angular
strongly discourages, and does not directly support, overriding component CSS outside the theming
APIs described above. Component DOM structure and CSS classes are considered private implementation
details that may change at any time.

Angular Material 支持自定义颜色、排版和密集度，如本文档所述。 Angular 强烈反对并且不直接支持覆盖上述主题 API 之外的组件 CSS。组件的 DOM 结构和 CSS 类被视为可能随时更改的私有实现细节。
