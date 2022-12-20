/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ContentContainerComponentHarness, HarnessPredicate} from '@angular/cdk/testing';
import {coerceBooleanProperty} from '@angular/cdk/coercion';
import {ButtonHarnessFilters, ButtonVariant} from '@angular/material/button/testing';

/**
 * Harness for interacting with a standard mat-button in tests.
 *
 * 在测试中与标准 mat-button 进行交互的测试工具。
 *
 * @deprecated
 *
 * Use `MatButtonHarness` from `@angular/material/button/testing` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
export class MatLegacyButtonHarness extends ContentContainerComponentHarness {
  // TODO(jelbourn) use a single class, like `.mat-button-base`
  /**
   * The selector for the host element of a button instance.
   *
   * 按钮实例的宿主元素的选择器。
   *
   */
  static hostSelector = `[mat-button], [mat-raised-button], [mat-flat-button], [mat-icon-button],
                         [mat-stroked-button], [mat-fab], [mat-mini-fab]`;

  /**
   * Gets a `HarnessPredicate` that can be used to search for a button harness that meets
   * certain criteria.
   *
   * 获取可用于搜索满足特定条件的按钮组件测试工具的 `HarnessPredicate` 。
   *
   * @param options Options for filtering which button instances are considered a match.
   *
   * 筛选与哪些按钮实例匹配的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 使用给定选项配置过的 `HarnessPredicate`。
   *
   */
  static with(options: ButtonHarnessFilters = {}): HarnessPredicate<MatLegacyButtonHarness> {
    return new HarnessPredicate(MatLegacyButtonHarness, options)
      .addOption('text', options.text, (harness, text) =>
        HarnessPredicate.stringMatches(harness.getText(), text),
      )
      .addOption('variant', options.variant, (harness, variant) =>
        HarnessPredicate.stringMatches(harness.getVariant(), variant),
      )
      .addOption('disabled', options.disabled, async (harness, disabled) => {
        return (await harness.isDisabled()) === disabled;
      });
  }

  /**
   * Clicks the button at the given position relative to its top-left.
   *
   * 在相对于按钮左上角的指定位置单击它。
   *
   * @param relativeX The relative x position of the click.
   *
   * 单击的相对位置 x。
   *
   * @param relativeY The relative y position of the click.
   *
   * 单击的相对位置 y。
   *
   */
  click(relativeX: number, relativeY: number): Promise<void>;
  /**
   * Clicks the button at its center.
   *
   * 单击按钮的中心。
   *
   */
  click(location: 'center'): Promise<void>;
  /**
   * Clicks the button.
   *
   * 单击此按钮。
   *
   */
  click(): Promise<void>;
  async click(...args: [] | ['center'] | [number, number]): Promise<void> {
    return (await this.host()).click(...(args as []));
  }

  /**
   * Whether the button is disabled.
   *
   * 该按钮是否已禁用。
   *
   */
  async isDisabled(): Promise<boolean> {
    const disabled = (await this.host()).getAttribute('disabled');
    return coerceBooleanProperty(await disabled);
  }

  /**
   * Gets the button's label text.
   *
   * 获取该按钮的标签文本。
   *
   */
  async getText(): Promise<string> {
    return (await this.host()).text();
  }

  /**
   * Focuses the button.
   *
   * 让此按钮获得焦点。
   *
   */
  async focus(): Promise<void> {
    return (await this.host()).focus();
  }

  /**
   * Blurs the button.
   *
   * 让此按钮失焦。
   *
   */
  async blur(): Promise<void> {
    return (await this.host()).blur();
  }

  /**
   * Whether the button is focused.
   *
   * 此按钮是否拥有焦点。
   *
   */
  async isFocused(): Promise<boolean> {
    return (await this.host()).isFocused();
  }

  /**
   * Gets the variant of the button.
   *
   * 获取此按钮的变体。
   *
   */
  async getVariant(): Promise<ButtonVariant> {
    const host = await this.host();

    if ((await host.getAttribute('mat-raised-button')) != null) {
      return 'raised';
    } else if ((await host.getAttribute('mat-flat-button')) != null) {
      return 'flat';
    } else if ((await host.getAttribute('mat-icon-button')) != null) {
      return 'icon';
    } else if ((await host.getAttribute('mat-stroked-button')) != null) {
      return 'stroked';
    } else if ((await host.getAttribute('mat-fab')) != null) {
      return 'fab';
    } else if ((await host.getAttribute('mat-mini-fab')) != null) {
      return 'mini-fab';
    }

    return 'basic';
  }
}
