/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Platform} from '@angular/cdk/platform';
import {DOCUMENT} from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ContentChildren,
  Directive,
  ElementRef,
  Inject,
  QueryList,
  ViewEncapsulation,
} from '@angular/core';
import {CanColor, mixinColor} from '@angular/material/core';
// Boilerplate for applying mixins to MatToolbar.
/** @docs-private */
const _MatToolbarBase = mixinColor(
  class {
    constructor(public _elementRef: ElementRef) {}
  },
);

@Directive({
  selector: 'mat-toolbar-row',
  exportAs: 'matToolbarRow',
  host: {'class': 'mat-toolbar-row'},
})
export class MatToolbarRow {}

@Component({
  selector: 'mat-toolbar',
  exportAs: 'matToolbar',
  templateUrl: 'toolbar.html',
  styleUrls: ['toolbar.css'],
  inputs: ['color'],
  host: {
    'class': 'mat-toolbar',
    '[class.mat-toolbar-multiple-rows]': '_toolbarRows.length > 0',
    '[class.mat-toolbar-single-row]': '_toolbarRows.length === 0',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class MatToolbar extends _MatToolbarBase implements CanColor, AfterViewInit {
  private _document: Document;

  /**
   * Reference to all toolbar row elements that have been projected.
   *
   * 到投影过来的所有工具栏行元素的引用。
   *
   */
  @ContentChildren(MatToolbarRow, {descendants: true}) _toolbarRows: QueryList<MatToolbarRow>;

  constructor(
    elementRef: ElementRef,
    private _platform: Platform,
    @Inject(DOCUMENT) document?: any,
  ) {
    super(elementRef);

    // TODO: make the document a required param when doing breaking changes.
    this._document = document;
  }

  ngAfterViewInit() {
    if (this._platform.isBrowser) {
      this._checkToolbarMixedModes();
      this._toolbarRows.changes.subscribe(() => this._checkToolbarMixedModes());
    }
  }

  /**
   * Throws an exception when developers are attempting to combine the different toolbar row modes.
   *
   * 当开发人员试图组合不同的工具栏行模式时会抛出异常。
   *
   */
  private _checkToolbarMixedModes() {
    if (this._toolbarRows.length && (typeof ngDevMode === 'undefined' || ngDevMode)) {
      // Check if there are any other DOM nodes that can display content but aren't inside of
      // a <mat-toolbar-row> element.
      const isCombinedUsage = Array.from<HTMLElement>(this._elementRef.nativeElement.childNodes)
        .filter(node => !(node.classList && node.classList.contains('mat-toolbar-row')))
        .filter(node => node.nodeType !== (this._document ? this._document.COMMENT_NODE : 8))
        .some(node => !!(node.textContent && node.textContent.trim()));

      if (isCombinedUsage) {
        throwToolbarMixedModesError();
      }
    }
  }
}

/**
 * Throws an exception when attempting to combine the different toolbar row modes.
 *
 * 当试图组合不同的工具栏行模式时抛出异常。
 *
 * @docs-private
 */
export function throwToolbarMixedModesError() {
  throw Error(
    'MatToolbar: Attempting to combine different toolbar modes. ' +
      'Either specify multiple `<mat-toolbar-row>` elements explicitly or just place content ' +
      'inside of a `<mat-toolbar>` for a single row.',
  );
}
