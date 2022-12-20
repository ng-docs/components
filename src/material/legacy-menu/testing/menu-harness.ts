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
  _MatMenuHarnessBase,
  _MatMenuItemHarnessBase,
} from '@angular/material/menu/testing';

/**
 * Harness for interacting with a standard mat-menu in tests.
 *
 * 在测试中可与标准 mat-menu 进行交互的测试工具。
 *
 * @deprecated
 *
 * Use `MatMenuHarness` from `@angular/material/menu/testing` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
export class MatLegacyMenuHarness extends _MatMenuHarnessBase<
  typeof MatLegacyMenuItemHarness,
  MatLegacyMenuItemHarness,
  MenuItemHarnessFilters
> {
  /**
   * The selector for the host element of a `MatMenu` instance.
   *
   * `MatMenu` 实例的宿主元素选择器。
   *
   */
  static hostSelector = '.mat-menu-trigger';
  protected _itemClass = MatLegacyMenuItemHarness;

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `MatMenuHarness` that meets certain
   * criteria.
   *
   * 获取一个 `HarnessPredicate`，可用于搜索满足某些条件的 `MatMenuHarness`。
   *
   * @param options Options for filtering which menu instances are considered a match.
   *
   * 用于过滤哪些菜单实例应该视为匹配项的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 使用给定选项配置过的 `HarnessPredicate`。
   *
   */
  static with(options: MenuHarnessFilters = {}): HarnessPredicate<MatLegacyMenuHarness> {
    return new HarnessPredicate(MatLegacyMenuHarness, options).addOption(
      'triggerText',
      options.triggerText,
      (harness, text) => HarnessPredicate.stringMatches(harness.getTriggerText(), text),
    );
  }
}

/**
 * Harness for interacting with a standard mat-menu-item in tests.
 *
 * 在测试中可与标准 mat-menu-item 进行交互的测试工具。
 *
 * @deprecated
 *
 * Use `MatMenuItemHarness` from `@angular/material/menu/testing` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
export class MatLegacyMenuItemHarness extends _MatMenuItemHarnessBase<
  typeof MatLegacyMenuHarness,
  MatLegacyMenuHarness
> {
  /**
   * The selector for the host element of a `MatMenuItem` instance.
   *
   * `MatMenuItem` 实例的宿主元素选择器。
   *
   */
  static hostSelector = '.mat-menu-item';
  protected _menuClass = MatLegacyMenuHarness;

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `MatMenuItemHarness` that meets
   * certain criteria.
   *
   * 获取一个 `HarnessPredicate`，可用于搜索满足某些条件的 `MatMenuItemHarness`。
   *
   * @param options Options for filtering which menu item instances are considered a match.
   *
   * 用于过滤哪些菜单项实例应该视为匹配项的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 使用给定选项配置过的 `HarnessPredicate`。
   *
   */
  static with(options: MenuItemHarnessFilters = {}): HarnessPredicate<MatLegacyMenuItemHarness> {
    return new HarnessPredicate(MatLegacyMenuItemHarness, options)
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
