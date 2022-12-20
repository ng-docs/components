/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ChangeDetectionStrategy, Component, Inject, ViewEncapsulation} from '@angular/core';
import {MatSnackBarRef} from './snack-bar-ref';
import {MAT_SNACK_BAR_DATA} from './snack-bar-config';

/**
 * Interface for a simple snack bar component that has a message and a single action.
 *
 * 简单快餐栏组件的接口，它包含一条消息和一个动作。
 *
 */
export interface TextOnlySnackBar {
  data: {message: string; action: string};
  snackBarRef: MatSnackBarRef<TextOnlySnackBar>;
  action: () => void;
  hasAction: boolean;
}

@Component({
  selector: 'simple-snack-bar',
  templateUrl: 'simple-snack-bar.html',
  styleUrls: ['simple-snack-bar.css'],
  exportAs: 'matSnackBar',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'mat-mdc-simple-snack-bar',
  },
})
export class SimpleSnackBar implements TextOnlySnackBar {
  constructor(
    public snackBarRef: MatSnackBarRef<SimpleSnackBar>,
    @Inject(MAT_SNACK_BAR_DATA) public data: {message: string; action: string},
  ) {}

  /**
   * Performs the action on the snack bar.
   *
   * 执行快餐店里的动作。
   *
   */
  action(): void {
    this.snackBarRef.dismissWithAction();
  }

  /**
   * If the action button should be shown.
   *
   * 是否要显示动作按钮。
   *
   */
  get hasAction(): boolean {
    return !!this.data.action;
  }
}
