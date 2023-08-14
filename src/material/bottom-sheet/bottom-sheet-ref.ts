/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ComponentRef} from '@angular/core';
import {DialogRef} from '@angular/cdk/dialog';
import {ESCAPE, hasModifierKey} from '@angular/cdk/keycodes';
import {merge, Observable, Subject} from 'rxjs';
import {filter, take} from 'rxjs/operators';
import {MatBottomSheetConfig} from './bottom-sheet-config';
import {MatBottomSheetContainer} from './bottom-sheet-container';

/**
 * Reference to a bottom sheet dispatched from the bottom sheet service.
 *
 * 引用来自底部操作表服务的底部操作表。
 *
 */
export class MatBottomSheetRef<T = any, R = any> {
  /**
   * Instance of the component making up the content of the bottom sheet.
   *
   * 该组件的实例组成了底部操作表的内容。
   *
   */
  get instance(): T {
    return this._ref.componentInstance!;
  }

  /**
   * `ComponentRef` of the component opened into the bottom sheet. Will be
   * null when the bottom sheet is opened using a `TemplateRef`.
   */
  get componentRef(): ComponentRef<T> | null {
    return this._ref.componentRef;
  }

  /**
   * Instance of the component into which the bottom sheet content is projected.
   *
   * 底部操作表内容被投影进的组件实例
   *
   * @docs-private
   */
  containerInstance: MatBottomSheetContainer;

  /**
   * Whether the user is allowed to close the bottom sheet.
   *
   * 是否允许用户关闭底部操作表。
   *
   */
  disableClose: boolean | undefined;

  /**
   * Subject for notifying the user that the bottom sheet has opened and appeared.
   *
   * 用于通知用户底部操作表已打开并出现的流。
   *
   */
  private readonly _afterOpened = new Subject<void>();

  /**
   * Result to be passed down to the `afterDismissed` stream.
   *
   * 要传递给 `afterDismissed` 流的结果。
   *
   */
  private _result: R | undefined;

  /**
   * Handle to the timeout that's running as a fallback in case the exit animation doesn't fire.
   *
   * 在退出动画未触发的情况下，要超时多久才改用回退逻辑进行处理。
   *
   */
  private _closeFallbackTimeout: number;

  constructor(
    private _ref: DialogRef<R, T>,
    config: MatBottomSheetConfig,
    containerInstance: MatBottomSheetContainer,
  ) {
    this.containerInstance = containerInstance;
    this.disableClose = config.disableClose;

    // Emit when opening animation completes
    containerInstance._animationStateChanged
      .pipe(
        filter(event => event.phaseName === 'done' && event.toState === 'visible'),
        take(1),
      )
      .subscribe(() => {
        this._afterOpened.next();
        this._afterOpened.complete();
      });

    // Dispose overlay when closing animation is complete
    containerInstance._animationStateChanged
      .pipe(
        filter(event => event.phaseName === 'done' && event.toState === 'hidden'),
        take(1),
      )
      .subscribe(() => {
        clearTimeout(this._closeFallbackTimeout);
        this._ref.close(this._result);
      });

    _ref.overlayRef.detachments().subscribe(() => {
      this._ref.close(this._result);
    });

    merge(
      this.backdropClick(),
      this.keydownEvents().pipe(filter(event => event.keyCode === ESCAPE)),
    ).subscribe(event => {
      if (
        !this.disableClose &&
        (event.type !== 'keydown' || !hasModifierKey(event as KeyboardEvent))
      ) {
        event.preventDefault();
        this.dismiss();
      }
    });
  }

  /**
   * Dismisses the bottom sheet.
   *
   * 关闭底部操作表。
   *
   * @param result Data to be passed back to the bottom sheet opener.
   *
   * 要传递回底部操作表的数据。
   *
   */
  dismiss(result?: R): void {
    if (!this.containerInstance) {
      return;
    }

    // Transition the backdrop in parallel to the bottom sheet.
    this.containerInstance._animationStateChanged
      .pipe(
        filter(event => event.phaseName === 'start'),
        take(1),
      )
      .subscribe(event => {
        // The logic that disposes of the overlay depends on the exit animation completing, however
        // it isn't guaranteed if the parent view is destroyed while it's running. Add a fallback
        // timeout which will clean everything up if the animation hasn't fired within the specified
        // amount of time plus 100ms. We don't need to run this outside the NgZone, because for the
        // vast majority of cases the timeout will have been cleared before it has fired.
        this._closeFallbackTimeout = setTimeout(() => {
          this._ref.close(this._result);
        }, event.totalTime + 100);

        this._ref.overlayRef.detachBackdrop();
      });

    this._result = result;
    this.containerInstance.exit();
    this.containerInstance = null!;
  }

  /**
   * Gets an observable that is notified when the bottom sheet is finished closing.
   *
   * 获取一个可观察对象，当底部操作表已经完成并关闭时，它会收到通知。
   *
   */
  afterDismissed(): Observable<R | undefined> {
    return this._ref.closed;
  }

  /**
   * Gets an observable that is notified when the bottom sheet has opened and appeared.
   *
   * 获取一个可观察对象，当底部操作表已经打开并出现时，它会收到通知。
   *
   */
  afterOpened(): Observable<void> {
    return this._afterOpened;
  }

  /**
   * Gets an observable that emits when the overlay's backdrop has been clicked.
   *
   * 获取一个可观察对象，当点击浮层的背景板时，它会发出数据。
   *
   */
  backdropClick(): Observable<MouseEvent> {
    return this._ref.backdropClick;
  }

  /**
   * Gets an observable that emits when keydown events are targeted on the overlay.
   *
   * 获取一个可观察对象，当指定浮层收到 keydown 事件时，它会发出数据。
   *
   */
  keydownEvents(): Observable<KeyboardEvent> {
    return this._ref.keydownEvents;
  }
}
