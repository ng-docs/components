/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {NgModule} from '@angular/core';

import {CdkColumnResize} from './column-resize-directives/column-resize';
import {CdkColumnResizeFlex} from './column-resize-directives/column-resize-flex';
import {CdkDefaultEnabledColumnResize} from './column-resize-directives/default-enabled-column-resize';
import {CdkDefaultEnabledColumnResizeFlex} from './column-resize-directives/default-enabled-column-resize-flex';

/**
 * One of two NgModules for use with CdkColumnResize.
 * When using this module, columns are resizable by default.
 *
 * 与 CdkColumnResize 一起使用的两个 NgModule 之一。使用此模块时，列默认情况下可调整大小。
 *
 */
@NgModule({
  declarations: [CdkDefaultEnabledColumnResize, CdkDefaultEnabledColumnResizeFlex],
  exports: [CdkDefaultEnabledColumnResize, CdkDefaultEnabledColumnResizeFlex],
})
export class CdkColumnResizeDefaultEnabledModule {}

/**
 * One of two NgModules for use with CdkColumnResize.
 * When using this module, columns are not resizable by default.
 *
 * 与 CdkColumnResize 一起使用的两个 NgModule 之一。使用此模块时，列默认情况下不可调整大小。
 *
 */
@NgModule({
  declarations: [CdkColumnResize, CdkColumnResizeFlex],
  exports: [CdkColumnResize, CdkColumnResizeFlex],
})
export class CdkColumnResizeModule {}
