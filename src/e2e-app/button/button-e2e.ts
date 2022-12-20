/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Component} from '@angular/core';

@Component({
  selector: 'button-e2e',
  templateUrl: 'button-e2e.html',
})
export class ButtonE2e {
  isDisabled: boolean = false;
  clickCounter: number = 0;
}
