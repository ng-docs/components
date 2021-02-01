/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Platform} from '@angular/cdk/platform';
import {Injectable} from '@angular/core';

/**
 * Configuration for the isFocusable method.
 *
 * isFocusable 方法的配置。
 *
 */
export class IsFocusableConfig {
  /**
   * Whether to count an element as focusable even if it is not currently visible.
   *
   * 是否将不可见元素计入可获得焦点的元素。
   *
   */
  ignoreVisibility: boolean = false;
}

// The InteractivityChecker leans heavily on the ally.js accessibility utilities.
// Methods like `isTabbable` are only covering specific edge-cases for the browsers which are
// supported.

/**
 * Utility for checking the interactivity of an element, such as whether is is focusable or
 * tabbable.
 *
 * 用于检查元素交互性的实用工具，例如是否可获得焦点或可 tab。
 *
 */
@Injectable({providedIn: 'root'})
export class InteractivityChecker {

  constructor(private _platform: Platform) {}

  /**
   * Gets whether an element is disabled.
   *
   * 获取元素是否被禁用。
   *
   * @param element Element to be checked.
   *
   * 要检查的元素。
   *
   * @returns Whether the element is disabled.
   *
   * 元素是否被禁用。
   *
   */
  isDisabled(element: HTMLElement): boolean {
    // This does not capture some cases, such as a non-form control with a disabled attribute or
    // a form control inside of a disabled form, but should capture the most common cases.
    return element.hasAttribute('disabled');
  }

  /**
   * Gets whether an element is visible for the purposes of interactivity.
   *
   * 获取某元素可见是否出于交互目的。
   *
   * This will capture states like `display: none` and `visibility: hidden`, but not things like
   * being clipped by an `overflow: hidden` parent or being outside the viewport.
   *
   * 这包括 `display: none` 和 `visibility: hidden` 状态下的，但被 `overflow: hidden` 的父对象切掉或位于视口之外的除外。
   *
   * @returns Whether the element is visible.
   *
   * 元素是否可见。
   *
   */
  isVisible(element: HTMLElement): boolean {
    return hasGeometry(element) && getComputedStyle(element).visibility === 'visible';
  }

  /**
   * Gets whether an element can be reached via Tab key.
   * Assumes that the element has already been checked with isFocusable.
   *
   * 获取是否可以通过 Tab 键访问元素。假定已经使用 isFocusable 检查过此元素。
   *
   * @param element Element to be checked.
   *
   * 要检查的元素。
   *
   * @returns Whether the element is tabbable.
   *
   * 元素是否可 tab。
   *
   */
  isTabbable(element: HTMLElement): boolean {
    // Nothing is tabbable on the server 😎
    if (!this._platform.isBrowser) {
      return false;
    }

    const frameElement = getFrameElement(getWindow(element));

    if (frameElement) {
      // Frame elements inherit their tabindex onto all child elements.
      if (getTabIndexValue(frameElement) === -1) {
        return false;
      }

      // Browsers disable tabbing to an element inside of an invisible frame.
      if (!this.isVisible(frameElement)) {
        return false;
      }
    }

    let nodeName = element.nodeName.toLowerCase();
    let tabIndexValue = getTabIndexValue(element);

    if (element.hasAttribute('contenteditable')) {
      return tabIndexValue !== -1;
    }

    if (nodeName === 'iframe' || nodeName === 'object') {
      // The frame or object's content may be tabbable depending on the content, but it's
      // not possibly to reliably detect the content of the frames. We always consider such
      // elements as non-tabbable.
      return false;
    }

    // In iOS, the browser only considers some specific elements as tabbable.
    if (this._platform.WEBKIT && this._platform.IOS && !isPotentiallyTabbableIOS(element)) {
      return false;
    }

    if (nodeName === 'audio') {
      // Audio elements without controls enabled are never tabbable, regardless
      // of the tabindex attribute explicitly being set.
      if (!element.hasAttribute('controls')) {
        return false;
      }
      // Audio elements with controls are by default tabbable unless the
      // tabindex attribute is set to `-1` explicitly.
      return tabIndexValue !== -1;
    }

    if (nodeName === 'video') {
      // For all video elements, if the tabindex attribute is set to `-1`, the video
      // is not tabbable. Note: We cannot rely on the default `HTMLElement.tabIndex`
      // property as that one is set to `-1` in Chrome, Edge and Safari v13.1. The
      // tabindex attribute is the source of truth here.
      if (tabIndexValue === -1) {
        return false;
      }
      // If the tabindex is explicitly set, and not `-1` (as per check before), the
      // video element is always tabbable (regardless of whether it has controls or not).
      if (tabIndexValue !== null) {
        return true;
      }
      // Otherwise (when no explicit tabindex is set), a video is only tabbable if it
      // has controls enabled. Firefox is special as videos are always tabbable regardless
      // of whether there are controls or not.
      return this._platform.FIREFOX || element.hasAttribute('controls');
    }

    return element.tabIndex >= 0;
  }

  /**
   * Gets whether an element can be focused by the user.
   *
   * 获取用户是否可以给某个元素设置焦点。
   *
   * @param element Element to be checked.
   *
   * 要检查的元素。
   *
   * @param config The config object with options to customize this method's behavior
   *
   * 带有用于自定义此方法行为的选项的配置对象
   *
   * @returns Whether the element is focusable.
   *
   * 元素是否可获得焦点。
   *
   */
  isFocusable(element: HTMLElement, config?: IsFocusableConfig): boolean {
    // Perform checks in order of left to most expensive.
    // Again, naive approach that does not capture many edge cases and browser quirks.
    return isPotentiallyFocusable(element) && !this.isDisabled(element) &&
      (config?.ignoreVisibility || this.isVisible(element));
  }

}

/**
 * Returns the frame element from a window object. Since browsers like MS Edge throw errors if
 * the frameElement property is being accessed from a different host address, this property
 * should be accessed carefully.
 *
 * 从窗口对象返回框架元素。如果要从其他宿主地址访问 frameElement 属性，则像 MS Edge 这样的浏览器会引发错误，因此应仔细访问此属性。
 *
 */
function getFrameElement(window: Window) {
  try {
    return window.frameElement as HTMLElement;
  } catch {
    return null;
  }
}

/**
 * Checks whether the specified element has any geometry / rectangles.
 *
 * 检查指定的元素是否具有任何几何形状/矩形。
 *
 */
function hasGeometry(element: HTMLElement): boolean {
  // Use logic from jQuery to check for an invisible element.
  // See https://github.com/jquery/jquery/blob/master/src/css/hiddenVisibleSelectors.js#L12
  return !!(element.offsetWidth || element.offsetHeight ||
      (typeof element.getClientRects === 'function' && element.getClientRects().length));
}

/**
 * Gets whether an element's
 *
 * 获取元素的是否原生表单元素
 *
 */
function isNativeFormElement(element: Node) {
  let nodeName = element.nodeName.toLowerCase();
  return nodeName === 'input' ||
      nodeName === 'select' ||
      nodeName === 'button' ||
      nodeName === 'textarea';
}

/**
 * Gets whether an element is an `<input type="hidden">`.
 *
 * 获取元素是否为 `&lt;input type="hidden">` 。
 *
 */
function isHiddenInput(element: HTMLElement): boolean {
  return isInputElement(element) && element.type == 'hidden';
}

/**
 * Gets whether an element is an anchor that has an href attribute.
 *
 * 获取元素是否是具有 href 属性的锚点。
 *
 */
function isAnchorWithHref(element: HTMLElement): boolean {
  return isAnchorElement(element) && element.hasAttribute('href');
}

/**
 * Gets whether an element is an input element.
 *
 * 获取一个元素是否为 input 元素。
 *
 */
function isInputElement(element: HTMLElement): element is HTMLInputElement {
  return element.nodeName.toLowerCase() == 'input';
}

/**
 * Gets whether an element is an anchor element.
 *
 * 获取元素是否为锚点元素。
 *
 */
function isAnchorElement(element: HTMLElement): element is HTMLAnchorElement {
  return element.nodeName.toLowerCase() == 'a';
}

/**
 * Gets whether an element has a valid tabindex.
 *
 * 获取元素是否具有有效的 tabindex。
 *
 */
function hasValidTabIndex(element: HTMLElement): boolean {
  if (!element.hasAttribute('tabindex') || element.tabIndex === undefined) {
    return false;
  }

  let tabIndex = element.getAttribute('tabindex');

  // IE11 parses tabindex="" as the value "-32768"
  if (tabIndex == '-32768') {
    return false;
  }

  return !!(tabIndex && !isNaN(parseInt(tabIndex, 10)));
}

/**
 * Returns the parsed tabindex from the element attributes instead of returning the
 * evaluated tabindex from the browsers defaults.
 *
 * 从元素属性返回解析出的 tabindex，而不是从浏览器的默认值返回计算出的 tabindex。
 *
 */
function getTabIndexValue(element: HTMLElement): number | null {
  if (!hasValidTabIndex(element)) {
    return null;
  }

  // See browser issue in Gecko https://bugzilla.mozilla.org/show_bug.cgi?id=1128054
  const tabIndex = parseInt(element.getAttribute('tabindex') || '', 10);

  return isNaN(tabIndex) ? -1 : tabIndex;
}

/**
 * Checks whether the specified element is potentially tabbable on iOS
 *
 * 检查指定的元素在 iOS 上是否可 Tab
 *
 */
function isPotentiallyTabbableIOS(element: HTMLElement): boolean {
  let nodeName = element.nodeName.toLowerCase();
  let inputType = nodeName === 'input' && (element as HTMLInputElement).type;

  return inputType === 'text'
      || inputType === 'password'
      || nodeName === 'select'
      || nodeName === 'textarea';
}

/**
 * Gets whether an element is potentially focusable without taking current visible/disabled state
 * into account.
 *
 * 获取在不考虑当前可见/禁用状态的情况下元素是否可以获得焦点。
 *
 */
function isPotentiallyFocusable(element: HTMLElement): boolean {
  // Inputs are potentially focusable *unless* they're type="hidden".
  if (isHiddenInput(element)) {
    return false;
  }

  return isNativeFormElement(element) ||
      isAnchorWithHref(element) ||
      element.hasAttribute('contenteditable') ||
      hasValidTabIndex(element);
}

/**
 * Gets the parent window of a DOM node with regards of being inside of an iframe.
 *
 * 获取有关位于 iframe 内的 DOM 节点的父窗口的信息。
 *
 */
function getWindow(node: HTMLElement): Window {
  // ownerDocument is null if `node` itself *is* a document.
  return node.ownerDocument && node.ownerDocument.defaultView || window;
}
