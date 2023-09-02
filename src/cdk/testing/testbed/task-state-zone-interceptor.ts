/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {BehaviorSubject, Observable} from 'rxjs';
import {ProxyZone, ProxyZoneStatic} from './proxy-zone-types';

/**
 * Current state of the intercepted zone.
 *
 * 拦截 zone 的当前状态。
 *
 */
export interface TaskState {
  /**
   * Whether the zone is stable \(i.e. no microtasks and macrotasks\).
   *
   * zone 是否稳定（即没有微任务和宏任务）。
   *
   */
  stable: boolean;
}

/**
 * Unique symbol that is used to patch a property to a proxy zone.
 *
 * 用于将属性 patch 到代理 zone 的唯一符号。
 *
 */
const stateObservableSymbol = Symbol('ProxyZone_PATCHED#stateObservable');

/**
 * Type that describes a potentially patched proxy zone instance.
 *
 * 描述潜在 patch 的代理 zone 实例的类型。
 *
 */
type PatchedProxyZone = ProxyZone & {
  [stateObservableSymbol]: undefined | Observable<TaskState>;
};

/**
 * Interceptor that can be set up in a `ProxyZone` instance. The interceptor
 * will keep track of the task state and emit whenever the state changes.
 *
 * `ProxyZone` 实例中设置的拦截器。拦截器将跟踪任务状态，并在状态改变时发出。
 *
 * This serves as a workaround for https://github.com/angular/angular/issues/32896.
 *
 * 这是解决 https://github.com/angular/angular/issues/32896 的变通方法。
 *
 */
export class TaskStateZoneInterceptor {
  /**
   * Subject that can be used to emit a new state change.
   *
   * 可用于发出新状态更改的主体对象。
   *
   */
  private readonly _stateSubject = new BehaviorSubject<TaskState>(
    this._lastState ? this._getTaskStateFromInternalZoneState(this._lastState) : {stable: true},
  );

  /**
   * Public observable that emits whenever the task state changes.
   *
   * 任务状态更改时发出通知的公共可观察对象。
   *
   */
  readonly state: Observable<TaskState> = this._stateSubject;

  constructor(private _lastState: HasTaskState | null) {}

  /**
   * This will be called whenever the task state changes in the intercepted zone.
   *
   * 每当任务状态拦截 zone 中的更改时，将调用此方法。
   *
   */
  onHasTask(delegate: ZoneDelegate, current: Zone, target: Zone, hasTaskState: HasTaskState) {
    if (current === target) {
      this._stateSubject.next(this._getTaskStateFromInternalZoneState(hasTaskState));
    }
  }

  /**
   * Gets the task state from the internal ZoneJS task state.
   *
   * 从内部 ZoneJS 任务状态获取任务状态。
   *
   */
  private _getTaskStateFromInternalZoneState(state: HasTaskState): TaskState {
    return {stable: !state.macroTask && !state.microTask};
  }

  /**
   * Sets up the custom task state Zone interceptor in the  `ProxyZone`. Throws if
   * no `ProxyZone` could be found.
   *
   * 在 `ProxyZone` 中设置自定义任务状态区域拦截器。`ProxyZone` 抛出该异常。
   *
   * @returns an observable that emits whenever the task state changes.
   *
   * 任务状态更改时发出的可观察对象。
   *
   */
  static setup(): Observable<TaskState> {
    if (Zone === undefined) {
      throw Error(
        'Could not find ZoneJS. For test harnesses running in TestBed, ' +
          'ZoneJS needs to be installed.',
      );
    }

    // tslint:disable-next-line:variable-name
    const ProxyZoneSpec = (Zone as any)['ProxyZoneSpec'] as ProxyZoneStatic | undefined;

    // If there is no "ProxyZoneSpec" installed, we throw an error and recommend
    // setting up the proxy zone by pulling in the testing bundle.
    if (!ProxyZoneSpec) {
      throw Error(
        'ProxyZoneSpec is needed for the test harnesses but could not be found. ' +
          'Please make sure that your environment includes zone.js/dist/zone-testing.js',
      );
    }

    // Ensure that there is a proxy zone instance set up, and get
    // a reference to the instance if present.
    const zoneSpec = ProxyZoneSpec.assertPresent() as PatchedProxyZone;

    // If there already is a delegate registered in the proxy zone, and it
    // is type of the custom task state interceptor, we just use that state
    // observable. This allows us to only intercept Zone once per test
    // (similar to how `fakeAsync` or `async` work).
    if (zoneSpec[stateObservableSymbol]) {
      return zoneSpec[stateObservableSymbol]!;
    }

    // Since we intercept on environment creation and the fixture has been
    // created before, we might have missed tasks scheduled before. Fortunately
    // the proxy zone keeps track of the previous task state, so we can just pass
    // this as initial state to the task zone interceptor.
    const interceptor = new TaskStateZoneInterceptor(zoneSpec.lastTaskState);
    const zoneSpecOnHasTask = zoneSpec.onHasTask.bind(zoneSpec);

    // We setup the task state interceptor in the `ProxyZone`. Note that we cannot register
    // the interceptor as a new proxy zone delegate because it would mean that other zone
    // delegates (e.g. `FakeAsyncTestZone` or `AsyncTestZone`) can accidentally overwrite/disable
    // our interceptor. Since we just intend to monitor the task state of the proxy zone, it is
    // sufficient to just patch the proxy zone. This also avoids that we interfere with the task
    // queue scheduling logic.
    zoneSpec.onHasTask = function (...args: [ZoneDelegate, Zone, Zone, HasTaskState]) {
      zoneSpecOnHasTask(...args);
      interceptor.onHasTask(...args);
    };

    return (zoneSpec[stateObservableSymbol] = interceptor.state);
  }
}
