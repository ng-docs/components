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

/** Used to generate unique ID for each accordion. */
let nextId = 0;

/**
 * Injection token that can be used to reference instances of `CdkAccordion`. It serves
 * as alternative token to the actual `CdkAccordion` class which could cause unnecessary
 * retention of the class and its directive metadata.
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
  /** Emits when the state of the accordion changes */
  readonly _stateChanges = new Subject<SimpleChanges>();

  /** Stream that emits true/false when openAll/closeAll is triggered. */
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
   * Closes all enabled accordion items in an accordion where multi is enabled.
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
