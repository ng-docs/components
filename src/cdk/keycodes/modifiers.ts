/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

export type ModifierKey = 'altKey' | 'shiftKey' | 'ctrlKey' | 'metaKey';

/**
 * Checks whether a modifier key is pressed.
 *
 * 检查是否按下了修饰键。
 *
 * @param event Event to be checked.
 *
 * 要检查的事件。
 *
 */
export function hasModifierKey(event: KeyboardEvent, ...modifiers: ModifierKey[]): boolean {
  if (modifiers.length) {
    return modifiers.some(modifier => event[modifier]);
  }

  return event.altKey || event.shiftKey || event.ctrlKey || event.metaKey;
}
