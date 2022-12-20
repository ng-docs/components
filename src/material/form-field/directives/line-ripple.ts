/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Directive, ElementRef, NgZone, OnDestroy} from '@angular/core';

/**
 * Class added when the line ripple is active.
 *
 * 当线条涟漪处于活动状态时要添加的类。
 *
 */
const ACTIVATE_CLASS = 'mdc-line-ripple--active';

/**
 * Class added when the line ripple is being deactivated.
 *
 * 线条涟漪停止激活时要添加的类。
 *
 */
const DEACTIVATING_CLASS = 'mdc-line-ripple--deactivating';

/**
 * Internal directive that creates an instance of the MDC line-ripple component. Using a
 * directive allows us to conditionally render a line-ripple in the template without having
 * to manually create and destroy the `MDCLineRipple` component whenever the condition changes.
 *
 * 创建 MDC 线条涟漪组件实例的内部指令。使用指令允许我们有条件地在模板中渲染线条涟漪，而无需在条件发生变化时手动创建和销毁 `MDCLineRipple` 组件。
 *
 * The directive sets up the styles for the line-ripple and provides an API for activating
 * and deactivating the line-ripple.
 *
 * 该指令设置线条涟漪的样式，并提供用于激活和停用线条涟漪的 API。
 *
 */
@Directive({
  selector: 'div[matFormFieldLineRipple]',
  host: {
    'class': 'mdc-line-ripple',
  },
})
export class MatFormFieldLineRipple implements OnDestroy {
  constructor(private _elementRef: ElementRef<HTMLElement>, ngZone: NgZone) {
    ngZone.runOutsideAngular(() => {
      _elementRef.nativeElement.addEventListener('transitionend', this._handleTransitionEnd);
    });
  }

  activate() {
    const classList = this._elementRef.nativeElement.classList;
    classList.remove(DEACTIVATING_CLASS);
    classList.add(ACTIVATE_CLASS);
  }

  deactivate() {
    this._elementRef.nativeElement.classList.add(DEACTIVATING_CLASS);
  }

  private _handleTransitionEnd = (event: TransitionEvent) => {
    const classList = this._elementRef.nativeElement.classList;
    const isDeactivating = classList.contains(DEACTIVATING_CLASS);

    if (event.propertyName === 'opacity' && isDeactivating) {
      classList.remove(ACTIVATE_CLASS, DEACTIVATING_CLASS);
    }
  };

  ngOnDestroy() {
    this._elementRef.nativeElement.removeEventListener('transitionend', this._handleTransitionEnd);
  }
}
