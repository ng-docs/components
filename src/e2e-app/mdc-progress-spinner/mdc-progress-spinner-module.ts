/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {NgModule} from '@angular/core';
import {MatProgressSpinnerModule} from '@angular/material-experimental/mdc-progress-spinner';
import {MdcProgressSpinnerE2e} from './mdc-progress-spinner-e2e';

@NgModule({
  imports: [MatProgressSpinnerModule],
  declarations: [MdcProgressSpinnerE2e],
})
export class MdcProgressSpinnerE2eModule {}
