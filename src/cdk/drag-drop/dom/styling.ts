/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

/**
 * Extended CSSStyleDeclaration that includes a couple of drag-related
 * properties that aren't in the built-in TS typings.
 *
 * 扩展的 CSSStyleDeclaration，它包含一些不在内置 TS 类型中的与拖曳相关的属性。
 *
 */
export interface DragCSSStyleDeclaration extends CSSStyleDeclaration {
  msScrollSnapType: string;
  scrollSnapType: string;
  webkitTapHighlightColor: string;
}

/**
 * Shallow-extends a stylesheet object with another stylesheet-like object.
 * Note that the keys in `source` have to be dash-cased.
 *
 * 用另一个样式表对象浅扩展样式表对象。注意，`source` 中的键名必须是中线分隔的。
 *
 * @docs-private
 */
export function extendStyles(
  dest: CSSStyleDeclaration,
  source: Record<string, string>,
  importantProperties?: Set<string>,
) {
  for (let key in source) {
    if (source.hasOwnProperty(key)) {
      const value = source[key];

      if (value) {
        dest.setProperty(key, value, importantProperties?.has(key) ? 'important' : '');
      } else {
        dest.removeProperty(key);
      }
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
    'touch-action': enable ? '' : 'none',
    '-webkit-user-drag': enable ? '' : 'none',
    '-webkit-tap-highlight-color': enable ? '' : 'transparent',
    'user-select': userSelect,
    '-ms-user-select': userSelect,
    '-webkit-user-select': userSelect,
    '-moz-user-select': userSelect,
  });
}

/**
 * Toggles whether an element is visible while preserving its dimensions.
 *
 * 在保留元素规格的同时，切换元素是否可见。
 *
 * @param element Element whose visibility to toggle
 *
 * 要切换可见性的元素
 *
 * @param enable Whether the element should be visible.
 *
 * 该元素是否可见。
 *
 * @param importantProperties Properties to be set as `!important`.
 *
 * 要设置为 `!important` 的属性。
 *
 * @docs-private
 */
export function toggleVisibility(
  element: HTMLElement,
  enable: boolean,
  importantProperties?: Set<string>,
) {
  extendStyles(
    element.style,
    {
      position: enable ? '' : 'fixed',
      top: enable ? '' : '0',
      opacity: enable ? '' : '0',
      left: enable ? '' : '-999em',
    },
    importantProperties,
  );
}

/**
 * Combines a transform string with an optional other transform
 * that exited before the base transform was applied.
 *
 * 将转换字符串与另一个会在应用基本转换之前退出的可选转换组合起来。
 *
 */
export function combineTransforms(transform: string, initialTransform?: string): string {
  return initialTransform && initialTransform != 'none'
    ? transform + ' ' + initialTransform
    : transform;
}
