/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

/**
 * Configuration for creating a ConfigurableFocusTrap.
 *
 * 用于创建 ConfigurableFocusTrap 的配置。
 *
 */
export class ConfigurableFocusTrapConfig {
  /**
   * Whether to defer the creation of FocusTrap elements to be
   * done manually by the user. Default is to create them
   * automatically.
   *
   * 是否推迟由用户手动完成 FocusTrap 元素的创建。默认是自动创建它们。
   *
   */
  defer: boolean = false;
}
