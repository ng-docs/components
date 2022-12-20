/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Directive, OnDestroy, Input, InjectionToken} from '@angular/core';
import {BooleanInput, coerceBooleanProperty} from '@angular/cdk/coercion';

/**
 * Injection token that can be used to reference instances of `CdkDropListGroup`. It serves as
 * alternative token to the actual `CdkDropListGroup` class which could cause unnecessary
 * retention of the class and its directive metadata.
 *
 * 用来引用 `CdkDropListGroup` 实例的注入令牌。它用作实际 `CdkDropListGroup` 类的备用令牌，直接使用该类可能导致该类及其指令的元数据无法被优化掉。
 *
 */
export const CDK_DROP_LIST_GROUP = new InjectionToken<CdkDropListGroup<unknown>>(
  'CdkDropListGroup',
);

/**
 * Declaratively connects sibling `cdkDropList` instances together. All of the `cdkDropList`
 * elements that are placed inside a `cdkDropListGroup` will be connected to each other
 * automatically. Can be used as an alternative to the `cdkDropListConnectedTo` input
 * from `cdkDropList`.
 *
 * 声明性地将同级 `cdkDropList` 实例连接在一起。放置在 `cdkDropListGroup` 内的所有 `cdkDropList` 元素将自动互连。可作为 `cdkDropList` 的输入属性 `cdkDropListConnectedTo` 的替代品。
 *
 */
@Directive({
  selector: '[cdkDropListGroup]',
  exportAs: 'cdkDropListGroup',
  standalone: true,
  providers: [{provide: CDK_DROP_LIST_GROUP, useExisting: CdkDropListGroup}],
})
export class CdkDropListGroup<T> implements OnDestroy {
  /**
   * Drop lists registered inside the group.
   *
   * 已注册在组内的投放列表。
   *
   */
  readonly _items = new Set<T>();

  /**
   * Whether starting a dragging sequence from inside this group is disabled.
   *
   * 是否禁止从该组内部开始拖动序列。
   *
   */
  @Input('cdkDropListGroupDisabled')
  get disabled(): boolean {
    return this._disabled;
  }
  set disabled(value: BooleanInput) {
    this._disabled = coerceBooleanProperty(value);
  }
  private _disabled = false;

  ngOnDestroy() {
    this._items.clear();
  }
}
