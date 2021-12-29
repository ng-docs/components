/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {CdkTreeNodeToggle} from '@angular/cdk/tree';
import {Directive} from '@angular/core';

/**
 * Wrapper for the CdkTree's toggle with Material design styles.
 *
 * 供 CdkTree 用于切换的带有 Material Design 样式的包装器。
 *
 */
@Directive({
  selector: '[matTreeNodeToggle]',
  providers: [{provide: CdkTreeNodeToggle, useExisting: MatTreeNodeToggle}],
  inputs: ['recursive: matTreeNodeToggleRecursive'],
})
export class MatTreeNodeToggle<T, K = T> extends CdkTreeNodeToggle<T, K> {}
