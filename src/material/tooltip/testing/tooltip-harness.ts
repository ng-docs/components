/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  AsyncFactoryFn,
  ComponentHarness,
  ComponentHarnessConstructor,
  HarnessPredicate,
  TestElement,
} from '@angular/cdk/testing';
import {TooltipHarnessFilters} from './tooltip-harness-filters';

export abstract class _MatTooltipHarnessBase extends ComponentHarness {
  protected abstract _optionalPanel: AsyncFactoryFn<TestElement | null>;
  protected abstract _hiddenClass: string;
  protected abstract _disabledClass: string;
  protected abstract _showAnimationName: string;
  protected abstract _hideAnimationName: string;

  /**
   * Shows the tooltip.
   *
   * 显示此工具提示。
   *
   */
  async show(): Promise<void> {
    const host = await this.host();

    // We need to dispatch both `touchstart` and a hover event, because the tooltip binds
    // different events depending on the device. The `changedTouches` is there in case the
    // element has ripples.
    await host.dispatchEvent('touchstart', {changedTouches: []});
    await host.hover();
    const panel = await this._optionalPanel();
    await panel?.dispatchEvent('animationend', {animationName: this._showAnimationName});
  }

  /**
   * Hides the tooltip.
   *
   * 隐藏此工具提示。
   *
   */
  async hide(): Promise<void> {
    const host = await this.host();

    // We need to dispatch both `touchstart` and a hover event, because
    // the tooltip binds different events depending on the device.
    await host.dispatchEvent('touchend');
    await host.mouseAway();
    const panel = await this._optionalPanel();
    await panel?.dispatchEvent('animationend', {animationName: this._hideAnimationName});
  }

  /**
   * Gets whether the tooltip is open.
   *
   * 获取此工具提示是否已打开。
   *
   */
  async isOpen(): Promise<boolean> {
    const panel = await this._optionalPanel();
    return !!panel && !(await panel.hasClass(this._hiddenClass));
  }

  /** Gets whether the tooltip is disabled */
  async isDisabled(): Promise<boolean> {
    const host = await this.host();
    return host.hasClass(this._disabledClass);
  }

  /** Gets a promise for the tooltip panel's text. */
  async getTooltipText(): Promise<string> {
    const panel = await this._optionalPanel();
    return panel ? panel.text() : '';
  }
}

/**
 * Harness for interacting with a standard mat-tooltip in tests.
 *
 * 在测试中可以与标准 mat-tooltip 交互作用的测试工具。
 *
 */
export class MatTooltipHarness extends _MatTooltipHarnessBase {
  protected _optionalPanel =
    this.documentRootLocatorFactory().locatorForOptional('.mat-mdc-tooltip');
  static hostSelector = '.mat-mdc-tooltip-trigger';
  protected _hiddenClass = 'mat-mdc-tooltip-hide';
  protected _disabledClass = 'mat-mdc-tooltip-disabled';
  protected _showAnimationName = 'mat-mdc-tooltip-show';
  protected _hideAnimationName = 'mat-mdc-tooltip-hide';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a tooltip trigger with specific
   * attributes.
   *
   * 获取 `HarnessPredicate`，该 HarnessPredicate 可用于搜索具有特定属性的工具提示触发器。
   *
   * @param options Options for narrowing the search.
   *
   * 收窄搜索范围的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 使用给定选项配置过的 `HarnessPredicate`
   *
   */
  static with<T extends MatTooltipHarness>(
    this: ComponentHarnessConstructor<T>,
    options: TooltipHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options);
  }
}
