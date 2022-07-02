/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Directive} from '@angular/core';
import {MatTabLabel as BaseMatTabLabel} from '@angular/material/tabs';

/**
 * Used to flag tab labels for use with the portal directive
 *
 * 标出选项卡标签，以供传送点指令使用
 *
 */
@Directive({
  selector: '[mat-tab-label], [matTabLabel]',
})
export class MatTabLabel extends BaseMatTabLabel {}
