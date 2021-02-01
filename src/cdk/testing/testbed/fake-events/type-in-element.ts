/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ModifierKeys} from '@angular/cdk/testing';
import {dispatchFakeEvent, dispatchKeyboardEvent} from './dispatch-events';
import {triggerFocus} from './element-focus';

/**
 * Checks whether the given Element is a text input element.
 *
 * 检查给定的元素是否文本输入元素。
 *
 * @docs-private
 */
export function isTextInput(element: Element): element is HTMLInputElement | HTMLTextAreaElement {
  const nodeName = element.nodeName.toLowerCase();
  return nodeName === 'input' || nodeName === 'textarea' ;
}

/**
 * Focuses an input, sets its value and dispatches
 * the `input` event, simulating the user typing.
 *
 * 让输入获得焦点，设置其值并分派 `input` 事件，以模拟用户键入。
 *
 * @param element Element onto which to set the value.
 *
 * 要在其上设置值的元素。
 *
 * @param keys The keys to send to the element.
 *
 * 要发送到此元素的按键。
 *
 * @docs-private
 */
export function typeInElement(
    element: HTMLElement, ...keys: (string | {keyCode?: number, key?: string})[]): void;

/**
 * Focuses an input, sets its value and dispatches
 * the `input` event, simulating the user typing.
 *
 * 让输入获得焦点，设置其值并派发 `input` 事件，以模拟用户键入。
 *
 * @param element Element onto which to set the value.
 *
 * 要在其上设置值的元素。
 *
 * @param modifiers Modifier keys that are held while typing.
 *
 * 键入时按住的修饰键。
 *
 * @param keys The keys to send to the element.
 *
 * 要发送到元素的按键。
 *
 * @docs-private
 */
export function typeInElement(element: HTMLElement, modifiers: ModifierKeys,
                              ...keys: (string | {keyCode?: number, key?: string})[]): void;

export function typeInElement(element: HTMLElement, ...modifiersAndKeys: any) {
  const first = modifiersAndKeys[0];
  let modifiers: ModifierKeys;
  let rest: (string | {keyCode?: number, key?: string})[];
  if (typeof first !== 'string' && first.keyCode === undefined && first.key === undefined) {
    modifiers = first;
    rest = modifiersAndKeys.slice(1);
  } else {
    modifiers = {};
    rest = modifiersAndKeys;
  }
  const keys: {keyCode?: number, key?: string}[] = rest
      .map(k => typeof k === 'string' ?
          k.split('').map(c => ({keyCode: c.toUpperCase().charCodeAt(0), key: c})) : [k])
      .reduce((arr, k) => arr.concat(k), []);

  triggerFocus(element);
  for (const key of keys) {
    dispatchKeyboardEvent(element, 'keydown', key.keyCode, key.key, modifiers);
    dispatchKeyboardEvent(element, 'keypress', key.keyCode, key.key, modifiers);
    if (isTextInput(element) && key.key && key.key.length === 1) {
      element.value += key.key;
      dispatchFakeEvent(element, 'input');
    }
    dispatchKeyboardEvent(element, 'keyup', key.keyCode, key.key, modifiers);
  }
}

/**
 * Clears the text in an input or textarea element.
 *
 * 清除 input 或 textarea 元素中的文本。
 *
 * @docs-private
 */
export function clearElement(element: HTMLInputElement | HTMLTextAreaElement) {
  triggerFocus(element as HTMLElement);
  element.value = '';
  dispatchFakeEvent(element, 'input');
}
