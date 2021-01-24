/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

/**
 * Parses a CSS time value to milliseconds.
 *
 * 把 CSS 时间值解析成毫秒数。
 *
 */
function parseCssTimeUnitsToMs(value: string): number {
  // Some browsers will return it in seconds, whereas others will return milliseconds.
  const multiplier = value.toLowerCase().indexOf('ms') > -1 ? 1 : 1000;
  return parseFloat(value) * multiplier;
}

/**
 * Gets the transform transition duration, including the delay, of an element in milliseconds.
 *
 * 获取一个元素上变换样式的过渡时间（包括延迟），单位为毫秒。
 *
 */
export function getTransformTransitionDurationInMs(element: HTMLElement): number {
  const computedStyle = getComputedStyle(element);
  const transitionedProperties = parseCssPropertyValue(computedStyle, 'transition-property');
  const property = transitionedProperties.find(prop => prop === 'transform' || prop === 'all');

  // If there's no transition for `all` or `transform`, we shouldn't do anything.
  if (!property) {
    return 0;
  }

  // Get the index of the property that we're interested in and match
  // it up to the same index in `transition-delay` and `transition-duration`.
  const propertyIndex = transitionedProperties.indexOf(property);
  const rawDurations = parseCssPropertyValue(computedStyle, 'transition-duration');
  const rawDelays = parseCssPropertyValue(computedStyle, 'transition-delay');

  return parseCssTimeUnitsToMs(rawDurations[propertyIndex]) +
         parseCssTimeUnitsToMs(rawDelays[propertyIndex]);
}

/**
 * Parses out multiple values from a computed style into an array.
 *
 * 从计算样式中解析出多个值放到数组中。
 *
 */
function parseCssPropertyValue(computedStyle: CSSStyleDeclaration, name: string): string[] {
  const value = computedStyle.getPropertyValue(name);
  return value.split(',').map(part => part.trim());
}
