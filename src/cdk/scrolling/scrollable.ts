/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Directionality} from '@angular/cdk/bidi';
import {
  getRtlScrollAxisType,
  RtlScrollAxisType,
  supportsScrollBehavior,
} from '@angular/cdk/platform';
import {Directive, ElementRef, NgZone, OnDestroy, OnInit, Optional} from '@angular/core';
import {fromEvent, Observable, Subject, Observer} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {ScrollDispatcher} from './scroll-dispatcher';

export type _Without<T> = {[P in keyof T]?: never};
export type _XOR<T, U> = (_Without<T> & U) | (_Without<U> & T);
export type _Top = {top?: number};
export type _Bottom = {bottom?: number};
export type _Left = {left?: number};
export type _Right = {right?: number};
export type _Start = {start?: number};
export type _End = {end?: number};
export type _XAxis = _XOR<_XOR<_Left, _Right>, _XOR<_Start, _End>>;
export type _YAxis = _XOR<_Top, _Bottom>;

/**
 * An extended version of ScrollToOptions that allows expressing scroll offsets relative to the
 * top, bottom, left, right, start, or end of the viewport rather than just the top and left.
 * Please note: the top and bottom properties are mutually exclusive, as are the left, right,
 * start, and end properties.
 *
 * ScrollToOptions 的扩展版本，允许表达相对于视口顶部、底部、左侧、右侧、开头或结尾的滚动偏移量，而不仅仅是顶部和左侧。
 * 请注意：top 和 bottom 属性是互斥的，left 和 right、start 和 end 属性也是如此。
 *
 */
export type ExtendedScrollToOptions = _XAxis & _YAxis & ScrollOptions;

/**
 * Sends an event when the directive's element is scrolled. Registers itself with the
 * ScrollDispatcher service to include itself as part of its collection of scrolling events that it
 * can be listened to through the service.
 *
 * 该指令的元素发生滚动时发送一个事件。使用 ScrollDispatcher 服务注册自己，以便把自己包含在滚动事件集合中，并通过该服务来监听。
 *
 */
@Directive({
  selector: '[cdk-scrollable], [cdkScrollable]',
  standalone: true,
})
export class CdkScrollable implements OnInit, OnDestroy {
  protected readonly _destroyed = new Subject<void>();

  protected _elementScrolled: Observable<Event> = new Observable((observer: Observer<Event>) =>
    this.ngZone.runOutsideAngular(() =>
      fromEvent(this.elementRef.nativeElement, 'scroll')
        .pipe(takeUntil(this._destroyed))
        .subscribe(observer),
    ),
  );

  constructor(
    protected elementRef: ElementRef<HTMLElement>,
    protected scrollDispatcher: ScrollDispatcher,
    protected ngZone: NgZone,
    @Optional() protected dir?: Directionality,
  ) {}

  ngOnInit() {
    this.scrollDispatcher.register(this);
  }

  ngOnDestroy() {
    this.scrollDispatcher.deregister(this);
    this._destroyed.next();
    this._destroyed.complete();
  }

  /**
   * Returns observable that emits when a scroll event is fired on the host element.
   *
   * 返回在宿主元素上发生 scroll 事件时会触发的可观察对象。
   *
   */
  elementScrolled(): Observable<Event> {
    return this._elementScrolled;
  }

  /**
   * Gets the ElementRef for the viewport.
   *
   * 获取视口的 ElementRef。
   *
   */
  getElementRef(): ElementRef<HTMLElement> {
    return this.elementRef;
  }

  /**
   * Scrolls to the specified offsets. This is a normalized version of the browser's native scrollTo
   * method, since browsers are not consistent about what scrollLeft means in RTL. For this method
   * left and right always refer to the left and right side of the scrolling container irrespective
   * of the layout direction. start and end refer to left and right in an LTR context and vice-versa
   * in an RTL context.
   *
   * 滚动到指定的偏移量。这是浏览器原生 scrollTo 方法的标准化版本，因为各个浏览器对于 scrollLeft 在 RTL 中的理解并不一致。
   * 对于此方法，无论布局方向如何，左右都总是指向滚动容器的左侧和右侧。start 和 end 在 LTR 上下文中分别指向左右，在 RTL 上下文中则相反。
   *
   * @param options specified the offsets to scroll to.
   *
   * 指定要滚动到的偏移量。
   *
   */
  scrollTo(options: ExtendedScrollToOptions): void {
    const el = this.elementRef.nativeElement;
    const isRtl = this.dir && this.dir.value == 'rtl';

    // Rewrite start & end offsets as right or left offsets.
    if (options.left == null) {
      options.left = isRtl ? options.end : options.start;
    }

    if (options.right == null) {
      options.right = isRtl ? options.start : options.end;
    }

    // Rewrite the bottom offset as a top offset.
    if (options.bottom != null) {
      (options as _Without<_Bottom> & _Top).top =
        el.scrollHeight - el.clientHeight - options.bottom;
    }

    // Rewrite the right offset as a left offset.
    if (isRtl && getRtlScrollAxisType() != RtlScrollAxisType.NORMAL) {
      if (options.left != null) {
        (options as _Without<_Left> & _Right).right =
          el.scrollWidth - el.clientWidth - options.left;
      }

      if (getRtlScrollAxisType() == RtlScrollAxisType.INVERTED) {
        options.left = options.right;
      } else if (getRtlScrollAxisType() == RtlScrollAxisType.NEGATED) {
        options.left = options.right ? -options.right : options.right;
      }
    } else {
      if (options.right != null) {
        (options as _Without<_Right> & _Left).left =
          el.scrollWidth - el.clientWidth - options.right;
      }
    }

    this._applyScrollToOptions(options);
  }

  private _applyScrollToOptions(options: ScrollToOptions): void {
    const el = this.elementRef.nativeElement;

    if (supportsScrollBehavior()) {
      el.scrollTo(options);
    } else {
      if (options.top != null) {
        el.scrollTop = options.top;
      }
      if (options.left != null) {
        el.scrollLeft = options.left;
      }
    }
  }

  /**
   * Measures the scroll offset relative to the specified edge of the viewport. This method can be
   * used instead of directly checking scrollLeft or scrollTop, since browsers are not consistent
   * about what scrollLeft means in RTL. The values returned by this method are normalized such that
   * left and right always refer to the left and right side of the scrolling container irrespective
   * of the layout direction. start and end refer to left and right in an LTR context and vice-versa
   * in an RTL context.
   *
   * 测量相对于视口指定边缘的滚动偏移量。这个方法可以用来代替对 scrollLeft 或 scrollTop 的直接检查，因为各浏览器对于 scrollLeft 在 RTL 中的理解并不一致。
   * 该方法返回的值是标准化的，左右都总是指向滚动容器的左侧和右侧，与布局方向无关。start 和 end 在 LTR 上下文中指向左右，在 RTL 上下文则相反。
   *
   * @param from The edge to measure from.
   *
   * 要测量的边缘。
   *
   */
  measureScrollOffset(from: 'top' | 'left' | 'right' | 'bottom' | 'start' | 'end'): number {
    const LEFT = 'left';
    const RIGHT = 'right';
    const el = this.elementRef.nativeElement;
    if (from == 'top') {
      return el.scrollTop;
    }
    if (from == 'bottom') {
      return el.scrollHeight - el.clientHeight - el.scrollTop;
    }

    // Rewrite start & end as left or right offsets.
    const isRtl = this.dir && this.dir.value == 'rtl';
    if (from == 'start') {
      from = isRtl ? RIGHT : LEFT;
    } else if (from == 'end') {
      from = isRtl ? LEFT : RIGHT;
    }

    if (isRtl && getRtlScrollAxisType() == RtlScrollAxisType.INVERTED) {
      // For INVERTED, scrollLeft is (scrollWidth - clientWidth) when scrolled all the way left and
      // 0 when scrolled all the way right.
      if (from == LEFT) {
        return el.scrollWidth - el.clientWidth - el.scrollLeft;
      } else {
        return el.scrollLeft;
      }
    } else if (isRtl && getRtlScrollAxisType() == RtlScrollAxisType.NEGATED) {
      // For NEGATED, scrollLeft is -(scrollWidth - clientWidth) when scrolled all the way left and
      // 0 when scrolled all the way right.
      if (from == LEFT) {
        return el.scrollLeft + el.scrollWidth - el.clientWidth;
      } else {
        return -el.scrollLeft;
      }
    } else {
      // For NORMAL, as well as non-RTL contexts, scrollLeft is 0 when scrolled all the way left and
      // (scrollWidth - clientWidth) when scrolled all the way right.
      if (from == LEFT) {
        return el.scrollLeft;
      } else {
        return el.scrollWidth - el.clientWidth - el.scrollLeft;
      }
    }
  }
}
