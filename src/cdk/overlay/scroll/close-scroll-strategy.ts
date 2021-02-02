/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {NgZone} from '@angular/core';
import {ScrollStrategy, getMatScrollStrategyAlreadyAttachedError} from './scroll-strategy';
import {OverlayReference} from '../overlay-reference';
import {Subscription} from 'rxjs';
import {ScrollDispatcher, ViewportRuler} from '@angular/cdk/scrolling';

/**
 * Config options for the CloseScrollStrategy.
 *
 * CloseScrollStrategy 的配置选项。
 *
 */
export interface CloseScrollStrategyConfig {
  /**
   * Amount of pixels the user has to scroll before the overlay is closed.
   *
   * 在关闭浮层之前，用户必须滚动的像素数量。
   *
   */
  threshold?: number;
}

/**
 * Strategy that will close the overlay as soon as the user starts scrolling.
 *
 * 用户开始滚动时关闭浮层的策略。
 *
 */
export class CloseScrollStrategy implements ScrollStrategy {
  private _scrollSubscription: Subscription|null = null;
  private _overlayRef: OverlayReference;
  private _initialScrollPosition: number;

  constructor(
    private _scrollDispatcher: ScrollDispatcher,
    private _ngZone: NgZone,
    private _viewportRuler: ViewportRuler,
    private _config?: CloseScrollStrategyConfig) {}

  /**
   * Attaches this scroll strategy to an overlay.
   *
   * 将此滚动策略附加到浮层。
   *
   */
  attach(overlayRef: OverlayReference) {
    if (this._overlayRef && (typeof ngDevMode === 'undefined' || ngDevMode)) {
      throw getMatScrollStrategyAlreadyAttachedError();
    }

    this._overlayRef = overlayRef;
  }

  /**
   * Enables the closing of the attached overlay on scroll.
   *
   * 启用“滚动时关闭已附加浮层”。
   *
   */
  enable() {
    if (this._scrollSubscription) {
      return;
    }

    const stream = this._scrollDispatcher.scrolled(0);

    if (this._config && this._config.threshold && this._config.threshold > 1) {
      this._initialScrollPosition = this._viewportRuler.getViewportScrollPosition().top;

      this._scrollSubscription = stream.subscribe(() => {
        const scrollPosition = this._viewportRuler.getViewportScrollPosition().top;

        if (Math.abs(scrollPosition - this._initialScrollPosition) > this._config!.threshold!) {
          this._detach();
        } else {
          this._overlayRef.updatePosition();
        }
      });
    } else {
      this._scrollSubscription = stream.subscribe(this._detach);
    }
  }

  /**
   * Disables the closing the attached overlay on scroll.
   *
   * 禁用“滚动时关闭已附加浮层”。
   *
   */
  disable() {
    if (this._scrollSubscription) {
      this._scrollSubscription.unsubscribe();
      this._scrollSubscription = null;
    }
  }

  detach() {
    this.disable();
    this._overlayRef = null!;
  }

  /**
   * Detaches the overlay ref and disables the scroll strategy.
   *
   * 拆除浮层引用并禁用滚动策略。
   *
   */
  private _detach = () => {
    this.disable();

    if (this._overlayRef.hasAttached()) {
      this._ngZone.run(() => this._overlayRef.detach());
    }
  }
}
