/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Platform} from '@angular/cdk/platform';
import {ViewportRuler} from '@angular/cdk/scrolling';
import {DOCUMENT} from '@angular/common';
import {Inject, Injectable} from '@angular/core';
import {OverlayContainer} from '../overlay-container';
import {
  FlexibleConnectedPositionStrategy,
  FlexibleConnectedPositionStrategyOrigin,
} from './flexible-connected-position-strategy';
import {GlobalPositionStrategy} from './global-position-strategy';

/**
 * Builder for overlay position strategy.
 *
 * 浮层定位策略生成器。
 *
 */
@Injectable({providedIn: 'root'})
export class OverlayPositionBuilder {
  constructor(
    private _viewportRuler: ViewportRuler,
    @Inject(DOCUMENT) private _document: any,
    private _platform: Platform,
    private _overlayContainer: OverlayContainer,
  ) {}

  /**
   * Creates a global position strategy.
   *
   * 创建全局定位策略。
   *
   */
  global(): GlobalPositionStrategy {
    return new GlobalPositionStrategy();
  }

  /**
   * Creates a flexible position strategy.
   *
   * 创建灵活定位策略。
   *
   * @param origin Origin relative to which to position the overlay.
   *
   * 浮层定位相对的原点。
   *
   */
  flexibleConnectedTo(
    origin: FlexibleConnectedPositionStrategyOrigin,
  ): FlexibleConnectedPositionStrategy {
    return new FlexibleConnectedPositionStrategy(
      origin,
      this._viewportRuler,
      this._document,
      this._platform,
      this._overlayContainer,
    );
  }
}
