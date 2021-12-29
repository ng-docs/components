/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {HarnessPredicate} from '@angular/cdk/testing';
import {_MatRowHarnessBase, RowHarnessFilters} from '@angular/material/table/testing';
import {MatCellHarness, MatHeaderCellHarness, MatFooterCellHarness} from './cell-harness';

/** Harness for interacting with an MDC-based Angular Material table row. */
export class MatRowHarness extends _MatRowHarnessBase<typeof MatCellHarness, MatCellHarness> {
  /** The selector for the host element of a `MatRowHarness` instance. */
  static hostSelector = '.mat-mdc-row';
  protected _cellHarness = MatCellHarness;

  /**
   * Gets a `HarnessPredicate` that can be used to search for a table row with specific attributes.
   * @param options Options for narrowing the search
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with(options: RowHarnessFilters = {}): HarnessPredicate<MatRowHarness> {
    return new HarnessPredicate(MatRowHarness, options);
  }
}

/** Harness for interacting with an MDC-based Angular Material table header row. */
export class MatHeaderRowHarness extends _MatRowHarnessBase<
  typeof MatHeaderCellHarness,
  MatHeaderCellHarness
> {
  /** The selector for the host element of a `MatHeaderRowHarness` instance. */
  static hostSelector = '.mat-mdc-header-row';
  protected _cellHarness = MatHeaderCellHarness;

  /**
   * Gets a `HarnessPredicate` that can be used to search for
   * a table header row with specific attributes.
   * @param options Options for narrowing the search
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with(options: RowHarnessFilters = {}): HarnessPredicate<MatHeaderRowHarness> {
    return new HarnessPredicate(MatHeaderRowHarness, options);
  }
}

/** Harness for interacting with an MDC-based Angular Material table footer row. */
export class MatFooterRowHarness extends _MatRowHarnessBase<
  typeof MatFooterCellHarness,
  MatFooterCellHarness
> {
  /** The selector for the host element of a `MatFooterRowHarness` instance. */
  static hostSelector = '.mat-mdc-footer-row';
  protected _cellHarness = MatFooterCellHarness;

  /**
   * Gets a `HarnessPredicate` that can be used to search for
   * a table footer row cell with specific attributes.
   * @param options Options for narrowing the search
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with(options: RowHarnessFilters = {}): HarnessPredicate<MatFooterRowHarness> {
    return new HarnessPredicate(MatFooterRowHarness, options);
  }
}
