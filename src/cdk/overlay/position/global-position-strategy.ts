/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {PositionStrategy} from './position-strategy';
import {OverlayReference} from '../overlay-reference';

/**
 * Class to be added to the overlay pane wrapper.
 *
 * 要添加到浮层窗格包装器的类。
 *
 */
const wrapperClass = 'cdk-global-overlay-wrapper';

/**
 * A strategy for positioning overlays. Using this strategy, an overlay is given an
 * explicit position relative to the browser's viewport. We use flexbox, instead of
 * transforms, in order to avoid issues with subpixel rendering which can cause the
 * element to become blurry.
 *
 * 放置浮层的策略。使用此策略，可以为浮层赋予相对于浏览器视口的显式位置。为了避免亚像素渲染可能导致元素变得模糊的问题，我们使用 flexbox 而不是变换。
 *
 */
export class GlobalPositionStrategy implements PositionStrategy {
  /**
   * The overlay to which this strategy is attached.
   *
   * 此策略要附加到的浮层。
   *
   */
  private _overlayRef: OverlayReference;
  private _cssPosition: string = 'static';
  private _topOffset: string = '';
  private _bottomOffset: string = '';
  private _leftOffset: string = '';
  private _rightOffset: string = '';
  private _alignItems: string = '';
  private _justifyContent: string = '';
  private _width: string = '';
  private _height: string = '';
  private _isDisposed: boolean;

  attach(overlayRef: OverlayReference): void {
    const config = overlayRef.getConfig();

    this._overlayRef = overlayRef;

    if (this._width && !config.width) {
      overlayRef.updateSize({width: this._width});
    }

    if (this._height && !config.height) {
      overlayRef.updateSize({height: this._height});
    }

    overlayRef.hostElement.classList.add(wrapperClass);
    this._isDisposed = false;
  }

  /**
   * Sets the top position of the overlay. Clears any previously set vertical position.
   *
   * 设置浮层的顶部位置。清除任何先前设置的垂直位置。
   *
   * @param value New top offset.
   *
   * 新的顶部偏移量。
   *
   */
  top(value: string = ''): this {
    this._bottomOffset = '';
    this._topOffset = value;
    this._alignItems = 'flex-start';
    return this;
  }

  /**
   * Sets the left position of the overlay. Clears any previously set horizontal position.
   *
   * 设置浮层的左侧位置。清除任何先前设置的水平位置。
   *
   * @param value New left offset.
   *
   * 新的左侧偏移量。
   *
   */
  left(value: string = ''): this {
    this._rightOffset = '';
    this._leftOffset = value;
    this._justifyContent = 'flex-start';
    return this;
  }

  /**
   * Sets the bottom position of the overlay. Clears any previously set vertical position.
   *
   * 设置浮层的底部位置。清除任何先前设置的垂直位置。
   *
   * @param value New bottom offset.
   *
   * 新的底部偏移量。
   *
   */
  bottom(value: string = ''): this {
    this._topOffset = '';
    this._bottomOffset = value;
    this._alignItems = 'flex-end';
    return this;
  }

  /**
   * Sets the right position of the overlay. Clears any previously set horizontal position.
   *
   * 设置浮层的正确位置。清除任何先前设置的水平位置。
   *
   * @param value New right offset.
   *
   * 新的右侧偏移量。
   *
   */
  right(value: string = ''): this {
    this._leftOffset = '';
    this._rightOffset = value;
    this._justifyContent = 'flex-end';
    return this;
  }

  /**
   * Sets the overlay width and clears any previously set width.
   *
   * 设置浮层宽度并清除任何先前设置的宽度。
   *
   * @param value New width for the overlay
   *
   * 浮层的新宽度
   * @deprecated Pass the `width` through the `OverlayConfig`.
   *
   * 通过 `OverlayConfig` 传递 `width`。
   *
   * @breaking-change 8.0.0
   */
  width(value: string = ''): this {
    if (this._overlayRef) {
      this._overlayRef.updateSize({width: value});
    } else {
      this._width = value;
    }

    return this;
  }

  /**
   * Sets the overlay height and clears any previously set height.
   *
   * 设置浮层高度并清除任何先前设置的高度。
   *
   * @param value New height for the overlay
   *
   * 浮层的新高度
   * @deprecated Pass the `height` through the `OverlayConfig`.
   *
   * 通过 `OverlayConfig` 传递 `height`。
   *
   * @breaking-change 8.0.0
   */
  height(value: string = ''): this {
    if (this._overlayRef) {
      this._overlayRef.updateSize({height: value});
    } else {
      this._height = value;
    }

    return this;
  }

  /**
   * Centers the overlay horizontally with an optional offset.
   * Clears any previously set horizontal position.
   *
   * 使浮层水平居中，并具有可选的偏移量。清除任何先前设置的水平位置。
   *
   * @param offset Overlay offset from the horizontal center.
   *
   * 相对于水平中心的浮层偏移量。
   *
   */
  centerHorizontally(offset: string = ''): this {
    this.left(offset);
    this._justifyContent = 'center';
    return this;
  }

  /**
   * Centers the overlay vertically with an optional offset.
   * Clears any previously set vertical position.
   *
   * 使浮层垂直居中，并带有可选的偏移量。清除任何先前设置的垂直位置。
   *
   * @param offset Overlay offset from the vertical center.
   *
   * 相对于垂直中心的浮层偏移量。
   *
   */
  centerVertically(offset: string = ''): this {
    this.top(offset);
    this._alignItems = 'center';
    return this;
  }

  /**
   * Apply the position to the element.
   *
   * 将此位置应用于元素。
   *
   * @docs-private
   */
  apply(): void {
    // Since the overlay ref applies the strategy asynchronously, it could
    // have been disposed before it ends up being applied. If that is the
    // case, we shouldn't do anything.
    if (!this._overlayRef || !this._overlayRef.hasAttached()) {
      return;
    }

    const styles = this._overlayRef.overlayElement.style;
    const parentStyles = this._overlayRef.hostElement.style;
    const config = this._overlayRef.getConfig();
    const {width, height, maxWidth, maxHeight} = config;
    const shouldBeFlushHorizontally =
      (width === '100%' || width === '100vw') &&
      (!maxWidth || maxWidth === '100%' || maxWidth === '100vw');
    const shouldBeFlushVertically =
      (height === '100%' || height === '100vh') &&
      (!maxHeight || maxHeight === '100%' || maxHeight === '100vh');

    styles.position = this._cssPosition;
    styles.marginLeft = shouldBeFlushHorizontally ? '0' : this._leftOffset;
    styles.marginTop = shouldBeFlushVertically ? '0' : this._topOffset;
    styles.marginBottom = this._bottomOffset;
    styles.marginRight = this._rightOffset;

    if (shouldBeFlushHorizontally) {
      parentStyles.justifyContent = 'flex-start';
    } else if (this._justifyContent === 'center') {
      parentStyles.justifyContent = 'center';
    } else if (this._overlayRef.getConfig().direction === 'rtl') {
      // In RTL the browser will invert `flex-start` and `flex-end` automatically, but we
      // don't want that because our positioning is explicitly `left` and `right`, hence
      // why we do another inversion to ensure that the overlay stays in the same position.
      // TODO: reconsider this if we add `start` and `end` methods.
      if (this._justifyContent === 'flex-start') {
        parentStyles.justifyContent = 'flex-end';
      } else if (this._justifyContent === 'flex-end') {
        parentStyles.justifyContent = 'flex-start';
      }
    } else {
      parentStyles.justifyContent = this._justifyContent;
    }

    parentStyles.alignItems = shouldBeFlushVertically ? 'flex-start' : this._alignItems;
  }

  /**
   * Cleans up the DOM changes from the position strategy.
   *
   * 从定位策略中清除 DOM 更改。
   *
   * @docs-private
   */
  dispose(): void {
    if (this._isDisposed || !this._overlayRef) {
      return;
    }

    const styles = this._overlayRef.overlayElement.style;
    const parent = this._overlayRef.hostElement;
    const parentStyles = parent.style;

    parent.classList.remove(wrapperClass);
    parentStyles.justifyContent =
      parentStyles.alignItems =
      styles.marginTop =
      styles.marginBottom =
      styles.marginLeft =
      styles.marginRight =
      styles.position =
        '';

    this._overlayRef = null!;
    this._isDisposed = true;
  }
}
