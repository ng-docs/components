/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  ComponentHarness,
  ComponentHarnessConstructor,
  HarnessPredicate,
  ContentContainerComponentHarness,
  parallel,
} from '@angular/cdk/testing';
import {BaseListItemHarnessFilters, SubheaderHarnessFilters} from './list-harness-filters';

const iconSelector = '.mat-list-icon';
const avatarSelector = '.mat-list-avatar';

/**
 * Gets a `HarnessPredicate` that applies the given `BaseListItemHarnessFilters` to the given
 * list item harness.
 *
 * 获取一个 `HarnessPredicate`，它把指定的 `BaseListItemHarnessFilters` 应用于给定列表项测试工具。
 *
 * @template H The type of list item harness to create a predicate for.
 *
 * 要为其创建谓词的列表项测试工具的类型。
 *
 * @param harnessType A constructor for a list item harness.
 *
 * 列表项测试工具的构造函数。
 *
 * @param options An instance of `BaseListItemHarnessFilters` to apply.
 *
 * 要应用 `BaseListItemHarnessFilters` 的实例。
 *
 * @return A `HarnessPredicate` for the given harness type with the given options applied.
 *
 * 具有测试工具类型的 `HarnessPredicate`，已经应用了指定的选项。
 *
 */
export function getListItemPredicate<H extends MatListItemHarnessBase>(
  harnessType: ComponentHarnessConstructor<H>,
  options: BaseListItemHarnessFilters,
): HarnessPredicate<H> {
  return new HarnessPredicate(harnessType, options).addOption(
    'text',
    options.text,
    (harness, text) => HarnessPredicate.stringMatches(harness.getText(), text),
  );
}

/**
 * Harness for interacting with a list subheader.
 *
 * 与列表子标题进行交互的测试工具。
 *
 */
export class MatSubheaderHarness extends ComponentHarness {
  static hostSelector = '.mat-subheader';

  static with(options: SubheaderHarnessFilters = {}): HarnessPredicate<MatSubheaderHarness> {
    return new HarnessPredicate(MatSubheaderHarness, options).addOption(
      'text',
      options.text,
      (harness, text) => HarnessPredicate.stringMatches(harness.getText(), text),
    );
  }

  /**
   * Gets the full text content of the list item (including text from any font icons).
   *
   * 获取列表项的完整文本内容（包括来自任何字体图标的文本）。
   *
   */
  async getText(): Promise<string> {
    return (await this.host()).text();
  }
}

/**
 * Selectors for the various list item sections that may contain user content.
 *
 * 可能包含用户内容的各个列表项部分的选择器。
 *
 */
export const enum MatListItemSection {
  CONTENT = '.mat-list-item-content',
  // TODO(mmalerba): consider adding sections for leading/trailing icons.
}

/**
 * Shared behavior among the harnesses for the various `MatListItem` flavors.
 *
 * `MatListItem` 风格的测试工具之间的共享行为。
 *
 * @docs-private
 */
export abstract class MatListItemHarnessBase extends ContentContainerComponentHarness<MatListItemSection> {
  private _lines = this.locatorForAll('.mat-line');
  private _avatar = this.locatorForOptional(avatarSelector);
  private _icon = this.locatorForOptional(iconSelector);

  /**
   * Gets the full text content of the list item.
   *
   * 获取列表项的完整文本内容。
   *
   */
  async getText(): Promise<string> {
    return (await this.host()).text({exclude: `${iconSelector}, ${avatarSelector}`});
  }

  /**
   * Gets the lines of text (`mat-line` elements) in this nav list item.
   *
   * 获取此导航列表项中的文本行（`mat-line`）。
   *
   */
  async getLinesText(): Promise<string[]> {
    const lines = await this._lines();
    return parallel(() => lines.map(l => l.text()));
  }

  /**
   * Whether this list item has an avatar.
   *
   * 此列表项是否具有头像。
   *
   */
  async hasAvatar(): Promise<boolean> {
    return !!(await this._avatar());
  }

  /**
   * Whether this list item has an icon.
   *
   * 此列表项是否带有图标。
   *
   */
  async hasIcon(): Promise<boolean> {
    return !!(await this._icon());
  }

  /**
   * Whether this list option is disabled.
   *
   * 是否禁用此列表选项。
   *
   */
  async isDisabled(): Promise<boolean> {
    return (await this.host()).hasClass('mat-list-item-disabled');
  }
}
