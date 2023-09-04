# Getting Started with Angular Material

# Angular Material 入门指南

This guide explains how to set up your Angular project to begin using Angular Material. It includes
information on prerequisites, installing Angular Material, and optionally displaying a sample
Material component in your application to verify your setup.

本指南讲解了如何设置 Angular 项目以开始使用 Angular Material。它包含有关先决条件的信息、如何安装 Angular Material，以及在应用中显示一个 Material 范例组件，以验证你的设置。

*Angular Resources*

*Angular 资源*

If you are new to Angular or getting started with a new Angular application, see
[Angular's full Getting Started Guide](https://angular.io/start) and
[Setting up your environment](https://angular.io/guide/setup-local).

如果你是 Angular 新手，或从一个新的 Angular 应用开始，参见 [Angular 的完整入门指南](https://angular.cn/start)和[设置你的环境](https://angular.cn/guide/setup-local)。

For existing applications, follow the steps below to begin using Angular Material.

对于已有的应用，请按照以下步骤开始使用 Angular Material。

## Install Angular Material

## 安装 Angular Material

Use the Angular CLI's installation [schematic](https://material.angular.io/guide/schematics) to set
up your Angular Material project by running the following command:

使用 Angular CLI 的安装[原理图](https://material.angular.cn/guide/schematics)通过运行以下命令来设置你的 Angular Material 项目：

```bash
ng add @angular/material
```

The `ng add` command will install Angular Material, the
[Component Dev Kit (CDK)](https://material.angular.io/cdk/categories),
[Angular Animations](https://angular.io/guide/animations) and ask you the following questions to
determine which features to include:

该 `ng add` 命令将安装 Angular Material、[组件开发工具包（CDK）](https://material.angular.cn/cdk/categories)、[Angular 动画](https://angular.cn/guide/animations)，并询问下列问题，以确定要包括哪些功能：

1. Choose a prebuilt theme name, or "custom" for a custom theme:

   选择一个预置的主题名或为自定义主题选择 “custom”：

   You can choose from [prebuilt material design themes](https://material.angular.io/guide/theming#using-a-pre-built-theme) or set up an extensible [custom theme](https://material.angular.io/guide/theming#defining-a-theme).

   你可以选择一个[预置的 Material Design 主题](https://material.angular.cn/guide/theming#using-a-pre-built-theme)或建立一个可扩展的[自定义主题](https://material.angular.cn/guide/theming#defining-a-custom-theme)。

2. Set up global Angular Material typography styles:

   设置全局 Angular Material 排版样式：

   Whether to apply the global [typography](https://material.angular.io/guide/typography) styles to your application.

   是否为应用程序套用全局[排版](https://material.angular.cn/guide/typography)样式。

3. Set up browser animations for Angular Material:

   为 Angular Material 设置浏览器动画：

   Importing the [`BrowserAnimationsModule`](https://angular.io/api/platform-browser/animations/BrowserAnimationsModule) into your application enables Angular's [animation system](https://angular.io/guide/animations). Declining this will disable most of Angular Material's animations.

   把 [`BrowserAnimationsModule`](https://angular.cn/api/platform-browser/animations/BrowserAnimationsModule)导入到应用中，可以启用 Angular 的[动画体系](https://angular.cn/guide/animations)。拒绝它会使 Angular Material 中的动画失效。

The `ng add` command will additionally perform the following actions:

`ng add` 命令还将执行以下动作：

* Add project dependencies to `package.json`

  把项目依赖加入到 `package.json` 中

* Add the Roboto font to your `index.html`

  把 Roboto 字体添加到你的 `index.html` 中

* Add the Material Design icon font to your `index.html`

  把 Material Design 的图标字体添加到你 `index.html` 中

* Add a few global CSS styles to:

  添加一些全局 CSS 样式：

  * Remove margins from `body`

    去掉 `body` 的边距

  * Set `height: 100%` on `html` and `body`

    为 `html` 和 `body` 设置 `height: 100%`

  * Set Roboto as the default application font

    把 Roboto 设置为默认的应用字体

You're done! Angular Material is now configured to be used in your application.

完工！ Angular Material 已经配置好应用于你的应用中了。

### Display a component

### 显示一个组件

Let's display a slide toggle component in your app and verify that everything works.

让我们在应用中显示一个滑块开关组件，来验证一切正常。

You need to import the `MatSlideToggleModule` that you want to display by adding the following lines to
your `app.module.ts` file.

你需要通过把以下代码添加到 `app.module.ts` 文件中来导入 `MatSlideToggleModule`。

```ts
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@NgModule ({
  imports: [
    MatSlideToggleModule,
  ]
})
class AppModule {}
```

Add the `<mat-slide-toggle>` tag to the `app.component.html` like so:

把 `<mat-slide-toggle>` 标签添加到 `app.component.html`，就像这样：

```html
<mat-slide-toggle>Toggle me!</mat-slide-toggle>
```

Run your local dev server:

运行本地开发服务器：

```bash
ng serve
```

Then point your browser to http://localhost:4200

让浏览器访问 http://localhost:4200

You should see the Material slide toggle component on the page.

你会在页面上看到这个 Material 滑块开关组件。

In addition to the installation schematic, Angular Material comes with
[several other schematics](https://material.angular.io/guide/schematics) (like nav, table,
address-form, etc.) that can be used to easily generate pre-built components in your application.

除了安装原理图之外，Angular Material 还带有[另外一些原理图](https://material.angular.cn/guide/schematics)（如导航、表格、地址表单等），可用于方便地在应用中生成预置的组件。
