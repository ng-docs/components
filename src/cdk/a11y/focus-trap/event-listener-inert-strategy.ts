/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {FocusTrapInertStrategy} from './focus-trap-inert-strategy';
import {ConfigurableFocusTrap} from './configurable-focus-trap';
import {closest} from './polyfill';

/**
 * Lightweight FocusTrapInertStrategy that adds a document focus event
 * listener to redirect focus back inside the FocusTrap.
 *
 * 轻型 FocusTrapInertStrategy，添加了文档焦点事件侦听器以将焦点重定向回 FocusTrap 内部。
 *
 */
export class EventListenerFocusTrapInertStrategy implements FocusTrapInertStrategy {
  /**
   * Focus event handler.
   *
   * 焦点事件处理程序。
   *
   */
  private _listener: ((e: FocusEvent) => void) | null = null;

  /**
   * Adds a document event listener that keeps focus inside the FocusTrap.
   *
   * 添加一个文档事件监听器，使焦点保持在 FocusTrap 内部。
   *
   */
  preventFocus(focusTrap: ConfigurableFocusTrap): void {
    // Ensure there's only one listener per document
    if (this._listener) {
      focusTrap._document.removeEventListener('focus', this._listener!, true);
    }

    this._listener = (e: FocusEvent) => this._trapFocus(focusTrap, e);
    focusTrap._ngZone.runOutsideAngular(() => {
      focusTrap._document.addEventListener('focus', this._listener!, true);
    });
  }

  /**
   * Removes the event listener added in preventFocus.
   *
   * 删除在 preventFocus 中添加的事件侦听器。
   *
   */
  allowFocus(focusTrap: ConfigurableFocusTrap): void {
    if (!this._listener) {
      return;
    }
    focusTrap._document.removeEventListener('focus', this._listener!, true);
    this._listener = null;
  }

  /**
   * Refocuses the first element in the FocusTrap if the focus event target was outside
   * the FocusTrap.
   *
   * 如果焦点事件目标在 FocusTrap 之外，则让 FocusTrap 中的第一个元素重新获得焦点。
   *
   * This is an event listener callback. The event listener is added in runOutsideAngular,
   * so all this code runs outside Angular as well.
   *
   * 这是一个事件侦听器回调。事件侦听器是在 runOutsideAngular 中添加的，因此所有这些代码也都在 Angular 之外运行。
   *
   */
  private _trapFocus(focusTrap: ConfigurableFocusTrap, event: FocusEvent) {
    const target = event.target as HTMLElement;
    const focusTrapRoot = focusTrap._element;

    // Don't refocus if target was in an overlay, because the overlay might be associated
    // with an element inside the FocusTrap, ex. mat-select.
    if (!focusTrapRoot.contains(target) && closest(target, 'div.cdk-overlay-pane') === null) {
        // Some legacy FocusTrap usages have logic that focuses some element on the page
        // just before FocusTrap is destroyed. For backwards compatibility, wait
        // to be sure FocusTrap is still enabled before refocusing.
        setTimeout(() => {
          // Check whether focus wasn't put back into the focus trap while the timeout was pending.
          if (focusTrap.enabled && !focusTrapRoot.contains(focusTrap._document.activeElement)) {
            focusTrap.focusFirstTabbableElement();
          }
        });
      }
  }
}
