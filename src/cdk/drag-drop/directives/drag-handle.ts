/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {BooleanInput, coerceBooleanProperty} from '@angular/cdk/coercion';
import {
  Directive,
  ElementRef,
  Inject,
  InjectionToken,
  Input,
  OnDestroy,
  Optional,
  SkipSelf,
} from '@angular/core';
import {Subject} from 'rxjs';
import {CDK_DRAG_PARENT} from '../drag-parent';
import {assertElementNode} from './assertions';

/**
 * Injection token that can be used to reference instances of `CdkDragHandle`. It serves as
 * alternative token to the actual `CdkDragHandle` class which could cause unnecessary
 * retention of the class and its directive metadata.
 *
 * 用来引用 `CdkDragHandle` 实例的注入令牌。它用作实际 `CdkDragHandle` 类的备用令牌，直接使用该类可能导致该类及其指令的元数据无法被优化掉。
 *
 */
export const CDK_DRAG_HANDLE = new InjectionToken<CdkDragHandle>('CdkDragHandle');

/**
 * Handle that can be used to drag a CdkDrag instance.
 *
 * 可用于拖动 CdkDrag 实例的手柄。
 *
 */
@Directive({
  selector: '[cdkDragHandle]',
  standalone: true,
  host: {
    'class': 'cdk-drag-handle',
  },
  providers: [{provide: CDK_DRAG_HANDLE, useExisting: CdkDragHandle}],
})
export class CdkDragHandle implements OnDestroy {
  /**
   * Closest parent draggable instance.
   *
   * 最近的父级可拖动实例。
   *
   */
  _parentDrag: {} | undefined;

  /**
   * Emits when the state of the handle has changed.
   *
   * 手柄状态更改时退出。
   *
   */
  readonly _stateChanges = new Subject<CdkDragHandle>();

  /**
   * Whether starting to drag through this handle is disabled.
   *
   * 是否要禁用通过该手柄开始拖动的功能。
   *
   */
  @Input('cdkDragHandleDisabled')
  get disabled(): boolean {
    return this._disabled;
  }
  set disabled(value: BooleanInput) {
    this._disabled = coerceBooleanProperty(value);
    this._stateChanges.next(this);
  }
  private _disabled = false;

  constructor(
    public element: ElementRef<HTMLElement>,
    @Inject(CDK_DRAG_PARENT) @Optional() @SkipSelf() parentDrag?: any,
  ) {
    if (typeof ngDevMode === 'undefined' || ngDevMode) {
      assertElementNode(element.nativeElement, 'cdkDragHandle');
    }

    this._parentDrag = parentDrag;
  }

  ngOnDestroy() {
    this._stateChanges.complete();
  }
}
