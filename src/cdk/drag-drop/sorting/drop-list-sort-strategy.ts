/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Direction} from '@angular/cdk/bidi';

/**
 * Function that is used to determine whether an item can be sorted into a particular index.
 *
 * 用于确定项目是否可以排序到特定索引中的函数。
 *
 * @docs-private
 */
export type SortPredicate<T> = (index: number, item: T) => boolean;

/**
 * Item that can be sorted within `DropListSortStrategy`. This is a limited representation of
 * `DragRef` used to avoid circular dependencies. It is intended to only be used within
 * `DropListSortStrategy`.
 *
 * 可以在 `DropListSortStrategy` 中排序的项目。这是 `DragRef` 的有限表示，用于避免循环依赖。它仅用于 `DropListSortStrategy` 。
 *
 * @docs-private
 */
export interface DropListSortStrategyItem {
  isDragging(): boolean;
  getPlaceholderElement(): HTMLElement;
  getRootElement(): HTMLElement;
  _sortFromLastPointerPosition(): void;
  getVisibleElement(): HTMLElement;
}

/**
 * Strategy used to sort and position items within a drop list.
 *
 * 用于对下拉列表中的项目进行排序和定位的策略。
 *
 * @docs-private
 */
export interface DropListSortStrategy<T extends DropListSortStrategyItem> {
  direction: Direction;
  start(items: readonly T[]): void;
  sort(
    item: T,
    pointerX: number,
    pointerY: number,
    pointerDelta: {x: number; y: number},
  ): {previousIndex: number; currentIndex: number} | null;
  enter(item: T, pointerX: number, pointerY: number, index?: number): void;
  withItems(items: readonly T[]): void;
  withSortPredicate(predicate: SortPredicate<T>): void;
  reset(): void;
  getActiveItemsSnapshot(): readonly T[];
  getItemIndex(item: T): number;
  updateOnScroll(topDifference: number, leftDifference: number): void;
}
