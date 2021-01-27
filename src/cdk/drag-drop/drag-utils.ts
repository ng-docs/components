/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

/**
 * Moves an item one index in an array to another.
 *
 * 把某个条目从数组中的一个索引号移到另一个索引号。
 *
 * @param array Array in which to move the item.
 *
 * 要移动此条目的数组。
 *
 * @param fromIndex Starting index of the item.
 *
 * 此条目的起始索引。
 *
 * @param toIndex Index to which the item should be moved.
 *
 * 此条目应该移到的索引。
 *
 */
export function moveItemInArray<T = any>(array: T[], fromIndex: number, toIndex: number): void {
  const from = clamp(fromIndex, array.length - 1);
  const to = clamp(toIndex, array.length - 1);

  if (from === to) {
    return;
  }

  const target = array[from];
  const delta = to < from ? -1 : 1;

  for (let i = from; i !== to; i += delta) {
    array[i] = array[i + delta];
  }

  array[to] = target;
}

/**
 * Moves an item from one array to another.
 *
 * 把一个条目从一个数组移动到另一个数组。
 *
 * @param currentArray Array from which to transfer the item.
 *
 * 要从中传输该条目的数组。
 *
 * @param targetArray Array into which to put the item.
 *
 * 要放入该条目的数组。
 *
 * @param currentIndex Index of the item in its current array.
 *
 * 当前数组中该条目的索引。
 *
 * @param targetIndex Index at which to insert the item.
 *
 * 该条目要插入到的索引。
 *
 */
export function transferArrayItem<T = any>(currentArray: T[],
                                           targetArray: T[],
                                           currentIndex: number,
                                           targetIndex: number): void {
  const from = clamp(currentIndex, currentArray.length - 1);
  const to = clamp(targetIndex, targetArray.length);

  if (currentArray.length) {
    targetArray.splice(to, 0, currentArray.splice(from, 1)[0]);
  }
}

/**
 * Copies an item from one array to another, leaving it in its
 * original position in current array.
 *
 * 将一个条目从一个数组复制到另一个数组，并把它放在当前数组的原始位置。
 *
 * @param currentArray Array from which to copy the item.
 *
 * 要从中复制条目的数组。
 *
 * @param targetArray Array into which is copy the item.
 *
 * 要把该条目复制到的数组。
 *
 * @param currentIndex Index of the item in its current array.
 *
 * 该条目在当前数组中的索引。
 *
 * @param targetIndex Index at which to insert the item.
 *
 * 该条目在目标数组中要插入的索引。
 *
 */
export function copyArrayItem<T = any>(currentArray: T[],
                                       targetArray: T[],
                                       currentIndex: number,
                                       targetIndex: number): void {
  const to = clamp(targetIndex, targetArray.length);

  if (currentArray.length) {
    targetArray.splice(to, 0, currentArray[currentIndex]);
  }
}

/**
 * Clamps a number between zero and a maximum.
 *
 * 在 0 到最大值之间夹取一个数字。
 *
 */
function clamp(value: number, max: number): number {
  return Math.max(0, Math.min(max, value));
}
