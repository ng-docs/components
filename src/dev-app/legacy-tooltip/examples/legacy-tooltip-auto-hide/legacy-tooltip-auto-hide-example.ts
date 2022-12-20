/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Component} from '@angular/core';
import {FormControl} from '@angular/forms';
import {LegacyTooltipPosition} from '@angular/material/legacy-tooltip';

/**
 * @title Tooltip that demonstrates auto-hiding when it clips out of its scrolling container.
 */
@Component({
  selector: 'legacy-tooltip-auto-hide-example',
  templateUrl: 'legacy-tooltip-auto-hide-example.html',
  styleUrls: ['legacy-tooltip-auto-hide-example.css'],
})
export class LegacyTooltipAutoHideExample {
  positionOptions: LegacyTooltipPosition[] = ['below', 'above', 'left', 'right'];
  position = new FormControl(this.positionOptions[0]);
}
