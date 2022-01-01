/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {BooleanInput, coerceBooleanProperty} from '@angular/cdk/coercion';
import {EXAMPLE_COMPONENTS} from '@angular/components-examples';
import {Component, Input} from '@angular/core';

/**
 * Displays a set of components-examples in a mat-accordion.
 *
 * 在 mat-accordion 中显示一组组件示例。
 *
 */
@Component({
  selector: 'material-example-list',
  template: `
    <mat-accordion multi>
      <mat-expansion-panel *ngFor="let id of ids" [expanded]="expandAll">
        <mat-expansion-panel-header>
          <div class="header">
            <div class="title"> {{exampleComponents[id]?.title}} </div>
            <div class="id"> <{{id}}> </div>
          </div>
        </mat-expansion-panel-header>

        <ng-template matExpansionPanelContent>
          <material-example [id]="id"></material-example>
        </ng-template>
      </mat-expansion-panel>
    </mat-accordion>
  `,
  styles: [
    `
    mat-expansion-panel {
      box-shadow: none !important;
      border-radius: 0 !important;
      background: transparent;
      border-top: 1px solid #CCC;
    }

    .header {
      display: flex;
      justify-content: space-between;
      width: 100%;
      padding-right: 24px;
      align-items: center;
    }

    .id {
      font-family: monospace;
      color: #666;
      font-size: 12px;
    }
  `,
  ],
})
export class ExampleList {
  /**
   * Type of examples being displayed.
   *
   * 正在显示的示例类型。
   *
   */
  @Input() type: string;

  /**
   * IDs of the examples to display.
   *
   * 要显示的示例的 ID。
   *
   */
  @Input() ids: string[];

  @Input()
  get expandAll(): boolean {
    return this._expandAll;
  }
  set expandAll(v: BooleanInput) {
    this._expandAll = coerceBooleanProperty(v);
  }
  _expandAll: boolean;

  exampleComponents = EXAMPLE_COMPONENTS;
}
