/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {HarnessPredicate} from '@angular/cdk/testing';
import {_MatDialogHarnessBase, DialogHarnessFilters} from '@angular/material/dialog/testing';

/**
 * Selectors for different sections of the mat-dialog that can contain user content.
 *
 * 可以包含用户内容的 mat-dialog 不同部分的选择器。
 *
 * @deprecated
 *
 * Use `enum` from `@angular/material/dialog/testing` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 * @breaking-change 17.0.0
 */
export const enum MatLegacyDialogSection {
  TITLE = '.mat-dialog-title',
  CONTENT = '.mat-dialog-content',
  ACTIONS = '.mat-dialog-actions',
}

/**
 * Harness for interacting with a standard `MatDialog` in tests.
 *
 * 用于在测试中与标准 `MatDialog` 交互的工具。
 *
 * @deprecated
 *
 * Use `MatDialogHarness` from `@angular/material/dialog/testing` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
export class MatLegacyDialogHarness extends _MatDialogHarnessBase {
  // Developers can provide a custom component or template for the
  // dialog. The canonical dialog parent is the "MatDialogContainer".
  /**
   * The selector for the host element of a `MatDialog` instance.
   *
   * `MatDialog` 实例的宿主元素的选择器。
   *
   */
  static hostSelector = '.mat-dialog-container';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `MatDialogHarness` that meets
   * certain criteria.
   *
   * 获取可用于搜索满足特定条件的 `HarnessPredicate` 的 `MatDialogHarness` 。
   *
   * @param options Options for filtering which dialog instances are considered a match.
   *
   * 用于过滤哪些对话框实例应该视为匹配的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 使用给定选项配置过的 `HarnessPredicate`。
   *
   */
  static with(options: DialogHarnessFilters = {}): HarnessPredicate<MatLegacyDialogHarness> {
    return new HarnessPredicate(MatLegacyDialogHarness, options);
  }

  protected override _title = this.locatorForOptional(MatLegacyDialogSection.TITLE);
  protected override _content = this.locatorForOptional(MatLegacyDialogSection.CONTENT);
  protected override _actions = this.locatorForOptional(MatLegacyDialogSection.ACTIONS);
}
