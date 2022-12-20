/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Component} from '@angular/core';
import {
  MAT_LEGACY_TOOLTIP_DEFAULT_OPTIONS,
  MatLegacyTooltipDefaultOptions,
} from '@angular/material/legacy-tooltip';

/** Custom options the configure the tooltip's default show/hide delays. */
export const myCustomTooltipDefaults: MatLegacyTooltipDefaultOptions = {
  showDelay: 1000,
  hideDelay: 1000,
  touchendHideDelay: 1000,
};

/**
 * @title Tooltip with a show and hide delay
 */
@Component({
  selector: 'legacy-tooltip-modified-defaults-example',
  templateUrl: 'legacy-tooltip-modified-defaults-example.html',
  providers: [{provide: MAT_LEGACY_TOOLTIP_DEFAULT_OPTIONS, useValue: myCustomTooltipDefaults}],
})
export class LegacyTooltipModifiedDefaultsExample {}
