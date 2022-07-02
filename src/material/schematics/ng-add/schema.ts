/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

export interface Schema {
  /**
   * Name of the project.
   *
   * 项目名称。
   *
   */
  project: string;

  /**
   * Whether the Angular browser animations module should be included and enabled.
   *
   * 是否应设置 Angular 浏览器动画。
   *
   */
  animations: 'enabled' | 'disabled' | 'excluded';

  /**
   * Name of pre-built theme to install.
   *
   * 要安装的预构建主题的名称。
   *
   */
  theme: 'indigo-pink' | 'deeppurple-amber' | 'pink-bluegrey' | 'purple-green' | 'custom';

  /**
   * Whether to set up global typography styles.
   *
   * 是否设置全局排版样式。
   *
   */
  typography: boolean;
}
