/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {FocusOrigin} from '@angular/cdk/a11y';
import {ESCAPE, hasModifierKey} from '@angular/cdk/keycodes';
import {GlobalPositionStrategy, OverlayRef} from '@angular/cdk/overlay';
import {Observable, Subject} from 'rxjs';
import {filter, take} from 'rxjs/operators';
import {DialogPosition} from './dialog-config';
import {_MatDialogContainerBase} from './dialog-container';

// TODO(jelbourn): resizing

// Counter for unique dialog ids.
let uniqueId = 0;

/**
 * Possible states of the lifecycle of a dialog.
 *
 * 对话框生命周期的可能状态。
 *
 */
export const enum MatDialogState {OPEN, CLOSING, CLOSED}

/**
 * Reference to a dialog opened via the MatDialog service.
 *
 * 通过 MatDialog 服务打开的对话框的引用。
 *
 */
export class MatDialogRef<T, R = any> {
  /**
   * The instance of component opened into the dialog.
   *
   * 在对话框中打开的组件实例。
   *
   */
  componentInstance: T;

  /**
   * Whether the user is allowed to close the dialog.
   *
   * 是否允许用户关闭该对话框。
   *
   */
  disableClose: boolean | undefined = this._containerInstance._config.disableClose;

  /**
   * Subject for notifying the user that the dialog has finished opening.
   *
   * 用于通知用户该对话框已经打开的主体对象。
   *
   */
  private readonly _afterOpened = new Subject<void>();

  /**
   * Subject for notifying the user that the dialog has finished closing.
   *
   * 用于通知用户该对话框已经关闭的主体对象。
   *
   */
  private readonly _afterClosed = new Subject<R | undefined>();

  /**
   * Subject for notifying the user that the dialog has started closing.
   *
   * 用于通知用户该对话框即将关闭的主体对象。
   *
   */
  private readonly _beforeClosed = new Subject<R | undefined>();

  /**
   * Result to be passed to afterClosed.
   *
   * 要传递给 afterClosed 的结果。
   *
   */
  private _result: R | undefined;

  /**
   * Handle to the timeout that's running as a fallback in case the exit animation doesn't fire.
   *
   * 在退出动画未触发的情况下，超时指定时间后进行回退处理。
   *
   */
  private _closeFallbackTimeout: number;

  /**
   * Current state of the dialog.
   *
   * 该对话框的当前状态。
   *
   */
  private _state = MatDialogState.OPEN;

  constructor(
    private _overlayRef: OverlayRef,
    public _containerInstance: _MatDialogContainerBase,
    readonly id: string = `mat-dialog-${uniqueId++}`) {

    // Pass the id along to the container.
    _containerInstance._id = id;

    // Emit when opening animation completes
    _containerInstance._animationStateChanged.pipe(
      filter(event => event.state === 'opened'),
      take(1)
    )
    .subscribe(() => {
      this._afterOpened.next();
      this._afterOpened.complete();
    });

    // Dispose overlay when closing animation is complete
    _containerInstance._animationStateChanged.pipe(
      filter(event => event.state === 'closed'),
      take(1)
    ).subscribe(() => {
      clearTimeout(this._closeFallbackTimeout);
      this._finishDialogClose();
    });

    _overlayRef.detachments().subscribe(() => {
      this._beforeClosed.next(this._result);
      this._beforeClosed.complete();
      this._afterClosed.next(this._result);
      this._afterClosed.complete();
      this.componentInstance = null!;
      this._overlayRef.dispose();
    });

    _overlayRef.keydownEvents()
      .pipe(filter(event => {
        return event.keyCode === ESCAPE && !this.disableClose && !hasModifierKey(event);
      }))
      .subscribe(event => {
        event.preventDefault();
        _closeDialogVia(this, 'keyboard');
      });

    _overlayRef.backdropClick().subscribe(() => {
      if (this.disableClose) {
        this._containerInstance._recaptureFocus();
      } else {
        _closeDialogVia(this, 'mouse');
      }
    });
  }

  /**
   * Close the dialog.
   *
   * 关闭对话框。
   *
   * @param dialogResult Optional result to return to the dialog opener.
   *
   * 返回到窗口对话框的可选结果。
   *
   */
  close(dialogResult?: R): void {
    this._result = dialogResult;

    // Transition the backdrop in parallel to the dialog.
    this._containerInstance._animationStateChanged.pipe(
      filter(event => event.state === 'closing'),
      take(1)
    )
    .subscribe(event => {
      this._beforeClosed.next(dialogResult);
      this._beforeClosed.complete();
      this._overlayRef.detachBackdrop();

      // The logic that disposes of the overlay depends on the exit animation completing, however
      // it isn't guaranteed if the parent view is destroyed while it's running. Add a fallback
      // timeout which will clean everything up if the animation hasn't fired within the specified
      // amount of time plus 100ms. We don't need to run this outside the NgZone, because for the
      // vast majority of cases the timeout will have been cleared before it has the chance to fire.
      this._closeFallbackTimeout = setTimeout(() => this._finishDialogClose(),
          event.totalTime + 100);
    });

    this._state = MatDialogState.CLOSING;
    this._containerInstance._startExitAnimation();
  }

  /**
   * Gets an observable that is notified when the dialog is finished opening.
   *
   * 获取一个会在对话框打开后得到通知的可观察对象。
   *
   */
  afterOpened(): Observable<void> {
    return this._afterOpened;
  }

  /**
   * Gets an observable that is notified when the dialog is finished closing.
   *
   * 获取一个会在对话框关闭后收到通知的可观察对象。
   *
   */
  afterClosed(): Observable<R | undefined> {
    return this._afterClosed;
  }

  /**
   * Gets an observable that is notified when the dialog has started closing.
   *
   * 获取一个当对话框即将关闭时得到通知的可观察对象。
   *
   */
  beforeClosed(): Observable<R | undefined> {
    return this._beforeClosed;
  }

  /**
   * Gets an observable that emits when the overlay's backdrop has been clicked.
   *
   * 获取一个可观察对象，它会在点击浮层的背景板时发出。
   *
   */
  backdropClick(): Observable<MouseEvent> {
    return this._overlayRef.backdropClick();
  }

  /**
   * Gets an observable that emits when keydown events are targeted on the overlay.
   *
   * 获取一个可观察对象，当 keydown 事件的目标是浮层时发出数据。
   *
   */
  keydownEvents(): Observable<KeyboardEvent> {
    return this._overlayRef.keydownEvents();
  }

  /**
   * Updates the dialog's position.
   *
   * 更新对话框的位置。
   *
   * @param position New dialog position.
   *
   * 新对话框位置。
   *
   */
  updatePosition(position?: DialogPosition): this {
    let strategy = this._getPositionStrategy();

    if (position && (position.left || position.right)) {
      position.left ? strategy.left(position.left) : strategy.right(position.right);
    } else {
      strategy.centerHorizontally();
    }

    if (position && (position.top || position.bottom)) {
      position.top ? strategy.top(position.top) : strategy.bottom(position.bottom);
    } else {
      strategy.centerVertically();
    }

    this._overlayRef.updatePosition();

    return this;
  }

  /**
   * Updates the dialog's width and height.
   *
   * 更新对话框的宽度和高度。
   *
   * @param width New width of the dialog.
   *
   * 对话框的新宽度。
   *
   * @param height New height of the dialog.
   *
   * 对话框的新高度。
   *
   */
  updateSize(width: string = '', height: string = ''): this {
    this._overlayRef.updateSize({width, height});
    this._overlayRef.updatePosition();
    return this;
  }

  /**
   * Add a CSS class or an array of classes to the overlay pane.
   *
   * 把一个或一组 CSS 类添加到浮层面板中。
   *
   */
  addPanelClass(classes: string | string[]): this {
    this._overlayRef.addPanelClass(classes);
    return this;
  }

  /**
   * Remove a CSS class or an array of classes from the overlay pane.
   *
   * 从浮层面板中删除一个或一组 CSS 类。
   *
   */
  removePanelClass(classes: string | string[]): this {
    this._overlayRef.removePanelClass(classes);
    return this;
  }

  /**
   * Gets the current state of the dialog's lifecycle.
   *
   * 获取对话框生命周期的当前状态。
   *
   */
  getState(): MatDialogState {
    return this._state;
  }

  /**
   * Finishes the dialog close by updating the state of the dialog
   * and disposing the overlay.
   *
   * 通过更新对话框的状态并处理浮层来完成对话框的关闭。
   *
   */
  private _finishDialogClose() {
    this._state = MatDialogState.CLOSED;
    this._overlayRef.dispose();
  }

  /**
   * Fetches the position strategy object from the overlay ref.
   *
   * 从浮层引用中获取定位策略对象。
   *
   */
  private _getPositionStrategy(): GlobalPositionStrategy {
    return this._overlayRef.getConfig().positionStrategy as GlobalPositionStrategy;
  }
}

/**
 * Closes the dialog with the specified interaction type. This is currently not part of
 * `MatDialogRef` as that would conflict with custom dialog ref mocks provided in tests.
 * More details. See: <https://github.com/angular/components/pull/9257#issuecomment-651342226>.
 *
 * 用指定的交互类型关闭对话框。目前它不是 `MatDialogRef` 一部分，因为它会与测试中提供的自定义对话框引用模拟相冲突。更多细节请参阅： <https://github.com/angular/components/pull/9257#issuecomment-651342226。>
 */
// TODO: TODO: Move this back into `MatDialogRef` when we provide an official mock dialog ref.
export function _closeDialogVia<R>(ref: MatDialogRef<R>, interactionType: FocusOrigin, result?: R) {
  // Some mock dialog ref instances in tests do not have the `_containerInstance` property.
  // For those, we keep the behavior as is and do not deal with the interaction type.
  if (ref._containerInstance !== undefined) {
    ref._containerInstance._closeInteractionType = interactionType;
  }
  return ref.close(result);
}
