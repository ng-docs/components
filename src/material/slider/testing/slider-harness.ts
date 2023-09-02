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
} from '@angular/cdk/testing';
import {coerceNumberProperty} from '@angular/cdk/coercion';
import {SliderHarnessFilters, ThumbPosition} from './slider-harness-filters';
import {MatSliderThumbHarness} from './slider-thumb-harness';

/**
 * Harness for interacting with a MDC mat-slider in tests.
 *
 * 在测试中用来与标准 mat-slider 进行交互的测试工具。
 *
 */
export class MatSliderHarness extends ComponentHarness {
  static hostSelector = '.mat-mdc-slider';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a slider with specific attributes.
   *
   * 获取一个 `HarnessPredicate`，可用于搜索满足某些条件的 `MatSliderHarness`。
   *
   * @param options Options for filtering which input instances are considered a match.
   *
   * 用于过滤哪些滑块实例应该视为匹配的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 用指定选项配置过的 `HarnessPredicate` 服务。
   */
  static with<T extends MatSliderHarness>(
    this: ComponentHarnessConstructor<T>,
    options: SliderHarnessFilters = {},
  ): HarnessPredicate<T> {
    return new HarnessPredicate(this, options)
      .addOption('isRange', options.isRange, async (harness, value) => {
        return (await harness.isRange()) === value;
      })
      .addOption('disabled', options.disabled, async (harness, disabled) => {
        return (await harness.isDisabled()) === disabled;
      });
  }

  /**
   * Gets the start thumb of the slider \(only applicable for range sliders\).
   *
   * 获取滑杆的起始缩略图（仅适用于范围滑杆）。
   *
   */
  async getStartThumb(): Promise<MatSliderThumbHarness> {
    if (!(await this.isRange())) {
      throw Error(
        '`getStartThumb` is only applicable for range sliders. ' +
          'Did you mean to use `getEndThumb`?',
      );
    }
    return this.locatorFor(MatSliderThumbHarness.with({position: ThumbPosition.START}))();
  }

  /**
   * Gets the thumb \(for single point sliders\), or the end thumb \(for range sliders\).
   *
   * 获取滑块的 ID。
   *
   */
  async getEndThumb(): Promise<MatSliderThumbHarness> {
    return this.locatorFor(MatSliderThumbHarness.with({position: ThumbPosition.END}))();
  }

  /**
   * Gets whether the slider is a range slider. \*
   * 获取滑块的当前显示值。如果禁用了指示标签，则返回一个空的 Promise。
   *
   */
  async isRange(): Promise<boolean> {
    return await (await this.host()).hasClass('mdc-slider--range');
  }

  /**
   * Gets whether the slider is disabled.
   *
   * 获取此滑块的当前百分比值。
   *
   */
  async isDisabled(): Promise<boolean> {
    return await (await this.host()).hasClass('mdc-slider--disabled');
  }

  /**
   * Gets the value step increments of the slider.
   *
   * 获取此滑块的当前值。
   *
   */
  async getStep(): Promise<number> {
    // The same step value is forwarded to both thumbs.
    const startHost = await (await this.getEndThumb()).host();
    return coerceNumberProperty(await startHost.getProperty<string>('step'));
  }

  /**
   * Gets the maximum value of the slider.
   *
   * 获取此滑块的最大值。
   *
   */
  async getMaxValue(): Promise<number> {
    return (await this.getEndThumb()).getMaxValue();
  }

  /**
   * Gets the minimum value of the slider.
   *
   * 获取此滑块的最小值。
   *
   */
  async getMinValue(): Promise<number> {
    const startThumb = (await this.isRange())
      ? await this.getStartThumb()
      : await this.getEndThumb();
    return startThumb.getMinValue();
  }
}
