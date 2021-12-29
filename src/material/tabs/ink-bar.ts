/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Directive, ElementRef, Inject, InjectionToken, NgZone, Optional} from '@angular/core';
import {ANIMATION_MODULE_TYPE} from '@angular/platform-browser/animations';

/**
 * Interface for a a MatInkBar positioner method, defining the positioning and width of the ink
 * bar in a set of tabs.
 *
 * 一个 MatInkBar 定位器方法的接口，用于定义选项卡组中墨水条的位置和宽度。
 *
 */
export interface _MatInkBarPositioner {
  (element: HTMLElement): {left: string; width: string};
}

/**
 * Injection token for the MatInkBar's Positioner.
 *
 * MatInkBar 定位器的注入令牌。
 *
 */
export const _MAT_INK_BAR_POSITIONER = new InjectionToken<_MatInkBarPositioner>(
  'MatInkBarPositioner',
  {
    providedIn: 'root',
    factory: _MAT_INK_BAR_POSITIONER_FACTORY,
  },
);

/**
 * The default positioner function for the MatInkBar.
 *
 * MatInkBar 默认的定位器函数。
 *
 * @docs-private
 */
export function _MAT_INK_BAR_POSITIONER_FACTORY(): _MatInkBarPositioner {
  const method = (element: HTMLElement) => ({
    left: element ? (element.offsetLeft || 0) + 'px' : '0',
    width: element ? (element.offsetWidth || 0) + 'px' : '0',
  });

  return method;
}

/**
 * The ink-bar is used to display and animate the line underneath the current active tab label.
 *
 * 墨水条用于显示当前活动选项卡下方的那条横线的行为和动画。
 *
 * @docs-private
 */
@Directive({
  selector: 'mat-ink-bar',
  host: {
    'class': 'mat-ink-bar',
    '[class._mat-animation-noopable]': `_animationMode === 'NoopAnimations'`,
  },
})
export class MatInkBar {
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
   * 根据提供的元素计算样式，以便把墨水条与该元素对齐。如果以前就已设置为隐藏的，则显示墨水条。
   *
   * @param element
   */
  alignToElement(element: HTMLElement) {
    this.show();

    if (typeof requestAnimationFrame !== 'undefined') {
      this._ngZone.runOutsideAngular(() => {
        requestAnimationFrame(() => this._setStyles(element));
      });
    } else {
      this._setStyles(element);
    }
  }

  /**
   * Shows the ink bar.
   *
   * 显示墨水条。
   *
   */
  show(): void {
    this._elementRef.nativeElement.style.visibility = 'visible';
  }

  /**
   * Hides the ink bar.
   *
   * 隐藏墨水条。
   *
   */
  hide(): void {
    this._elementRef.nativeElement.style.visibility = 'hidden';
  }

  /**
   * Sets the proper styles to the ink bar element.
   *
   * 为墨水条元素设置合适的样式。
   *
   * @param element
   */
  private _setStyles(element: HTMLElement) {
    const positions = this._inkBarPositioner(element);
    const inkBar: HTMLElement = this._elementRef.nativeElement;

    inkBar.style.left = positions.left;
    inkBar.style.width = positions.width;
  }
}
