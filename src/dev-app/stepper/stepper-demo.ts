/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Component} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {ThemePalette} from '@angular/material/core';
import {CommonModule} from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatStepperModule} from '@angular/material/stepper';

@Component({
  selector: 'stepper-demo',
  templateUrl: 'stepper-demo.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatStepperModule,
    MatSelectModule,
    ReactiveFormsModule,
  ],
})
export class StepperDemo {
  isNonLinear = false;
  isNonEditable = false;
  disableRipple = false;
  showLabelBottom = false;
  isVertical = false;

  nameFormGroup = this._formBuilder.group({
    firstNameCtrl: ['', Validators.required],
    lastNameCtrl: ['', Validators.required],
  });

  emailFormGroup = this._formBuilder.group({
    emailCtrl: ['', Validators.email],
  });

  formGroup = this._formBuilder.group({
    formArray: this._formBuilder.array([
      this._formBuilder.group({
        firstNameFormCtrl: this._formBuilder.control('', [Validators.required]),
        lastNameFormCtrl: this._formBuilder.control('', [Validators.required]),
      }),
      this._formBuilder.group({
        emailFormCtrl: this._formBuilder.control('', [Validators.email]),
      }),
    ]),
  });

  steps = [
    {label: 'Confirm your name', content: 'Last name, First name.'},
    {label: 'Confirm your contact information', content: '123-456-7890'},
    {label: 'Confirm your address', content: '1600 Amphitheater Pkwy MTV'},
    {label: 'You are now done', content: 'Finished!'},
  ];

  availableThemes: {value: ThemePalette; name: string}[] = [
    {value: 'primary', name: 'Primary'},
    {value: 'accent', name: 'Accent'},
    {value: 'warn', name: 'Warn'},
  ];

  theme = this.availableThemes[0].value;

  /**
   * Returns a FormArray with the name 'formArray'.
   *
   * 返回一个名为“formArray”的 FormArray。
   *
   */
  get formArray(): AbstractControl | null {
    return this.formGroup.get('formArray');
  }

  constructor(private _formBuilder: FormBuilder) {}
}
