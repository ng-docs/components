/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  TemplateRef,
  Injectable,
  Injector,
  OnDestroy,
  Type,
  StaticProvider,
  Inject,
  Optional,
  SkipSelf,
} from '@angular/core';
import {BasePortalOutlet, ComponentPortal, TemplatePortal} from '@angular/cdk/portal';
import {of as observableOf, Observable, Subject, defer} from 'rxjs';
import {DialogRef} from './dialog-ref';
import {DialogConfig} from './dialog-config';
import {Directionality} from '@angular/cdk/bidi';
import {
  ComponentType,
  Overlay,
  OverlayRef,
  OverlayConfig,
  ScrollStrategy,
  OverlayContainer,
} from '@angular/cdk/overlay';
import {startWith} from 'rxjs/operators';

import {DEFAULT_DIALOG_CONFIG, DIALOG_DATA, DIALOG_SCROLL_STRATEGY} from './dialog-injectors';
import {CdkDialogContainer} from './dialog-container';

/**
 * Unique id for the created dialog.
 *
 * 创建的对话框的唯一 ID。
 *
 */
let uniqueId = 0;

@Injectable()
export class Dialog implements OnDestroy {
  private _openDialogsAtThisLevel: DialogRef<any, any>[] = [];
  private readonly _afterAllClosedAtThisLevel = new Subject<void>();
  private readonly _afterOpenedAtThisLevel = new Subject<DialogRef>();
  private _ariaHiddenElements = new Map<Element, string | null>();
  private _scrollStrategy: () => ScrollStrategy;

  /**
   * Keeps track of the currently-open dialogs.
   *
   * 跟踪当前打开的对话框。
   *
   */
  get openDialogs(): readonly DialogRef<any, any>[] {
    return this._parentDialog ? this._parentDialog.openDialogs : this._openDialogsAtThisLevel;
  }

  /**
   * Stream that emits when a dialog has been opened.
   *
   * 当对话框打开后会发出通知的流。
   *
   */
  get afterOpened(): Subject<DialogRef<any, any>> {
    return this._parentDialog ? this._parentDialog.afterOpened : this._afterOpenedAtThisLevel;
  }

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
  );

  constructor(
    private _overlay: Overlay,
    private _injector: Injector,
    @Optional() @Inject(DEFAULT_DIALOG_CONFIG) private _defaultOptions: DialogConfig,
    @Optional() @SkipSelf() private _parentDialog: Dialog,
    private _overlayContainer: OverlayContainer,
    @Inject(DIALOG_SCROLL_STRATEGY) scrollStrategy: any,
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
   * @returns
   *
   * Reference to the newly-opened dialog.
   *
   * 引用新打开的对话框。
   *
   */
  open<R = unknown, D = unknown, C = unknown>(
    component: ComponentType<C>,
    config?: DialogConfig<D, DialogRef<R, C>>,
  ): DialogRef<R, C>;

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
   * @returns
   *
   * Reference to the newly-opened dialog.
   *
   * 引用新打开的对话框。
   *
   */
  open<R = unknown, D = unknown, C = unknown>(
    template: TemplateRef<C>,
    config?: DialogConfig<D, DialogRef<R, C>>,
  ): DialogRef<R, C>;

  open<R = unknown, D = unknown, C = unknown>(
    componentOrTemplateRef: ComponentType<C> | TemplateRef<C>,
    config?: DialogConfig<D, DialogRef<R, C>>,
  ): DialogRef<R, C>;

  open<R = unknown, D = unknown, C = unknown>(
    componentOrTemplateRef: ComponentType<C> | TemplateRef<C>,
    config?: DialogConfig<D, DialogRef<R, C>>,
  ): DialogRef<R, C> {
    const defaults = (this._defaultOptions || new DialogConfig()) as DialogConfig<
      D,
      DialogRef<R, C>
    >;
    config = {...defaults, ...config};
    config.id = config.id || `cdk-dialog-${uniqueId++}`;

    if (
      config.id &&
      this.getDialogById(config.id) &&
      (typeof ngDevMode === 'undefined' || ngDevMode)
    ) {
      throw Error(`Dialog with id "${config.id}" exists already. The dialog id must be unique.`);
    }

    const overlayConfig = this._getOverlayConfig(config);
    const overlayRef = this._overlay.create(overlayConfig);
    const dialogRef = new DialogRef(overlayRef, config);
    const dialogContainer = this._attachContainer(overlayRef, dialogRef, config);

    (dialogRef as {containerInstance: BasePortalOutlet}).containerInstance = dialogContainer;
    this._attachDialogContent(componentOrTemplateRef, dialogRef, dialogContainer, config);

    // If this is the first dialog that we're opening, hide all the non-overlay content.
    if (!this.openDialogs.length) {
      this._hideNonDialogContentFromAssistiveTechnology();
    }

    (this.openDialogs as DialogRef<R, C>[]).push(dialogRef);
    dialogRef.closed.subscribe(() => this._removeOpenDialog(dialogRef, true));
    this.afterOpened.next(dialogRef);

    return dialogRef;
  }

  /**
   * Closes all of the currently-open dialogs.
   *
   * 关闭所有当前打开的对话框。
   *
   */
  closeAll(): void {
    reverseForEach(this.openDialogs, dialog => dialog.close());
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
  getDialogById<R, C>(id: string): DialogRef<R, C> | undefined {
    return this.openDialogs.find(dialog => dialog.id === id);
  }

  ngOnDestroy() {
    // Make one pass over all the dialogs that need to be untracked, but should not be closed. We
    // want to stop tracking the open dialog even if it hasn't been closed, because the tracking
    // determines when `aria-hidden` is removed from elements outside the dialog.
    reverseForEach(this._openDialogsAtThisLevel, dialog => {
      // Check for `false` specifically since we want `undefined` to be interpreted as `true`.
      if (dialog.config.closeOnDestroy === false) {
        this._removeOpenDialog(dialog, false);
      }
    });

    // Make a second pass and close the remaining dialogs. We do this second pass in order to
    // correctly dispatch the `afterAllClosed` event in case we have a mixed array of dialogs
    // that should be closed and dialogs that should not.
    reverseForEach(this._openDialogsAtThisLevel, dialog => dialog.close());

    this._afterAllClosedAtThisLevel.complete();
    this._afterOpenedAtThisLevel.complete();
    this._openDialogsAtThisLevel = [];
  }

  /**
   * Creates an overlay config from a dialog config.
   *
   * 从对话框配置创建浮层配置。
   *
   * @param config The dialog configuration.
   *
   * 对话框配置。
   *
   * @returns
   *
   * The overlay configuration.
   *
   * 浮层配置。
   *
   */
  private _getOverlayConfig<D, R>(config: DialogConfig<D, R>): OverlayConfig {
    const state = new OverlayConfig({
      positionStrategy:
        config.positionStrategy ||
        this._overlay.position().global().centerHorizontally().centerVertically(),
      scrollStrategy: config.scrollStrategy || this._scrollStrategy(),
      panelClass: config.panelClass,
      hasBackdrop: config.hasBackdrop,
      direction: config.direction,
      minWidth: config.minWidth,
      minHeight: config.minHeight,
      maxWidth: config.maxWidth,
      maxHeight: config.maxHeight,
      width: config.width,
      height: config.height,
      disposeOnNavigation: config.closeOnNavigation,
    });

    if (config.backdropClass) {
      state.backdropClass = config.backdropClass;
    }

    return state;
  }

  /**
   * Attaches a dialog container to a dialog's already-created overlay.
   *
   * 将对话框容器附着到对话框的已创建浮层。
   *
   * @param overlay Reference to the dialog's underlying overlay.
   *
   * 引用对话框的底层浮层。
   *
   * @param config The dialog configuration.
   *
   * 对话框配置。
   *
   * @returns
   *
   * A promise resolving to a ComponentRef for the attached container.
   *
   * 一个 Promise，会解析为指向已附着容器的 ComponentRef。
   *
   */
  private _attachContainer<R, D, C>(
    overlay: OverlayRef,
    dialogRef: DialogRef<R, C>,
    config: DialogConfig<D, DialogRef<R, C>>,
  ): BasePortalOutlet {
    const userInjector = config.injector || config.viewContainerRef?.injector;
    const providers: StaticProvider[] = [
      {provide: DialogConfig, useValue: config},
      {provide: DialogRef, useValue: dialogRef},
      {provide: OverlayRef, useValue: overlay},
    ];
    let containerType: Type<BasePortalOutlet>;

    if (config.container) {
      if (typeof config.container === 'function') {
        containerType = config.container;
      } else {
        containerType = config.container.type;
        providers.push(...config.container.providers(config));
      }
    } else {
      containerType = CdkDialogContainer;
    }

    const containerPortal = new ComponentPortal(
      containerType,
      config.viewContainerRef,
      Injector.create({parent: userInjector || this._injector, providers}),
      config.componentFactoryResolver,
    );
    const containerRef = overlay.attach(containerPortal);

    return containerRef.instance;
  }

  /**
   * Attaches the user-provided component to the already-created dialog container.
   *
   * 将用户提供的组件附着到已创建的对话框容器。
   *
   * @param componentOrTemplateRef The type of component being loaded into the dialog,
   *     or a TemplateRef to instantiate as the content.
   *
   * 加载到对话框中的组件类型，或作为内容实例化的 TemplateRef。
   *
   * @param dialogRef Reference to the dialog being opened.
   *
   * 对正在打开的对话框的引用。
   *
   * @param dialogContainer Component that is going to wrap the dialog content.
   *
   * 将包裹此对话框内容的组件。
   *
   * @param config Configuration used to open the dialog.
   *
   * 用于打开对话框的配置。
   *
   */
  private _attachDialogContent<R, D, C>(
    componentOrTemplateRef: ComponentType<C> | TemplateRef<C>,
    dialogRef: DialogRef<R, C>,
    dialogContainer: BasePortalOutlet,
    config: DialogConfig<D, DialogRef<R, C>>,
  ) {
    if (componentOrTemplateRef instanceof TemplateRef) {
      const injector = this._createInjector(config, dialogRef, dialogContainer, undefined);
      let context: any = {$implicit: config.data, dialogRef};

      if (config.templateContext) {
        context = {
          ...context,
          ...(typeof config.templateContext === 'function'
            ? config.templateContext()
            : config.templateContext),
        };
      }

      dialogContainer.attachTemplatePortal(
        new TemplatePortal<C>(componentOrTemplateRef, null!, context, injector),
      );
    } else {
      const injector = this._createInjector(config, dialogRef, dialogContainer, this._injector);
      const contentRef = dialogContainer.attachComponentPortal<C>(
        new ComponentPortal(
          componentOrTemplateRef,
          config.viewContainerRef,
          injector,
          config.componentFactoryResolver,
        ),
      );
      (dialogRef as {componentInstance: C}).componentInstance = contentRef.instance;
    }
  }

  /**
   * Creates a custom injector to be used inside the dialog. This allows a component loaded inside
   * of a dialog to close itself and, optionally, to return a value.
   *
   * 创建要在对话框中使用的自定义注入器。这允许加载到对话框中的组件关闭对话框本身，并且可以选择返回一个值。
   *
   * @param config Config object that is used to construct the dialog.
   *
   * 用于构造对话框的配置对象。
   *
   * @param dialogRef Reference to the dialog being opened.
   *
   * 对正在打开的对话框的引用。
   *
   * @param dialogContainer Component that is going to wrap the dialog content.
   *
   * 将包裹此对话框内容的组件。
   *
   * @param fallbackInjector Injector to use as a fallback when a lookup fails in the custom
   * dialog injector, if the user didn't provide a custom one.
   * @returns
   *
   * The custom injector that can be used inside the dialog.
   *
   * 可以在对话框中使用的自定义注入器。
   *
   */
  private _createInjector<R, D, C>(
    config: DialogConfig<D, DialogRef<R, C>>,
    dialogRef: DialogRef<R, C>,
    dialogContainer: BasePortalOutlet,
    fallbackInjector: Injector | undefined,
  ): Injector {
    const userInjector = config.injector || config.viewContainerRef?.injector;
    const providers: StaticProvider[] = [
      {provide: DIALOG_DATA, useValue: config.data},
      {provide: DialogRef, useValue: dialogRef},
    ];

    if (config.providers) {
      if (typeof config.providers === 'function') {
        providers.push(...config.providers(dialogRef, config, dialogContainer));
      } else {
        providers.push(...config.providers);
      }
    }

    if (
      config.direction &&
      (!userInjector ||
        !userInjector.get<Directionality | null>(Directionality, null, {optional: true}))
    ) {
      providers.push({
        provide: Directionality,
        useValue: {value: config.direction, change: observableOf()},
      });
    }

    return Injector.create({parent: userInjector || fallbackInjector, providers});
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
   * @param emitEvent Whether to emit an event if this is the last dialog.
   *
   * 如果这是最后一个对话框，是否发出事件。
   *
   */
  private _removeOpenDialog<R, C>(dialogRef: DialogRef<R, C>, emitEvent: boolean) {
    const index = this.openDialogs.indexOf(dialogRef);

    if (index > -1) {
      (this.openDialogs as DialogRef<R, C>[]).splice(index, 1);

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

        if (emitEvent) {
          this._getAfterAllClosed().next();
        }
      }
    }
  }

  /**
   * Hides all of the content that isn't an overlay from assistive technology.
   *
   * 隐藏所有非辅助技术浮层的内容。
   *
   */
  private _hideNonDialogContentFromAssistiveTechnology() {
    const overlayContainer = this._overlayContainer.getContainerElement();

    // Ensure that the overlay container is attached to the DOM.
    if (overlayContainer.parentElement) {
      const siblings = overlayContainer.parentElement.children;

      for (let i = siblings.length - 1; i > -1; i--) {
        const sibling = siblings[i];

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

  private _getAfterAllClosed(): Subject<void> {
    const parent = this._parentDialog;
    return parent ? parent._getAfterAllClosed() : this._afterAllClosedAtThisLevel;
  }
}

/**
 * Executes a callback against all elements in an array while iterating in reverse.
 * Useful if the array is being modified as it is being iterated.
 *
 * 在反向迭代时对数组中的所有元素执行回调。如果数组在迭代时被修改，则很有用。
 *
 */
function reverseForEach<T>(items: T[] | readonly T[], callback: (current: T) => void) {
  let i = items.length;

  while (i--) {
    callback(items[i]);
  }
}
