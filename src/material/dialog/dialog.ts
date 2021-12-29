/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Directionality} from '@angular/cdk/bidi';
import {
  Overlay,
  OverlayConfig,
  OverlayContainer,
  OverlayRef,
  ScrollStrategy,
} from '@angular/cdk/overlay';
import {ComponentPortal, ComponentType, TemplatePortal} from '@angular/cdk/portal';
import {Location} from '@angular/common';
import {
  Directive,
  Inject,
  Injectable,
  InjectFlags,
  InjectionToken,
  Injector,
  OnDestroy,
  Optional,
  SkipSelf,
  StaticProvider,
  TemplateRef,
  Type,
} from '@angular/core';
import {defer, Observable, of as observableOf, Subject, Subscription} from 'rxjs';
import {startWith} from 'rxjs/operators';
import {MatDialogConfig} from './dialog-config';
import {MatDialogContainer, _MatDialogContainerBase} from './dialog-container';
import {MatDialogRef} from './dialog-ref';
import {ANIMATION_MODULE_TYPE} from '@angular/platform-browser/animations';
/**
 * Injection token that can be used to access the data that was passed in to a dialog.
 *
 * 这个注入令牌可以用来访问那些传入对话框的数据。
 *
 */
export const MAT_DIALOG_DATA = new InjectionToken<any>('MatDialogData');

/**
 * Injection token that can be used to specify default dialog options.
 *
 * 这个注入令牌可以用来指定默认的对话框选项。
 *
 */
export const MAT_DIALOG_DEFAULT_OPTIONS = new InjectionToken<MatDialogConfig>(
  'mat-dialog-default-options',
);

/**
 * Injection token that determines the scroll handling while the dialog is open.
 *
 * 一个注入令牌，它在对话框打开时确定滚动的处理方式。
 *
 */
export const MAT_DIALOG_SCROLL_STRATEGY = new InjectionToken<() => ScrollStrategy>(
  'mat-dialog-scroll-strategy',
);

/** @docs-private */
export function MAT_DIALOG_SCROLL_STRATEGY_FACTORY(overlay: Overlay): () => ScrollStrategy {
  return () => overlay.scrollStrategies.block();
}

/** @docs-private */
export function MAT_DIALOG_SCROLL_STRATEGY_PROVIDER_FACTORY(
  overlay: Overlay,
): () => ScrollStrategy {
  return () => overlay.scrollStrategies.block();
}

/** @docs-private */
export const MAT_DIALOG_SCROLL_STRATEGY_PROVIDER = {
  provide: MAT_DIALOG_SCROLL_STRATEGY,
  deps: [Overlay],
  useFactory: MAT_DIALOG_SCROLL_STRATEGY_PROVIDER_FACTORY,
};

/**
 * Base class for dialog services. The base dialog service allows
 * for arbitrary dialog refs and dialog container components.
 *
 * 对话框服务的基类。基本对话框服务允许使用任意对话框参数和对话框容器组件。
 *
 */
@Directive()
export abstract class _MatDialogBase<C extends _MatDialogContainerBase> implements OnDestroy {
  private _openDialogsAtThisLevel: MatDialogRef<any>[] = [];
  private readonly _afterAllClosedAtThisLevel = new Subject<void>();
  private readonly _afterOpenedAtThisLevel = new Subject<MatDialogRef<any>>();
  private _ariaHiddenElements = new Map<Element, string | null>();
  private _scrollStrategy: () => ScrollStrategy;
  private _dialogAnimatingOpen = false;
  private _animationStateSubscriptions: Subscription;
  private _lastDialogRef: MatDialogRef<any>;

  /**
   * Keeps track of the currently-open dialogs.
   *
   * 跟踪当前打开的对话框。
   *
   */
  get openDialogs(): MatDialogRef<any>[] {
    return this._parentDialog ? this._parentDialog.openDialogs : this._openDialogsAtThisLevel;
  }

  /**
   * Stream that emits when a dialog has been opened.
   *
   * 当对话框打开后会发出通知的流。
   *
   */
  get afterOpened(): Subject<MatDialogRef<any>> {
    return this._parentDialog ? this._parentDialog.afterOpened : this._afterOpenedAtThisLevel;
  }

  _getAfterAllClosed(): Subject<void> {
    const parent = this._parentDialog;
    return parent ? parent._getAfterAllClosed() : this._afterAllClosedAtThisLevel;
  }

  // TODO (jelbourn): tighten the typing right-hand side of this expression.
  /**
   * Stream that emits when all open dialog have finished closing.
   * Will emit on subscribe if there are no open dialogs to begin with.
   *
   * 当所有打开的对话框都关闭的时候会发出通知的流。如果没有打开的对话框，就会在订阅时立即触发。
   *
   */
  readonly afterAllClosed: Observable<void> = defer(() =>
    this.openDialogs.length
      ? this._getAfterAllClosed()
      : this._getAfterAllClosed().pipe(startWith(undefined)),
  ) as Observable<any>;

  constructor(
    private _overlay: Overlay,
    private _injector: Injector,
    private _defaultOptions: MatDialogConfig | undefined,
    private _parentDialog: _MatDialogBase<C> | undefined,
    private _overlayContainer: OverlayContainer,
    scrollStrategy: any,
    private _dialogRefConstructor: Type<MatDialogRef<any>>,
    private _dialogContainerType: Type<C>,
    private _dialogDataToken: InjectionToken<any>,
    private _animationMode?: 'NoopAnimations' | 'BrowserAnimations',
  ) {
    this._scrollStrategy = scrollStrategy;
  }

  /**
   * Opens a modal dialog containing the given component.
   *
   * 打开一个包含指定组件的模态对话框。
   *
   * @param component Type of the component to load into the dialog.
   *
   * 要加载到对话框中的组件类型。
   *
   * @param config Extra configuration options.
   *
   * 额外的配置选项。
   *
   * @returns Reference to the newly-opened dialog.
   *
   * 引用新打开的对话框。
   */
  open<T, D = any, R = any>(
    component: ComponentType<T>,
    config?: MatDialogConfig<D>,
  ): MatDialogRef<T, R>;

  /**
   * Opens a modal dialog containing the given template.
   *
   * 打开一个包含指定模板的模态对话框。
   *
   * @param template TemplateRef to instantiate as the dialog content.
   *
   * TemplateRef 要实例化为对话框内容。
   *
   * @param config Extra configuration options.
   *
   * 额外的配置选项。
   *
   * @returns Reference to the newly-opened dialog.
   *
   * 引用新打开的对话框。
   */
  open<T, D = any, R = any>(
    template: TemplateRef<T>,
    config?: MatDialogConfig<D>,
  ): MatDialogRef<T, R>;

  open<T, D = any, R = any>(
    template: ComponentType<T> | TemplateRef<T>,
    config?: MatDialogConfig<D>,
  ): MatDialogRef<T, R>;

  open<T, D = any, R = any>(
    componentOrTemplateRef: ComponentType<T> | TemplateRef<T>,
    config?: MatDialogConfig<D>,
  ): MatDialogRef<T, R> {
    config = _applyConfigDefaults(config, this._defaultOptions || new MatDialogConfig());

    if (
      config.id &&
      this.getDialogById(config.id) &&
      (typeof ngDevMode === 'undefined' || ngDevMode)
    ) {
      throw Error(`Dialog with id "${config.id}" exists already. The dialog id must be unique.`);
    }

    // If there is a dialog that is currently animating open, return the MatDialogRef of that dialog
    if (this._dialogAnimatingOpen) {
      return this._lastDialogRef;
    }

    const overlayRef = this._createOverlay(config);
    const dialogContainer = this._attachDialogContainer(overlayRef, config);
    if (this._animationMode !== 'NoopAnimations') {
      const animationStateSubscription = dialogContainer._animationStateChanged.subscribe(
        dialogAnimationEvent => {
          if (dialogAnimationEvent.state === 'opening') {
            this._dialogAnimatingOpen = true;
          }
          if (dialogAnimationEvent.state === 'opened') {
            this._dialogAnimatingOpen = false;
            animationStateSubscription.unsubscribe();
          }
        },
      );
      if (!this._animationStateSubscriptions) {
        this._animationStateSubscriptions = new Subscription();
      }
      this._animationStateSubscriptions.add(animationStateSubscription);
    }

    const dialogRef = this._attachDialogContent<T, R>(
      componentOrTemplateRef,
      dialogContainer,
      overlayRef,
      config,
    );
    this._lastDialogRef = dialogRef;

    // If this is the first dialog that we're opening, hide all the non-overlay content.
    if (!this.openDialogs.length) {
      this._hideNonDialogContentFromAssistiveTechnology();
    }

    this.openDialogs.push(dialogRef);
    dialogRef.afterClosed().subscribe(() => this._removeOpenDialog(dialogRef));
    this.afterOpened.next(dialogRef);

    // Notify the dialog container that the content has been attached.
    dialogContainer._initializeWithAttachedContent();

    return dialogRef;
  }

  /**
   * Closes all of the currently-open dialogs.
   *
   * 关闭所有当前打开的对话框。
   *
   */
  closeAll(): void {
    this._closeDialogs(this.openDialogs);
  }

  /**
   * Finds an open dialog by its id.
   *
   * 通过 id 查找一个打开的对话框。
   *
   * @param id ID to use when looking up the dialog.
   *
   * 在查找对话框时要用到的 ID。
   *
   */
  getDialogById(id: string): MatDialogRef<any> | undefined {
    return this.openDialogs.find(dialog => dialog.id === id);
  }

  ngOnDestroy() {
    // Only close the dialogs at this level on destroy
    // since the parent service may still be active.
    this._closeDialogs(this._openDialogsAtThisLevel);
    this._afterAllClosedAtThisLevel.complete();
    this._afterOpenedAtThisLevel.complete();
    // Clean up any subscriptions to dialogs that never finished opening.
    if (this._animationStateSubscriptions) {
      this._animationStateSubscriptions.unsubscribe();
    }
  }

  /**
   * Creates the overlay into which the dialog will be loaded.
   *
   * 创建用于加载对话框的浮层。
   *
   * @param config The dialog configuration.
   *
   * 该对话框的配置。
   *
   * @returns A promise resolving to the OverlayRef for the created overlay.
   *
   * 一个 Promise，它会解析为 OverlayRef 所创建的浮层。
   */
  private _createOverlay(config: MatDialogConfig): OverlayRef {
    const overlayConfig = this._getOverlayConfig(config);
    return this._overlay.create(overlayConfig);
  }

  /**
   * Creates an overlay config from a dialog config.
   *
   * 从对话框配置中创建一个浮层配置。
   *
   * @param dialogConfig The dialog configuration.
   *
   * 该对话框的配置。
   *
   * @returns The overlay configuration.
   *
   * 浮层的配置。
   */
  private _getOverlayConfig(dialogConfig: MatDialogConfig): OverlayConfig {
    const state = new OverlayConfig({
      positionStrategy: this._overlay.position().global(),
      scrollStrategy: dialogConfig.scrollStrategy || this._scrollStrategy(),
      panelClass: dialogConfig.panelClass,
      hasBackdrop: dialogConfig.hasBackdrop,
      direction: dialogConfig.direction,
      minWidth: dialogConfig.minWidth,
      minHeight: dialogConfig.minHeight,
      maxWidth: dialogConfig.maxWidth,
      maxHeight: dialogConfig.maxHeight,
      disposeOnNavigation: dialogConfig.closeOnNavigation,
    });

    if (dialogConfig.backdropClass) {
      state.backdropClass = dialogConfig.backdropClass;
    }

    return state;
  }

  /**
   * Attaches a dialog container to a dialog's already-created overlay.
   *
   * 把一个对话框容器附加到一个已经创建过的对话框中。
   *
   * @param overlay Reference to the dialog's underlying overlay.
   *
   * 引用对话框的底层浮层对象。
   *
   * @param config The dialog configuration.
   *
   * 该对话框的配置。
   *
   * @returns A promise resolving to a ComponentRef for the attached container.
   *
   * 一个 Promise，会解析为所附加容器的 ComponentRef。
   */
  private _attachDialogContainer(overlay: OverlayRef, config: MatDialogConfig): C {
    const userInjector = config && config.viewContainerRef && config.viewContainerRef.injector;
    const injector = Injector.create({
      parent: userInjector || this._injector,
      providers: [{provide: MatDialogConfig, useValue: config}],
    });

    const containerPortal = new ComponentPortal(
      this._dialogContainerType,
      config.viewContainerRef,
      injector,
      config.componentFactoryResolver,
    );
    const containerRef = overlay.attach<C>(containerPortal);

    return containerRef.instance;
  }

  /**
   * Attaches the user-provided component to the already-created dialog container.
   *
   * 把用户提供的组件附加到已创建的对话框中。
   *
   * @param componentOrTemplateRef The type of component being loaded into the dialog,
   *     or a TemplateRef to instantiate as the content.
   *
   * 要加载到对话框中的组件类型，或者要实例化为内容的 TemplateRef。
   *
   * @param dialogContainer Reference to the wrapping dialog container.
   *
   * 对包装对话框容器的引用。
   *
   * @param overlayRef Reference to the overlay in which the dialog resides.
   *
   * 对该对话框所在浮层的引用。
   *
   * @param config The dialog configuration.
   *
   * 该对话框的配置。
   *
   * @returns A promise resolving to the MatDialogRef that should be returned to the user.
   *
   * 一个解析为 MatDialogRef 的 Promise，它应该返回给用户。
   */
  private _attachDialogContent<T, R>(
    componentOrTemplateRef: ComponentType<T> | TemplateRef<T>,
    dialogContainer: C,
    overlayRef: OverlayRef,
    config: MatDialogConfig,
  ): MatDialogRef<T, R> {
    // Create a reference to the dialog we're creating in order to give the user a handle
    // to modify and close it.
    const dialogRef = new this._dialogRefConstructor(overlayRef, dialogContainer, config.id);

    if (componentOrTemplateRef instanceof TemplateRef) {
      dialogContainer.attachTemplatePortal(
        new TemplatePortal<T>(componentOrTemplateRef, null!, <any>{
          $implicit: config.data,
          dialogRef,
        }),
      );
    } else {
      const injector = this._createInjector<T>(config, dialogRef, dialogContainer);
      const contentRef = dialogContainer.attachComponentPortal<T>(
        new ComponentPortal(componentOrTemplateRef, config.viewContainerRef, injector),
      );
      dialogRef.componentInstance = contentRef.instance;
    }

    dialogRef.updateSize(config.width, config.height).updatePosition(config.position);

    return dialogRef;
  }

  /**
   * Creates a custom injector to be used inside the dialog. This allows a component loaded inside
   * of a dialog to close itself and, optionally, to return a value.
   *
   * 创建一个在对话框中使用的自定义注入器。这允许在对话框里面加载的组件关闭自身，并且返回一个可选的值。
   *
   * @param config Config object that is used to construct the dialog.
   *
   * 用于构造对话框的配置对象。
   *
   * @param dialogRef Reference to the dialog.
   *
   * 对话框的引用。
   *
   * @param dialogContainer Dialog container element that wraps all of the contents.
   *
   * 包装所有内容的对话框容器元素。
   *
   * @returns The custom injector that can be used inside the dialog.
   *
   * 可以在对话框中使用的自定义注入器。
   */
  private _createInjector<T>(
    config: MatDialogConfig,
    dialogRef: MatDialogRef<T>,
    dialogContainer: C,
  ): Injector {
    const userInjector = config && config.viewContainerRef && config.viewContainerRef.injector;

    // The dialog container should be provided as the dialog container and the dialog's
    // content are created out of the same `ViewContainerRef` and as such, are siblings
    // for injector purposes. To allow the hierarchy that is expected, the dialog
    // container is explicitly provided in the injector.
    const providers: StaticProvider[] = [
      {provide: this._dialogContainerType, useValue: dialogContainer},
      {provide: this._dialogDataToken, useValue: config.data},
      {provide: this._dialogRefConstructor, useValue: dialogRef},
    ];

    if (
      config.direction &&
      (!userInjector ||
        !userInjector.get<Directionality | null>(Directionality, null, InjectFlags.Optional))
    ) {
      providers.push({
        provide: Directionality,
        useValue: {value: config.direction, change: observableOf()},
      });
    }

    return Injector.create({parent: userInjector || this._injector, providers});
  }

  /**
   * Removes a dialog from the array of open dialogs.
   *
   * 从打开的对话框数组中删除一个对话框。
   *
   * @param dialogRef Dialog to be removed.
   *
   * 要删除的对话框。
   *
   */
  private _removeOpenDialog(dialogRef: MatDialogRef<any>) {
    const index = this.openDialogs.indexOf(dialogRef);

    if (index > -1) {
      this.openDialogs.splice(index, 1);

      // If all the dialogs were closed, remove/restore the `aria-hidden`
      // to a the siblings and emit to the `afterAllClosed` stream.
      if (!this.openDialogs.length) {
        this._ariaHiddenElements.forEach((previousValue, element) => {
          if (previousValue) {
            element.setAttribute('aria-hidden', previousValue);
          } else {
            element.removeAttribute('aria-hidden');
          }
        });

        this._ariaHiddenElements.clear();
        this._getAfterAllClosed().next();
      }
    }
  }

  /**
   * Hides all of the content that isn't an overlay from assistive technology.
   *
   * 隐藏所有不支持无障碍功能的浮层内容。
   *
   */
  private _hideNonDialogContentFromAssistiveTechnology() {
    const overlayContainer = this._overlayContainer.getContainerElement();

    // Ensure that the overlay container is attached to the DOM.
    if (overlayContainer.parentElement) {
      const siblings = overlayContainer.parentElement.children;

      for (let i = siblings.length - 1; i > -1; i--) {
        let sibling = siblings[i];

        if (
          sibling !== overlayContainer &&
          sibling.nodeName !== 'SCRIPT' &&
          sibling.nodeName !== 'STYLE' &&
          !sibling.hasAttribute('aria-live')
        ) {
          this._ariaHiddenElements.set(sibling, sibling.getAttribute('aria-hidden'));
          sibling.setAttribute('aria-hidden', 'true');
        }
      }
    }
  }

  /**
   * Closes all of the dialogs in an array.
   *
   * 关闭一个数组中的所有对话框。
   *
   */
  private _closeDialogs(dialogs: MatDialogRef<any>[]) {
    let i = dialogs.length;

    while (i--) {
      // The `_openDialogs` property isn't updated after close until the rxjs subscription
      // runs on the next microtask, in addition to modifying the array as we're going
      // through it. We loop through all of them and call close without assuming that
      // they'll be removed from the list instantaneously.
      dialogs[i].close();
    }
  }
}

/**
 * Service to open Material Design modal dialogs.
 *
 * 用于打开 Material Design 模态对话框的服务。
 *
 */
@Injectable()
export class MatDialog extends _MatDialogBase<MatDialogContainer> {
  constructor(
    overlay: Overlay,
    injector: Injector,
    /**
     * @deprecated `_location` parameter to be removed.
     * @breaking-change 10.0.0
     */
    @Optional() location: Location,
    @Optional() @Inject(MAT_DIALOG_DEFAULT_OPTIONS) defaultOptions: MatDialogConfig,
    @Inject(MAT_DIALOG_SCROLL_STRATEGY) scrollStrategy: any,
    @Optional() @SkipSelf() parentDialog: MatDialog,
    overlayContainer: OverlayContainer,
    @Optional()
    @Inject(ANIMATION_MODULE_TYPE)
    animationMode?: 'NoopAnimations' | 'BrowserAnimations',
  ) {
    super(
      overlay,
      injector,
      defaultOptions,
      parentDialog,
      overlayContainer,
      scrollStrategy,
      MatDialogRef,
      MatDialogContainer,
      MAT_DIALOG_DATA,
      animationMode,
    );
  }
}

/**
 * Applies default options to the dialog config.
 *
 * 在对话框的配置中应用默认选项。
 *
 * @param config Config to be modified.
 *
 * 要修改的配置。
 *
 * @param defaultOptions Default options provided.
 *
 * 提供的默认选项。
 *
 * @returns The new configuration object.
 *
 * 新的配置对象。
 */
function _applyConfigDefaults(
  config?: MatDialogConfig,
  defaultOptions?: MatDialogConfig,
): MatDialogConfig {
  return {...defaultOptions, ...config};
}
