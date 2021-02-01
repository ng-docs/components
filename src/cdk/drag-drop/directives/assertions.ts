/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

/**
 * Asserts that a particular node is an element.
 *
 * 断言特定节点是元素。
 *
 * @param node Node to be checked.
 *
 * 要检查的节点。
 *
 * @param name Name to attach to the error message.
 *
 * 附加到错误消息的名称。
 *
 */
export function assertElementNode(node: Node, name: string): asserts node is HTMLElement {
  if (node.nodeType !== 1) {
    throw Error(`${name} must be attached to an element node. ` +
                `Currently attached to "${node.nodeName}".`);
  }
}
