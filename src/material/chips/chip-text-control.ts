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
 * 文本控件的接口，用于驱动与 mat-chip-list 的交互。
 *
 */
export interface MatChipTextControl {
  /**
   * Unique identifier for the text control.
   *
   * 文本控件的唯一标识符。
   *
   */
  id: string;

  /**
   * The text control's placeholder text.
   *
   * 文本控件的占位符文本。
   *
   */
  placeholder: string;

  /**
   * Whether the text control has browser focus.
   *
   * 文本控件是否具有浏览器焦点。
   *
   */
  focused: boolean;

  /**
   * Whether the text control is empty.
   *
   * 文本控件是否为空。
   *
   */
  empty: boolean;

  /**
   * Focuses the text control.
   *
   * 让文本控件获得焦点。
   *
   */
  focus(): void;

  /** Sets the list of ids the input is described by. */
  setDescribedByIds(ids: string[]): void;
}
