/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'button-toggle-demo',
  templateUrl: 'button-toggle-demo.html',
  styleUrls: ['button-toggle-demo.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonToggleModule, MatCheckboxModule, MatIconModule],
})
export class ButtonToggleDemo {
  isVertical = false;
  isDisabled = false;
  favoritePie = 'Apple';
  pieOptions = ['Apple', 'Cherry', 'Pecan', 'Lemon'];
}
