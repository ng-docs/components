/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {coerceNumberProperty} from '@angular/cdk/coercion';
import {
  ComponentHarness,
  ComponentHarnessConstructor,
  HarnessPredicate,
  parallel,
} from '@angular/cdk/testing';
import {SliderThumbHarnessFilters, ThumbPosition} from './slider-harness-filters';

/**
 * Harness for interacting with a thumb inside of a Material slider in tests.
 *
 * 用于在测试中与 Material 滑杆内的滑块进行交互的组件测试工具。
 *
 */
export class MatSliderThumbHarness extends ComponentHarness {
  static hostSelector =
    'input[matSliderThumb], input[matSliderStartThumb], input[matSliderEndThumb]';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a slider thumb with specific attributes.
   *
   * 获取可用于搜索具有特定属性的滑杆缩略图的 `HarnessPredicate` 。
   *
   * @param options Options for filtering which thumb instances are considered a match.
   *
   * 用于过滤哪些缩略图实例应视为匹配项的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 使用给定选项配置过的 `HarnessPredicate`。
   */
  static with<T extends MatSliderThumbHarness>(
    this: ComponentHarnessConstructor<T>,
    options: SliderThumbHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options).addOption(
      'position',
      options.position,
      async (harness, value) => {
        return (await harness.getPosition()) === value;
      },
    );
  }

  /**
   * Gets the position of the thumb inside the slider.
   *
   * 获取此滑杆内滑块的位置。
   *
   */
  async getPosition(): Promise<ThumbPosition> {
    // Meant to mimic MDC's logic where `matSliderThumb` is treated as END.
    const isStart = (await (await this.host()).getAttribute('matSliderStartThumb')) != null;
    return isStart ? ThumbPosition.START : ThumbPosition.END;
  }

  /**
   * Gets the value of the thumb.
   *
   * 获取此滑块的值。
   *
   */
  async getValue(): Promise<number> {
    return await (await this.host()).getProperty<number>('valueAsNumber');
  }

  /**
   * Sets the value of the thumb.
   *
   * 设置此滑块的值。
   *
   */
  async setValue(newValue: number): Promise<void> {
    const input = await this.host();

    // Since this is a range input, we can't simulate the user interacting with it so we set the
    // value directly and dispatch a couple of fake events to ensure that everything fires.
    await input.setInputValue(newValue + '');
    await input.dispatchEvent('input');
    await input.dispatchEvent('change');
  }

  /**
   * Gets the current percentage value of the slider.
   *
   * 获取此滑块的当前百分比值。
   *
   */
  async getPercentage(): Promise<number> {
    const [value, min, max] = await parallel(() => [
      this.getValue(),
      this.getMinValue(),
      this.getMaxValue(),
    ]);

    return (value - min) / (max - min);
  }

  /**
   * Gets the maximum value of the thumb.
   *
   * 获取此滑块的最大值。
   *
   */
  async getMaxValue(): Promise<number> {
    return coerceNumberProperty(await (await this.host()).getProperty<number>('max'));
  }

  /**
   * Gets the minimum value of the thumb.
   *
   * 获取此滑块的最小值。
   *
   */
  async getMinValue(): Promise<number> {
    return coerceNumberProperty(await (await this.host()).getProperty<number>('min'));
  }

  /**
   * Gets the text representation of the slider's value.
   *
   * 获取此滑杆值的文本表示形式。
   *
   */
  async getDisplayValue(): Promise<string> {
    return (await (await this.host()).getAttribute('aria-valuetext')) || '';
  }

  /**
   * Whether the thumb is disabled.
   *
   * 此滑块是否已禁用。
   *
   */
  async isDisabled(): Promise<boolean> {
    return (await this.host()).getProperty<boolean>('disabled');
  }

  /**
   * Gets the name of the thumb.
   *
   * 获取此滑块的名称。
   *
   */
  async getName(): Promise<string> {
    return await (await this.host()).getProperty<string>('name');
  }

  /**
   * Gets the id of the thumb.
   *
   * 获取此滑块的 ID。
   *
   */
  async getId(): Promise<string> {
    return await (await this.host()).getProperty<string>('id');
  }

  /**
   * Focuses the thumb and returns a promise that indicates when the
   * action is complete.
   *
   * 聚焦滑块并返回指示操作何时完成的 Promise。
   *
   */
  async focus(): Promise<void> {
    return (await this.host()).focus();
  }

  /**
   * Blurs the thumb and returns a promise that indicates when the
   * action is complete.
   *
   * 失焦滑块并返回指示操作何时完成的 Promise。
   *
   */
  async blur(): Promise<void> {
    return (await this.host()).blur();
  }

  /**
   * Whether the thumb is focused.
   *
   * 滑块是否拥有焦点。
   *
   */
  async isFocused(): Promise<boolean> {
    return (await this.host()).isFocused();
  }
}
