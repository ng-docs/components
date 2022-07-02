# Using Angular Material's component harnesses in your tests

# 在测试中使用 Angular Material 的组件测试工具（harness）

The Angular CDK provides code for creating component test harnesses. A component harness is
a class that lets a test interact with a component via a supported API. Each harness's API
interacts with a component the same way a user would. By using the harness API, a test insulates
itself against updates to the internals of a component, such as changing its DOM structure. The
idea for component harnesses comes from the
[PageObject](https://martinfowler.com/bliki/PageObject.html) pattern commonly used for integration
testing.

Angular CDK 提供了用于创建组件测试工具的代码。组件测试工具是一个允许测试通过其 API 与组件进行交互的类。每个测试工具的 API 都会以和用户相同的方式与一个组件进行交互。通过使用测试工具 API，测试可以隔离对组件内部的更新，比如改变它的 DOM 结构。组件测试工具的思想来自集成测试中常用的 [PageObject](https://martinfowler.com/bliki/PageObject.html) 模式。

Angular Material offers test harnesses for many of its components. The Angular team strongly
encourages developers to use these harnesses for testing to avoid creating brittle tests that rely
on a component's internals.

Angular Material 为它的很多组件提供了测试工具。 Angular 团队强烈鼓励开发人员使用这些测试工具进行测试，避免产生依赖于组件内部的脆弱测试。

<!-- TODO(mmalerba): add list of components that are ready -->

This guide discusses the advantages of using component test harnesses and shows how to use them.

本指南讨论了使用组件测试工具的优点，并展示了该如何使用它们。

## Benefits of component test harnesses

## 组件测试工具的优点

There are two primary benefits to using the Angular Material component harnesses in your tests:

在测试中使用 Angular Material 组件测试工具有两个主要的好处：

1. Harnesses make tests easier to read and understand with straightforward APIs.

   通过直白的 API，测试工具可以让测试更容易阅读和理解。

2. Harnesses make tests more robust and less likely to break when updating Angular Material.

   在更新 Angular Material 时，测试工具可以让测试更加健壮，减少破坏的可能性。

The following sections will illustrate these benefits in more detail.

下面会更详细地说明这些优点。

## Which kinds of tests can use harnesses?

## 哪些测试可以使用测试工具？

The Angular CDK's component harnesses are designed to work in multiple different test environments.
Support currently includes Angular's Testbed environment in Karma unit tests and Selenium WebDriver
end-to-end (e2e) tests. You can also support additional environments by creating custom extensions
of the CDK's `HarnessEnvironment` and `TestElement` classes.

Angular CDK 的组件测试工具专为多种不同的测试环境而设计。目前支持包括 Karma 单元测试和 Selenium WebDriver 端到端（e2e）测试在内的 Angular Testbed 环境。你还可以通过创建 CDK 的 `HarnessEnvironment` 和 `TestElement` 类的自定义扩展来支持更多环境。

## Getting started

## 入门指南

The foundation for all test harnesses lives in `@angular/cdk/testing`. Start by importing either
`TestbedHarnessEnvironment` or `SeleniumWebDriverHarnessEnvironment` based on whether you're writing a
unit test or an e2e test. From the `HarnessEnvironment`, you can get a `HarnessLoader` instance,
which you will use to load Angular Material component harnesses. For example, if we're writing unit
tests for a `UserProfile` component, the code might look like this:

所有测试工具的基础都位于 `@angular/cdk/testing` 中。根据你要写单元测试还是测试端测试，导入 `TestbedHarnessEnvironment` 或 `SeleniumWebDriverHarnessEnvironment`。从 `HarnessEnvironment` 中，你可以得到一个 `HarnessLoader` 实例，你将用它来加载 Angular Material 组件测试工具。举例来说，如果我们要编写 `UserProfile` 组件的单元测试，代码可能是这样的：

```ts
import {HarnessLoader} from '@angular/cdk/testing';
import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';

let loader: HarnessLoader;

describe('my-component', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({imports: [MyModule], declarations: [UserProfile]})
        .compileComponents();
    fixture = TestBed.createComponent(UserProfile);
    loader = TestbedHarnessEnvironment.loader(fixture);
  });
}
```

This code creates a fixture for `UserProfile` and then creates a `HarnessLoader` for that fixture.
The `HarnessLoader` can then locate Angular Material components inside `UserProfile` and create
harnesses for them. Note that `HarnessLoader` and `TestbedHarnessEnvironment` are loaded from
different paths. 

此代码为 `UserProfile` 创建一个夹具，然后为夹具创建一个 `HarnessLoader`。接着，该 `HarnessLoader` 可以找到 `UserProfile` 中的 Angular Material 组件，并为它们创建测试工具。注意，`HarnessLoader` 和 `TestbedHarnessEnvironment` 要分别从不同的路径加载。

- `@angular/cdk/testing` contains symbols that are shared regardless of the environment your tests
  are in.

  `@angular/cdk/testing` 包含一些共享符号，无论你的测试位于哪个环境中。

- `@angular/cdk/testing/testbed` contains symbols that are used only in Karma tests.

  `@angular/cdk/testing/testbed` 包含仅用于 Karma 测试中的符号。

- `@angular/cdk/testing/selenium-webdriver` (not shown above) contains symbols that are used only in
  Selenium WebDriver tests.

  `@angular/cdk/testing/selenium-webdriver`（上面未演示）包含仅用于 Selenium WebDriver 测试中的符号。

## Loading an Angular Material harness

## 加载一个 Angular Material 测试工具

The `HarnessLoader` provides two methods that can be used to load harnesses, `getHarness` and
`getAllHarnesses`. The `getHarness` method gets a harness for the first instance
of the matching component, while `getAllHarnesses` gets a list of harnesses, one
for each instance of the corresponding component. For example, suppose `UserProfile` contains three
`MatButton` instances. We could load harnesses for them as follows:

`HarnessLoader` 提供了两种方法，可以用来加载 `getHarness` 和 `getAllHarnesses`。`getHarness` 方法会为所匹配组件的第一个实例获取测试工具，而 `getAllHarnesses` 会得到一个测试工具列表，每个实例对应一个组件。例如，假设 `UserProfile` 包含三个 `MatButton` 实例。我们可以用如下方式为它们加载测试工具：

```ts
import {MatButtonHarness} from '@angular/material/button/testing';

...

it('should work', async () => {
  const buttons = await loader.getAllHarnesses(MatButtonHarness); // length: 3
  const firstButton = await loader.getHarness(MatButtonHarness); // === buttons[0]
});
```

Notice the example code uses `async` and `await` syntax. All component harness APIs are
asynchronous and return `Promise` objects. Because of this, the Angular team recommends using the
[ES2017 `async`/`await` syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)
with your tests.

注意这段示例代码使用 `async` 和 `await` 语法。所有组件的测试工具 API 都是异步的，并返回 `Promise` 对象。正因如此，Angular 团队推荐在测试中使用 [ES2017 `async` / `await` 语法](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)。

The example above retrieves all button harnesses and uses an array index to get the harness for a
specific button. However, if the number or order of buttons changes, this test will break. You can
write a less brittle test by instead asking for only a subset of harnesses inside `UserProfile`.  

上面的例子中获取了所有按钮的测试工具，并使用数组索引来获取特定按钮的测试工具。但是，如果按钮的数量或顺序发生了变化，那么这个测试就会破坏。你可以通过请求 `UserProfile` 中测试工具的一个子集，来编写一个不那么脆弱的测试程序。

You can load harnesses for a sub-section of the DOM within `UserProfile` with the `getChildLoader`
method on `HarnessLoader`. For example, say that we know `UserProfile` has a div,
`<div class="footer">`, and we want the button inside that specific `<div>`. We can accomplish this
with the following code:

你可以通过 `HarnessLoader` 的 `getChildLoader` 方法来为 `UserProfile` DOM 的一部分加载测试工具。例如，假设我们知道 `UserProfile` 有一个 div， `<div class="footer">` ，我们希望测试这个特定 `<div>` 里面的按钮。我们可以通过下列代码实现这一目标：

```ts
it('should work', async () => {
  const footerLoader = await loader.getChildLoader('.footer');
  const footerButton = await footerLoader.getHarness(MatButtonHarness);
});
```

You can also use the static `with` method implemented on all Angular Material component harnesses.
This method creates a `HarnessPredicate`, an object that filters loaded harnesses based on the
provided constraints. The particular constraint options vary depending on the harness class, but all
harnesses support at least:

你还可以在所有的 Angular Material 组件测试工具上使用静态方法 `with`。该方法会创建一个 `HarnessPredicate`，它是一个根据所提供的约束条件来过滤已加载测试工具的对象。具体的约束选项取决于测试工具的类型，但所有的测试工具都支持：

- `selector` - CSS selector that the component must match (in addition to its host selector, such
  as `[mat-button]`)

  `selector` - 该组件必须匹配的 CSS 选择器（还有它的宿主选择器，如 `[mat-button]` ）

- `ancestor` - CSS selector for a some ancestor element above the component in the DOM

  `ancestor` - 在 DOM 中该组件上方的一些祖先元素的 CSS 选择器

In addition to these standard options, `MatButtonHarness` also supports

除了这些标准的选择器之外，`MatButtonHarness` 还支持

- `text` - String text or regular expressions that matches the text content of the button

  `text` - 与该按钮的文本内容相匹配的字符串文本或正则表达式

Using this method we could locate buttons as follows in our test:

使用这种方法，我们可以在测试中找到如下按钮：

```ts
it('should work', async () => {
  // Harness for mat-button whose id is 'more-info'.
  const info = await loader.getHarness(MatButtonHarness.with({selector: '#more-info'}));
  // Harness for mat-button whose text is 'Cancel'.
  const cancel = await loader.getHarness(MatButtonHarness.with({text: 'Cancel'}));
  // Harness for mat-button with class 'confirm' and whose text is either 'Ok' or 'Okay'.
  const okButton = await loader.getHarness(
      MatButtonHarness.with({selector: '.confirm', text: /^(Ok|Okay)$/}));
});
```

## Using a harness to interact with an Angular Material component

## 使用测试工具与 Angular Material 组件进行交互

The Angular Material component harnesses generally expose methods to either perform actions that a
real user could perform or to inspect component state that a real user might perceive. For
example, `MatButtonHarness` has methods to click, focus, and blur the `mat-button`, as well as
methods to get the text of the button and its disabled state. Because `MatButton` is a very simple
component, these harness methods might not seem very different from working directly with the DOM.
However, more complex harnesses like `MatSelectHarness` have methods like `open` and `isOpen` which
capture more knowledge about the component's internals.

Angular Material 组件通常会暴露这些方法，以执行真实用户可以执行的动作，或者检查真实用户可感知到的组件状态。例如， `MatButtonHarness` 有一些方法来对这个 `mat-button` 进行点击、设置焦点或取消焦点，还有一些获取该按钮的文本及其禁用状态的方法。因为 `MatButton` 是一个非常简单的组件，所以这些测试工具的方法可能和直接使用 DOM 的方式差别不大。而 `MatSelectHarness` 这样更复杂的测试工具具有 `open` 和 `isOpen` 这样的方法，可以捕获更多有关该组件内部结构的知识。

A test using the `MatButtonHarness` to interact with a `mat-button` might look like the following:

使用 `MatButtonHarness` 与 `mat-button` 互动的测试看起来是这样的：

```ts
it('should mark confirmed when ok button clicked', async () => {
  const okButton = await loader.getHarness(MatButtonHarness.with({selector: '.confirm'});
  expect(fixture.componentInstance.confirmed).toBe(false);
  expect(await okButton.isDisabled()).toBe(false);
  await okButton.click();
  expect(fixture.componentInstance.confirmed).toBe(true);
});
```

Note that the code above does not call `fixture.detectChanges()`, something you commonly see in
unit tests. The CDK's component harnesses automatically invoke change detection after performing
actions and before reading state. The harness also automatically waits for the fixture to be stable,
which will cause the test to wait for `setTimeout`, `Promise`, etc.

注意上面的代码不会调用 `fixture.detectChanges()`，这是你在单元测试中经常看到的。CDK 的组件测试工具会在执行动作之后和读取状态之前自动执行变更检测。测试工具还会自动等待夹具变得稳定，这会导致该测试等待 `setTimeout`、`Promise` 等。

## Comparison with and without component harnesses

## 使用和不使用组件测试工具时的比较

Consider an `<issue-report-selector>` component that you want to test. It allows a user to
choose an issue type and display the necessary form create report for that issue type. You need a 
test to verify that when the user chooses an issue type the proper report displays. First consider
what the test might look like without using component harnesses:

考虑你要测试 `<issue-report-selector>` 组件，它允许用户选择一个问题类型，并为该问题类型显示必要的表单创建报告。你需要一个测试来验证，当用户选择问题类型时，是否显示了正确的报告。首先考虑如果不使用组件测试工具，测试结果会是什么样子：

```ts
describe('issue-report-selector', () => {
  let fixture: ComponentFixture<IssueReportSelector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IssueReportSelectorModule],
      declarations: [IssueReportSelector],
    }).compileComponents();

    fixture = TestBed.createComponent(IssueReportSelector);
    fixture.detectChanges();
  });

  it('should switch to bug report template', async () => {
    expect(fixture.debugElement.query('bug-report-form')).toBeNull();
    const selectTrigger = fixture.debugElement.query(By.css('.mat-select-trigger'));
    selectTrigger.triggerEventHandler('click', {});
    fixture.detectChanges();
    await fixture.whenStable();
    const options = document.querySelectorAll('.mat-select-panel mat-option');
    options[1].click(); // Click the second option, "Bug".
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.debugElement.query('bug-report-form')).not.toBeNull();
  });
});
```

The same test, using the Angular Material component harnesses might look like the following:

使用 Angular Material 组件时，同样的测试可能如下：

```ts
describe('issue-report-selector', () => {
  let fixture: ComponentFixture<IssueReportSelector>;
  let loader: HarnessLoader;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IssueReportSelectorModule],
      declarations: [IssueReportSelector],
    }).compileComponents();

    fixture = TestBed.createComponent(IssueReportSelector);
    fixture.detectChanges();
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  it('should switch to bug report template', async () => {
    expect(fixture.debugElement.query('bug-report-form')).toBeNull();
    const select = await loader.getHarness(MatSelectHarness);
    await select.open();
    const bugOption = await select.getOption({text: 'Bug'});
    await bugOption.click();
    expect(fixture.debugElement.query('bug-report-form')).not.toBeNull();
  });
});
```

### Tests that are easier to read and understand

### 这些测试更容易阅读和理解

The code above shows that adopting the harnesses in tests can make them easier to understand.
Specifically in this example, it makes the "open the mat-select" logic more obvious. An unfamiliar
reader may not know what clicking on `.mat-select-trigger` does, but `await select.open()` is
self-explanatory.

上面的代码表明，在测试中采用这些测试工具可以让它们更容易理解。具体到这个例子中，它让 "open the mat-select" 逻辑变得更加明显。一个不太熟悉的读者可能不知道点击 `.mat-select-trigger` 会有什么用，但 `await select.open()` 是不言自明的。

The harnesses also make clear which option should be selected. Without the harness, you need a comment that
explains what `options[1]` means. With `MatSelectHarness`, however, the filter API makes the code
self-documenting.

这些测试工具还明确了应该选择哪个选项。如果没有这些工具，你需要用注释来解释 `options[1]` 的含义，但是使用 `MatSelectHarness`，其过滤器 API 就会让代码就会变成自文档化的。

Finally, the repeated calls to `detectChanges` and `whenStable()` can obfuscate the underlying
intent of the test. By using the harness APIs, you eliminate these calls, making the test more
concise.

最后，重复调用 `detectChanges` 和 `whenStable()` 可能会混淆测试的底层意图。通过使用这些测试工具 API，你可以消除这些调用，让测试变得更加简洁。

### Tests that are more robust

### 测试更健壮

Notice that the test without harnesses directly uses CSS selectors to query elements within
`<mat-select>`, such as `.mat-select-trigger`. If the internal DOM of `<mat-select>` changes, these
queries may stop working. While the Angular team tries to minimize this type of change, some
features and bug fixes ultimately require restructuring the DOM. By using the Angular Material
harnesses, you avoid depending on internal DOM structure directly. 

注意，没有测试工具的测试会直接使用 CSS 选择器查询 `<mat-select>` 中的元素，比如 `.mat-select-trigger`。如果 `<mat-select>` 的内部 DOM 发生了变化，这些查询可能会停止工作。虽然 Angular 团队试图最大限度地减少这种类型的变更，但一些特性和 bug 的修复最终都可能影响 DOM 的结构。通过使用 Angular Material 测试工具，你可以避免直接依赖内部的 DOM 结构。

In addition to DOM structure, component asynchronicity often offers a challenge when updating
components. If a component changes between synchronous and asynchronous, downstream unit tests may
break due to expectations around timing. Tests then require the addition or removal of some
arcane combination of `whenStable`, `flushMicroTasks`, `tick`, or `detectChanges`. Component
harnesses, however, avoid this problem by normalizing the asynchronicity of all component behaviors 
with all asynchronous APIs. When a test uses these harnesses, changes to asynchronicity become
far more manageable.

除了 DOM 结构外，组件异步性在更新组件时也经常会带来挑战。如果一个组件在同步性方面发生了变化，那么下游的单元测试可能会破坏其对计时方面的期待。然后，测试需要添加或删除一些 `whenStable`、`flushMicroTasks`、`tick` 或 `detectChanges` 的神秘组合。但是，组件测试工具通过规范化所有带异步 API 组件的行为异步性避免了这个问题。当测试使用这些测试工具时，异步性的变化就会变得更加可控。

Both DOM structure and asynchronicity are _implementation details_ of Angular Material's components.
When tests depend on the implementation details, they become a common source of failures due to
library changes. Angular CDK's test harnesses makes component library updates easier for both
application authors and the Angular team, as the Angular team only has to update the harness once
for everyone.

Angular Material 组件的 DOM 结构和异步性都是其*实现细节*。当测试依赖于实现细节时，由于库的变化，它们会成为常见的失败之源。Angular CDK 的测试工具可以让应用作者和 Angular 团队对组件库的更新变得更容易，因为 Angular 团队只需为每个人更新一次测试工具。
