/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

/**
 * Screenreaders will often fire fake mousedown events when a focusable element
 * is activated using the keyboard. We can typically distinguish between these faked
 * mousedown events and real mousedown events using the "buttons" property. While
 * real mousedowns will indicate the mouse button that was pressed (e.g. "1" for
 * the left mouse button), faked mousedowns will usually set the property value to 0.
 *
 * 当使用键盘激活可获得焦点的元素时，屏幕阅读器通常会触发一个伪 mousedown 事件。我们通常可以使用 “buttons” 属性来区分这些伪 mousedown 事件和真实的 mousedown 事件。真实的 mousedown 会指出被按下的鼠标按键（比如鼠标左键是“1”），而伪造的 mousedown 通常会把该属性值设置为 0。
 *
 */
export function isFakeMousedownFromScreenReader(event: MouseEvent): boolean {
  return event.buttons === 0;
}
