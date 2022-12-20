/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Component} from '@angular/core';
import {ThemePalette} from '@angular/material/core';
import {FormsModule} from '@angular/forms';
import {MatLegacyButtonModule} from '@angular/material/legacy-button';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {MatLegacyProgressBarModule} from '@angular/material/legacy-progress-bar';

// TODO(josephperrott): Add an automatically filling example progress bar.

@Component({
  selector: 'legacy-progress-bar-demo',
  templateUrl: 'legacy-progress-bar-demo.html',
  styleUrls: ['legacy-progress-bar-demo.css'],
  standalone: true,
  imports: [FormsModule, MatLegacyButtonModule, MatButtonToggleModule, MatLegacyProgressBarModule],
})
export class LegacyProgressBarDemo {
  color: ThemePalette = 'primary';
  determinateProgressValue: number = 30;
  determinateAnimationEndValue: number;
  bufferAnimationEndValue: number;
  bufferProgressValue: number = 30;
  bufferBufferValue: number = 40;

  stepDeterminateProgressVal(val: number) {
    this.determinateProgressValue = this._clampValue(val + this.determinateProgressValue);
  }

  stepBufferProgressVal(val: number) {
    this.bufferProgressValue = this._clampValue(val + this.bufferProgressValue);
  }

  stepBufferBufferVal(val: number) {
    this.bufferBufferValue = this._clampValue(val + this.bufferBufferValue);
  }

  private _clampValue(value: number) {
    return Math.max(0, Math.min(100, value));
  }
}
