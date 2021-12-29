/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Injector} from '@angular/core';

/**
 * Custom injector to be used when providing custom
 * injection tokens to components inside a portal.
 *
 * 自定义注入器，用于为传送点内的组件提供自定义注入令牌。
 *
 * @docs-private
 * @deprecated Use `Injector.create` instead.
 *
 * 请改用 `Injector.create`。
 *
 * @breaking-change 11.0.0
 *
 */
export class PortalInjector implements Injector {
  constructor(private _parentInjector: Injector, private _customTokens: WeakMap<any, any>) {}

  get(token: any, notFoundValue?: any): any {
    const value = this._customTokens.get(token);

    if (typeof value !== 'undefined') {
      return value;
    }

    return this._parentInjector.get<any>(token, notFoundValue);
  }
}
