/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {browser, by, element, ElementFinder} from 'protractor';
import {Point} from './actions';

/**
 * Normalizes either turning a selector into an
 * ElementFinder or returning the finder itself.
 *
 * 规范化将选择器变成 ElementFinder 或返回查找器本身。
 *
 */
export function getElement(el: FinderResult): ElementFinder {
  return typeof el === 'string' ? element(by.css(el)) : el;
}

/**
 * Waits for an element to be rendered.
 *
 * 等待元素被渲染。
 *
 */
export async function waitForElement(selector: string) {
  return await browser.isElementPresent(by.css(selector));
}

/**
 * Determines the current scroll position of the page.
 *
 * 确定页面的当前滚动位置。
 *
 */
export async function getScrollPosition(): Promise<Point> {
  const snippet = `
    var documentRect = document.documentElement.getBoundingClientRect();
    var x = -documentRect.left || document.body.scrollLeft || window.scrollX ||
             document.documentElement.scrollLeft || 0;
    var y = -documentRect.top || document.body.scrollTop || window.scrollY ||
             document.documentElement.scrollTop || 0;

    return {x: x, y: y};
  `;

  return await browser.executeScript<Point>(snippet);
}

export type FinderResult = ElementFinder | string;
