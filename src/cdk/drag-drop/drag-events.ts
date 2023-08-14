/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import type {CdkDrag} from './directives/drag';
import type {CdkDropList} from './directives/drop-list';

/**
 * Event emitted when the user starts dragging a draggable.
 *
 * 当用户开始拖动拖动时会发出本事件。
 *
 */
export interface CdkDragStart<T = any> {
  /**
   * Draggable that emitted the event.
   *
   * 发出了本事件的可拖动对象。
   *
   */
  source: CdkDrag<T>;
  /**
   * Native event that started the drag sequence.
   *
   * 开始本拖动序列的原生事件。
   *
   */
  event: MouseEvent | TouchEvent;
}

/**
 * Event emitted when the user releases an item, before any animations have started.
 *
 * 用户在释放条目时发出的事件，发生在开始任何动画之前。
 *
 */
export interface CdkDragRelease<T = any> {
  /**
   * Draggable that emitted the event.
   *
   * 发出了本事件的可拖动对象。
   *
   */
  source: CdkDrag<T>;
  /**
   * Native event that caused the release event.
   *
   * 导致发出本事件的原生事件。
   *
   */
  event: MouseEvent | TouchEvent;
}

/**
 * Event emitted when the user stops dragging a draggable.
 *
 * 当用户停止拖动时会发出本事件。
 *
 */
export interface CdkDragEnd<T = any> {
  /**
   * Draggable that emitted the event.
   *
   * 发出了本事件的可拖动对象。
   *
   */
  source: CdkDrag<T>;
  /**
   * Distance in pixels that the user has dragged since the drag sequence started.
   *
   * 自拖曳序列启动以来用户拖动过的像素距离。
   *
   */
  distance: {x: number; y: number};
  /**
   * Position where the pointer was when the item was dropped
   *
   * 放置条目时指针所处的位置
   *
   */
  dropPoint: {x: number; y: number};
  /**
   * Native event that caused the dragging to stop.
   *
   * 导致本次拖动停止的原生事件。
   *
   */
  event: MouseEvent | TouchEvent;
}

/**
 * Event emitted when the user moves an item into a new drop container.
 *
 * 当用户把条目移到新的投送容器中时，就会发出本事件。
 *
 */
export interface CdkDragEnter<T = any, I = T> {
  /**
   * Container into which the user has moved the item.
   *
   * 用户移入了该条目的容器。
   *
   */
  container: CdkDropList<T>;
  /**
   * Item that was moved into the container.
   *
   * 被移入容器中的条目。
   *
   */
  item: CdkDrag<I>;
  /**
   * Index at which the item has entered the container.
   *
   * 该条目已进入该容器中的索引。
   *
   */
  currentIndex: number;
}

/**
 * Event emitted when the user removes an item from a
 * drop container by moving it into another one.
 *
 * 当用户把一个条目移到另一个投放容器，并从当前容器中移除时，就会触发本事件。
 *
 */
export interface CdkDragExit<T = any, I = T> {
  /**
   * Container from which the user has a removed an item.
   *
   * 用户已移除本条目的容器。
   *
   */
  container: CdkDropList<T>;
  /**
   * Item that was removed from the container.
   *
   * 已从容器中移除的条目
   *
   */
  item: CdkDrag<I>;
}

/**
 * Event emitted when the user drops a draggable item inside a drop container.
 *
 * 当用户在投送容器中放入一个可拖动条目时，就会发出本事件。
 *
 */
export interface CdkDragDrop<T, O = T, I = any> {
  /**
   * Index of the item when it was picked up.
   *
   * 该条目被拿起时的条目索引。
   *
   */
  previousIndex: number;
  /**
   * Current index of the item.
   *
   * 此条目的当前索引。
   *
   */
  currentIndex: number;
  /**
   * Item that is being dropped.
   *
   * 被投放的条目
   *
   */
  item: CdkDrag<I>;
  /**
   * Container in which the item was dropped.
   *
   * 该条目投送到的容器。
   *
   */
  container: CdkDropList<T>;
  /**
   * Container from which the item was picked up. Can be the same as the `container`.
   *
   * 从中拿出条目的容器。可以和 `container` 属性是同一个。
   *
   */
  previousContainer: CdkDropList<O>;
  /**
   * Whether the user's pointer was over the container when the item was dropped.
   *
   * 当条目被移除时，用户的指针是否还在容器上。
   *
   */
  isPointerOverContainer: boolean;
  /**
   * Distance in pixels that the user has dragged since the drag sequence started.
   *
   * 自拖曳序列启动以来用户拖动的像素距离。
   *
   */
  distance: {x: number; y: number};
  /**
   * Position where the pointer was when the item was dropped
   *
   * 放置条目时指针所处的位置
   *
   */
  dropPoint: {x: number; y: number};
  /**
   * Native event that caused the drop event.
   *
   * 导致放下（drop）事件的原生事件。
   *
   */
  event: MouseEvent | TouchEvent;
}

/**
 * Event emitted as the user is dragging a draggable item.
 *
 * 当用户正在拖动一个条目时，就会发出一个事件。
 *
 */
export interface CdkDragMove<T = any> {
  /**
   * Item that is being dragged.
   *
   * 被拖动的条目
   *
   */
  source: CdkDrag<T>;
  /**
   * Position of the user's pointer on the page.
   *
   * 用户指针在页面上的位置。
   *
   */
  pointerPosition: {x: number; y: number};
  /**
   * Native event that is causing the dragging.
   *
   * 导致拖曳的原生事件
   *
   */
  event: MouseEvent | TouchEvent;
  /**
   * Distance in pixels that the user has dragged since the drag sequence started.
   *
   * 自拖曳序列启动以来用户已拖动的像素距离。
   *
   */
  distance: {x: number; y: number};
  /**
   * Indicates the direction in which the user is dragging the element along each axis.
   * `1` means that the position is increasing (e.g. the user is moving to the right or downwards),
   * whereas `-1` means that it's decreasing (they're moving to the left or upwards). `0` means
   * that the position hasn't changed.
   *
   * 指示用户沿每个轴拖动元素的方向。`1` 表示位置在增加（例如，用户向右或向下移动），而 `-1` 表示它正在减少（它们向左或向上移动）。`0` 意味着该位置没有变化。
   *
   */
  delta: {x: -1 | 0 | 1; y: -1 | 0 | 1};
}

/**
 * Event emitted when the user swaps the position of two drag items.
 *
 * 当用户交换两个拖动条目的位置时，会发出一个事件。
 *
 */
export interface CdkDragSortEvent<T = any, I = T> {
  /**
   * Index from which the item was sorted previously.
   *
   * 该条目在先前排序中的索引。
   *
   */
  previousIndex: number;
  /**
   * Index that the item is currently in.
   *
   * 该条目在当前排序中的索引
   *
   */
  currentIndex: number;
  /**
   * Container that the item belongs to.
   *
   * 该条目所属的容器。
   *
   */
  container: CdkDropList<T>;
  /**
   * Item that is being sorted.
   *
   * 正在排序的条目
   *
   */
  item: CdkDrag<I>;
}
