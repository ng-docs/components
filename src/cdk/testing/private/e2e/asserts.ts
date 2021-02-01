/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {browser} from 'protractor';
import {getElement, FinderResult, waitForElement} from './query';
import {Point} from './actions';

/**
 * Asserts that an element exists.
 *
 * 断言某个元素存在。
 *
 */
export async function expectToExist(selector: string, expected = true) {
  await waitForElement(selector).then((isPresent: boolean) => {
    expect(isPresent).toBe(expected, `Expected "${selector}"${expected ? '' : ' not'} to exist`);
  });
}

/**
 * Asserts that an element is focused.
 *
 * 断言某个元素拥有焦点。
 *
 */
export async function expectFocusOn(element: FinderResult, expected = true) {
  expect(await browser.driver.switchTo().activeElement().getId()).toBe(
    await getElement(element).getId(), `Expected element${expected ? '' : ' not'} to be focused.`);
}

/**
 * Asserts that an element has a certain location.
 *
 * 断言元素占有特定的位置。
 *
 */
export async function expectLocation(element: FinderResult, {x, y}: Point) {
  await getElement(element).getLocation().then((location: Point) => {
    expect(Math.round(location.x)).toEqual(Math.round(x));
    expect(Math.round(location.y)).toEqual(Math.round(y));
  });
}

/**
 * Asserts that one element is aligned with another.
 *
 * 断言一个元素与另一个元素对齐。
 *
 */
export async function expectAlignedWith(element: FinderResult, otherElement: FinderResult) {
  await getElement(otherElement).getLocation().then((location: Point) => {
    expectLocation(getElement(element), location);
  });
}
