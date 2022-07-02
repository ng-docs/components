/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Overlay, OverlayContainer, ScrollStrategy} from '@angular/cdk/overlay';
import {Location} from '@angular/common';
import {
  ANIMATION_MODULE_TYPE,
  Inject,
  Injectable,
  InjectionToken,
  Injector,
  Optional,
  SkipSelf,
} from '@angular/core';
import {_MatDialogBase, MatDialogConfig} from '@angular/material/dialog';
import {MatDialogContainer} from './dialog-container';
import {MatDialogRef} from './dialog-ref';

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
