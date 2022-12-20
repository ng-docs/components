/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  ParsedTemplate,
  TmplAstElement,
  TmplAstNode,
  TmplAstTemplate,
  parseTemplate as parseTemplateUsingCompiler,
} from '@angular/compiler';

/**
 * Traverses the given tree of nodes and runs the given callbacks for each Element node encountered.
 *
 * 遍历给定的节点树并对遇到的每个元素节点运行给定的回调。
 *
 * Note that updates to the start tags of html element should be done in the postorder callback,
 * and updates to the end tags of html elements should be done in the preorder callback to avoid
 * issues with line collisions.
 *
 * 请注意，对 html 元素的开始标记的更新应在后序回调中完成，而对 html 元素的结束标记的更新应在前序回调中完成，以避免行冲突问题。
 *
 * @param nodes The nodes of the ast from a parsed template.
 *
 * 来自模板解析结果的 ast 节点。
 *
 * @param preorderCallback A function that gets run for each Element node in a preorder traversal.
 *
 * 要对前序遍历中的每个元素节点运行的函数。
 *
 * @param postorderCallback A function that gets run for each Element node in a postorder traversal.
 *
 * 要对后序遍历中的每个元素节点运行的函数。
 *
 */
export function visitElements(
  nodes: TmplAstNode[],
  preorderCallback: (node: TmplAstElement) => void = () => {},
  postorderCallback: (node: TmplAstElement) => void = () => {},
): void {
  for (let i = nodes.length - 1; i > -1; i--) {
    const node = nodes[i];
    const isElement = node instanceof TmplAstElement;

    if (isElement) {
      preorderCallback(node);
    }

    // Descend both into elements and templates in order to cover cases like `*ngIf` and `*ngFor`.
    if (isElement || node instanceof TmplAstTemplate) {
      visitElements(node.children, preorderCallback, postorderCallback);
    }

    if (isElement) {
      postorderCallback(node);
    }
  }
}

/**
 * A wrapper for the Angular compilers parseTemplate, which passes the correct options to ensure
 * the parsed template is accurate.
 *
 * Angular 编译器 parseTemplate 的包装器，它传递正确的选项以确保解析出的模板是准确的。
 *
 * For more details, see https://github.com/angular/angular/blob/4332897baa2226ef246ee054fdd5254e3c129109/packages/compiler-cli/src/ngtsc/annotations/component/src/resources.ts#L230.
 *
 * @param template text of the template to parse
 *
 * 要解析的模板文本
 * @param templateUrl URL to use for source mapping of the parsed template
 *
 * 用于已解析模板的源码映射 URL
 * @returns
 *
 * the updated template html.
 *
 * 更新后的模板 html。
 */
export function parseTemplate(template: string, templateUrl: string = ''): ParsedTemplate {
  return parseTemplateUsingCompiler(template, templateUrl, {
    preserveWhitespaces: true,
    preserveLineEndings: true,
    leadingTriviaChars: [],
  });
}

/**
 * Replaces the start tag of the given Element node inside of the html document with a new tag name.
 *
 * 用新的标签名称替换 html 文档中给定 Element 节点的起始标签。
 *
 * @param html The full html document.
 *
 * 完整的 html 文档。
 *
 * @param node The Element node to be updated.
 *
 * 要更新的元素节点。
 *
 * @param tag A new tag name.
 *
 * 一个新的标签名称。
 *
 * @returns
 *
 * an updated html document.
 *
 * 更新后的 html 文档。
 *
 */
export function replaceStartTag(html: string, node: TmplAstElement, tag: string): string {
  return replaceAt(html, node.startSourceSpan.start.offset + 1, node.name, tag);
}

/**
 * Replaces the end tag of the given Element node inside of the html document with a new tag name.
 *
 * 用新的标签名称替换 html 文档内给定 Element 节点的结束标签。
 *
 * @param html The full html document.
 *
 * 完整的 html 文档。
 *
 * @param node The Element node to be updated.
 *
 * 要更新的元素节点。
 *
 * @param tag A new tag name.
 *
 * 一个新的标签名称。
 *
 * @returns
 *
 * an updated html document.
 *
 * 更新后的 html 文档。
 *
 */
export function replaceEndTag(html: string, node: TmplAstElement, tag: string): string {
  if (!node.endSourceSpan) {
    return html;
  }
  return replaceAt(html, node.endSourceSpan.start.offset + 2, node.name, tag);
}

/**
 * Appends an attribute to the given node of the template html.
 *
 * 将属性附加到此模板 html 的给定节点。
 *
 * @param html The template html to be updated.
 *
 * 要更新的模板 html。
 *
 * @param node The node to be updated.
 *
 * 要更新的节点。
 *
 * @param name The name of the attribute.
 *
 * 此属性的名称。
 *
 * @param update The function that determines how to update the value.
 *
 * 确定如何更新这个值的函数。
 *
 * @returns
 *
 * The updated template html.
 *
 * 更新后的模板 html。
 *
 */
export function updateAttribute(
  html: string,
  node: TmplAstElement,
  name: string,
  update: (old: string | null) => string | null,
): string {
  const existingAttr = node.attributes.find(currentAttr => currentAttr.name === name);

  // If the attribute has a value already, replace it.
  if (existingAttr && existingAttr.keySpan) {
    const updatedValue = update(existingAttr.valueSpan?.toString() || '');
    if (updatedValue == null) {
      // Delete attribute
      return (
        html.slice(0, existingAttr.sourceSpan.start.offset).trimEnd() +
        html.slice(existingAttr.sourceSpan.end.offset)
      );
    } else if (updatedValue == '') {
      // Delete value from attribute
      return (
        html.slice(0, existingAttr.keySpan.end.offset) +
        html.slice(existingAttr.sourceSpan.end.offset)
      );
    } else {
      // Set attribute value
      if (existingAttr.valueSpan) {
        // Replace attribute value
        return (
          html.slice(0, existingAttr.valueSpan.start.offset) +
          updatedValue +
          html.slice(existingAttr.valueSpan.end.offset)
        );
      } else {
        // Add value to attribute
        return (
          html.slice(0, existingAttr.keySpan.end.offset) +
          `="${updatedValue}"` +
          html.slice(existingAttr.keySpan.end.offset)
        );
      }
    }
  }

  const newValue = update(null);

  // No change needed if attribute should be deleted and is already not present.
  if (newValue == null) {
    return html;
  }

  // Otherwise insert a new attribute.
  const index = node.startSourceSpan.start.offset + node.name.length + 1;
  const prefix = html.slice(0, index);
  const suffix = html.slice(index);
  const attrText = newValue ? `${name}="${newValue}"` : `${name}`;
  const indentation = parseIndentation(html, node);
  return prefix + indentation + attrText + suffix;
}

function parseIndentation(html: string, node: TmplAstElement): string {
  let whitespace = '';
  let startOffset = node.startSourceSpan.start.offset + node.name.length + 1;

  // Starting after the start source span's tagname,
  // read and store each char until we reach a non-whitespace char.

  for (let i = startOffset; i < node.startSourceSpan.end.offset - 1; i++) {
    if (!/\s/.test(html.charAt(i))) {
      break;
    }
    whitespace += html.charAt(i);
  }
  return whitespace || ' ';
}

/**
 * Replaces a substring of a given string starting at some offset index.
 *
 * 从某个偏移索引开始替换给定字符串的子字符串。
 *
 * @param str A string to be updated.
 *
 * 要更新的字符串。
 *
 * @param offset An offset index to start at.
 *
 * 起始的偏移索引。
 *
 * @param oldSubstr The old substring to be replaced.
 *
 * 要替换的旧子字符串。
 *
 * @param newSubstr A new substring.
 *
 * 一个新的子字符串。
 *
 * @returns
 *
 * the updated string.
 *
 * 更新后的字符串。
 *
 */
function replaceAt(str: string, offset: number, oldSubstr: string, newSubstr: string): string {
  const index = offset;
  const prefix = str.slice(0, index);
  const suffix = str.slice(index + oldSubstr.length);
  return prefix + newSubstr + suffix;
}
