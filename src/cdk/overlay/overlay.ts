/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Directionality} from '@angular/cdk/bidi';
import {DomPortalOutlet} from '@angular/cdk/portal';
import {DOCUMENT, Location} from '@angular/common';
import {
  ApplicationRef,
  ComponentFactoryResolver,
  Inject,
  Injectable,
  Injector,
  NgZone,
  ANIMATION_MODULE_TYPE,
  Optional,
} from '@angular/core';
import {OverlayKeyboardDispatcher} from './dispatchers/overlay-keyboard-dispatcher';
import {OverlayOutsideClickDispatcher} from './dispatchers/overlay-outside-click-dispatcher';
import {OverlayConfig} from './overlay-config';
import {OverlayContainer} from './overlay-container';
import {OverlayRef} from './overlay-ref';
import {OverlayPositionBuilder} from './position/overlay-position-builder';
import {ScrollStrategyOptions} from './scroll/index';

/**
 * Next overlay unique ID.
 *
 * 下一个浮层的唯一 ID。
 *
 */
let nextUniqueId = 0;

// Note that Overlay is *not* scoped to the app root because of the ComponentFactoryResolver
// which needs to be different depending on where OverlayModule is imported.

/**
 * Service to create Overlays. Overlays are dynamically added pieces of floating UI, meant to be
 * used as a low-level building block for other components. Dialogs, tooltips, menus,
 * selects, etc. can all be built using overlays. The service should primarily be used by authors
 * of re-usable components rather than developers building end-user applications.
 *
 * 用来创建浮层的服务。浮层是指动态添加的一些浮动用户界面，用来作为其它组件的底层构建块。像对话框、工具提示、菜单、选择器等等都可以用浮层来构建。该服务主要应该由可复用组件的作者使用，而不是供开发者构建最终用户应用。
 *
 * An overlay *is* a PortalOutlet, so any kind of Portal can be loaded into one.
 *
 * 浮层*是*一个 PortalOutlet，任何类型的传送点都可以加载到其中。
 *
 */
@Injectable({providedIn: 'root'})
export class Overlay {
  private _appRef: ApplicationRef;

  constructor(
    /**
     * Scrolling strategies that can be used when creating an overlay.
     *
     * 创建浮层时要用到的滚动策略。
     *
     */
    public scrollStrategies: ScrollStrategyOptions,
    private _overlayContainer: OverlayContainer,
    private _componentFactoryResolver: ComponentFactoryResolver,
    private _positionBuilder: OverlayPositionBuilder,
    private _keyboardDispatcher: OverlayKeyboardDispatcher,
    private _injector: Injector,
    private _ngZone: NgZone,
    @Inject(DOCUMENT) private _document: any,
    private _directionality: Directionality,
    private _location: Location,
    private _outsideClickDispatcher: OverlayOutsideClickDispatcher,
    @Inject(ANIMATION_MODULE_TYPE) @Optional() private _animationsModuleType?: string,
  ) {}

  /**
   * Creates an overlay.
   *
   * 创建一个浮层。
   *
   * @param config Configuration applied to the overlay.
   *
   * 应用于浮层的配置。
   *
   * @returns Reference to the created overlay.
   *
   * 所创建浮层的引用。
   *
   */
  create(config?: OverlayConfig): OverlayRef {
    const host = this._createHostElement();
    const pane = this._createPaneElement(host);
    const portalOutlet = this._createPortalOutlet(pane);
    const overlayConfig = new OverlayConfig(config);

    overlayConfig.direction = overlayConfig.direction || this._directionality.value;

    return new OverlayRef(
      portalOutlet,
      host,
      pane,
      overlayConfig,
      this._ngZone,
      this._keyboardDispatcher,
      this._document,
      this._location,
      this._outsideClickDispatcher,
      this._animationsModuleType === 'NoopAnimations',
    );
  }

  /**
   * Gets a position builder that can be used, via fluent API,
   * to construct and configure a position strategy.
   *
   * 获取一个位置构建器，可以通过流式 API 来构建和配置定位策略。
   *
   * @returns An overlay position builder.
   *
   * 浮层位置构建器。
   *
   */
  position(): OverlayPositionBuilder {
    return this._positionBuilder;
  }

  /**
   * Creates the DOM element for an overlay and appends it to the overlay container.
   *
   * 为浮层创建一个 DOM 元素，并把它追加到浮层容器中。
   *
   * @returns Newly-created pane element
   *
   * 新创建的面板元素
   *
   */
  private _createPaneElement(host: HTMLElement): HTMLElement {
    const pane = this._document.createElement('div');

    pane.id = `cdk-overlay-${nextUniqueId++}`;
    pane.classList.add('cdk-overlay-pane');
    host.appendChild(pane);

    return pane;
  }

  /**
   * Creates the host element that wraps around an overlay
   * and can be used for advanced positioning.
   *
   * 用于封装浮层的宿主元素，可用于高级定位。
   *
   * @returns Newly-create host element.
   *
   * 新建的宿主元素。
   *
   */
  private _createHostElement(): HTMLElement {
    const host = this._document.createElement('div');
    this._overlayContainer.getContainerElement().appendChild(host);
    return host;
  }

  /**
   * Create a DomPortalOutlet into which the overlay content can be loaded.
   *
   * 创建一个可以加载浮层内容的 DomPortalOutlet。
   *
   * @param pane The DOM element to turn into a portal outlet.
   *
   * 要转成传送点地标的 DOM 元素。
   *
   * @returns A portal outlet for the given DOM element.
   *
   * 供指定 DOM 元素使用的传送点地标。
   *
   */
  private _createPortalOutlet(pane: HTMLElement): DomPortalOutlet {
    // We have to resolve the ApplicationRef later in order to allow people
    // to use overlay-based providers during app initialization.
    if (!this._appRef) {
      this._appRef = this._injector.get<ApplicationRef>(ApplicationRef);
    }

    return new DomPortalOutlet(
      pane,
      this._componentFactoryResolver,
      this._appRef,
      this._injector,
      this._document,
    );
  }
}
