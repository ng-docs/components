/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {LiveAnnouncer} from '@angular/cdk/a11y';
import {BreakpointObserver, Breakpoints} from '@angular/cdk/layout';
import {Overlay, OverlayConfig, OverlayRef} from '@angular/cdk/overlay';
import {ComponentPortal, ComponentType, TemplatePortal} from '@angular/cdk/portal';
import {
  ComponentRef,
  EmbeddedViewRef,
  Inject,
  Injectable,
  InjectionToken,
  Injector,
  Optional,
  SkipSelf,
  TemplateRef,
  OnDestroy, Type,
} from '@angular/core';
import {takeUntil} from 'rxjs/operators';
import {TextOnlySnackBar, SimpleSnackBar} from './simple-snack-bar';
import {MAT_SNACK_BAR_DATA, MatSnackBarConfig} from './snack-bar-config';
import {MatSnackBarContainer, _SnackBarContainer} from './snack-bar-container';
import {MatSnackBarModule} from './snack-bar-module';
import {MatSnackBarRef} from './snack-bar-ref';

/**
 * Injection token that can be used to specify default snack bar.
 *
 * 这个注入令牌可以用来指定快餐栏的默认配置。
 *
 */
export const MAT_SNACK_BAR_DEFAULT_OPTIONS =
    new InjectionToken<MatSnackBarConfig>('mat-snack-bar-default-options', {
      providedIn: 'root',
      factory: MAT_SNACK_BAR_DEFAULT_OPTIONS_FACTORY,
    });

/** @docs-private */
export function MAT_SNACK_BAR_DEFAULT_OPTIONS_FACTORY(): MatSnackBarConfig {
  return new MatSnackBarConfig();
}

/**
 * Service to dispatch Material Design snack bar messages.
 *
 * 一个服务，用来派发 Material Design 快餐栏的消息。
 *
 */
@Injectable({providedIn: MatSnackBarModule})
export class MatSnackBar implements OnDestroy {
  /**
   * Reference to the current snack bar in the view *at this level* (in the Angular injector tree).
   * If there is a parent snack-bar service, all operations should delegate to that parent
   * via `_openedSnackBarRef`.
   *
   * 在 Angular 注入器树的*本级*视图中引用当前的快餐栏。如果有一个父快餐栏服务，那么所有的操作都应该通过 `_openedSnackBarRef` 委托给那个父组件。
   *
   */
  private _snackBarRefAtThisLevel: MatSnackBarRef<any> | null = null;

  /**
   * The component that should be rendered as the snack bar's simple component.
   *
   * 该组件应该被渲染成快餐栏的简单组件。
   *
   */
  protected simpleSnackBarComponent: Type<TextOnlySnackBar> = SimpleSnackBar;

  /**
   * The container component that attaches the provided template or component.
   *
   * 附着在所提供的模板或组件上的容器组件。
   *
   */
  protected snackBarContainerComponent: Type<_SnackBarContainer> = MatSnackBarContainer;

  /**
   * The CSS class to applie for handset mode.
   *
   * 适用于手机模式的 CSS 类。
   *
   */
  protected handsetCssClass = 'mat-snack-bar-handset';

  /**
   * Reference to the currently opened snackbar at *any* level.
   *
   * 对目前*在任何*级别的已打开快餐栏的引用。
   *
   */
  get _openedSnackBarRef(): MatSnackBarRef<any> | null {
    const parent = this._parentSnackBar;
    return parent ? parent._openedSnackBarRef : this._snackBarRefAtThisLevel;
  }

  set _openedSnackBarRef(value: MatSnackBarRef<any> | null) {
    if (this._parentSnackBar) {
      this._parentSnackBar._openedSnackBarRef = value;
    } else {
      this._snackBarRefAtThisLevel = value;
    }
  }

  constructor(
      private _overlay: Overlay,
      private _live: LiveAnnouncer,
      private _injector: Injector,
      private _breakpointObserver: BreakpointObserver,
      @Optional() @SkipSelf() private _parentSnackBar: MatSnackBar,
      @Inject(MAT_SNACK_BAR_DEFAULT_OPTIONS) private _defaultConfig: MatSnackBarConfig) {}

  /**
   * Creates and dispatches a snack bar with a custom component for the content, removing any
   * currently opened snack bars.
   *
   * 为内容创建并派发带有自定义组件的快餐栏，删除任何目前打开着的快餐栏。
   *
   * @param component Component to be instantiated.
   *
   * 要实例化的组件。
   *
   * @param config Extra configuration for the snack bar.
   *
   * 快餐栏的额外配置。
   *
   */
  openFromComponent<T>(component: ComponentType<T>, config?: MatSnackBarConfig):
      MatSnackBarRef<T> {
    return this._attach(component, config) as MatSnackBarRef<T>;
  }

  /**
   * Creates and dispatches a snack bar with a custom template for the content, removing any
   * currently opened snack bars.
   *
   * 使用该内容的自定义模板创建并派发一个快餐栏，删除任何目前打开着的快餐栏。
   *
   * @param template Template to be instantiated.
   *
   * 要实例化的模板
   *
   * @param config Extra configuration for the snack bar.
   *
   * 快餐栏的额外配置。
   *
   */
  openFromTemplate(template: TemplateRef<any>, config?: MatSnackBarConfig):
      MatSnackBarRef<EmbeddedViewRef<any>> {
    return this._attach(template, config);
  }

  /**
   * Opens a snackbar with a message and an optional action.
   *
   * 带有信息和可选操作的快餐栏。
   *
   * @param message The message to show in the snackbar.
   *
   * 要显示在快餐栏里的消息。
   *
   * @param action The label for the snackbar action.
   *
   * 快餐栏的动作标签。
   *
   * @param config Additional configuration options for the snackbar.
   *
   * 快餐栏的其它配置选项。
   *
   */
  open(message: string, action: string = '', config?: MatSnackBarConfig):
      MatSnackBarRef<TextOnlySnackBar> {
    const _config = {...this._defaultConfig, ...config};

    // Since the user doesn't have access to the component, we can
    // override the data to pass in our own message and action.
    _config.data = {message, action};

    // Since the snack bar has `role="alert"`, we don't
    // want to announce the same message twice.
    if (_config.announcementMessage === message) {
      _config.announcementMessage = undefined;
    }

    return this.openFromComponent(this.simpleSnackBarComponent, _config);
  }

  /**
   * Dismisses the currently-visible snack bar.
   *
   * 关闭目前可见的快餐栏。
   *
   */
  dismiss(): void {
    if (this._openedSnackBarRef) {
      this._openedSnackBarRef.dismiss();
    }
  }

  ngOnDestroy() {
    // Only dismiss the snack bar at the current level on destroy.
    if (this._snackBarRefAtThisLevel) {
      this._snackBarRefAtThisLevel.dismiss();
    }
  }

  /**
   * Attaches the snack bar container component to the overlay.
   *
   * 将快餐栏的容器组件附着到浮层上。
   *
   */
  private _attachSnackBarContainer(overlayRef: OverlayRef,
                                     config: MatSnackBarConfig): _SnackBarContainer {

    const userInjector = config && config.viewContainerRef && config.viewContainerRef.injector;
    const injector = Injector.create({
      parent: userInjector || this._injector,
      providers: [{provide: MatSnackBarConfig, useValue: config}]
    });

    const containerPortal =
        new ComponentPortal(this.snackBarContainerComponent, config.viewContainerRef, injector);
    const containerRef: ComponentRef<_SnackBarContainer> =
        overlayRef.attach(containerPortal);
    containerRef.instance.snackBarConfig = config;
    return containerRef.instance;
  }

  /**
   * Places a new component or a template as the content of the snack bar container.
   *
   * 把一个新组件或模板放进快餐栏的容器里面。
   *
   */
  private _attach<T>(content: ComponentType<T> | TemplateRef<T>, userConfig?: MatSnackBarConfig):
      MatSnackBarRef<T | EmbeddedViewRef<any>> {

    const config = {...new MatSnackBarConfig(), ...this._defaultConfig, ...userConfig};
    const overlayRef = this._createOverlay(config);
    const container = this._attachSnackBarContainer(overlayRef, config);
    const snackBarRef = new MatSnackBarRef<T | EmbeddedViewRef<any>>(container, overlayRef);

    if (content instanceof TemplateRef) {
      const portal = new TemplatePortal(content, null!, {
        $implicit: config.data,
        snackBarRef
      } as any);

      snackBarRef.instance = container.attachTemplatePortal(portal);
    } else {
      const injector = this._createInjector(config, snackBarRef);
      const portal = new ComponentPortal(content, undefined, injector);
      const contentRef = container.attachComponentPortal<T>(portal);

      // We can't pass this via the injector, because the injector is created earlier.
      snackBarRef.instance = contentRef.instance;
    }

    // Subscribe to the breakpoint observer and attach the mat-snack-bar-handset class as
    // appropriate. This class is applied to the overlay element because the overlay must expand to
    // fill the width of the screen for full width snackbars.
    this._breakpointObserver.observe(Breakpoints.HandsetPortrait).pipe(
        takeUntil(overlayRef.detachments())
    ).subscribe(state => {
      const classList = overlayRef.overlayElement.classList;
      state.matches ? classList.add(this.handsetCssClass) : classList.remove(this.handsetCssClass);
    });

    if (config.announcementMessage) {
      // Wait until the snack bar contents have been announced then deliver this message.
      container._onAnnounce.subscribe(() => {
        this._live.announce(config.announcementMessage!, config.politeness);
      });
    }

    this._animateSnackBar(snackBarRef, config);
    this._openedSnackBarRef = snackBarRef;
    return this._openedSnackBarRef;
  }

  /**
   * Animates the old snack bar out and the new one in.
   *
   * 在旧的快餐栏和新的快餐栏之间播放动画。
   *
   */
  private _animateSnackBar(snackBarRef: MatSnackBarRef<any>, config: MatSnackBarConfig) {
    // When the snackbar is dismissed, clear the reference to it.
    snackBarRef.afterDismissed().subscribe(() => {
      // Clear the snackbar ref if it hasn't already been replaced by a newer snackbar.
      if (this._openedSnackBarRef == snackBarRef) {
        this._openedSnackBarRef = null;
      }

      if (config.announcementMessage) {
        this._live.clear();
      }
    });

    if (this._openedSnackBarRef) {
      // If a snack bar is already in view, dismiss it and enter the
      // new snack bar after exit animation is complete.
      this._openedSnackBarRef.afterDismissed().subscribe(() => {
        snackBarRef.containerInstance.enter();
      });
      this._openedSnackBarRef.dismiss();
    } else {
      // If no snack bar is in view, enter the new snack bar.
      snackBarRef.containerInstance.enter();
    }

    // If a dismiss timeout is provided, set up dismiss based on after the snackbar is opened.
    if (config.duration && config.duration > 0) {
      snackBarRef.afterOpened().subscribe(() => snackBarRef._dismissAfter(config.duration!));
    }
  }

  /**
   * Creates a new overlay and places it in the correct location.
   *
   * 创建一个新的浮层，并把它放在正确的位置。
   *
   * @param config The user-specified snack bar config.
   *
   * 用户指定的快餐栏配置。
   *
   */
  private _createOverlay(config: MatSnackBarConfig): OverlayRef {
    const overlayConfig = new OverlayConfig();
    overlayConfig.direction = config.direction;

    let positionStrategy = this._overlay.position().global();
    // Set horizontal position.
    const isRtl = config.direction === 'rtl';
    const isLeft = (
        config.horizontalPosition === 'left' ||
        (config.horizontalPosition === 'start' && !isRtl) ||
        (config.horizontalPosition === 'end' && isRtl));
    const isRight = !isLeft && config.horizontalPosition !== 'center';
    if (isLeft) {
      positionStrategy.left('0');
    } else if (isRight) {
      positionStrategy.right('0');
    } else {
      positionStrategy.centerHorizontally();
    }
    // Set horizontal position.
    if (config.verticalPosition === 'top') {
      positionStrategy.top('0');
    } else {
      positionStrategy.bottom('0');
    }

    overlayConfig.positionStrategy = positionStrategy;
    return this._overlay.create(overlayConfig);
  }

  /**
   * Creates an injector to be used inside of a snack bar component.
   *
   * 创建一个在快餐栏组件里面使用的注入器。
   *
   * @param config Config that was used to create the snack bar.
   *
   * 用于创建快餐栏的配置。
   *
   * @param snackBarRef Reference to the snack bar.
   *
   * 到快餐栏的引用。
   *
   */
  private _createInjector<T>(config: MatSnackBarConfig, snackBarRef: MatSnackBarRef<T>): Injector {
    const userInjector = config && config.viewContainerRef && config.viewContainerRef.injector;

    return Injector.create({
      parent: userInjector || this._injector,
      providers: [
        {provide: MatSnackBarRef, useValue: snackBarRef},
        {provide: MAT_SNACK_BAR_DATA, useValue: config.data}
      ]
    });
  }
}
