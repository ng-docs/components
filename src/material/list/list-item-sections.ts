/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Directive, ElementRef, Inject, Optional} from '@angular/core';
import {LIST_OPTION, ListOption} from './list-option-types';

/**
 * Directive capturing the title of a list item. A list item usually consists of a
 * title and optional secondary or tertiary lines.
 *
 * 指令捕获列表条目的标题。列表条目通常由标题和可选的第二行或第三行组成。
 *
 * Text content for the title never wraps. There can only be a single title per list item.
 *
 * 标题的文本内容从不换行。每个列表条目只能有一个标题。
 *
 */
@Directive({
  selector: '[matListItemTitle]',
  host: {'class': 'mat-mdc-list-item-title mdc-list-item__primary-text'},
})
export class MatListItemTitle {
  constructor(public _elementRef: ElementRef<HTMLElement>) {}
}

/**
 * Directive capturing a line in a list item. A list item usually consists of a
 * title and optional secondary or tertiary lines.
 *
 * 此指令捕获列表条目中的一行。列表条目通常由标题和可选的第二行或第三行组成。
 *
 * Text content inside a line never wraps. There can be at maximum two lines per list item.
 *
 * 一行内的文本内容从不换行。每个列表条目最多可以有两行。
 *
 */
@Directive({
  selector: '[matListItemLine]',
  host: {'class': 'mat-mdc-list-item-line mdc-list-item__secondary-text'},
})
export class MatListItemLine {
  constructor(public _elementRef: ElementRef<HTMLElement>) {}
}

/**
 * Directive matching an optional meta section for list items.
 *
 * 此指令匹配列表条目的可选元区段。
 *
 * List items can reserve space at the end of an item to display a control,
 * button or additional text content.
 *
 * 列表条目可以在条目的末尾预留空间以显示控件、按钮或附加文本内容。
 *
 */
@Directive({
  selector: '[matListItemMeta]',
  host: {'class': 'mat-mdc-list-item-meta mdc-list-item__end'},
})
export class MatListItemMeta {}

/**
 * @docs-private
 *
 * MDC uses the very intuitively named classes `.mdc-list-item__start` and `.mat-list-item__end` to
 * position content such as icons or checkboxes/radios that comes either before or after the text
 * content respectively. This directive detects the placement of the checkbox/radio and applies the
 * correct MDC class to position the icon/avatar on the opposite side.
 */
@Directive({
  host: {
    // MDC uses intuitively named classes `.mdc-list-item__start` and `.mat-list-item__end` to
    // position content such as icons or checkboxes/radios that comes either before or after the
    // text content respectively. This directive detects the placement of the checkbox/radio and
    // applies the correct MDC class to position the icon/avatar on the opposite side.
    '[class.mdc-list-item__start]': '_isAlignedAtStart()',
    '[class.mdc-list-item__end]': '!_isAlignedAtStart()',
  },
})
export class _MatListItemGraphicBase {
  constructor(@Optional() @Inject(LIST_OPTION) public _listOption: ListOption) {}

  _isAlignedAtStart() {
    // By default, in all list items the graphic is aligned at start. In list options,
    // the graphic is only aligned at start if the checkbox/radio is at the end.
    return !this._listOption || this._listOption?._getTogglePosition() === 'after';
  }
}

/**
 * Directive matching an optional avatar within a list item.
 *
 * 与列表条目中的可选头像匹配的指令。
 *
 * List items can reserve space at the beginning of an item to display an avatar.
 *
 * 列表条目可以在条目的开头预留空间来显示头像。
 *
 */
@Directive({
  selector: '[matListItemAvatar]',
  host: {'class': 'mat-mdc-list-item-avatar'},
})
export class MatListItemAvatar extends _MatListItemGraphicBase {}

/**
 * Directive matching an optional icon within a list item.
 *
 * 与列表条目中的可选图标匹配的指令。
 *
 * List items can reserve space at the beginning of an item to display an icon.
 *
 * 列表条目可以在条目的开头预留空间来显示图标。
 *
 */
@Directive({
  selector: '[matListItemIcon]',
  host: {'class': 'mat-mdc-list-item-icon'},
})
export class MatListItemIcon extends _MatListItemGraphicBase {}
