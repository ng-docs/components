/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {HarnessPredicate} from '@angular/cdk/testing';
import {_MatTooltipHarnessBase, TooltipHarnessFilters} from '@angular/material/tooltip/testing';

/**
 * Harness for interacting with a standard mat-tooltip in tests.
 *
 * 在测试中可以与标准 mat-tooltip 交互作用的测试工具。
 *
 * @deprecated
 *
 * Use `MatTooltipHarness` from `@angular/material/tooltip/testing` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
export class MatLegacyTooltipHarness extends _MatTooltipHarnessBase {
  protected _optionalPanel = this.documentRootLocatorFactory().locatorForOptional('.mat-tooltip');
  protected _hiddenClass = 'mat-tooltip-hide';
  protected _showAnimationName = 'mat-tooltip-show';
  protected _hideAnimationName = 'mat-tooltip-hide';
  static hostSelector = '.mat-tooltip-trigger';

  /**
   * Gets a `HarnessPredicate` that can be used to search
   * for a tooltip trigger with specific attributes.
   *
   * 获取 `HarnessPredicate`，该 HarnessPredicate 可用于搜索具有特定属性的工具提示触发器。
   *
   * @param options Options for narrowing the search.
   *
   * 用来收窄搜索范围的选项：。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 使用给定选项配置过的 `HarnessPredicate`。
   *
   */
  static with(options: TooltipHarnessFilters = {}): HarnessPredicate<MatLegacyTooltipHarness> {
    return new HarnessPredicate(MatLegacyTooltipHarness, options);
  }
}
