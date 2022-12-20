/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {BooleanInput, coerceBooleanProperty} from '@angular/cdk/coercion';
import {Directive, InjectionToken, Input, OnChanges, OnDestroy, SimpleChanges} from '@angular/core';
import {Subject} from 'rxjs';

/**
 * Used to generate unique ID for each accordion.
 *
 * 用于为每个手风琴生成唯一的 ID。
 *
 */
let nextId = 0;

/**
 * Injection token that can be used to reference instances of `CdkAccordion`. It serves
 * as alternative token to the actual `CdkAccordion` class which could cause unnecessary
 * retention of the class and its directive metadata.
 *
 * 这个注入令牌可以用来引用一些 `CdkAccordion` 实例。它可以作为真实 `CdkAccordion` 类的备用令牌，直接使用该类可能导致该类及其指令的元数据无法被优化掉。
 *
 */
export const CDK_ACCORDION = new InjectionToken<CdkAccordion>('CdkAccordion');

/**
 * Directive whose purpose is to manage the expanded state of CdkAccordionItem children.
 *
 * 该指令的用途是管理 CdkAccordionItem 子组件的展开状态。
 *
 */
@Directive({
  selector: 'cdk-accordion, [cdkAccordion]',
  exportAs: 'cdkAccordion',
  providers: [{provide: CDK_ACCORDION, useExisting: CdkAccordion}],
})
export class CdkAccordion implements OnDestroy, OnChanges {
  /**
   * Emits when the state of the accordion changes
   *
   * 当手风琴状态发生变化时会触发
   *
   */
  readonly _stateChanges = new Subject<SimpleChanges>();

  /**
   * Stream that emits true/false when openAll/closeAll is triggered.
   *
   * 当 openAll/closeAll 被触发时，此流会发出 true/false。
   *
   */
  readonly _openCloseAllActions: Subject<boolean> = new Subject<boolean>();

  /**
   * A readonly id value to use for unique selection coordination.
   *
   * 一个只读的 id 值，用于在单选模式下进行协调。
   *
   */
  readonly id: string = `cdk-accordion-${nextId++}`;

  /**
   * Whether the accordion should allow multiple expanded accordion items simultaneously.
   *
   * 手风琴是否应该允许同时展开多个手风琴条目。
   *
   */
  @Input()
  get multi(): boolean {
    return this._multi;
  }
  set multi(multi: BooleanInput) {
    this._multi = coerceBooleanProperty(multi);
  }
  private _multi: boolean = false;

  /**
   * Opens all enabled accordion items in an accordion where multi is enabled.
   *
   * 允许多选时，可以同时打开手风琴中的所有可用条目。
   *
   */
  openAll(): void {
    if (this._multi) {
      this._openCloseAllActions.next(true);
    }
  }

  /**
   * Closes all enabled accordion items.
   *
   * 允许多选时，可以同时关闭手风琴中的所有可用条目。
   *
   */
  closeAll(): void {
    this._openCloseAllActions.next(false);
  }

  ngOnChanges(changes: SimpleChanges) {
    this._stateChanges.next(changes);
  }

  ngOnDestroy() {
    this._stateChanges.complete();
    this._openCloseAllActions.complete();
  }
}
