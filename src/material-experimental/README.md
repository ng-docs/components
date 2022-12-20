# Angular Material Experimental

# Angular Material 试验版

This package contains prototypes and experiments in development for Angular Material. Nothing in
this package is considered stable or production ready. While the package releases with Angular
Material, breaking changes may occur with any release.

这个包里包含 Angular Material 开发中的原型和实验版。此包中的任何内容都不能认为是稳定的或生产就绪的。虽然包与 Angular Material 一起发布，但任何版本都可能发生重大更改。

## Using the experimental components based on MDC Web

## 使用基于 MDC Web 的试验组件

Assuming your application is already up and running using Angular Material, you can add this
component by following these steps:

假设你的应用程序已经使用 Angular Material 启动并运行，你可以按照以下步骤添加此组件：

1. Install Angular Material Experimental & MDC WEB:

   安装 Angular Material 试验版 & MDC WEB：

   ```bash
   npm i material-components-web @angular/material-experimental
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

3. Import the `NgModule` for the component you want to use. For example, the checkbox:

   为你要使用的组件导入 `NgModule` 。例如复选框：

```ts
  import {MatCheckboxModule} from '@angular/material/checkbox';

  @NgModule({
    declarations: [MyComponent],
    imports: [MatCheckboxModule],
  })
  export class MyModule {}
```

4. Use the components just as you would the normal Angular Material components. For example,
   the checkbox:

   就像使用普通的 Angular Material 组件一样使用这些组件。例如复选框：

```html
  <mat-checkbox [checked]="isChecked">Check me</mat-checkbox>
```

5. Add the theme and typography mixins to your Sass. These align with the normal Angular Material
   mixins except that they are suffixed with `-mdc`. Some experimental components may not yet
   be included in the pre-built CSS mixin and will need to be explicitly included.

   将主题和排版 mixin 添加到你的 Sass 中。它们与普通的 Angular Material mixins 一致，只是它们带有 `-mdc` 后缀。一些试验性组件可能尚未包含在预构建的 CSS mixin 中，需要明确包含。

```scss
  @use '@angular/material' as mat;
  @use '@angular/material-experimental' as mat-experimental;

  $my-primary: mat.define-palette(mat.$indigo-palette);
  $my-accent: mat.define-palette(mat.$pink-palette, A200, A100, A400);
  $my-theme: mat.define-light-theme((
    color: (
      primary: $my-primary,
      accent: $my-accent
    ),
    // Using `define-mdc-typography-config` rather than `define-typography-config` generates a
    // typography config directly from the official Material Design styles. This includes using
    // `rem`-based measurements rather than `px`-based ones as the spec recommends.
    typography: mat-experimental.define-mdc-typography-config(),
    // The density level to use in this theme, defaults to 0 if not specified.
    density: 0
  ));

  @include mat-experimental.all-mdc-component-themes($my-theme);
```
