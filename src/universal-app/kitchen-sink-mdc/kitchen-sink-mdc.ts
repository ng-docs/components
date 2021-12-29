import {Component, NgModule, ErrorHandler} from '@angular/core';
import {MatAutocompleteModule} from '@angular/material-experimental/mdc-autocomplete';
import {MatButtonModule} from '@angular/material-experimental/mdc-button';
import {MatCardModule} from '@angular/material-experimental/mdc-card';
import {MatCheckboxModule} from '@angular/material-experimental/mdc-checkbox';
import {MatFormFieldModule} from '@angular/material-experimental/mdc-form-field';
import {MatInputModule} from '@angular/material-experimental/mdc-input';
import {MatListModule} from '@angular/material-experimental/mdc-list';
import {MatProgressBarModule} from '@angular/material-experimental/mdc-progress-bar';
import {MatChipsModule} from '@angular/material-experimental/mdc-chips';
import {MatMenuModule} from '@angular/material-experimental/mdc-menu';
import {MatRadioModule} from '@angular/material-experimental/mdc-radio';
import {MatSlideToggleModule} from '@angular/material-experimental/mdc-slide-toggle';
import {MatSliderModule} from '@angular/material-experimental/mdc-slider';
import {MatTabsModule} from '@angular/material-experimental/mdc-tabs';
import {MatTableModule} from '@angular/material-experimental/mdc-table';
import {MatDialog, MatDialogModule} from '@angular/material-experimental/mdc-dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatSnackBarModule, MatSnackBar} from '@angular/material-experimental/mdc-snack-bar';
import {MatProgressSpinnerModule} from '@angular/material-experimental/mdc-progress-spinner';
import {MatSelectModule} from '@angular/material-experimental/mdc-select';
import {MatPaginatorModule} from '@angular/material-experimental/mdc-paginator';

@Component({
  template: `<button>Do the thing</button>`,
})
export class TestEntryComponent {}

@Component({
  selector: 'kitchen-sink-mdc',
  templateUrl: './kitchen-sink-mdc.html',
})
export class KitchenSinkMdc {
  constructor(dialog: MatDialog) {
    dialog.open(TestEntryComponent);
  }
}

@NgModule({
  imports: [
    MatAutocompleteModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatChipsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatMenuModule,
    MatRadioModule,
    MatSlideToggleModule,
    MatSliderModule,
    MatTabsModule,
    MatTableModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatPaginatorModule,
  ],
  declarations: [KitchenSinkMdc, TestEntryComponent],
  exports: [KitchenSinkMdc, TestEntryComponent],
  providers: [
    {
      // If an error is thrown asynchronously during server-side rendering it'll get logged to stderr,
      // but it won't cause the build to fail. We still want to catch these errors so we provide an
      // `ErrorHandler` that re-throws the error and causes the process to exit correctly.
      provide: ErrorHandler,
      useValue: {handleError: ERROR_HANDLER},
    },
  ],
})
export class KitchenSinkMdcModule {
  constructor(snackBar: MatSnackBar) {
    snackBar.open('Hello there');
  }
}

export function ERROR_HANDLER(error: Error) {
  throw error;
}
