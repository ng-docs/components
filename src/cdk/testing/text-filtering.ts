/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

/**
 * Gets text of element excluding certain selectors within the element.
 *
 * 获取元素的文本，但要排除元素中的某些选择器。
 *
 * @param element Element to get text from,
 *
 * 要从中获取文字的元素，
 *
 * @param excludeSelector Selector identifying which elements to exclude,
 *
 * 用于识别要排除的元素的选择器，
 *
 */
export function _getTextWithExcludedElements(element: Element, excludeSelector: string) {
  const clone = element.cloneNode(true) as Element;
  const exclusions = clone.querySelectorAll(excludeSelector);
  for (let i = 0; i < exclusions.length; i++) {
    let child = exclusions[i];
    child.parentNode?.removeChild(child);
  }
  return (clone.textContent || '').trim();
}
