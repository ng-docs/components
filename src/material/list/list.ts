/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Platform} from '@angular/cdk/platform';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  ContentChildren,
  ElementRef,
  Inject,
  NgZone,
  Optional,
  QueryList,
  ViewChild,
  ViewEncapsulation,
  InjectionToken,
} from '@angular/core';
import {MAT_RIPPLE_GLOBAL_OPTIONS, RippleGlobalOptions} from '@angular/material/core';
import {ANIMATION_MODULE_TYPE} from '@angular/platform-browser/animations';
import {MatListBase, MatListItemBase} from './list-base';
import {MatListItemLine, MatListItemMeta, MatListItemTitle} from './list-item-sections';
import {coerceBooleanProperty} from '@angular/cdk/coercion';

/**
 * Injection token that can be used to inject instances of `MatList`. It serves as
 * alternative token to the actual `MatList` class which could cause unnecessary
 * retention of the class and its component metadata.
 *
 * 这个注入令牌可以用来注入 `MatList` 实例。它可以作为实际 `MatList` 类的备用令牌，如果使用真实类可能导致此类及其组件元数据无法优化掉。
 *
 */
export const MAT_LIST = new InjectionToken<MatList>('MatList');

@Component({
  selector: 'mat-list',
  exportAs: 'matList',
  template: '<ng-content></ng-content>',
  host: {
    'class': 'mat-mdc-list mat-mdc-list-base mdc-list',
  },
  styleUrls: ['list.css'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{provide: MatListBase, useExisting: MatList}],
})
export class MatList extends MatListBase {}

@Component({
  selector: 'mat-list-item, a[mat-list-item], button[mat-list-item]',
  exportAs: 'matListItem',
  host: {
    'class': 'mat-mdc-list-item mdc-list-item',
    '[class.mdc-list-item--activated]': 'activated',
    '[class.mdc-list-item--with-leading-avatar]': '_avatars.length !== 0',
    '[class.mdc-list-item--with-leading-icon]': '_icons.length !== 0',
    '[class.mdc-list-item--with-trailing-meta]': '_meta.length !== 0',
    '[class._mat-animation-noopable]': '_noopAnimations',
    '[attr.aria-current]': '_getAriaCurrent()',
  },
  templateUrl: 'list-item.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatListItem extends MatListItemBase {
  @ContentChildren(MatListItemLine, {descendants: true}) _lines: QueryList<MatListItemLine>;
  @ContentChildren(MatListItemTitle, {descendants: true}) _titles: QueryList<MatListItemTitle>;
  @ContentChildren(MatListItemMeta, {descendants: true}) _meta: QueryList<MatListItemMeta>;
  @ViewChild('unscopedContent') _unscopedContent: ElementRef<HTMLSpanElement>;
  @ViewChild('text') _itemText: ElementRef<HTMLElement>;

  /** Indicates whether an item in a `<mat-nav-list>` is the currently active page. */
  @Input()
  get activated() {
    return this._activated;
  }
  set activated(activated) {
    this._activated = coerceBooleanProperty(activated);
  }
  _activated = false;

  constructor(
    element: ElementRef,
    ngZone: NgZone,
    @Optional() listBase: MatListBase | null,
    platform: Platform,
    @Optional() @Inject(MAT_RIPPLE_GLOBAL_OPTIONS) globalRippleOptions?: RippleGlobalOptions,
    @Optional() @Inject(ANIMATION_MODULE_TYPE) animationMode?: string,
  ) {
    super(element, ngZone, listBase, platform, globalRippleOptions, animationMode);
  }

  /**
   * Determine the value of `aria-current`. Return 'page' if this item is an activated anchor tag.
   * Otherwise, return `null`. This method is safe to use with server-side rendering.
   */
  _getAriaCurrent(): string | null {
    return this._hostElement.nodeName === 'A' && this._activated ? 'page' : null;
  }
}
