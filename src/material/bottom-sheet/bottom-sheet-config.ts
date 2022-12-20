/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Direction} from '@angular/cdk/bidi';
import {ScrollStrategy} from '@angular/cdk/overlay';
import {InjectionToken, ViewContainerRef} from '@angular/core';

/**
 * Options for where to set focus to automatically on dialog open
 *
 * 用于在对话框打开时自动将焦点设置到何处的选项
 *
 */
export type AutoFocusTarget = 'dialog' | 'first-tabbable' | 'first-heading';

/**
 * Injection token that can be used to access the data that was passed in to a bottom sheet.
 *
 * 这个注入令牌可以用来访问那些传入底部操作表的数据。
 *
 */
export const MAT_BOTTOM_SHEET_DATA = new InjectionToken<any>('MatBottomSheetData');

/**
 * Configuration used when opening a bottom sheet.
 *
 * 打开底部操作表时使用的配置。
 *
 */
export class MatBottomSheetConfig<D = any> {
  /**
   * The view container to place the overlay for the bottom sheet into.
   *
   * 用于放置底部操作表浮层的容器。
   *
   */
  viewContainerRef?: ViewContainerRef;

  /**
   * Extra CSS classes to be added to the bottom sheet container.
   *
   * 要添加到底部操作表容器中的额外 CSS 类。
   *
   */
  panelClass?: string | string[];

  /**
   * Text layout direction for the bottom sheet.
   *
   * 底部操作表的文本布局方向。
   *
   */
  direction?: Direction;

  /**
   * Data being injected into the child component.
   *
   * 注入到子组件中的数据。
   *
   */
  data?: D | null = null;

  /**
   * Whether the bottom sheet has a backdrop.
   *
   * 底部操作表是否有背景板。
   *
   */
  hasBackdrop?: boolean = true;

  /**
   * Custom class for the backdrop.
   *
   * 背景板的自定义类。
   *
   */
  backdropClass?: string;

  /**
   * Whether the user can use escape or clicking outside to close the bottom sheet.
   *
   * 用户是否可以使用 escape 或单击外部来关闭底部操作表。
   *
   */
  disableClose?: boolean = false;

  /**
   * Aria label to assign to the bottom sheet element.
   *
   * 指定给底部操作表元素的 Aria 标签。
   *
   */
  ariaLabel?: string | null = null;

  /** Whether this is a modal bottom sheet. Used to set the `aria-modal` attribute. */
  ariaModal?: boolean = true;

  /**
   * Whether the bottom sheet should close when the user goes backwards/forwards in history.
   * Note that this usually doesn't include clicking on links (unless the user is using
   * the `HashLocationStrategy`).
   *
   * 当用户在历史记录中前进或后退时，底部操作表是否应该关闭。请注意，这通常不包括单击某些链接（除非用户正在使用 `HashLocationStrategy` ）。
   *
   */
  closeOnNavigation?: boolean = true;

  // Note that this is set to 'dialog' by default, because while the a11y recommendations
  // are to focus the first focusable element, doing so prevents screen readers from reading out the
  // rest of the bottom sheet content.
  /**
   * Where the bottom sheet should focus on open.
   *
   * 底部工作表打开时应聚焦到的位置。。
   *
   * @breaking-change 14.0.0 Remove boolean option from autoFocus. Use string or
   * AutoFocusTarget instead.
   *
   * 从 autoFocus 中删除布尔选项。请改用字符串或 AutoFocusTarget。
   *
   */
  autoFocus?: AutoFocusTarget | string | boolean = 'dialog';

  /**
   * Whether the bottom sheet should restore focus to the
   * previously-focused element, after it's closed.
   *
   * 关闭底部操作表时是否应该把焦点还给以前拥有焦点的元素。
   *
   */
  restoreFocus?: boolean = true;

  /**
   * Scroll strategy to be used for the bottom sheet.
   *
   * 用于底部操作表的滚动策略。
   *
   */
  scrollStrategy?: ScrollStrategy;
}
