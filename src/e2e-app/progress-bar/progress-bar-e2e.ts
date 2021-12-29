import {Component} from '@angular/core';

@Component({
  selector: 'progress-bar-e2e',
  templateUrl: 'progress-bar-e2e.html',
  styles: [
    `
    mat-progress-bar {
      margin-bottom: 10px;
    }
  `,
  ],
})
export class ProgressBarE2E {
  determinateValue: number = 57;
  bufferValue: number = 35;
}
