The `Dialog` service can be used to open unstyled modal dialogs and to build your own dialog
services.

`Dialog` 服务可用于打开无样式的模态对话框并构建你自己的对话框服务。

<!-- example(cdk-dialog-overview) -->

You can open a dialog by calling the `open` method either with a component or with a `TemplateRef`
representing the dialog content. The method additionally accepts an optional configuration object.
The `open` method returns a `DialogRef` instance:

你可以通过使用组件或表示对话框内容的 `TemplateRef` 为参数调用 `open` 方法来打开对话框。该方法还接受一个可选的配置对象。`open` 方法返回一个 `DialogRef` 实例：

```ts
const dialogRef = dialog.open(UserProfileComponent, {
  height: '400px',
  width: '600px',
  panelClass: 'my-dialog',
});
```

The `DialogRef` provides a reference to the opened dialog. You can use the `DialogRef` to close the
dialog, subscribe to dialog events, and modify dialog state. All `Observable` instances on the
`DialogRef` complete when the dialog closes.

`DialogRef` 会提供对所打开对话框的引用。你可以使用 `DialogRef` 关闭对话框、订阅对话框事件和修改对话框状态。 `DialogRef` 上的所有 `Observable` 实例都会在对话框关闭时自动结束。

```ts
dialogRef.closed.subscribe(result => {
  console.log(`Dialog result: ${result}`); // Pizza!
});

dialogRef.close('Pizza!');
```

Components created via `Dialog` can _inject_ `DialogRef` and use it to close the dialog
in which they are contained. When closing, an optional result value can be provided. This result
value is forwarded as the result of the `closed` Observable.

通过 `Dialog` 创建的组件可以*注入* `DialogRef` 并使用它来关闭包含该组件的对话框。关闭时，可以提供可选的结果值。这个结果值作为 `closed` 这个 Observable 的结果进行转发。

```ts
@Component({/* ... */})
export class YourDialog {
  constructor(public dialogRef: DialogRef<string>) {}

  closeDialog() {
    this.dialogRef.close('Pizza!');
  }
}
```

### Dialog styling

### 对话框样式

The `Dialog` service includes an intentionally limited set of structural styles. You can customize
the dialog's appearance using one of the following approaches.

`Dialog` 服务包括一组刻意限制的结构化样式。你可以使用以下方法之一自定义对话框的外观。

#### `panelClass` option

#### `panelClass` 选项

The `panelClass` property of `DialogConfig` allows you to apply one or more CSS classes to the
overlay element that contains the custom dialog content. Any styles targeting these CSS classes
must be global styles.

`DialogConfig` 的 `panelClass` 属性允许你将一个或多个 CSS 类应用于包含自定义对话框内容的浮层元素。任何针对这些 CSS 类的样式都必须是全局样式。

#### Styling the dialog component

#### 设置对话框组件的样式

You can use the `styles` or `styleUrls` of a custom component to style the dialog content:

你可以使用自定义组件的 `styles` 或 `styleUrls` 来设置对话框内容的样式：

```ts
// MyDialog is rendered via `dialog.open(MyDialog)`
@Component({
  selector: 'my-dialog',
  styles: [`
    :host {
      display: block;
      background: #fff;
      border-radius: 8px;
      padding: 16px;
    }
  `]
})
class MyDialog {}
```

<!-- example(cdk-dialog-styling) -->

#### Providing a custom dialog container

#### 提供自定义对话框容器

If you want more control over the dialog's behavior and styling, you can provide your own dialog
container component using the `container` option in `DialogConfig`. This approach requires more
code up-front, but it allows you to customize the DOM structure and behavior of the container
around the dialog content. Custom container components can optionally extend `CdkDialogContainer`
to inherit standard behaviors, such as accessible focus management.

如果你想更好地控制对话框的行为和样式，可以使用 `DialogConfig` 中的 `container` 选项提供自己的对话框容器组件。这种方法需要更多的代码，但它允许你围绕对话框内容自定义 DOM 结构和容器的行为。自定义容器组件可以选择扩展 `CdkDialogContainer` 以继承标准行为，例如无障碍化的焦点管理。

```ts
import {CdkDialogContainer} from '@angular/cdk/dialog';

@Component({
  selector: 'my-dialog-container',
  styles: [`
    :host {
      display: block;
      background: #fff;
      border-radius: 8px;
      padding: 16px;
    }
  `]
})
class MyDialogContainer extends CdkDialogContainer {}
```

### Specifying global configuration defaults

### 指定全局配置默认值

Default dialog options can be specified by providing an instance of `DialogConfig` for
`DEFAULT_DIALOG_CONFIG` in your application's root module.

可以通过在应用程序的根模块中为注入令牌 `DEFAULT_DIALOG_CONFIG` 提供 `DialogConfig` 实例来指定默认对话框选项。

```ts
@NgModule({
  providers: [
    {provide: DEFAULT_DIALOG_CONFIG, useValue: {hasBackdrop: false}}
  ]
})
```

### Sharing data with the Dialog component.

### 与 Dialog 组件共享数据。

You can use the `data` option to pass information to the dialog component.

你可以使用 `data` 选项将信息传递给对话框组件。

```ts
const dialogRef = dialog.open(YourDialog, {
  data: {name: 'frodo'},
});
```

Access the data in your dialog component with the `DIALOG_DATA` injection token:

可以使用 `DIALOG_DATA` 注入令牌访问对话框组件中的数据：

```ts
import {Component, Inject} from '@angular/core';
import {DIALOG_DATA} from '@angular/cdk/dialog';

@Component({
  selector: 'your-dialog',
  template: 'passed in {{ data.name }}',
})
export class YourDialog {
  constructor(@Inject(DIALOG_DATA) public data: {name: string}) { }
}
```

If you're using a `TemplateRef` for your dialog content, the data is available in the template:

如果你将 `TemplateRef` 用于对话内容，则数据在模板中可用：

```html
<ng-template let-data>
  Hello, {{data.name}}
</ng-template>
```

<!-- example(cdk-dialog-data) -->

### Accessibility

### 无障碍性

`Dialog` creates modal dialogs that implement the ARIA `role="dialog"` pattern by default.
You can change the dialog's role to `alertdialog` via the `DialogConfig`.

默认情况下， `Dialog` 会创建实现了 ARIA `role="dialog"` 模式的模态对话框。你可以通过 `DialogConfig` `alertdialog` 来更改此对话框的角色。

You should provide an accessible label to this root dialog element by setting the `ariaLabel` or
`ariaLabelledBy` properties of `DialogConfig`. You can additionally specify a description element
ID via the `ariaDescribedBy` property of `DialogConfig`.

你应该通过设置 `DialogConfig` 的 `ariaLabel` 或 `ariaLabelledBy` 属性来为此根对话框元素提供无障碍化标签。你还可以通过 `DialogConfig` 的 `ariaDescribedBy` 属性来指定描述元素的 ID。

#### Keyboard interaction

#### 键盘交互

By default, the escape key closes `Dialog`. While you can disable this behavior via the
`disableClose` property of `DialogConfig`, doing this breaks the expected interaction pattern
for the ARIA `role="dialog"` pattern.

默认情况下，用 `escape` 键关闭 `Dialog` 。虽然你可以通过 `DialogConfig` 的 `disableClose` 属性禁用此行为，但这样做会破坏 ARIA `role="dialog"` 模式的预期交互模式。

#### Focus management

#### 焦点管理

When opened, `Dialog` traps browser focus such that it cannot escape the root
`role="dialog"` element. By default, the first tabbable element in the dialog receives focus.
You can customize which element receives focus with the `autoFocus` property of
`DialogConfig`, which supports the following values.

打开时， `Dialog` 会捕获浏览器焦点，使其无法离开带有 `role="dialog"` 的根元素。默认情况下，对话框中的第一个可 tab 到的元素会获得焦点。你可以使用 `DialogConfig` 的 `autoFocus` 属性来自定义哪个元素接收焦点，该属性支持以下值。

| Value | Behavior |
| ----- | -------- |
| 值 | 行为 |
| `first-tabbable` | Focus the first tabbable element. This is the default setting. |
| `first-tabbable` | 聚焦第一个可 tab 到的元素。这是默认设置。 |
| `first-header` | Focus the first header element (`role="heading"`, `h1` through `h6`) |
| `first-header` | 聚焦第一个标题元素（ `role="heading"` ， `h1` 到 `h6` ） |
| `dialog` | Focus the root `role="dialog"` element. |
| `dialog` | 聚焦根 `role="dialog"` 元素。 |
| Any CSS selector | Focus the first element matching the given selector. |
| 任何 CSS 选择器 | 聚焦与给定选择器匹配的第一个元素。 |

While the default setting applies the best behavior for most applications, special cases may benefit
from these alternatives. Always test your application to verify the behavior that works best for
your users.

虽然默认设置是适用于大多数应用程序的最佳行为，但特殊情况下也可能会需要这些替代方案。始终测试你的应用程序以验证最适合你的用户的行为。

#### Focus restoration

#### 焦点还原

When closed, `Dialog` restores focus to the element that previously held focus when the
dialog opened by default. You can customize the focus restoration behavior using the `restoreFocus`
property of `DialogConfig`. It supports the following values.

关闭时 `Dialog` 默认会将焦点还原到打开对话框之前持有焦点的元素。你可以使用 `DialogConfig` 的 `restoreFocus` 属性自定义焦点恢复行为。它支持以下值。

| Value type | Behavior |
| ---------- | -------- |
| 值类型 | 行为 |
| `boolean` | When `true`, focus will be restored to the previously-focused element, otherwise focus won't be restored at all. |
| `boolean` | 当为 `true` 时，焦点将恢复到先前聚焦的元素，否则根本不会恢复焦点。 |
| `string` | Value is treated as a CSS selector. Focus will be restored to the element matching the selector. |
| `string` | 值被视为 CSS 选择器。焦点将恢复到匹配此选择器的元素。 |
| `HTMLElement` | Specific element that focus should be restored to. |
| `HTMLElement` | 应恢复焦点的特定元素。 |
