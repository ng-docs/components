/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {HarnessPredicate, parallel} from '@angular/cdk/testing';
import {MatListOptionCheckboxPosition} from '@angular/material/list';
import {MatListHarnessBase} from './list-harness-base';
import {
  ListItemHarnessFilters,
  ListOptionHarnessFilters,
  SelectionListHarnessFilters,
} from './list-harness-filters';
import {getListItemPredicate, MatListItemHarnessBase} from './list-item-harness-base';

/**
 * Harness for interacting with a standard mat-selection-list in tests.
 *
 * 在测试中用来与标准 mat-selection-list 进行交互的测试工具。
 *
 */
export class MatSelectionListHarness extends MatListHarnessBase<
  typeof MatListOptionHarness,
  MatListOptionHarness,
  ListOptionHarnessFilters
> {
  /**
   * The selector for the host element of a `MatSelectionList` instance.
   *
   * `MatSelectionList` 实例的宿主元素选择器。
   *
   */
  static hostSelector = '.mat-selection-list';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `MatSelectionListHarness` that meets
   * certain criteria.
   *
   * 获取一个 `HarnessPredicate`，可用于搜索满足某些条件的 `MatSelectionListHarness`。
   *
   * @param options Options for filtering which selection list instances are considered a match.
   *
   * 用于过滤哪些选择列表实例应该视为匹配项的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with(
    options: SelectionListHarnessFilters = {},
  ): HarnessPredicate<MatSelectionListHarness> {
    return new HarnessPredicate(MatSelectionListHarness, options);
  }

  override _itemHarness = MatListOptionHarness;

  /**
   * Whether the selection list is disabled.
   *
   * 是否禁用了选择列表。
   *
   */
  async isDisabled(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-disabled')) === 'true';
  }

  /**
   * Selects all items matching any of the given filters.
   *
   * 选择与任何给定过滤器匹配的所有条目。
   *
   * @param filters Filters that specify which items should be selected.
   *
   * 指定应选择哪些条目的过滤器。
   *
   */
  async selectItems(...filters: ListOptionHarnessFilters[]): Promise<void> {
    const items = await this._getItems(filters);
    await parallel(() => items.map(item => item.select()));
  }

  /**
   * Deselects all items matching any of the given filters.
   *
   * 取消选择与任何给定过滤器匹配的所有条目。
   *
   * @param filters Filters that specify which items should be deselected.
   *
   * 指定应取消选择哪些条目的过滤器。
   *
   */
  async deselectItems(...filters: ListItemHarnessFilters[]): Promise<void> {
    const items = await this._getItems(filters);
    await parallel(() => items.map(item => item.deselect()));
  }

  /**
   * Gets all items matching the given list of filters.
   *
   * 获取与给定过滤器列表匹配的所有条目。
   *
   */
  private async _getItems(filters: ListOptionHarnessFilters[]): Promise<MatListOptionHarness[]> {
    if (!filters.length) {
      return this.getItems();
    }
    const matches = await parallel(() => {
      return filters.map(filter => this.locatorForAll(MatListOptionHarness.with(filter))());
    });
    return matches.reduce((result, current) => [...result, ...current], []);
  }
}

/**
 * Harness for interacting with a list option.
 *
 * 与列表选项进行交互的测试工具。
 *
 */
export class MatListOptionHarness extends MatListItemHarnessBase {
  /**
   * The selector for the host element of a `MatListOption` instance.
   *
   * `MatListOption` 实例的宿主元素选择器。
   *
   */
  static hostSelector = '.mat-list-option';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `MatListOptionHarness` that
   * meets certain criteria.
   *
   * 获取一个 `HarnessPredicate`，该 HarnessPredicate 可用于搜索满足某些条件的 `MatListOptionHarness`。
   *
   * @param options Options for filtering which list option instances are considered a match.
   *
   * 用于过滤哪些列表选项实例应该视为匹配项的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with(options: ListOptionHarnessFilters = {}): HarnessPredicate<MatListOptionHarness> {
    return getListItemPredicate(MatListOptionHarness, options).addOption(
      'is selected',
      options.selected,
      async (harness, selected) => (await harness.isSelected()) === selected,
    );
  }

  private _itemContent = this.locatorFor('.mat-list-item-content');

  /**
   * Gets the position of the checkbox relative to the list option content.
   *
   * 获取复选框相对于列表选项内容的位置。
   *
   */
  async getCheckboxPosition(): Promise<MatListOptionCheckboxPosition> {
    return (await (await this._itemContent()).hasClass('mat-list-item-content-reverse'))
      ? 'after'
      : 'before';
  }

  /**
   * Whether the list option is selected.
   *
   * 是否选择此列表选项。
   *
   */
  async isSelected(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-selected')) === 'true';
  }

  /**
   * Focuses the list option.
   *
   * 让此列表选项获得焦点。
   *
   */
  async focus(): Promise<void> {
    return (await this.host()).focus();
  }

  /**
   * Blurs the list option.
   *
   * 让此列表选项失焦。
   *
   */
  async blur(): Promise<void> {
    return (await this.host()).blur();
  }

  /**
   * Whether the list option is focused.
   *
   * 此列表选项是否拥有焦点。
   *
   */
  async isFocused(): Promise<boolean> {
    return (await this.host()).isFocused();
  }

  /**
   * Toggles the checked state of the checkbox.
   *
   * 切换复选框的勾选状态。
   *
   */
  async toggle() {
    return (await this.host()).click();
  }

  /**
   * Puts the list option in a checked state by toggling it if it is currently unchecked, or doing
   * nothing if it is already checked.
   *
   * 如果当前未选中，则通过切换列表选项将其置于选中状态；如果已经选中，则不执行任何操作。
   *
   */
  async select() {
    if (!(await this.isSelected())) {
      return this.toggle();
    }
  }

  /**
   * Puts the list option in an unchecked state by toggling it if it is currently checked, or doing
   * nothing if it is already unchecked.
   *
   * 如果当前已选中，则通过切换列表选项将其置于未选中状态；如果未选中，则不执行任何操作。
   *
   */
  async deselect() {
    if (await this.isSelected()) {
      return this.toggle();
    }
  }
}
