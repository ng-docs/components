/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

/**
 * Throws an exception when an instance of the PointerFocusTracker is not provided.
 *
 * 当未提供 PointerFocusTracker 的实例时引发异常。
 *
 * @docs-private
 */
export function throwMissingPointerFocusTracker() {
  throw Error('expected an instance of PointerFocusTracker to be provided');
}

/**
 * Throws an exception when a reference to the parent menu is not provided.
 *
 * 未提供对父菜单的引用时引发异常。
 *
 * @docs-private
 */
export function throwMissingMenuReference() {
  throw Error('expected a reference to the parent menu');
}
