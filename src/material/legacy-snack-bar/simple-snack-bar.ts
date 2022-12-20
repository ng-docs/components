/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ChangeDetectionStrategy, Component, Inject, ViewEncapsulation} from '@angular/core';
import {TextOnlySnackBar, MatSnackBarRef, MAT_SNACK_BAR_DATA} from '@angular/material/snack-bar';

/**
 * A component used to open as the default snack bar, matching material spec.
 * This should only be used internally by the snack bar service.
 *
 * 用来打开默认快餐栏的组件，匹配 Material 规范。这应该只在快餐栏服务的内部使用。
 *
 * @deprecated
 *
 * Use `SimpleSnackBar` from `@angular/material/snack-bar` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
@Component({
  selector: 'simple-snack-bar',
  templateUrl: 'simple-snack-bar.html',
  styleUrls: ['simple-snack-bar.css'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'mat-simple-snackbar',
  },
})
export class LegacySimpleSnackBar implements TextOnlySnackBar {
  /**
   * Data that was injected into the snack bar.
   *
   * 那些注入快餐栏的数据。
   *
   */
  data: {message: string; action: string};

  constructor(
    public snackBarRef: MatSnackBarRef<LegacySimpleSnackBar>,
    @Inject(MAT_SNACK_BAR_DATA) data: any,
  ) {
    this.data = data;
  }

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
