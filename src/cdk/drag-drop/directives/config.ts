/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {InjectionToken} from '@angular/core';
import {DragRefConfig, Point, DragRef} from '../drag-ref';

/**
 * Possible values that can be used to configure the drag start delay.
 *
 * 可用于配置拖动开始延迟的可能值。
 *
 */
export type DragStartDelay = number | {touch: number, mouse: number};

/**
 * Possible axis along which dragging can be locked.
 *
 * 可以锁定可能的拖动轴。
 *
 */
export type DragAxis = 'x' | 'y';

/**
 * Function that can be used to constrain the position of a dragged element.
 *
 * 可用于约束元素拖动位置的函数。
 *
 */
export type DragConstrainPosition = (point: Point, dragRef: DragRef) => Point;

/**
 * Possible orientations for a drop list.
 *
 * 下拉列表的可能方向。
 *
 */
export type DropListOrientation = 'horizontal' | 'vertical';

/**
 * Injection token that can be used to configure the
 * behavior of the drag&drop-related components.
 *
 * 注入令牌，可用于配置与拖放相关的组件的行为。
 *
 */
export const CDK_DRAG_CONFIG = new InjectionToken<DragDropConfig>('CDK_DRAG_CONFIG');

/**
 * Object that can be used to configure the drag
 * items and drop lists within a module or a component.
 *
 * 可用于配置模块或组件中的拖动条目和拖放列表的对象。
 *
 */
export interface DragDropConfig extends Partial<DragRefConfig> {
  lockAxis?: DragAxis;
  dragStartDelay?: DragStartDelay;
  constrainPosition?: DragConstrainPosition;
  previewClass?: string | string[];
  boundaryElement?: string;
  rootElementSelector?: string;
  draggingDisabled?: boolean;
  sortingDisabled?: boolean;
  listAutoScrollDisabled?: boolean;
  listOrientation?: DropListOrientation;
  zIndex?: number;
}
