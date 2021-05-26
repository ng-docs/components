/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ContentContainerComponentHarness, HarnessPredicate, TestKey} from '@angular/cdk/testing';
import {DialogRole} from '@angular/material/dialog';
import {DialogHarnessFilters} from './dialog-harness-filters';

/**
 * Harness for interacting with a standard `MatDialog` in tests.
 *
 * 在测试中与标准 `MatDialog` 进行交互的测试工具。
 *
 */
export class MatDialogHarness extends ContentContainerComponentHarness<string> {
  // Developers can provide a custom component or template for the
  // dialog. The canonical dialog parent is the "MatDialogContainer".
  /**
   * The selector for the host element of a `MatDialog` instance.
   *
   * `MatDialog` 实例的宿主元素选择器。
   *
   */
  static hostSelector = '.mat-dialog-container';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `MatDialogHarness` that meets
   * certain criteria.
   *
   * 获取一个 `HarnessPredicate`，可用于搜索满足某些条件的 `MatDialogHarness`。
   *
   * @param options Options for filtering which dialog instances are considered a match.
   *
   * 用于过滤哪些对话框实例应该视为匹配的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with(options: DialogHarnessFilters = {}): HarnessPredicate<MatDialogHarness> {
    return new HarnessPredicate(MatDialogHarness, options);
  }

  /**
   * Gets the id of the dialog.
   *
   * 获取此对话框的 ID。
   *
   */
  async getId(): Promise<string|null> {
    const id = await (await this.host()).getAttribute('id');
    // In case no id has been specified, the "id" property always returns
    // an empty string. To make this method more explicit, we return null.
    return id !== '' ? id : null;
  }

  /**
   * Gets the role of the dialog.
   *
   * 获取此对话框的角色。
   *
   */
  async getRole(): Promise<DialogRole|null> {
    return (await this.host()).getAttribute('role') as Promise<DialogRole|null>;
  }

  /**
   * Gets the value of the dialog's "aria-label" attribute.
   *
   * 获取此对话框的 “aria-label” 属性的值。
   *
   */
  async getAriaLabel(): Promise<string|null> {
    return (await this.host()).getAttribute('aria-label');
  }

  /**
   * Gets the value of the dialog's "aria-labelledby" attribute.
   *
   * 获取此对话框的 “aria-labelledby” 属性的值。
   *
   */
  async getAriaLabelledby(): Promise<string|null> {
    return (await this.host()).getAttribute('aria-labelledby');
  }

  /**
   * Gets the value of the dialog's "aria-describedby" attribute.
   *
   * 获取此对话框的 “aria-describedby” 属性的值。
   *
   */
  async getAriaDescribedby(): Promise<string|null> {
    return (await this.host()).getAttribute('aria-describedby');
  }

  /**
   * Closes the dialog by pressing escape.
   *
   * 通过按 Esc 键关闭对话框。
   *
   * Note: this method does nothing if `disableClose` has been set to `true` for the dialog.
   *
   * 注意：如果对话框的 `disableClose` 设置为 `true`，则此方法不执行任何操作。
   *
   */
  async close(): Promise<void> {
    await (await this.host()).sendKeys(TestKey.ESCAPE);
  }
}
