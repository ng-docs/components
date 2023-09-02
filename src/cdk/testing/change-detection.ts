/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {BehaviorSubject, Subscription} from 'rxjs';

/**
 * Represents the status of auto change detection.
 *
 * 表示自动变更检测的状态。
 *
 */
export interface AutoChangeDetectionStatus {
  /**
   * Whether auto change detection is disabled.
   *
   * 是否禁用了自动变更检测功能。
   *
   */
  isDisabled: boolean;
  /**
   * An optional callback, if present it indicates that change detection should be run immediately,
   * while handling the status change. The callback should then be called as soon as change
   * detection is done.
   *
   * 一个可选的回调函数（如果有的话）表明在处理状态变化时，是否应该立即运行变更检测。变量检测一旦完成就应该调用此回调函数。
   *
   */
  onDetectChangesNow?: () => void;
}

/**
 * Subject used to dispatch and listen for changes to the auto change detection status .
 *
 * 一个主体对象，用于派发和监听自动变更检测状态的变化。
 *
 */
const autoChangeDetectionSubject = new BehaviorSubject<AutoChangeDetectionStatus>({
  isDisabled: false,
});

/**
 * The current subscription to `autoChangeDetectionSubject`.
 *
 * 当前对 `autoChangeDetectionSubject` 订阅。
 *
 */
let autoChangeDetectionSubscription: Subscription | null;

/**
 * The default handler for auto change detection status changes. This handler will be used if the
 * specific environment does not install its own.
 *
 * 自动变更检测状态变化的默认处理器。如果特定环境中没有安装自己的处理程序，就会使用这个处理程序。
 *
 * @param status The new auto change detection status.
 *
 * 新的自动变更检测状态。
 *
 */
function defaultAutoChangeDetectionHandler(status: AutoChangeDetectionStatus) {
  status.onDetectChangesNow?.();
}

/**
 * Allows a test `HarnessEnvironment` to install its own handler for auto change detection status
 * changes.
 *
 * 允许测试 `HarnessEnvironment` 安装自己的处理程序，以便自动更改变更检测状态。
 *
 * @param handler The handler for the auto change detection status.
 *
 * 自动变更检测状态的处理程序。
 *
 */
export function handleAutoChangeDetectionStatus(
  handler: (status: AutoChangeDetectionStatus) => void,
) {
  stopHandlingAutoChangeDetectionStatus();
  autoChangeDetectionSubscription = autoChangeDetectionSubject.subscribe(handler);
}

/**
 * Allows a `HarnessEnvironment` to stop handling auto change detection status changes.
 *
 * 允许 `HarnessEnvironment` 停止自动处理变更检测的状态变化。
 *
 */
export function stopHandlingAutoChangeDetectionStatus() {
  autoChangeDetectionSubscription?.unsubscribe();
  autoChangeDetectionSubscription = null;
}

/**
 * Batches together triggering of change detection over the duration of the given function.
 *
 * 在指定函数的持续时间内，批量触发变更检测。
 *
 * @param fn The function to call with batched change detection.
 *
 * 使用批量变更检测时要调用的函数。
 *
 * @param triggerBeforeAndAfter Optionally trigger change detection once before and after the batch
 *   operation. If false, change detection will not be triggered.
 *
 * （可选）是否要在批处理操作之前和之后触发一次变更检测。如果为 false，则不会触发变更检测。
 *
 * @return The result of the given function.
 *
 * 指定函数的结果。
 *
 */
async function batchChangeDetection<T>(fn: () => Promise<T>, triggerBeforeAndAfter: boolean) {
  // If change detection batching is already in progress, just run the function.
  if (autoChangeDetectionSubject.getValue().isDisabled) {
    return await fn();
  }

  // If nothing is handling change detection batching, install the default handler.
  if (!autoChangeDetectionSubscription) {
    handleAutoChangeDetectionStatus(defaultAutoChangeDetectionHandler);
  }

  if (triggerBeforeAndAfter) {
    await new Promise(resolve =>
      autoChangeDetectionSubject.next({
        isDisabled: true,
        onDetectChangesNow: resolve as () => void,
      }),
    );
    // The function passed in may throw (e.g. if the user wants to make an expectation of an error
    // being thrown. If this happens, we need to make sure we still re-enable change detection, so
    // we wrap it in a `finally` block.
    try {
      return await fn();
    } finally {
      await new Promise(resolve =>
        autoChangeDetectionSubject.next({
          isDisabled: false,
          onDetectChangesNow: resolve as () => void,
        }),
      );
    }
  } else {
    autoChangeDetectionSubject.next({isDisabled: true});
    // The function passed in may throw (e.g. if the user wants to make an expectation of an error
    // being thrown. If this happens, we need to make sure we still re-enable change detection, so
    // we wrap it in a `finally` block.
    try {
      return await fn();
    } finally {
      autoChangeDetectionSubject.next({isDisabled: false});
    }
  }
}

/**
 * Disables the harness system's auto change detection for the duration of the given function.
 *
 * 在指定函数的持续时间内，禁用测试工具体系的自动变更检测功能。
 *
 * @param fn The function to disable auto change detection for.
 *
 * 禁用自动变更检测的功能。
 *
 * @return The result of the given function.
 *
 * 指定函数的结果。
 *
 */
export async function manualChangeDetection<T>(fn: () => Promise<T>) {
  return batchChangeDetection(fn, false);
}

/**
 * Resolves the given list of async values in parallel \(i.e. via Promise.all\) while batching change
 * detection over the entire operation such that change detection occurs exactly once before
 * resolving the values and once after.
 *
 * 并行（即通过 Promise.all）解析指定的异步值列表，同时对整个操作进行批量变更检测，以便在解析值前后，变更检测只各发生一次。
 *
 * @param values A getter for the async values to resolve in parallel with batched change detection.
 *
 * 异步值的 getter，用于在批量变更检测时并行解析。
 * @return The resolved values.
 *
 * 已解析的值。
 */
export function parallel<T1, T2, T3, T4, T5>(
  values: () => [
    T1 | PromiseLike<T1>,
    T2 | PromiseLike<T2>,
    T3 | PromiseLike<T3>,
    T4 | PromiseLike<T4>,
    T5 | PromiseLike<T5>,
  ],
): Promise<[T1, T2, T3, T4, T5]>;

/**
 * Resolves the given list of async values in parallel \(i.e. via Promise.all\) while batching change
 * detection over the entire operation such that change detection occurs exactly once before
 * resolving the values and once after.
 *
 * 并行（即通过 Promise.all）解析指定的异步值列表，同时对整个操作进行批量变更检测，以便在解析值前后，变更检测只各发生一次。
 *
 * @param values A getter for the async values to resolve in parallel with batched change detection.
 *
 * 异步值的 getter，用于在批量变更检测时并行解析。
 * @return The resolved values.
 *
 * 已解析的值。
 */
export function parallel<T1, T2, T3, T4>(
  values: () => [
    T1 | PromiseLike<T1>,
    T2 | PromiseLike<T2>,
    T3 | PromiseLike<T3>,
    T4 | PromiseLike<T4>,
  ],
): Promise<[T1, T2, T3, T4]>;

/**
 * Resolves the given list of async values in parallel \(i.e. via Promise.all\) while batching change
 * detection over the entire operation such that change detection occurs exactly once before
 * resolving the values and once after.
 *
 * 并行（即通过 Promise.all）解析指定的异步值列表，同时对整个操作进行批量变更检测，以便在解析值前后，变更检测只各发生一次。
 *
 * @param values A getter for the async values to resolve in parallel with batched change detection.
 *
 * 异步值的 getter，用于在批量变更检测时并行解析。
 * @return The resolved values.
 *
 * 已解析的值。
 */
export function parallel<T1, T2, T3>(
  values: () => [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>],
): Promise<[T1, T2, T3]>;

/**
 * Resolves the given list of async values in parallel \(i.e. via Promise.all\) while batching change
 * detection over the entire operation such that change detection occurs exactly once before
 * resolving the values and once after.
 *
 * 并行（即通过 Promise.all）解析指定的异步值列表，同时对整个操作进行批量变更检测，以便在解析值前后，变更检测只各发生一次。
 *
 * @param values A getter for the async values to resolve in parallel with batched change detection.
 *
 * 异步值的 getter，用于在批量变更检测时并行解析。
 * @return The resolved values.
 *
 * 已解析的值。
 */
export function parallel<T1, T2>(
  values: () => [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>],
): Promise<[T1, T2]>;

/**
 * Resolves the given list of async values in parallel \(i.e. via Promise.all\) while batching change
 * detection over the entire operation such that change detection occurs exactly once before
 * resolving the values and once after.
 *
 * 并行（即通过 Promise.all）解析指定的异步值列表，同时对整个操作进行批量变更检测，以便在解析值前后，变更检测只各发生一次。
 *
 * @param values A getter for the async values to resolve in parallel with batched change detection.
 *
 * 异步值的 getter，用于在批量变更检测时并行解析。
 * @return The resolved values.
 *
 * 已解析的值。
 */
export function parallel<T>(values: () => (T | PromiseLike<T>)[]): Promise<T[]>;

/**
 * Resolves the given list of async values in parallel \(i.e. via Promise.all\) while batching change
 * detection over the entire operation such that change detection occurs exactly once before
 * resolving the values and once after.
 *
 * 并行解析给定的异步值列表（即通过 Promise.all），同时在整个操作中运行批量变更检测，以便在解析值之前和之后只发生一次变更检测。
 *
 * @param values A getter for the async values to resolve in parallel with batched change detection.
 *
 * 异步值的 getter，与批量变更检测并行解析。
 * @return The resolved values.
 *
 * 解析后的值。
 */
export async function parallel<T>(values: () => Iterable<T | PromiseLike<T>>): Promise<T[]> {
  return batchChangeDetection(() => Promise.all(values()), true);
}
