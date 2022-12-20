/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Inject, Injectable, NgZone} from '@angular/core';
import {DOCUMENT} from '@angular/common';
import {FocusTrap, InteractivityChecker} from '@angular/cdk/a11y';
import {Observable, Subject} from 'rxjs';

/**
 * Value indicating whether focus left the target area before or after the enclosed elements.
 *
 * 一个值，用来指示焦点是在封闭元素之前还是之后离开的目标区域。
 *
 */
export const enum FocusEscapeNotifierDirection {
  START,
  END,
}

/**
 * Like FocusTrap, but rather than trapping focus within a dom region, notifies subscribers when
 * focus leaves the region.
 *
 * 与 FocusTrap 类似，但不是在 dom 区域内捕获焦点，而是在焦点离开该区域时通知订阅者。
 *
 */
export class FocusEscapeNotifier extends FocusTrap {
  private readonly _escapeSubject = new Subject<FocusEscapeNotifierDirection>();

  constructor(
    element: HTMLElement,
    checker: InteractivityChecker,
    ngZone: NgZone,
    document: Document,
  ) {
    super(element, checker, ngZone, document, true /* deferAnchors */);

    // The focus trap adds "anchors" at the beginning and end of a trapped region that redirect
    // focus. We override that redirect behavior here with simply emitting on a stream.
    this.startAnchorListener = () => {
      this._escapeSubject.next(FocusEscapeNotifierDirection.START);
      return true;
    };
    this.endAnchorListener = () => {
      this._escapeSubject.next(FocusEscapeNotifierDirection.END);
      return true;
    };

    this.attachAnchors();
  }

  escapes(): Observable<FocusEscapeNotifierDirection> {
    return this._escapeSubject;
  }
}

/**
 * Factory that allows easy instantiation of focus escape notifiers.
 *
 * 允许轻松实例化焦点逃逸通知器的工厂。
 *
 */
@Injectable({providedIn: 'root'})
export class FocusEscapeNotifierFactory {
  private _document: Document;

  constructor(
    private _checker: InteractivityChecker,
    private _ngZone: NgZone,
    @Inject(DOCUMENT) _document: any,
  ) {
    this._document = _document;
  }

  /**
   * Creates a focus escape notifier region around the given element.
   *
   * 在给定元素周围创建焦点逃逸通知区域。
   *
   * @param element The element around which focus will be monitored.
   *
   * 将要监视其焦点的周围元素。
   *
   * @returns
   *
   * The created focus escape notifier instance.
   *
   * 创建的焦点逃逸通知程序实例。
   *
   */
  create(element: HTMLElement): FocusEscapeNotifier {
    return new FocusEscapeNotifier(element, this._checker, this._ngZone, this._document);
  }
}
