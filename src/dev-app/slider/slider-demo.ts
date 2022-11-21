/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Component} from '@angular/core';
import {FormControl, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatSliderModule} from '@angular/material/slider';
import {MatTabsModule} from '@angular/material/tabs';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {MatCheckboxModule} from '@angular/material/checkbox';

@Component({
  selector: 'slider-demo',
  templateUrl: 'slider-demo.html',
  standalone: true,
  imports: [
    FormsModule,
    MatCheckboxModule,
    MatButtonToggleModule,
    MatSliderModule,
    MatTabsModule,
    ReactiveFormsModule,
  ],
  styleUrls: ['slider-demo.css'],
})
export class SliderDemo {
  discrete = true;
  showTickMarks = true;
  colorModel = 'primary';

  noop = () => {};
  min = '0';
  max = '100';
  step = '0';
  value = '0';
  disabled = false;

  twoWayValue = 0;

  minModel = 0;
  maxModel = 100;
  valueModel = 0;
  stepModel = 0;
  disabledModel = false;

  control = new FormControl('0');

  updateValue(input: EventTarget | null): void {
    if (!input) {
      return;
    }
    this.value = (input as HTMLInputElement).value;
  }
  updateMin(input: EventTarget | null): void {
    if (!input) {
      return;
    }
    this.min = (input as HTMLInputElement).value;
  }
  updateMax(input: EventTarget | null): void {
    if (!input) {
      return;
    }
    this.max = (input as HTMLInputElement).value;
  }
  updateStep(input: EventTarget | null): void {
    if (!input) {
      return;
    }
    this.step = (input as HTMLInputElement).value;
  }
  updateDisabledState(input: EventTarget | null): void {
    if (!input) {
      return;
    }
    this.disabled = (input as HTMLInputElement).checked;
  }
  updateControlValue(input: EventTarget | null): void {
    if (!input) {
      return;
    }
    this.control.setValue((input as HTMLInputElement).value);
  }
  updateControlDisabledState(input: EventTarget | null): void {
    if (!input) {
      return;
    }
    (input as HTMLInputElement).checked ? this.control.disable() : this.control.enable();
  }
}
