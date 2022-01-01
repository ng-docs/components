/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Injectable} from '@angular/core';
import {RippleGlobalOptions} from '@angular/material/core';

/**
 * Global ripple options for the dev-app. The ripple options are used as a class
 * so that the global options can be changed at runtime.
 *
 * 开发应用程序的全局涟漪选项。该涟漪选项用作一个类，以便可以在运行时更改全局选项。
 *
 */
@Injectable({providedIn: 'root'})
export class DevAppRippleOptions implements RippleGlobalOptions {
  /**
   * Whether ripples should be disabled
   *
   * 是否应该禁用涟漪
   *
   */
  disabled: boolean = false;
}
