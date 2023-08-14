/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ComponentType, Overlay, OverlayContainer, ScrollStrategy} from '@angular/cdk/overlay';
import {Location} from '@angular/common';
import {
  ANIMATION_MODULE_TYPE,
  ComponentRef,
  Inject,
  Injectable,
  InjectionToken,
  Injector,
  OnDestroy,
  Optional,
  SkipSelf,
  TemplateRef,
  Type,
} from '@angular/core';
import {MatDialogConfig} from './dialog-config';
import {_MatDialogContainerBase, MatDialogContainer} from './dialog-container';
import {MatDialogRef} from './dialog-ref';
import {defer, Observable, Subject} from 'rxjs';
import {Dialog, DialogConfig} from '@angular/cdk/dialog';
import {startWith} from 'rxjs/operators';

/**
 * Injection token that can be used to access the data that was passed in to a dialog.
 *
 * 这个注入令牌可以用来访问那些传入对话框的数据。
 *
 */
export const MAT_DIALOG_DATA = new InjectionToken<any>('MatMdcDialogData');

/**
 * Injection token that can be used to specify default dialog options.
 *
 * 这个注入令牌可以用来指定默认的对话框选项。
 *
 */
export const MAT_DIALOG_DEFAULT_OPTIONS = new InjectionToken<MatDialogConfig>(
  'mat-mdc-dialog-default-options',
);

/**
 * Injection token that determines the scroll handling while the dialog is open.
 *
 * 一个注入令牌，它在对话框打开时确定滚动的处理方式。
 *
 */
export const MAT_DIALOG_SCROLL_STRATEGY = new InjectionToken<() => ScrollStrategy>(
  'mat-mdc-dialog-scroll-strategy',
);

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

/** @docs-private */
export function MAT_DIALOG_SCROLL_STRATEGY_FACTORY(overlay: Overlay): () => ScrollStrategy {
  return () => overlay.scrollStrategies.block();
}

// Counter for unique dialog ids.
let uniqueId = 0;

/**
 * Base class for dialog services. The base dialog service allows
 * for arbitrary dialog refs and dialog container components.
 *
 * 对话框服务的基类。基本对话框服务允许使用任意对话框参数和对话框容器组件。
 *
 */
@Injectable()
export abstract class _MatDialogBase<C extends _MatDialogContainerBase> implements OnDestroy {
  private readonly _openDialogsAtThisLevel: MatDialogRef<any>[] = [];
  private readonly _afterAllClosedAtThisLevel = new Subject<void>();
  private readonly _afterOpenedAtThisLevel = new Subject<MatDialogRef<any>>();
  private _scrollStrategy: () => ScrollStrategy;
  protected _idPrefix = 'mat-dialog-';
  private _dialog: Dialog;
  protected dialogConfigClass = MatDialogConfig;

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

  private _getAfterAllClosed(): Subject<void> {
    const parent = this._parentDialog;
    return parent ? parent._getAfterAllClosed() : this._afterAllClosedAtThisLevel;
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
  ) as Observable<any>;

  constructor(
    private _overlay: Overlay,
    injector: Injector,
    private _defaultOptions: MatDialogConfig | undefined,
    private _parentDialog: _MatDialogBase<C> | undefined,
    /**
     * @deprecated No longer used. To be removed.
     * @breaking-change 15.0.0
     */
    _overlayContainer: OverlayContainer,
    scrollStrategy: any,
    private _dialogRefConstructor: Type<MatDialogRef<any>>,
    private _dialogContainerType: Type<C>,
    private _dialogDataToken: InjectionToken<any>,
    /**
     * @deprecated No longer used. To be removed.
     * @breaking-change 14.0.0
     */
    _animationMode?: 'NoopAnimations' | 'BrowserAnimations',
  ) {
    this._scrollStrategy = scrollStrategy;
    this._dialog = injector.get(Dialog);
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
   * @returns
   *
   * Reference to the newly-opened dialog.
   *
   * 引用新打开的对话框。
   *
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
    let dialogRef: MatDialogRef<T, R>;
    config = {...(this._defaultOptions || new MatDialogConfig()), ...config};
    config.id = config.id || `${this._idPrefix}${uniqueId++}`;
    config.scrollStrategy = config.scrollStrategy || this._scrollStrategy();

    const cdkRef = this._dialog.open<R, D, T>(componentOrTemplateRef, {
      ...config,
      positionStrategy: this._overlay.position().global().centerHorizontally().centerVertically(),
      // Disable closing since we need to sync it up to the animation ourselves.
      disableClose: true,
      // Disable closing on destroy, because this service cleans up its open dialogs as well.
      // We want to do the cleanup here, rather than the CDK service, because the CDK destroys
      // the dialogs immediately whereas we want it to wait for the animations to finish.
      closeOnDestroy: false,
      // Disable closing on detachments so that we can sync up the animation.
      // The Material dialog ref handles this manually.
      closeOnOverlayDetachments: false,
      container: {
        type: this._dialogContainerType,
        providers: () => [
          // Provide our config as the CDK config as well since it has the same interface as the
          // CDK one, but it contains the actual values passed in by the user for things like
          // `disableClose` which we disable for the CDK dialog since we handle it ourselves.
          {provide: this.dialogConfigClass, useValue: config},
          {provide: DialogConfig, useValue: config},
        ],
      },
      templateContext: () => ({dialogRef}),
      providers: (ref, cdkConfig, dialogContainer) => {
        dialogRef = new this._dialogRefConstructor(ref, config, dialogContainer);
        dialogRef.updatePosition(config?.position);
        return [
          {provide: this._dialogContainerType, useValue: dialogContainer},
          {provide: this._dialogDataToken, useValue: cdkConfig.data},
          {provide: this._dialogRefConstructor, useValue: dialogRef},
        ];
      },
    });

    // This can't be assigned in the `providers` callback, because
    // the instance hasn't been assigned to the CDK ref yet.
    (dialogRef! as {componentRef: ComponentRef<T>}).componentRef = cdkRef.componentRef!;
    dialogRef!.componentInstance = cdkRef.componentInstance!;

    this.openDialogs.push(dialogRef!);
    this.afterOpened.next(dialogRef!);

    dialogRef!.afterClosed().subscribe(() => {
      const index = this.openDialogs.indexOf(dialogRef);

      if (index > -1) {
        this.openDialogs.splice(index, 1);

        if (!this.openDialogs.length) {
          this._getAfterAllClosed().next();
        }
      }
    });

    return dialogRef!;
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
  }

  private _closeDialogs(dialogs: MatDialogRef<any>[]) {
    let i = dialogs.length;

    while (i--) {
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
    /**
     * @deprecated No longer used. To be removed.
     * @breaking-change 15.0.0
     */
    overlayContainer: OverlayContainer,
    /**
     * @deprecated No longer used. To be removed.
     * @breaking-change 14.0.0
     */
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

    this._idPrefix = 'mat-mdc-dialog-';
  }
}
