/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  ApplicationRef,
  ComponentFactoryResolver,
  ComponentRef,
  EmbeddedViewRef,
  Injector,
} from '@angular/core';
import {BasePortalOutlet, ComponentPortal, DomPortal, TemplatePortal} from './portal';

/**
 * A PortalOutlet for attaching portals to an arbitrary DOM element outside of the Angular
 * application context.
 *
 * PortalOutlet，用于把传送点附着到 Angular 应用上下文之外的任意一个 DOM 元素上。
 *
 */
export class DomPortalOutlet extends BasePortalOutlet {
  private _document: Document;

  /**
   * @param outletElement Element into which the content is projected.
   *
   * 此内容要投影进的元素。
   *
   * @param _componentFactoryResolver Used to resolve the component factory.
   *   Only required when attaching component portals.
   *
   * 用于解析组件工厂。仅在附着组件传送点时才需要。
   *
   * @param _appRef Reference to the application. Only used in component portals when there
   *   is no `ViewContainerRef` available.
   *
   * 应用程序的引用。仅在没有可用的 `ViewContainerRef` 时在组件传送点中使用。
   *
   * @param _defaultInjector Injector to use as a fallback when the portal being attached doesn't
   *   have one. Only used for component portals.
   *
   * 当所附着的传送点没有注入器时，要用到的后备注入器。仅用于组件传送点。
   *
   * @param _document Reference to the document. Used when attaching a DOM portal. Will eventually
   *   become a required parameter.
   *
   * 对 document 的引用。在附着 DOM 传送点时使用。最终将成为必要参数。
   *
   */
  constructor(
    /**
     * Element into which the content is projected.
     *
     * 此内容要投影进的元素。
     *
     */
    public outletElement: Element,
    private _componentFactoryResolver?: ComponentFactoryResolver,
    private _appRef?: ApplicationRef,
    private _defaultInjector?: Injector,

    /**
     * @deprecated `_document` Parameter to be made required.
     * @breaking-change 10.0.0
     */
    _document?: any,
  ) {
    super();
    this._document = _document;
  }

  /**
   * Attach the given ComponentPortal to DOM element using the ComponentFactoryResolver.
   *
   * 使用 ComponentFactoryResolver 把指定的 ComponentPortal 添加到 DOM 元素中。
   *
   * @param portal Portal to be attached
   *
   * 要附着到的传送点
   *
   * @returns Reference to the created component.
   *
   * 所创建的组件的引用。
   *
   */
  attachComponentPortal<T>(portal: ComponentPortal<T>): ComponentRef<T> {
    const resolver = (portal.componentFactoryResolver || this._componentFactoryResolver)!;

    if ((typeof ngDevMode === 'undefined' || ngDevMode) && !resolver) {
      throw Error('Cannot attach component portal to outlet without a ComponentFactoryResolver.');
    }

    const componentFactory = resolver.resolveComponentFactory(portal.component);
    let componentRef: ComponentRef<T>;

    // If the portal specifies a ViewContainerRef, we will use that as the attachment point
    // for the component (in terms of Angular's component tree, not rendering).
    // When the ViewContainerRef is missing, we use the factory to create the component directly
    // and then manually attach the view to the application.
    if (portal.viewContainerRef) {
      componentRef = portal.viewContainerRef.createComponent(
        componentFactory,
        portal.viewContainerRef.length,
        portal.injector || portal.viewContainerRef.injector,
        portal.projectableNodes || undefined,
      );

      this.setDisposeFn(() => componentRef.destroy());
    } else {
      if ((typeof ngDevMode === 'undefined' || ngDevMode) && !this._appRef) {
        throw Error('Cannot attach component portal to outlet without an ApplicationRef.');
      }

      componentRef = componentFactory.create(
        portal.injector || this._defaultInjector || Injector.NULL,
      );
      this._appRef!.attachView(componentRef.hostView);
      this.setDisposeFn(() => {
        // Verify that the ApplicationRef has registered views before trying to detach a host view.
        // This check also protects the `detachView` from being called on a destroyed ApplicationRef.
        if (this._appRef!.viewCount > 0) {
          this._appRef!.detachView(componentRef.hostView);
        }
        componentRef.destroy();
      });
    }
    // At this point the component has been instantiated, so we move it to the location in the DOM
    // where we want it to be rendered.
    this.outletElement.appendChild(this._getComponentRootNode(componentRef));
    this._attachedPortal = portal;

    return componentRef;
  }

  /**
   * Attaches a template portal to the DOM as an embedded view.
   *
   * 把一个模板传送点作为嵌入式视图附着到 DOM 上。
   *
   * @param portal Portal to be attached.
   *
   * 要附着到的传送点。
   *
   * @returns Reference to the created embedded view.
   *
   * 所创建的嵌入式视图的引用。
   *
   */
  attachTemplatePortal<C>(portal: TemplatePortal<C>): EmbeddedViewRef<C> {
    let viewContainer = portal.viewContainerRef;
    let viewRef = viewContainer.createEmbeddedView(portal.templateRef, portal.context, {
      injector: portal.injector,
    });

    // The method `createEmbeddedView` will add the view as a child of the viewContainer.
    // But for the DomPortalOutlet the view can be added everywhere in the DOM
    // (e.g Overlay Container) To move the view to the specified host element. We just
    // re-append the existing root nodes.
    viewRef.rootNodes.forEach(rootNode => this.outletElement.appendChild(rootNode));

    // Note that we want to detect changes after the nodes have been moved so that
    // any directives inside the portal that are looking at the DOM inside a lifecycle
    // hook won't be invoked too early.
    viewRef.detectChanges();

    this.setDisposeFn(() => {
      let index = viewContainer.indexOf(viewRef);
      if (index !== -1) {
        viewContainer.remove(index);
      }
    });

    this._attachedPortal = portal;

    // TODO(jelbourn): Return locals from view.
    return viewRef;
  }

  /**
   * Attaches a DOM portal by transferring its content into the outlet.
   *
   * 通过把其内容传入指定的地标来附着到 DOM 传送点。
   *
   * @param portal Portal to be attached.
   *
   * 要附着到的传送点。
   *
   * @deprecated To be turned into a method.
   *
   * 要改成方法。
   *
   * @breaking-change 10.0.0
   *
   */
  override attachDomPortal = (portal: DomPortal) => {
    // @breaking-change 10.0.0 Remove check and error once the
    // `_document` constructor parameter is required.
    if (!this._document && (typeof ngDevMode === 'undefined' || ngDevMode)) {
      throw Error('Cannot attach DOM portal without _document constructor parameter');
    }

    const element = portal.element;
    if (!element.parentNode && (typeof ngDevMode === 'undefined' || ngDevMode)) {
      throw Error('DOM portal content must be attached to a parent node.');
    }

    // Anchor used to save the element's previous position so
    // that we can restore it when the portal is detached.
    const anchorNode = this._document.createComment('dom-portal');

    element.parentNode!.insertBefore(anchorNode, element);
    this.outletElement.appendChild(element);
    this._attachedPortal = portal;

    super.setDisposeFn(() => {
      // We can't use `replaceWith` here because IE doesn't support it.
      if (anchorNode.parentNode) {
        anchorNode.parentNode.replaceChild(element, anchorNode);
      }
    });
  };

  /**
   * Clears out a portal from the DOM.
   *
   * 从 DOM 中清除一个传送点。
   *
   */
  override dispose(): void {
    super.dispose();
    this.outletElement.remove();
  }

  /**
   * Gets the root HTMLElement for an instantiated component.
   *
   * 获取实例化组件的根 HTMLElement。
   *
   */
  private _getComponentRootNode(componentRef: ComponentRef<any>): HTMLElement {
    return (componentRef.hostView as EmbeddedViewRef<any>).rootNodes[0] as HTMLElement;
  }
}

/**
 *
 * @deprecated Use `DomPortalOutlet` instead.
 *
 * 请改用 `DomPortalOutlet`。
 *
 * @breaking-change 9.0.0
 *
 */
export class DomPortalHost extends DomPortalOutlet {}
