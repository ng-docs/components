/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Component} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';

@Component({
  selector: 'slide-toggle-demo',
  templateUrl: 'slide-toggle-demo.html',
  styleUrls: ['slide-toggle-demo.css'],
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatSlideToggleModule],
})
export class SlideToggleDemo {
  firstToggle: boolean = false;
  formToggle: boolean = false;

  onFormSubmit() {
    alert(`You submitted the form. Value: ${this.formToggle}.`);
  }
}
