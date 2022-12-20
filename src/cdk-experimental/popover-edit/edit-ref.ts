/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Injectable, OnDestroy, Self, NgZone} from '@angular/core';
import {ControlContainer} from '@angular/forms';
import {Observable, Subject} from 'rxjs';
import {take} from 'rxjs/operators';

import {EditEventDispatcher} from './edit-event-dispatcher';

/**
 * Used for communication between the form within the edit lens and the
 * table that launched it. Provided by CdkEditControl within the lens.
 *
 * 用于在编辑镜头内的表单与启动它的表格之间进行通信。由镜头内的 CdkEditControl 提供。
 *
 */
@Injectable()
export class EditRef<FormValue> implements OnDestroy {
  /** Emits the final value of this edit instance before closing. */
  private readonly _finalValueSubject = new Subject<FormValue>();
  readonly finalValue: Observable<FormValue> = this._finalValueSubject;

  /** Emits when the user tabs out of this edit lens before closing. */
  private readonly _blurredSubject = new Subject<void>();
  readonly blurred: Observable<void> = this._blurredSubject;

  /** The value to set the form back to on revert. */
  private _revertFormValue: FormValue;

  constructor(
    @Self() private readonly _form: ControlContainer,
    private readonly _editEventDispatcher: EditEventDispatcher<EditRef<FormValue>>,
    private readonly _ngZone: NgZone,
  ) {
    this._editEventDispatcher.setActiveEditRef(this);
  }

  /**
   * Called by the host directive's OnInit hook. Reads the initial state of the
   * form and overrides it with persisted state from previous openings, if
   * applicable.
   *
   * 由宿主指令的 OnInit 挂钩调用。读取窗体的初始状态并用以前打开的持久状态覆盖它（如果适用）。
   *
   */
  init(previousFormValue: FormValue | undefined): void {
    // Wait for the zone to stabilize before caching the initial value.
    // This ensures that all form controls have been initialized.
    this._ngZone.onStable.pipe(take(1)).subscribe(() => {
      this.updateRevertValue();
      if (previousFormValue) {
        this.reset(previousFormValue);
      }
    });
  }

  ngOnDestroy(): void {
    this._editEventDispatcher.unsetActiveEditRef(this);
    this._finalValueSubject.next(this._form.value);
    this._finalValueSubject.complete();
  }

  /**
   * Whether the attached form is in a valid state.
   *
   * 所附表格是否处于有效状态。
   *
   */
  isValid(): boolean | null {
    return this._form.valid;
  }

  /**
   * Set the form's current value as what it will be set to on revert/reset.
   *
   * 将表单的当前值设置为在还原/重置时将设置为的值。
   *
   */
  updateRevertValue(): void {
    this._revertFormValue = this._form.value;
  }

  /**
   * Tells the table to close the edit popup.
   *
   * 要求表格关闭编辑弹出窗口。
   *
   */
  close(): void {
    this._editEventDispatcher.editing.next(null);
  }

  /**
   * Notifies the active edit that the user has moved focus out of the lens.
   *
   * 通知活动编辑用户已将焦点移出镜头。
   *
   */
  blur(): void {
    this._blurredSubject.next();
  }

  /**
   * Resets the form value to the specified value or the previously set
   * revert value.
   *
   * 将表单值重置为指定值或先前设置的还原值。
   *
   */
  reset(value?: FormValue): void {
    this._form.reset(value || this._revertFormValue);
  }
}
