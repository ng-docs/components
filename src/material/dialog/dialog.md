The `MatDialog` service can be used to open modal dialogs with Material Design styling and
animations.

`MatDialog` 服务可用于打开具有 Material Design 样式和动画效果的模态对话框。

<!-- example(dialog-overview) -->

A dialog is opened by calling the `open` method with a component to be loaded and an optional
config object. The `open` method will return an instance of `MatDialogRef`:

通过调用 `open` 方法并传要加载的组件和可选的配置对象可以打开对话框。
`open` 方法将返回一个 `MatDialogRef` 的实例：

```ts
let dialogRef = dialog.open(UserProfileComponent, {
  height: '400px',
  width: '600px',
});
```

The `MatDialogRef` provides a handle on the opened dialog. It can be used to close the dialog and to
receive notifications when the dialog has been closed. Any notification Observables will complete when the dialog closes.

`MatDialogRef` 提供了已打开对话框的一个引用。可用它来关闭对话框和接受关闭对话框后的通知。
当该对话框关闭时，任何一个通知用的 Observable 都会结束（complete）。

```ts
dialogRef.afterClosed().subscribe(result => {
  console.log(`Dialog result: ${result}`); // Pizza!
});

dialogRef.close('Pizza!');
```

Components created via `MatDialog` can _inject_ `MatDialogRef` and use it to close the dialog
in which they are contained. When closing, an optional result value can be provided. This result
value is forwarded as the result of the `afterClosed` Observable.

通过 `MatDialog` 创建的组件可以*注入* `MatDialogRef`，并用它来关闭包含该组件的对话框。
当关闭时，可以提供一个可选的结果值。该结果值会作为结果转发给 `afterClosed` 事件。

```ts
@Component({/* ... */})
export class YourDialog {
  constructor(public dialogRef: MatDialogRef<YourDialog>) { }

  closeDialog() {
    this.dialogRef.close('Pizza!');
  }
}
```

### Specifying global configuration defaults

### 指定全局默认值

Default dialog options can be specified by providing an instance of `MatDialogConfig` for
MAT_DIALOG_DEFAULT_OPTIONS in your application's root module.

对话框的默认选项可以通过在应用根模块中为 `MAT_DIALOG_DEFAULT_OPTIONS` 令牌提供一个 `MatDialogConfig` 实例来指定。

```ts
@NgModule({
  providers: [
    {provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: {hasBackdrop: false}}
  ]
})
```

### Sharing data with the Dialog component.

### 与对话框组件共享数据

If you want to share data with your dialog, you can use the `data`
option to pass information to the dialog component.

如果要和对话框共享数据，可以通过 `data` 选项把信息传给该组件。

```ts
let dialogRef = dialog.open(YourDialog, {
  data: { name: 'austin' },
});
```

To access the data in your dialog component, you have to use the MAT_DIALOG_DATA injection token:

要在对话框组件中访问此数据，可以使用依赖注入令牌 `MAT_DIALOG_DATA`：

```ts
import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';

@Component({
  selector: 'your-dialog',
  template: 'passed in {{ data.name }}',
})
export class YourDialog {
  constructor(@Inject(MAT_DIALOG_DATA) public data: {name: string}) { }
}
```

Note that if you're using a template dialog (one that was opened with a `TemplateRef`), the data
will be available implicitly in the template:

注意，如果你正在使用模板对话框（用 `TemplateRef` 打开的对话框），其数据在模板中是隐式可用的：

```html
<ng-template let-data>
  Hello, {{data.name}}
</ng-template>
```

<!-- example(dialog-data) -->

### Dialog content

### 对话框内容

Several directives are available to make it easier to structure your dialog content:

下面几个指令能让你更轻松地定义对话框内容的结构：

| Name                   | Description                                                                                                                                                    |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 名称                   | 说明                                                                                                                                                           |
| `mat-dialog-title`     | \[Attr] Dialog title, applied to a heading element (e.g., `<h1>`, `<h2>`)                                                                                      |
| `mat-dialog-title`     | \[Attr] 对话框标题，应用于标题元素（如 `<h1>`、`<h2>`）                                                                                                        |
| `<mat-dialog-content>` | Primary scrollable content of the dialog.                                                                                                                      |
| `<mat-dialog-content>` | 对话框中主要的可滚动内容                                                                                                                                       |
| `<mat-dialog-actions>` | Container for action buttons at the bottom of the dialog. Button alignment can be controlled via the `align` attribute which can be set to `end` and `center`. |
| `<mat-dialog-actions>` | 对话框底部动作按钮的容器                                                                                                                                       |
| `mat-dialog-close`     | \[Attr] Added to a `<button>`, makes the button close the dialog with an optional result from the bound value.                                                 |
| `mat-dialog-close`     | \[Attr] 添加到 `<button>` 上，点击它时会用它绑定的值（可选）作为结果来关闭对话框                                                                               |

For example:

例如：

```html
<h2 mat-dialog-title>Delete all elements?</h2>
<mat-dialog-content>This will delete all elements that are currently on this page and cannot be undone.</mat-dialog-content>
<mat-dialog-actions>
  <button mat-button mat-dialog-close>Cancel</button>
  <!-- The mat-dialog-close directive optionally accepts a value as a result for the dialog. -->
  <button mat-button [mat-dialog-close]="true">Delete</button>
</mat-dialog-actions>
```

Once a dialog opens, the dialog will automatically focus the first tabbable element.

一旦打开了对话框，它就会自动把焦点转给第一个可接受焦点的元素。

You can control which elements are tab stops with the `tabindex` attribute

你可以通过 `tabindex` 属性来控制哪个元素可以接受焦点。

```html
<button mat-button tabindex="-1">Not Tabbable</button>
```

<!-- example(dialog-content) -->

### Controlling the dialog animation

### 控制对话框动画

You can control the duration of the dialog's enter and exit animations using the
`enterAnimationDuration` and `exitAnimationDuration` options. If you want to disable the dialog's
animation completely, you can do so by setting the properties to `0ms`.

你可以使用 `enterAnimationDuration` 和 `exitAnimationDuration` 选项控制对话框的进入和退出动画的持续时间。如果要完全禁用对话框的动画，可以通过将这些属性设置为 `0ms` 来实现。

<!-- example(dialog-animations) -->

### Accessibility

### 无障碍性

`MatDialog` creates modal dialogs that implements the ARIA `role="dialog"` pattern by default.
You can change the dialog's role to `alertdialog` via `MatDialogConfig`.

`MatDialog` 会创建默认实现了 ARIA `role="dialog"` 模式的模态对话框。你可以通过 `MatDialogConfig` 来把对话框的 `role` 改为 `alertdialog`。

You should provide an accessible label to this root dialog element by setting the `ariaLabel` or
`ariaLabelledBy` properties of `MatDialogConfig`. You can additionally specify a description element
ID via the `ariaDescribedBy` property of `MatDialogConfig`.

你应该通过设置 `MatDialogConfig` 的 `ariaLabel` 或 `ariaLabelledBy` 属性来为这个根对话框元素提供一个无障碍标签。你还可以通过 `MatDialogConfig` 的 `ariaDescribedBy` 属性来指定描述元素 ID。

#### Keyboard interaction

#### 键盘交互

By default, the escape key closes `MatDialog`. While you can disable this behavior via
the `disableClose` property of `MatDialogConfig`, doing this breaks the expected interaction
pattern for the ARIA `role="dialog"` pattern.

默认情况下，esc 键会关闭 `MatDialog` 。虽然你可以通过 `MatDialogConfig` 的 `disableClose` 属性禁用此行为，但这样做会破坏 ARIA `role="dialog"` 模式的预期交互模式。

#### Focus management

#### 焦点管理

When opened, `MatDialog` traps browser focus such that it cannot escape the root
`role="dialog"` element. By default, the first tabbable element in the dialog receives focus.
You can customize which element receives focus with the `autoFocus` property of
`MatDialogConfig`, which supports the following values.

打开时，`MatDialog` 会捕获浏览器焦点，使其无法逃脱 `role="dialog"` 的根元素。默认情况下，对话框中的第一个可 tab 到的元素获得焦点。你可以使用 `MatDialogConfig` 的 `autoFocus` 属性自定义哪个元素获得焦点，该属性支持以下值。

| Value            | Behavior                                                             |
| ---------------- | -------------------------------------------------------------------- |
| 值               | 行为                                                                 |
| `first-tabbable` | Focus the first tabbable element. This is the default setting.       |
| `first-tabbable` | 聚焦第一个可 tab 到的元素。这是默认设置。                            |
| `first-header`   | Focus the first header element (`role="heading"`, `h1` through `h6`) |
| `first-header`   | 聚焦第一个标题元素（ `role="heading"`、`h1` 到 `h6` ）               |
| `dialog`         | Focus the root `role="dialog"` element.                              |
| `dialog`         | 聚焦 `role="dialog"` 的根元素。                                      |
| Any CSS selector | Focus the first element matching the given selector.                 |
| 任意 CSS 选择器  | 聚焦与给定选择器匹配的第一个元素。                                   |

While the default setting applies the best behavior for most applications, special cases may benefit
from these alternatives. Always test your application to verify the behavior that works best for
your users.

虽然默认设置是适用于大多数应用程序的最佳行为，但特殊情况下也可能要用到这些替代方案。多多测试你的应用程序以验证最适合你的用户的行为。

#### Focus restoration

#### 焦点还原

When closed, `MatDialog` restores focus to the element that previously held focus when the
dialog opened. However, if that previously focused element no longer exists, you must
add additional handling to return focus to an element that makes sense for the user's workflow.
Opening a dialog from a menu is one common pattern that causes this situation. The menu
closes upon clicking an item, thus the focused menu item is no longer in the DOM when the bottom
sheet attempts to restore focus.

当关闭时， `MatDialog` 会将焦点恢复到先前在对话框打开时持有焦点的元素。但是，如果先前聚焦的元素已不存在了，则必须添加额外的处理以将焦点返回到对用户工作流程有意义的元素。从菜单打开对话框是导致这种情况的常见模式之一。单击菜单项时菜单就会关闭，因此当底部工作表尝试恢复焦点时，聚焦的菜单项已不存在于 DOM 中。

You can add handling for this situation with the `afterClosed()` observable from `MatDialogRef`.

你可以使用来自 `MatDialogRef` 的 `afterClosed()` observable 来添加对这种情况的处理。

<!-- example({"example":"dialog-from-menu",
              "file":"dialog-from-menu-example.ts",
              "region":"focus-restoration"}) -->
