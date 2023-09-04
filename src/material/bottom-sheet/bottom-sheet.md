The `MatBottomSheet` service can be used to open Material Design panels to the bottom of the screen.
These panels are intended primarily as an interaction on mobile devices where they can be used as an
alternative to dialogs and menus.

`MatBottomSheet` 服务可用于在屏幕底部打开一些 Material Design 面板。
这些面板的主要目的是在移动设备上作为对话框和菜单的替代品提供交互体验。

<!-- example(bottom-sheet-overview) -->

You can open a bottom sheet by calling the `open` method with a component to be loaded and an
optional config object. The `open` method will return an instance of `MatBottomSheetRef`:

你可以调用它的 `open` 方法并传入一个要加载的组件和一个可选的配置对象，来打开一个底部操作表：

```ts
const bottomSheetRef = bottomSheet.open(SocialShareComponent, {
  ariaLabel: 'Share on social media'
});
```

The `MatBottomSheetRef` is a reference to the currently-opened bottom sheet and can be used to close
it or to subscribe to events. Note that only one bottom sheet can be open at a time. Any component
contained inside of a bottom sheet can inject the `MatBottomSheetRef` as well.

`MatBottomSheetRef` 是一个到当前打开的底部操作表的引用，可以通过此引用来关闭它或订阅其事件。
注意，同一时间只能打开一个底部操作表。
底部操作表中包含的任何组件也同样可以注入这个 `MatBottomSheetRef` 引用。

```ts
bottomSheetRef.afterDismissed().subscribe(() => {
  console.log('Bottom sheet has been dismissed.');
});

bottomSheetRef.dismiss();
```

### Sharing data with the bottom sheet component.

### 与底部操作表组件共享数据

If you want to pass in some data to the bottom sheet, you can do so using the `data` property:

如果你要把一些数据传给底部操作表，可以使用 `data` 属性：

```ts
const bottomSheetRef = bottomSheet.open(HobbitSheet, {
  data: { names: ['Frodo', 'Bilbo'] },
});
```

Afterwards you can access the injected data using the `MAT_BOTTOM_SHEET_DATA` injection token:

然后，你就可以通过注入令牌 `MAT_BOTTOM_SHEET_DATA` 来访问所注入的这些数据了：

```ts
import {Component, Inject} from '@angular/core';
import {MAT_BOTTOM_SHEET_DATA} from '@angular/material/bottom-sheet';

@Component({
  selector: 'hobbit-sheet',
  template: 'passed in {{ data.names }}',
})
export class HobbitSheet {
  constructor(@Inject(MAT_BOTTOM_SHEET_DATA) public data: {names: string[]}) { }
}
```

### Specifying global configuration defaults

### 全局指定配置的默认值

Default bottom sheet options can be specified by providing an instance of `MatBottomSheetConfig`
for `MAT_BOTTOM_SHEET_DEFAULT_OPTIONS` in your application's root module.

可以通过在应用的根模块中为 `MAT_BOTTOM_SHEET_DEFAULT_OPTIONS` 提供一个 `MatBottomSheetConfig` 实例来为底部操作表指定默认选项。

```ts
@NgModule({
  providers: [
    {provide: MAT_BOTTOM_SHEET_DEFAULT_OPTIONS, useValue: {hasBackdrop: false}}
  ]
})
```

### Accessibility

### 无障碍性

`MatBottomSheet` creates modal dialogs that implement the ARIA `role="dialog"` pattern. This root
dialog element should be given an accessible label via the `ariaLabel` property of
`MatBottomSheetConfig`.

`MatBottomSheet` 会创建实现了 ARIA `role="dialog"` 模式的模态对话框。这个根对话框元素应该通过 `MatBottomSheetConfig` 的 `ariaLabel` 属性被赋予一个无障碍标签。

#### Keyboard interaction

#### 键盘交互

By default, the escape key closes `MatBottomSheet`. While you can disable this behavior by using
the `disableClose` property of `MatBottomSheetConfig`, doing this breaks the expected interaction
pattern for the ARIA `role="dialog"` pattern.

默认情况下，esc 键会关闭 `MatBottomSheet` 。虽然你可以使用 `MatBottomSheetConfig` 的 `disableClose` 属性禁用此行为，但这样做会破坏 ARIA `role="dialog"` 模式的预期交互模式。

#### Focus management

#### 焦点管理

When opened, `MatBottomSheet` traps browser focus such that it cannot escape the root
`role="dialog"` element. By default, the first tabbable element in the bottom sheet receives focus.
You can customize which element receives focus with the `autoFocus` property of
`MatBottomSheetConfig`, which supports the following values.

在打开时， `MatBottomSheet` 会捕获浏览器焦点，使其无法逃脱 `role="dialog"` 的根元素。默认情况下，底部工作表中的第一个可 tab 到的元素会获得焦点。你可以使用 `MatBottomSheetConfig` 的 `autoFocus` 属性来自定义哪个元素将获得焦点，该属性支持以下值。

| Value            | Behavior                                                             |
| ---------------- | -------------------------------------------------------------------- |
| 值               | 行为                                                                 |
| `first-tabbable` | Focus the first tabbable element. This is the default setting.       |
| `first-tabbable` | 聚焦到第一个可 tab 到的元素。这是默认设置。                          |
| `first-header`   | Focus the first header element (`role="heading"`, `h1` through `h6`) |
| `first-header`   | 聚焦到第一个标题元素（`role="heading"`、`h1` 到 `h6` ）              |
| `dialog`         | Focus the root `role="dialog"` element.                              |
| `dialog`         | 聚焦到 `role="dialog"` 的根元素。                                    |
| Any CSS selector | Focus the first element matching the given selector.                 |
| 任意 CSS 选择器  | 聚焦到与给定选择器匹配的第一个元素。                                 |

While the default setting applies the best behavior for most applications, special cases may benefit
from these alternatives. Always test your application to verify the behavior that works best for
your users.

虽然默认设置是适合大多数应用程序的最佳行为，但特殊情况下也可能要用到这些替代方案。多多测试你的应用程序，以找出最适合你的用户的行为。

#### Focus restoration

#### 焦点还原

When closed, `MatBottomSheet` restores focus to the element that previously held focus when the
bottom sheet opened. However, if that previously focused element no longer exists, you must
add additional handling to return focus to an element that makes sense for the user's workflow.
Opening a bottom sheet from a menu is one common pattern that causes this situation. The menu
closes upon clicking an item, thus the focused menu item is no longer in the DOM when the bottom
sheet attempts to restore focus.

关闭时，`MatBottomSheet` 会将焦点还原到之前打开底部工作表时持有焦点的元素。但是，如果先前聚焦的元素不再存在，则必须添加额外的处理以将焦点返回到对用户的工作流程有意义的元素。从菜单打开底部工作表是导致这种情况的一种常见模式。单击菜单项时菜单关闭，因此当底部工作表尝试恢复焦点时，聚焦的菜单项已不再存在于 DOM 中。

You can add handling for this situation with the `afterDismissed()` observable from
`MatBottomSheetRef`.

你可以使用来自 `MatBottomSheetRef` 的 `afterDismissed()` 这个 Observable 添加对这种情况的处理。

```typescript
const bottomSheetRef = bottomSheet.open(FileTypeChooser);
bottomSheetRef.afterDismissed().subscribe(() => {
  // Restore focus to an appropriate element for the user's workflow here.
});
```
