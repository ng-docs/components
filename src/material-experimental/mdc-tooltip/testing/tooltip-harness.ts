/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {HarnessPredicate} from '@angular/cdk/testing';
import {_MatTooltipHarnessBase, TooltipHarnessFilters} from '@angular/material/tooltip/testing';

/** Harness for interacting with a standard mat-tooltip in tests. */
export class MatTooltipHarness extends _MatTooltipHarnessBase {
  protected _optionalPanel =
    this.documentRootLocatorFactory().locatorForOptional('.mat-mdc-tooltip');
  static hostSelector = '.mat-mdc-tooltip-trigger';

  /**
   * Gets a `HarnessPredicate` that can be used to search
   * for a tooltip trigger with specific attributes.
   * @param options Options for narrowing the search.
   * @return a `HarnessPredicate` configured with the given options.
   */
  static with(options: TooltipHarnessFilters = {}): HarnessPredicate<MatTooltipHarness> {
    return new HarnessPredicate(MatTooltipHarness, options);
  }
}
