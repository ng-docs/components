/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Component} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'button-demo',
  templateUrl: 'button-demo.html',
  styleUrls: ['button-demo.css'],
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
})
export class ButtonDemo {
  isDisabled: boolean = false;
  clickCounter: number = 0;
  toggleDisable: boolean = false;
}
