/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {parseFragment} from 'parse5';
import {ChildNode, Element} from '../../utils';

/**
 * Parses a HTML fragment and traverses all AST nodes in order find elements that
 * include the specified attribute.
 *
 * 解析 HTML 片段并遍历所有 AST 节点，以查找包含指定属性的元素。
 *
 */
export function findElementsWithAttribute(html: string, attributeName: string) {
  const document = parseFragment(html, {sourceCodeLocationInfo: true});
  const elements: Element[] = [];

  const visitNodes = (nodes: ChildNode[]) => {
    nodes.forEach(n => {
      const node = n as Element;

      if (node.childNodes) {
        visitNodes(node.childNodes);
      }

      if (node.attrs?.some(attr => attr.name === attributeName.toLowerCase())) {
        elements.push(node);
      }
    });
  };

  visitNodes(document.childNodes);

  return elements;
}

/**
 * Finds elements with explicit tag names that also contain the specified attribute. Returns the
 * attribute start offset based on the specified HTML.
 *
 * 查找具有显式标签名称的元素，该名称也包含指定的属性。根据指定的 HTML 返回属性起始偏移量。
 *
 */
export function findAttributeOnElementWithTag(html: string, name: string, tagNames: string[]) {
  return findElementsWithAttribute(html, name)
    .filter(element => tagNames.includes(element.tagName))
    .map(element => getStartOffsetOfAttribute(element, name));
}

/**
 * Finds elements that contain the given attribute and contain at least one of the other
 * specified attributes. Returns the primary attribute's start offset based on the specified HTML.
 *
 * 查找包含给定属性且包含至少一个其他指定属性的元素。根据指定的 HTML 返回主要属性的起始偏移量。
 *
 */
export function findAttributeOnElementWithAttrs(html: string, name: string, attrs: string[]) {
  return findElementsWithAttribute(html, name)
    .filter(element => attrs.some(attr => hasElementAttribute(element, attr)))
    .map(element => getStartOffsetOfAttribute(element, name));
}

/**
 * Shorthand function that checks if the specified element contains the given attribute.
 *
 * 检查指定元素是否包含给定属性的简写函数。
 *
 */
function hasElementAttribute(element: Element, attributeName: string): boolean {
  return element.attrs && element.attrs.some(attr => attr.name === attributeName.toLowerCase());
}

/**
 * Gets the start offset of the given attribute from a Parse5 element.
 *
 * 从 Parse5 元素获取给定属性的起始偏移量。
 *
 */
export function getStartOffsetOfAttribute(element: any, attributeName: string): number {
  return element.sourceCodeLocation.attrs[attributeName.toLowerCase()].startOffset;
}
