/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {DOCUMENT} from '@angular/common';
import {
  Inject,
  Injectable,
  Optional,
  NgZone,
} from '@angular/core';
import {InteractivityChecker} from '../interactivity-checker/interactivity-checker';
import {ConfigurableFocusTrap} from './configurable-focus-trap';
import {ConfigurableFocusTrapConfig} from './configurable-focus-trap-config';
import {FOCUS_TRAP_INERT_STRATEGY, FocusTrapInertStrategy} from './focus-trap-inert-strategy';
import {EventListenerFocusTrapInertStrategy} from './event-listener-inert-strategy';
import {FocusTrapManager} from './focus-trap-manager';

/**
 * Factory that allows easy instantiation of configurable focus traps.
 *
 * 本工厂允许轻松实例化可配置的焦点陷阱。
 *
 */
@Injectable({providedIn: 'root'})
export class ConfigurableFocusTrapFactory {
  private _document: Document;
  private _inertStrategy: FocusTrapInertStrategy;

  constructor(
      private _checker: InteractivityChecker,
      private _ngZone: NgZone,
      private _focusTrapManager: FocusTrapManager,
      @Inject(DOCUMENT) _document: any,
      @Optional() @Inject(FOCUS_TRAP_INERT_STRATEGY) _inertStrategy?: FocusTrapInertStrategy) {

    this._document = _document;
    // TODO split up the strategies into different modules, similar to DateAdapter.
    this._inertStrategy = _inertStrategy || new EventListenerFocusTrapInertStrategy();
  }

  /**
   * Creates a focus-trapped region around the given element.
   *
   * 在指定元素周围创建一个焦点捕获区域。
   *
   * @param element The element around which focus will be trapped.
   *
   * 要在其周围捕获焦点的元素。
   *
   * @param config The focus trap configuration.
   *
   * 焦点陷阱配置。
   *
   * @returns The created focus trap instance.
   *
   * 所创建的焦点陷阱实例。
   *
   */
  create(element: HTMLElement, config?: ConfigurableFocusTrapConfig): ConfigurableFocusTrap;

  /**
   * @deprecated Pass a config object instead of the `deferCaptureElements` flag.
   *
   * 传递一个配置对象，而不是 `deferCaptureElements` 标志。
   *
   * @breaking-change 11.0.0
   */
  create(element: HTMLElement, deferCaptureElements: boolean): ConfigurableFocusTrap;

  create(element: HTMLElement, config: ConfigurableFocusTrapConfig|boolean = {defer: false}):
      ConfigurableFocusTrap {
    let configObject: ConfigurableFocusTrapConfig;
    if (typeof config === 'boolean') {
      configObject = {defer: config};
    } else {
      configObject = config;
    }
    return new ConfigurableFocusTrap(
        element, this._checker, this._ngZone, this._document, this._focusTrapManager,
        this._inertStrategy, configObject);
  }
}
