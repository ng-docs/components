/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ModifierKeys} from '@angular/cdk/testing';
import {
  createFakeEvent,
  createKeyboardEvent,
  createMouseEvent,
  createPointerEvent,
  createTouchEvent,
} from './event-objects';

/**
 * Utility to dispatch any event on a Node.
 *
 * 在节点上派发任何事件的实用工具。
 *
 * @docs-private
 */
export function dispatchEvent<T extends Event>(node: Node | Window, event: T): T {
  node.dispatchEvent(event);
  return event;
}

/**
 * Shorthand to dispatch a fake event on a specified node.
 *
 * 在指定节点上派发假事件的简写形式。
 *
 * @docs-private
 */
export function dispatchFakeEvent(node: Node | Window, type: string, bubbles?: boolean): Event {
  return dispatchEvent(node, createFakeEvent(type, bubbles));
}

/**
 * Shorthand to dispatch a keyboard event with a specified key code and
 * optional modifiers.
 *
 * 派发带有指定键码和可选修饰符的键盘事件的简写形式。
 *
 * @docs-private
 */
export function dispatchKeyboardEvent(
  node: Node,
  type: string,
  keyCode?: number,
  key?: string,
  modifiers?: ModifierKeys,
): KeyboardEvent {
  return dispatchEvent(node, createKeyboardEvent(type, keyCode, key, modifiers));
}

/**
 * Shorthand to dispatch a mouse event on the specified coordinates.
 *
 * 在指定坐标上派发鼠标事件的简写形式。
 *
 * @docs-private
 */
export function dispatchMouseEvent(
  node: Node,
  type: string,
  clientX = 0,
  clientY = 0,
  button?: number,
  modifiers?: ModifierKeys,
): MouseEvent {
  return dispatchEvent(node, createMouseEvent(type, clientX, clientY, button, modifiers));
}

/**
 * Shorthand to dispatch a pointer event on the specified coordinates.
 *
 * 在指定坐标上派发指针事件的简写形式。
 *
 * @docs-private
 */
export function dispatchPointerEvent(
  node: Node,
  type: string,
  clientX = 0,
  clientY = 0,
  options?: PointerEventInit,
): PointerEvent {
  return dispatchEvent(node, createPointerEvent(type, clientX, clientY, options)) as PointerEvent;
}

/**
 * Shorthand to dispatch a touch event on the specified coordinates.
 *
 * 在指定坐标上派发触摸事件的简写形式。
 *
 * @docs-private
 */
export function dispatchTouchEvent(
  node: Node,
  type: string,
  pageX = 0,
  pageY = 0,
  clientX = 0,
  clientY = 0,
) {
  return dispatchEvent(node, createTouchEvent(type, pageX, pageY, clientX, clientY));
}
