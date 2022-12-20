/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ContentContainerComponentHarness, HarnessPredicate, parallel} from '@angular/cdk/testing';
import {AriaLivePoliteness} from '@angular/cdk/a11y';
import {SnackBarHarnessFilters} from './snack-bar-harness-filters';

export abstract class _MatSnackBarHarnessBase extends ContentContainerComponentHarness<string> {
  protected abstract _messageSelector: string;
  protected abstract _actionButtonSelector: string;

  private _snackBarLiveRegion = this.locatorFor('[aria-live]');

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
  async getRole(): Promise<'alert' | 'status' | null> {
    return (await this.host()).getAttribute('role') as Promise<'alert' | 'status' | null>;
  }

  /**
   * Gets the aria-live of the snack-bar's live region. The aria-live of a snack-bar is
   * determined based on the ARIA politeness specified in the snack-bar config.
   *
   * 获取此快餐栏现场区域的 aria-live。快餐栏的 aria-live 是根据快餐栏配置中指定的 ARIA politeness 来确定的。
   *
   */
  async getAriaLive(): Promise<AriaLivePoliteness> {
    return (await this._snackBarLiveRegion()).getAttribute(
      'aria-live',
    ) as Promise<AriaLivePoliteness>;
  }

  /**
   * Whether the snack-bar has an action. Method cannot be used for snack-bar's with custom content.
   *
   * 此快餐栏是否有动作。该方法不能用于具有自定义内容的快餐栏。
   *
   */
  async hasAction(): Promise<boolean> {
    await this._assertContentAnnotated();
    return (await this._getActionButton()) !== null;
  }

  /**
   * Gets the description of the snack-bar. Method cannot be used for snack-bar's without action or
   * with custom content.
   *
   * 获取此快餐栏的描述。该方法不能用于没有动作或带有自定义内容的快餐栏。
   *
   */
  async getActionDescription(): Promise<string> {
    await this._assertHasAction();
    return (await this._getActionButton())!.text();
  }

  /**
   * Dismisses the snack-bar by clicking the action button. Method cannot be used for snack-bar's
   * without action or with custom content.
   *
   * 通过单击动作按钮关闭快餐栏。该方法不能用于没有动作或带有自定义内容的快餐栏。
   *
   */
  async dismissWithAction(): Promise<void> {
    await this._assertHasAction();
    await (await this._getActionButton())!.click();
  }

  /**
   * Gets the message of the snack-bar. Method cannot be used for snack-bar's with custom content.
   *
   * 获取此快餐栏的消息。该方法不能用于具有自定义内容的快餐栏。
   *
   */
  async getMessage(): Promise<string> {
    await this._assertContentAnnotated();
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
   * Asserts that the current snack-bar has annotated content. Promise reject
   * if content is not annotated.
   *
   * 断言当前快餐栏不使用自定义内容。如果使用了自定义内容，则拒绝此 Promise。
   *
   */
  protected abstract _assertContentAnnotated(): Promise<void>;

  /**
   * Asserts that the current snack-bar has an action defined. Otherwise the
   * promise will reject.
   *
   * 断言当前快餐栏不使用自定义内容，并且已定义操作。否则，拒绝此 Promise。
   *
   */
  protected async _assertHasAction(): Promise<void> {
    await this._assertContentAnnotated();
    if (!(await this.hasAction())) {
      throw Error('Method cannot be used for a snack-bar without an action.');
    }
  }

  /** Gets the simple snack bar action button. */
  private async _getActionButton() {
    return this.locatorForOptional(this._actionButtonSelector)();
  }
}

/**
 * Harness for interacting with an MDC-based mat-snack-bar in tests.
 *
 * 用于在测试中与基于 MDC 的 mat-snack-bar 交互的组件测试工具。
 *
 */
export class MatSnackBarHarness extends _MatSnackBarHarnessBase {
  // Developers can provide a custom component or template for the
  // snackbar. The canonical snack-bar parent is the "MatSnackBarContainer".
  /**
   * The selector for the host element of a `MatSnackBar` instance.
   *
   * `MatSnackBar` 实例的宿主元素选择器。
   *
   */
  static hostSelector = '.mat-mdc-snack-bar-container:not([mat-exit])';
  protected override _messageSelector = '.mdc-snackbar__label';
  protected override _actionButtonSelector = '.mat-mdc-snack-bar-action';

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
   * 使用给定选项配置过的 `HarnessPredicate`。
   *
   */
  static with(options: SnackBarHarnessFilters = {}): HarnessPredicate<MatSnackBarHarness> {
    return new HarnessPredicate(MatSnackBarHarness, options);
  }

  /**
   * Asserts that the current snack-bar has annotated content. Promise reject
   * if content is not annotated.
   *
   * 断言当前的快餐栏有标注内容。如果内容未标注，则拒绝此 Promise。
   *
   */
  protected override async _assertContentAnnotated() {}
}
