import {Component} from '@angular/core';
import {FormBuilder, Validators} from '@angular/forms';

/**
 * @title Slide-toggle with forms
 */
@Component({
  selector: 'slide-toggle-forms-example',
  templateUrl: './slide-toggle-forms-example.html',
  styleUrls: ['./slide-toggle-forms-example.css'],
})
export class SlideToggleFormsExample {
  isChecked = true;
  formGroup = this._formBuilder.group({
    enableWifi: '',
    acceptTerms: ['', Validators.requiredTrue],
  });

  constructor(private _formBuilder: FormBuilder) {}

  onFormSubmit() {
    alert(JSON.stringify(this.formGroup.value, null, 2));
  }
}
