/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {InjectionToken} from '@angular/core';

/**
 * Object that can be used to configure the default options for the tabs module.
 *
 * 可用于配置选项卡模块默认选项的对象。
 *
 */
export interface MatTabsConfig {
  /**
   * Duration for the tab animation. Must be a valid CSS value \(e.g. 600ms\).
   *
   * 选项卡动画的持续时间。必须是一个有效的 CSS 值（比如 600ms）。
   *
   */
  animationDuration?: string;

  /**
   * Whether pagination should be disabled. This can be used to avoid unnecessary
   * layout recalculations if it's known that pagination won't be required.
   *
   * 是否应该禁用分页。如果明确知道不需要分页，这可以用来避免不必要的布局重算。
   *
   */
  disablePagination?: boolean;

  /**
   * Whether the ink bar should fit its width to the size of the tab label content.
   * This only applies to the MDC-based tabs.
   *
   * 墨水条的宽度是否与选项卡内容的大小相符。这仅适用于基于 MDC 的选项卡。
   *
   */
  fitInkBarToContent?: boolean;

  /**
   * Whether the tab group should grow to the size of the active tab.
   *
   * 选项卡组是否应该增长到活动选项卡的大小。
   *
   */
  dynamicHeight?: boolean;

  /**
   * `tabindex` to be set on the inner element that wraps the tab content.
   *
   * 在包装制表符内容的内部元素上设置的 `tabindex`
   *
   */
  contentTabIndex?: number;

  /**
   * By default tabs remove their content from the DOM while it's off-screen.
   * Setting this to `true` will keep it in the DOM which will prevent elements
   * like iframes and videos from reloading next time it comes back into the view.
   *
   * 默认情况下，选项卡在屏幕外时会从 DOM 中删除其内容。将此设置为 `true` 会将其保留在 DOM 中，这将防止 iframe 和视频等元素在下次返回视图时重新加载。
   *
   */
  preserveContent?: boolean;

  /** Whether tabs should be stretched to fill the header. */
  stretchTabs?: boolean;
}

/**
 * Injection token that can be used to provide the default options the tabs module.
 *
 * 这个注入令牌可以用来提供选项卡模块的默认选项。
 *
 */
export const MAT_TABS_CONFIG = new InjectionToken<MatTabsConfig>('MAT_TABS_CONFIG');
