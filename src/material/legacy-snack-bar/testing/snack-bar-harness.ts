/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {HarnessPredicate} from '@angular/cdk/testing';
import {_MatSnackBarHarnessBase, SnackBarHarnessFilters} from '@angular/material/snack-bar/testing';

/**
 * Harness for interacting with a standard mat-snack-bar in tests.
 *
 * 在测试中用来与标准 mat-snack-bar 进行交互的测试工具。
 *
 * @deprecated
 *
 * Use `MatSnackBarHarness` from `@angular/material/snack-bar/testing` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
export class MatLegacySnackBarHarness extends _MatSnackBarHarnessBase {
  // Developers can provide a custom component or template for the snackbar. The canonical snack-bar
  // parent is the "MatSnackBarContainer". We use `:not([mat-exit])` to exclude snack bars that
  // are in the process of being dismissed, because the element only gets removed after the
  // animation is finished and since it runs outside of Angular, we don't have a way of being
  // notified when it's done.
  /**
   * The selector for the host element of a `MatSnackBar` instance.
   *
   * `MatSnackBar` 实例的宿主元素选择器。
   *
   */
  static hostSelector = '.mat-snack-bar-container';
  protected override _messageSelector = '.mat-simple-snackbar > span';
  protected override _actionButtonSelector = '.mat-simple-snackbar-action > button';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a snack bar with specific attributes.
   *
   * 获取可用于搜索具有特定属性的快餐栏的 `HarnessPredicate` 。
   *
   * @param options Options for filtering which snack bar instances are considered a match.
   *
   * 用于筛选哪些快餐栏实例应该视为匹配项的选项。
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 使用给定选项配置过的 `HarnessPredicate`。
   */
  static with(options: SnackBarHarnessFilters = {}): HarnessPredicate<MatLegacySnackBarHarness> {
    return new HarnessPredicate(MatLegacySnackBarHarness, options);
  }

  protected override async _assertContentAnnotated() {
    if (!(await this._isSimpleSnackBar())) {
      throw Error('Method cannot be used for snack-bar with custom content.');
    }
  }

  /** Whether the snack-bar is using the default content template. */
  private async _isSimpleSnackBar(): Promise<boolean> {
    return (await this.locatorForOptional('.mat-simple-snackbar')()) !== null;
  }
}
