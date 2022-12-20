/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ComponentHarness, HarnessPredicate, parallel} from '@angular/cdk/testing';
import {coerceBooleanProperty, coerceNumberProperty} from '@angular/cdk/coercion';
import {LegacySliderHarnessFilters} from './slider-harness-filters';

/**
 * Harness for interacting with a standard mat-slider in tests.
 *
 * 在测试中用来与标准 mat-slider 进行交互的测试工具。
 *
 * @deprecated
 *
 * Use `MatSliderHarness` from `@angular/material/slider/testing` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
export class MatLegacySliderHarness extends ComponentHarness {
  /**
   * The selector for the host element of a `MatSlider` instance.
   *
   * `MatSlider` 实例的宿主元素选择器。
   *
   */
  static hostSelector = '.mat-slider';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a `MatSliderHarness` that meets
   * certain criteria.
   *
   * 获取一个 `HarnessPredicate`，可用于搜索满足某些条件的 `MatSliderHarness`。
   *
   * @param options Options for filtering which slider instances are considered a match.
   *
   * 用于过滤哪些滑块实例应该视为匹配的选项。
   *
   * @return a `HarnessPredicate` configured with the given options.
   *
   * 使用给定选项配置过的 `HarnessPredicate`。
   *
   */
  static with(options: LegacySliderHarnessFilters = {}): HarnessPredicate<MatLegacySliderHarness> {
    return new HarnessPredicate(MatLegacySliderHarness, options);
  }

  private _textLabel = this.locatorFor('.mat-slider-thumb-label-text');
  private _wrapper = this.locatorFor('.mat-slider-wrapper');

  /**
   * Gets the slider's id.
   *
   * 获取滑块的 ID。
   *
   */
  async getId(): Promise<string | null> {
    const id = await (await this.host()).getAttribute('id');
    // In case no id has been specified, the "id" property always returns
    // an empty string. To make this method more explicit, we return null.
    return id !== '' ? id : null;
  }

  /**
   * Gets the current display value of the slider. Returns a null promise if the thumb label is
   * disabled.
   *
   * 获取滑块的当前显示值。如果禁用了指示标签，则返回一个空的 Promise。
   *
   */
  async getDisplayValue(): Promise<string | null> {
    const [host, textLabel] = await parallel(() => [this.host(), this._textLabel()]);
    if (await host.hasClass('mat-slider-thumb-label-showing')) {
      return textLabel.text();
    }
    return null;
  }

  /**
   * Gets the current percentage value of the slider.
   *
   * 获取此滑块的当前百分比值。
   *
   */
  async getPercentage(): Promise<number> {
    return this._calculatePercentage(await this.getValue());
  }

  /**
   * Gets the current value of the slider.
   *
   * 获取此滑块的当前值。
   *
   */
  async getValue(): Promise<number> {
    return coerceNumberProperty(await (await this.host()).getAttribute('aria-valuenow'));
  }

  /**
   * Gets the maximum value of the slider.
   *
   * 获取此滑块的最大值。
   *
   */
  async getMaxValue(): Promise<number> {
    return coerceNumberProperty(await (await this.host()).getAttribute('aria-valuemax'));
  }

  /**
   * Gets the minimum value of the slider.
   *
   * 获取此滑块的最小值。
   *
   */
  async getMinValue(): Promise<number> {
    return coerceNumberProperty(await (await this.host()).getAttribute('aria-valuemin'));
  }

  /**
   * Whether the slider is disabled.
   *
   * 此滑块是否已禁用。
   *
   */
  async isDisabled(): Promise<boolean> {
    const disabled = (await this.host()).getAttribute('aria-disabled');
    return coerceBooleanProperty(await disabled);
  }

  /**
   * Gets the orientation of the slider.
   *
   * 获取此滑块的方向。
   *
   */
  async getOrientation(): Promise<'horizontal' | 'vertical'> {
    // "aria-orientation" will always be set to either "horizontal" or "vertical".
    return (await this.host()).getAttribute('aria-orientation') as any;
  }

  /**
   * Sets the value of the slider by clicking on the slider track.
   *
   * 通过单击滑块轨道来设置此滑块的值。
   *
   * Note that in rare cases the value cannot be set to the exact specified value. This
   * can happen if not every value of the slider maps to a single pixel that could be
   * clicked using mouse interaction. In such cases consider using the keyboard to
   * select the given value or expand the slider's size for a better user experience.
   *
   * 请注意，在极少数情况下，该值不能设置为确切的指定值。如果并非滑块的每个值都能映射到可以使用鼠标交互操作单击的单个像素，则会发生这种情况。在这种情况下，请考虑使用键盘来选择给定值或扩展滑块的大小，以获得更好的用户体验。
   *
   */
  async setValue(value: number): Promise<void> {
    const [sliderEl, wrapperEl, orientation] = await parallel(() => [
      this.host(),
      this._wrapper(),
      this.getOrientation(),
    ]);
    let percentage = await this._calculatePercentage(value);
    const {height, width} = await wrapperEl.getDimensions();
    const isVertical = orientation === 'vertical';

    // In case the slider is inverted in LTR mode or not inverted in RTL mode,
    // we need to invert the percentage so that the proper value is set.
    if (await sliderEl.hasClass('mat-slider-invert-mouse-coords')) {
      percentage = 1 - percentage;
    }

    // We need to round the new coordinates because creating fake DOM
    // events will cause the coordinates to be rounded down.
    const relativeX = isVertical ? 0 : Math.round(width * percentage);
    const relativeY = isVertical ? Math.round(height * percentage) : 0;

    await wrapperEl.click(relativeX, relativeY);
  }

  /**
   * Focuses the slider.
   *
   * 让此滑块获得焦点。
   *
   */
  async focus(): Promise<void> {
    return (await this.host()).focus();
  }

  /**
   * Blurs the slider.
   *
   * 让此滑块失焦。
   *
   */
  async blur(): Promise<void> {
    return (await this.host()).blur();
  }

  /**
   * Whether the slider is focused.
   *
   * 此滑块是否拥有焦点。
   *
   */
  async isFocused(): Promise<boolean> {
    return (await this.host()).isFocused();
  }

  /** Calculates the percentage of the given value. */
  private async _calculatePercentage(value: number) {
    const [min, max] = await parallel(() => [this.getMinValue(), this.getMaxValue()]);
    return (value - min) / (max - min);
  }
}
