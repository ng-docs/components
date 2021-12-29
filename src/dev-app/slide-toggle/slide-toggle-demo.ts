/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Component} from '@angular/core';

@Component({
  selector: 'slide-toggle-demo',
  templateUrl: 'slide-toggle-demo.html',
  styleUrls: ['slide-toggle-demo.css'],
})
export class SlideToggleDemo {
  firstToggle: boolean;

  onFormSubmit() {
    alert(`You submitted the form.`);
  }
}
