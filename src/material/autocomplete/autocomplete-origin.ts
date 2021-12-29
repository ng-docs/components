/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Directive, ElementRef} from '@angular/core';

/**
 * Base class containing all of the functionality for `MatAutocompleteOrigin`.
 *
 * 包含 `MatAutocompleteOrigin` 全部功能的基类。
 *
 */
@Directive()
export abstract class _MatAutocompleteOriginBase {
  constructor(
    /**
     * Reference to the element on which the directive is applied.
     *
     * 对此指令要应用到的元素的引用。
     */
    public elementRef: ElementRef<HTMLElement>,
  ) {}
}

/**
 * Directive applied to an element to make it usable
 * as a connection point for an autocomplete panel.
 *
 * 指令应用于某个元素，以使其可用作自动完成面板的连接点。
 *
 */
@Directive({
  selector: '[matAutocompleteOrigin]',
  exportAs: 'matAutocompleteOrigin',
})
export class MatAutocompleteOrigin extends _MatAutocompleteOriginBase {}
