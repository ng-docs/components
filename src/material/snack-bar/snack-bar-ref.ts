/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {OverlayRef} from '@angular/cdk/overlay';
import {Observable, Subject} from 'rxjs';
import {_SnackBarContainer} from './snack-bar-container';

/**
 * Event that is emitted when a snack bar is dismissed.
 *
 * 快餐栏被关闭时发生的事件。
 *
 */
export interface MatSnackBarDismiss {
  /**
   * Whether the snack bar was dismissed using the action button.
   *
   * 快餐栏是否被动作按钮关闭了。
   *
   */
  dismissedByAction: boolean;
}

/**
 * Maximum amount of milliseconds that can be passed into setTimeout.
 *
 * 可以传入 setTimeout 的最大毫秒数。
 *
 */
const MAX_TIMEOUT = Math.pow(2, 31) - 1;

/**
 * Reference to a snack bar dispatched from the snack bar service.
 *
 * 到快餐栏服务派发出的快餐栏的引用。
 *
 */
export class MatSnackBarRef<T> {
  /**
   * The instance of the component making up the content of the snack bar.
   *
   * 该组件的实例构成了快餐栏的内容。
   *
   */
  instance: T;

  /**
   * The instance of the component making up the content of the snack bar.
   *
   * 该组件的实例构成了快餐栏的内容。
   *
   * @docs-private
   */
  containerInstance: _SnackBarContainer;

  /**
   * Subject for notifying the user that the snack bar has been dismissed.
   *
   * 用于通知用户快餐栏已被关闭的主体对象。
   *
   */
  private readonly _afterDismissed = new Subject<MatSnackBarDismiss>();

  /**
   * Subject for notifying the user that the snack bar has opened and appeared.
   *
   * 用于通知用户快餐栏已打开并出现的主体对象。
   *
   */
  private readonly _afterOpened = new Subject<void>();

  /**
   * Subject for notifying the user that the snack bar action was called.
   *
   * 用于通知用户快餐栏动作已被调用的主体对象。
   *
   */
  private readonly _onAction = new Subject<void>();

  /**
   * Timeout ID for the duration setTimeout call. Used to clear the timeout if the snackbar is
   * dismissed before the duration passes.
   *
   * setTimeout 调用的超时 ID。如果快餐栏在持续时间过去之前被关闭了，就用它来清理超时。
   *
   */
  private _durationTimeoutId: number;

  /**
   * Whether the snack bar was dismissed using the action button.
   *
   * 快餐栏是否被动作按钮关闭了。
   *
   */
  private _dismissedByAction = false;

  constructor(containerInstance: _SnackBarContainer,
              private _overlayRef: OverlayRef) {
    this.containerInstance = containerInstance;
    // Dismiss snackbar on action.
    this.onAction().subscribe(() => this.dismiss());
    containerInstance._onExit.subscribe(() => this._finishDismiss());
  }

  /**
   * Dismisses the snack bar.
   *
   * 关闭快餐栏。
   *
   */
  dismiss(): void {
    if (!this._afterDismissed.closed) {
      this.containerInstance.exit();
    }
    clearTimeout(this._durationTimeoutId);
  }

  /**
   * Marks the snackbar action clicked.
   *
   * 标记某个快餐栏动作被点击过。
   *
   */
  dismissWithAction(): void {
    if (!this._onAction.closed) {
      this._dismissedByAction = true;
      this._onAction.next();
      this._onAction.complete();
    }
  }

  /**
   * Marks the snackbar action clicked.
   *
   * 标记某个快餐栏动作被点击过。
   *
   * @deprecated Use `dismissWithAction` instead.
   * @breaking-change 8.0.0
   */
  closeWithAction(): void {
    this.dismissWithAction();
  }

  /**
   * Dismisses the snack bar after some duration
   *
   * 经过一段时间后，关闭快餐栏
   *
   */
  _dismissAfter(duration: number): void {
    // Note that we need to cap the duration to the maximum value for setTimeout, because
    // it'll revert to 1 if somebody passes in something greater (e.g. `Infinity`). See #17234.
    this._durationTimeoutId = setTimeout(() => this.dismiss(), Math.min(duration, MAX_TIMEOUT));
  }

  /**
   * Marks the snackbar as opened
   *
   * 把快餐吧标记为已打开
   *
   */
  _open(): void {
    if (!this._afterOpened.closed) {
      this._afterOpened.next();
      this._afterOpened.complete();
    }
  }

  /**
   * Cleans up the DOM after closing.
   *
   * 关闭之后清理 DOM。
   *
   */
  private _finishDismiss(): void {
    this._overlayRef.dispose();

    if (!this._onAction.closed) {
      this._onAction.complete();
    }

    this._afterDismissed.next({dismissedByAction: this._dismissedByAction});
    this._afterDismissed.complete();
    this._dismissedByAction = false;
  }

  /**
   * Gets an observable that is notified when the snack bar is finished closing.
   *
   * 获取一个当快餐栏结束时会得到通知的可观察对象。
   *
   */
  afterDismissed(): Observable<MatSnackBarDismiss> {
    return this._afterDismissed;
  }

  /**
   * Gets an observable that is notified when the snack bar has opened and appeared.
   *
   * 获取一个可观察对象，当快餐栏已经打开并出现时，会通知它。
   *
   */
  afterOpened(): Observable<void> {
    return this.containerInstance._onEnter;
  }

  /**
   * Gets an observable that is notified when the snack bar action is called.
   *
   * 获取一个会在调用小吃条动作时得到通知的可观察对象。
   *
   */
  onAction(): Observable<void> {
    return this._onAction;
  }
}
