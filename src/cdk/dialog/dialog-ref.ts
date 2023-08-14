/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {OverlayRef} from '@angular/cdk/overlay';
import {ESCAPE, hasModifierKey} from '@angular/cdk/keycodes';
import {Observable, Subject, Subscription} from 'rxjs';
import {DialogConfig} from './dialog-config';
import {FocusOrigin} from '@angular/cdk/a11y';
import {BasePortalOutlet} from '@angular/cdk/portal';
import {ComponentRef} from '@angular/core';

/**
 * Additional options that can be passed in when closing a dialog.
 *
 * 关闭对话框时可以传入的其他选项。
 *
 */
export interface DialogCloseOptions {
  /**
   * Focus original to use when restoring focus.
   *
   * 恢复焦点时要使用的原焦点。
   *
   */
  focusOrigin?: FocusOrigin;
}

/**
 * Reference to a dialog opened via the Dialog service.
 *
 * 对通过此 Dialog 服务打开的对话框的引用。
 *
 */
export class DialogRef<R = unknown, C = unknown> {
  /**
   * Instance of component opened into the dialog. Will be
   * null when the dialog is opened using a `TemplateRef`.
   *
   * 在对话框中打开的组件实例。使用 `TemplateRef` 打开对话框时将为空。
   *
   */

  readonly componentInstance: C | null;
  /**
   * `ComponentRef` of the component opened into the dialog. Will be
   * null when the dialog is opened using a `TemplateRef`.
   */
  readonly componentRef: ComponentRef<C> | null;

  /**
   * Instance of the container that is rendering out the dialog content.
   *
   * 渲染对话框内容的容器实例。
   *
   */
  readonly containerInstance: BasePortalOutlet & {_closeInteractionType?: FocusOrigin};

  /**
   * Whether the user is allowed to close the dialog.
   *
   * 是否允许用户关闭该对话框。
   *
   */
  disableClose: boolean | undefined;

  /**
   * Emits when the dialog has been closed.
   *
   * 当对话框关闭时发出。
   *
   */
  readonly closed: Observable<R | undefined> = new Subject<R | undefined>();

  /**
   * Emits when the backdrop of the dialog is clicked.
   *
   * 单击对话框的背景时发出。
   *
   */
  readonly backdropClick: Observable<MouseEvent>;

  /**
   * Emits when on keyboard events within the dialog.
   *
   * 在对话框中的键盘事件上发出。
   *
   */
  readonly keydownEvents: Observable<KeyboardEvent>;

  /**
   * Emits on pointer events that happen outside of the dialog.
   *
   * 在对话框之外发生的指针事件上发出。
   *
   */
  readonly outsidePointerEvents: Observable<MouseEvent>;

  /**
   * Unique ID for the dialog.
   *
   * 对话框的唯一 ID。
   *
   */
  readonly id: string;

  /** Subscription to external detachments of the dialog. */
  private _detachSubscription: Subscription;

  constructor(
    readonly overlayRef: OverlayRef,
    readonly config: DialogConfig<any, DialogRef<R, C>, BasePortalOutlet>,
  ) {
    this.disableClose = config.disableClose;
    this.backdropClick = overlayRef.backdropClick();
    this.keydownEvents = overlayRef.keydownEvents();
    this.outsidePointerEvents = overlayRef.outsidePointerEvents();
    this.id = config.id!; // By the time the dialog is created we are guaranteed to have an ID.

    this.keydownEvents.subscribe(event => {
      if (event.keyCode === ESCAPE && !this.disableClose && !hasModifierKey(event)) {
        event.preventDefault();
        this.close(undefined, {focusOrigin: 'keyboard'});
      }
    });

    this.backdropClick.subscribe(() => {
      if (!this.disableClose) {
        this.close(undefined, {focusOrigin: 'mouse'});
      }
    });

    this._detachSubscription = overlayRef.detachments().subscribe(() => {
      // Check specifically for `false`, because we want `undefined` to be treated like `true`.
      if (config.closeOnOverlayDetachments !== false) {
        this.close();
      }
    });
  }

  /**
   * Close the dialog.
   *
   * 关闭对话框。
   *
   * @param result Optional result to return to the dialog opener.
   *
   * 返回到窗口对话框的可选结果。
   *
   * @param options Additional options to customize the closing behavior.
   *
   * 自定义关闭行为的附加选项。
   *
   */
  close(result?: R, options?: DialogCloseOptions): void {
    if (this.containerInstance) {
      const closedSubject = this.closed as Subject<R | undefined>;
      this.containerInstance._closeInteractionType = options?.focusOrigin || 'program';
      // Drop the detach subscription first since it can be triggered by the
      // `dispose` call and override the result of this closing sequence.
      this._detachSubscription.unsubscribe();
      this.overlayRef.dispose();
      closedSubject.next(result);
      closedSubject.complete();
      (this as {componentInstance: C}).componentInstance = (
        this as {containerInstance: BasePortalOutlet}
      ).containerInstance = null!;
    }
  }

  /**
   * Updates the position of the dialog based on the current position strategy.
   *
   * 根据当前位置策略更新对话框的位置。
   *
   */
  updatePosition(): this {
    this.overlayRef.updatePosition();
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
  updateSize(width: string | number = '', height: string | number = ''): this {
    this.overlayRef.updateSize({width, height});
    return this;
  }

  /**
   * Add a CSS class or an array of classes to the overlay pane.
   *
   * 把一个或一组 CSS 类添加到浮层面板中。
   *
   */
  addPanelClass(classes: string | string[]): this {
    this.overlayRef.addPanelClass(classes);
    return this;
  }

  /**
   * Remove a CSS class or an array of classes from the overlay pane.
   *
   * 从浮层面板中删除一个或一组 CSS 类。
   *
   */
  removePanelClass(classes: string | string[]): this {
    this.overlayRef.removePanelClass(classes);
    return this;
  }
}
