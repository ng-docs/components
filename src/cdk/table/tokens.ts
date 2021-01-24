/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {InjectionToken} from '@angular/core';

/**
 * Used to provide a table to some of the sub-components without causing a circular dependency.
 *
 * 用来为某些子组件提供表格，而不会产生循环依赖。
 *
 * @docs-private
 */
export const CDK_TABLE = new InjectionToken<any>('CDK_TABLE');

/**
 * Configurable options for `CdkTextColumn`.
 *
 * `CdkTextColumn` 配置选项。
 *
 */
export interface TextColumnOptions<T> {
  /**
   * Default function that provides the header text based on the column name if a header
   * text is not provided.
   *
   * 默认函数，如果没有提供表头文本，它就会根据列名提供表头文本。
   *
   */
  defaultHeaderTextTransform?: (name: string) => string;

  /**
   * Default data accessor to use if one is not provided.
   *
   * 默认数据访问器，如果一个都没有提供过，就用它。
   *
   */
  defaultDataAccessor?: (data: T, name: string) => string;
}

/**
 * Injection token that can be used to specify the text column options.
 *
 * 这个注入令牌可以用来指定文本列的选项。
 *
 */
export const TEXT_COLUMN_OPTIONS =
    new InjectionToken<TextColumnOptions<any>>('text-column-options');
