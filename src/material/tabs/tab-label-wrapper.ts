/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Directive, ElementRef} from '@angular/core';
import {CanDisable, mixinDisabled} from '@angular/material/core';
// Boilerplate for applying mixins to MatTabLabelWrapper.
/** @docs-private */
const _MatTabLabelWrapperBase = mixinDisabled(class {});

/**
 * Used in the `mat-tab-group` view to display tab labels.
 *
 * 供 `mat-tab-group` 视图用来显示选项卡标签。
 *
 * @docs-private
 */
@Directive({
  selector: '[matTabLabelWrapper]',
  inputs: ['disabled'],
  host: {
    '[class.mat-tab-disabled]': 'disabled',
    '[attr.aria-disabled]': '!!disabled',
  },
})
export class MatTabLabelWrapper extends _MatTabLabelWrapperBase implements CanDisable {
  constructor(public elementRef: ElementRef) {
    super();
  }

  /**
   * Sets focus on the wrapper element
   *
   * 让包装器元素获得焦点
   *
   */
  focus(): void {
    this.elementRef.nativeElement.focus();
  }

  getOffsetLeft(): number {
    return this.elementRef.nativeElement.offsetLeft;
  }

  getOffsetWidth(): number {
    return this.elementRef.nativeElement.offsetWidth;
  }
}
