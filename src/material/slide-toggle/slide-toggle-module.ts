/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ObserversModule} from '@angular/cdk/observers';
import {NgModule} from '@angular/core';
import {MatCommonModule, MatRippleModule} from '@angular/material/core';
import {MatSlideToggle} from './slide-toggle';
import {MatSlideToggleRequiredValidator} from './slide-toggle-required-validator';

/**
 * This module is used by both original and MDC-based slide-toggle implementations.
 *
 * 原始和基于 MDC 的滑块开关实现都使用了这个模块。
 *
 */
@NgModule({
  exports: [MatSlideToggleRequiredValidator],
  declarations: [MatSlideToggleRequiredValidator],
})
export class _MatSlideToggleRequiredValidatorModule {}

@NgModule({
  imports: [
    _MatSlideToggleRequiredValidatorModule,
    MatRippleModule,
    MatCommonModule,
    ObserversModule,
  ],
  exports: [_MatSlideToggleRequiredValidatorModule, MatSlideToggle, MatCommonModule],
  declarations: [MatSlideToggle],
})
export class MatSlideToggleModule {}
