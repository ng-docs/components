/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ModifierKeys} from '@angular/cdk/testing';

/**
 * Used to generate unique IDs for events.
 *
 * 用于为事件生成唯一 ID。
 *
 */
let uniqueIds = 0;

/**
 * Creates a browser MouseEvent with the specified options.
 *
 * 创建具有指定选项的浏览器的 MouseEvent。
 *
 * @docs-private
 */
export function createMouseEvent(
  type: string,
  clientX = 0,
  clientY = 0,
  offsetX = 1,
  offsetY = 1,
  button = 0,
  modifiers: ModifierKeys = {},
) {
  // Note: We cannot determine the position of the mouse event based on the screen
  // because the dimensions and position of the browser window are not available
  // To provide reasonable `screenX` and `screenY` coordinates, we simply use the
  // client coordinates as if the browser is opened in fullscreen.
  const screenX = clientX;
  const screenY = clientY;

  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    composed: true, // Required for shadow DOM events.
    view: window,
    detail: 0,
    relatedTarget: null,
    screenX,
    screenY,
    clientX,
    clientY,
    ctrlKey: modifiers.control,
    altKey: modifiers.alt,
    shiftKey: modifiers.shift,
    metaKey: modifiers.meta,
    button: button,
    buttons: 1,
  });

  // The `MouseEvent` constructor doesn't allow us to pass these properties into the constructor.
  // Override them to `1`, because they're used for fake screen reader event detection.
  if (offsetX != null) {
    defineReadonlyEventProperty(event, 'offsetX', offsetX);
  }

  if (offsetY != null) {
    defineReadonlyEventProperty(event, 'offsetY', offsetY);
  }

  return event;
}

/**
 * Creates a browser `PointerEvent` with the specified options. Pointer events
 * by default will appear as if they are the primary pointer of their type.
 * https://www.w3.org/TR/pointerevents2/#dom-pointerevent-isprimary.
 *
 * 使用指定的选项创建浏览器的 `PointerEvent`。默认情况下，指针事件将显示为它们类型的主要指针（如左键）。https://www.w3.org/TR/pointerevents2/#dom-pointerevent-isprimary。
 *
 * For example, if pointer events for a multi-touch interaction are created, the non-primary
 * pointer touches would need to be represented by non-primary pointer events.
 *
 * 例如，如果创建了用于多点触摸交互的指针事件，则非主要指针触摸将需要由非主要指针事件表示。
 *
 * @docs-private
 */
export function createPointerEvent(
  type: string,
  clientX = 0,
  clientY = 0,
  offsetX?: number,
  offsetY?: number,
  options: PointerEventInit = {isPrimary: true},
) {
  const event = new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    composed: true, // Required for shadow DOM events.
    view: window,
    clientX,
    clientY,
    ...options,
  });

  if (offsetX != null) {
    defineReadonlyEventProperty(event, 'offsetX', offsetX);
  }

  if (offsetY != null) {
    defineReadonlyEventProperty(event, 'offsetY', offsetY);
  }

  return event;
}

/**
 * Creates a browser TouchEvent with the specified pointer coordinates.
 *
 * 创建具有指定指针坐标的浏览器的 TouchEvent。
 *
 * @docs-private
 */
export function createTouchEvent(type: string, pageX = 0, pageY = 0, clientX = 0, clientY = 0) {
  // We cannot use the `TouchEvent` or `Touch` because Firefox and Safari lack support.
  // TODO: Switch to the constructor API when it is available for Firefox and Safari.
  const event = document.createEvent('UIEvent');
  const touchDetails = {pageX, pageY, clientX, clientY, identifier: uniqueIds++};

  // TS3.6 removes the initUIEvent method and suggests porting to "new UIEvent()".
  (event as any).initUIEvent(type, true, true, window, 0);

  // Most of the browsers don't have a "initTouchEvent" method that can be used to define
  // the touch details.
  defineReadonlyEventProperty(event, 'touches', [touchDetails]);
  defineReadonlyEventProperty(event, 'targetTouches', [touchDetails]);
  defineReadonlyEventProperty(event, 'changedTouches', [touchDetails]);

  return event;
}

/**
 * Creates a keyboard event with the specified key and modifiers.
 *
 * 使用指定的键和修饰键创建键盘事件。
 *
 * @docs-private
 */
export function createKeyboardEvent(
  type: string,
  keyCode: number = 0,
  key: string = '',
  modifiers: ModifierKeys = {},
) {
  return new KeyboardEvent(type, {
    bubbles: true,
    cancelable: true,
    composed: true, // Required for shadow DOM events.
    view: window,
    keyCode: keyCode,
    key: key,
    shiftKey: modifiers.shift,
    metaKey: modifiers.meta,
    altKey: modifiers.alt,
    ctrlKey: modifiers.control,
  });
}

/**
 * Creates a fake event object with any desired event type.
 *
 * 创建具有任何所需事件类型的假事件对象。
 *
 * @docs-private
 */
export function createFakeEvent(type: string, bubbles = false, cancelable = true, composed = true) {
  return new Event(type, {bubbles, cancelable, composed});
}

/**
 * Defines a readonly property on the given event object. Readonly properties on an event object
 * are always set as configurable as that matches default readonly properties for DOM event objects.
 *
 * 在给定的事件对象上定义一个只读属性。事件对象的只读属性始终设置为可配置的，因为它与 DOM 事件对象的默认只读属性匹配。
 *
 */
function defineReadonlyEventProperty(event: Event, propertyName: string, value: any) {
  Object.defineProperty(event, propertyName, {get: () => value, configurable: true});
}
