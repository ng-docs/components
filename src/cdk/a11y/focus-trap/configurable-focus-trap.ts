/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {NgZone} from '@angular/core';
import {InteractivityChecker} from '../interactivity-checker/interactivity-checker';
import {FocusTrap} from './focus-trap';
import {FocusTrapManager, ManagedFocusTrap} from './focus-trap-manager';
import {FocusTrapInertStrategy} from './focus-trap-inert-strategy';
import {ConfigurableFocusTrapConfig} from './configurable-focus-trap-config';

/**
 * Class that allows for trapping focus within a DOM element.
 *
 * 允许在 DOM 元素内捕获焦点的类。
 *
 * This class uses a strategy pattern that determines how it traps focus.
 * See FocusTrapInertStrategy.
 *
 * 此类使用一种策略模式来确定如何捕获焦点。请参阅 FocusTrapInertStrategy。
 *
 */
export class ConfigurableFocusTrap extends FocusTrap implements ManagedFocusTrap {
  /**
   * Whether the FocusTrap is enabled.
   *
   * 是否启用了此 FocusTrap。
   *
   */
  get enabled(): boolean { return this._enabled; }
  set enabled(value: boolean) {
    this._enabled = value;
    if (this._enabled) {
      this._focusTrapManager.register(this);
    } else {
      this._focusTrapManager.deregister(this);
    }
  }

  constructor(
    _element: HTMLElement,
    _checker: InteractivityChecker,
    _ngZone: NgZone,
    _document: Document,
    private _focusTrapManager: FocusTrapManager,
    private _inertStrategy: FocusTrapInertStrategy,
    config: ConfigurableFocusTrapConfig) {
    super(_element, _checker, _ngZone, _document, config.defer);
    this._focusTrapManager.register(this);
  }

  /**
   * Notifies the FocusTrapManager that this FocusTrap will be destroyed.
   *
   * 通知 FocusTrapManager，此 FocusTrap 将被销毁。
   *
   */
  destroy() {
    this._focusTrapManager.deregister(this);
    super.destroy();
  }

  /** @docs-private Implemented as part of ManagedFocusTrap. */
  _enable() {
    this._inertStrategy.preventFocus(this);
    this.toggleAnchors(true);
  }

  /** @docs-private Implemented as part of ManagedFocusTrap. */
  _disable() {
    this._inertStrategy.allowFocus(this);
    this.toggleAnchors(false);
  }
}
