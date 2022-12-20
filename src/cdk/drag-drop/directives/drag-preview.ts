/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {BooleanInput, coerceBooleanProperty} from '@angular/cdk/coercion';
import {Directive, InjectionToken, Input, TemplateRef} from '@angular/core';

/**
 * Injection token that can be used to reference instances of `CdkDragPreview`. It serves as
 * alternative token to the actual `CdkDragPreview` class which could cause unnecessary
 * retention of the class and its directive metadata.
 *
 * 用来引用 `CdkDragPreview` 实例的注入令牌。它用作实际 `CdkDragPreview` 类的备用令牌，直接使用该类可能导致该类及其指令的元数据无法被优化掉。
 *
 */
export const CDK_DRAG_PREVIEW = new InjectionToken<CdkDragPreview>('CdkDragPreview');

/**
 * Element that will be used as a template for the preview
 * of a CdkDrag when it is being dragged.
 *
 * 拖动时将用作预览 CdkDrag 的模板的元素。
 *
 */
@Directive({
  selector: 'ng-template[cdkDragPreview]',
  standalone: true,
  providers: [{provide: CDK_DRAG_PREVIEW, useExisting: CdkDragPreview}],
})
export class CdkDragPreview<T = any> {
  /**
   * Context data to be added to the preview template instance.
   *
   * 要添加到预览模板实例的上下文数据。
   *
   */
  @Input() data: T;

  /**
   * Whether the preview should preserve the same size as the item that is being dragged.
   *
   * 预览是否应保持与要拖动的条目相同的大小。
   *
   */
  @Input()
  get matchSize(): boolean {
    return this._matchSize;
  }
  set matchSize(value: BooleanInput) {
    this._matchSize = coerceBooleanProperty(value);
  }
  private _matchSize = false;

  constructor(public templateRef: TemplateRef<T>) {}
}
