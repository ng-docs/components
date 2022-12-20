This is prototype of an alternate version of `<mat-slide-toggle>` built on top of
[MDC Web](https://github.com/material-components/material-components-web). It demonstrates how
Angular Material could use MDC Web under the hood while still exposing the same API Angular users as
the existing `<mat-slide-toggle>`. This component is experimental and should not be used in production.

## How to use

## 如何使用

Assuming your application is already up and running using Angular Material, you can add this
component by following these steps:

假设你的应用程序已经使用 Angular Material 启动并运行，你可以按照以下步骤添加此组件：

1. Install Angular Material Experimental & MDC WEB:

   安装 Angular Material 试验版 & MDC WEB：

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

3. Import the experimental `MatSlideToggleModule` and add it to the module that declares your
   component:

   导入试验性的 `MatSlideToggleModule` 并将其添加到声明组件的模块中：

   ```ts
   import {MatSlideToggleModule} from '@angular/material/slide-toggle';

   @NgModule({
     declarations: [MyComponent],
     imports: [MatSlideToggleModule],
   })
   export class MyModule {}
   ```

4. Add use `<mat-slide-toggle>` in your component's template, just like you would the normal
   `<mat-slide-toggle>`:

   在你的组件模板中添加 `<mat-slide-toggle>` ，就像你使用普通的 `<mat-slide-toggle>` 一样：

   ```html
   <mat-slide-toggle [checked]="isChecked">Toggle me</mat-slide-toggle>
   ```

5. Add the theme and typography mixins to your Sass. (There is currently no pre-built CSS option for
   the experimental `<mat-slide-toggle>`):

   将主题和排版 mixin 添加到你的 Sass 中。 （目前还没有针对试验性 `<mat-slide-toggle>` 的预构建 CSS 选项）：

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

   @include mat.slide-toggle-theme($my-theme);
   @include mat.slide-toggle-typography($my-theme);
   ```

## Replacing the standard slide toggle in an existing app

## 替换现有应用程序中的标准滑动开关

Because the experimental API mirrors the API for the standard slide toggle, it can easily be swapped
in by just changing the import paths. There is currently no schematic for this, but you can run the
following string replace across your TypeScript files:

由于此试验性 API 镜像了标准滑动开关的 API，因此只需更改导入路径即可轻松将其换入。目前没有这方面的原理图，但你可以在 TypeScript 文件中运行以下字符串替换：

```bash
grep -lr --include="*.ts" --exclude-dir="node_modules" \
  --exclude="*.d.ts" "['\"]@angular/material/legacy-slide-toggle['\"]" | xargs sed -i \
  "s/['\"]@angular\/material\/legacy-slide-toggle['\"]/'@angular\/material\/slide-toggle'/g"
```

CSS styles and tests that depend on implementation details of mat-slide-toggle (such as getting
elements from the template by class name) will need to be manually updated.

依赖于 mat-slide-toggle 实现细节的 CSS 样式和测试（例如通过类名从模板中获取元素）将需要手动更新。

There are some small visual differences between this slide and the standard mat-slide. This
slide has a slightly larger ripple and different spacing between the label and the toggle.

这个滑块开关和标准 mat-slide 之间存在一些细微的视觉差异。这个滑块开关的涟漪稍大，标签和开关之间的间距不同。
