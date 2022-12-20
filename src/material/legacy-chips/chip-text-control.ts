/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

/**
 * Interface for a text control that is used to drive interaction with a mat-chip-list.
 *
 * 用于驱动与 mat-chip-list 交互的文本控件的接口。
 *
 * @deprecated
 *
 * Use `MatChipTextControl` from `@angular/material/chips` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
export interface MatLegacyChipTextControl {
  /**
   * Unique identifier for the text control.
   *
   * 此文本控件的唯一标识符。
   *
   */
  id: string;

  /**
   * The text control's placeholder text.
   *
   * 此文本控件的占位符文本。
   *
   */
  placeholder: string;

  /**
   * Whether the text control has browser focus.
   *
   * 此文本控件是否具有浏览器焦点。
   *
   */
  focused: boolean;

  /**
   * Whether the text control is empty.
   *
   * 此文本控件是否为空。
   *
   */
  empty: boolean;

  /**
   * Focuses the text control.
   *
   * 聚焦此文本控件。
   *
   */
  focus(options?: FocusOptions): void;
}
