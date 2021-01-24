/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

/** Gets a mutable version of an element's bounding `ClientRect`. */
export function getMutableClientRect(element: Element): ClientRect {
  const clientRect = element.getBoundingClientRect();

  // We need to clone the `clientRect` here, because all the values on it are readonly
  // and we need to be able to update them. Also we can't use a spread here, because
  // the values on a `ClientRect` aren't own properties. See:
  // https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect#Notes
  return {
    top: clientRect.top,
    right: clientRect.right,
    bottom: clientRect.bottom,
    left: clientRect.left,
    width: clientRect.width,
    height: clientRect.height
  };
}

/**
 * Checks whether some coordinates are within a `ClientRect`.
 *
 * 检查某些坐标是否在 `ClientRect` 中。
 *
 * @param clientRect ClientRect that is being checked.
 *
 * 正在检查的 ClientRect。
 *
 * @param x Coordinates along the X axis.
 *
 * X 坐标。
 *
 * @param y Coordinates along the Y axis.
 *
 * Y 坐标。
 *
 */
export function isInsideClientRect(clientRect: ClientRect, x: number, y: number) {
  const {top, bottom, left, right} = clientRect;
  return y >= top && y <= bottom && x >= left && x <= right;
}

/**
 * Updates the top/left positions of a `ClientRect`, as well as their bottom/right counterparts.
 *
 * 更新 `ClientRect` 的左上/右上位置，以及它们下/右的相对位置。
 *
 * @param clientRect `ClientRect` that should be updated.
 *
 * 要更新的 `ClientRect`
 *
 * @param top Amount to add to the `top` position.
 *
 * 要添加到 `top` 位置的值。
 *
 * @param left Amount to add to the `left` position.
 *
 * 要添加到 `left` 位置的值。
 *
 */
export function adjustClientRect(clientRect: ClientRect, top: number, left: number) {
  clientRect.top += top;
  clientRect.bottom = clientRect.top + clientRect.height;

  clientRect.left += left;
  clientRect.right = clientRect.left + clientRect.width;
}

/**
 * Checks whether the pointer coordinates are close to a ClientRect.
 *
 * 检查指针坐标是否靠近 ClientRect。
 *
 * @param rect ClientRect to check against.
 *
 * 要检查的 ClientRect。
 *
 * @param threshold Threshold around the ClientRect.
 *
 * ClientRect 周围的容差。
 *
 * @param pointerX Coordinates along the X axis.
 *
 * X 坐标。
 *
 * @param pointerY Coordinates along the Y axis.
 *
 * Y 坐标。
 *
 */
export function isPointerNearClientRect(rect: ClientRect,
                                        threshold: number,
                                        pointerX: number,
                                        pointerY: number): boolean {
  const {top, right, bottom, left, width, height} = rect;
  const xThreshold = width * threshold;
  const yThreshold = height * threshold;

  return pointerY > top - yThreshold && pointerY < bottom + yThreshold &&
         pointerX > left - xThreshold && pointerX < right + xThreshold;
}
