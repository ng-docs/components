The `portals` package provides a flexible system for rendering dynamic content into an application.

`portals` 包提供了一个灵活的布局体系，可以把动态内容渲染到应用中。

### Portals

### 传送点

A `Portal` is a piece of UI that can be dynamically rendered to an open slot on the page.

`Portal` 是一小块 UI，可以被动态渲染到页面上的空白插槽（slot）中。

The "piece of UI" can be either a `Component`, a `TemplateRef` or a DOM element and the "open slot" is
a `PortalOutlet`.

这“一小块 UI”既可以是 `Component`、`TemplateRef` 或 DOM 元素，而“空白的插槽”是指 `PortalOutlet`。

Portals and PortalOutlets are low-level building blocks that other concepts, such as overlays, are
built upon.

各种 Portal 和 PortalOutlet 是建立在其它概念（比如浮层）之上的底层构造块。

<!-- example(cdk-portal-overview) -->

##### `Portal<T>`

| Method | Description |
| ------ | ----------- |
| 方法 | 说明 |
| `attach(PortalOutlet): T` | Attaches the portal to a host. |
| `attach(PortalOutlet): T` | 把此传送点附着到宿主上。 |
| `detach(): void` | Detaches the portal from its host. |
| `detach(): void` | 把此传送点从宿主上拆除。 |
| `isAttached: boolean` | Whether the portal is attached. |
| `isAttached: boolean` | 此传送点是否已附着上。 |

##### `PortalOutlet`

| Method | Description |
| ------ | ----------- |
| 方法 | 说明 |
| `attach(Portal): any` | Attaches a portal to the host. |
| `attach(Portal): any` | 把指定的传送点添加到此宿主上。 |
| `detach(): any` | Detaches the portal from the host. |
| `detach(): any` | 把指定的传送点从此宿主上拆除。 |
| `dispose(): void` | Permanently dispose the host. |
| `dispose(): void` | 永久销毁此宿主。 |
| `hasAttached: boolean` | Whether a portal is attached to the host. |
| `hasAttached: boolean` | 判断是否有传送点附着在此宿主上。 |

#### Portals in practice

#### 传送点实战

##### `CdkPortal`

Used to get a portal from an `<ng-template>`. `CdkPortal` *is* a `Portal`.

用于从某个 `<ng-template>` 获取传送点。`CdkPortal` *是*一个 `Portal`。

Usage:

用法：

```html
<ng-template cdkPortal>
  <p>The content of this template is captured by the portal.</p>
</ng-template>

<!-- OR -->

<!-- This result here is identical to the syntax above -->
<p *cdkPortal>
  The content of this template is captured by the portal.
</p>
```

A component can use `@ViewChild` or `@ViewChildren` to get a reference to a
`CdkPortal`.

组件可以使用 `@ViewChild` 或 `@ViewChildren` 来获取对 `CdkPortal` 的引用。

##### `ComponentPortal`

Used to create a portal from a component type.

用于从某个组件类创建传送点。

Usage:

用法：

```ts
ngAfterViewInit() {
  this.userSettingsPortal = new ComponentPortal(UserSettingsComponent);
}
```

##### `TemplatePortal`

You can create a `TemplatePortal` from an `<ng-template>`. `TemplatePortal` allows you to take Angular content within one template and render it somewhere else.

你可以从 `<ng-template>` `TemplatePortal`。`TemplatePortal` 允许你在一个模板中获取 Angular 的内容，并把它渲染到其他地方。

Usage:

用法：

```html
<ng-template #templatePortalContent>Some content here</ng-template>
```

```ts
@ViewChild('templatePortalContent') templatePortalContent: TemplateRef<unknown>;

ngAfterViewInit() {
  this.templatePortal = new TemplatePortal(
    this.templatePortalContent,
    this._viewContainerRef
  );
}
```

##### `DomPortal`

You can create a `DomPortal` from any native DOM element. `DomPortal` allows you to take any arbitrary DOM content and render it somewhere else. `DomPortal` moves content _as is_, so elements with Angular features like bindings or directives may no longer update if moved via `DomPortal`.

你可以从任何的 native DOM 元素 `DomPortal` `DomPortal` 允许你把任意 DOM 内容带到其它地方。`DomPortal`*如*移动内容，因此，如果经由移动，角元件设有像绑定或指令可能不再更新 `DomPortal`。

Usage:

用法：

```html
<div #domPortalContent>Some content here</div>
```

```ts
@ViewChild('domPortalContent') domPortalContent: ElementRef<HTMLElement>;
ngAfterViewInit() {
  this.domPortal = new DomPortal(this.domPortalContent);
}
```

##### `CdkPortalOutlet`

Used to add a portal outlet to a template. `CdkPortalOutlet` *is* a `PortalOutlet`.

用于向模板中添加一个传送点出口（Portal Outlet）。`CdkPortalOutlet` *是*一个 `PortalOutlet`。

Usage:

用法：

```html
<!-- Attaches the `userSettingsPortal` from the previous example. -->
<ng-template [cdkPortalOutlet]="userSettingsPortal"></ng-template>
```
