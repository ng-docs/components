The `bidi` package provides a common system for components to get and respond to change in the
application's LTR/RTL layout direction.

`bidi` 包为组件提供了一个通用的体系，来获取和响应该应用的 LTR（从左到右）/RTL（从右到左）布局方向的变化。

### Directionality

### 方向性

When including the CDK's `BidiModule`, components can inject `Directionality` to get the current
text direction (RTL or LTR);

当包含 CDK 的 `BidiModule` 时，组件中就可以注入 `Directionality` 来获取当前的文本方向了（RTL 或者 LTR）;

#### Example

#### 例子

```ts
@Component({ ... })
export class MyWidget implements OnDestroy {

  /** Whether the widget is in RTL mode or not. */
  private isRtl: boolean;

  /** Subscription to the Directionality change EventEmitter. */
  private _dirChangeSubscription = Subscription.EMPTY;

  constructor(dir: Directionality) {
    this.isRtl = dir.value === 'rtl';

    this._dirChangeSubscription = dir.change.subscribe(() => {
      this.flipDirection();
    });
  }

  ngOnDestroy() {
    this._dirChangeSubscription.unsubscribe();
  }
}
```

### The `Dir` directive

### `Dir` 指令

The `BidiModule` also includes a directive that matches any elements with a `dir` attribute. This
directive has the same API as Directionality and provides itself _as_ `Directionality`. By doing
this, any component that injects `Directionality` will get the closest ancestor layout direction
context.

`BidiModule` 还包含一个指令，用来匹配所有带 `dir` 属性的元素。该指令与 Directionality 具有相同的 API，并将自身*作为* `Directionality` 的服务提供者。这样一来，任何注入了 `Directionality` 的组件都会得到关于最近祖先的布局方向上下文。

### Interpreting the `auto` value

### 解释 `auto` 值

The CDK also supports the native `auto` value for the `dir` attribute, however there's a difference
in how it is interpreted. Some parts of the CDK, like overlays and keyboard navigation, need to know
if the element is in an RTL or LTR layout in order to work correctly. For performance reasons, we
resolve the `auto` value by looking at the browser's language (`navigator.language`) and matching
it against a set of known RTL locales. This differs from the way the browser handles it, which is
based on the text content of the element.

CDK 还支持 `dir` 属性的原生 `auto` 值，但是它的解释方式有所不同。 CDK 的某些部分，如浮层和键盘导航，需要知道元素是在 RTL 还是 LTR 布局中才能正常工作。出于性能原因，我们通过查看浏览器的语言 (`navigator.language` ) 并将其与一组已知的 RTL 语言环境进行匹配来解析 `auto` 值。这与浏览器处理它的方式不同，后者会基于元素的文本内容。
