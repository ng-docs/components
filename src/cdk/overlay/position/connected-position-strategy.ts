/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Direction} from '@angular/cdk/bidi';
import {Platform} from '@angular/cdk/platform';
import {CdkScrollable, ViewportRuler} from '@angular/cdk/scrolling';
import {ElementRef} from '@angular/core';
import {Observable} from 'rxjs';

import {OverlayContainer} from '../overlay-container';
import {OverlayReference} from '../overlay-reference';

import {
  ConnectedOverlayPositionChange,
  ConnectionPositionPair,
  OriginConnectionPosition,
  OverlayConnectionPosition,
} from './connected-position';
import {FlexibleConnectedPositionStrategy} from './flexible-connected-position-strategy';
import {PositionStrategy} from './position-strategy';

/**
 * A strategy for positioning overlays. Using this strategy, an overlay is given an
 * implicit position relative to some origin element. The relative position is defined in terms of
 * a point on the origin element that is connected to a point on the overlay element. For example,
 * a basic dropdown is connecting the bottom-left corner of the origin to the top-left corner
 * of the overlay.
 *
 * 放置浮层的策略。使用此策略，可以为浮层提供相对于某原点元素的隐式位置。此相对位置是指浮层元素上的点相对于所连接的原点元素上的点。例如，一个基本的下拉列表将其原点的左下角连接到此浮层的左上角。
 *
 * @deprecated Use `FlexibleConnectedPositionStrategy` instead.
 * @breaking-change 8.0.0
 */
export class ConnectedPositionStrategy implements PositionStrategy {
  /**
   * Reference to the underlying position strategy to which all the API calls are proxied.
   * @docs-private
   */
  _positionStrategy: FlexibleConnectedPositionStrategy;

  /**
   * The overlay to which this strategy is attached.
   *
   * 此策略附加到的浮层。
   *
   */
  private _overlayRef: OverlayReference;

  private _direction: Direction | null;

  /**
   * Ordered list of preferred positions, from most to least desirable.
   *
   * 首选位置的有序列表，从最高到最低。
   *
   */
  _preferredPositions: ConnectionPositionPair[] = [];

  /**
   * Emits an event when the connection point changes.
   *
   * 连接点更改时发出事件。
   *
   */
  readonly onPositionChange: Observable<ConnectedOverlayPositionChange>;

  constructor(
      originPos: OriginConnectionPosition, overlayPos: OverlayConnectionPosition,
      connectedTo: ElementRef<HTMLElement>, viewportRuler: ViewportRuler, document: Document,
      platform: Platform, overlayContainer: OverlayContainer) {
    // Since the `ConnectedPositionStrategy` is deprecated and we don't want to maintain
    // the extra logic, we create an instance of the positioning strategy that has some
    // defaults that make it behave as the old position strategy and to which we'll
    // proxy all of the API calls.
    this._positionStrategy = new FlexibleConnectedPositionStrategy(
                                 connectedTo, viewportRuler, document, platform, overlayContainer)
                                 .withFlexibleDimensions(false)
                                 .withPush(false)
                                 .withViewportMargin(0);

    this.withFallbackPosition(originPos, overlayPos);
    this.onPositionChange = this._positionStrategy.positionChanges;
  }

  /**
   * Ordered list of preferred positions, from most to least desirable.
   *
   * 首选位置的有序列表，从最高到最低。
   *
   */
  get positions(): ConnectionPositionPair[] {
    return this._preferredPositions;
  }

  /**
   * Attach this position strategy to an overlay.
   *
   * 将此定位策略附加到浮层。
   *
   */
  attach(overlayRef: OverlayReference): void {
    this._overlayRef = overlayRef;
    this._positionStrategy.attach(overlayRef);

    if (this._direction) {
      overlayRef.setDirection(this._direction);
      this._direction = null;
    }
  }

  /**
   * Disposes all resources used by the position strategy.
   *
   * 释放此定位策略使用的所有资源。
   *
   */
  dispose() {
    this._positionStrategy.dispose();
  }

  /** @docs-private */
  detach() {
    this._positionStrategy.detach();
  }

  /**
   * Updates the position of the overlay element, using whichever preferred position relative
   * to the origin fits on-screen.
   * @docs-private
   */
  apply(): void {
    this._positionStrategy.apply();
  }

  /**
   * Re-positions the overlay element with the trigger in its last calculated position,
   * even if a position higher in the "preferred positions" list would now fit. This
   * allows one to re-align the panel without changing the orientation of the panel.
   *
   * 即使触发器在“首选位置”列表中更高的位置，也可以将带有触发器的浮层元素重定位到其最后计算出的位置。这样一来，无需更改面板方向即可重新对齐面板。
   *
   */
  recalculateLastPosition(): void {
    this._positionStrategy.reapplyLastPosition();
  }

  /**
   * Sets the list of Scrollable containers that host the origin element so that
   * on reposition we can evaluate if it or the overlay has been clipped or outside view. Every
   * Scrollable must be an ancestor element of the strategy's origin element.
   *
   * 设置承载原点元素的可滚动容器列表，以便在重新定位时可以评估该元素或浮层是应该被裁剪还是位于视图外。每个可滚动对象都必须是该策略的原点元素的祖先。
   *
   */
  withScrollableContainers(scrollables: CdkScrollable[]) {
    this._positionStrategy.withScrollableContainers(scrollables);
  }

  /**
   * Adds a new preferred fallback position.
   *
   * 添加新的首选后备排名。
   *
   * @param originPos
   * @param overlayPos
   */
  withFallbackPosition(
      originPos: OriginConnectionPosition,
      overlayPos: OverlayConnectionPosition,
      offsetX?: number,
      offsetY?: number): this {

    const position = new ConnectionPositionPair(originPos, overlayPos, offsetX, offsetY);
    this._preferredPositions.push(position);
    this._positionStrategy.withPositions(this._preferredPositions);
    return this;
  }

  /**
   * Sets the layout direction so the overlay's position can be adjusted to match.
   *
   * 设置布局方向，以便可以调整浮层的位置以匹配它。
   *
   * @param dir New layout direction.
   *
   * 新的布局方向。
   *
   */
  withDirection(dir: 'ltr' | 'rtl'): this {
    // Since the direction might be declared before the strategy is attached,
    // we save the value in a temporary property and we'll transfer it to the
    // overlay ref on attachment.
    if (this._overlayRef) {
      this._overlayRef.setDirection(dir);
    } else {
      this._direction = dir;
    }

    return this;
  }

  /**
   * Sets an offset for the overlay's connection point on the x-axis
   *
   * 设置浮层在 x 轴上的连接点的偏移量
   *
   * @param offset New offset in the X axis.
   *
   * X 轴上的新偏移量。
   *
   */
  withOffsetX(offset: number): this {
    this._positionStrategy.withDefaultOffsetX(offset);
    return this;
  }

  /**
   * Sets an offset for the overlay's connection point on the y-axis
   *
   * 设置浮层在 y 轴上的连接点的偏移量
   *
   * @param  offset New offset in the Y axis.
   */
  withOffsetY(offset: number): this {
    this._positionStrategy.withDefaultOffsetY(offset);
    return this;
  }

  /**
   * Sets whether the overlay's position should be locked in after it is positioned
   * initially. When an overlay is locked in, it won't attempt to reposition itself
   * when the position is re-applied (e.g. when the user scrolls away).
   *
   * 设置浮层的位置在最初放置后是否应锁定。当浮层被锁定时，在重新应用位置时（例如，当用户滚动离开时），它不会尝试重新定位自身。
   *
   * @param isLocked Whether the overlay should locked in.
   *
   * 浮层是否应锁定。
   *
   */
  withLockedPosition(isLocked: boolean): this {
    this._positionStrategy.withLockedPosition(isLocked);
    return this;
  }

  /**
   * Overwrites the current set of positions with an array of new ones.
   *
   * 用一组新的位置覆盖当前位置。
   *
   * @param positions Position pairs to be set on the strategy.
   *
   * 要设置在本策略上的位置对。
   *
   */
  withPositions(positions: ConnectionPositionPair[]): this {
    this._preferredPositions = positions.slice();
    this._positionStrategy.withPositions(this._preferredPositions);
    return this;
  }

  /**
   * Sets the origin element, relative to which to position the overlay.
   *
   * 设置浮层的原点元素。
   *
   * @param origin Reference to the new origin element.
   *
   * 到新原点元素的引用。
   *
   */
  setOrigin(origin: ElementRef): this {
    this._positionStrategy.setOrigin(origin);
    return this;
  }
}
