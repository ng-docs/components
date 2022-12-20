This version of `<mat-progress-bar>` is built on top of
[MDC Web](https://github.com/material-components/material-components-web).

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

3. Import the `MatProgressBarModule` and add it to the module that declares your component:

   导入 `MatProgressBarModule` 并将其添加到声明组件的模块中：

   ```ts
   import {MatProgressBarModule} from '@angular/material/progress-bar';

   @NgModule({
     declarations: [MyComponent],
     imports: [MatProgressBarModule],
   })
   export class MyModule {}
   ```

4. Add use `<mat-progress-bar>` in your component's template, just like you would the normal
   `<mat-progress-bar>`:

   在你的组件模板中添加 `<mat-progress-bar>` ，就像你使用普通的 `<mat-progress-bar>` 一样：

   ```html
   <mat-progress-bar [value]="42"></mat-progress-bar>
   ```

5. Add the theme and typography mixins to your Sass:

   将主题和排版 mixin 添加到你的 Sass 中：

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

   @include mat.progress-bar-theme($my-theme);
   @include mat.progress-bar-typography($my-theme);
   ```
