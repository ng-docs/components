/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ComponentHarness, HarnessPredicate} from '@angular/cdk/testing';
import {OptionHarnessFilters} from './option-harness-filters';

/** Harness for interacting with an MDC-based `mat-option` in tests. */
export class MatOptionHarness extends ComponentHarness {
  /** Selector used to locate option instances. */
  static hostSelector = '.mat-mdc-option';

  /** Element containing the option's text. */
  private _text = this.locatorFor('.mdc-list-item__primary-text');

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `MatOptionsHarness` that meets
   * certain criteria.
   * @param options Options for filtering which option instances are considered a match.
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with(options: OptionHarnessFilters = {}) {
    return new HarnessPredicate(MatOptionHarness, options)
      .addOption('text', options.text, async (harness, title) =>
        HarnessPredicate.stringMatches(await harness.getText(), title),
      )
      .addOption(
        'isSelected',
        options.isSelected,
        async (harness, isSelected) => (await harness.isSelected()) === isSelected,
      );
  }

  /** Clicks the option. */
  async click(): Promise<void> {
    return (await this.host()).click();
  }

  /** Gets the option's label text. */
  async getText(): Promise<string> {
    return (await this._text()).text();
  }

  /** Gets whether the option is disabled. */
  async isDisabled(): Promise<boolean> {
    return (await this.host()).hasClass('mdc-list-item--disabled');
  }

  /** Gets whether the option is selected. */
  async isSelected(): Promise<boolean> {
    return (await this.host()).hasClass('mdc-list-item--selected');
  }

  /** Gets whether the option is active. */
  async isActive(): Promise<boolean> {
    return (await this.host()).hasClass('mat-mdc-option-active');
  }

  /** Gets whether the option is in multiple selection mode. */
  async isMultiple(): Promise<boolean> {
    return (await this.host()).hasClass('mat-mdc-option-multiple');
  }
}
