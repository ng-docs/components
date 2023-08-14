/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

/**
 * IDs are delimited by an empty space, as per the spec.
 *
 * 根据规范，ID 由空格分隔。
 *
 */
const ID_DELIMITER = ' ';

/**
 * Adds the given ID to the specified ARIA attribute on an element.
 * Used for attributes such as aria-labelledby, aria-owns, etc.
 *
 * 将指定 ID 添加到元素上特定的 ARIA 属性上。用于诸如 aria-labelledby，aria-owns 等属性。
 *
 */
export function addAriaReferencedId(el: Element, attr: `aria-${string}`, id: string) {
  const ids = getAriaReferenceIds(el, attr);
  if (ids.some(existingId => existingId.trim() == id.trim())) {
    return;
  }
  ids.push(id.trim());

  el.setAttribute(attr, ids.join(ID_DELIMITER));
}

/**
 * Removes the given ID from the specified ARIA attribute on an element.
 * Used for attributes such as aria-labelledby, aria-owns, etc.
 *
 * 从元素上指定的 ARIA 属性中删除特定的 ID。用于诸如 aria-labelledby，aria-owns 等属性。
 *
 */
export function removeAriaReferencedId(el: Element, attr: `aria-${string}`, id: string) {
  const ids = getAriaReferenceIds(el, attr);
  const filteredIds = ids.filter(val => val != id.trim());

  if (filteredIds.length) {
    el.setAttribute(attr, filteredIds.join(ID_DELIMITER));
  } else {
    el.removeAttribute(attr);
  }
}

/**
 * Gets the list of IDs referenced by the given ARIA attribute on an element.
 * Used for attributes such as aria-labelledby, aria-owns, etc.
 *
 * 获取元素上指定的 ARIA 属性引用的 ID 列表。用于诸如 aria-labelledby，aria-owns 等属性。
 *
 */
export function getAriaReferenceIds(el: Element, attr: string): string[] {
  // Get string array of all individual ids (whitespace delimited) in the attribute value
  return (el.getAttribute(attr) || '').match(/\S+/g) || [];
}
