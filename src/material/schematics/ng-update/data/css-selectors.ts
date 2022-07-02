/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {TargetVersion, VersionChanges} from '@angular/cdk/schematics';

export interface MaterialCssSelectorData {
  /**
   * The CSS selector to replace.
   *
   * 要替换的 CSS 选择器。
   *
   */
  replace: string;
  /**
   * The new CSS selector.
   *
   * 新的 CSS 选择器。
   *
   */
  replaceWith: string;
  /**
   * Controls which file types in which this replacement is made. If omitted, it is made in all
   * files.
   *
   * 控制要进行这种替换的那些文件类型。如果省略，它将在所有文件中进行。
   *
   */
  replaceIn?: {
    /**
     * Replace this name in stylesheet files.
     *
     * 在样式表文件中替换此名称。
     *
     */
    stylesheet?: boolean;
    /**
     * Replace this name in HTML files.
     *
     * 在 HTML 文件中替换此名称。
     *
     */
    html?: boolean;
    /**
     * Replace this name in TypeScript strings.
     *
     * 在 TypeScript 字符串中替换此名称。
     *
     */
    tsStringLiterals?: boolean;
  };
}

export const cssSelectors: VersionChanges<MaterialCssSelectorData> = {
  [TargetVersion.V14]: [
    {
      pr: 'https://github.com/angular/components/pull/23327',
      changes: [{replace: '.mat-list-item-avatar', replaceWith: '.mat-list-item-with-avatar'}],
    },
  ],
  [TargetVersion.V6]: [
    {
      pr: 'https://github.com/angular/components/pull/10296',
      changes: [
        {replace: '.mat-form-field-placeholder', replaceWith: '.mat-form-field-label'},
        {replace: '.mat-input-container', replaceWith: '.mat-form-field'},
        {replace: '.mat-input-flex', replaceWith: '.mat-form-field-flex'},
        {replace: '.mat-input-hint-spacer', replaceWith: '.mat-form-field-hint-spacer'},
        {replace: '.mat-input-hint-wrapper', replaceWith: '.mat-form-field-hint-wrapper'},
        {replace: '.mat-input-infix', replaceWith: '.mat-form-field-infix'},
        {replace: '.mat-input-invalid', replaceWith: '.mat-form-field-invalid'},
        {replace: '.mat-input-placeholder', replaceWith: '.mat-form-field-label'},
        {replace: '.mat-input-placeholder-wrapper', replaceWith: '.mat-form-field-label-wrapper'},
        {replace: '.mat-input-prefix', replaceWith: '.mat-form-field-prefix'},
        {replace: '.mat-input-ripple', replaceWith: '.mat-form-field-ripple'},
        {replace: '.mat-input-subscript-wrapper', replaceWith: '.mat-form-field-subscript-wrapper'},
        {replace: '.mat-input-suffix', replaceWith: '.mat-form-field-suffix'},
        {replace: '.mat-input-underline', replaceWith: '.mat-form-field-underline'},
        {replace: '.mat-input-wrapper', replaceWith: '.mat-form-field-wrapper'},
      ],
    },

    // TODO(devversion): this shouldn't be here because it's not a CSS selector. Move into misc
    // rule.
    {
      pr: 'https://github.com/angular/components/pull/10430',
      changes: [
        {
          replace: '$mat-font-family',
          replaceWith: "Roboto, 'Helvetica Neue', sans-serif",
          replaceIn: {stylesheet: true},
        },
      ],
    },
  ],
};
