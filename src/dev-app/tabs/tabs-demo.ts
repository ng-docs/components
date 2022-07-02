/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Component} from '@angular/core';
import {MatTabsModule} from '@angular/material/tabs';
import {TabGroupExamplesModule} from '@angular/components-examples/material/tabs';

@Component({
  selector: 'tabs-demo',
  templateUrl: 'tabs-demo.html',
  standalone: true,
  imports: [TabGroupExamplesModule, MatTabsModule],
})
export class TabsDemo {}
