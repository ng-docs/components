/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  ComponentHarnessConstructor,
  ContentContainerComponentHarness,
  HarnessPredicate,
  TestKey,
} from '@angular/cdk/testing';
import {DialogHarnessFilters} from './dialog-harness-filters';
import {DialogRole} from '@angular/material/dialog';

/**
 * Selectors for different sections of the mat-dialog that can contain user content.
 *
 * 针对包含用户内容的 mat-dialog 不同部分的选择器。
 *
 */
export const enum MatDialogSection {
  TITLE = '.mat-mdc-dialog-title',
  CONTENT = '.mat-mdc-dialog-content',
  ACTIONS = '.mat-mdc-dialog-actions',
}

/**
 * Base class for the `MatDialogHarness` implementation.
 *
 * `MatDialogHarness` 实现的基类。
 *
 */
export class _MatDialogHarnessBase
  // @breaking-change 14.0.0 change generic type to MatDialogSection.
  extends ContentContainerComponentHarness<MatDialogSection | string>
{
  protected _title = this.locatorForOptional(MatDialogSection.TITLE);
  protected _content = this.locatorForOptional(MatDialogSection.CONTENT);
  protected _actions = this.locatorForOptional(MatDialogSection.ACTIONS);

  /**
   * Gets the id of the dialog.
   *
   * 获取此对话框的 ID。
   *
   */
  async getId(): Promise<string | null> {
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
  async getRole(): Promise<DialogRole | null> {
    return (await this.host()).getAttribute('role') as Promise<DialogRole | null>;
  }

  /**
   * Gets the value of the dialog's "aria-label" attribute.
   *
   * 获取此对话框的 “aria-label” 属性的值。
   *
   */
  async getAriaLabel(): Promise<string | null> {
    return (await this.host()).getAttribute('aria-label');
  }

  /**
   * Gets the value of the dialog's "aria-labelledby" attribute.
   *
   * 获取此对话框的 “aria-labelledby” 属性的值。
   *
   */
  async getAriaLabelledby(): Promise<string | null> {
    return (await this.host()).getAttribute('aria-labelledby');
  }

  /**
   * Gets the value of the dialog's "aria-describedby" attribute.
   *
   * 获取此对话框的 “aria-describedby” 属性的值。
   *
   */
  async getAriaDescribedby(): Promise<string | null> {
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

  /**
   * Gets te dialog's text.
   *
   * 获取对话框的文本。
   *
   */
  async getText() {
    return (await this.host()).text();
  }

  /**
   * Gets the dialog's title text. This only works if the dialog is using mat-dialog-title.
   *
   * 获取对话框的标题文本。这仅在对话框使用 mat-dialog-title 时才有效。
   *
   */
  async getTitleText() {
    return (await this._title())?.text() ?? '';
  }

  /**
   * Gets the dialog's content text. This only works if the dialog is using mat-dialog-content.
   *
   * 获取对话框的内容文本。这仅在对话框使用 mat-dialog-content 时才有效。
   *
   */
  async getContentText() {
    return (await this._content())?.text() ?? '';
  }

  /**
   * Gets the dialog's actions text. This only works if the dialog is using mat-dialog-actions.
   *
   * 获取对话框的操作文本。这仅在对话框使用 mat-dialog-actions 时才有效。
   *
   */
  async getActionsText() {
    return (await this._actions())?.text() ?? '';
  }
}

/**
 * Harness for interacting with a standard `MatDialog` in tests.
 *
 * 用于在测试中与标准 `MatDialog` 交互的工具。
 *
 */
export class MatDialogHarness extends _MatDialogHarnessBase {
  /**
   * The selector for the host element of a `MatDialog` instance.
   *
   * `MatDialog` 实例的宿主元素的选择器。
   *
   */
  static hostSelector = '.mat-mdc-dialog-container';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a dialog with specific attributes.
   *
   * 获取可用于搜索满足特定条件的 `HarnessPredicate` 的 `MatDialogHarness` 。
   *
   * @param options Options for filtering which dialog instances are considered a match.
   *
   * 用于过滤哪些对话框实例应该视为匹配的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 使用给定选项配置的 `HarnessPredicate` 。
   *
   */
  static with<T extends MatDialogHarness>(
    this: ComponentHarnessConstructor<T>,
    options: DialogHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options);
  }
}
