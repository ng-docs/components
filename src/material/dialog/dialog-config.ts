/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ViewContainerRef, ComponentFactoryResolver, Injector} from '@angular/core';
import {Direction} from '@angular/cdk/bidi';
import {ScrollStrategy} from '@angular/cdk/overlay';
import {_defaultParams} from './dialog-animations';

/**
 * Options for where to set focus to automatically on dialog open
 *
 * 用于指定当对话框打开时自动将焦点设置到何处的选项
 *
 */
export type AutoFocusTarget = 'dialog' | 'first-tabbable' | 'first-heading';

/**
 * Valid ARIA roles for a dialog element.
 *
 * 对话框元素的有效 ARIA 角色。
 *
 */
export type DialogRole = 'dialog' | 'alertdialog';

/**
 * Possible overrides for a dialog's position.
 *
 * 可改写的对话框位置。
 *
 */
export interface DialogPosition {
  /**
   * Override for the dialog's top position.
   *
   * 改写对话框的顶部位置。
   *
   */
  top?: string;

  /**
   * Override for the dialog's bottom position.
   *
   * 改写对话框的底部位置。
   *
   */
  bottom?: string;

  /**
   * Override for the dialog's left position.
   *
   * 改写对话框的左侧位置。
   *
   */
  left?: string;

  /**
   * Override for the dialog's right position.
   *
   * 改写对话框的右侧位置。
   *
   */
  right?: string;
}

/**
 * Configuration for opening a modal dialog with the MatDialog service.
 *
 * 使用 MatDialog 服务打开的模态对话框的配置。
 *
 */
export class MatDialogConfig<D = any> {
  /**
   * Where the attached component should live in Angular's *logical* component tree.
   * This affects what is available for injection and the change detection order for the
   * component instantiated inside of the dialog. This does not affect where the dialog
   * content will be rendered.
   *
   * 附着到的组件应该位于 Angular 的*逻辑*组件树中。这会影响注入时的可用内容以及在对话框中实例化的组件的变更检测顺序。这不会影响对象内容的渲染位置。
   *
   */
  viewContainerRef?: ViewContainerRef;

  /**
   * Injector used for the instantiation of the component to be attached. If provided,
   * takes precedence over the injector indirectly provided by `ViewContainerRef`.
   *
   * 用于实例化要附着的组件的注入器。如果提供，则优先于由 `ViewContainerRef` 间接提供的注入器。
   *
   */
  injector?: Injector;

  /**
   * ID for the dialog. If omitted, a unique one will be generated.
   *
   * 该对话框的 ID。如果省略，就会生成一个唯一的。
   *
   */
  id?: string;

  /**
   * The ARIA role of the dialog element.
   *
   * 该对话框元素的 ARIA 角色。
   *
   */
  role?: DialogRole = 'dialog';

  /**
   * Custom class for the overlay pane.
   *
   * 浮层面板的自定义类。
   *
   */
  panelClass?: string | string[] = '';

  /**
   * Whether the dialog has a backdrop.
   *
   * 对话框是否有背景板。
   *
   */
  hasBackdrop?: boolean = true;

  /**
   * Custom class for the backdrop.
   *
   * 背景板的自定义类。
   *
   */
  backdropClass?: string | string[] = '';

  /**
   * Whether the user can use escape or clicking on the backdrop to close the modal.
   *
   * 用户是否可以使用 escape 或单击背景板来关闭该模态框。
   *
   */
  disableClose?: boolean = false;

  /**
   * Width of the dialog.
   *
   * 该对话框的宽度。
   *
   */
  width?: string = '';

  /**
   * Height of the dialog.
   *
   * 该对话框的高度。
   *
   */
  height?: string = '';

  /**
   * Min-width of the dialog. If a number is provided, assumes pixel units.
   *
   * 对话框的最小宽度。如果提供了数字，则假设单位是像素。
   *
   */
  minWidth?: number | string;

  /**
   * Min-height of the dialog. If a number is provided, assumes pixel units.
   *
   * 对话框的最小高度。如果提供了数字，则假设单位是像素。
   *
   */
  minHeight?: number | string;

  /**
   * Max-width of the dialog. If a number is provided, assumes pixel units. Defaults to 80vw.
   *
   * 对话框的最大宽度。如果提供了数字，则假设单位是像素。默认为 80vw。
   *
   */
  maxWidth?: number | string = '80vw';

  /**
   * Max-height of the dialog. If a number is provided, assumes pixel units.
   *
   * 对话框的最大高度。如果提供了数字，则假设单位是像素。
   *
   */
  maxHeight?: number | string;

  /**
   * Position overrides.
   *
   * 位置改写。
   *
   */
  position?: DialogPosition;

  /**
   * Data being injected into the child component.
   *
   * 要注入到子组件中的数据。
   *
   */
  data?: D | null = null;

  /**
   * Layout direction for the dialog's content.
   *
   * 对话框内容的布局方向
   *
   */
  direction?: Direction;

  /**
   * ID of the element that describes the dialog.
   *
   * 描述该对话框元素的 ID。
   *
   */
  ariaDescribedBy?: string | null = null;

  /**
   * ID of the element that labels the dialog.
   *
   * 标记该对话框的元素的 ID。
   *
   */
  ariaLabelledBy?: string | null = null;

  /**
   * Aria label to assign to the dialog element.
   *
   * 要分配给对话框元素的 Aria 标签。
   *
   */
  ariaLabel?: string | null = null;

  /**
   * Whether this is a modal dialog. Used to set the `aria-modal` attribute.
   *
   * 这是否是模态对话框。用于设置 `aria-modal` 属性。
   *
   */
  ariaModal?: boolean = true;

  /**
   * Where the dialog should focus on open.
   *
   * 当对话框打开时应该聚焦到哪里。
   *
   * @breaking-change 14.0.0 Remove boolean option from autoFocus. Use string or
   * AutoFocusTarget instead.
   *
   * 从 autoFocus 中删除了布尔选项。请改用字符串或 AutoFocusTarget。
   *
   */
  autoFocus?: AutoFocusTarget | string | boolean = 'first-tabbable';

  /**
   * Whether the dialog should restore focus to the
   * previously-focused element, after it's closed.
   *
   * 该对话框是否应该在关闭之前将焦点还给以前拥有焦点的元素。
   *
   */
  restoreFocus?: boolean = true;

  /**
   * Whether to wait for the opening animation to finish before trapping focus.
   *
   * 是否等待开场动画完成后再捕获焦点。
   *
   */
  delayFocusTrap?: boolean = true;

  /**
   * Scroll strategy to be used for the dialog.
   *
   * 用于对话框的滚动策略。
   *
   */
  scrollStrategy?: ScrollStrategy;

  /**
   * Whether the dialog should close when the user goes backwards/forwards in history.
   * Note that this usually doesn't include clicking on links (unless the user is using
   * the `HashLocationStrategy`).
   *
   * 当用户在历史记录中后退时，该对话框是否会关闭。请注意，这通常不包括单击链接（除非用户正在使用 `HashLocationStrategy` ）。
   *
   */
  closeOnNavigation?: boolean = true;

  /**
   * Alternate `ComponentFactoryResolver` to use when resolving the associated component.
   *
   * 备用 `ComponentFactoryResolver`，用于解析其关联组件。
   *
   */
  componentFactoryResolver?: ComponentFactoryResolver;

  /**
   * Duration of the enter animation in ms.
   * Should be a number, string type is deprecated.
   *
   * 进场动画的持续时间，以毫秒为单位。
   * 应该是一个数字，字符串类型的值已经弃用。
   *
   * @breaking-change 17.0.0 Remove string signature.
   *
   *17.0.0 会移除字符串型签名。
   *
   */
  enterAnimationDuration?: string | number;

  /**
   * Duration of the exit animation in ms.
   * Should be a number, string type is deprecated.
   *
   * 进场动画的持续时间，以毫秒为单位。
   * 应该是一个数字，字符串类型的值已经弃用。
   *
   * @breaking-change 17.0.0 Remove string signature.
   *
   * 17.0.0 会移除字符串型签名。
   *
   */
  exitAnimationDuration?: string | number;

  // TODO(jelbourn): add configuration for lifecycle hooks, ARIA labelling.
}
