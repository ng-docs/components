/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {parallel} from './change-detection';
import {TestElement} from './test-element';

/**
 * An async function that returns a promise when called.
 *
 * 一个异步函数，调用时返回一个 Promise。
 *
 */
export type AsyncFactoryFn<T> = () => Promise<T>;

/**
 * An async function that takes an item and returns a boolean promise
 *
 * 一个异步函数，它接受一个 item 并返回一个布尔型 Promise
 *
 */
export type AsyncPredicate<T> = (item: T) => Promise<boolean>;

/**
 * An async function that takes an item and an option value and returns a boolean promise.
 *
 * 一个异步函数，它接受一个 item 和一个 option 值，并返回一个布尔型 Promise。
 *
 */
export type AsyncOptionPredicate<T, O> = (item: T, option: O) => Promise<boolean>;

/**
 * A query for a `ComponentHarness`, which is expressed as either a `ComponentHarnessConstructor` or
 * a `HarnessPredicate`.
 *
 * `ComponentHarness` 的查询，它表示为一个 `ComponentHarnessConstructor` 或 `HarnessPredicate`。
 *
 */
export type HarnessQuery<T extends ComponentHarness> =
  | ComponentHarnessConstructor<T>
  | HarnessPredicate<T>;

/**
 * The result type obtained when searching using a particular list of queries. This type depends on
 * the particular items being queried.
 *
 * 在使用特定查询列表进行搜索时得到的结果类型。这个类型取决于被查询的特定条目。
 *
 * - If one of the queries is for a `ComponentHarnessConstructor<C1>`, it means that the result
 *   might be a harness of type `C1`
 *
 *   如果其中一个查询是针对 `ComponentHarnessConstructor<C1>` 的，那就意味着结果可能是 `C1`
 *
 * - If one of the queries is for a `HarnessPredicate<C2>`, it means that the result might be a
 *   harness of type `C2`
 *
 *   如果其中一个查询是针对 `HarnessPredicate<C2>` 的，那就意味着该结果可能是 `C2`
 *
 * - If one of the queries is for a `string`, it means that the result might be a `TestElement`.
 *
 *   如果其中一个查询是针对某个 `string`，那就意味着该结果可能是一个 `TestElement`。
 *
 * Since we don't know for sure which query will match, the result type if the union of the types
 * for all possible results.
 *
 * 由于我们不能确定哪个查询匹配，所以结果类型就是所有可能结果类型的并集。
 *
 * e.g.
 * The type:
 * `LocatorFnResult&lt;[
 *   ComponentHarnessConstructor&lt;MyHarness&gt;,
 *   HarnessPredicate&lt;MyOtherHarness&gt;,
 *   string
 * ]&gt;`
 * is equivalent to:
 * `MyHarness | MyOtherHarness | TestElement`.
 *
 * 例如，类型：
 * `LocatorFnResult&lt;[
 *   ComponentHarnessConstructor&lt;MyHarness&gt;,
 *   HarnessPredicate&lt;MyOtherHarness&gt;,
 *   string
 * ]&gt;`
 * 相当于：
 * `MyHarness | MyOtherHarness | TestElement`.
 *
 */
export type LocatorFnResult<T extends (HarnessQuery<any> | string)[]> = {
  [I in keyof T]: T[I] extends new (...args: any[]) => infer C // Map `ComponentHarnessConstructor<C>` to `C`.
    ? C
    : // Map `HarnessPredicate<C>` to `C`.
    T[I] extends {harnessType: new (...args: any[]) => infer C}
    ? C
    : // Map `string` to `TestElement`.
    T[I] extends string
    ? TestElement
    : // Map everything else to `never` (should not happen due to the type constraint on `T`).
      never;
}[number];

/**
 * Interface used to load ComponentHarness objects. This interface is used by test authors to
 * instantiate `ComponentHarness`es.
 *
 * 用于加载 ComponentHarness 对象的接口。测试的作者可以使用这个接口实例化 `ComponentHarness`。
 *
 */
export interface HarnessLoader {
  /**
   * Searches for an element with the given selector under the current instances's root element,
   * and returns a `HarnessLoader` rooted at the matching element. If multiple elements match the
   * selector, the first is used. If no elements match, an error is thrown.
   *
   * 在当前实例的根元素下搜索具有指定选择器的元素，并返回一个以匹配元素为根的 `HarnessLoader`。如果多个元素与选择器匹配，则使用第一个元素。如果没有符合的元素，就抛出一个错误。
   *
   * @param selector The selector for the root element of the new `HarnessLoader`
   *
   * `HarnessLoader` 根元素的选择器
   *
   * @return A `HarnessLoader` rooted at the element matching the given selector.
   *
   * 一个根据指定选择器匹配的元素为根的 `HarnessLoader`。
   *
   * @throws If a matching element can't be found.
   *
   * 是否未找到匹配的元素。
   *
   */
  getChildLoader(selector: string): Promise<HarnessLoader>;

  /**
   * Searches for all elements with the given selector under the current instances's root element,
   * and returns an array of `HarnessLoader`s, one for each matching element, rooted at that
   * element.
   *
   * 在当前实例的根元素下搜索具有指定选择器的所有元素，并返回一个以每个匹配的元素为根的 `HarnessLoader` 数组。
   *
   * @param selector The selector for the root element of the new `HarnessLoader`
   *
   * 新 `HarnessLoader` 的根元素的选择器
   *
   * @return A list of `HarnessLoader`s, one for each matching element, rooted at that element.
   *
   * `HarnessLoader` 列表，它是每个匹配元素的列表，并以相应的元素为根。
   *
   */
  getAllChildLoaders(selector: string): Promise<HarnessLoader[]>;

  /**
   * Searches for an instance of the component corresponding to the given harness type under the
   * `HarnessLoader`'s root element, and returns a `ComponentHarness` for that instance. If multiple
   * matching components are found, a harness for the first one is returned. If no matching
   * component is found, an error is thrown.
   *
   * 在 `HarnessLoader` 的根元素下搜索与指定的测试工具类型对应的组件实例，并返回该实例的 `ComponentHarness`。如果找到了多个匹配的组件，就会返回第一个匹配的组件。如果找不到匹配的组件，则会抛出错误。
   *
   * @param query A query for a harness to create
   *
   * 要创建的测试工具的查询
   *
   * @return An instance of the given harness type
   *
   * 指定测试工具类型的一个实例
   *
   * @throws If a matching component instance can't be found.
   *
   * 如果匹配的组件实例无法找到。
   *
   */
  getHarness<T extends ComponentHarness>(query: HarnessQuery<T>): Promise<T>;

  /**
   * Searches for an instance of the component corresponding to the given harness type under the
   * `HarnessLoader`'s root element, and returns a `ComponentHarness` for that instance. If multiple
   * matching components are found, a harness for the first one is returned. If no matching
   * component is found, null is returned.
   *
   * 在 `HarnessLoader` 的根元素下搜索与给定测试工具类型对应的组件实例，并返回该实例的 `ComponentHarness` 。如果找到多个匹配的组件，则返回第一个的测试工具。如果没有找到匹配的组件，则返回 null。
   *
   * @param query A query for a harness to create
   *
   * 要创建的测试工具的查询
   * @return An instance of the given harness type \(or null if not found\).
   *
   * 给定测试工具类型的实例（如果未找到，则为 null）。
   *
   */
  getHarnessOrNull<T extends ComponentHarness>(query: HarnessQuery<T>): Promise<T | null>;

  /**
   * Searches for all instances of the component corresponding to the given harness type under the
   * `HarnessLoader`'s root element, and returns a list `ComponentHarness` for each instance.
   *
   * 在 `HarnessLoader` 的根元素下搜索与指定的测试工具类型对应的所有组件实例，并为每个实例返回 `ComponentHarness`。
   *
   * @param query A query for a harness to create
   *
   * 要创建的测试工具的查询
   *
   * @return A list instances of the given harness type.
   *
   * 指定测试工具类型的列表实例。
   *
   */
  getAllHarnesses<T extends ComponentHarness>(query: HarnessQuery<T>): Promise<T[]>;

  /**
   * Searches for an instance of the component corresponding to the given harness type under the
   * `HarnessLoader`'s root element, and returns a boolean indicating if any were found.
   *
   * 在 `HarnessLoader` 的根元素下搜索与给定测试工具类型相对应的组件实例，并返回一个布尔值，指示是否找到任何东西。
   *
   * @param query A query for a harness to create
   *
   * 要创建的测试工具的查询
   *
   * @return A boolean indicating if an instance was found.
   *
   * 指示是否找到实例的布尔值。
   *
   */
  hasHarness<T extends ComponentHarness>(query: HarnessQuery<T>): Promise<boolean>;
}

/**
 * Interface used to create asynchronous locator functions used find elements and component
 * harnesses. This interface is used by `ComponentHarness` authors to create locator functions for
 * their `ComponentHarness` subclass.
 *
 * 用来创建异步定位器函数的接口，用于查找元素和组件测试工具。这个接口供 `ComponentHarness` 的作者使用，用于为其 `ComponentHarness` 子类创建定位器函数。
 *
 */
export interface LocatorFactory {
  /**
   * Gets a locator factory rooted at the document root.
   *
   * 获取一个以 document 根为根的定位器工厂。
   *
   */
  documentRootLocatorFactory(): LocatorFactory;

  /**
   * The root element of this `LocatorFactory` as a `TestElement`.
   *
   * `LocatorFactory` 的根元素是一个 `TestElement`。
   *
   */
  rootElement: TestElement;

  /**
   * Creates an asynchronous locator function that can be used to find a `ComponentHarness` instance
   * or element under the root element of this `LocatorFactory`.
   *
   * 创建一个异步定位器函数，用于在这个 `LocatorFactory` 的根元素下查找 `ComponentHarness` 实例或元素。
   *
   * @param queries A list of queries specifying which harnesses and elements to search for:
   *
   * 一系列查询，用于指定要搜索的测试工具和元素：
   *
   * - A `string` searches for elements matching the CSS selector specified by the string.
   *
   *   `string` 搜索满足此字符串指定的 CSS 选择器的元素。
   *
   * - A `ComponentHarness` constructor searches for `ComponentHarness` instances matching the
   *   given class.
   *
   *   `ComponentHarness` 构造函数会搜索与指定类匹配的 `ComponentHarness` 实例。
   *
   * - A `HarnessPredicate` searches for `ComponentHarness` instances matching the given
   *   predicate.
   *
   *   `HarnessPredicate` 搜索满足指定谓词的 `ComponentHarness` 实例。
   *
   * @return An asynchronous locator function that searches for and returns a `Promise` for the
   *   first element or harness matching the given search criteria. Matches are ordered first by
   *   order in the DOM, and second by order in the queries list. If no matches are found, the
   *   `Promise` rejects. The type that the `Promise` resolves to is a union of all result types for
   *   each query.
   *
   * 一个异步定位器函数，用于搜索并返回满足指定搜索条件的第一个元素或测试工具的 `Promise`。匹配结果首先按照 DOM 中的顺序排序，然后按在查询列表中的顺序排序。如果找不到匹配条目，`Promise` 就会拒绝（reject）。`Promise` 解析（resolve）成的类型是每个查询的所有结果类型的并集。
   *
   * e.g. Given the following DOM: `<div id="d1" /><div id="d2" />`, and assuming
   * `DivHarness.hostSelector === 'div'`:
   *
   * 例如，指定以下 DOM： `<div id="d1" /><div id="d2" />`，并假设 `DivHarness.hostSelector === 'div'` ：
   *
   * - `await lf.locatorFor(DivHarness, 'div')()` gets a `DivHarness` instance for `#d1`
   *
   *   `await lf.locatorFor(DivHarness, 'div')()` 会得到 `#d1` 的 `DivHarness` 实例
   *
   * - `await lf.locatorFor('div', DivHarness)()` gets a `TestElement` instance for `#d1`
   *
   *   `await lf.locatorFor('div', DivHarness)()` 会得到 `#d1` 的 `TestElement` 实例
   *
   * - `await lf.locatorFor('span')()` throws because the `Promise` rejects.
   *
   *   `await lf.locatorFor('span')()` 会抛出错误，因为 `Promise` 拒绝了。
   *
   */
  locatorFor<T extends (HarnessQuery<any> | string)[]>(
    ...queries: T
  ): AsyncFactoryFn<LocatorFnResult<T>>;

  /**
   * Creates an asynchronous locator function that can be used to find a `ComponentHarness` instance
   * or element under the root element of this `LocatorFactory`.
   *
   * 创建一个异步定位器函数，用于查找 `LocatorFactory` 根元素下的 `ComponentHarness` 实例或元素。
   *
   * @param queries A list of queries specifying which harnesses and elements to search for:
   *
   * 一系列查询，用于指定要搜索的测试工具和元素：
   *
   * - A `string` searches for elements matching the CSS selector specified by the string.
   *
   *   `string` 搜索满足此字符串指定的 CSS 选择器的元素。
   *
   * - A `ComponentHarness` constructor searches for `ComponentHarness` instances matching the
   *   given class.
   *
   *   `ComponentHarness` 构造函数会搜索与指定类匹配的 `ComponentHarness` 实例。
   *
   * - A `HarnessPredicate` searches for `ComponentHarness` instances matching the given
   *   predicate.
   *
   *   `HarnessPredicate` 搜索满足指定谓词的 `ComponentHarness` 实例。
   *
   * @return An asynchronous locator function that searches for and returns a `Promise` for the
   *   first element or harness matching the given search criteria. Matches are ordered first by
   *   order in the DOM, and second by order in the queries list. If no matches are found, the
   *   `Promise` is resolved with `null`. The type that the `Promise` resolves to is a union of all
   *   result types for each query or null.
   *
   * 一个异步定位器函数，用于搜索和返回与指定搜索条件匹配的第一个元素或测试工具的 `Promise`。匹配结果首先按照 DOM 中的顺序排序，然后按查询列表中的顺序排序。如果找不到匹配条目，`Promise` 就会被解析为 `null`。`Promise` 解析成的类型是每个查询的所有结果类型的并集，或 null。
   *
   * e.g. Given the following DOM: `<div id="d1" /><div id="d2" />`, and assuming
   * `DivHarness.hostSelector === 'div'`:
   *
   * 例如，指定以下 DOM： `<div id="d1" /><div id="d2" />`，并假设 `DivHarness.hostSelector === 'div'` ：
   *
   * - `await lf.locatorForOptional(DivHarness, 'div')()` gets a `DivHarness` instance for `#d1`
   *
   *   `await lf.locatorForOptional(DivHarness, 'div')()` 会得到 `#d1` 的 `DivHarness` 实例
   *
   * - `await lf.locatorForOptional('div', DivHarness)()` gets a `TestElement` instance for `#d1`
   *
   *   `await lf.locatorForOptional('div', DivHarness)()` 会获取 `#d1` 的 `TestElement` 实例
   *
   * - `await lf.locatorForOptional('span')()` gets `null`.
   *
   *   `await lf.locatorForOptional('span')()` 会得到 `null`。
   *
   */
  locatorForOptional<T extends (HarnessQuery<any> | string)[]>(
    ...queries: T
  ): AsyncFactoryFn<LocatorFnResult<T> | null>;

  /**
   * Creates an asynchronous locator function that can be used to find `ComponentHarness` instances
   * or elements under the root element of this `LocatorFactory`.
   *
   * 创建一个异步定位器函数，用于查找 `LocatorFactory` 根元素下的 `ComponentHarness` 实例或元素。
   *
   * @param queries A list of queries specifying which harnesses and elements to search for:
   *
   * 一系列查询，用于指定要搜索的测试工具和元素：
   *
   * - A `string` searches for elements matching the CSS selector specified by the string.
   *
   *   `string` 搜索满足此字符串指定的 CSS 选择器的元素。
   *
   * - A `ComponentHarness` constructor searches for `ComponentHarness` instances matching the
   *   given class.
   *
   *   `ComponentHarness` 构造函数会搜索与指定类匹配的 `ComponentHarness` 实例。
   *
   * - A `HarnessPredicate` searches for `ComponentHarness` instances matching the given
   *   predicate.
   *
   *   `HarnessPredicate` 搜索满足指定谓词的 `ComponentHarness` 实例。
   *
   * @return An asynchronous locator function that searches for and returns a `Promise` for all
   *   elements and harnesses matching the given search criteria. Matches are ordered first by
   *   order in the DOM, and second by order in the queries list. If an element matches more than
   *   one `ComponentHarness` class, the locator gets an instance of each for the same element. If
   *   an element matches multiple `string` selectors, only one `TestElement` instance is returned
   *   for that element. The type that the `Promise` resolves to is an array where each element is
   *   the union of all result types for each query.
   *
   * 一个异步定位器函数，用于搜索并返回满足指定搜索条件的第一个元素或测试工具的 `Promise`。匹配结果首先按照 DOM 中的顺序排序，然后按在查询列表中的顺序排序。如果一个元素与多个 `ComponentHarness` 类匹配，那么该定位器会为同一个元素获取每个元素的实例。如果一个元素匹配多个 `string` 选择器，只会为它返回一个 `TestElement` 实例。`Promise` 解析成的类型是一个数组，其中每个元素都是每个查询的所有结果类型的并集。
   *
   * e.g. Given the following DOM: `<div id="d1" /><div id="d2" />`, and assuming
   * `DivHarness.hostSelector === 'div'` and `IdIsD1Harness.hostSelector === '#d1'`:
   *
   * 例如，指定以下 DOM： `<div id="d1" /><div id="d2" />`，并假设 `DivHarness.hostSelector === 'div'` 和 `IdIsD1Harness.hostSelector === '#d1'` ：
   *
   * - `await lf.locatorForAll(DivHarness, 'div')()` gets `[
   *     DivHarness, // for #d1
   *     TestElement, // for #d1
   *     DivHarness, // for #d2
   *     TestElement // for #d2
   *   ]`
   *
   *   `await lf.locatorForAll(DivHarness, 'div')()` 会得到 `[
   *     DivHarness, // 对于 #d1
   *     TestElement, // 对于 #d1
   *     DivHarness, // 对于 #d2
   *     TestElement // 对于 #d2
   *   ]`
   *
   * - `await lf.locatorForAll('div', '#d1')()` gets `[
   *     TestElement, // for #d1
   *     TestElement // for #d2
   *   ]`
   *
   *   `await lf.locatorForAll('div', '#d1')()` 会得到 `[
   *     TestElement, // 对于 #d1
   *     TestElement // 对于 #d2
   *   ]`
   *
   * - `await lf.locatorForAll(DivHarness, IdIsD1Harness)()` gets `[
   *     DivHarness, // for #d1
   *     IdIsD1Harness, // for #d1
   *     DivHarness // for #d2
   *   ]`
   *
   *   `await lf.locatorForAll(DivHarness, IdIsD1Harness)()` 会得到 `[
   *     DivHarness, // 对于 #d1
   *     IdIsD1Harness, // 对于 #d1
   *     DivHarness // 对于 #d2
   *   ]`
   *
   * - `await lf.locatorForAll('span')()` gets `[]`.
   *
   *   `await lf.locatorForAll('span')()` 会得到 `[]`。
   *
   */
  locatorForAll<T extends (HarnessQuery<any> | string)[]>(
    ...queries: T
  ): AsyncFactoryFn<LocatorFnResult<T>[]>;

  /**
   * @return A `HarnessLoader` rooted at the root element of this `LocatorFactory`.
   *
   * 一个以此 `LocatorFactory` 的根元素为根的 `HarnessLoader`。
   *
   */
  rootHarnessLoader(): Promise<HarnessLoader>;

  /**
   * Gets a `HarnessLoader` instance for an element under the root of this `LocatorFactory`.
   *
   * 从 `LocatorFactory` 的根下为某个元素获取一个 `HarnessLoader` 实例。
   *
   * @param selector The selector for the root element.
   *
   * 根元素的选择器。
   *
   * @return A `HarnessLoader` rooted at the first element matching the given selector.
   *
   * 一个以指定选择器匹配的第一个元素为根的 `HarnessLoader`。
   *
   * @throws If no matching element is found for the given selector.
   *
   * 是否找不到匹配指定选择器的元素。
   *
   */
  harnessLoaderFor(selector: string): Promise<HarnessLoader>;

  /**
   * Gets a `HarnessLoader` instance for an element under the root of this `LocatorFactory`
   *
   * 在 `LocatorFactory` 的根下为一个元素获取 `HarnessLoader` 实例。
   *
   * @param selector The selector for the root element.
   *
   * 根元素的选择器。
   *
   * @return A `HarnessLoader` rooted at the first element matching the given selector, or null if
   *     no matching element is found.
   *
   * 一个以指定选择器匹配的第一个元素为根的 `HarnessLoader` 实例，如果没有找到匹配的元素则为 null。
   *
   */
  harnessLoaderForOptional(selector: string): Promise<HarnessLoader | null>;

  /**
   * Gets a list of `HarnessLoader` instances, one for each matching element.
   *
   * 获取 `HarnessLoader` 实例的列表，每个实例对应一个匹配的元素。
   *
   * @param selector The selector for the root element.
   *
   * 根元素的选择器。
   *
   * @return A list of `HarnessLoader`, one rooted at each element matching the given selector.
   *
   * `HarnessLoader` 列表，每一条目都以指定选择器匹配的元素为根。
   *
   */
  harnessLoaderForAll(selector: string): Promise<HarnessLoader[]>;

  /**
   * Flushes change detection and async tasks captured in the Angular zone.
   * In most cases it should not be necessary to call this manually. However, there may be some edge
   * cases where it is needed to fully flush animation events.
   *
   * 刷新在 Angular Zone 中捕获的变更检测和异步任务。在大多数情况下，没有必要手动调用此方法。但是，在某些极端情况下，需要完全刷新动画事件。
   *
   */
  forceStabilize(): Promise<void>;

  /**
   * Waits for all scheduled or running async tasks to complete. This allows harness
   * authors to wait for async tasks outside of the Angular zone.
   *
   * 等待所有已安排或正在运行的异步任务完成。这使得测试工具的作者可以等待 Angular 中的异步任务。
   *
   */
  waitForTasksOutsideAngular(): Promise<void>;
}

/**
 * Base class for component harnesses that all component harness authors should extend. This base
 * component harness provides the basic ability to locate element and sub-component harness. It
 * should be inherited when defining user's own harness.
 *
 * 所有组件工具都应该扩展的组件测试工具的基类。这个基础组件工具提供了定位元素和子组件工具的基本能力。它应该在用户定义自己的测试工具时继承。
 *
 */
export abstract class ComponentHarness {
  constructor(protected readonly locatorFactory: LocatorFactory) {}

  /**
   * Gets a `Promise` for the `TestElement` representing the host element of the component.
   *
   * 获取一个代表该组件宿主元素的 `TestElement` 型 `Promise`。
   *
   */
  async host(): Promise<TestElement> {
    return this.locatorFactory.rootElement;
  }

  /**
   * Gets a `LocatorFactory` for the document root element. This factory can be used to create
   * locators for elements that a component creates outside of its own root element. \(e.g. by
   * appending to document.body\).
   *
   * 获取 document 根元素的 `LocatorFactory`。这个工厂可以用来为组件在自己的根元素之外创建（例如，通过追加到 document.body 中）的元素创建定位器。。
   *
   */
  protected documentRootLocatorFactory(): LocatorFactory {
    return this.locatorFactory.documentRootLocatorFactory();
  }

  /**
   * Creates an asynchronous locator function that can be used to find a `ComponentHarness` instance
   * or element under the host element of this `ComponentHarness`.
   *
   * 创建一个异步定位器函数，可用于查找此 `ComponentHarness` 宿主元素下的 `ComponentHarness` 实例或元素。
   *
   * @param queries A list of queries specifying which harnesses and elements to search for:
   *
   * 一系列查询，用于指定要搜索的测试工具和元素：
   *
   * - A `string` searches for elements matching the CSS selector specified by the string.
   *
   *   `string` 搜索满足此字符串指定的 CSS 选择器的元素。
   *
   * - A `ComponentHarness` constructor searches for `ComponentHarness` instances matching the
   *   given class.
   *
   *   `ComponentHarness` 构造函数会搜索与指定类匹配的 `ComponentHarness` 实例。
   *
   * - A `HarnessPredicate` searches for `ComponentHarness` instances matching the given
   *   predicate.
   *
   *   `HarnessPredicate` 搜索满足指定谓词的 `ComponentHarness` 实例。
   *
   * @return An asynchronous locator function that searches for and returns a `Promise` for the
   *   first element or harness matching the given search criteria. Matches are ordered first by
   *   order in the DOM, and second by order in the queries list. If no matches are found, the
   *   `Promise` rejects. The type that the `Promise` resolves to is a union of all result types for
   *   each query.
   *
   * 一个异步定位器函数，用于搜索并返回满足指定搜索条件的第一个元素或测试工具的 `Promise`。匹配结果首先按照 DOM 中的顺序排序，然后按在查询列表中的顺序排序。如果找不到匹配条目，`Promise` 就会拒绝（reject）。`Promise` 解析（resolve）成的类型是每个查询的所有结果类型的并集。
   *
   * e.g. Given the following DOM: `<div id="d1" /><div id="d2" />`, and assuming
   * `DivHarness.hostSelector === 'div'`:
   *
   * 例如，指定以下 DOM： `<div id="d1" /><div id="d2" />`，并假设 `DivHarness.hostSelector === 'div'` ：
   *
   * - `await ch.locatorFor(DivHarness, 'div')()` gets a `DivHarness` instance for `#d1`
   *
   *   `await ch.locatorFor(DivHarness, 'div')()` 会得到 `#d1` 的 `DivHarness` 实例
   *
   * - `await ch.locatorFor('div', DivHarness)()` gets a `TestElement` instance for `#d1`
   *
   *   `await ch.locatorFor('div', DivHarness)()` 会得到 `#d1` 的 `TestElement` 实例
   *
   * - `await ch.locatorFor('span')()` throws because the `Promise` rejects.
   *
   *   `await ch.locatorFor('span')()` 会抛出错误，因为 `Promise` 拒绝了。
   *
   */
  protected locatorFor<T extends (HarnessQuery<any> | string)[]>(
    ...queries: T
  ): AsyncFactoryFn<LocatorFnResult<T>> {
    return this.locatorFactory.locatorFor(...queries);
  }

  /**
   * Creates an asynchronous locator function that can be used to find a `ComponentHarness` instance
   * or element under the host element of this `ComponentHarness`.
   *
   * 创建一个异步定位器函数，可用于查找此 `ComponentHarness` 宿主元素下的 `ComponentHarness` 实例或元素。
   *
   * @param queries A list of queries specifying which harnesses and elements to search for:
   *
   * 一系列查询，用于指定要搜索的测试工具和元素：
   *
   * - A `string` searches for elements matching the CSS selector specified by the string.
   *
   *   `string` 搜索满足此字符串指定的 CSS 选择器的元素。
   *
   * - A `ComponentHarness` constructor searches for `ComponentHarness` instances matching the
   *   given class.
   *
   *   `ComponentHarness` 构造函数会搜索与指定类匹配的 `ComponentHarness` 实例。
   *
   * - A `HarnessPredicate` searches for `ComponentHarness` instances matching the given
   *   predicate.
   *
   *   `HarnessPredicate` 搜索满足指定谓词的 `ComponentHarness` 实例。
   *
   * @return An asynchronous locator function that searches for and returns a `Promise` for the
   *   first element or harness matching the given search criteria. Matches are ordered first by
   *   order in the DOM, and second by order in the queries list. If no matches are found, the
   *   `Promise` is resolved with `null`. The type that the `Promise` resolves to is a union of all
   *   result types for each query or null.
   *
   * 一个异步定位器函数，用于搜索和返回与指定搜索条件匹配的第一个元素或测试工具的 `Promise`。匹配结果首先按照 DOM 中的顺序排序，然后按查询列表中的顺序排序。如果找不到匹配条目，`Promise` 就会被解析为 `null`。`Promise` 解析成的类型是每个查询的所有结果类型的并集，或 null。
   *
   * e.g. Given the following DOM: `<div id="d1" /><div id="d2" />`, and assuming
   * `DivHarness.hostSelector === 'div'`:
   *
   * 例如，指定以下 DOM： `<div id="d1" /><div id="d2" />`，并假设 `DivHarness.hostSelector === 'div'` ：
   *
   * - `await ch.locatorForOptional(DivHarness, 'div')()` gets a `DivHarness` instance for `#d1`
   *
   *   `await ch.locatorForOptional(DivHarness, 'div')()` 获取 `#d1` `DivHarness` 实例
   *
   * - `await ch.locatorForOptional('div', DivHarness)()` gets a `TestElement` instance for `#d1`
   *
   *   `await ch.locatorForOptional('div', DivHarness)()` 获取 `#d1` `TestElement` 实例
   *
   * - `await ch.locatorForOptional('span')()` gets `null`.
   *
   *   `await ch.locatorForOptional('span')()` 得到 `null`。
   *
   */
  protected locatorForOptional<T extends (HarnessQuery<any> | string)[]>(
    ...queries: T
  ): AsyncFactoryFn<LocatorFnResult<T> | null> {
    return this.locatorFactory.locatorForOptional(...queries);
  }

  /**
   * Creates an asynchronous locator function that can be used to find `ComponentHarness` instances
   * or elements under the host element of this `ComponentHarness`.
   *
   * 创建异步定位器函数，可用于查找此 `ComponentHarness` 的宿主元素下的 `ComponentHarness` 实例或元素。
   *
   * @param queries A list of queries specifying which harnesses and elements to search for:
   *
   * 一系列查询，用于指定要搜索的测试工具和元素：
   *
   * - A `string` searches for elements matching the CSS selector specified by the string.
   *
   *   `string` 搜索满足此字符串指定的 CSS 选择器的元素。
   *
   * - A `ComponentHarness` constructor searches for `ComponentHarness` instances matching the
   *   given class.
   *
   *   `ComponentHarness` 构造函数会搜索与指定类匹配的 `ComponentHarness` 实例。
   *
   * - A `HarnessPredicate` searches for `ComponentHarness` instances matching the given
   *   predicate.
   *
   *   `HarnessPredicate` 搜索满足指定谓词的 `ComponentHarness` 实例。
   *
   * @return An asynchronous locator function that searches for and returns a `Promise` for all
   *   elements and harnesses matching the given search criteria. Matches are ordered first by
   *   order in the DOM, and second by order in the queries list. If an element matches more than
   *   one `ComponentHarness` class, the locator gets an instance of each for the same element. If
   *   an element matches multiple `string` selectors, only one `TestElement` instance is returned
   *   for that element. The type that the `Promise` resolves to is an array where each element is
   *   the union of all result types for each query.
   *
   * 一个异步定位器函数，用于搜索并返回满足指定搜索条件的第一个元素或测试工具的 `Promise`。匹配结果首先按照 DOM 中的顺序排序，然后按在查询列表中的顺序排序。如果一个元素与多个 `ComponentHarness` 类匹配，那么该定位器会为同一个元素获取每个元素的实例。如果一个元素匹配多个 `string` 选择器，只会为它返回一个 `TestElement` 实例。`Promise` 解析成的类型是一个数组，其中每个元素都是每个查询的所有结果类型的并集。
   *
   * e.g. Given the following DOM: `<div id="d1" /><div id="d2" />`, and assuming
   * `DivHarness.hostSelector === 'div'` and `IdIsD1Harness.hostSelector === '#d1'`:
   *
   * 例如，指定以下 DOM： `<div id="d1" /><div id="d2" />`，并假设 `DivHarness.hostSelector === 'div'` 和 `IdIsD1Harness.hostSelector === '#d1'` ：
   *
   * - `await ch.locatorForAll(DivHarness, 'div')()` gets `[
   *     DivHarness, // for #d1
   *     TestElement, // for #d1
   *     DivHarness, // for #d2
   *     TestElement // for #d2
   *   ]`
   *
   * - `await ch.locatorForAll('div', '#d1')()` gets `[
   *     TestElement, // for #d1
   *     TestElement // for #d2
   *   ]`
   *
   * - `await ch.locatorForAll(DivHarness, IdIsD1Harness)()` gets `[
   *     DivHarness, // for #d1
   *     IdIsD1Harness, // for #d1
   *     DivHarness // for #d2
   *   ]`
   *
   * - `await ch.locatorForAll('span')()` gets `[]`.
   *
   *   `await ch.locatorForAll('span')()` 会得到 `[]`。
   *
   */
  protected locatorForAll<T extends (HarnessQuery<any> | string)[]>(
    ...queries: T
  ): AsyncFactoryFn<LocatorFnResult<T>[]> {
    return this.locatorFactory.locatorForAll(...queries);
  }

  /**
   * Flushes change detection and async tasks in the Angular zone.
   * In most cases it should not be necessary to call this manually. However, there may be some edge
   * cases where it is needed to fully flush animation events.
   *
   * 刷新 Angular 中的变更检测和异步任务。在大多数情况下，没有必要手动调用它。但是，可能会出现一些需要完全刷新动画事件的边缘情况。
   *
   */
  protected async forceStabilize() {
    return this.locatorFactory.forceStabilize();
  }

  /**
   * Waits for all scheduled or running async tasks to complete. This allows harness
   * authors to wait for async tasks outside of the Angular zone.
   *
   * 等待所有已计划或正在运行的异步任务完成。这使测试工具作者可以在 Angular Zone 之外等待异步任务。
   *
   */
  protected async waitForTasksOutsideAngular() {
    return this.locatorFactory.waitForTasksOutsideAngular();
  }
}

/**
 * Base class for component harnesses that authors should extend if they anticipate that consumers
 * of the harness may want to access other harnesses within the `<ng-content>` of the component.
 *
 * 作者们应该扩展的组件测试工具的基类，如果他们预计测试工具的消费者可能要在该组件的 `<ng-content>` 中访问其它测试工具。
 *
 */
export abstract class ContentContainerComponentHarness<S extends string = string>
  extends ComponentHarness
  implements HarnessLoader
{
  async getChildLoader(selector: S): Promise<HarnessLoader> {
    return (await this.getRootHarnessLoader()).getChildLoader(selector);
  }

  async getAllChildLoaders(selector: S): Promise<HarnessLoader[]> {
    return (await this.getRootHarnessLoader()).getAllChildLoaders(selector);
  }

  async getHarness<T extends ComponentHarness>(query: HarnessQuery<T>): Promise<T> {
    return (await this.getRootHarnessLoader()).getHarness(query);
  }

  async getHarnessOrNull<T extends ComponentHarness>(query: HarnessQuery<T>): Promise<T | null> {
    return (await this.getRootHarnessLoader()).getHarnessOrNull(query);
  }

  async getAllHarnesses<T extends ComponentHarness>(query: HarnessQuery<T>): Promise<T[]> {
    return (await this.getRootHarnessLoader()).getAllHarnesses(query);
  }

  async hasHarness<T extends ComponentHarness>(query: HarnessQuery<T>): Promise<boolean> {
    return (await this.getRootHarnessLoader()).hasHarness(query);
  }

  /**
   * Gets the root harness loader from which to start
   * searching for content contained by this harness.
   *
   * 获取根测试工具加载器，从中开始搜索该测试工具所包含的内容。
   *
   */
  protected async getRootHarnessLoader(): Promise<HarnessLoader> {
    return this.locatorFactory.rootHarnessLoader();
  }
}

/**
 * Constructor for a ComponentHarness subclass.
 *
 * ComponentHarness 子类的构造方法。
 *
 */
export interface ComponentHarnessConstructor<T extends ComponentHarness> {
  new (locatorFactory: LocatorFactory): T;

  /**
   * `ComponentHarness` subclasses must specify a static `hostSelector` property that is used to
   * find the host element for the corresponding component. This property should match the selector
   * for the Angular component.
   *
   * `ComponentHarness` 子类必须指定一个静态的 `hostSelector` 属性，用于查找对应组件的宿主元素。该属性应与 Angular 组件的选择器匹配。
   *
   */
  hostSelector: string;
}

/**
 * A set of criteria that can be used to filter a list of `ComponentHarness` instances.
 *
 * 一组可以用来过滤 `ComponentHarness` 实例列表的条件。
 *
 */
export interface BaseHarnessFilters {
  /**
   * Only find instances whose host element matches the given selector.
   *
   * 只查找那些宿主元素与指定选择器匹配的实例。
   *
   */
  selector?: string;
  /**
   * Only find instances that are nested under an element with the given selector.
   *
   * 只查找嵌套在具有指定选择器的元素下的实例。
   *
   */
  ancestor?: string;
}

/**
 * A class used to associate a ComponentHarness class with predicates functions that can be used to
 * filter instances of the class.
 *
 * 用于把 ComponentHarness 类与过滤该类实例的谓词函数相关联的类。
 *
 */
export class HarnessPredicate<T extends ComponentHarness> {
  private _predicates: AsyncPredicate<T>[] = [];
  private _descriptions: string[] = [];
  private _ancestor: string;

  constructor(public harnessType: ComponentHarnessConstructor<T>, options: BaseHarnessFilters) {
    this._addBaseOptions(options);
  }

  /**
   * Checks if the specified nullable string value matches the given pattern.
   *
   * 检查指定的可空字符串值是否与指定的模式匹配。
   *
   * @param value The nullable string value to check, or a Promise resolving to the
   *   nullable string value.
   *
   * 要检查的可空字符串值，或者解析为可空字符串值的 Promise 值。
   *
   * @param pattern The pattern the value is expected to match. If `pattern` is a string,
   *   `value` is expected to match exactly. If `pattern` is a regex, a partial match is
   *   allowed. If `pattern` is `null`, the value is expected to be `null`.
   *
   * 该值期望匹配的模式。如果 `pattern` 是一个字符串，那么该 `value` 肯定要完全匹配。如果 `pattern` 是正则表达式，则允许部分匹配。如果 `pattern` 为 `null`，则该值应为 `null`。
   *
   * @return Whether the value matches the pattern.
   *
   * 该值是否与该模式匹配。
   *
   */
  static async stringMatches(
    value: string | null | Promise<string | null>,
    pattern: string | RegExp | null,
  ): Promise<boolean> {
    value = await value;
    if (pattern === null) {
      return value === null;
    } else if (value === null) {
      return false;
    }
    return typeof pattern === 'string' ? value === pattern : pattern.test(value);
  }

  /**
   * Adds a predicate function to be run against candidate harnesses.
   *
   * 添加谓词函数来筛选候选工具。
   *
   * @param description A description of this predicate that may be used in error messages.
   *
   * 该谓词的描述，可以用在错误信息中。
   *
   * @param predicate An async predicate function.
   *
   * 一个异步谓词函数。
   *
   * @return this (for method chaining).
   *
   * this（用于支持方法的链式调用）。
   *
   */
  add(description: string, predicate: AsyncPredicate<T>) {
    this._descriptions.push(description);
    this._predicates.push(predicate);
    return this;
  }

  /**
   * Adds a predicate function that depends on an option value to be run against candidate
   * harnesses. If the option value is undefined, the predicate will be ignored.
   *
   * 添加一个谓词函数，该函数取决于要对候选工具使用的选项值。如果该选项值未定义，那么该谓词就会被忽略。
   *
   * @param name The name of the option (may be used in error messages).
   *
   * 该选项的名字（可以在错误信息中使用）。
   *
   * @param option The option value.
   *
   * 选项的值。
   *
   * @param predicate The predicate function to run if the option value is not undefined.
   *
   * 如果选项值未定义，则要运行的谓词函数。
   *
   * @return this (for method chaining).
   *
   * this（用于支持方法的链式调用）。
   *
   */
  addOption<O>(name: string, option: O | undefined, predicate: AsyncOptionPredicate<T, O>) {
    if (option !== undefined) {
      this.add(`${name} = ${_valueAsString(option)}`, item => predicate(item, option));
    }
    return this;
  }

  /**
   * Filters a list of harnesses on this predicate.
   *
   * 使用此谓词过滤测试工具列表。
   *
   * @param harnesses The list of harnesses to filter.
   *
   * 要过滤的测试工具列表。
   *
   * @return A list of harnesses that satisfy this predicate.
   *
   * 一些满足此谓词的测试工具列表。
   *
   */
  async filter(harnesses: T[]): Promise<T[]> {
    if (harnesses.length === 0) {
      return [];
    }
    const results = await parallel(() => harnesses.map(h => this.evaluate(h)));
    return harnesses.filter((_, i) => results[i]);
  }

  /**
   * Evaluates whether the given harness satisfies this predicate.
   *
   * 评估指定的测试工具是否满足这个谓词。
   *
   * @param harness The harness to check
   *
   * 要检查的测试工具
   *
   * @return A promise that resolves to true if the harness satisfies this predicate,
   *   and resolves to false otherwise.
   *
   * 如果测试工具满足这个谓词就会返回一个解析成 true 的 Promise，否则返回解析成 false 的。
   *
   */
  async evaluate(harness: T): Promise<boolean> {
    const results = await parallel(() => this._predicates.map(p => p(harness)));
    return results.reduce((combined, current) => combined && current, true);
  }

  /**
   * Gets a description of this predicate for use in error messages.
   *
   * 获取此谓词的描述信息，以供在错误消息中使用。
   *
   */
  getDescription() {
    return this._descriptions.join(', ');
  }

  /**
   * Gets the selector used to find candidate elements.
   *
   * 获取用于查找候选元素的选择器。
   *
   */
  getSelector() {
    // We don't have to go through the extra trouble if there are no ancestors.
    if (!this._ancestor) {
      return (this.harnessType.hostSelector || '').trim();
    }

    const [ancestors, ancestorPlaceholders] = _splitAndEscapeSelector(this._ancestor);
    const [selectors, selectorPlaceholders] = _splitAndEscapeSelector(
      this.harnessType.hostSelector || '',
    );
    const result: string[] = [];

    // We have to add the ancestor to each part of the host compound selector, otherwise we can get
    // incorrect results. E.g. `.ancestor .a, .ancestor .b` vs `.ancestor .a, .b`.
    ancestors.forEach(escapedAncestor => {
      const ancestor = _restoreSelector(escapedAncestor, ancestorPlaceholders);
      return selectors.forEach(escapedSelector =>
        result.push(`${ancestor} ${_restoreSelector(escapedSelector, selectorPlaceholders)}`),
      );
    });

    return result.join(', ');
  }

  /**
   * Adds base options common to all harness types.
   *
   * 添加作用于所有测试工具类型的基本选项。
   *
   */
  private _addBaseOptions(options: BaseHarnessFilters) {
    this._ancestor = options.ancestor || '';
    if (this._ancestor) {
      this._descriptions.push(`has ancestor matching selector "${this._ancestor}"`);
    }
    const selector = options.selector;
    if (selector !== undefined) {
      this.add(`host matches selector "${selector}"`, async item => {
        return (await item.host()).matchesSelector(selector);
      });
    }
  }
}

/**
 * Represent a value as a string for the purpose of logging.
 *
 * 为了记录日志，把值表示为字符串。
 *
 */
function _valueAsString(value: unknown) {
  if (value === undefined) {
    return 'undefined';
  }
  try {
    // `JSON.stringify` doesn't handle RegExp properly, so we need a custom replacer.
    // Use a character that is unlikely to appear in real strings to denote the start and end of
    // the regex. This allows us to strip out the extra quotes around the value added by
    // `JSON.stringify`. Also do custom escaping on `"` characters to prevent `JSON.stringify`
    // from escaping them as if they were part of a string.
    const stringifiedValue = JSON.stringify(value, (_, v) =>
      v instanceof RegExp
        ? `◬MAT_RE_ESCAPE◬${v.toString().replace(/"/g, '◬MAT_RE_ESCAPE◬')}◬MAT_RE_ESCAPE◬`
        : v,
    );
    // Strip out the extra quotes around regexes and put back the manually escaped `"` characters.
    return stringifiedValue
      .replace(/"◬MAT_RE_ESCAPE◬|◬MAT_RE_ESCAPE◬"/g, '')
      .replace(/◬MAT_RE_ESCAPE◬/g, '"');
  } catch {
    // `JSON.stringify` will throw if the object is cyclical,
    // in this case the best we can do is report the value as `{...}`.
    return '{...}';
  }
}

/**
 * Splits up a compound selector into its parts and escapes any quoted content. The quoted content
 * has to be escaped, because it can contain commas which will throw throw us off when trying to
 * split it.
 *
 * 将复合选择器拆分为多个部分，并转义所有引用的内容。带引号的内容必须转义，因为它可能包含逗号，那样当尝试拆分内容时就会抛出错误。
 *
 * @param selector Selector to be split.
 *
 * 要拆分的选择器。
 *
 * @returns The escaped string where any quoted content is replaced with a placeholder. E.g.
 * `[foo="bar"]` turns into `[foo=__cdkPlaceholder-0__]`. Use `_restoreSelector` to restore
 * the placeholders.
 *
 * 已转义的字符串，其中任何引用的内容均会被占位符替换。例如 `[foo="bar"]` 变成 `[foo=__cdkPlaceholder-0__]`。使用 `_restoreSelector` 来还原占位符。
 *
 */
function _splitAndEscapeSelector(selector: string): [parts: string[], placeholders: string[]] {
  const placeholders: string[] = [];

  // Note that the regex doesn't account for nested quotes so something like `"ab'cd'e"` will be
  // considered as two blocks. It's a bit of an edge case, but if we find that it's a problem,
  // we can make it a bit smarter using a loop. Use this for now since it's more readable and
  // compact. More complete implementation:
  // https://github.com/angular/angular/blob/bd34bc9e89f18a/packages/compiler/src/shadow_css.ts#L655
  const result = selector.replace(/(["'][^["']*["'])/g, (_, keep) => {
    const replaceBy = `__cdkPlaceholder-${placeholders.length}__`;
    placeholders.push(keep);
    return replaceBy;
  });

  return [result.split(',').map(part => part.trim()), placeholders];
}

/**
 * Restores a selector whose content was escaped in `_splitAndEscapeSelector`.
 *
 * 还原某个选择器，该选择器的内容已在 `_splitAndEscapeSelector` 中转义。
 *
 */
function _restoreSelector(selector: string, placeholders: string[]): string {
  return selector.replace(/__cdkPlaceholder-(\d+)__/g, (_, index) => placeholders[+index]);
}
