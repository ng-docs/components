/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Directive, InjectionToken} from '@angular/core';
import {CdkPortal} from '@angular/cdk/portal';

/**
 * Injection token that can be used to reference instances of `MatTabLabel`. It serves as
 * alternative token to the actual `MatTabLabel` class which could cause unnecessary
 * retention of the class and its directive metadata.
 *
 * 这个注入令牌可以用来引用 `MatTabLabel` 实例。它可以作为实际 `MatTabLabel` 类的备用令牌，直接使用实际类可能导致该类及其元数据无法被优化掉。
 *
 */
export const MAT_TAB_LABEL = new InjectionToken<MatTabLabel>('MatTabLabel');

/**
 * Used to flag tab labels for use with the portal directive
 *
 * 标出选项卡标签，以供传送点指令使用
 *
 */
@Directive({
  selector: '[mat-tab-label], [matTabLabel]',
  providers: [{provide: MAT_TAB_LABEL, useExisting: MatTabLabel}],
})
export class MatTabLabel extends CdkPortal {}
