/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

/**
 * Throws an exception for the case when menu trigger doesn't have a valid mat-menu instance
 *
 * 当菜单触发器没有一个有效的菜单菜单实例时会抛出异常
 *
 * @docs-private
 */
export function throwMatMenuMissingError() {
  throw Error(`matMenuTriggerFor: must pass in an mat-menu instance.

    Example:
      <mat-menu #menu="matMenu"></mat-menu>
      <button [matMenuTriggerFor]="menu"></button>`);
}

/**
 * Throws an exception for the case when menu's x-position value isn't valid.
 * In other words, it doesn't match 'before' or 'after'.
 *
 * 当菜单的 x 位置值无效时会抛出异常。换句话说，它不是 'before' 或 'after' 之一。
 *
 * @docs-private
 */
export function throwMatMenuInvalidPositionX() {
  throw Error(`xPosition value must be either 'before' or after'.
      Example: <mat-menu xPosition="before" #menu="matMenu"></mat-menu>`);
}

/**
 * Throws an exception for the case when menu's y-position value isn't valid.
 * In other words, it doesn't match 'above' or 'below'.
 *
 * 当菜单的 y 位值无效时会抛出异常。它不是 'before' 或 'after' 之一。
 *
 * @docs-private
 */
export function throwMatMenuInvalidPositionY() {
  throw Error(`yPosition value must be either 'above' or below'.
      Example: <mat-menu yPosition="above" #menu="matMenu"></mat-menu>`);
}

/**
 * Throws an exception for the case when a menu is assigned
 * to a trigger that is placed inside the same menu.
 *
 * 当菜单被赋值给位于同一个菜单里面的触发器时会抛出异常。
 *
 * @docs-private
 */
export function throwMatMenuRecursiveError() {
  throw Error(`matMenuTriggerFor: menu cannot contain its own trigger. Assign a menu that is ` +
              `not a parent of the trigger or move the trigger outside of the menu.`);
}
