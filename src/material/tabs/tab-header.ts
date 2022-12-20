/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  AfterContentChecked,
  AfterContentInit,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChildren,
  Directive,
  ElementRef,
  Inject,
  Input,
  NgZone,
  OnDestroy,
  Optional,
  QueryList,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import {ViewportRuler} from '@angular/cdk/scrolling';
import {Platform} from '@angular/cdk/platform';
import {Directionality} from '@angular/cdk/bidi';
import {ANIMATION_MODULE_TYPE} from '@angular/platform-browser/animations';
import {MatTabLabelWrapper} from './tab-label-wrapper';
import {MatInkBar} from './ink-bar';
import {MatPaginatedTabHeader} from './paginated-tab-header';
import {BooleanInput, coerceBooleanProperty} from '@angular/cdk/coercion';

/**
 * Base class with all of the `MatTabHeader` functionality.
 *
 * 具备所有 `MatTabHeader` 功能的基类。
 *
 * @docs-private
 */
@Directive()
export abstract class _MatTabHeaderBase
  extends MatPaginatedTabHeader
  implements AfterContentChecked, AfterContentInit, AfterViewInit, OnDestroy
{
  /**
   * Whether the ripple effect is disabled or not.
   *
   * 是否禁用了涟漪效果。
   *
   */
  @Input()
  get disableRipple(): boolean {
    return this._disableRipple;
  }

  set disableRipple(value: BooleanInput) {
    this._disableRipple = coerceBooleanProperty(value);
  }

  private _disableRipple: boolean = false;

  constructor(
    elementRef: ElementRef,
    changeDetectorRef: ChangeDetectorRef,
    viewportRuler: ViewportRuler,
    @Optional() dir: Directionality,
    ngZone: NgZone,
    platform: Platform,
    @Optional() @Inject(ANIMATION_MODULE_TYPE) animationMode?: string,
  ) {
    super(elementRef, changeDetectorRef, viewportRuler, dir, ngZone, platform, animationMode);
  }

  protected _itemSelected(event: KeyboardEvent) {
    event.preventDefault();
  }
}

/**
 * The header of the tab group which displays a list of all the tabs in the tab group. Includes
 * an ink bar that follows the currently selected tab. When the tabs list's width exceeds the
 * width of the header container, then arrows will be displayed to allow the user to scroll
 * left and right across the header.
 *
 * 选项卡组的标题，显示选项卡组中所有选项卡的列表。包含一个跟随当前选定选项卡的墨水条。当选项卡列表的宽度超出标头容器的宽度时，就会显示箭头，让用户可以在标头中左右滚动。
 *
 * @docs-private
 */
@Component({
  selector: 'mat-tab-header',
  templateUrl: 'tab-header.html',
  styleUrls: ['tab-header.css'],
  inputs: ['selectedIndex'],
  outputs: ['selectFocusedIndex', 'indexFocused'],
  encapsulation: ViewEncapsulation.None,
  // tslint:disable-next-line:validate-decorators
  changeDetection: ChangeDetectionStrategy.Default,
  host: {
    'class': 'mat-mdc-tab-header',
    '[class.mat-mdc-tab-header-pagination-controls-enabled]': '_showPaginationControls',
    '[class.mat-mdc-tab-header-rtl]': "_getLayoutDirection() == 'rtl'",
  },
})
export class MatTabHeader extends _MatTabHeaderBase implements AfterContentInit {
  @ContentChildren(MatTabLabelWrapper, {descendants: false}) _items: QueryList<MatTabLabelWrapper>;
  @ViewChild('tabListContainer', {static: true}) _tabListContainer: ElementRef;
  @ViewChild('tabList', {static: true}) _tabList: ElementRef;
  @ViewChild('tabListInner', {static: true}) _tabListInner: ElementRef;
  @ViewChild('nextPaginator') _nextPaginator: ElementRef<HTMLElement>;
  @ViewChild('previousPaginator') _previousPaginator: ElementRef<HTMLElement>;
  _inkBar: MatInkBar;

  constructor(
    elementRef: ElementRef,
    changeDetectorRef: ChangeDetectorRef,
    viewportRuler: ViewportRuler,
    @Optional() dir: Directionality,
    ngZone: NgZone,
    platform: Platform,
    @Optional() @Inject(ANIMATION_MODULE_TYPE) animationMode?: string,
  ) {
    super(elementRef, changeDetectorRef, viewportRuler, dir, ngZone, platform, animationMode);
  }

  override ngAfterContentInit() {
    this._inkBar = new MatInkBar(this._items);
    super.ngAfterContentInit();
  }
}
