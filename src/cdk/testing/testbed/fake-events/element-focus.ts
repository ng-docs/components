/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {dispatchFakeEvent} from './dispatch-events';

function triggerFocusChange(element: HTMLElement, event: 'focus' | 'blur') {
  let eventFired = false;
  const handler = () => eventFired = true;
  element.addEventListener(event, handler);
  element[event]();
  element.removeEventListener(event, handler);
  if (!eventFired) {
    dispatchFakeEvent(element, event);
  }
}

/**
 * Patches an elements focus and blur methods to emit events consistently and predictably.
 * This is necessary, because some browsers, like IE11, will call the focus handlers asynchronously,
 * while others won't fire them at all if the browser window is not focused.
 *
 * Patch 元素的 focus 和 blur 方法，以便一致且可预测地发出事件。这是必要的，因为某些浏览器（例如 IE11）将异步调用 focus 处理程序，而如果浏览器窗口未处于焦点状态，其他浏览器根本就不会触发它们。
 *
 * @docs-private
 */
export function patchElementFocus(element: HTMLElement) {
  element.focus = () => dispatchFakeEvent(element, 'focus');
  element.blur = () => dispatchFakeEvent(element, 'blur');
}

/** @docs-private */
export function triggerFocus(element: HTMLElement) {
  triggerFocusChange(element, 'focus');
}

/** @docs-private */
export function triggerBlur(element: HTMLElement) {
  triggerFocusChange(element, 'blur');
}
