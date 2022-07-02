/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ComponentHarnessConstructor, HarnessPredicate} from '@angular/cdk/testing';
import {
  MatOptgroupHarness,
  MatOptionHarness,
  OptgroupHarnessFilters,
  OptionHarnessFilters,
} from '@angular/material-experimental/mdc-core/testing';
import {_MatAutocompleteHarnessBase} from '@angular/material/autocomplete/testing';
import {AutocompleteHarnessFilters} from './autocomplete-harness-filters';

/** Harness for interacting with an MDC-based mat-autocomplete in tests. */
export class MatAutocompleteHarness extends _MatAutocompleteHarnessBase<
  typeof MatOptionHarness,
  MatOptionHarness,
  OptionHarnessFilters,
  typeof MatOptgroupHarness,
  MatOptgroupHarness,
  OptgroupHarnessFilters
> {
  protected _prefix = 'mat-mdc';
  protected _optionClass = MatOptionHarness;
  protected _optionGroupClass = MatOptgroupHarness;

  /**
   * The selector for the host element of a `MatAutocomplete` instance.
   *
   * `MatAutocomplete` 实例的宿主元素选择器。
   *
   */
  static hostSelector = '.mat-mdc-autocomplete-trigger';

  /**
   * Gets a `HarnessPredicate` that can be used to search for an autocomplete with specific
   * attributes.
   * @param options Options for filtering which autocomplete instances are considered a match.
   *
   * 用于过滤哪些自动完成实例应该视为匹配的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with<T extends MatAutocompleteHarness>(
    this: ComponentHarnessConstructor<T>,
    options: AutocompleteHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options).addOption('value', options.value, (harness, value) =>
      HarnessPredicate.stringMatches(harness.getValue(), value),
    );
  }
}
