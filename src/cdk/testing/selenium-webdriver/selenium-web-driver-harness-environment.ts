/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {HarnessEnvironment, HarnessLoader, TestElement} from '@angular/cdk/testing';
import * as webdriver from 'selenium-webdriver';
import {SeleniumWebDriverElement} from './selenium-web-driver-element';

/**
 * An Angular framework stabilizer function that takes a callback and calls it when the application
 * is stable, passing a boolean indicating if any work was done.
 *
 * 一个 Angular 框架的稳定器函数，该函数会接受回调并在应用程序进入稳定态时调用它，并传递一个布尔值参数，表示是否已完成任何工作。
 *
 */
declare interface FrameworkStabilizer {
  (callback: (didWork: boolean) => void): void;
}

declare global {
  interface Window {
    /**
     * These hooks are exposed by Angular to register a callback for when the application is stable
     * (no more pending tasks).
     *
     * 这些挂钩是由 Angular 暴露出来的，以在应用程序稳定时（没有更多未决任务）注册回调。
     *
     * For the implementation, see: https://github.com/
     *  angular/angular/blob/main/packages/platform-browser/src/browser/testability.ts#L30-L49
     *
     * 有关实现，请参见：https://github.com/angular/angular/blob/main/packages/platform-browser/src/browser/testability.ts#L30-L49
     *
     */
    frameworkStabilizers: FrameworkStabilizer[];
  }
}

/**
 * Options to configure the environment.
 *
 * 用于配置环境的选项。
 *
 */
export interface WebDriverHarnessEnvironmentOptions {
  /**
   * The query function used to find DOM elements.
   *
   * 用于查找 DOM 元素的查询功能。
   *
   */
  queryFn: (selector: string, root: () => webdriver.WebElement) => Promise<webdriver.WebElement[]>;
}

/**
 * The default environment options.
 *
 * 默认环境选项。
 *
 */
const defaultEnvironmentOptions: WebDriverHarnessEnvironmentOptions = {
  queryFn: async (selector: string, root: () => webdriver.WebElement) =>
    root().findElements(webdriver.By.css(selector)),
};

/**
 * This function is meant to be executed in the browser. It taps into the hooks exposed by Angular
 * and invokes the specified `callback` when the application is stable (no more pending tasks).
 *
 * 该函数应在浏览器中执行。它会利用 Angular 公开的钩子，并在应用程序进入稳定态时（不再有待处理的任务）调用这个 `callback`。
 *
 */
function whenStable(callback: (didWork: boolean[]) => void): void {
  Promise.all(window.frameworkStabilizers.map(stabilizer => new Promise(stabilizer))).then(
    callback,
  );
}

/**
 * This function is meant to be executed in the browser. It checks whether the Angular framework has
 * bootstrapped yet.
 *
 * 该函数应在浏览器中执行。它检查 Angular 框架是否已经启动。
 *
 */
function isBootstrapped() {
  return !!window.frameworkStabilizers;
}

/**
 * Waits for angular to be ready after the page load.
 *
 * 在页面加载后等待 Angular 准备就绪。
 *
 */
export async function waitForAngularReady(wd: webdriver.WebDriver) {
  await wd.wait(() => wd.executeScript(isBootstrapped));
  await wd.executeAsyncScript(whenStable);
}

/**
 * A `HarnessEnvironment` implementation for WebDriver.
 *
 * WebDriver 的 `HarnessEnvironment` 实现。
 *
 */
export class SeleniumWebDriverHarnessEnvironment extends HarnessEnvironment<
  () => webdriver.WebElement
> {
  /**
   * The options for this environment.
   *
   * 此环境的选项。
   *
   */
  private _options: WebDriverHarnessEnvironmentOptions;

  /**
   * Environment stabilization callback passed to the created test elements.
   *
   * 环境稳定时回调并传入已创建的测试元素。
   *
   */
  private _stabilizeCallback: () => Promise<void>;

  protected constructor(
    rawRootElement: () => webdriver.WebElement,
    options?: WebDriverHarnessEnvironmentOptions,
  ) {
    super(rawRootElement);
    this._options = {...defaultEnvironmentOptions, ...options};
    this._stabilizeCallback = () => this.forceStabilize();
  }

  /**
   * Gets the ElementFinder corresponding to the given TestElement.
   *
   * 获取与给定 TestElement 对应的 ElementFinder。
   *
   */
  static getNativeElement(el: TestElement): webdriver.WebElement {
    if (el instanceof SeleniumWebDriverElement) {
      return el.element();
    }
    throw Error('This TestElement was not created by the WebDriverHarnessEnvironment');
  }

  /**
   * Creates a `HarnessLoader` rooted at the document root.
   *
   * 创建一个以本文档的根元素为根的 `HarnessLoader`。
   *
   */
  static loader(
    driver: webdriver.WebDriver,
    options?: WebDriverHarnessEnvironmentOptions,
  ): HarnessLoader {
    return new SeleniumWebDriverHarnessEnvironment(
      () => driver.findElement(webdriver.By.css('body')),
      options,
    );
  }

  /**
   * Flushes change detection and async tasks captured in the Angular zone.
   * In most cases it should not be necessary to call this manually. However, there may be some edge
   * cases where it is needed to fully flush animation events.
   *
   * 刷新在 Angular Zone 中捕获的变更检测和异步任务。在大多数情况下，没有必要手动调用此方法。但是，在某些极端情况下，需要完全刷新动画事件。
   *
   */
  async forceStabilize(): Promise<void> {
    await this.rawRootElement().getDriver().executeAsyncScript(whenStable);
  }

  /** @docs-private */
  async waitForTasksOutsideAngular(): Promise<void> {
    // TODO: figure out how we can do this for the webdriver environment.
    //  https://github.com/angular/components/issues/17412
  }

  /**
   * Gets the root element for the document.
   *
   * 获取此文档的根元素。
   *
   */
  protected getDocumentRoot(): () => webdriver.WebElement {
    return () => this.rawRootElement().getDriver().findElement(webdriver.By.css('body'));
  }

  /**
   * Creates a `TestElement` from a raw element.
   *
   * 从原始元素创建一个 `TestElement`。
   *
   */
  protected createTestElement(element: () => webdriver.WebElement): TestElement {
    return new SeleniumWebDriverElement(element, this._stabilizeCallback);
  }

  /**
   * Creates a `HarnessLoader` rooted at the given raw element.
   *
   * 创建一个以给定的原始元素为根的 `HarnessLoader`。
   *
   */
  protected createEnvironment(
    element: () => webdriver.WebElement,
  ): HarnessEnvironment<() => webdriver.WebElement> {
    return new SeleniumWebDriverHarnessEnvironment(element, this._options);
  }

  // Note: This seems to be working, though we may need to re-evaluate if we encounter issues with
  // stale element references. `() => Promise<webdriver.WebElement[]>` seems like a more correct
  // return type, though supporting it would require changes to the public harness API.
  /**
   * Gets a list of all elements matching the given selector under this environment's root element.
   *
   * 获取此环境的根元素下与给定选择器匹配的所有元素的列表。
   *
   */
  protected async getAllRawElements(selector: string): Promise<(() => webdriver.WebElement)[]> {
    const els = await this._options.queryFn(selector, this.rawRootElement);
    return els.map((x: webdriver.WebElement) => () => x);
  }
}
