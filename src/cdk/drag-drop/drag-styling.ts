/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

// Helper type that ignores `readonly` properties. This is used in
// `extendStyles` to ignore the readonly properties on CSSStyleDeclaration
// since we won't be touching those anyway.
type Writeable<T> = { -readonly [P in keyof T]-?: T[P] };

/**
 * Extended CSSStyleDeclaration that includes a couple of drag-related
 * properties that aren't in the built-in TS typings.
 *
 * 扩展的 CSSStyleDeclaration，它包含一些不在内置 TS 类型中的与拖曳相关的属性。
 *
 */
export interface DragCSSStyleDeclaration extends CSSStyleDeclaration {
  webkitUserDrag: string;
  MozUserSelect: string; // For some reason the Firefox property is in PascalCase.
  msScrollSnapType: string;
  scrollSnapType: string;
  msUserSelect: string;
}

/**
 * Shallow-extends a stylesheet object with another stylesheet object.
 *
 * 用另一个样式表对象浅扩展样式表对象。
 *
 * @docs-private
 */
export function extendStyles(
    dest: Writeable<CSSStyleDeclaration>,
    source: Partial<DragCSSStyleDeclaration>) {
  for (let key in source) {
    if (source.hasOwnProperty(key)) {
      dest[key] = source[key]!;
    }
  }

  return dest;
}

/**
 * Toggles whether the native drag interactions should be enabled for an element.
 *
 * 切换是否应为某个元素启用原生拖曳交互。
 *
 * @param element Element on which to toggle the drag interactions.
 *
 * 要在其上切换拖动交互的元素。
 *
 * @param enable Whether the drag interactions should be enabled.
 *
 * 是否应该启用拖动交互。
 *
 * @docs-private
 */
export function toggleNativeDragInteractions(element: HTMLElement, enable: boolean) {
  const userSelect = enable ? '' : 'none';

  extendStyles(element.style, {
    touchAction: enable ? '' : 'none',
    webkitUserDrag: enable ? '' : 'none',
    webkitTapHighlightColor: enable ? '' : 'transparent',
    userSelect: userSelect,
    msUserSelect: userSelect,
    webkitUserSelect: userSelect,
    MozUserSelect: userSelect
  });
}

/**
 * Toggles whether an element is visible while preserving its dimensions.
 *
 * 在保留元素尺寸的同时，切换元素是否可见。
 *
 * @param element Element whose visibility to toggle
 *
 * 要切换可见性的元素
 *
 * @param enable Whether the element should be visible.
 *
 * 该元素是否可见。
 *
 * @docs-private
 */
export function toggleVisibility(element: HTMLElement, enable: boolean) {
  const styles = element.style;
  styles.position = enable ? '' : 'fixed';
  styles.top = styles.opacity = enable ? '' : '0';
  styles.left = enable ? '' : '-999em';
}
