The `layout` package provides utilities to build responsive UIs that react to screen-size changes. 

这个 `layout` 包提供了一些工具来构建响应式用户界面，以响应屏幕尺寸的变化。

### BreakpointObserver

### BreakpointObserver（断点观察者）

A layout **breakpoint** is viewport size threshold at which a layout shift can occur. The viewport
size ranges between breakpoints correspond to different standard screen sizes. 

布局**断点**是指可能发生布局偏移的视口大小阈值。断点之间的视口尺寸范围对应于不同的标准屏幕尺寸。

`BreakpointObserver` lets you evaluate media queries to determine the current screen size and
react to changes when the viewport size crosses a breakpoint.

`BreakpointObserver` 是一个用于对媒体查询进行求值，并对其查询结果的变化作出反应的实用工具。

<!-- example(breakpoint-observer-overview) -->

#### Check the current viewport size

#### 检查当前视口大小

You can use the `isMatched` method to evaluate one or more media queries against the current
viewport size.

你可以使用 `isMatched` 方法根据当前视口大小来计算一个或多个媒体查询。

```ts
const isSmallScreen = breakpointObserver.isMatched('(max-width: 599px)');
```

#### React to changes to the viewport

#### 对视口的变化做出反应

You can use the `observe` method to get an observable stream that emits whenever the viewport size
crosses a breakpoint.

你可以使用 `observe` 方法获取一个可观察流，该流会在视口大小越过断点时发出事件。

```ts
const layoutChanges = breakpointObserver.observe([
  '(orientation: portrait)',
  '(orientation: landscape)',
]);

layoutChanges.subscribe(result => {
  updateMyLayoutForOrientationChange();
});
```

#### Predefined breakpoints

#### 预定义断点

The built-in `Breakpoints` constant offers the following predefined breakpoints for convenience,
[originally drawn from the Material Design
specification](https://material.io/archive/guidelines/layout/responsive-ui.html).

为方便起见，内置的 `Breakpoints` 常量提供了下列预定义断点，这些断点[最初来自 Material Design 规范](https://material.io/archive/guidelines/layout/responsive-ui.html)。

| Breakpoint name | Media query |
| --------------- | ----------- |
| 断点名称 | 媒体查询 |
| `XSmall` | `(max-width: 599.98px)` |
| `Small` | `(min-width: 600px) and (max-width: 959.98px)` |
| `Medium` | `(min-width: 960px) and (max-width: 1279.98px)` |
| `Large` | `(min-width: 1280px) and (max-width: 1919.98px)` |
| `XLarge` | `(min-width: 1920px)` |
| `Handset` | `(max-width: 599.98px) and (orientation: portrait), (max-width: 959.98px) and (orientation: landscape)` |
| `Tablet` | `(min-width: 600px) and (max-width: 839.98px) and (orientation: portrait), (min-width: 960px) and (max-width: 1279.98px) and (orientation: landscape)` |
| `Web` | `(min-width: 840px) and (orientation: portrait), (min-width: 1280px) and (orientation: landscape)` |
| `HandsetPortrait` | `(max-width: 599.98px) and (orientation: portrait)` |
| `TabletPortrait` | `(min-width: 600px) and (max-width: 839.98px) and (orientation: portrait)` |
| `WebPortrait` | `(min-width: 840px) and (orientation: portrait)` |
| `HandsetLandscape` | `(max-width: 959.98px) and (orientation: landscape)` |
| `TabletLandscape` | `(min-width: 960px) and (max-width: 1279.98px) and (orientation: landscape)` |
| `WebLandscape` | `(min-width: 1280px) and (orientation: landscape)` |

You can use these predefined breakpoints with `BreakpointObserver`.

你可以将这些预定义断点与 `BreakpointObserver` 一起使用。

```ts
breakpointObserver.observe([
  Breakpoints.HandsetLandscape,
  Breakpoints.HandsetPortrait
]).subscribe(result => {
  if (result.matches) {
    this.activateHandsetLayout();
  }
});
```

### MediaMatcher

### MediaMatcher（媒体匹配器）

`MediaMatcher` is a low-level utility that wraps the native `matchMedia`. This service
normalizes browser differences and serves as a convenient API that can be replaced with a fake in
unit tests.
The `matchMedia` method can be used to get a native
[`MediaQueryList`](https://developer.mozilla.org/en-US/docs/Web/API/MediaQueryList).

`MediaMatcher` 是一个较底层的实用工具，它是对原生 `matchMedia` 的包装。该服务规范了浏览器的差异，可以作为一个便利 API 实用，可以在单元测试时用假对象来代替它。`matchMedia` 方法可以用来获取原生的 [`MediaQueryList`](https://developer.mozilla.org/en-US/docs/Web/API/MediaQueryList)。

```ts
@Component({...})
class MyComponent {
  constructor(mediaMatcher: MediaMatcher) {
    const mediaQueryList = mediaMatcher.matchMedia('(min-width: 1px)');
  }
}
```
