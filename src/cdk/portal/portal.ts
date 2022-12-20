/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  TemplateRef,
  ViewContainerRef,
  ElementRef,
  ComponentRef,
  EmbeddedViewRef,
  Injector,
  ComponentFactoryResolver,
} from '@angular/core';
import {
  throwNullPortalOutletError,
  throwPortalAlreadyAttachedError,
  throwNoPortalAttachedError,
  throwNullPortalError,
  throwPortalOutletAlreadyDisposedError,
  throwUnknownPortalTypeError,
} from './portal-errors';

/**
 * Interface that can be used to generically type a class.
 *
 * 可以用来对类进行泛型化的接口。
 *
 */
export interface ComponentType<T> {
  new (...args: any[]): T;
}

/**
 * A `Portal` is something that you want to render somewhere else.
 * It can be attach to / detached from a `PortalOutlet`.
 *
 * 你希望在其它地方渲染的 `Portal`。它可以附着到 `PortalOutlet` 或从那里拆除。
 *
 */
export abstract class Portal<T> {
  private _attachedHost: PortalOutlet | null;

  /**
   * Attach this portal to a host.
   *
   * 把这个传送点附着到宿主上。
   *
   */
  attach(host: PortalOutlet): T {
    if (typeof ngDevMode === 'undefined' || ngDevMode) {
      if (host == null) {
        throwNullPortalOutletError();
      }

      if (host.hasAttached()) {
        throwPortalAlreadyAttachedError();
      }
    }

    this._attachedHost = host;
    return <T>host.attach(this);
  }

  /**
   * Detach this portal from its host
   *
   * 从宿主那里删除这个传送点
   *
   */
  detach(): void {
    let host = this._attachedHost;

    if (host != null) {
      this._attachedHost = null;
      host.detach();
    } else if (typeof ngDevMode === 'undefined' || ngDevMode) {
      throwNoPortalAttachedError();
    }
  }

  /**
   * Whether this portal is attached to a host.
   *
   * 此传送点是否已附着到宿主上。
   *
   */
  get isAttached(): boolean {
    return this._attachedHost != null;
  }

  /**
   * Sets the PortalOutlet reference without performing `attach()`. This is used directly by
   * the PortalOutlet when it is performing an `attach()` or `detach()`.
   *
   * 在不执行 `attach()` 的情况下设置 PortalOutlet 的引用。当 PortalOutlet 要执行 `attach()` 或 `detach()` 时会直接使用它。
   *
   */
  setAttachedHost(host: PortalOutlet | null) {
    this._attachedHost = host;
  }
}

/**
 * A `ComponentPortal` is a portal that instantiates some Component upon attachment.
 *
 * `ComponentPortal` 是一个传送点，它会把某些组件实例化并作为自己的附件。
 *
 */
export class ComponentPortal<T> extends Portal<ComponentRef<T>> {
  /**
   * The type of the component that will be instantiated for attachment.
   *
   * 要作为附件实例化的组件类型。
   *
   */
  component: ComponentType<T>;

  /**
   * Where the attached component should live in Angular's *logical* component tree.
   * This is different from where the component *renders*, which is determined by the PortalOutlet.
   * The origin is necessary when the host is outside of the Angular application context.
   *
   * [可选] 附着组件应该放在 Angular 的*逻辑*组件树中。这与组件*渲染的*位置不同，后者由 PortalOutlet 决定。当宿主在 Angular 应用的上下文之外时，这个原点是必需的。
   *
   */
  viewContainerRef?: ViewContainerRef | null;

  /**
   * Injector used for the instantiation of the component.
   *
   * 供组件实例化时使用的注入器。
   *
   */
  injector?: Injector | null;

  /**
   * Alternate `ComponentFactoryResolver` to use when resolving the associated component.
   * Defaults to using the resolver from the outlet that the portal is attached to.
   *
   * 在解析相关组件时要用到的 `ComponentFactoryResolver` 替代品。默认使用来自传送点所附着的出口地标的解析器。
   *
   */
  componentFactoryResolver?: ComponentFactoryResolver | null;

  /**
   * List of DOM nodes that should be projected through `<ng-content>` of the attached component.
   *
   * 要通过所附着组件的 `<ng-content>` 投影进去的 DOM 节点列表。
   *
   */
  projectableNodes?: Node[][] | null;

  constructor(
    component: ComponentType<T>,
    viewContainerRef?: ViewContainerRef | null,
    injector?: Injector | null,
    componentFactoryResolver?: ComponentFactoryResolver | null,
    projectableNodes?: Node[][] | null,
  ) {
    super();
    this.component = component;
    this.viewContainerRef = viewContainerRef;
    this.injector = injector;
    this.componentFactoryResolver = componentFactoryResolver;
    this.projectableNodes = projectableNodes;
  }
}

/**
 * A `TemplatePortal` is a portal that represents some embedded template (TemplateRef).
 *
 * `TemplatePortal` 是一个代表嵌入式模板（TemplateRef）的传送点。
 *
 */
export class TemplatePortal<C = any> extends Portal<EmbeddedViewRef<C>> {
  constructor(
    /**
     * The embedded template that will be used to instantiate an embedded View in the host.
     *
     * 嵌入式模板，用于在宿主中实例化一个嵌入式视图。
     *
     */
    public templateRef: TemplateRef<C>,
    /**
     * Reference to the ViewContainer into which the template will be stamped out.
     *
     * 要容纳模板生成物的 ViewContainer 的引用。
     *
     */
    public viewContainerRef: ViewContainerRef,
    /**
     * Contextual data to be passed in to the embedded view.
     *
     * 要传入内嵌式视图中的上下文数据。
     *
     */
    public context?: C,
    /** The injector to use for the embedded view. */
    public injector?: Injector,
  ) {
    super();
  }

  get origin(): ElementRef {
    return this.templateRef.elementRef;
  }

  /**
   * Attach the portal to the provided `PortalOutlet`.
   * When a context is provided it will override the `context` property of the `TemplatePortal`
   * instance.
   *
   * 把此传送点添加到所提供的 `PortalOutlet` 中。当提供了上下文时，它会改写 `TemplatePortal` 实例 `context` 属性。
   *
   */
  override attach(host: PortalOutlet, context: C | undefined = this.context): EmbeddedViewRef<C> {
    this.context = context;
    return super.attach(host);
  }

  override detach(): void {
    this.context = undefined;
    return super.detach();
  }
}

/**
 * A `DomPortal` is a portal whose DOM element will be taken from its current position
 * in the DOM and moved into a portal outlet, when it is attached. On detach, the content
 * will be restored to its original position.
 *
 * `DomPortal` 是一个传送点，它的 DOM 元素会从 DOM 中的当前位置获取，并在附着到传送点时移入其中。在拆除时，内容将恢复到其原来的位置。
 *
 */
export class DomPortal<T = HTMLElement> extends Portal<T> {
  /**
   * DOM node hosting the portal's content.
   *
   * 传送点内容的宿主 DOM 节点。
   *
   */
  readonly element: T;

  constructor(element: T | ElementRef<T>) {
    super();
    this.element = element instanceof ElementRef ? element.nativeElement : element;
  }
}

/**
 * A `PortalOutlet` is an space that can contain a single `Portal`.
 *
 * `PortalOutlet` 是一个可以容纳单个 `Portal` 的空间。
 *
 */
export interface PortalOutlet {
  /**
   * Attaches a portal to this outlet.
   *
   * 把这个传送点连接到这个出口地标。
   *
   */
  attach(portal: Portal<any>): any;

  /**
   * Detaches the currently attached portal from this outlet.
   *
   * 从当前出口地标上拆除已经附着上的传送点。
   *
   */
  detach(): any;

  /**
   * Performs cleanup before the outlet is destroyed.
   *
   * 在销毁之前，先进行清理。
   *
   */
  dispose(): void;

  /**
   * Whether there is currently a portal attached to this outlet.
   *
   * 当前是否有一个连接到此出口地标的传送点。
   *
   */
  hasAttached(): boolean;
}

/**
 * @deprecated Use `PortalOutlet` instead.
 *
 * 请改用 `PortalOutlet`。
 *
 * @breaking-change 9.0.0
 *
 */
export type PortalHost = PortalOutlet;

/**
 * Partial implementation of PortalOutlet that handles attaching
 * ComponentPortal and TemplatePortal.
 *
 * PortalOutlet 的部分实现，用于处理附着的 ComponentPortal 和 TemplatePortal。
 *
 */
export abstract class BasePortalOutlet implements PortalOutlet {
  /**
   * The portal currently attached to the host.
   *
   * 这个传送点已经附着到了宿主上。
   *
   */
  protected _attachedPortal: Portal<any> | null;

  /**
   * A function that will permanently dispose this host.
   *
   * 永久销毁这个宿主的函数
   *
   */
  private _disposeFn: (() => void) | null;

  /**
   * Whether this host has already been permanently disposed.
   *
   * 该宿主是否已永久销毁。
   *
   */
  private _isDisposed: boolean = false;

  /**
   * Whether this host has an attached portal.
   *
   * 该宿主是否有附着的传送点。
   *
   */
  hasAttached(): boolean {
    return !!this._attachedPortal;
  }

  attach<T>(portal: ComponentPortal<T>): ComponentRef<T>;
  attach<T>(portal: TemplatePortal<T>): EmbeddedViewRef<T>;
  attach(portal: any): any;

  /**
   * Attaches a portal.
   *
   * 附着一个传送点。
   *
   */
  attach(portal: Portal<any>): any {
    if (typeof ngDevMode === 'undefined' || ngDevMode) {
      if (!portal) {
        throwNullPortalError();
      }

      if (this.hasAttached()) {
        throwPortalAlreadyAttachedError();
      }

      if (this._isDisposed) {
        throwPortalOutletAlreadyDisposedError();
      }
    }

    if (portal instanceof ComponentPortal) {
      this._attachedPortal = portal;
      return this.attachComponentPortal(portal);
    } else if (portal instanceof TemplatePortal) {
      this._attachedPortal = portal;
      return this.attachTemplatePortal(portal);
      // @breaking-change 10.0.0 remove null check for `this.attachDomPortal`.
    } else if (this.attachDomPortal && portal instanceof DomPortal) {
      this._attachedPortal = portal;
      return this.attachDomPortal(portal);
    }

    if (typeof ngDevMode === 'undefined' || ngDevMode) {
      throwUnknownPortalTypeError();
    }
  }

  abstract attachComponentPortal<T>(portal: ComponentPortal<T>): ComponentRef<T>;

  abstract attachTemplatePortal<C>(portal: TemplatePortal<C>): EmbeddedViewRef<C>;

  // @breaking-change 10.0.0 `attachDomPortal` to become a required abstract method.
  readonly attachDomPortal: null | ((portal: DomPortal) => any) = null;

  /**
   * Detaches a previously attached portal.
   *
   * 拆除以前附着过的传送点。
   *
   */
  detach(): void {
    if (this._attachedPortal) {
      this._attachedPortal.setAttachedHost(null);
      this._attachedPortal = null;
    }

    this._invokeDisposeFn();
  }

  /**
   * Permanently dispose of this portal host.
   *
   * 永久销毁这个 Portal 宿主。
   *
   */
  dispose(): void {
    if (this.hasAttached()) {
      this.detach();
    }

    this._invokeDisposeFn();
    this._isDisposed = true;
  }

  /** @docs-private */
  setDisposeFn(fn: () => void) {
    this._disposeFn = fn;
  }

  private _invokeDisposeFn() {
    if (this._disposeFn) {
      this._disposeFn();
      this._disposeFn = null;
    }
  }
}

/**
 * @deprecated Use `BasePortalOutlet` instead.
 *
 * 请改用 `BasePortalOutlet`。
 *
 * @breaking-change 9.0.0
 *
 */
export abstract class BasePortalHost extends BasePortalOutlet {}
