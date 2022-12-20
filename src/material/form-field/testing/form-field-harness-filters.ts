/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {BaseHarnessFilters} from '@angular/cdk/testing';

/**
 * A set of criteria that can be used to filter a list of `MatFormFieldHarness` instances.
 *
 * 一组可用于过滤 `MatFormFieldHarness` 实例列表的条件。
 *
 */
export interface FormFieldHarnessFilters extends BaseHarnessFilters {
  /**
   * Filters based on the text of the form field's floating label.
   *
   * 根据表单字段的浮动标签的文本进行过滤。
   *
   */
  floatingLabelText?: string | RegExp;
  /**
   * Filters based on whether the form field has error messages.
   *
   * 根据表单字段是否包含错误消息进行过滤。
   *
   */
  hasErrors?: boolean;
  /**
   * Filters based on whether the form field value is valid.
   *
   * 根据表单字段值是否有效进行过滤。
   *
   */
  isValid?: boolean;
}
