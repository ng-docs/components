# Theming your Angular Material app

# 设置 Angular Material 应用的主题

### What is a theme?

### 什么是主题？

Angular Material's theming system enables you to customize components to
better reflect your product's brand. A theme consists of configurations for the individual
`color` and `typography` systems in Angular Material. The library's approach to theming reflects
the guidance from the [Material Design spec][1].

Angular Material 的主题体系让你能够自定义组件，以更好地反映你产品的品牌形象。一个主题包含 Angular Material 中 `color` 和 `typography` 体系的配置。本库的主题方法遵循 [Material Design 规范][1]中给出的指导原则。

In Angular Material, you create a color configuration by composing multiple palettes. In
particular, a color configuration consists of:

在 Angular Material 中，你可以通过组合多个调色板来创建颜色配置。具体来说，颜色配置包括：

* A primary palette: colors most widely used across all screens and components.

  主调色板：那些在所有屏幕和组件中广泛使用的颜色。

* An accent palette: colors used for the floating action button and interactive elements.

  强调调色板：那些用于浮动按钮和可交互元素的颜色。

* A warn palette: colors used to convey error state.

  警告调色板：那些用于传达出错状态的颜色。

* A foreground palette: colors for text and icons.

  前景调色板：那些用于文字和图标的颜色。

* A background palette: colors used for element backgrounds.

  背景色调色板：那些用做元素背景色的颜色。

Additionally, in Angular Material, a configuration may optionally include `typography` settings. More information on how typography works can be [found in a dedicated guide][3].

另外，在 Angular Material 中，配置可以选择性地包括 `typography`（排版）设置。关于排版原理的更多信息可以在这个[专栏][3]中找到。

Angular Material theme styles are generated _statically_ at build-time so that your app doesn't have to spend cycles generating theme styles on startup.

Angular Material 的主题样式都是在构建时*静态*生成的，这样你的应用就不必在启动后再花时间去生成这些主题样式了。

[1]: https://material.io/archive/guidelines/style/color.html#color-color-palette

### Using a pre-built theme

### 使用预定义主题

Angular Material comes prepackaged with several pre-built theme css files. These theme files also include all of the styles for core (styles common to all components), so you only have to include a single css file for Angular Material in your app.

Angular Material 自带了几个预构建主题的 css 文件。这些主题文件包含了所有核心样式（所有组件中通用的），这样你的应用就只需要包含单个 css 文件了。

You can include a theme file directly into your application from
`@angular/material/prebuilt-themes`

你可以从 `@angular/material/prebuilt-themes` 直接把主题文件包含到应用中。

Available pre-built themes:

有效的预定义主题有：

* `deeppurple-amber.css`
* `indigo-pink.css`
* `pink-bluegrey.css`
* `purple-green.css`

If you're using Angular CLI, this is as simple as including one line in your `styles.css`  file:

如果你正在使用 Angular CLI，那么只要在 `styles.css` 文件中添加一行就可以了：

```css
@import '@angular/material/prebuilt-themes/deeppurple-amber.css';
```

Alternatively, you can just reference the file directly. This would look something like:

此外，你还可以直接引用这个文件。类似这样：

```html

<link href="node_modules/@angular/material/prebuilt-themes/indigo-pink.css" rel="stylesheet">
```

The actual path will depend on your server setup.

实际的路径取决于你的服务器设置。

You can also concatenate the file with the rest of your application's css.

你还可以把该文件和应用中的其它 css 拼接起来。

Finally, if your app's content **is not** placed inside of a `mat-sidenav-container` element, you need to add the `mat-app-background` class to your wrapper element (for example the `body`). This ensures that the proper theme background is applied to your page.

最后，如果你的应用内容**没有**放在 `mat-sidenav-container` 元素中，那么你需要给包装元素（比如 `body`）添加 `mat-app-background` 类。 这可以确保你的页面中使用了正确的主题背景色。

### Defining a custom theme

### 定义自定义主题

When you want more customization than a pre-built theme offers, you can create your own theme file.

如果要做更深度的定制化，你可以创建自己的主题文件。

A custom theme file does two things:

自定义主题文件要做两件事：

1. Imports the `mat-core()` Sass mixin. This includes all common styles that are used by multiple components. **This should only be included once in your application.** If this mixin is included multiple times, your application will end up with multiple copies of these common styles.

   导入 `mat-core()` 混入器。它包括所有供多个组件使用的公共样式。**在你的应用中，应该只包含一次该混入器。**
   如果包含多次，你的应用中就会出现这些公共样式的多个副本。

2. Defines a **theme** data structure as the composition of configurations for the individual theming systems (`color` and `typography`). This object can be created with either the
   `mat-light-theme` function or the `mat-dark-theme` function. The output of this function is then passed to the `angular-material-theme` mixin, which will output all of the corresponding styles for the theme.

   **主题**的数据结构定义为一些独立主题体系（`color` 和 `typography`）的配置组合。该对象可以用 `mat-light-theme` 函数或 `mat-dark-theme` 函数之一来创建。然后该函数的输出被传给 `angular-material-theme` mixin，这将输出该主题对应的所有样式。

A typical theme file will look something like this:

典型的主题文件是这样的：

```scss
@import '~@angular/material/theming';
// Plus imports for other components in your app.

// Include the common styles for Angular Material. We include this here so that you only
// have to load a single css file for Angular Material in your app.
// Be sure that you only ever include this mixin once!
@include mat-core();

// Define the palettes for your theme using the Material Design palettes available in palette.scss
// (imported above). For each palette, you can optionally specify a default, lighter, and darker
// hue. Available color palettes: https://material.io/design/color/
$candy-app-primary: mat-palette($mat-indigo);
$candy-app-accent:  mat-palette($mat-pink, A200, A100, A400);

// The warn palette is optional (defaults to red).
$candy-app-warn:    mat-palette($mat-red);

// Create the theme object. A theme consists of configurations for individual
// theming systems such as `color` or `typography`.
$candy-app-theme: mat-light-theme((
  color: (
    primary: $candy-app-primary,
    accent: $candy-app-accent,
    warn: $candy-app-warn,  
  )
));

// Include theme styles for core and each component used in your app.
// Alternatively, you can import and @include the theme mixins for each component
// that you are using.
@include angular-material-theme($candy-app-theme);
```

You only need this single Sass file; you do not need to use Sass to style the rest of your app.

你只需要这一个 Sass 文件，而不用在应用的其余部分使用 Sass。

If you are using the Angular CLI, support for compiling Sass to css is built-in; you only have to add a new entry to the `"styles"` list in `angular.json` pointing to the theme file (e.g., `unicorn-app-theme.scss`).

如果你在使用 Angular CLI，那么它已经内置了把 Sass 编译成 css 的功能，你只要在 `angular.json` 的 `"styles"` 列表中添加一个指向主题文件（比如 `unicorn-app-theme.scss`）的结构就可以了。

If you're not using the Angular CLI, you can use any existing Sass tooling to build the file (such as gulp-sass or grunt-sass). The simplest approach is to use the `node-sass` CLI; you simply run:

如果你没有使用 Angular CLI，你可以使用任何现有的 Sass 工具来构建此文件（比如 gulp-sass 或 grunt-sass）。 最简单的方式是使用 `node-sass` 的 CLI，只要运行下列命令：

```
node-sass src/unicorn-app-theme.scss dist/unicorn-app-theme.css
```

and then include the output file in your index.html.

然后把它的输出包含进你的 index.html 中即可。

Your custom theme file **should not** be imported into other SCSS files. This will duplicate styles in your CSS output. If you want to consume your theme definition object
(e.g., `$candy-app-theme`) in other SCSS files, then the definition of the theme object should be broken into its own file, separate from the inclusion of the `mat-core` and
`angular-material-theme` mixins.

你的自定义主题文件**不应该**导入到其它 SCSS 文件中，否则会导致往 CSS 输出文件中写入很多重复的样式。 如果你希望在其它 SCSS 中使用该主题的定义对象（比如 `$candy-app-theme`），那么就要把这些主题对象的定义拆分到单独的文件中，而不要包含在 `mat-core` 和 `angular-material-theme` 混入器中。

The theme file can be concatenated and minified with the rest of the application's css.

这个主题文件可以和应用中的其它 css 连接起来并最小化。

Note that if you include the generated theme file in the `styleUrls` of an Angular component, those styles will be subject to that component's [view encapsulation](https://angular.io/docs/ts/latest/guide/component-styles.html#!#view-encapsulation).

注意，如果你在 Angular 组件的 `styleUrls` 中包含了生成的主题，那么这些样式还会被组件的[视图封装](https://angular.cn/docs/ts/latest/guide/component-styles.html#!#view-encapsulation)机制所处理。

#### Multiple themes

#### 多重主题

You can create multiple themes for your application by including the `angular-material-theme` mixin multiple times, where each inclusion is gated by an additional CSS class.

你可以通过多次调用 `angular-material-theme` 混入器，每次包含一些额外的 CSS 类，来为应用创建多个主题。

Remember to only ever include the `@mat-core` mixin once; it should not be included for each theme.

记住，只能包含 `@mat-core` 一次；不应该让每个主题都包含它一次。

##### Example of defining multiple themes:

##### 定义多重主题的例子：

```scss
@import '~@angular/material/theming';
// Plus imports for other components in your app.

// Include the common styles for Angular Material. We include this here so that you only
// have to load a single css file for Angular Material in your app.
// **Be sure that you only ever include this mixin once!**
@include mat-core();

// Define the default theme (same as the example above).
$candy-app-primary: mat-palette($mat-indigo);
$candy-app-accent:  mat-palette($mat-pink, A200, A100, A400);
$candy-app-theme:   mat-light-theme((
  color: (
    primary: $candy-app-primary,
    accent: $candy-app-accent,
  )
));

// Include the default theme styles (color and default density)
@include angular-material-theme($candy-app-theme);


// Define an alternate dark theme.
$dark-primary: mat-palette($mat-blue-grey);
$dark-accent:  mat-palette($mat-amber, A200, A100, A400);
$dark-warn:    mat-palette($mat-deep-orange);
$dark-theme:   mat-dark-theme((
  color: (
    primary: $dark-primary,
    accent: $dark-accent,
    warn: $dark-warn,
  )
));

// Include the dark color styles inside of a block with a CSS class. You can make this
// CSS class whatever you want. In this example, any component inside of an element with
// `.unicorn-dark-theme` will be affected by this alternate dark theme instead of the default theme.
.unicorn-dark-theme {
    @include angular-material-color($dark-theme);
}
```

In the above example, any component inside of a parent with the `unicorn-dark-theme` class will use the dark theme, while other components will fall back to the default `$candy-app-theme`.

在上面这个例子中，任何位于带有 `unicorn-dark-theme` 类的父元素中的组件都会使用深色主题，而其它组件则会回退到默认的 `$candy-app-theme`。

You can include as many color schemes as you like in this manner. You can also `@include` the
`angular-material-color` in separate files and then lazily load them based on an end-user interaction (how to lazily load the CSS assets will vary based on your application).

你可以像这里一样包含任意数量的配色方案，也可以在一个独立的文件中 `@include` `angular-material-color`，并根据用户的交互惰性加载它们（加载 CSS 资源的方式有很多种方式，取决于你的应用）。

It's important to remember, however, that the `mat-core` mixin should only ever be included _once_. Similarly, the `angular-material-theme` mixin should not be used multiple times as it generates styles for all configured theming system parts. For example, typography styles would be generated multiple times, even though the configuration did not change. Instead, use fine-grained mixins such as `angular-material-color` that only result in styles being generated for the [color system][2].

然而，重要的是要记住 `mat-core` mixin 只应该被包含*一次*。同样，`angular-material-theme` mixin 也不应多次使用，因为它会为所有已配置的各部分主题体系生成样式。例如，即使配置没有改变，也会多次生成排版样式。反之，应该使用细粒度的 mixins，比如 `angular-material-color` ，它只会为[颜色体系][2]生成样式。

Read more about duplicated theme styles in the [dedicated guide](./duplicate-theming-styles.md).

要了解更多关于重复主题风格的知识，请参见[专门的指南](./duplicate-theming-styles.md)。

##### Multiple themes and overlay-based components

##### 多重主题和基于浮层的组件

Since certain components (e.g. menu, select, dialog, etc.) are inside of a global overlay container, an additional step is required for those components to be affected by the theme's css class selector
(`.unicorn-dark-theme` in the example above).

由于某些组件（比如菜单、选择框、对话框等）位于全局的浮层容器中，所以要想让它们被主题的 css 类选择器（比如 `.unicorn-dark-theme`）影响到还需要做一个额外的步骤。

To do this, you can add the appropriate class to the global overlay container. For the example above, this would look like:

要做到这一点，你可以给全局浮层容器添加一个合适的类。比如上面的例子要改成这样：

```ts
import { OverlayContainer } from '@angular/cdk/overlay';

@NgModule({
    // ...
})
export class UnicornCandyAppModule {
    constructor(overlayContainer: OverlayContainer) {
        overlayContainer.getContainerElement().classList.add('unicorn-dark-theme');
    }
}
```

#### Theming only certain components

#### 为特定的元素指定主题

The `angular-material-theme` mixin will output styles for [all components in the library](https://github.com/angular/components/blob/master/src/material/core/theming/_all-theme.scss). If you are only using a subset of the components (or if you want to change the theme for specific components), you can include component-specific theme mixins. You also will need to include the `mat-core-theme` mixin as well, which contains theme-specific styles for common behaviors
(such as ripples).

`angular-material-theme` 混入器将为[本库中的所有组件](https://github.com/angular/material2/blob/master/src/lib/core/theming/_all-theme.scss)输出主题。
如果你只想使用这些组件的一个子集（或要修改特定组件的主题），你可以包含专属于该组件的主题混入器。 你还要包含 `mat-core-theme` 混入器，它包含了常见行为（比如水波）的特定于该主题的样式。

 ```scss
@import '~@angular/material/theming';
// Plus imports for other components in your app.

// Include the common styles for Angular Material. We include this here so that you only
// have to load a single css file for Angular Material in your app.
// **Be sure that you only ever include this mixin once!**
@include mat-core();

// Define the theme.
$candy-app-primary: mat-palette($mat-indigo);
$candy-app-accent:  mat-palette($mat-pink, A200, A100, A400);
$candy-app-theme:   mat-light-theme((
  color: (
    primary: $candy-app-primary,
    accent: $candy-app-accent,
  )
));

// Include the theme styles for only specified components.
@include mat-core-theme($candy-app-theme);
@include mat-button-theme($candy-app-theme);
@include mat-checkbox-theme($candy-app-theme);
```

#### Changing styles at run-time

#### 在运行时改变样式

##### Toggling classes

##### 切换类名

You can use the theming mixins to customize any part of your application with standard
CSS selectors. For example, let's say you want to toggle alternate colors on a button.
You would first define a CSS class with the alternate colors.

可以通过标准 CSS 选择器来使用这些主题 mixin，以自定义应用的任何部分。例如，假设你要在一个按钮上切换到备用颜色。你首先要用这些备用颜色定义一个 CSS 类。

Note that `mat-button-color` should be used instead of `mat-button-theme` as we only
want to have alternate colors for the button. Using the theme mixin could result in
duplicative theme styles if the `mat-button-theme` has been included before. Read more about
this in the [dedicated guide](./duplicate-theming-styles.md).

需要注意的是应该用 `mat-button-color` 来代替 `mat-button-theme`，因为我们只希望有一些备用颜色的按钮。如果前面已经包含过 `mat-button-theme`，使用主题混入可能导致重复的主题风格。欲知详情，请参见[专门的指南](./duplicate-theming-styles.md)。

```scss
.alternate-button {
  // Extract the color configuration from the theme and generate
  // the color theme styles for `mat-button`.
  @include mat-button-color($alternate-theme);
}
```

Then you can use normal Angular class bindings to toggle the alternate styles.

然后，你可以使用普通的 Angular 类绑定来切换备用样式。

```html
<div [class.alternate-button]="isAlternateMode">
  <button mat-button>Save changes</button>
</div>
```

You can use this approach to style any component inside of the region marked with the custom
CSS class.

你可以用这个方法来为标记自定义 CSS 类的区域内的任何组件设置样式。

##### Swapping CSS files

##### 交换 CSS 文件

If you want to completely swap a theme without including all of the styles at once, you
can swap the loaded theme file. The details will depend on your application, but the general
idea looks like this:

如果要完全交换主题而不想同时包含所有样式，你可以交换已加载的主题文件。其细节取决于你的应用，但总体思路如下：

```html

<link id="themeAsset" rel="stylesheet" href="/path/to/my/theme-name.css">
```

```ts
function changeTheme(themeName) {
    document.getElementById('themeAsset').href = `/path/to/my/${themeName}.css`;
}
```

### Theming your own components

### 为你自己的组件设置主题

For more details about theming your own components, see [theming-your-components.md](./theming-your-components.md).

要深入了解如何为自定义组件添加主题，参见[为你的组件设置主题](./theming-your-components.md)。

[1]: https://material.io/archive/guidelines/style/color.html#color-color-palette

[2]: https://material.io/design/color

[3]: ./typography.md
