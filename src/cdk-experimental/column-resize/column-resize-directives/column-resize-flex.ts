/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Directive, ElementRef, NgZone} from '@angular/core';
import {CdkTable} from '@angular/cdk/table';

import {ColumnResize} from '../column-resize';
import {ColumnResizeNotifier, ColumnResizeNotifierSource} from '../column-resize-notifier';
import {HeaderRowEventDispatcher} from '../event-dispatcher';
import {FLEX_PROVIDERS} from './constants';

/**
 * Explicitly enables column resizing for a flexbox-based cdk-table.
 * Individual columns must be annotated specifically.
 *
 * 显式启用基于 flexbox 的 cdk 表的列大小调整。必须特别标注各个列。
 *
 */
@Directive({
  selector: 'cdk-table[columnResize]',
  providers: [...FLEX_PROVIDERS, {provide: ColumnResize, useExisting: CdkColumnResizeFlex}],
})
export class CdkColumnResizeFlex extends ColumnResize {
  constructor(
    readonly columnResizeNotifier: ColumnResizeNotifier,
    readonly elementRef: ElementRef<HTMLElement>,
    protected readonly eventDispatcher: HeaderRowEventDispatcher,
    protected readonly ngZone: NgZone,
    protected readonly notifier: ColumnResizeNotifierSource,
    protected readonly table: CdkTable<unknown>,
  ) {
    super();
  }
}
