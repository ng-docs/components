/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ComponentType} from '@angular/cdk/overlay';
import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  NgModule,
  OnDestroy,
  ViewEncapsulation,
} from '@angular/core';
import {
  MatDialog,
  MatDialogConfig,
  MatDialogContainer,
  MatDialogModule,
  _MatDialogBase,
  _MatDialogContainerBase,
  MatDialogRef,
} from '@angular/material/dialog';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {Subscription} from 'rxjs';

/**
 * Base class for a component that immediately opens a dialog when created.
 *
 * 可以在创建时立即打开对话框的组件的基类。
 *
 */
@Directive()
export class _MatTestDialogOpenerBase<C extends _MatDialogContainerBase, T, R>
  implements OnDestroy
{
  /**
   * Component that should be opened with the MatDialog `open` method.
   *
   * 要使用 MatDialog `open` 方法打开的组件。
   *
   */
  protected static component: ComponentType<unknown> | undefined;

  /**
   * Config that should be provided to the MatDialog `open` method.
   *
   * 要提供给 MatDialog `open` 方法的配置。
   *
   */
  protected static config: MatDialogConfig | undefined;

  /**
   * MatDialogRef returned from the MatDialog `open` method.
   *
   * 从 MatDialog `open` 方法返回的 MatDialogRef。
   *
   */
  dialogRef: MatDialogRef<T, R>;

  /**
   * Data passed to the `MatDialog` close method.
   *
   * 传递给 `MatDialog` 的 `close` 方法的数据。
   *
   */
  closedResult: R | undefined;

  private readonly _afterClosedSubscription: Subscription;

  constructor(public dialog: _MatDialogBase<C>) {
    if (!_MatTestDialogOpenerBase.component) {
      throw new Error(`MatTestDialogOpener does not have a component provided.`);
    }

    this.dialogRef = this.dialog.open<T, R>(
      _MatTestDialogOpenerBase.component as ComponentType<T>,
      _MatTestDialogOpenerBase.config || {},
    );
    this._afterClosedSubscription = this.dialogRef.afterClosed().subscribe(result => {
      this.closedResult = result;
    });
  }

  ngOnDestroy() {
    this._afterClosedSubscription.unsubscribe();
    _MatTestDialogOpenerBase.component = undefined;
    _MatTestDialogOpenerBase.config = undefined;
  }
}

/**
 * Test component that immediately opens a dialog when bootstrapped.
 *
 * 可以在创建时立即打开对话框的测试组件。
 *
 */
@Component({
  selector: 'mat-test-dialog-opener',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class MatTestDialogOpener<T = unknown, R = unknown> extends _MatTestDialogOpenerBase<
  MatDialogContainer,
  T,
  R
> {
  constructor(dialog: MatDialog) {
    super(dialog);
  }

  /**
   * Static method that prepares this class to open the provided component.
   *
   * 一个静态方法，可以准备此类以打开所提供的组件。
   *
   */
  static withComponent<T = unknown, R = unknown>(
    component: ComponentType<T>,
    config?: MatDialogConfig,
  ) {
    _MatTestDialogOpenerBase.component = component;
    _MatTestDialogOpenerBase.config = config;
    return MatTestDialogOpener as ComponentType<MatTestDialogOpener<T, R>>;
  }
}

@NgModule({
  declarations: [MatTestDialogOpener],
  imports: [MatDialogModule, NoopAnimationsModule],
})
export class MatTestDialogOpenerModule {}
