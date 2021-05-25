/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

/**
 * Options for creating a ConfigurableFocusTrap.
 *
 * 用于创建 ConfigurableFocusTrap 的选项。
 *
 */
export interface ConfigurableFocusTrapConfig {
  /**
   * Whether to defer the creation of FocusTrap elements to be done manually by the user.
   *
   * 是否推迟到由用户手动完成 FocusTrap 元素的创建。
   */
  defer: boolean;
}
