/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ChangeDetectionStrategy, Component, Inject, ViewEncapsulation} from '@angular/core';
import {MAT_SNACK_BAR_DATA} from './snack-bar-config';
import {MatSnackBarRef} from './snack-bar-ref';

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

/**
 * A component used to open as the default snack bar, matching material spec.
 * This should only be used internally by the snack bar service.
 *
 * 用来打开默认快餐栏的组件，匹配 Material 规范。这应该只在快餐栏服务的内部使用。
 *
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
export class SimpleSnackBar implements TextOnlySnackBar {
  /**
   * Data that was injected into the snack bar.
   *
   * 那些注入快餐栏的数据。
   *
   */
  data: {message: string; action: string};

  constructor(
    public snackBarRef: MatSnackBarRef<SimpleSnackBar>,
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
