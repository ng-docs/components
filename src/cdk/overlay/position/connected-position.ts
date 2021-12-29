/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

/** Horizontal dimension of a connection point on the perimeter of the origin or overlay element. */
export type HorizontalConnectionPos = 'start' | 'center' | 'end';

/**
 * Vertical dimension of a connection point on the perimeter of the origin or overlay element.
 *
 * 在原点周边或浮层元素上的连接点的垂直规格。
 *
 */
export type VerticalConnectionPos = 'top' | 'center' | 'bottom';

/**
 * A connection point on the origin element.
 *
 * 原点元素上的连接点。
 *
 */
export interface OriginConnectionPosition {
  originX: HorizontalConnectionPos;
  originY: VerticalConnectionPos;
}

/**
 * A connection point on the overlay element.
 *
 * 浮层元素上的连接点。
 *
 */
export interface OverlayConnectionPosition {
  overlayX: HorizontalConnectionPos;
  overlayY: VerticalConnectionPos;
}

/**
 * The points of the origin element and the overlay element to connect.
 *
 * 要连接的原点元素和浮层元素上的点。
 *
 */
export class ConnectionPositionPair {
  /**
   * X-axis attachment point for connected overlay origin. Can be 'start', 'end', or 'center'.
   *
   * 已连接浮层原点的 X 轴连接点。可以是 'start'、'end' 或 'center'。
   *
   */
  originX: HorizontalConnectionPos;
  /**
   * Y-axis attachment point for connected overlay origin. Can be 'top', 'bottom', or 'center'.
   *
   * 已连接浮层原点的 Y 轴连接点。可以是 'top'、'bottom' 或 'center'。
   *
   */
  originY: VerticalConnectionPos;
  /**
   * X-axis attachment point for connected overlay. Can be 'start', 'end', or 'center'.
   *
   * 已连接浮层原点的 X 轴连接点。可以是 'start'、'end' 或 'center'。
   *
   */
  overlayX: HorizontalConnectionPos;
  /**
   * Y-axis attachment point for connected overlay. Can be 'top', 'bottom', or 'center'.
   *
   * 已连接浮层原点的 Y 轴连接点。可以是 'top'、'bottom' 或 'center'。
   *
   */
  overlayY: VerticalConnectionPos;

  constructor(
    origin: OriginConnectionPosition,
    overlay: OverlayConnectionPosition,
    /** Offset along the X axis. */
    public offsetX?: number,
    /** Offset along the Y axis. */
    public offsetY?: number,
    /** Class(es) to be applied to the panel while this position is active. */
    public panelClass?: string | string[],
  ) {
    this.originX = origin.originX;
    this.originY = origin.originY;
    this.overlayX = overlay.overlayX;
    this.overlayY = overlay.overlayY;
  }
}

/**
 * Set of properties regarding the position of the origin and overlay relative to the viewport
 * with respect to the containing Scrollable elements.
 *
 * 一组属性，表示原点和浮层相对于包含可滚动元素的视口的位置。
 *
 * The overlay and origin are clipped if any part of their bounding client rectangle exceeds the
 * bounds of any one of the strategy's Scrollable's bounding client rectangle.
 *
 * 如果浮层和原点的边界矩形的任何部分超出了本策略的可滚动边界矩形，则将对其进行裁剪。
 *
 * The overlay and origin are outside view if there is no overlap between their bounding client
 * rectangle and any one of the strategy's Scrollable's bounding client rectangle.
 *
 * 如果浮层和原点的边界矩形与本策略的可滚动对象边界矩形中的任何一个都没有重叠，则浮层和原点位于外部视图中。
 *
 *   -----------                    -----------
 *   |   外部   |                    | 已裁剪 |
 *   |  视图   |              --------------------------
 *   |         |              |     |         |        |
 *   ----------               |     -----------        |
 *  --------------------------    |                        |
 *  |                        |    |       可滚动内容         |
 *  |                        |    |                        |
 *  |                        |     --------------------------
 *  |       可滚动内容         |
 *  |                        |
 *  --------------------------
 *
 * @docs-private
 */
export class ScrollingVisibility {
  isOriginClipped: boolean;
  isOriginOutsideView: boolean;
  isOverlayClipped: boolean;
  isOverlayOutsideView: boolean;
}

/**
 * The change event emitted by the strategy when a fallback position is used.
 *
 * 使用回退位置时，本策略发出的更改事件。
 *
 */
export class ConnectedOverlayPositionChange {
  constructor(
    /**
     * The position used as a result of this change.
     *
     * 本次更改的结果位置。
     */
    public connectionPair: ConnectionPositionPair,
    /** @docs-private */
    public scrollableViewProperties: ScrollingVisibility,
  ) {}
}

/**
 * Validates whether a vertical position property matches the expected values.
 *
 * 验证垂直位置属性是否与期望值匹配。
 *
 * @param property Name of the property being validated.
 *
 * 要验证的属性的名称。
 *
 * @param value Value of the property being validated.
 *
 * 待验证属性的值。
 *
 * @docs-private
 */
export function validateVerticalPosition(property: string, value: VerticalConnectionPos) {
  if (value !== 'top' && value !== 'bottom' && value !== 'center') {
    throw Error(
      `ConnectedPosition: Invalid ${property} "${value}". ` +
        `Expected "top", "bottom" or "center".`,
    );
  }
}

/**
 * Validates whether a horizontal position property matches the expected values.
 *
 * 验证水平位置属性是否与期望值匹配。
 *
 * @param property Name of the property being validated.
 *
 * 要验证的属性的名称。
 *
 * @param value Value of the property being validated.
 *
 * 待验证属性的值。
 *
 * @docs-private
 */
export function validateHorizontalPosition(property: string, value: HorizontalConnectionPos) {
  if (value !== 'start' && value !== 'end' && value !== 'center') {
    throw Error(
      `ConnectedPosition: Invalid ${property} "${value}". ` +
        `Expected "start", "end" or "center".`,
    );
  }
}
