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
  HarnessPredicate,
  TestElement,
} from '@angular/cdk/testing';
import {TooltipHarnessFilters} from './tooltip-harness-filters';

export abstract class _MatTooltipHarnessBase extends ComponentHarness {
  protected abstract _optionalPanel: AsyncFactoryFn<TestElement | null>;

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
    // @breaking-change 12.0.0 Remove null assertion from `dispatchEvent`.
    await host.dispatchEvent?.('touchstart', {changedTouches: []});
    await host.hover();
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
    // @breaking-change 12.0.0 Remove null assertion from `dispatchEvent`.
    await host.dispatchEvent?.('touchend');
    await host.mouseAway();
    await this.forceStabilize(); // Needed in order to flush the `hide` animation.
  }

  /**
   * Gets whether the tooltip is open.
   *
   * 获取此工具提示是否已打开。
   *
   */
  async isOpen(): Promise<boolean> {
    return !!(await this._optionalPanel());
  }

  /**
   * Gets a promise for the tooltip panel's text.
   *
   * 获得对此工具提示面板文本的 Promise。
   *
   */
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
  protected _optionalPanel = this.documentRootLocatorFactory().locatorForOptional('.mat-tooltip');
  static hostSelector = '.mat-tooltip-trigger';

  /**
   * Gets a `HarnessPredicate` that can be used to search
   * for a tooltip trigger with specific attributes.
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
  static with(options: TooltipHarnessFilters = {}): HarnessPredicate<MatTooltipHarness> {
    return new HarnessPredicate(MatTooltipHarness, options);
  }
}
