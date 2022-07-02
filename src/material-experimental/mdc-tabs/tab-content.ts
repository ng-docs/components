/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Directive} from '@angular/core';
import {MatTabContent as BaseMatTabContent} from '@angular/material/tabs';

/**
 * Decorates the `ng-template` tags and reads out the template from it.
 *
 * 修饰 `ng-template` 标签，并从中读出模板。
 *
 */
@Directive({selector: '[matTabContent]'})
export class MatTabContent extends BaseMatTabContent {}
