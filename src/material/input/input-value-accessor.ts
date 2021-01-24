/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {InjectionToken} from '@angular/core';


/**
 * This token is used to inject the object whose value should be set into `MatInput`. If none is
 * provided, the native `HTMLInputElement` is used. Directives like `MatDatepickerInput` can provide
 * themselves for this token, in order to make `MatInput` delegate the getting and setting of the
 * value to them.
 *
 * 这个令牌用于注入那些应该把值设置进 `MatInput` 的对象。如果没有提供，就会使用原生 `HTMLInputElement`。像 `MatDatepickerInput` 这样的指令可以为此令牌提供自己的能力，以便让 `MatInput` 委托对它们进行获取和设置。
 *
 */
export const MAT_INPUT_VALUE_ACCESSOR =
    new InjectionToken<{value: any}>('MAT_INPUT_VALUE_ACCESSOR');
