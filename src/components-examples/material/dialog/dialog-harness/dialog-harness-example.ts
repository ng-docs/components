import {Component, TemplateRef, ViewChild} from '@angular/core';
import {MatDialog, MatDialogConfig, MatDialogModule} from '@angular/material/dialog';

/**
 * @title Testing with MatDialogHarness
 */
@Component({
  selector: 'dialog-harness-example',
  templateUrl: 'dialog-harness-example.html',
  standalone: true,
  imports: [MatDialogModule],
})
export class DialogHarnessExample {
  @ViewChild(TemplateRef) dialogTemplate: TemplateRef<any>;

  constructor(readonly dialog: MatDialog) {}

  open(config?: MatDialogConfig) {
    return this.dialog.open(this.dialogTemplate, config);
  }
}
