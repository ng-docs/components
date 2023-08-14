/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Dialog} from '@angular/cdk/dialog';
import {Overlay} from '@angular/cdk/overlay';
import {ComponentType} from '@angular/cdk/portal';
import {
  Injectable,
  Optional,
  SkipSelf,
  TemplateRef,
  InjectionToken,
  Inject,
  OnDestroy,
  Injector,
} from '@angular/core';
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
  private _dialog: Dialog;

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
    injector: Injector,
    @Optional() @SkipSelf() private _parentBottomSheet: MatBottomSheet,
    @Optional()
    @Inject(MAT_BOTTOM_SHEET_DEFAULT_OPTIONS)
    private _defaultOptions?: MatBottomSheetConfig,
  ) {
    this._dialog = injector.get(Dialog);
  }

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
   * @returns
   *
   * Reference to the newly-opened bottom sheet.
   *
   * 指向新打开的底部操作表的引用。
   *
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
   * @returns
   *
   * Reference to the newly-opened bottom sheet.
   *
   * 指向新打开的底部操作表的引用。
   *
   */
  open<T, D = any, R = any>(
    template: TemplateRef<T>,
    config?: MatBottomSheetConfig<D>,
  ): MatBottomSheetRef<T, R>;

  open<T, D = any, R = any>(
    componentOrTemplateRef: ComponentType<T> | TemplateRef<T>,
    config?: MatBottomSheetConfig<D>,
  ): MatBottomSheetRef<T, R> {
    const _config = {...(this._defaultOptions || new MatBottomSheetConfig()), ...config};
    let ref: MatBottomSheetRef<T, R>;

    this._dialog.open<R, D, T>(componentOrTemplateRef, {
      ..._config,
      // Disable closing since we need to sync it up to the animation ourselves.
      disableClose: true,
      // Disable closing on detachments so that we can sync up the animation.
      closeOnOverlayDetachments: false,
      maxWidth: '100%',
      container: MatBottomSheetContainer,
      scrollStrategy: _config.scrollStrategy || this._overlay.scrollStrategies.block(),
      positionStrategy: this._overlay.position().global().centerHorizontally().bottom('0'),
      templateContext: () => ({bottomSheetRef: ref}),
      providers: (cdkRef, _cdkConfig, container) => {
        ref = new MatBottomSheetRef(cdkRef, _config, container as MatBottomSheetContainer);
        return [
          {provide: MatBottomSheetRef, useValue: ref},
          {provide: MAT_BOTTOM_SHEET_DATA, useValue: _config.data},
        ];
      },
    });

    // When the bottom sheet is dismissed, clear the reference to it.
    ref!.afterDismissed().subscribe(() => {
      // Clear the bottom sheet ref if it hasn't already been replaced by a newer one.
      if (this._openedBottomSheetRef === ref) {
        this._openedBottomSheetRef = null;
      }
    });

    if (this._openedBottomSheetRef) {
      // If a bottom sheet is already in view, dismiss it and enter the
      // new bottom sheet after exit animation is complete.
      this._openedBottomSheetRef.afterDismissed().subscribe(() => ref.containerInstance?.enter());
      this._openedBottomSheetRef.dismiss();
    } else {
      // If no bottom sheet is in view, enter the new bottom sheet.
      ref!.containerInstance.enter();
    }

    this._openedBottomSheetRef = ref!;
    return ref!;
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
}
