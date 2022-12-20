`MatSnackBar` is a service for displaying snack-bar notifications.

`MatSnackBar` 是一个用来显示快餐栏通知的服务。

<!-- example(snack-bar-overview) -->

### Opening a snackbar

### 打开快餐栏

A snackbar can contain either a string message or a given component.

快餐栏可以包含一个字符串消息或指定的组件。

```ts
// Simple message.
let snackBarRef = snackBar.open('Message archived');

// Simple message with an action.
let snackBarRef = snackBar.open('Message archived', 'Undo');

// Load the given component into the snackbar.
let snackBarRef = snackBar.openFromComponent(MessageArchivedComponent);
```

In either case, a `MatSnackBarRef` is returned. This can be used to dismiss the snackbar or to
receive notification of when the snackbar is dismissed. For simple messages with an action, the
`MatSnackBarRef` exposes an observable for when the action is triggered.
If you want to close a custom snackbar that was opened via `openFromComponent`, from within the
component itself, you can inject the `MatSnackBarRef`.

无论哪种形式，都会返回一个 `MatSnackBarRef`。它可以用来关闭快餐栏或在快餐栏关闭时接收通知。
对于只有一个操作的简单消息，当该动作被触发时，`MatSnackBarRef` 会暴露出一个 `Observable`。
如果你要关闭一个用 `openFromComponent` 打开的自定义快餐栏，可以在该组件中注入一个 `MatSnackBarRef`。

```ts
snackBarRef.afterDismissed().subscribe(() => {
  console.log('The snackbar was dismissed');
});

snackBarRef.onAction().subscribe(() => {
  console.log('The snackbar action was triggered!');
});

snackBarRef.dismiss();
```

### Dismissal

### 关闭

A snackbar can be dismissed manually by calling the `dismiss` method on the `MatSnackBarRef`
returned from the call to `open`.

可以调用由 `open` 调用返回的 `MatSnackBarRef` 中的 `dismiss` 方法来手动关闭快餐栏。

Only one snackbar can ever be opened at one time. If a new snackbar is opened while a previous
message is still showing, the older message will be automatically dismissed.

同一时刻只能打开一个快餐栏。如果在显示前一个消息时打开一个新的快餐栏，老的消息就会自动关闭。

A snackbar can also be given a duration via the optional configuration object:

快餐栏还可以通过一个可选的配置对象来指定持续时间：

```ts
snackBar.open('Message archived', 'Undo', {
  duration: 3000
});
```

### Sharing data with a custom snackbar

### 与自定义快餐栏共享数据

You can share data with the custom snackbar, that you opened via the `openFromComponent` method,
by passing it through the `data` property.

你可以传入 `data` 属性，来与 `openFromComponent` 打开的自定义快餐栏共享数据。

```ts
snackBar.openFromComponent(MessageArchivedComponent, {
  data: 'some data'
});
```

To access the data in your component, you have to use the `MAT_SNACK_BAR_DATA` injection token:

要在组件中访问该数据，可以使用依赖注入令牌 `MAT_SNACK_BAR_DATA`：

```ts
import {Component, Inject} from '@angular/core';
import {MAT_SNACK_BAR_DATA} from '@angular/material/snack-bar';

@Component({
  selector: 'your-snackbar',
  template: 'passed in {{ data }}',
})
export class MessageArchivedComponent {
  constructor(@Inject(MAT_SNACK_BAR_DATA) public data: string) { }
}
```

### Annotating custom snackbar content
When opening a custom snackbar via the `snackBar.openFromComponent` method, you can use the
following directives to annotate the content and ensure that it is styled consistently compared to
snackbars  opened via `snackBar.open`.

* `matSnackBarLabel` - Marks the text of the snackbar shown to users
* `matSnackBarActions` - Marks the container element containing any action buttons
* `matSnackBarAction` - Marks an individual action button

If no annotations are used, all the content will be treated as text content.

<!-- example({
  "example": "snack-bar-annotated-component-example",
  "file": "snack-bar-annotated-component-example-snack.html"
}) -->

### Setting the global configuration defaults

### 设置全局配置的默认值

If you want to override the default snack bar options, you can do so using the
`MAT_SNACK_BAR_DEFAULT_OPTIONS` injection token.

如果你要覆盖快餐栏的默认选项，可以使用 `MAT_SNACK_BAR_DEFAULT_OPTIONS` 令牌。

```ts
@NgModule({
  providers: [
    {provide: MAT_SNACK_BAR_DEFAULT_OPTIONS, useValue: {duration: 2500}}
  ]
})
```

### Accessibility

### 无障碍性

`MatSnackBar` announces messages via an `aria-live` region. While announcements use the `polite`
setting by default, you can customize this by setting the `politeness` property of
`MatSnackBarConfig`.

`MatSnackBar` 通过 `aria-live` 区域来播报消息。虽然默认情况下公告会使用 `polite` 设置，但你也可以通过设置 `MatSnackBarConfig` 的 `politeness` 属性来自定义它。

`MatSnackBar` does not move focus to the snackbar element. Moving focus like this would disrupt
users in the middle of a workflow. For any action offered in the snackbar, your application should
provide an alternative way to perform the action. Alternative interactions are typically keyboard
shortcuts or menu options. You should dismiss the snackbar once the user performs its corresponding
action. A snackbar can contain a single action with an additional optional "dismiss" or "cancel"
action.

`MatSnackBar` 不会将焦点移动到快餐栏元素。像这样移动焦点会在工作流程中扰乱用户。对于快餐栏中提供的任何操作，你的应用程序都应该提供执行该操作的替代方法。替代交互通常是键盘快捷键或菜单选项。一旦用户执行相应的操作，你应该关闭快餐栏。快餐栏可以包含一个单独的动作和一个额外的可选“关闭”或“取消”动作。

Avoid setting a `duration` for snackbars that have an action available, as screen reader users may
want to navigate to the snackbar element to activate the action. If the user has manually moved
their focus within the snackbar, you should return focus somewhere that makes sense in the context
of the user's workflow.

尽量不要为具有可用操作的快餐栏设置 `duration` ，因为屏幕阅读器用户可能希望导航到快餐栏上的元素以激活该操作。如果用户在快餐栏中手动移动了他们的焦点，你应该将焦点返回到用户工作流程上下文中有意义的某个地方。