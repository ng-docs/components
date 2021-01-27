/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Injectable, Optional, SkipSelf} from '@angular/core';
import {Subject} from 'rxjs';

/**
 * Stepper data that is required for internationalization.
 *
 * 国际化所需的步进器数据。
 *
 */
@Injectable({providedIn: 'root'})
export class MatStepperIntl {
  /**
   * Stream that emits whenever the labels here are changed. Use this to notify
   * components if the labels have changed after initialization.
   *
   * 只要这里的标签发生了变化就会发出流。如果标签在初始化后发生了变化，用它来通知组件。
   *
   */
  readonly changes: Subject<void> = new Subject<void>();

  /**
   * Label that is rendered below optional steps.
   *
   * 在可选步骤下要渲染的标签。
   *
   */
  optionalLabel: string = 'Optional';
}

/** @docs-private */
export function MAT_STEPPER_INTL_PROVIDER_FACTORY(parentIntl: MatStepperIntl) {
  return parentIntl || new MatStepperIntl();
}

/** @docs-private */
export const MAT_STEPPER_INTL_PROVIDER = {
  provide: MatStepperIntl,
  deps: [[new Optional(), new SkipSelf(), MatStepperIntl]],
  useFactory: MAT_STEPPER_INTL_PROVIDER_FACTORY
};
