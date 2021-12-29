/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {BaseHarnessFilters} from '@angular/cdk/testing';

/**
 * Possible orientations for a stepper.
 *
 * 步进器的可能方向。
 *
 */
export const enum StepperOrientation {
  HORIZONTAL,
  VERTICAL,
}

/**
 * A set of criteria that can be used to filter a list of `MatStepHarness` instances.
 *
 * 一组可用于过滤 `MatStepHarness` 实例列表的条件。
 *
 */
export interface StepHarnessFilters extends BaseHarnessFilters {
  /**
   * Only find instances whose label matches the given value.
   *
   * 只查找标签与指定值匹配的实例。
   *
   */
  label?: string | RegExp;
  /**
   * Only find steps with the given selected state.
   *
   * 仅找到具有给定选定状态的步骤。
   *
   */
  selected?: boolean;
  /**
   * Only find completed steps.
   *
   * 仅找到已完成的步骤。
   *
   */
  completed?: boolean;
  /**
   * Only find steps that have errors.
   *
   * 仅找到有错误的步骤。
   *
   */
  invalid?: boolean;
}

/**
 * A set of criteria that can be used to filter a list of `MatStepperHarness` instances.
 *
 * 一组可用于过滤 `MatStepperHarness` 实例列表的条件。
 *
 */
export interface StepperHarnessFilters extends BaseHarnessFilters {
  /**
   * Only find instances whose orientation matches the given value.
   *
   * 仅找到方向与给定值匹配的实例。
   *
   */
  orientation?: StepperOrientation;
}

/**
 * A set of criteria that can be used to filter a list of
 * `MatStepperNextHarness` and `MatStepperPreviousHarness` instances.
 *
 * 一组可用于过滤 `MatStepperNextHarness` 和 `MatStepperPreviousHarness` 实例列表的条件。
 *
 */
export interface StepperButtonHarnessFilters extends BaseHarnessFilters {
  /**
   * Only find instances whose text matches the given value.
   *
   * 只查找其文本内容匹配指定值的实例。
   *
   */
  text?: string | RegExp;
}
