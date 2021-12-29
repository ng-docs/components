/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {CommonModule} from '@angular/common';
import {CheckboxExamplesModule} from '@angular/components-examples/material/checkbox';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatPseudoCheckboxModule} from '@angular/material/core';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {RouterModule} from '@angular/router';
import {
  AnimationsNoop,
  CheckboxDemo,
  ClickActionCheck,
  ClickActionNoop,
  MatCheckboxDemoNestedChecklist,
} from './checkbox-demo';

@NgModule({
  imports: [
    CheckboxExamplesModule,
    CommonModule,
    FormsModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatPseudoCheckboxModule,
    ReactiveFormsModule,
    RouterModule.forChild([{path: '', component: CheckboxDemo}]),
  ],
  declarations: [
    CheckboxDemo,
    MatCheckboxDemoNestedChecklist,
    ClickActionCheck,
    ClickActionNoop,
    AnimationsNoop,
  ],
})
export class CheckboxDemoModule {}
