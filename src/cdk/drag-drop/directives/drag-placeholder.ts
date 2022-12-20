/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Directive, TemplateRef, Input, InjectionToken} from '@angular/core';

/**
 * Injection token that can be used to reference instances of `CdkDragPlaceholder`. It serves as
 * alternative token to the actual `CdkDragPlaceholder` class which could cause unnecessary
 * retention of the class and its directive metadata.
 *
 * 用来引用 `CdkDragPlaceholder` 实例的注入令牌。它用作实际 `CdkDragPlaceholder` 类的备用令牌，直接使用该类可能导致该类及其指令的元数据无法被优化掉。
 *
 */
export const CDK_DRAG_PLACEHOLDER = new InjectionToken<CdkDragPlaceholder>('CdkDragPlaceholder');

/**
 * Element that will be used as a template for the placeholder of a CdkDrag when
 * it is being dragged. The placeholder is displayed in place of the element being dragged.
 *
 * 拖动时将用作 CdkDrag 占位符模板的元素。该占位符会用来代替要拖动的元素。
 *
 */
@Directive({
  selector: 'ng-template[cdkDragPlaceholder]',
  standalone: true,
  providers: [{provide: CDK_DRAG_PLACEHOLDER, useExisting: CdkDragPlaceholder}],
})
export class CdkDragPlaceholder<T = any> {
  /**
   * Context data to be added to the placeholder template instance.
   *
   * 要添加到占位符模板实例的上下文数据。
   *
   */
  @Input() data: T;
  constructor(public templateRef: TemplateRef<T>) {}
}
