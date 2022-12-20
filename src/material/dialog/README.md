This is a prototype of an alternate version of `MatDialog` built on top of
[MDC Web](https://github.com/material-components/material-components-web). This component is
experimental and should not be used in production.

## How to use

## 如何使用

Assuming your application is already up and running using Angular Material, you can add this
component by following these steps:

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

3. Import the experimental `MatDialogModule` and add it to the module that declares your
   component:

   导入试验性的 `MatDialogModule` 并将其添加到声明组件的模块中：

   ```ts
   import {MatDialogModule} from '@angular/material/dialog';

   @NgModule({
     declarations: [MyComponent],
     imports: [MatDialogModule],
   })
   export class MyModule {}
   ```

4. Use the `MatDialog` service in your components by injecting the service, just like you would
   use the normal dialog.

   通过注入服务在组件中使用 `MatDialog` 服务，就像使用普通对话框一样。

5. Ensure color and typography styles for `@angular/material` are set up. Either
   use a custom theme and use the `mat-dialog-theme` mixin, or use a prebuilt theme
   from `@angular/material/mdc-core/theming/prebuilt`.

   确保设置了 `@angular/material` 的颜色和排版样式。使用自定义主题并使用 `mat-dialog-theme` mixin，或者使用来自 `@angular/material/mdc-core/theming/prebuilt` 的预构建主题。

## API differences

## API 差异

The runtime API for the `MatDialog` service is fully compatible and no changes are needed. Visually
the dialog has changed a little bit with the MDC-based implementation. In concrete, the dialog no
longer has outer padding by default.

`MatDialog` 服务的运行时 API 完全兼容，无需更改。在视觉上，该对话框随着基于 MDC 的实现发生了一些变化。具体来说，默认情况下对话框不再有外边距。

If content elements such as `matDialogContent` or `matDialogTitle` are used though, the MDC dialog
will display as with the current non-experimental dialog. The padding change will only surface if
you have custom content within the dialog that is not wrapped with `matDialogContent`,
`matDialogActions` or `matDialogTitle`.

但是，如果使用 `matDialogContent` 或 `matDialogTitle` 等内容元素，MDC 对话框将显示为当前的非试验性对话框。仅当你在对话框中有未用 `matDialogContent` 、 `matDialogActions` 或 `matDialogTitle` 包装的自定义内容时，内衬距更改才会浮出水面。

We provide a backwards compatibility mixin that re-adds the outer padding. The use of this mixin
is generally not recommended as it results in inefficient CSS for the dialog because padding from
the content elements would need to be off set (to not have stacked padding). Ideally, if you have
custom content outside of the provided dialog sections, add the necessary padding to the element
directly through CSS, or move them into one of the defined sections the Angular Material dialog
provides.

我们提供了一个向后兼容的 mixin，可以重新添加外边距。通常不建议使用此 mixin，因为它会导致对话框的 CSS 效率低下，因为内容元素的内衬距需要偏移（不具有堆叠内衬距）。理想情况下，如果你在提供的对话框部分之外有自定义内容，请直接通过 CSS 向元素添加必要的内衬距，或者将它们移动到 Angular Material 对话框提供的定义部分之一。

```scss
@use '@angular/material' as mat;

@include mat.dialog-legacy-padding();
```
