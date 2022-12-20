/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Directive, ElementRef, NgZone} from '@angular/core';
import {
  ColumnResize,
  ColumnResizeNotifier,
  ColumnResizeNotifierSource,
  HeaderRowEventDispatcher,
} from '@angular/cdk-experimental/column-resize';

import {AbstractMatColumnResize, FLEX_HOST_BINDINGS, FLEX_PROVIDERS} from './common';

/**
 * Implicitly enables column resizing for a flexbox-based mat-table.
 * Individual columns will be resizable unless opted out.
 *
 * 为基于 flexbox 的 mat-table 隐式启用列大小调整。除非专项禁用，否则各个列将可调整大小。
 *
 */
@Directive({
  selector: 'mat-table',
  host: FLEX_HOST_BINDINGS,
  providers: [
    ...FLEX_PROVIDERS,
    {provide: ColumnResize, useExisting: MatDefaultEnabledColumnResizeFlex},
  ],
})
export class MatDefaultEnabledColumnResizeFlex extends AbstractMatColumnResize {
  constructor(
    readonly columnResizeNotifier: ColumnResizeNotifier,
    readonly elementRef: ElementRef<HTMLElement>,
    protected readonly eventDispatcher: HeaderRowEventDispatcher,
    protected readonly ngZone: NgZone,
    protected readonly notifier: ColumnResizeNotifierSource,
  ) {
    super();
  }
}
