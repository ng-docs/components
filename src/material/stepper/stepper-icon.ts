/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Directive, Input, TemplateRef} from '@angular/core';
import {StepState} from '@angular/cdk/stepper';

/**
 * Template context available to an attached `matStepperIcon`.
 *
 * 可用于附着的 `matStepperIcon` 的模板上下文。
 *
 */
export interface MatStepperIconContext {
  /**
   * Index of the step.
   *
   * 步骤的索引。
   *
   */
  index: number;
  /**
   * Whether the step is currently active.
   *
   * 该步骤当前是否处于活动状态。
   *
   */
  active: boolean;
  /**
   * Whether the step is optional.
   *
   * 该步骤是否可选。
   *
   */
  optional: boolean;
}

/**
 * Template to be used to override the icons inside the step header.
 *
 * 用来改写步骤头内部图标的模板。
 *
 */
@Directive({
  selector: 'ng-template[matStepperIcon]',
})
export class MatStepperIcon {
  /**
   * Name of the icon to be overridden.
   *
   * 要改写的图标名称。
   *
   */
  @Input('matStepperIcon') name: StepState;

  constructor(public templateRef: TemplateRef<MatStepperIconContext>) {}
}
