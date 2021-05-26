/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ComponentHarness} from '@angular/cdk/testing';

/**
 * Base class for custom form-field control harnesses. Harnesses for
 * custom controls with form-fields need to implement this interface.
 *
 * 定制表单字段控件测试工具的基类。支持表单字段的自定义控件的测试工具需要实现此接口。
 *
 */
export abstract class MatFormFieldControlHarness extends ComponentHarness {}
