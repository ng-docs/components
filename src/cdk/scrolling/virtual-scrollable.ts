/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Directionality} from '@angular/cdk/bidi';
import {Directive, ElementRef, InjectionToken, NgZone, Optional} from '@angular/core';
import {ScrollDispatcher} from './scroll-dispatcher';
import {CdkScrollable} from './scrollable';

export const VIRTUAL_SCROLLABLE = new InjectionToken<CdkVirtualScrollable>('VIRTUAL_SCROLLABLE');

/**
 * Extending the {@link CdkScrollable} to be used as scrolling container for virtual scrolling.
 *
 * 扩展 {@link CdkScrollable} 以用作虚拟滚动的滚动容器。
 *
 */
@Directive()
export abstract class CdkVirtualScrollable extends CdkScrollable {
  constructor(
    elementRef: ElementRef<HTMLElement>,
    scrollDispatcher: ScrollDispatcher,
    ngZone: NgZone,
    @Optional() dir?: Directionality,
  ) {
    super(elementRef, scrollDispatcher, ngZone, dir);
  }

  /**
   * Measure the viewport size for the provided orientation.
   *
   * 测量给定方向的视口大小。
   *
   * @param orientation The orientation to measure the size from.
   *
   * 测量尺寸的方向。
   *
   */
  measureViewportSize(orientation: 'horizontal' | 'vertical') {
    const viewportEl = this.elementRef.nativeElement;
    return orientation === 'horizontal' ? viewportEl.clientWidth : viewportEl.clientHeight;
  }

  /**
   * Measure the bounding ClientRect size including the scroll offset.
   *
   * 测量边界 ClientRect 的大小，包括滚动偏移量。
   *
   * @param from The edge to measure from.
   *
   * 要测量的边缘。
   *
   */
  abstract measureBoundingClientRectWithScrollOffset(
    from: 'left' | 'top' | 'right' | 'bottom',
  ): number;
}
