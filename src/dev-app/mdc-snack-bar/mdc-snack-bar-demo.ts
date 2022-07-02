/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Directionality} from '@angular/cdk/bidi';
import {Component, TemplateRef, ViewChild, ViewEncapsulation} from '@angular/core';
import {
  MatSnackBar,
  MatSnackBarConfig,
  MatSnackBarHorizontalPosition,
  MatSnackBarVerticalPosition,
  MatSnackBarModule,
} from '@angular/material-experimental/mdc-snack-bar';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material-experimental/mdc-button';
import {MatCheckboxModule} from '@angular/material-experimental/mdc-checkbox';
import {MatFormFieldModule} from '@angular/material-experimental/mdc-form-field';
import {MatInputModule} from '@angular/material-experimental/mdc-input';
import {MatSelectModule} from '@angular/material-experimental/mdc-select';

@Component({
  selector: 'mdc-snack-bar-demo',
  templateUrl: 'mdc-snack-bar-demo.html',
  styleUrls: ['mdc-snack-bar-demo.css'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [
    MatSnackBarModule,
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
})
export class MdcSnackBarDemo {
  @ViewChild('template') template: TemplateRef<any>;
  message = 'Snack Bar opened.';
  actionButtonLabel = 'Retry';
  action = false;
  setAutoHide = true;
  autoHide = 10000;
  addExtraClass = false;
  horizontalPosition: MatSnackBarHorizontalPosition = 'center';
  verticalPosition: MatSnackBarVerticalPosition = 'bottom';

  constructor(public snackBar: MatSnackBar, private _dir: Directionality) {}

  open() {
    const config = this._createConfig();
    this.snackBar.open(this.message, this.action ? this.actionButtonLabel : undefined, config);
  }

  openTemplate() {
    const config = this._createConfig();
    this.snackBar.openFromTemplate(this.template, config);
  }

  private _createConfig() {
    const config = new MatSnackBarConfig();
    config.verticalPosition = this.verticalPosition;
    config.horizontalPosition = this.horizontalPosition;
    config.duration = this.setAutoHide ? this.autoHide : 0;
    config.panelClass = this.addExtraClass ? ['demo-party'] : undefined;
    config.direction = this._dir.value;
    return config;
  }
}
