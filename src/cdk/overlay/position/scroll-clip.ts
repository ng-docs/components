/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

// TODO(jelbourn): move this to live with the rest of the scrolling code
// TODO(jelbourn): someday replace this with IntersectionObservers

/**
 * Equivalent of `ClientRect` without some of the properties we don't care about.
 *
 * 相当于 `ClientRect`，但没有我们不关心的一些属性。
 *
 */
type Dimensions = Omit<ClientRect, 'x' | 'y' | 'toJSON'>;

/**
 * Gets whether an element is scrolled outside of view by any of its parent scrolling containers.
 *
 * 获取一个元素是否被其任何父级滚动容器滚动到了视图之外。
 *
 * @param element Dimensions of the element \(from getBoundingClientRect\)
 *
 * 元素的规格（来自 getBoundingClientRect）
 *
 * @param scrollContainers Dimensions of element's scrolling containers \(from getBoundingClientRect\)
 *
 * 元素的滚动容器的规格（来自 getBoundingClientRect）
 *
 * @returns Whether the element is scrolled out of view
 *
 * 元素是否滚动到了视野之外
 * @docs-private
 */
export function isElementScrolledOutsideView(element: Dimensions, scrollContainers: Dimensions[]) {
  return scrollContainers.some(containerBounds => {
    const outsideAbove = element.bottom < containerBounds.top;
    const outsideBelow = element.top > containerBounds.bottom;
    const outsideLeft = element.right < containerBounds.left;
    const outsideRight = element.left > containerBounds.right;

    return outsideAbove || outsideBelow || outsideLeft || outsideRight;
  });
}

/**
 * Gets whether an element is clipped by any of its scrolling containers.
 *
 * 获取元素是否被其任何滚动容器剪切。
 *
 * @param element Dimensions of the element \(from getBoundingClientRect\)
 *
 * 元素的规格（来自 getBoundingClientRect）
 *
 * @param scrollContainers Dimensions of element's scrolling containers \(from getBoundingClientRect\)
 *
 * 元素的滚动容器的规格（来自 getBoundingClientRect）
 *
 * @returns Whether the element is clipped
 *
 * 元素是否被裁剪
 * @docs-private
 */
export function isElementClippedByScrolling(element: Dimensions, scrollContainers: Dimensions[]) {
  return scrollContainers.some(scrollContainerRect => {
    const clippedAbove = element.top < scrollContainerRect.top;
    const clippedBelow = element.bottom > scrollContainerRect.bottom;
    const clippedLeft = element.left < scrollContainerRect.left;
    const clippedRight = element.right > scrollContainerRect.right;

    return clippedAbove || clippedBelow || clippedLeft || clippedRight;
  });
}
