/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {BaseHarnessFilters} from '@angular/cdk/testing';

/**
 * Possible positions of a slider thumb.
 *
 * 滑杆滑块的可能位置。
 *
 */
export const enum ThumbPosition {
  START,
  END,
}

/**
 * A set of criteria that can be used to filter a list of `MatSliderHarness` instances.
 *
 * 一组可用于过滤 `MatSliderHarness` 实例列表的条件。
 *
 */
export interface SliderHarnessFilters extends BaseHarnessFilters {
  /**
   * Filters out only range/non-range sliders.
   *
   * 仅过滤掉范围/非范围滑杆。
   *
   */
  isRange?: boolean;

  /**
   * Only find instances which match the given disabled state.
   *
   * 仅查找与给定禁用状态匹配的实例。
   *
   */
  disabled?: boolean;
}

/**
 * A set of criteria that can be used to filter a list of `MatSliderThumbHarness` instances.
 *
 * 一组可用于过滤 `MatSliderThumbHarness` 实例列表的条件。
 *
 */
export interface SliderThumbHarnessFilters extends BaseHarnessFilters {
  /**
   * Filters out slider thumbs with a particular position.
   *
   * 过滤掉具有特定位置的滑杆滑块。
   *
   */
  position?: ThumbPosition;
}
