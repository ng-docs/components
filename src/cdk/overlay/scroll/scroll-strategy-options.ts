/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ScrollDispatcher, ViewportRuler} from '@angular/cdk/scrolling';
import {DOCUMENT} from '@angular/common';
import {Inject, Injectable, NgZone} from '@angular/core';
import {BlockScrollStrategy} from './block-scroll-strategy';
import {CloseScrollStrategy, CloseScrollStrategyConfig} from './close-scroll-strategy';
import {NoopScrollStrategy} from './noop-scroll-strategy';
import {
  RepositionScrollStrategy,
  RepositionScrollStrategyConfig,
} from './reposition-scroll-strategy';

/**
 * Options for how an overlay will handle scrolling.
 *
 * 规定浮层该如何处理滚动的选项。
 *
 * Users can provide a custom value for `ScrollStrategyOptions` to replace the default
 * behaviors. This class primarily acts as a factory for ScrollStrategy instances.
 *
 * 用户可以为 `ScrollStrategyOptions` 提供自定义值，以替换默认行为。此类主要充当 ScrollStrategy 实例的工厂。
 *
 */
@Injectable({providedIn: 'root'})
export class ScrollStrategyOptions {
  private _document: Document;

  constructor(
    private _scrollDispatcher: ScrollDispatcher,
    private _viewportRuler: ViewportRuler,
    private _ngZone: NgZone,
    @Inject(DOCUMENT) document: any) {
      this._document = document;
    }

  /**
   * Do nothing on scroll.
   *
   * 滚动时不执行任何操作。
   *
   */
  noop = () => new NoopScrollStrategy();

  /**
   * Close the overlay as soon as the user scrolls.
   *
   * 用户滚动后立即关闭浮层。
   *
   * @param config Configuration to be used inside the scroll strategy.
   *
   * 要在滚动策略中使用的配置。
   *
   */
  close = (config?: CloseScrollStrategyConfig) => new CloseScrollStrategy(this._scrollDispatcher,
      this._ngZone, this._viewportRuler, config)

  /**
   * Block scrolling.
   *
   * 块滚动。
   *
   */
  block = () => new BlockScrollStrategy(this._viewportRuler, this._document);

  /**
   * Update the overlay's position on scroll.
   *
   * 更新浮层在滚动条上的位置。
   *
   * @param config Configuration to be used inside the scroll strategy.
   * Allows debouncing the reposition calls.
   *
   * 在滚动策略中使用的配置。允许针对重定位调用的防抖。
   *
   */
  reposition = (config?: RepositionScrollStrategyConfig) => new RepositionScrollStrategy(
      this._scrollDispatcher, this._viewportRuler, this._ngZone, config)
}
