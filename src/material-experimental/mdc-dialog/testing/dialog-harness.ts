/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {HarnessPredicate} from '@angular/cdk/testing';
import {DialogHarnessFilters, _MatDialogHarnessBase} from '@angular/material/dialog/testing';

/** Selectors for different sections of the mat-dialog that can contain user content. */
export const enum MatDialogSection {
  TITLE = '.mat-mdc-dialog-title',
  CONTENT = '.mat-mdc-dialog-content',
  ACTIONS = '.mat-mdc-dialog-actions',
}

/** Harness for interacting with a standard `MatDialog` in tests. */
export class MatDialogHarness extends _MatDialogHarnessBase {
  /** The selector for the host element of a `MatDialog` instance. */
  static hostSelector = '.mat-mdc-dialog-container';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `MatDialogHarness` that meets
   * certain criteria.
   * @param options Options for filtering which dialog instances are considered a match.
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with(options: DialogHarnessFilters = {}): HarnessPredicate<MatDialogHarness> {
    return new HarnessPredicate(MatDialogHarness, options);
  }

  protected override _title = this.locatorForOptional(MatDialogSection.TITLE);
  protected override _content = this.locatorForOptional(MatDialogSection.CONTENT);
  protected override _actions = this.locatorForOptional(MatDialogSection.ACTIONS);
}
