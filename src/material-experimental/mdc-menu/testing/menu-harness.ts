/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {HarnessPredicate} from '@angular/cdk/testing';
import {
  MenuHarnessFilters,
  MenuItemHarnessFilters,
  _MatMenuItemHarnessBase,
  _MatMenuHarnessBase,
} from '@angular/material/menu/testing';

/** Harness for interacting with an MDC-based mat-menu in tests. */
export class MatMenuHarness extends _MatMenuHarnessBase<
  typeof MatMenuItemHarness,
  MatMenuItemHarness,
  MenuItemHarnessFilters
> {
  /** The selector for the host element of a `MatMenu` instance. */
  static hostSelector = '.mat-mdc-menu-trigger';
  protected _itemClass = MatMenuItemHarness;

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `MatMenuHarness` that meets certain
   * criteria.
   * @param options Options for filtering which menu instances are considered a match.
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with(options: MenuHarnessFilters = {}): HarnessPredicate<MatMenuHarness> {
    return new HarnessPredicate(MatMenuHarness, options).addOption(
      'triggerText',
      options.triggerText,
      (harness, text) => HarnessPredicate.stringMatches(harness.getTriggerText(), text),
    );
  }
}

/** Harness for interacting with an MDC-based mat-menu-item in tests. */
export class MatMenuItemHarness extends _MatMenuItemHarnessBase<
  typeof MatMenuHarness,
  MatMenuHarness
> {
  /** The selector for the host element of a `MatMenuItem` instance. */
  static hostSelector = '.mat-mdc-menu-item';
  protected _menuClass = MatMenuHarness;

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `MatMenuItemHarness` that meets
   * certain criteria.
   * @param options Options for filtering which menu item instances are considered a match.
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with(options: MenuItemHarnessFilters = {}): HarnessPredicate<MatMenuItemHarness> {
    return new HarnessPredicate(MatMenuItemHarness, options)
      .addOption('text', options.text, (harness, text) =>
        HarnessPredicate.stringMatches(harness.getText(), text),
      )
      .addOption(
        'hasSubmenu',
        options.hasSubmenu,
        async (harness, hasSubmenu) => (await harness.hasSubmenu()) === hasSubmenu,
      );
  }
}
