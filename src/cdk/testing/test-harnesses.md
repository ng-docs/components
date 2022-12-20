`@angular/cdk/testing` provides infrastructure to help with testing Angular components.

`@angular/cdk/testing` 提供了一些帮助测试 Angular 组件的基础设施。

### Component test harnesses

### 组件测试工具

A component harness is a class that lets a test interact with a component via a supported API.
Each harness's API interacts with a component the same way a user would. By using the harness API,
a test insulates itself against updates to the internals of a component, such as changing its DOM
structure. The idea for component harnesses comes from the
[PageObject](https://martinfowler.com/bliki/PageObject.html) pattern commonly used for integration
testing.

组件测试工具类是一个让测试可以通过其支持的 API 与组件交互的类。每个工具的 API 都会以和用户相同的方式与一个组件进行交互。通过使用测试工具 API，测试可以防止对组件内部的更新，比如改变它的 DOM 结构。组件测试工具的思想来自常用于集成测试的[ PageObject ](https://martinfowler.com/bliki/PageObject.html)模式。

`@angular/cdk/testing` contains infrastructure for creating and using component test harnesses. You
can create test harnesses for any component, ranging from small reusable widgets to full application
pages.

`@angular/cdk/testing` 包含用于创建和使用组件测试工具的基础设施。你可以为任何组件创建测试工具，范围从很小的可复用组件到完整的应用页面。

The component harness system supports multiple testing environments. You can use the same harness
implementation in both unit and end-to-end tests. This means that users only need to learn one API,
and component authors don't have to maintain separate unit and end-to-end test implementations.

组件工具体系支持多种测试环境。你可以在单元测试和端到端测试中使用相同的工具实现。这意味着用户只需要学习一个 API，而组件作者不需要维护单独的单元测试和端到端测试实现。

Common component libraries, in particular, benefit from this infrastructure due to the wide use of
their components. Providing a test harness allows the consumers of a component to write tests that
avoid dependencies on any private implementation details. By capturing these implementation details
in a single place, consumers can more easily update to new library versions.

特别是对于通用组件库，由于其组件的广泛使用，更容易从这种基础设施中受益。提供一个测试工具可以让组件的使用者编写一些不用依赖任何私有实现细节的测试。通过在一个地方捕获这些实现细节，消费者可以更轻松地更新到库的最新版本。

This document provides guidance for three types of developers:

本文档为三类开发人员提供了指导：

1. [Test authors](#api-for-test-authors)

   [测试的作者](#api-for-test-authors)

2. [Component harness authors](#api-for-component-harness-authors)

   [组件测试工具的作者](#api-for-component-harness-authors)

3. [Harness environment authors](#api-for-harness-environment-authors)

   [测试工具环境的作者](#api-for-harness-environment-authors)

Since many developers fall into only one of these categories, the relevant APIs are broken out by
developer type in the sections below.

由于许多开发人员只会属于这些类别之一，因此相关的 API 会在下面按开发人员类型细分成不同章节。

### API for test authors

### 给测试作者的 API

Test authors are developers using component harnesses written by someone else to test their
application. For example, this could be an app developer who uses a third-party menu component and
needs to interact with the menu in a unit test.

测试作者就是开发人员，他们使用别人编写的组件测试工具来测试自己的应用。例如，这可能是一个使用第三方菜单组件的应用开发者，需要在单元测试中与该菜单进行交互。

#### Working with `ComponentHarness` classes

#### 使用 `ComponentHarness` 类

`ComponentHarness` is the abstract base class for all component harnesses. Every harness extends
this class. All `ComponentHarness` subclasses have a static property, `hostSelector`, that
matches the harness class to instances of the component in the DOM. Beyond that, the API of any
given harness is specific to its corresponding component; refer to the component's documentation to
learn how to use a specific harness.

`ComponentHarness` 是所有组件测试工具的抽象基类。每个测试工具都会扩展这个类。
所有 `ComponentHarness` 的子类都有一个静态属性 `hostSelector`，它把测试工具类与 DOM 中组件的实例相匹配。
除此之外，任何特定测试工具的 API 都是专属于其对应组件的。请参阅该组件的文档，了解如何使用特定的测试工具。

#### Using `TestbedHarnessEnvironment` and `SeleniumWebDriverHarnessEnvironment`

#### 使用 `TestbedHarnessEnvironment` 和 `SeleniumWebDriverHarnessEnvironment`

These classes correspond to different implementations of the component harness system with bindings
for specific test environments. Any given test must only import _one_ of these classes. Karma-based
unit tests should use the `TestbedHarnessEnvironment`, while Selenium WebDriver-based end-to-end tests
should use the `SeleniumWebDriverHarnessEnvironment`. Additional environments require custom bindings; see
[API for harness environment authors](#api-for-harness-environment-authors) for more information on
alternate test environments.

这些类对应于组件工具体系的不同实现，并绑定到特定的测试环境。任何一种测试都只能导入*其中一个*类。
基于 Karma 的单元测试应该使用 `TestbedHarnessEnvironment`，而基于 Protractor 的端到端测试应该使用 `SeleniumWebDriverHarnessEnvironment`。
其他环境会要求自定义绑定；给参见[测试工具环境作者的 API](#api-for-harness-environment-authors)，以了解有关备用测试环境的更多信息。

These classes are primarily used to create a `HarnessLoader` instance, and in certain cases, to
create `ComponentHarness` instances directly.

这些类主要用于创建一个 `HarnessLoader` 实例，在某些情况下，还可以用来创建 `ComponentHarness` 实例。

`TestbedHarnessEnvironment` offers the following static methods:

`TestbedHarnessEnvironment` 提供了以下静态方法：

| Method | Description |
| ------ | ----------- |
| 方法 | 说明 |
| `loader(fixture: ComponentFixture<unknown>): HarnessLoader` | Gets a `HarnessLoader` instance for the given fixture, rooted at the fixture's root element. Should be used to create harnesses for elements contained inside the fixture |
| `loader(fixture: ComponentFixture<unknown>): HarnessLoader` | 获取 `HarnessLoader` 实例，该实例以测试夹具的根元素为根。用来为夹具里面的元素创建测试工具 |
| `documentRootLoader(fixture: ComponentFixture<unknown>): HarnessLoader` | Gets a `HarnessLoader` instance for the given fixture, rooted at the HTML document's root element. Can be used to create harnesses for elements that fall outside of the fixture |
| `documentRootLoader(fixture: ComponentFixture<unknown>): HarnessLoader` | 获取 `HarnessLoader` 实例，该实例以 HTML 文档的根元素为根。可以用来为那些夹具外面的元素创建测试工具 |
| `harnessForFixture<T extends ComponentHarness>(fixture: ComponentFixture<unknown>, harnessType: ComponentHarnessConstructor<T>): Promise<T>` | Used to create a `ComponentHarness` instance for the fixture's root element directly. This is necessary when bootstrapping the test with the component you plan to load a harness for, because Angular does not set the proper tag name when creating the fixture. |
| `harnessForFixture<T extends ComponentHarness>(fixture: ComponentFixture<unknown>, harnessType: ComponentHarnessConstructor<T>): Promise<T>` | 用来直接为夹具的根元素创建一个 `ComponentHarness`。当使用你计划为其加载测试工具的组件启动测试时，这是必要的，因为在创建夹具时，Angular 还没有设置正确的标签名。 |

In most cases, you can create a `HarnessLoader` in the `beforeEach` block using
`TestbedHarnessEnvironment.loader(fixture)` and then use that `HarnessLoader` to create any
necessary `ComponentHarness` instances. The other methods cover special cases as shown in this
example:

在大多数情况下，你可以使用 `TestbedHarnessEnvironment.loader(fixture)` 在 `beforeEach` 中创建一个 `HarnessLoader`，然后使用该 `HarnessLoader` 来创建任何必要的 `ComponentHarness` 实例。其他方法涵盖了那些特例，如下例所示：

Consider a reusable dialog-button component that opens a dialog on click, containing the following
components, each with a corresponding harness:

考虑一个可复用的对话框按钮组件，它在单击时会打开一个对话框，其中包含以下组件，每个组件都带有相应的工具：

- `MyDialogButton` (composes the `MyButton` and `MyDialog` with a convenient API)

  `MyDialogButton`（用便利 API 组合 `MyButton` 与 `MyDialog`）

- `MyButton` (a simple button component)

  `MyButton` （简单按钮组件）

- `MyDialog` (a dialog appended to `document.body` by `MyDialogButton` upon click)

  `MyDialog` （通过点击 `MyDialogButton`，把一个对话框附着到 `document.body` 上）

The following code loads harnesses for each of these components:

下列代码为每个组件加载了一些测试工具：

```ts
let fixture: ComponentFixture<MyDialogButton>;
let loader: HarnessLoader;
let rootLoader: HarnessLoader;

beforeEach(() => {
  fixture = TestBed.createComponent(MyDialogButton);
  loader = TestbedHarnessEnvironment.loader(fixture);
  rootLoader = TestbedHarnessEnvironment.documentRootLoader(fixture);
});

it('loads harnesses', async () => {
  // Load a harness for the bootstrapped component with `harnessForFixture`
  dialogButtonHarness =
      await TestbedHarnessEnvironment.harnessForFixture(fixture, MyDialogButtonHarness);

  // The button element is inside the fixture's root element, so we use `loader`.
  const buttonHarness = await loader.getHarness(MyButtonHarness);

  // Click the button to open the dialog
  await buttonHarness.click();

  // The dialog is appended to `document.body`, outside of the fixture's root element,
  // so we use `rootLoader` in this case.
  const dialogHarness = await rootLoader.getHarness(MyDialogHarness);

  // ... make some assertions
});
```

`SeleniumWebDriverHarnessEnvironment` has an API that offers a single static method:

`SeleniumWebDriverHarnessEnvironment` 有一个提供单个静态方法的 API：

| Method | Description |
| ------ | ----------- |
| 方法 | 说明 |
| `loader(): HarnessLoader` | Gets a `HarnessLoader` instance for the current HTML document, rooted at the document's root element. |
| `loader(): HarnessLoader` | 获取 `HarnessLoader` 实例，该实例以该文档的根元素为根。 |

Since Selenium WebDriver does not deal with fixtures, the API in this environment is simpler. The
`HarnessLoader` returned by the `loader()` method should be sufficient for loading all necessary
`ComponentHarness` instances.

虽然 Selenium WebDriver 不知道怎么用夹具，但这个环境下的 API 比较简单。`loader()` 方法返回的 `HarnessLoader` 应足以加载所有必需的 `ComponentHarness` 实例。

Please note that harnesses may not behave _exactly_ the same in all environments. There will always
be some difference between the real browser-generated event sequence when a user clicks or types in
an element, versus the simulated event sequence generated in unit tests. Instead, the CDK makes a
best effort to normalize the behavior and simulate the most important events in the sequence.

请注意，在各种环境中，测试工具的行为可能并不*完全相同*。当用户点击或输入某个元素时，真正的浏览器生成的事件序列与单元测试中生成的模拟事件序列之间总有一些区别。不过，CDK 会尽最大努力规范其行为，并模拟序列中最重要的事件。

#### Creating harnesses with `HarnessLoader`

#### 使用 `HarnessLoader` 创建测试工具

Instances of this class correspond to a specific DOM element (the "root element" of the loader) and
are used to create `ComponentHarness` instances for elements under this root element.

该类的实例对应一个特定的 DOM 元素（此加载器的“根元素”），用于为该根元素下的元素创建 `ComponentHarness`。

`HarnessLoader` instances have the following methods:

`HarnessLoader` 实例有以下几种方法：

| Method | Description |
| ------ | ----------- |
| 方法 | 说明 |
| `getChildLoader(selector: string): Promise<HarnessLoader>` | Searches for an element matching the given selector below the root element of this `HarnessLoader`, and returns a new `HarnessLoader` rooted at the first matching element |
| `getChildLoader(selector: string): Promise<HarnessLoader>` | 在 `HarnessLoader` 的根元素下搜索匹配指定选择器的元素，并返回以第一个匹配元素为根的 `HarnessLoader` |
| `getAllChildLoaders(selector: string): Promise<HarnessLoader[]>` | Acts like `getChildLoader`, but returns an array of `HarnessLoader` instances, one for each matching element, rather than just the first matching element |
| `getAllChildLoaders(selector: string): Promise<HarnessLoader[]>` | 行为类似于 `getChildLoader`，但返回一个 HarnessLoader 实例数组，给每个匹配的元素一个实例，而不是只给第一个匹配的元素 |
| `getHarness<T extends ComponentHarness>(harnessType: ComponentHarnessConstructor<T> &verbar; HarnessPredicate<T>): Promise<T>` | Searches for an instance of the given `ComponentHarness` class or `HarnessPredicate` below the root element of this `HarnessLoader` and returns an instance of the harness corresponding to the first matching element |
| `getHarness<T extends ComponentHarness>(harnessType: ComponentHarnessConstructor<T> &verbar; HarnessPredicate<T>): Promise<T>` | 在 `HarnessLoader` 的根元素下面搜索指定的 `ComponentHarness` 或 `HarnessPredicate` 类的实例，并返回与第一个匹配元素对应的测试工具的实例 |
| `getAllHarnesses<T extends ComponentHarness>(harnessType: ComponentHarnessConstructor<T> &verbar; HarnessPredicate<T>): Promise<T[]>` | Acts like `getHarness`, but returns an array of harness instances, one for each matching element, rather than just the first matching element |
| `getAllHarnesses<T extends ComponentHarness>(harnessType: ComponentHarnessConstructor<T> &verbar; HarnessPredicate<T>): Promise<T[]>` | 行为类似于 `getHarness`，但会返回一个测试工具实例的数组，给每个匹配的元素一个实例，而不只是只给第一个匹配的元素 |

Calls to `getHarness` and `getAllHarnesses` can either take `ComponentHarness` subclass or a
`HarnessPredicate`. `HarnessPredicate` applies additional restrictions to the search (e.g. searching
for a button that has some particular text, etc). The
[details of `HarnessPredicate`](#filtering-harness-instances-with-harnesspredicate) are discussed in
the [API for component harness authors](#api-for-component-harness-authors); harness authors should
provide convenience methods on their `ComponentHarness` subclass to facilitate the creation of
`HarnessPredicate` instances. However, if the harness author's API is not sufficient, they can be
created manually.

调用 `getHarness` 和 `getAllHarnesses` 的参数可以是 `ComponentHarness` 的子类或 `HarnessPredicate`。`HarnessPredicate` 对搜索应用了额外的限制（比如搜索一些带有特定文本的按钮等）。[`HarnessPredicate`](#filtering-harness-instances-with-harnesspredicate) 的[详细信息](#filtering-harness-instances-with-harnesspredicate)在[组件工具作者](#api-for-component-harness-authors)的 API 部分讨论。组件工具的作者应该在 `ComponentHarness` 子类中提供了一些创建 `HarnessPredicate` 实例的便利方法。但是，如果测试工具作者提供的 API 不够用，你也可以手动创建它们。

#### Change detection

#### 变更检测

By default, test harnesses will run Angular's change detection before reading the state of a DOM
element and after interacting with a DOM element. While convenient in most cases, there may be times
that you need finer-grained control over change detection. For example, you may want to check the
state of a component while an async operation is pending. In these cases you can use the
`manualChangeDetection` function to disable automatic handling of change detection for a block of
code. For example:

默认情况下，测试工具会在读取 DOM 元素的状态之前和与 DOM 元素交互之后运行 Angular 变更检测。这虽然在大多数情况下很方便，但有时候你需要对变更检测进行更细粒度的控制。例如，你可能希望在异步操作挂起时检查某个组件的状态。在这些情况下，你可以使用 `manualChangeDetection` 函数来禁用对代码块的自动变更检测。例如：

```ts
it('checks state while async action is in progress', async () => {
  const buttonHarness = loader.getHarness(MyButtonHarness);
  await manualChangeDetection(async () => {
    await buttonHarness.click();
    fixture.detectChanges();
    // Check expectations while async click operation is in progress.
    expect(isProgressSpinnerVisible()).toBe(true);
    await fixture.whenStable();
    // Check expectations after async click operation complete.
    expect(isProgressSpinnerVisible()).toBe(false);
  });
});
```

#### Working with asynchronous component harness methods

#### 使用组件测试工具的异步方法

To support both unit and end-to-end tests, and to insulate tests against changes in
asynchronous behavior, almost all harness methods are asynchronous and return a `Promise`;
therefore, the Angular team recommends using
[ES2017 `async`/`await` syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)
to improve the test readability.

为了支持单元测试和端到端测试，并把测试与异步行为的变化隔离开来，测试工具几乎的所有方法都是异步的，并返回一个 `Promise`；因此，Angular 团队建议使用 [ES2017 的 `async` / `await` 语法](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)来提高测试的可读性。

Note that `await` statements block the execution of your test until the associated `Promise`
resolves. Occasionally, you may want to perform multiple actions simultaneously and wait until
they're all done rather than performing each action sequentially. For example, reading multiple
properties off a single component. In these situations use the `parallel` function to parallelize
the operations. The parallel function works similarly to `Promise.all`, while also optimizing change
detection, so it is not run an excessive number of times. The following code demonstrates how you
can read multiple properties from a harness with `parallel`:

注意，`await` 语句会阻塞测试的执行，直到相关的 `Promise` 被解析为止。有时，你可能希望同时执行多个动作，并等待它们全部完成，而不是按顺序执行每个动作。例如，从单个组件中读取多个属性。在这种情况下，请使用 `parallel` 函数来并行处理这些操作。parallel 函数与 `Promise.all` 工作方式类似，但同时优化了变更检测，因此它的运行次数不会太多。以下代码演示如何通过 `parallel` 从测试工具中读取多个属性：

```ts
it('reads properties in parallel', async () => {
  const checkboxHarness = loader.getHarness(MyCheckboxHarness);
  // Read the checked and intermediate properties simultaneously.
  const [checked, indeterminate] = await parallel(() => [
    checkboxHarness.isChecked(),
    checkboxHarness.isIndeterminate()
  ]);
  expect(checked).toBe(false);
  expect(indeterminate).toBe(true);
});
```

### API for component harness authors

### 组件测试工具作者的 API

Component harness authors are developers who maintain some reusable Angular component, and want to
create a test harness for it, that users of the component can use in their tests. For example, this
could be an author of a third party Angular component library or a developer who maintains a set of
common components for a large Angular application.

组件测试工具作者是那些需要维护一些可复用的 Angular 组件并希望为它创建一个测试工具的开发人员，组件用户可以在测试中使用它。
例如，可能是第三方 Angular 组件库的作者，也可能是为大型 Angular 应用维护一组通用组件的开发人员。

#### Extending `ComponentHarness`

#### 扩展 `ComponentHarness`

The abstract `ComponentHarness` class is the base class for all component harnesses. To create a
custom component harness, extend `ComponentHarness` and implement the static property
`hostSelector`. The `hostSelector` property identifies elements in the DOM that match this harness
subclass. In most cases, the `hostSelector` should be the same as the `selector` of the corresponding
`Component` or `Directive`. For example, consider a simple popup component:

抽象类 `ComponentHarness` 是所有组件测试工具的基类。要创建自定义组件测试工具，请扩展 `ComponentHarness` 并实现其静态属性 `hostSelector`。`hostSelector` 属性用于标识 DOM 中与该测试工具子类相匹配的元素。在大多数情况下，`hostSelector` 应该与相应的 `Component` 或 `Directive` 的 `selector` 相同。例如，考虑一个简单的弹出框组件：

```ts
@Component({
  selector: 'my-popup',
  template: `
    <button (click)="toggle()">{{triggerText}}</button>
    <div *ngIf="open" class="my-popup-content"><ng-content></ng-content></div>
  `
})
class MyPopup {
  @Input() triggerText: string;

  open = false;

  toggle() {
    this.open = !this.open;
  }
}
```

In this case, a minimal harness for the component would look like the following:

在这种情况下，该组件的最简测试工具如下所示：

```ts
class MyPopupHarness extends ComponentHarness {
  static hostSelector = 'my-popup';
}
```

While `ComponentHarness` subclasses require only the `hostSelector` property, most harnesses should
also implement a static `with` method to generate `HarnessPredicate` instances. The
[`HarnessPredicate`](#filtering-harness-instances-with-harnesspredicate) section below covers this
in more detail.

虽然 `ComponentHarness` 子类只需要 `hostSelector` 属性，但大多数测试工具还应该使用静态方法 `with` 来生成 `HarnessPredicate` 实例。下面的 [`HarnessPredicate`](#filtering-harness-instances-with-harnesspredicate) 部分会更详细介绍这一点。

#### Finding elements in the component's DOM

#### 在组件的 DOM 中查找元素

Each instance of a `ComponentHarness` subclass represents a particular instance of the
corresponding component. You can access the component's host element via the `host` method from
the `ComponentHarness` base class.

`ComponentHarness` 子类的每个实例都表示相应组件的一个特定实例。你可以用 `ComponentHarness` 类的 `host` 方法访问组件的宿主元素。

`ComponentHarness` additionally offers several methods for locating elements within the component's
DOM. These methods are `locatorFor`, `locatorForOptional`, and `locatorForAll`.
Note, though, that these methods do not directly find elements. Instead, they _create functions_
that find elements. This approach safeguards against caching references to out-of-date elements. For
example, when an `ngIf` hides and then shows an element, the result is a new DOM element; using
functions ensures that tests always reference the current state of the DOM.

`ComponentHarness` 还提供了几种在组件 DOM 中定位元素的方法。它们是 `locatorFor`、`locatorForOptional` 和 `locatorForAll`。但请注意，这些方法并不直接查找元素，而是会*创建*能寻找元素的函数。这种方式可以防止缓存对过时元素的引用。例如，当一个 `ngIf` 先隐藏再显示一个元素时，其结果是一个新的 DOM 元素；使用函数可以确保测试总能引用 DOM 的当前状态。

| Method | Description |
| ------ | ----------- |
| 方法 | 说明 |
| `host(): Promise<TestElement>` | Returns a `Promise` for the host element of the corresponding component instance. |
| `host(): Promise<TestElement>` | 返回相应组件实例的宿主元素的 `Promise` |
| `locatorFor(selector: string): () => Promise<TestElement>` | Creates a function that returns a `Promise` for the first element matching the given selector when called. If no matching element is found, the `Promise` rejects. |
| `locatorFor(selector: string): () => Promise<TestElement>` | 创建一个函数，该函数在被调用时会返回与指定选择器匹配的第一个元素的 `Promise`。如果找不到匹配的元素，`Promise` 就会拒绝。 |
| `locatorForOptional(selector: string): () => Promise<TestElement &verbar; null>` | Creates a function that returns a `Promise` for the first element matching the given selector when called. If no matching element is found, the `Promise` is resolved with `null`. |
| `locatorForOptional(selector: string): () => Promise<TestElement &verbar; null>` | 创建一个函数，该函数在被调用时会返回与指定选择器匹配的第一个元素的 `Promise`。如果找不到匹配的元素，则会解析成携带 `null` 的 `Promise`。 |
| `locatorForAll(selector: string): () => Promise<TestElement[]>` | Creates a function that returns a `Promise` for a list of all elements matching the given selector when called. |
| `locatorForAll(selector: string): () => Promise<TestElement[]>` | 创建一个函数，它返回一个 `Promise` 以便在调用时返回与指定选择器匹配的所有元素的列表。 |

For example, the `MyPopupHarness` class discussed above could provide methods to get the trigger
and content elements as follows:

例如，`MyPopupHarness` 类可以提供获取触发器和内容元素的方法，如下所示：

```ts
class MyPopupHarness extends ComponentHarness {
  static hostSelector = 'my-popup';

  /** Gets the trigger element */
  getTriggerElement = this.locatorFor('button');

  /** Gets the content element. */
  getContentElement = this.locatorForOptional('.my-popup-content');
}
```

#### Working with `TestElement` instances

#### 使用 `TestElement` 实例

The functions created with the locator methods described above all return `TestElement` instances.
`TestElement` offers a number of methods to interact with the underlying DOM:

使用上述定位器方法创建的函数都返回了 `TestElement` 实例。`TestElement` 提供了许多与底层 DOM 交互的方法：

| Method | Description |
| ------ | ----------- |
| 方法 | 说明 |
| `blur(): Promise<void>` | Blurs the element. |
| `blur(): Promise<void>` | 让此元素失焦。 |
| `clear(): Promise<void>` | Clears the text in the element (intended for `<input>` and `<textarea>` only). |
| `clear(): Promise<void>` | 清除此元素中的文本（仅适用于 `<input>` 和 `<textarea>` ）。 |
| `click(relativeX?: number, relativeY?: number): Promise<void>` | Clicks the element (at the given position relative to the element's top-left corner). |
| `click(relativeX?: number, relativeY?: number): Promise<void>` | 单击此元素（相对于此元素左上角的指定位置）。 |
| `focus(): Promise<void>` | Focuses the element. |
| `focus(): Promise<void>` | 让此元素获得焦点。 |
| `getCssValue(property: string): Promise<string>` | Gets the computed value of the given CSS property for the element. |
| `getCssValue(property: string): Promise<string>` | 获取此元素指定 CSS 属性的计算值。 |
| `hover(): Promise<void>` | Hovers over the element. |
| `hover(): Promise<void>` | 悬停在此元素上方。 |
| `sendKeys(modifiers?: ModifierKeys, ...keys: (string &verbar; TestKey)[]): Promise<void>` | Sends the given list of key presses to the element (with optional modifier keys). |
| `sendKeys(modifiers?: ModifierKeys, ...keys: (string &verbar; TestKey)[]): Promise<void>` | 给此元素发送指定的按键列表（可以带修饰键）。 |
| `text(): Promise<string>` | Gets the text content of the element |
| `text(): Promise<string>` | 获取此元素的文本内容 |
| `getAttribute(name: string): Promise<string &verbar; null>` | Gets the value of the given HTML attribute for the element. |
| `getAttribute(name: string): Promise<string &verbar; null>` | 从此元素获取指定的 HTML 属性的值。 |
| `hasClass(name: string): Promise<boolean>` | Checks whether the element has the given class applied. |
| `hasClass(name: string): Promise<boolean>` | 检查此元素是否已应用了指定的类。 |
| `getDimensions(): Promise<ElementDimensions>` | Gets the dimensions of the element. |
| `getDimensions(): Promise<ElementDimensions>` | 获取此元素的尺寸。 |
| `getProperty(name: string): Promise<any>` | Gets the value of the given JS property for the element. |
| `getProperty(name: string): Promise<any>` | 从此元素获取指定的 JS 属性的值。 |
| `matchesSelector(selector: string): Promise<boolean>` | Checks whether the element matches the given CSS selector. |
| `matchesSelector(selector: string): Promise<boolean>` | 检查此元素是否与指定的 CSS 选择器匹配。 |
| `setInputValue(value: string): Promise<void>;` | Sets the value of a property of an input. |
| `setInputValue(value: string): Promise<void>;` | 设置输入属性的值。 |
| `selectOptions(...optionIndexes: number[]): Promise<void>;` | Selects the options at the specified indexes inside of a native `select` element. |
| `selectOptions(...optionIndexes: number[]): Promise<void>;` | 在原生 `select` 元素中指定索引处的候选项。 |
| `dispatchEvent(name: string, data?: Record<string, EventData>): Promise<void>;` | Dispatches an event with a particular name. |
| `dispatchEvent(name: string, data?: Record<string, EventData>): Promise<void>;` | 派发具有特定名称的事件。 |

`TestElement` is an abstraction designed to work across different test environments (Karma,
Selenium WebDriver, etc). When using harnesses, you should perform all DOM interaction via this interface.
Other means of accessing DOM elements (e.g. `document.querySelector`) will not work in all test
environments.

`TestElement` 是一种抽象设计，适用于不同的测试环境（Karma，Selenium WebDriver 等）。在使用测试工具时，你应该通过这个接口来进行所有的 DOM 交互。其他访问 DOM 元素的方法（例如 `document.querySelector` ）并不适用于所有的测试环境。

As a best practice, you should not expose `TestElement` instances to users of a harness
unless its an element the component consumer defines directly (e.g. the host element). Exposing
`TestElement` instances for internal elements leads users to depend on a component's internal DOM
structure.

最好的做法是，你不应该把 `TestElement` 实例公开给测试工具的用户，除非它是由组件消费者直接定义的元素（比如宿主元素）。公开 `TestElement` 实例会让用户依赖组件的内部 DOM 结构。

Instead, provide more narrow-focused methods for particular actions the end-user will
take or particular state they may want to check. For example, `MyPopupHarness` could provide methods
like `toggle` and `isOpen`:

相反，要为最终用户可能执行的操作或可能要检查的状态提供更加专用的方法。例如，`MyPopupHarness` 可以提供像 `toggle` 和 `isOpen` 之类的方法：

```ts
class MyPopupHarness extends ComponentHarness {
  static hostSelector = 'my-popup';

  protected getTriggerElement = this.locatorFor('button');
  protected getContentElement = this.locatorForOptional('.my-popup-content');

  /** Toggles the open state of the popup. */
  async toggle() {
    const trigger = await this.getTriggerElement();
    return trigger.click();
  }

  /** Checks if the popup us open. */
  async isOpen() {
    const content = await this.getContentElement();
    return !!content;
  }
}
```

#### Loading harnesses for subcomponents

#### 为子组件加载测试工具

Larger components often compose smaller components. You can reflect this structure in a
component's harness as well. Each of the `locatorFor` methods on `ComponentHarness` discussed
earlier has an alternate signature that can be used for locating sub-harnesses rather than elements.

较大的组件通常是由较小的组件组合而成的。你也可以在组件测试工具中反映出这种结构。`ComponentHarness` 上的每个 `locatorFor` 族方法都有一个备用签名，可以用来定位子级测试工具而不是元素。

| Method | Description |
| ------ | ----------- |
| 方法 | 说明 |
| `locatorFor<T extends ComponentHarness>(harnessType: ComponentHarnessConstructor<T>): () => Promise<T>` | Creates a function that returns a `Promise` for the first harness matching the given harness type when called. If no matching harness is found, the `Promise` rejects. |
| `locatorFor<T extends ComponentHarness>(harnessType: ComponentHarnessConstructor<T>): () => Promise<T>` | 创建一个函数，该函数在被调用时返回第一个匹配指定测试工具类型的测试工具的 `Promise`；如果找不到匹配的测试工具，`Promise` 就会拒绝。 |
| `locatorForOptional<T extends ComponentHarness>(harnessType: ComponentHarnessConstructor<T>): () => Promise<T &verbar; null>` | Creates a function that returns a `Promise` for the first harness matching the given harness type when called. If no matching harness is found, the `Promise` is resolved with `null`. |
| `locatorForOptional<T extends ComponentHarness>(harnessType: ComponentHarnessConstructor<T>): () => Promise<T &verbar; null>` | 创建一个函数，该函数在被调用时返回第一个匹配指定测试工具类型的测试工具的 `Promise`；如果找不到匹配的工具，就会解析成携带 `null` 的 `Promise`。 |
| `locatorForAll<T extends ComponentHarness>(harnessType: ComponentHarnessConstructor<T>): () => Promise<T[]>` | Creates a function that returns a `Promise` for a list of all harnesses matching the given harness type when called. |
| `locatorForAll<T extends ComponentHarness>(harnessType: ComponentHarnessConstructor<T>): () => Promise<T[]>` | 创建一个函数，该函数在被调用时返回一个 `Promise`，携带匹配到指定测试工具类型的所有测试工具列表。 |

For example, consider a menu build using the popup shown above:

例如，考虑使用上面演示过的弹出菜单来构建菜单：

```ts
@Component({
  selector: 'my-menu',
  template: `
    <my-popup>
      <ng-content></ng-content>
    </my-popup>
  `
})
class MyMenu {
  @Input() triggerText: string;

  @ContentChildren(MyMenuItem) items: QueryList<MyMenuItem>;
}

@Directive({
  selector: 'my-menu-item'
})
class MyMenuItem {}
```

The harness for `MyMenu` can then take advantage of other harnesses for `MyPopup` and `MyMenuItem`:

`MyMenu` 的测试工具就可以利用 `MyPopup` 和 `MyMenuItem` 的其他测试工具：

```ts
class MyMenuHarness extends ComponentHarness {
  static hostSelector = 'my-menu';

  protected getPopupHarness = this.locatorFor(MyPopupHarness);

  /** Gets the currently shown menu items (empty list if menu is closed). */
  getItems = this.locatorForAll(MyMenuItemHarness);

  /** Toggles open state of the menu. */
  async toggle() {
    const popupHarness = await this.getPopupHarness();
    return popupHarness.toggle();
  }
}

class MyMenuItemHarness extends ComponentHarness {
  static hostSelector = 'my-menu-item';
}
```

#### Filtering harness instances with `HarnessPredicate`

#### 使用 `HarnessPredicate` 过滤测试工具实例

When a page contains multiple instances of a particular component, you may want to filter based on
some property of the component to get a particular component instance. For example, you may want
a button with some specific text, or a menu with a specific ID. The `HarnessPredicate`
class can capture criteria like this for a `ComponentHarness` subclass. While the
test author is able to construct `HarnessPredicate` instances manually, it's easier when the
`ComponentHarness` subclass provides a helper method to construct predicates for common filters.

当一个页面包含特定组件的多个实例时，你可能需要根据该组件的某些属性进行过滤，以得到一个特定的组件实例。例如，你可能想要一个带有特定文本的按钮，或一个带有特定 ID 的菜单。`HarnessPredicate` 可以为 `ComponentHarness` 的子类按一定的标准捕获它们。虽然测试作者也能手动构建 `HarnessPredicate` 实例，但 `ComponentHarness` 子类提供了一个辅助方法来为常用的过滤器构造谓词，这更容易。

The recommended approach to providing this helper is to create a static `with` method on each
`ComponentHarness` subclass that returns a `HarnessPredicate` for that class. This allows test
authors to write easily understandable code, e.g.
`loader.getHarness(MyMenuHarness.with({selector: '#menu1'}))`. In addition to the standard
`selector` and `ancestor` options, the `with` method should add any other options that make sense
for the particular subclass.

建议在每个 `ComponentHarness` 子类的 `with` 方法中提供这个辅助方法，它返回该类的 `HarnessPredicate`。这让测试作者可以编写易于理解的代码，例如 `loader.getHarness(MyMenuHarness.with({selector: '#menu1'}))`。除了标准的 `selector` 和 `ancestor` 选项之外，`with` 方法还应该添加对特定的子类有意义的其他选项。

Harnesses that need to add additional options should extend the `BaseHarnessFilters` interface and
additional optional properties as needed. `HarnessPredicate` provides several convenience methods
for adding options.

需要添加其他选项的测试工具应该根据需要扩展 `BaseHarnessFilters` 接口和其它可选属性。`HarnessPredicate` 为添加选项提供了一些便利方法。

| Method | Description |
| ------ | ----------- |
| 方法 | 说明 |
| `static stringMatches(s: string &verbar; Promise<string>, pattern: string &verbar; RegExp): Promise<boolean>` | Compares a string or `Promise` of a string against a `string` or `RegExp` and returns a boolean `Promise` indicating whether it matches. |
| `static stringMatches(s: string &verbar; Promise<string>, pattern: string &verbar; RegExp): Promise<boolean>` | 按照 `string` 或 `RegExp` 类型的模式比较字符串或字符串的 `Promise`，并返回一个表明它是否匹配 `Promise` |
| `addOption<O>(name: string, option: O &verbar; undefined, predicate: (harness: T, option: O) => Promise<boolean>): HarnessPredicate<T>` | Creates a new `HarnessPredicate` that enforces all of the conditions of the current one, plus the new constraint specified by the `predicate` parameter. If the `option` parameter is `undefined` the `predicate` is considered to be always true. |
| `addOption<O>(name: string, option: O &verbar; undefined, predicate: (harness: T, option: O) => Promise<boolean>): HarnessPredicate<T>` | 创建一个新的 `HarnessPredicate` 来强制执行当前的所有条件，再加上 `predicate` 参数指定的新约束条件。如果 `option` 参数为 `undefined`，此 `predicate` 总是返回 true。 |
| `add(description: string, predicate: (harness: T) => Promise<boolean>): HarnessPredicate<T>` | Creates a new `HarnessPredicate` that enforces all of the conditions of the current one, plus the new constraint specified by the `predicate` parameter. |
| `add(description: string, predicate: (harness: T) => Promise<boolean>): HarnessPredicate<T>` | 创建一个新的 `HarnessPredicate` 来强制执行当前的所有条件，再加上 `predicate` 参数指定的新约束条件。 |

For example, when working with a menu it would likely be useful to add a way to filter based on
trigger text and to filter menu items based on their text:

例如，当使用菜单时，根据触发器文本添加一种过滤方式并根据文本来过滤菜单项会很有用：

```ts
interface MyMenuHarnessFilters extends BaseHarnessFilters {
  /** Filters based on the trigger text for the menu. */
  triggerText?: string | RegExp;
}

interface MyMenuItemHarnessFilters extends BaseHarnessFilters {
  /** Filters based on the text of the menu item. */
  text?: string | RegExp;
}

class MyMenuHarness extends ComponentHarness {
  static hostSelector = 'my-menu';

  /** Creates a `HarnessPredicate` used to locate a particular `MyMenuHarness`. */
  static with(options: MyMenuHarnessFilters): HarnessPredicate<MyMenuHarness> {
    return new HarnessPredicate(MyMenuHarness, options)
        .addOption('trigger text', options.triggerText,
            (harness, text) => HarnessPredicate.stringMatches(harness.getTriggerText(), text));
  }

  protected getPopupHarness = this.locatorFor(MyPopupHarness);

  /** Gets the text of the menu trigger. */
  async getTriggerText(): Promise<string> {
    const popupHarness = await this.getPopupHarness();
    return popupHarness.getTriggerText();
  }

  ...
}

class MyMenuItemHarness extends ComponentHarness {
  static hostSelector = 'my-menu-item';

  /** Creates a `HarnessPredicate` used to locate a particular `MyMenuItemHarness`. */
  static with(options: MyMenuItemHarnessFilters): HarnessPredicate<MyMenuItemHarness> {
    return new HarnessPredicate(MyMenuItemHarness, options)
        .addOption('text', options.text,
            (harness, text) => HarnessPredicate.stringMatches(harness.getText(), text));
  }

  /** Gets the text of the menu item. */
  async getText(): Promise<string> {
    const host = await this.host();
    return host.text();
  }
}
```

You can pass a `HarnessPredicate` in place of a `ComponentHarness` class to any of the APIs on
`HarnessLoader`, `LocatorFactory`, or `ComponentHarness`. This allows test authors to easily target
a particular component instance when creating a harness instance. It also allows the harness author
to leverage the same `HarnessPredicate` to enable more powerful APIs on their harness class. For
example, consider the `getItems` method on the `MyMenuHarness` shown above.
This can now easily be expanded to allow users of the harness to search for particular menu items:

你可以用 `HarnessPredicate` 代替 `ComponentHarness` 传给 `HarnessLoader`、`LocatorFactory` 或 `ComponentHarness` 上的任何 API。这样，测试作者就可以在创建测试工具实例时轻松定位到特定的组件实例。它还能让测试工具的作者利用同样的 `HarnessPredicate`，在他们的测试工具类上支持更强大的 API。例如前面看过的 `MyMenuHarness` 的 `getItems` 方法。现在可以很容易地扩展它以允许本测试工具的用户搜索特定的菜单项：

```ts
class MyMenuHarness extends ComponentHarness {
  static hostSelector = 'my-menu';

  /** Gets a list of items in the menu, optionally filtered based on the given criteria. */
  async getItems(filters: MyMenuItemHarnessFilters = {}): Promise<MyMenuItemHarness[]> {
    const getFilteredItems = this.locatorForAll(MyMenuItemHarness.with(filters));
    return getFilteredItems();
  }

  ...
}
```

#### Creating a `HarnessLoader` for an element

#### 为元素创建一个 `HarnessLoader`

Some components use `<ng-content>` to project additional content into the component's template. When
creating a harness for such a component, you can give the harness user a `HarnessLoader` instance
scoped to the element containing the `<ng-content>`. This allows the user of the harness to load
additional harnesses for whatever components were passed in as content. `ComponentHarness` has
several APIs that can be used to create `HarnessLoader` instances for cases like this.

有些组件会使用 `<ng-content>` 把其他内容投影到组件的模板中。当为这样的组件创建一个测试工具时，你可以给这个测试工具用户提供一个 `<ng-content>` 容器范围内的 `HarnessLoader` 实例。这可以让测试工具的用户能够为任何作为内容传进来的组件加载额外的测试工具。`ComponentHarness` 有几个 API 可以用来为这种情况创建 `HarnessLoader` 实例。

| Method | Description |
| ------ | ----------- |
| 方法 | 说明 |
| `harnessLoaderFor(selector: string): Promise<HarnessLoader>` | Gets a `Promise` for a `HarnessLoader` rooted at the first element matching the given selector, if no element is found the `Promise` rejects. |
| `harnessLoaderFor(selector: string): Promise<HarnessLoader>` | 获取一个 `Promise`，它解析为以指定的选择器相匹配的第一个元素为根的 `HarnessLoader`；如果没有找到此组件，则 `Promise` 会拒绝。 |
| `harnessLoaderForOptional(selector: string): Promise<HarnessLoader &verbar; null>` | Gets a `Promise` for a `HarnessLoader` rooted at the first element matching the given selector, if no element is found the `Promise` resolves to `null`. |
| `harnessLoaderForOptional(selector: string): Promise<HarnessLoader &verbar; null>` | 获取一个 `Promise`，它解析为与指定选择器匹配的第一个元素，如果没有找到此元素，则 `Promise` 会解析为 `null`。 |
| `harnessLoaderForAll(selector: string): Promise<HarnessLoader[]>` | Gets a `Promise` for a list of `HarnessLoader`, one rooted at each element matching the given selector. |
| `harnessLoaderForAll(selector: string): Promise<HarnessLoader[]>` | 获取一个 `Promise`，它是一个以和指定选择器匹配的每个元素为根的 `HarnessLoader` 列表 |

The `MyPopup` component discussed earlier is a good example of a component with arbitrary content
that users may want to load harnesses for. `MyPopupHarness` could add support for this by
extending `ContentContainerComponentHarness`.

前面讨论过的 `MyPopup` 组件就是一个很好的例子，它包含了一些用户可能希望为其加载测试工具的内容。
`MyPopupHarness` 可以通过扩展 `ContentContainerComponentHarness` 来为此添加支持。

```ts
class MyPopupHarness extends ContentContainerComponentHarness<string> {
  static hostSelector = 'my-popup';
}
```

#### Accessing elements outside of the component's host element

#### 访问该组件的宿主元素之外的元素

There are times when a component harness might need to access elements outside of its corresponding
component's host element. Components that use [CDK overlay](https://material.angular.io/cdk/overlay/overview) serve as examples of this. The CDK overlay creates an element that is attached directly to the body, outside of the component's host element. In this case,
`ComponentHarness` provides a method that can be used to get a `LocatorFactory` for the root element
of the document. The `LocatorFactory` supports most of the same APIs as the `ComponentHarness` base
class, and can then be used to query relative to the document's root element.

有时组件工具可能需要访问相应组件的宿主元素之外的元素。那些使用 [CDK 浮层](https://material.angular.cn/cdk/overlay/overview)的组件就是这样的例子。
组件的宿主元素外面的 CDK 浮层会创建一个直接附着在 body 上的元素。在这个例子中，`ComponentHarness` 提供了一个方法，可以用来获取根元素的 `LocatorFactory`。
此 `LocatorFactory` 支持大多数与 `ComponentHarness` 基类相同的 API，然后可以用来相对于该文档的根元素进行查询。

| Method | Description |
| ------ | ----------- |
| 方法 | 说明 |
| `documentRootLocatorFactory(): LocatorFactory` | Creates a `LocatorFactory` rooted at the document's root element. |
| `documentRootLocatorFactory(): LocatorFactory` | 创建一个以该文档的根元素为根的 `LocatorFactory`。 |

Consider if the `MyPopup` component above used the CDK overlay for the popup content, rather than an
element in its own template. In this case, `MyPopupHarness` would have to access the content element
via `documentRootLocatorFactory()`:

假设 `MyPopup` 组件使用了 CDK 浮层作为弹出内容，而不是它自己模板中的一个元素。在这种情况下，`MyPopupHarness` 可能必须通过 `documentRootLocatorFactory()` 访问其内容元素：

```ts
class MyPopupHarness extends ComponentHarness {
  static hostSelector = 'my-popup';

  /** Gets a `HarnessLoader` whose root element is the popup's content element. */
  async getHarnessLoaderForContent(): Promise<HarnessLoader> {
    const rootLocator = this.documentRootLocatorFactory();
    return rootLocator.harnessLoaderFor('my-popup-content');
  }
}
```

#### Waiting for asynchronous tasks

#### 等待异步任务

The methods on `TestElement` automatically trigger Angular's change detection and wait for tasks
inside the `NgZone`, so in most cases no special effort is required for harness authors to wait on
asynchronous tasks. However, there are some edge cases where this may not be sufficient.

`TestElement` 上的方法会自动触发 Angular 的变更检测，并等待 `NgZone` 中的任务，所以在大多数情况下，这些方法不需要特别的工作来让线程作者等待异步任务。
然而，在一些边缘情况下这可能还不够。

Under some circumstances, Angular animations may require a second cycle of change detection and
subsequent `NgZone` stabilization before animation events are fully flushed. In cases where this is
needed, the `ComponentHarness` offers a `forceStabilize()` method that can be called to do the
second round.

在某些情况下，在完全刷新动画事件之前，Angular 动画可能还需要第二个变更检测循环和等待 `NgZone` 进入稳定状态。
如果需要这样做，`ComponentHarness` 提供了一个 `forceStabilize()` 方法，可以调用它来进行第二轮测试。

Additionally, some components may intentionally schedule tasks *outside* of `NgZone`, this is
typically accomplished by using `NgZone.runOutsideAngular`. In this case, the corresponding harness
may need to explicitly wait for tasks outside `NgZone`, as this does not happen automatically.
`ComponentHarness` offers a method called `waitForTasksOutsideAngular` for this purpose.

另外，某些组件可能会故意在 `NgZone` *之外*安排任务，这通常是使用 `NgZone.runOutsideAngular` 完成的。
在这种情况下，对应的测试工具可能需要显式等待 `NgZone` 以外的任务，因为这不会自动发生。
`ComponentHarness` 为此提供了一个名为 `waitForTasksOutsideAngular` 的方法。

| Method | Description |
| ------ | ----------- |
| 方法 | 说明 |
| `forceStabilize(): Promise<void>` | Explicitly runs a round of change detection in Angular and waits for `NgZone` to stabilize. |
| `forceStabilize(): Promise<void>` | 在 Angular 中显式运行一轮变更检测，并等待 `NgZone` 稳定下来。 |
| `waitForTasksOutsideAngular(): Promise<void>` | Waits for tasks scheduled outside of `NgZone` to complete. |
| `waitForTasksOutsideAngular(): Promise<void>` | 等待 `NgZone` 以外的任务完成。 |

### API for harness environment authors

### 测试工具环境作者的 API

Harness environment authors are developers who want to add support for using component harnesses in
additional testing environments. Out-of-the-box, Angular CDK's component harnesses can be used in
Selenium WebDriver E2E tests and Karma unit tests. Developers can support additional environments by
creating custom implementations of `TestElement` and `HarnessEnvironment`.

测试工具环境作者是那些希望在其他测试环境中增加使用组件测试工具支持的开发人员。开箱即用的 Angular CDK 组件测试工具可用于 Selenium WebDriver E2E 测试和 Karma 单元测试。开发人员可以创建 `TestElement` 和 `HarnessEnvironment` 的自定义实现来支持更多环境。

#### Creating a `TestElement` implementation for the environment

#### 为此环境创建一个 `TestElement`

The first step in adding support for a new testing environment is to create a `TestElement`
implementation. The `TestElement` interface serves as an environment-agnostic representation of a
DOM element; it lets harnesses interact with DOM elements regardless of the underlying environment.
Because some environments don't support interacting with DOM elements synchronously
(e.g. WebDriver), all of the `TestElement` methods are asynchronous, returning a `Promise` with the
result of the operation.

添加对新测试环境的支持的第一步是创建一个 `TestElement` 实现。`TestElement` 接口用作 DOM 元素的环境无关表示形式。它能让测试工具与 DOM 元素进行交互，而不用管底层环境如何。由于某些环境不支持与 DOM 元素的同步交互（比如 webdriver），因此所有的 `TestElement` 方法都是异步的，返回一个包含该操作结果的 `Promise`

| Method | Description |
| ------ | ----------- |
| 方法 | 说明 |
| `blur(): Promise<void>` | Blurs the element. |
| `blur(): Promise<void>` | 让此元素失焦。 |
| `clear(): Promise<void>` | Clears the text from an element (only applies for `<input>` and `<textarea>`). |
| `clear(): Promise<void>` | 从此元素中清除文本（仅适用于 `<input>` 和 `<textarea>` ）。 |
| `click(relativeX?: number, relativeY?: number): Promise<void>` | Clicks an element at a point relative to it's top-left corner. |
| `click(relativeX?: number, relativeY?: number): Promise<void>` | 在相对于它左上角的坐标点击此元素。 |
| `focus(): Promise<void>` | Focuses the element. |
| `focus(): Promise<void>` | 让此元素获得焦点。 |
| `getCssValue(property: string): Promise<string>` | Gets the computed CSS value of the given property for the element. |
| `getCssValue(property: string): Promise<string>` | 获取此元素指定属性的计算 CSS 值。 |
| `hover(): Promise<void>` | Hovers the mouse over the element. |
| `hover(): Promise<void>` | 将鼠标悬停在此元素上方。 |
| `sendKeys(...keys: (string &verbar; TestKey)[]): Promise<void>` | Sends a sequence of key events to the element. |
| `sendKeys(...keys: (string &verbar; TestKey)[]): Promise<void>` | 向此元素发送一系列按键事件。 |
| `sendKeys(modifiers: ModifierKeys, ...keys: (string &verbar; TestKey)[]): Promise<void>` | Sends a sequence of key events to the element, while holding a set of modifier keys. |
| `sendKeys(modifiers: ModifierKeys, ...keys: (string &verbar; TestKey)[]): Promise<void>` | 把一系列按键事件发送给此元素，同时按住一组修饰键。 |
| `text(): Promise<string>` | Gets the text content of the element. |
| `text(): Promise<string>` | 获取此元素的文本内容。 |
| `getAttribute(name: string): Promise<string &verbar; null>` | Gets the value of the given HTML attribute for the element. |
| `getAttribute(name: string): Promise<string &verbar; null>` | 从此元素获取指定 HTML 属性的值。 |
| `hasClass(name: string): Promise<boolean>` | Checks whether the element has the given class. |
| `hasClass(name: string): Promise<boolean>` | 检查此元素是否具有指定的类。 |
| `getDimensions(): Promise<ElementDimensions>` | Gets the dimensions of the element. |
| `getDimensions(): Promise<ElementDimensions>` | 获取此元素的尺寸。 |
| `getProperty(name: string): Promise<any>` | Gets the value of the given property for the element. |
| `getProperty(name: string): Promise<any>` | 从此元素获取指定属性的值。 |
| `matchesSelector(selector: string): Promise<boolean>` | Checks whether the given selector matches the element. |
| `matchesSelector(selector: string): Promise<boolean>` | 检查指定的选择器是否与此元素匹配。 |
| `setInputValue(value: string): Promise<void>;` | Sets the value of a property of an input. |
| `setInputValue(value: string): Promise<void>;` | 设置输入框的值。 |
| `selectOptions(...optionIndexes: number[]): Promise<void>;` | Selects the options at the specified indexes inside of a native `select` element. |
| `selectOptions(...optionIndexes: number[]): Promise<void>;` | 选择原生 `select` 元素中指定索引处的候选项。 |
| `dispatchEvent(name: string, data?: Record<string, EventData>): Promise<void>;` | Dispatches an event with a particular name. |
| `dispatchEvent(name: string, data?: Record<string, EventData>): Promise<void>;` | 派发具有特定名称的事件。 |

The `TestElement` interface consists largely of methods that resemble methods
available on `HTMLElement`; similar methods exist in most test environments, which makes
implementing the methods fairly straightforward. However, one important difference to note when
implementing the `sendKeys` method, is that the key codes in the `TestKey`
enum likely differ from the key codes used in the test environment. Environment authors should
maintain a mapping from `TestKey` codes to the codes used in the particular testing environment.

`TestElement` 接口包含类似 `HTMLElement` 方法的大部分方法。在大多数测试环境中都存在类似的方法，这使得实现这些方法相当简单。使用 `sendKeys` 方法时要注意的一个重要区别是，`TestKey` 枚举中的键码可能与测试环境中使用的键码有所不同。环境作者应该坚持从 `TestKey` 代码映射到特定测试环境中的代码。

The
[`UnitTestElement`](https://github.com/angular/components/blob/main/src/cdk/testing/testbed/unit-test-element.ts#L57)
and
[`SeleniumWebDriverElement`](https://github.com/angular/components/blob/main/src/cdk/testing/selenium-webdriver/selenium-web-driver-element.ts#L22)
implementations in Angular CDK serve as good examples of implementations of this interface.

Angular CDK 中的 [`UnitTestElement`](https://github.com/angular/components/blob/main/src/cdk/testing/testbed/unit-test-element.ts#L57) 和 [`SeleniumWebDriverElement`](https://github.com/angular/components/blob/main/src/cdk/testing/selenium-webdriver/selenium-web-driver-element.ts#L22) 实现就是实现这个接口的好例子。

#### Creating a `HarnessEnvironment` implementation for the environment

#### 为此环境创建一个 `HarnessEnvironment`

Test authors use `HarnessEnvironment` to create component harness instances for use in tests.

测试作者使用 `HarnessEnvironemnt` 来创建用于测试的组件工具实例。

`HarnessEnvironment` is an abstract class that must be extended to create a concrete subclass for
the new environment. When supporting a new test environment, you must create a `HarnessEnvironment`
subclass that adds concrete implementations for all abstract members.

`HarnessEnvironment` 是一个抽象类，必须进行扩展才能为新环境创建一个具体的子类。在支持新的测试环境时，你必须创建一个 `HarnessEnvironment` 子类，为所有抽象成员添加具体的实现。

You will notice that `HarnessEnvironment` has a generic type parameter: `HarnessEnvironment<E>`.
This parameter, `E`, represents the raw element type of the environment. For example, this parameter
is `Element` for unit test environments.

你会发现 `HarnessEnvironment` 有一个泛型类型参数：`HarnessEnvironment<E>`。这个参数 `E` 就表示环境的原始元素类型。例如，这个参数在单元测试环境下是 `Element`。

The following are the abstract methods that must be implemented:

下面是必须要实现的抽象方法：

| Method | Description |
| ------ | ----------- |
| 方法 | 说明 |
| `abstract getDocumentRoot(): E` | Gets the root element for the environment (e.g. `document.body`). |
| `abstract getDocumentRoot(): E` | 获取此环境的根元素（例如 `document.body` ）。 |
| `abstract createTestElement(element: E): TestElement` | Creates a `TestElement` for the given raw element. |
| `abstract createTestElement(element: E): TestElement` | 为指定的原始元素创建一个 `TestElement` |
| `abstract createEnvironment(element: E): HarnessEnvironment` | Creates a `HarnessEnvironment` rooted at the given raw element. |
| `abstract createEnvironment(element: E): HarnessEnvironment` | 根据指定的原始元素创建一个 `HarnessEnvironment` |
| `abstract getAllRawElements(selector: string): Promise<E[]>` | Gets all of the raw elements under the root element of the environment matching the given selector. |
| `abstract getAllRawElements(selector: string): Promise<E[]>` | 获取环境根元素下的所有与指定选择器匹配的原始元素。 |
| `abstract forceStabilize(): Promise<void>` | Gets a `Promise` that resolves when the `NgZone` is stable. Additionally, if applicable, tells `NgZone` to stabilize (e.g. calling `flush()` in a `fakeAsync` test). |
| `abstract forceStabilize(): Promise<void>` | 获取一个当 `NgZone` 稳定时解析的 `Promise`。另外，只要可能，就告诉 `NgZone` 变稳定（比如在 `fakeAsync` 测试中的 `flush()` |
| `abstract waitForTasksOutsideAngular(): Promise<void>` | Gets a `Promise` that resolves when the parent zone of `NgZone` is stable. |
| `abstract waitForTasksOutsideAngular(): Promise<void>` | 获取一个 `Promise`，它会在 `NgZone` 的父区域稳定时解析。 |

In addition to implementing the missing methods, this class should provide a way for test authors to
get `ComponentHarness` instances. The recommended approach is to have a protected constructor and
provide a static method called `loader` that returns a `HarnessLoader` instance. This allows test
authors to write code like: `SomeHarnessEnvironment.loader().getHarness(...)`. Depending on the
needs of the particular environment, the class may provide several different static methods or
require arguments to be passed. (e.g. the `loader` method on `TestbedHarnessEnvironment` takes a
`ComponentFixture`, and the class provides additional static methods called `documentRootLoader` and
`harnessForFixture`).

除了实现所缺的方法之外，这个类还应该为测试作者提供一种获取 `ComponentHarness` 实例的方法。
推荐的方法是具有一个受保护的构造函数，并提供一个名为 `loader` 的静态方法来返回一个 `HarnessLoader` 的实例。这让测试作者可以编写如下代码：`SomeHarnessEnvironment.loader().getHarness(...)`。根据特定环境的需要，该类可以提供几种不同的静态方法，或者要求传递参数。（例如，`TestbedHarnessEnvironment` 的 `loader` 方法接受了一个 `ComponentFixture`，该类还提供了另外一些名为 `documentRootLoader` 和 `harnessForFixture` 静态方法）。

The
[`TestbedHarnessEnvironment`](https://github.com/angular/components/blob/main/src/cdk/testing/testbed/testbed-harness-environment.ts#L20)
and
[`SeleniumWebDriverHarnessEnvironment`](https://github.com/angular/components/blob/main/src/cdk/testing/selenium-webdriver/selenium-web-driver-harness-environment.ts#L71)
implementations in Angular CDK serve as good examples of implementations of this interface.

Angular CDK 中的 [`TestbedHarnessEnvironment`](https://github.com/angular/components/blob/main/src/cdk/testing/testbed/testbed-harness-environment.ts#L20) 和 [`SeleniumWebDriverHarnessEnvironment`](https://github.com/angular/components/blob/main/src/cdk/testing/selenium-webdriver/selenium-web-driver-harness-environment.ts#L71) 的实现就是很好的例子。

#### Handling auto change detection status

#### 处理自动变更检测状态

In order to support the `manualChangeDetection` and `parallel` APIs, your environment should install
a handler for the auto change detection status.

为了支持 `manualChangeDetection` 和 `parallel` API，你的环境应该为自动变更检测状态安装一个处理器。

When your environment wants to start handling the auto change detection status it can call
`handleAutoChangeDetectionStatus(handler)`. The handler function will receive a 
`AutoChangeDetectionStatus` which has two properties:

当你的环境想要开始处理自动变更检测的状态时，可以调用 `handleAutoChangeDetectionStatus(handler)`。此处理器函数会要求一个 `AutoChangeDetectionStatus` 参数，其中有两个属性：

* `isDisabled: boolean` - Indicates whether auto change detection is currently disabled. When true,
  your environment's `forceStabilize` method should act as a no-op. This allows users to trigger
  change detection manually instead.

  `isDisabled: boolean` - 表示当前是否禁用了自动检测。当为 true 时，你的环境的 `forceStabilize` 方法应该什么也不做。这样，用户就可以手动触发变更检测。

* `onDetectChangesNow?: () => void` - If this optional callback is specified, your environment
  should trigger change detection immediately and call the callback when change detection finishes.

  `onDetectChangesNow?: () => void` - 如果指定了这个可选的回调函数，你的环境应立即触发变更检测，并在变更检测完成时调用该回调函数。

If your environment wants to stop handling auto change detection status it can call
`stopHandlingAutoChangeDetectionStatus()`.

如果你的环境要停止处理自动变更检测的状态，可以调用 `stopHandlingAutoChangeDetectionStatus()`。