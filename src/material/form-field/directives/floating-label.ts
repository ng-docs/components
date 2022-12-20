/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Directive, ElementRef, Input} from '@angular/core';

/**
 * Internal directive that maintains a MDC floating label. This directive does not
 * use the `MDCFloatingLabelFoundation` class, as it is not worth the size cost of
 * including it just to measure the label width and toggle some classes.
 *
 * 维护 MDC 浮动标签的内部指令。该指令不使用 `MDCFloatingLabelFoundation` 类，因为仅仅为了测量标签宽度和切换某些类而包含它的大小成本不太值得。
 *
 * The use of a directive allows us to conditionally render a floating label in the
 * template without having to manually manage instantiation and destruction of the
 * floating label component based on.
 *
 * 指令的使用允许我们有条件地在模板中渲染浮动标签，而无需手动管理基于浮动标签组件的实例化和销毁。
 *
 * The component is responsible for setting up the floating label styles, measuring label
 * width for the outline notch, and providing inputs that can be used to toggle the
 * label's floating or required state.
 *
 * 该组件负责设置浮动标签样式，测量轮廓槽口的标签宽度，并提供可用于切换此标签的浮动性或所需状态的输入。
 *
 */
@Directive({
  selector: 'label[matFormFieldFloatingLabel]',
  host: {
    'class': 'mdc-floating-label mat-mdc-floating-label',
    '[class.mdc-floating-label--float-above]': 'floating',
  },
})
export class MatFormFieldFloatingLabel {
  /**
   * Whether the label is floating.
   *
   * 此标签是否浮动。
   *
   */
  @Input() floating: boolean = false;

  constructor(private _elementRef: ElementRef<HTMLElement>) {}

  /**
   * Gets the width of the label. Used for the outline notch.
   *
   * 获取此标签的宽度。用于轮廓槽口。
   *
   */
  getWidth(): number {
    return estimateScrollWidth(this._elementRef.nativeElement);
  }

  /**
   * Gets the HTML element for the floating label.
   *
   * 获取此浮动标签的 HTML 元素。
   *
   */
  get element(): HTMLElement {
    return this._elementRef.nativeElement;
  }
}

/**
 * Estimates the scroll width of an element.
 * via https://github.com/material-components/material-components-web/blob/c0a11ef0d000a098fd0c372be8f12d6a99302855/packages/mdc-dom/ponyfill.ts
 *
 */
function estimateScrollWidth(element: HTMLElement): number {
  // Check the offsetParent. If the element inherits display: none from any
  // parent, the offsetParent property will be null (see
  // https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetParent).
  // This check ensures we only clone the node when necessary.
  const htmlEl = element as HTMLElement;
  if (htmlEl.offsetParent !== null) {
    return htmlEl.scrollWidth;
  }

  const clone = htmlEl.cloneNode(true) as HTMLElement;
  clone.style.setProperty('position', 'absolute');
  clone.style.setProperty('transform', 'translate(-9999px, -9999px)');
  document.documentElement.appendChild(clone);
  const scrollWidth = clone.scrollWidth;
  clone.remove();
  return scrollWidth;
}
