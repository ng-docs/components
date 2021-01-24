/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ComponentHarness, HarnessPredicate} from '@angular/cdk/testing';
import {MatBadgePosition, MatBadgeSize} from '@angular/material/badge';
import {BadgeHarnessFilters} from './badge-harness-filters';


/**
 * Harness for interacting with a standard Material badge in tests.
 *
 * 在测试中与标准 Material 徽章进行交互的测试工具。
 *
 */
export class MatBadgeHarness extends ComponentHarness {
  static hostSelector = '.mat-badge';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a badge with specific attributes.
   *
   * 获取一个 `HarnessPredicate` ，它可以用来搜索具有特定属性的徽章。
   *
   * @param options Options for narrowing the search:
   *
   * 缩小搜索范围的选项：
   *
   *   - `text` finds a badge host with a particular text.
   *
   *      `text` 查找带有特定文本的徽章宿主。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with(options: BadgeHarnessFilters = {}): HarnessPredicate<MatBadgeHarness> {
    return new HarnessPredicate(MatBadgeHarness, options)
        .addOption('text', options.text,
            (harness, text) => HarnessPredicate.stringMatches(harness.getText(), text));
  }

  private _badgeElement = this.locatorFor('.mat-badge-content');

  /**
   * Gets a promise for the badge text.
   *
   * 获取徽章文本的 Promise。
   *
   */
  async getText(): Promise<string> {
    return (await this._badgeElement()).text();
  }

  /**
   * Gets whether the badge is overlapping the content.
   *
   * 获取徽章是否与内容重叠。
   *
   */
  async isOverlapping(): Promise<boolean> {
    return (await this.host()).hasClass('mat-badge-overlap');
  }

  /**
   * Gets the position of the badge.
   *
   * 获取徽章的位置。
   *
   */
  async getPosition(): Promise<MatBadgePosition> {
    const host = await this.host();
    let result = '';

    if (await host.hasClass('mat-badge-above')) {
      result += 'above';
    } else if (await host.hasClass('mat-badge-below')) {
      result += 'below';
    }

    if (await host.hasClass('mat-badge-before')) {
      result += ' before';
    } else if (await host.hasClass('mat-badge-after')) {
      result += ' after';
    }

    return result.trim() as MatBadgePosition;
  }

  /**
   * Gets the size of the badge.
   *
   * 获取徽章的大小。
   *
   */
  async getSize(): Promise<MatBadgeSize> {
    const host = await this.host();

    if (await host.hasClass('mat-badge-small')) {
      return 'small';
    } else if (await host.hasClass('mat-badge-large')) {
      return 'large';
    }

    return 'medium';
  }

  /**
   * Gets whether the badge is hidden.
   *
   * 获取该徽章是否隐藏。
   *
   */
  async isHidden(): Promise<boolean> {
    return (await this.host()).hasClass('mat-badge-hidden');
  }

  /**
   * Gets whether the badge is disabled.
   *
   * 获取该徽章是否禁用。
   *
   */
  async isDisabled(): Promise<boolean> {
    return (await this.host()).hasClass('mat-badge-disabled');
  }
}
