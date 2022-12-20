/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

/**
 * Stores the data needed to make a single update to a file.
 *
 * 存储对文件进行单次更新所需的数据。
 *
 */
export interface Update {
  /**
   * The start index of the location of the update.
   *
   * 更新位置的起始索引。
   *
   */
  offset: number;

  /**
   * A function to be used to update the file content.
   *
   * 用于更新文件内容的函数。
   *
   */
  updateFn: (text: string) => string;
}

/**
 * Applies the updates to the given file content in reverse offset order.
 *
 * 以反向偏移顺序将更新应用于给定的文件内容。
 *
 */
export function writeUpdates(content: string, updates: Update[]): string {
  updates.sort((a, b) => b.offset - a.offset);
  updates.forEach(update => (content = update.updateFn(content)));
  return content;
}
