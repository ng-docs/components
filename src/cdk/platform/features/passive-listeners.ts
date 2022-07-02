/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

/**
 * Cached result of whether the user's browser supports passive event listeners.
 *
 * 用户浏览器是否支持被动事件侦听器的缓存结果。
 *
 */
let supportsPassiveEvents: boolean;

/**
 * Checks whether the user's browser supports passive event listeners.
 * See: https://github.com/WICG/EventListenerOptions/blob/gh-pages/explainer.md
 *
 * 检查用户的浏览器是否支持被动事件侦听器。参见：https://github.com/WICG/EventListenerOptions/blob/gh-pages/explainer.md
 *
 */
export function supportsPassiveEventListeners(): boolean {
  if (supportsPassiveEvents == null && typeof window !== 'undefined') {
    try {
      window.addEventListener(
        'test',
        null!,
        Object.defineProperty({}, 'passive', {
          get: () => (supportsPassiveEvents = true),
        }),
      );
    } finally {
      supportsPassiveEvents = supportsPassiveEvents || false;
    }
  }

  return supportsPassiveEvents;
}

/**
 * Normalizes an `AddEventListener` object to something that can be passed
 * to `addEventListener` on any browser, no matter whether it supports the
 * `options` parameter.
 *
 * 将 `AddEventListener` 对象规范化为可以在任何浏览器中传给 `addEventListener` 的，无论其是否支持 `options` 参数。
 *
 * @param options Object to be normalized.
 *
 * 要规范化的对象。
 *
 */
export function normalizePassiveListenerOptions(
  options: AddEventListenerOptions,
): AddEventListenerOptions | boolean {
  return supportsPassiveEventListeners() ? options : !!options.capture;
}
