This is a prototype of an alternate version of `MatSnackBar` built on top of
[MDC Web](https://github.com/material-components/material-components-web). This component is experimental and should not be used in production.

## How to use

## 如何使用

Assuming your application is already up and running using Angular Material, you can add this component by following these steps:

假设你的应用程序已经使用 Angular Material 启动并运行，你可以按照以下步骤添加此组件：

1. Install `@angular/material` and MDC Web:

   安装 `@angular/material` 和 MDC Web：

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

3. Import the `MatSnackBarModule` and add it to the module that declares your component:

   导入 `MatSnackBarModule` 并将其添加到声明组件的模块中：

   ```ts
   import {MatSnackBarModule} from '@angular/material/snack-bar';

   @NgModule({
     declarations: [MyComponent],
     imports: [MatSnackBarModule],
   })
   export class MyModule {}
   ```

4. Open the snack bar from your component:

   从你的组件打开快餐栏：

   ```ts
     import {MatSnackBar} from '@angular/material/snack-bar';

     @Component({ ... })
     export class MySnackBarDemo {
       constructor(public snackBar: MatSnackBar) {
         this.snackBar.open('Hello, world');
       }
     }
   ```

5. Add the theme mixins to your Sass:

   将主题 mixins 添加到你的 Sass 中：

   ```scss
   @use '@angular/material' as mat;

   $candy-app-primary: mat.define-palette(mat.$indigo-palette);
   $candy-app-accent: mat.define-palette(mat.$pink-palette, A200, A100, A400);
   $candy-app-theme: mat.define-light-theme((
     color: (
       primary: $candy-app-primary,
       accent: $candy-app-accent,
     )
   ));


   @include mat.snack-bar-theme($candy-app-theme);
   ```

## API differences

The API of the snack bar matches the one from `@angular/material/legacy-snack-bar`. Simply replace imports to
`@angular/material/legacy-snack-bar` with imports to `@angular/material/snack-bar`.
