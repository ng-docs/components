/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Directionality} from '@angular/cdk/bidi';
import {Overlay, OverlayConfig, OverlayRef} from '@angular/cdk/overlay';
import {ComponentPortal, ComponentType, TemplatePortal} from '@angular/cdk/portal';
import {
  ComponentRef,
  Injectable,
  Injector,
  Optional,
  SkipSelf,
  TemplateRef,
  InjectionToken,
  Inject,
  OnDestroy,
  StaticProvider,
  InjectFlags,
} from '@angular/core';
import {of as observableOf} from 'rxjs';
import {MAT_BOTTOM_SHEET_DATA, MatBottomSheetConfig} from './bottom-sheet-config';
import {MatBottomSheetContainer} from './bottom-sheet-container';
import {MatBottomSheetModule} from './bottom-sheet-module';
import {MatBottomSheetRef} from './bottom-sheet-ref';

/**
 * Injection token that can be used to specify default bottom sheet options.
 *
 * 这个注入令牌可以用来指定底部操作表的默认选项。
 *
 */
export const MAT_BOTTOM_SHEET_DEFAULT_OPTIONS = new InjectionToken<MatBottomSheetConfig>(
  'mat-bottom-sheet-default-options',
);

/**
 * Service to trigger Material Design bottom sheets.
 *
 * 用于触发 Material Design 底部操作表的服务。
 *
 */
@Injectable({providedIn: MatBottomSheetModule})
export class MatBottomSheet implements OnDestroy {
  private _bottomSheetRefAtThisLevel: MatBottomSheetRef<any> | null = null;

  /**
   * Reference to the currently opened bottom sheet.
   *
   * 引用当前打开的底部操作表。
   *
   */
  get _openedBottomSheetRef(): MatBottomSheetRef<any> | null {
    const parent = this._parentBottomSheet;
    return parent ? parent._openedBottomSheetRef : this._bottomSheetRefAtThisLevel;
  }

  set _openedBottomSheetRef(value: MatBottomSheetRef<any> | null) {
    if (this._parentBottomSheet) {
      this._parentBottomSheet._openedBottomSheetRef = value;
    } else {
      this._bottomSheetRefAtThisLevel = value;
    }
  }

  constructor(
    private _overlay: Overlay,
    private _injector: Injector,
    @Optional() @SkipSelf() private _parentBottomSheet: MatBottomSheet,
    @Optional()
    @Inject(MAT_BOTTOM_SHEET_DEFAULT_OPTIONS)
    private _defaultOptions?: MatBottomSheetConfig,
  ) {}

  /**
   * Opens a bottom sheet containing the given component.
   *
   * 打开一个包含指定组件的底部操作表。
   *
   * @param component Type of the component to load into the bottom sheet.
   *
   * 要装入底部操作表的组件类型。
   *
   * @param config Extra configuration options.
   *
   * 额外的配置选项。
   *
   * @returns Reference to the newly-opened bottom sheet.
   *
   * 指向新打开的底部操作表的引用。
   */
  open<T, D = any, R = any>(
    component: ComponentType<T>,
    config?: MatBottomSheetConfig<D>,
  ): MatBottomSheetRef<T, R>;

  /**
   * Opens a bottom sheet containing the given template.
   *
   * 打开一个包含指定模板的底部操作表。
   *
   * @param template TemplateRef to instantiate as the bottom sheet content.
   *
   * 要用作底部操作表内容的 TemplateRef。
   *
   * @param config Extra configuration options.
   *
   * 额外的配置选项。
   *
   * @returns Reference to the newly-opened bottom sheet.
   *
   * 指向新打开的底部操作表的引用。
   */
  open<T, D = any, R = any>(
    template: TemplateRef<T>,
    config?: MatBottomSheetConfig<D>,
  ): MatBottomSheetRef<T, R>;

  open<T, D = any, R = any>(
    componentOrTemplateRef: ComponentType<T> | TemplateRef<T>,
    config?: MatBottomSheetConfig<D>,
  ): MatBottomSheetRef<T, R> {
    const _config = _applyConfigDefaults(
      this._defaultOptions || new MatBottomSheetConfig(),
      config,
    );
    const overlayRef = this._createOverlay(_config);
    const container = this._attachContainer(overlayRef, _config);
    const ref = new MatBottomSheetRef<T, R>(container, overlayRef);

    if (componentOrTemplateRef instanceof TemplateRef) {
      container.attachTemplatePortal(
        new TemplatePortal<T>(componentOrTemplateRef, null!, {
          $implicit: _config.data,
          bottomSheetRef: ref,
        } as any),
      );
    } else {
      const portal = new ComponentPortal(
        componentOrTemplateRef,
        undefined,
        this._createInjector(_config, ref),
      );
      const contentRef = container.attachComponentPortal(portal);
      ref.instance = contentRef.instance;
    }

    // When the bottom sheet is dismissed, clear the reference to it.
    ref.afterDismissed().subscribe(() => {
      // Clear the bottom sheet ref if it hasn't already been replaced by a newer one.
      if (this._openedBottomSheetRef == ref) {
        this._openedBottomSheetRef = null;
      }
    });

    if (this._openedBottomSheetRef) {
      // If a bottom sheet is already in view, dismiss it and enter the
      // new bottom sheet after exit animation is complete.
      this._openedBottomSheetRef.afterDismissed().subscribe(() => ref.containerInstance.enter());
      this._openedBottomSheetRef.dismiss();
    } else {
      // If no bottom sheet is in view, enter the new bottom sheet.
      ref.containerInstance.enter();
    }

    this._openedBottomSheetRef = ref;

    return ref;
  }

  /**
   * Dismisses the currently-visible bottom sheet.
   *
   * 关掉当前可见的底部操作表。
   *
   * @param result Data to pass to the bottom sheet instance.
   *
   * 要传递给底部操作表实例的数据。
   *
   */
  dismiss<R = any>(result?: R): void {
    if (this._openedBottomSheetRef) {
      this._openedBottomSheetRef.dismiss(result);
    }
  }

  ngOnDestroy() {
    if (this._bottomSheetRefAtThisLevel) {
      this._bottomSheetRefAtThisLevel.dismiss();
    }
  }

  /**
   * Attaches the bottom sheet container component to the overlay.
   *
   * 将底部操作表的容器组件连接到浮层上。
   *
   */
  private _attachContainer(
    overlayRef: OverlayRef,
    config: MatBottomSheetConfig,
  ): MatBottomSheetContainer {
    const userInjector = config && config.viewContainerRef && config.viewContainerRef.injector;
    const injector = Injector.create({
      parent: userInjector || this._injector,
      providers: [{provide: MatBottomSheetConfig, useValue: config}],
    });

    const containerPortal = new ComponentPortal(
      MatBottomSheetContainer,
      config.viewContainerRef,
      injector,
    );
    const containerRef: ComponentRef<MatBottomSheetContainer> = overlayRef.attach(containerPortal);
    return containerRef.instance;
  }

  /**
   * Creates a new overlay and places it in the correct location.
   *
   * 创建一个新的浮层，并把它放在正确的位置。
   *
   * @param config The user-specified bottom sheet config.
   *
   * 用户指定的底部操作表配置。
   *
   */
  private _createOverlay(config: MatBottomSheetConfig): OverlayRef {
    const overlayConfig = new OverlayConfig({
      direction: config.direction,
      hasBackdrop: config.hasBackdrop,
      disposeOnNavigation: config.closeOnNavigation,
      maxWidth: '100%',
      scrollStrategy: config.scrollStrategy || this._overlay.scrollStrategies.block(),
      positionStrategy: this._overlay.position().global().centerHorizontally().bottom('0'),
    });

    if (config.backdropClass) {
      overlayConfig.backdropClass = config.backdropClass;
    }

    return this._overlay.create(overlayConfig);
  }

  /**
   * Creates an injector to be used inside of a bottom sheet component.
   *
   * 创建一个在底部操作表组件内部使用的注入器。
   *
   * @param config Config that was used to create the bottom sheet.
   *
   * 用于创建底部操作表的配置。
   *
   * @param bottomSheetRef Reference to the bottom sheet.
   *
   * 底部操作表的引用。
   *
   */
  private _createInjector<T>(
    config: MatBottomSheetConfig,
    bottomSheetRef: MatBottomSheetRef<T>,
  ): Injector {
    const userInjector = config && config.viewContainerRef && config.viewContainerRef.injector;
    const providers: StaticProvider[] = [
      {provide: MatBottomSheetRef, useValue: bottomSheetRef},
      {provide: MAT_BOTTOM_SHEET_DATA, useValue: config.data},
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
}

/**
 * Applies default options to the bottom sheet config.
 *
 * 把默认选项应用在底部操作表配置上。
 *
 * @param defaults Object containing the default values to which to fall back.
 *
 * 包含要回退的默认值的对象。
 *
 * @param config The configuration to which the defaults will be applied.
 *
 * 要应用默认值的配置。
 *
 * @returns The new configuration object with defaults applied.
 *
 * 应用默认值后的新配置对象。
 */
function _applyConfigDefaults(
  defaults: MatBottomSheetConfig,
  config?: MatBottomSheetConfig,
): MatBottomSheetConfig {
  return {...defaults, ...config};
}
