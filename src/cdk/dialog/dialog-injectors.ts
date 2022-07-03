/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {InjectionToken} from '@angular/core';
import {Overlay, ScrollStrategy} from '@angular/cdk/overlay';
import {DialogConfig} from './dialog-config';

/**
 * Injection token for the Dialog's ScrollStrategy.
 *
 * 此 Dialog 的 ScrollStrategy 注入令牌。
 *
 */
export const DIALOG_SCROLL_STRATEGY = new InjectionToken<() => ScrollStrategy>(
  'DialogScrollStrategy',
);

/**
 * Injection token for the Dialog's Data.
 *
 * 此对话框数据的注入令牌。
 *
 */
export const DIALOG_DATA = new InjectionToken<any>('DialogData');

/**
 * Injection token that can be used to provide default options for the dialog module.
 *
 * 可用于为此对话框模块提供默认选项的注入令牌。
 *
 */
export const DEFAULT_DIALOG_CONFIG = new InjectionToken<DialogConfig>('DefaultDialogConfig');

/** @docs-private */
export function DIALOG_SCROLL_STRATEGY_PROVIDER_FACTORY(overlay: Overlay): () => ScrollStrategy {
  return () => overlay.scrollStrategies.block();
}

/** @docs-private */
export const DIALOG_SCROLL_STRATEGY_PROVIDER = {
  provide: DIALOG_SCROLL_STRATEGY,
  deps: [Overlay],
  useFactory: DIALOG_SCROLL_STRATEGY_PROVIDER_FACTORY,
};
