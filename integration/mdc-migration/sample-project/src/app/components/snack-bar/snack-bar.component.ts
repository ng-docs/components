import {Component} from '@angular/core';
import {MatLegacySnackBar as MatSnackBar} from '@angular/material/legacy-snack-bar';

@Component({
  selector: 'snack-bar-example',
  templateUrl: './snack-bar.component.html',
  styleUrls: ['./snack-bar.component.scss'],
})
export class SnackBarComponent {
  constructor(private _snackBar: MatSnackBar) {}

  openSnackBar(message: string) {
    this._snackBar.open(message, 'Dismiss');
  }
}
