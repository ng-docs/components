This is prototype of an alternate version of the Angular Material tabs built on top of
[MDC Web](https://github.com/material-components/material-components-web). It demonstrates how
Angular Material could use MDC Web under the hood while still exposing the same API Angular users as
the existing `<mat-tab-group>`. This component is experimental and should not be used in production.

## How to use

## 如何使用

Assuming your application is already up and running using Angular Material, you can add this
component by following these steps:

假设你的应用程序已经使用 Angular Material 启动并运行，你可以按照以下步骤添加此组件：

1. Install Angular Material & MDC WEB:

   安装 Angular Material & MDC WEB：

   ```bash
   npm i material-components-web @angular/material
   ```

2. In your `angular.json`, make sure `node_modules/` is listed as a Sass include path. This is
   needed for the Sass compiler to be able to find the MDC Web Sass files.

   在你的 `angular.json` 中，确保 `node_modules/` 被列为 Sass 包含路径。这是让 Sass 编译器能够找到 MDC Web Sass 文件所必需的。

   ```json
   ...
   "styles": [
     "src/styles.scss"
   ],
   "stylePreprocessorOptions": {
     "includePaths": [
       "node_modules/"
     ]
   },
   ...
   ```

3. Import the experimental `MatTabsModule` and add it to the module that declares your
   component:

   导入试验性 `MatTabsModule` 并将其添加到声明组件的模块中：

   ```ts
   import {MatTabsModule} from '@angular/material/tabs';

   @NgModule({
     declarations: [MyComponent],
     imports: [MatTabsModule],
   })
   export class MyModule {}
   ```

4. Use `<mat-tab-group>` in your component's template, just like you would the normal
   `<mat-tab-group>`:

   在你的组件模板中使用 `<mat-tab-group>` ，就像你使用普通的 `<mat-tab-group>` 一样：

   ```html
    <mat-tab-group>
      <mat-tab label="First">Content 1</mat-tab>
      <mat-tab label="Second">Content 2</mat-tab>
      <mat-tab label="Third">Content 3</mat-tab>
    </mat-tab-group>
   ```

5. Add the theme and typography mixins to your Sass. (There is currently no pre-built CSS option for
   the experimental tabs):

   将主题和排版 mixin 添加到你的 Sass 中。 （目前没有针对试验性选项卡的预建 CSS 选项）：

   ```scss
   @use '@angular/material' as mat;

   $my-primary: mat.define-palette(mat.$indigo-palette);
   $my-accent: mat.define-palette(mat.$pink-palette, A200, A100, A400);
   $my-theme: mat.define-light-theme((
     color: (
       primary: $my-primary,
       accent: $my-accent
     )
   ));

   @include mat.tabs-theme($my-theme);
   @include mat.tabs-typography($my-theme);
   ```

## API differences

## API 差异

The experimental tabs API closely matches the
[API of the standard tabs](https://material.angular.io/components/tabs/api).
`@angular/material/tabs` exports symbols with the same name and public interface
as all of the symbols found under `@angular/material/legacy-tabs`, except for the following
differences:

* `MatTabNav` will throw an error in dev mode if a `[tabPanel]` is not provided.

  如果未提供 `[tabPanel]` ， `MatTabNav` 将在开发模式下抛出错误。

* `MatTabLink` is defined as a `Component` in the experimental package,
  whereas in the current one it's a `Directive`.

  `MatTabLink` 在试验包中被定义为一个 `Component` ，而在当前包中它是一个 `Directive` 。

## Replacing the standard tabs in an existing app

## 替换现有应用程序中的标准选项卡

Because the experimental API mirrors the API for the standard tabs, it can easily be swapped in
by just changing the import paths. There is currently no schematic for this, but you can run the
following string replace across your TypeScript files:

由于此试验性 API 镜像了标准选项卡的 API，因此只需更改导入路径即可轻松将其换入。目前没有这方面的原理图，但你可以在 TypeScript 文件中运行以下字符串替换：

```bash
grep -lr --include="*.ts" --exclude-dir="node_modules" \
  --exclude="*.d.ts" "['\"]@angular/material/legacy-tabs['\"]" | xargs sed -i \
  "s/['\"]@angular\/material\/legacy-tabs['\"]/'@angular\/material\/tabs'/g"
```

CSS styles and tests that depend on implementation details of the tabs (such as getting elements
from the template by class name) will need to be manually updated.

依赖于选项卡实现细节的 CSS 样式和测试（例如通过类名从模板中获取元素）将需要手动更新。
