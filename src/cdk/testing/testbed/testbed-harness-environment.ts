/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  ComponentHarness,
  ComponentHarnessConstructor,
  handleAutoChangeDetectionStatus,
  HarnessEnvironment,
  HarnessLoader,
  stopHandlingAutoChangeDetectionStatus,
  TestElement,
} from '@angular/cdk/testing';
import {ComponentFixture, flush} from '@angular/core/testing';
import {Observable} from 'rxjs';
import {takeWhile} from 'rxjs/operators';
import {TaskState, TaskStateZoneInterceptor} from './task-state-zone-interceptor';
import {UnitTestElement} from './unit-test-element';

/**
 * Options to configure the environment.
 *
 * 用于配置环境的选项。
 *
 */
export interface TestbedHarnessEnvironmentOptions {
  /**
   * The query function used to find DOM elements.
   *
   * 用于查找 DOM 元素的查询功能。
   *
   */
  queryFn: (selector: string, root: Element) => Iterable<Element> | ArrayLike<Element>;
}

/**
 * The default environment options.
 *
 * 默认环境选项。
 *
 */
const defaultEnvironmentOptions: TestbedHarnessEnvironmentOptions = {
  queryFn: (selector: string, root: Element) => root.querySelectorAll(selector),
};

/**
 * Whether auto change detection is currently disabled.
 *
 * 当前是否禁用了自动变更检测。
 *
 */
let disableAutoChangeDetection = false;

/**
 * The set of non-destroyed fixtures currently being used by `TestbedHarnessEnvironment` instances.
 *
 * `TestbedHarnessEnvironment` 实例当前正在使用的一组不会销毁的测试夹具。
 *
 */
const activeFixtures = new Set<ComponentFixture<unknown>>();

/**
 * Installs a handler for change detection batching status changes for a specific fixture.
 *
 * 安装一个处理程序，用于特定夹具的批量状态变更的变更检测。
 *
 * @param fixture The fixture to handle change detection batching for.
 *
 * 用于处理批量变更检测的夹具。
 *
 */
function installAutoChangeDetectionStatusHandler(fixture: ComponentFixture<unknown>) {
  if (!activeFixtures.size) {
    handleAutoChangeDetectionStatus(({isDisabled, onDetectChangesNow}) => {
      disableAutoChangeDetection = isDisabled;
      if (onDetectChangesNow) {
        Promise.all(Array.from(activeFixtures).map(detectChanges)).then(onDetectChangesNow);
      }
    });
  }
  activeFixtures.add(fixture);
}

/**
 * Uninstalls a handler for change detection batching status changes for a specific fixture.
 *
 * 卸载处理程序，以更改特定夹具的变更检测批处理状态更改。
 *
 * @param fixture The fixture to stop handling change detection batching for.
 *
 * 该夹具停止处理批量变更检测。
 *
 */
function uninstallAutoChangeDetectionStatusHandler(fixture: ComponentFixture<unknown>) {
  activeFixtures.delete(fixture);
  if (!activeFixtures.size) {
    stopHandlingAutoChangeDetectionStatus();
  }
}

/**
 * Whether we are currently in the fake async zone.
 *
 * 我们当前是否位于伪异步区域中。
 *
 */
function isInFakeAsyncZone() {
  return Zone!.current.get('FakeAsyncTestZoneSpec') != null;
}

/**
 * Triggers change detection for a specific fixture.
 *
 * 触发特定测试夹具的变更检测。
 *
 * @param fixture The fixture to trigger change detection for.
 *
 * 触发变更检测的测试夹具。
 *
 */
async function detectChanges(fixture: ComponentFixture<unknown>) {
  fixture.detectChanges();
  if (isInFakeAsyncZone()) {
    flush();
  } else {
    await fixture.whenStable();
  }
}

/**
 * A `HarnessEnvironment` implementation for Angular's Testbed.
 *
 * Angular Testbed 的 `HarnessEnvironment` 实现。
 *
 */
export class TestbedHarnessEnvironment extends HarnessEnvironment<Element> {
  /**
   * Whether the environment has been destroyed.
   *
   * 环境是否已被销毁。
   *
   */
  private _destroyed = false;

  /**
   * Observable that emits whenever the test task state changes.
   *
   * 测试任务状态发生更改时发出事件的 Observable。
   *
   */
  private _taskState: Observable<TaskState>;

  /**
   * The options for this environment.
   *
   * 此环境的选项。
   *
   */
  private _options: TestbedHarnessEnvironmentOptions;

  /**
   * Environment stabilization callback passed to the created test elements.
   *
   * 环境稳定时回调并传入已创建的测试元素。
   *
   */
  private _stabilizeCallback: () => Promise<void>;

  protected constructor(
    rawRootElement: Element,
    private _fixture: ComponentFixture<unknown>,
    options?: TestbedHarnessEnvironmentOptions,
  ) {
    super(rawRootElement);
    this._options = {...defaultEnvironmentOptions, ...options};
    this._taskState = TaskStateZoneInterceptor.setup();
    this._stabilizeCallback = () => this.forceStabilize();
    installAutoChangeDetectionStatusHandler(_fixture);
    _fixture.componentRef.onDestroy(() => {
      uninstallAutoChangeDetectionStatusHandler(_fixture);
      this._destroyed = true;
    });
  }

  /**
   * Creates a `HarnessLoader` rooted at the given fixture's root element.
   *
   * 创建一个以给定夹具的根元素为根的 `HarnessLoader`。
   *
   */
  static loader(
    fixture: ComponentFixture<unknown>,
    options?: TestbedHarnessEnvironmentOptions,
  ): HarnessLoader {
    return new TestbedHarnessEnvironment(fixture.nativeElement, fixture, options);
  }

  /**
   * Creates a `HarnessLoader` at the document root. This can be used if harnesses are
   * located outside of a fixture \(e.g. overlays appended to the document body\).
   *
   * 在文档的根上创建一个 `HarnessLoader`。如果测试工具位于测试夹具之外（例如，附加在 document body 上的浮层），则可以使用此功能。
   *
   */
  static documentRootLoader(
    fixture: ComponentFixture<unknown>,
    options?: TestbedHarnessEnvironmentOptions,
  ): HarnessLoader {
    return new TestbedHarnessEnvironment(document.body, fixture, options);
  }

  /**
   * Gets the native DOM element corresponding to the given TestElement.
   *
   * 获取与给定 TestElement 对应的原生 DOM 元素。
   *
   */
  static getNativeElement(el: TestElement): Element {
    if (el instanceof UnitTestElement) {
      return el.element;
    }
    throw Error('This TestElement was not created by the TestbedHarnessEnvironment');
  }

  /**
   * Creates an instance of the given harness type, using the fixture's root element as the
   * harness's host element. This method should be used when creating a harness for the root element
   * of a fixture, as components do not have the correct selector when they are created as the root
   * of the fixture.
   *
   * 使用夹具的根元素作为测试工具的宿主元素，创建给定测试工具类型的实例。在为测试夹具的根元素创建测试工具时应使用此方法，因为当把组件创建为测试夹具的根时，它们没有正确的选择器。
   *
   */
  static async harnessForFixture<T extends ComponentHarness>(
    fixture: ComponentFixture<unknown>,
    harnessType: ComponentHarnessConstructor<T>,
    options?: TestbedHarnessEnvironmentOptions,
  ): Promise<T> {
    const environment = new TestbedHarnessEnvironment(fixture.nativeElement, fixture, options);
    await environment.forceStabilize();
    return environment.createComponentHarness(harnessType, fixture.nativeElement);
  }

  /**
   * Flushes change detection and async tasks captured in the Angular zone.
   * In most cases it should not be necessary to call this manually. However, there may be some edge
   * cases where it is needed to fully flush animation events.
   *
   * 刷新在 Angular Zone 中已捕获的变更检测和异步任务。在大多数情况下，没有必要手动调用此方法。但是，在某些极端情况下，需要完全刷新动画事件。
   *
   */
  async forceStabilize(): Promise<void> {
    if (!disableAutoChangeDetection) {
      if (this._destroyed) {
        throw Error('Harness is attempting to use a fixture that has already been destroyed.');
      }

      await detectChanges(this._fixture);
    }
  }

  /**
   * Waits for all scheduled or running async tasks to complete. This allows harness
   * authors to wait for async tasks outside of the Angular zone.
   *
   * 等待所有已计划或正在运行的异步任务完成。这使测试工具作者可以在 Angular Zone 之外等待异步任务。
   *
   */
  async waitForTasksOutsideAngular(): Promise<void> {
    // If we run in the fake async zone, we run "flush" to run any scheduled tasks. This
    // ensures that the harnesses behave inside of the FakeAsyncTestZone similar to the
    // "AsyncTestZone" and the root zone (i.e. neither fakeAsync or async). Note that we
    // cannot just rely on the task state observable to become stable because the state will
    // never change. This is because the task queue will be only drained if the fake async
    // zone is being flushed.
    if (isInFakeAsyncZone()) {
      flush();
    }

    // Wait until the task queue has been drained and the zone is stable. Note that
    // we cannot rely on "fixture.whenStable" since it does not catch tasks scheduled
    // outside of the Angular zone. For test harnesses, we want to ensure that the
    // app is fully stabilized and therefore need to use our own zone interceptor.
    await this._taskState.pipe(takeWhile(state => !state.stable)).toPromise();
  }

  /**
   * Gets the root element for the document.
   *
   * 获取文档的根元素。
   *
   */
  protected getDocumentRoot(): Element {
    return document.body;
  }

  /**
   * Creates a `TestElement` from a raw element.
   *
   * 从原始元素创建一个 `TestElement`。
   *
   */
  protected createTestElement(element: Element): TestElement {
    return new UnitTestElement(element, this._stabilizeCallback);
  }

  /**
   * Creates a `HarnessLoader` rooted at the given raw element.
   *
   * 创建一个以给定的原始元素为根的 `HarnessLoader`。
   *
   */
  protected createEnvironment(element: Element): HarnessEnvironment<Element> {
    return new TestbedHarnessEnvironment(element, this._fixture, this._options);
  }

  /**
   * Gets a list of all elements matching the given selector under this environment's root element.
   *
   * 获取此环境的根元素下与给定选择器匹配的所有元素的列表。
   *
   */
  protected async getAllRawElements(selector: string): Promise<Element[]> {
    await this.forceStabilize();
    return Array.from(this._options.queryFn(selector, this.rawRootElement));
  }
}
