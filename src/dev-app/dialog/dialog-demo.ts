/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Component, Inject, TemplateRef, ViewChild, ViewEncapsulation} from '@angular/core';
import {DOCUMENT} from '@angular/common';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {FormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogConfig,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';

const defaultDialogConfig = new MatDialogConfig();

@Component({
  selector: 'dialog-demo',
  templateUrl: 'dialog-demo.html',
  styleUrls: ['dialog-demo.css'],
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
})
export class DialogDemo {
  dialogRef: MatDialogRef<JazzDialog> | null;
  lastAfterClosedResult: string;
  lastBeforeCloseResult: string;
  actionsAlignment: 'start' | 'center' | 'end';
  config = {
    disableClose: false,
    panelClass: 'custom-overlay-pane-class',
    hasBackdrop: true,
    backdropClass: '',
    width: '',
    height: '',
    minWidth: '',
    minHeight: '',
    enterAnimationDuration: defaultDialogConfig.enterAnimationDuration,
    exitAnimationDuration: defaultDialogConfig.exitAnimationDuration,
    maxWidth: defaultDialogConfig.maxWidth,
    maxHeight: '',
    position: {
      top: '',
      bottom: '',
      left: '',
      right: '',
    },
    data: {
      message: 'Jazzy jazz jazz',
    },
  };
  numTemplateOpens = 0;

  @ViewChild(TemplateRef) template: TemplateRef<any>;

  constructor(public dialog: MatDialog, @Inject(DOCUMENT) doc: any) {
    // Possible useful example for the open and closeAll events.
    // Adding a class to the body if a dialog opens and
    // removing it after all open dialogs are closed
    dialog.afterOpened.subscribe(() => {
      if (!doc.body.classList.contains('no-scroll')) {
        doc.body.classList.add('no-scroll');
      }
    });
    dialog.afterAllClosed.subscribe(() => {
      doc.body.classList.remove('no-scroll');
    });
  }

  openJazz() {
    this.dialogRef = this.dialog.open(JazzDialog, this.config);

    this.dialogRef.beforeClosed().subscribe((result: string) => {
      this.lastBeforeCloseResult = result;
    });
    this.dialogRef.afterClosed().subscribe((result: string) => {
      this.lastAfterClosedResult = result;
      this.dialogRef = null;
    });
  }

  openContentElement() {
    const dialogRef = this.dialog.open(ContentElementDialog, this.config);
    dialogRef.componentInstance.actionsAlignment = this.actionsAlignment;
  }

  openTemplate() {
    this.numTemplateOpens++;
    this.dialog.open(this.template, this.config);
  }
}

@Component({
  selector: 'demo-jazz-dialog',
  template: `
    <div cdkDrag cdkDragRootElement=".cdk-overlay-pane">
      <p>It's Jazz!</p>

      <mat-form-field>
        <mat-label>How much?</mat-label>
        <input matInput #howMuch>
      </mat-form-field>

      <p cdkDragHandle>{{ data.message }} (use this message to drag the dialog)</p>
      <button type="button" (click)="dialogRef.close(howMuch.value)">Close dialog</button>
      <button (click)="togglePosition()">Change dimensions</button>
      <button (click)="temporarilyHide()">Hide for 2 seconds</button>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  styles: [`.hidden-dialog { opacity: 0; }`],
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule, DragDropModule],
})
export class JazzDialog {
  private _dimesionToggle = false;

  constructor(
    public dialogRef: MatDialogRef<JazzDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}

  togglePosition(): void {
    this._dimesionToggle = !this._dimesionToggle;

    if (this._dimesionToggle) {
      this.dialogRef.updateSize('500px', '500px').updatePosition({top: '25px', left: '25px'});
    } else {
      this.dialogRef.updateSize().updatePosition();
    }
  }

  temporarilyHide(): void {
    this.dialogRef.addPanelClass('hidden-dialog');
    setTimeout(() => {
      this.dialogRef.removePanelClass('hidden-dialog');
    }, 2000);
  }
}

@Component({
  selector: 'demo-content-element-dialog',
  styles: [
    `
    img {
      max-width: 100%;
    }
  `,
  ],
  template: `
    <h2 mat-dialog-title>Neptune</h2>

    <mat-dialog-content>
      <img src="https://upload.wikimedia.org/wikipedia/commons/5/56/Neptune_Full.jpg"/>

      <p>
        Neptune is the eighth and farthest known planet from the Sun in the Solar System. In the
        Solar System, it is the fourth-largest planet by diameter, the third-most-massive planet,
        and the densest giant planet. Neptune is 17 times the mass of Earth and is slightly more
        massive than its near-twin Uranus, which is 15 times the mass of Earth and slightly larger
        than Neptune. Neptune orbits the Sun once every 164.8 years at an average distance of 30.1
        astronomical units (4.50×109 km). It is named after the Roman god of the sea and has the
        astronomical symbol ♆, a stylised version of the god Neptune's trident.
      </p>
    </mat-dialog-content>

    <mat-dialog-actions [align]="actionsAlignment">
      <button
        mat-raised-button
        color="primary"
        mat-dialog-close>Close</button>

      <a
        mat-button
        color="primary"
        href="https://en.wikipedia.org/wiki/Neptune"
        target="_blank">Read more on Wikipedia</a>

      <button
        mat-button
        color="accent"
        (click)="showInStackedDialog()">
        Show in Dialog</button>
    </mat-dialog-actions>
  `,
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
})
export class ContentElementDialog {
  actionsAlignment: 'start' | 'center' | 'end';

  constructor(public dialog: MatDialog) {}

  showInStackedDialog() {
    this.dialog.open(IFrameDialog);
  }
}

@Component({
  selector: 'demo-iframe-dialog',
  styles: [
    `
    iframe {
      width: 800px;
    }
  `,
  ],
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Neptune</h2>

    <mat-dialog-content>
      <iframe frameborder="0" src="https://en.wikipedia.org/wiki/Neptune"></iframe>
    </mat-dialog-content>

    <mat-dialog-actions>
      <button
        mat-raised-button
        color="primary"
        mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `,
})
export class IFrameDialog {}
