/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ViewContainerRef, InjectionToken} from '@angular/core';
import {AriaLivePoliteness} from '@angular/cdk/a11y';
import {Direction} from '@angular/cdk/bidi';

/**
 * Injection token that can be used to access the data that was passed in to a snack bar.
 *
 * 这个注入令牌可以用来访问传入快餐栏的数据。
 *
 */
export const MAT_SNACK_BAR_DATA = new InjectionToken<any>('MatSnackBarData');

/**
 * Possible values for horizontalPosition on MatSnackBarConfig.
 *
 * MatSnackBarConfig 中 horizontalPosition 的可选值。
 *
 */
export type MatSnackBarHorizontalPosition = 'start' | 'center' | 'end' | 'left' | 'right';

/**
 * Possible values for verticalPosition on MatSnackBarConfig.
 *
 * MatSnackBarConfig 中 verticalPosition 的可选值。
 *
 */
export type MatSnackBarVerticalPosition = 'top' | 'bottom';

/**
 * Configuration used when opening a snack-bar.
 *
 * 打开快餐栏时使用的配置。
 *
 */
export class MatSnackBarConfig<D = any> {
  /**
   * The politeness level for the MatAriaLiveAnnouncer announcement.
   *
   * MatAriaLiveAnnouncer 公告的文雅程度。
   *
   */
  politeness?: AriaLivePoliteness = 'assertive';

  /**
   * Message to be announced by the LiveAnnouncer. When opening a snackbar without a custom
   * component or template, the announcement message will default to the specified message.
   *
   * 将由 LiveAnnouncer 朗读的消息。当没有自定义组件或模板的情况下打开快餐栏时，公告信息会默认为指定的消息。
   *
   */
  announcementMessage?: string = '';

  /**
   * The view container that serves as the parent for the snackbar for the purposes of dependency
   * injection. Note: this does not affect where the snackbar is inserted in the DOM.
   *
   * 视图容器的引用，可以在依赖注入时作为快餐栏的父组件。注意：这不会影响快餐栏在 DOM 中的插入位置。
   *
   */
  viewContainerRef?: ViewContainerRef;

  /**
   * The length of time in milliseconds to wait before automatically dismissing the snack bar.
   *
   * 在自动关闭快餐栏之前要等待的毫秒数。
   *
   */
  duration?: number = 0;

  /**
   * Extra CSS classes to be added to the snack bar container.
   *
   * 要添加到快餐栏容器中的额外 CSS 类。
   *
   */
  panelClass?: string | string[];

  /**
   * Text layout direction for the snack bar.
   *
   * 快餐栏的文字布局方向。
   *
   */
  direction?: Direction;

  /**
   * Data being injected into the child component.
   *
   * 要注入到子组件中的数据。
   *
   */
  data?: D | null = null;

  /**
   * The horizontal position to place the snack bar.
   *
   * 放置快餐栏的水平位置。
   *
   */
  horizontalPosition?: MatSnackBarHorizontalPosition = 'center';

  /**
   * The vertical position to place the snack bar.
   *
   * 放置快餐栏的垂直位置。
   *
   */
  verticalPosition?: MatSnackBarVerticalPosition = 'bottom';
}
