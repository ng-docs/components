/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

const mappings: [string, string][] = [
  ['display-4', 'headline-1'],
  ['display-3', 'headline-2'],
  ['display-2', 'headline-3'],
  ['display-1', 'headline-4'],
  ['headline', 'headline-5'],
  ['title', 'headline-6'],
  ['subheading-2', 'subtitle-1'],
  ['body-2', 'subtitle-2'],
  ['subheading-1', 'body-1'],
  ['body-1', 'body-2'],
];

/**
 * Mapping between the renamed legacy typography levels and their new non-legacy names. Based on
 * the mappings in `private-typography-to-2018-config` from `core/typography/_typography.scss`.
 *
 * 重命名的旧式版式级别与其新的非旧式名称之间的映射。基于 `core/typography/_typography.scss` 的 `private-typography-to-2018-config` 中的映射。
 *
 */
export const RENAMED_TYPOGRAPHY_LEVELS = new Map(mappings);

/**
 * Mapping between the renamed typography CSS classes and their non-legacy equivalents.
 *
 * 重命名的排版 CSS 类与其非旧版等效项之间的映射。
 *
 */
export const RENAMED_TYPOGRAPHY_CLASSES = new Map(
  mappings.map(m => ['mat-' + m[0], 'mat-' + m[1]]),
);

/**
 * Typography levels that have been combined into other levels with no replacement.
 *
 * 已合并到其他级别且无替代的排版级别。
 *
 */
export const COMBINED_TYPOGRAPHY_LEVELS = new Map([['input', 'body-1']]);
