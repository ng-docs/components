/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Directive, ElementRef, Inject, NgZone, Optional} from '@angular/core';
import {ANIMATION_MODULE_TYPE} from '@angular/platform-browser/animations';
import {take} from 'rxjs/operators';
import {_MAT_INK_BAR_POSITIONER, _MatInkBarPositioner} from '@angular/material/tabs';

/**
 * The ink-bar is used to display and animate the line underneath the current active tab label.
 *
 * 此墨条用于显示当前活动选项卡标签下方的线条并为其设置动画。
 *
 * @docs-private
 * @deprecated
 *
 * Use `MatInkBar` from `@angular/material/tabs` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
@Directive({
  selector: 'mat-ink-bar',
  host: {
    'class': 'mat-ink-bar',
    '[class._mat-animation-noopable]': `_animationMode === 'NoopAnimations'`,
  },
})
export class MatLegacyInkBar {
  constructor(
    private _elementRef: ElementRef<HTMLElement>,
    private _ngZone: NgZone,
    @Inject(_MAT_INK_BAR_POSITIONER) private _inkBarPositioner: _MatInkBarPositioner,
    @Optional() @Inject(ANIMATION_MODULE_TYPE) public _animationMode?: string,
  ) {}

  /**
   * Calculates the styles from the provided element in order to align the ink-bar to that element.
   * Shows the ink bar if previously set as hidden.
   *
   * 从所提供的元素计算样式，以便将此墨条与该元素对齐。如果之前设置为隐藏，则显示墨条。
   *
   * @param element
   */
  alignToElement(element: HTMLElement) {
    this.show();

    // `onStable` might not run for a while if the zone has already stabilized.
    // Wrap the call in `NgZone.run` to ensure that it runs relatively soon.
    this._ngZone.run(() => {
      this._ngZone.onStable.pipe(take(1)).subscribe(() => {
        const positions = this._inkBarPositioner(element);
        const inkBar = this._elementRef.nativeElement;
        inkBar.style.left = positions.left;
        inkBar.style.width = positions.width;
      });
    });
  }

  /**
   * Shows the ink bar.
   *
   * 显示此墨条。
   *
   */
  show(): void {
    this._elementRef.nativeElement.style.visibility = 'visible';
  }

  /**
   * Hides the ink bar.
   *
   * 隐藏此墨条。
   *
   */
  hide(): void {
    this._elementRef.nativeElement.style.visibility = 'hidden';
  }
}
