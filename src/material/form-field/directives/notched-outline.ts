/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  NgZone,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';

/**
 * Internal component that creates an instance of the MDC notched-outline component.
 *
 * 创建 MDC 缺口轮廓组件实例的内部组件。
 *
 * The component sets up the HTML structure and styles for the notched-outline. It provides
 * inputs to toggle the notch state and width.
 *
 * 该组件为缺口轮廓设置 HTML 结构和样式。它提供用于切换缺口状态和宽度的输入。
 *
 */
@Component({
  selector: 'div[matFormFieldNotchedOutline]',
  templateUrl: './notched-outline.html',
  host: {
    'class': 'mdc-notched-outline',
    // Besides updating the notch state through the MDC component, we toggle this class through
    // a host binding in order to ensure that the notched-outline renders correctly on the server.
    '[class.mdc-notched-outline--notched]': 'open',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class MatFormFieldNotchedOutline implements AfterViewInit {
  /** Whether the notch should be opened. */
  @Input('matFormFieldNotchedOutlineOpen') open: boolean = false;

  @ViewChild('notch') _notch: ElementRef;

  constructor(private _elementRef: ElementRef<HTMLElement>, private _ngZone: NgZone) {}

  ngAfterViewInit(): void {
    const label = this._elementRef.nativeElement.querySelector<HTMLElement>('.mdc-floating-label');
    if (label) {
      this._elementRef.nativeElement.classList.add('mdc-notched-outline--upgraded');

      if (typeof requestAnimationFrame === 'function') {
        label.style.transitionDuration = '0s';
        this._ngZone.runOutsideAngular(() => {
          requestAnimationFrame(() => (label.style.transitionDuration = ''));
        });
      }
    } else {
      this._elementRef.nativeElement.classList.add('mdc-notched-outline--no-label');
    }
  }

  _setNotchWidth(labelWidth: number) {
    if (!this.open || !labelWidth) {
      this._notch.nativeElement.style.width = '';
    } else {
      const NOTCH_ELEMENT_PADDING = 8;
      const NOTCH_ELEMENT_BORDER = 1;
      this._notch.nativeElement.style.width = `calc(${labelWidth}px * var(--mat-mdc-form-field-floating-label-scale, 0.75) + ${
        NOTCH_ELEMENT_PADDING + NOTCH_ELEMENT_BORDER
      }px)`;
    }
  }
}
