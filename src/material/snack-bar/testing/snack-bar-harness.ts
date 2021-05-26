/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {AriaLivePoliteness} from '@angular/cdk/a11y';
import {ContentContainerComponentHarness, HarnessPredicate, parallel} from '@angular/cdk/testing';
import {SnackBarHarnessFilters} from './snack-bar-harness-filters';

/**
 * Harness for interacting with a standard mat-snack-bar in tests.
 *
 * 在测试中用来与标准 mat-snack-bar 进行交互的测试工具。
 *
 */
export class MatSnackBarHarness extends ContentContainerComponentHarness<string> {
  // Developers can provide a custom component or template for the
  // snackbar. The canonical snack-bar parent is the "MatSnackBarContainer".
  /**
   * The selector for the host element of a `MatSnackBar` instance.
   *
   * `MatSnackBar` 实例的宿主元素选择器。
   *
   */
  static hostSelector = '.mat-snack-bar-container';
  protected _messageSelector = '.mat-simple-snackbar > span';
  protected _simpleSnackBarSelector = '.mat-simple-snackbar';
  protected _actionButtonSelector = '.mat-simple-snackbar-action > button';
  private _simpleSnackBarLiveRegion = this.locatorFor('[aria-live]');

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `MatSnackBarHarness` that meets
   * certain criteria.
   *
   * 获取一个 `HarnessPredicate`，可用于搜索满足某些条件的 `MatSnackBarHarness`。
   *
   * @param options Options for filtering which snack bar instances are considered a match.
   *
   * 用于筛选哪些快餐栏实例应该视为匹配项的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with(options: SnackBarHarnessFilters = {}): HarnessPredicate<MatSnackBarHarness> {
    return new HarnessPredicate(MatSnackBarHarness, options);
  }

  /**
   * Gets the role of the snack-bar. The role of a snack-bar is determined based
   * on the ARIA politeness specified in the snack-bar config.
   *
   * 获取快餐栏的角色。快餐栏的角色是根据快餐栏配置中指定的 ARIA politeness 来确定的。
   *
   * @deprecated Use `getAriaLive` instead.
   *
   * 请改用 `getAriaLive`。
   *
   * @breaking-change 13.0.0
   */
  async getRole(): Promise<'alert'|'status'|null> {
    return (await this.host()).getAttribute('role') as Promise<'alert'|'status'|null>;
  }

  /**
   * Gets the aria-live of the snack-bar's live region. The aria-live of a snack-bar is
   * determined based on the ARIA politeness specified in the snack-bar config.
   *
   * 获取此快餐栏现场区域的 aria-live。快餐栏的 aria-live 是根据快餐栏配置中指定的 ARIA politeness 来确定的。
   *
   */
  async getAriaLive(): Promise<AriaLivePoliteness> {
    return (await this._simpleSnackBarLiveRegion())
        .getAttribute('aria-live') as Promise<AriaLivePoliteness>;
  }

  /**
   * Whether the snack-bar has an action. Method cannot be used for snack-bar's with custom content.
   *
   * 此快餐栏是否有动作。该方法不能用于具有自定义内容的快餐栏。
   *
   */
  async hasAction(): Promise<boolean> {
    await this._assertSimpleSnackBar();
    return (await this._getSimpleSnackBarActionButton()) !== null;
  }

  /**
   * Gets the description of the snack-bar. Method cannot be used for snack-bar's without action or
   * with custom content.
   *
   * 获取此快餐栏的描述。该方法不能用于没有动作或带有自定义内容的快餐栏。
   *
   */
  async getActionDescription(): Promise<string> {
    await this._assertSimpleSnackBarWithAction();
    return (await this._getSimpleSnackBarActionButton())!.text();
  }

  /**
   * Dismisses the snack-bar by clicking the action button. Method cannot be used for snack-bar's
   * without action or with custom content.
   *
   * 通过单击动作按钮关闭快餐栏。该方法不能用于没有动作或带有自定义内容的快餐栏。
   *
   */
  async dismissWithAction(): Promise<void> {
    await this._assertSimpleSnackBarWithAction();
    await (await this._getSimpleSnackBarActionButton())!.click();
  }

  /**
   * Gets the message of the snack-bar. Method cannot be used for snack-bar's with custom content.
   *
   * 获取此快餐栏的消息。该方法不能用于具有自定义内容的快餐栏。
   *
   */
  async getMessage(): Promise<string> {
    await this._assertSimpleSnackBar();
    return (await this.locatorFor(this._messageSelector)()).text();
  }

  /**
   * Gets whether the snack-bar has been dismissed.
   *
   * 获取此快餐栏是否已关闭。
   *
   */
  async isDismissed(): Promise<boolean> {
    // We consider the snackbar dismissed if it's not in the DOM. We can assert that the
    // element isn't in the DOM by seeing that its width and height are zero.

    const host = await this.host();
    const [exit, dimensions] = await parallel(() => [
      // The snackbar container is marked with the "exit" attribute after it has been dismissed
      // but before the animation has finished (after which it's removed from the DOM).
      host.getAttribute('mat-exit'),
      host.getDimensions(),
    ]);

    return exit != null || (!!dimensions && dimensions.height === 0 && dimensions.width === 0);
  }

  /**
   * Asserts that the current snack-bar does not use custom content. Promise rejects if
   * custom content is used.
   *
   * 断言当前快餐栏不使用自定义内容。如果使用了自定义内容，则拒绝此 Promise。
   *
   */
  private async _assertSimpleSnackBar(): Promise<void> {
    if (!await this._isSimpleSnackBar()) {
      throw Error('Method cannot be used for snack-bar with custom content.');
    }
  }

  /**
   * Asserts that the current snack-bar does not use custom content and has
   * an action defined. Otherwise the promise will reject.
   *
   * 断言当前快餐栏不使用自定义内容，并且已定义操作。否则，拒绝此 Promise。
   *
   */
  private async _assertSimpleSnackBarWithAction(): Promise<void> {
    await this._assertSimpleSnackBar();
    if (!await this.hasAction()) {
      throw Error('Method cannot be used for standard snack-bar without action.');
    }
  }

  /**
   * Whether the snack-bar is using the default content template.
   *
   * 此快餐栏是否正在使用默认内容模板。
   *
   */
  private async _isSimpleSnackBar(): Promise<boolean> {
    return await this.locatorForOptional(this._simpleSnackBarSelector)() !== null;
  }

  /**
   * Gets the simple snack bar action button.
   *
   * 获取简单的快餐栏操作按钮。
   *
   */
  private async _getSimpleSnackBarActionButton() {
    return this.locatorForOptional(this._actionButtonSelector)();
  }
}
