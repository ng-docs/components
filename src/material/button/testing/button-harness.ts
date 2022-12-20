/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  ComponentHarnessConstructor,
  ContentContainerComponentHarness,
  HarnessPredicate,
} from '@angular/cdk/testing';
import {coerceBooleanProperty} from '@angular/cdk/coercion';
import {ButtonHarnessFilters, ButtonVariant} from './button-harness-filters';

/**
 * Harness for interacting with a MDC-based mat-button in tests.
 *
 * 在测试中与标准 mat-button 进行交互的测试工具。
 *
 */
export class MatButtonHarness extends ContentContainerComponentHarness {
  // TODO(jelbourn) use a single class, like `.mat-button-base`
  static hostSelector = `[mat-button], [mat-raised-button], [mat-flat-button],
                         [mat-icon-button], [mat-stroked-button], [mat-fab], [mat-mini-fab]`;

  /**
   * Gets a `HarnessPredicate` that can be used to search for a button with specific attributes.
   *
   * 获取一个 `HarnessPredicate`，它可以用来搜索符合条件 `MatButtonHarness`
   *
   * @param options Options for narrowing the search:
   *   - `selector` finds a button whose host element matches the given selector.
   *   - `text` finds a button with specific text content.
   *   - `variant` finds buttons matching a specific variant.
   *
   * 筛选与哪些按钮实例匹配的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with<T extends MatButtonHarness>(
    this: ComponentHarnessConstructor<T>,
    options: ButtonHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options)
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
   * Gets a boolean promise indicating if the button is disabled.
   *
   * 获取一个 Boolean 型的 Promise，以指出该按钮是否已禁用。
   *
   */
  async isDisabled(): Promise<boolean> {
    const disabled = (await this.host()).getAttribute('disabled');
    return coerceBooleanProperty(await disabled);
  }

  /**
   * Gets a promise for the button's label text.
   *
   * 获取该按钮的标签文本。
   *
   */
  async getText(): Promise<string> {
    return (await this.host()).text();
  }

  /**
   * Focuses the button and returns a void promise that indicates when the action is complete.
   *
   * 让此按钮获得焦点。
   *
   */
  async focus(): Promise<void> {
    return (await this.host()).focus();
  }

  /**
   * Blurs the button and returns a void promise that indicates when the action is complete.
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

  /** Gets the variant of the button. */
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
