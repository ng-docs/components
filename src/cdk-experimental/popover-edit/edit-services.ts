/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Injectable, NgZone} from '@angular/core';
import {FocusTrapFactory} from '@angular/cdk/a11y';
import {Directionality} from '@angular/cdk/bidi';
import {Overlay} from '@angular/cdk/overlay';
import {ScrollDispatcher, ViewportRuler} from '@angular/cdk/scrolling';

import {EditEventDispatcher} from './edit-event-dispatcher';
import {FocusDispatcher} from './focus-dispatcher';
import {PopoverEditPositionStrategyFactory} from './popover-edit-position-strategy-factory';
import {EditRef} from './edit-ref';

/**
 * Optimization
 * Collects multiple Injectables into a singleton shared across the table. By reducing the
 * number of services injected into each CdkPopoverEdit, this saves about 0.023ms of cpu time
 * and 56 bytes of memory per instance.
 *
 * 优化
 * 将多个 Injectables 收集到一个跨表共享的单例中。通过减少注入每个 CdkPopoverEdit 的服务数量，每个实例节省了大约 0.023ms 的 cpu 时间和 56 字节的内存。
 *
 */
@Injectable()
export class EditServices {
  constructor(
    readonly directionality: Directionality,
    readonly editEventDispatcher: EditEventDispatcher<EditRef<unknown>>,
    readonly focusDispatcher: FocusDispatcher,
    readonly focusTrapFactory: FocusTrapFactory,
    readonly ngZone: NgZone,
    readonly overlay: Overlay,
    readonly positionFactory: PopoverEditPositionStrategyFactory,
    readonly scrollDispatcher: ScrollDispatcher,
    readonly viewportRuler: ViewportRuler,
  ) {}
}
