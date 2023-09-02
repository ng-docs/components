/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  ViewContainerRef,
  ComponentFactoryResolver,
  Injector,
  StaticProvider,
  Type,
} from '@angular/core';
import {Direction} from '@angular/cdk/bidi';
import {PositionStrategy, ScrollStrategy} from '@angular/cdk/overlay';
import {BasePortalOutlet} from '@angular/cdk/portal';

/**
 * Options for where to set focus to automatically on dialog open
 *
 * 用于在对话框打开时自动将焦点设置到何处的选项
 *
 */
export type AutoFocusTarget = 'dialog' | 'first-tabbable' | 'first-heading';

/**
 * Valid ARIA roles for a dialog.
 *
 * 对话框的有效 ARIA 角色。
 *
 */
export type DialogRole = 'dialog' | 'alertdialog';

/**
 * Configuration for opening a modal dialog.
 *
 * 用于打开模态对话框的配置。
 *
 */
export class DialogConfig<D = unknown, R = unknown, C extends BasePortalOutlet = BasePortalOutlet> {
  /**
   * Where the attached component should live in Angular's *logical* component tree.
   * This affects what is available for injection and the change detection order for the
   * component instantiated inside of the dialog. This does not affect where the dialog
   * content will be rendered.
   *
   * 附着到组件应该位于 Angular 的*逻辑*组件树中。这会影响注入时的可用内容以及在对话框中实例化的组件的变更检测顺序。这不会影响对象内容的渲染位置。
   *
   */
  viewContainerRef?: ViewContainerRef;

  /**
   * Injector used for the instantiation of the component to be attached. If provided,
   * takes precedence over the injector indirectly provided by `ViewContainerRef`.
   *
   * 用于实例化要附着到的组件的注入器。如果提供，则优先于由 `ViewContainerRef` 间接提供的注入器。
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
   * Optional CSS class or classes applied to the overlay panel.
   *
   * 应用于浮层面板的一个或多个可选 CSS 类。
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
   * Optional CSS class or classes applied to the overlay backdrop.
   *
   * 应用于浮层背景的可选 CSS 类。
   *
   */
  backdropClass?: string | string[] = '';

  /**
   * Whether the dialog closes with the escape key or pointer events outside the panel element.
   *
   * 对话框是否在面板元素外部使用 escape 键或指针事件关闭。
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
  maxWidth?: number | string;

  /**
   * Max-height of the dialog. If a number is provided, assumes pixel units.
   *
   * 对话框的最大高度。如果提供了数字，则假设单位是像素。
   *
   */
  maxHeight?: number | string;

  /**
   * Strategy to use when positioning the dialog. Defaults to centering it on the page.
   *
   * 定位对话框时使用的策略。默认在页面上居中。
   *
   */
  positionStrategy?: PositionStrategy;

  /**
   * Data being injected into the child component.
   *
   * 注入到子组件中的数据。
   *
   */
  data?: D | null = null;

  /**
   * Layout direction for the dialog's content.
   *
   * 对话框内容的布局方向。
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
   * Dialog label applied via `aria-label`
   *
   * 通过 `aria-label` 应用的对话框标签
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
   * 从 autoFocus 中删除布尔选项。请改用字符串或 AutoFocusTarget。
   *
   */
  autoFocus?: AutoFocusTarget | string | boolean = 'first-tabbable';

  /**
   * Whether the dialog should restore focus to the previously-focused element upon closing.
   * Has the following behavior based on the type that is passed in:
   *
   * 对话框是否应在关闭时将焦点恢复到先前聚焦的元素。根据传入的类型具有以下行为：
   *
   * - `boolean` - when true, will return focus to the element that was focused before the dialog
   *    was opened, otherwise won't restore focus at all.
   *
   *   `boolean` - 当为 true 时，将焦点返回到在打开对话框之前持有焦点的元素，否则根本不会恢复焦点。
   *
   * - `string` - focus will be restored to the first element that matches the CSS selector.
   *
   *   `string` - 焦点将恢复到与此 CSS 选择器匹配的第一个元素。
   *
   * - `HTMLElement` - focus will be restored to the specific element.
   *
   *   `HTMLElement` - 焦点将恢复到特定元素。
   *
   */
  restoreFocus?: boolean | string | HTMLElement = true;

  /**
   * Scroll strategy to be used for the dialog. This determines how
   * the dialog responds to scrolling underneath the panel element.
   *
   * 用于对话框的滚动策略。这决定了对话框如何响应面板元素下方的滚动。
   *
   */
  scrollStrategy?: ScrollStrategy;

  /**
   * Whether the dialog should close when the user navigates backwards or forwards through browser
   * history. This does not apply to navigation via anchor element unless using URL-hash based
   * routing \(`HashLocationStrategy` in the Angular router\).
   *
   * 当用户在浏览器历史中向后或向前导航时，对话框是否应该关闭。这不适用于通过链接（ `a` 元素）导航，除非使用基于 URL 哈希的路由（Angular 路由器中的 `HashLocationStrategy` ）。
   *
   */
  closeOnNavigation?: boolean = true;

  /**
   * Whether the dialog should close when the dialog service is destroyed. This is useful if
   * another service is wrapping the dialog and is managing the destruction instead.
   *
   * 当对话服务被销毁时对话是否应该关闭。如果另一个服务正在包装对话框并管理销毁，这很有用。
   *
   */
  closeOnDestroy?: boolean = true;

  /**
   * Whether the dialog should close when the underlying overlay is detached. This is useful if
   * another service is wrapping the dialog and is managing the destruction instead. E.g. an
   * external detachment can happen as a result of a scroll strategy triggering it or when the
   * browser location changes.
   *
   * 当已解除底层浮层的附着时，对话框是否应该关闭。如果另一个服务包裹着本对话框并负责销毁，那么这将非常有用。例如，当触发了滚动策略或浏览器位置发生了变化时，就可能导致由于外部因素而解除附着。
   *
   */
  closeOnOverlayDetachments?: boolean = true;

  /**
   * Alternate `ComponentFactoryResolver` to use when resolving the associated component.
   *
   * 备用 `ComponentFactoryResolver`，用于解析其关联组件。
   *
   */
  componentFactoryResolver?: ComponentFactoryResolver;

  /**
   * Providers that will be exposed to the contents of the dialog. Can also
   * be provided as a function in order to generate the providers lazily.
   *
   * 将暴露给对话框内容的提供者。也可以作为函数提供，以便惰性生成提供者。
   *
   */
  providers?:
    | StaticProvider[]
    | ((dialogRef: R, config: DialogConfig<D, R, C>, container: C) => StaticProvider[]);

  /**
   * Component into which the dialog content will be rendered. Defaults to `CdkDialogContainer`.
   * A configuration object can be passed in to customize the providers that will be exposed
   * to the dialog container.
   *
   * 将渲染对话框内容的组件。默认为 `CdkDialogContainer`。可以传入配置对象以自定义将公开给对话框容器的提供者。
   *
   */
  container?:
    | Type<C>
    | {
        type: Type<C>;
        providers: (config: DialogConfig<D, R, C>) => StaticProvider[];
      };

  /**
   * Context that will be passed to template-based dialogs.
   * A function can be passed in to resolve the context lazily.
   *
   * 将传递给基于模板的对话框的上下文。可以传入一个函数来惰性解析此上下文。
   *
   */
  templateContext?: Record<string, any> | (() => Record<string, any>);
}
