import {Component, ViewChild, TemplateRef} from '@angular/core';
import {MatDialog, MatDialogRef, MatDialogConfig} from '@angular/material-experimental/mdc-dialog';

@Component({
  selector: 'mdc-dialog-e2e',
  templateUrl: 'mdc-dialog-e2e.html',
})
export class MdcDialogE2E {
  dialogRef: MatDialogRef<TestDialog> | null;

  @ViewChild(TemplateRef) templateRef: TemplateRef<any>;

  constructor(private _dialog: MatDialog) {}

  private _openDialog(config?: MatDialogConfig) {
    this.dialogRef = this._dialog.open(TestDialog, config);
    this.dialogRef.afterClosed().subscribe(() => (this.dialogRef = null));
  }

  openDefault() {
    this._openDialog();
  }

  openDisabled() {
    this._openDialog({
      disableClose: true,
    });
  }

  openTemplate() {
    this.dialogRef = this._dialog.open(this.templateRef);
  }
}

@Component({
  selector: 'dialog-e2e-test',
  template: `
  <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit.</p>
  <input/>
  <button type="button" (click)="dialogRef.close()" id="close">CLOSE</button>`,
})
export class TestDialog {
  constructor(public dialogRef: MatDialogRef<TestDialog>) {}
}
