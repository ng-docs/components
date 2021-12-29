/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {NgModule} from '@angular/core';
import {MatFormFieldModule} from '@angular/material-experimental/mdc-form-field';
import {MatInputModule} from '@angular/material-experimental/mdc-input';
import {MdcInputE2E} from './mdc-input-e2e';

@NgModule({
  imports: [MatFormFieldModule, MatInputModule],
  declarations: [MdcInputE2E],
})
export class MdcInputE2eModule {}
