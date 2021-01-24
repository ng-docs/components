/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  Directive,
  Output,
  Input,
  EventEmitter,
  AfterContentInit,
  OnDestroy,
} from '@angular/core';

import {Direction, Directionality} from './directionality';

/**
 * Directive to listen for changes of direction of part of the DOM.
 *
 * 该指令侦听部分 DOM 的方向变化。
 *
 * Provides itself as Directionality such that descendant directives only need to ever inject
 * Directionality to get the closest direction.
 *
 * 通过把自身提供为 Directionality，可以让后代指令只需要注入 Directionality 就能得到最接近的方向。
 *
 */
@Directive({
  selector: '[dir]',
  providers: [{provide: Directionality, useExisting: Dir}],
  host: {'[attr.dir]': '_rawDir'},
  exportAs: 'dir',
})
export class Dir implements Directionality, AfterContentInit, OnDestroy {
  /**
   * Normalized direction that accounts for invalid/unsupported values.
   *
   * 规范化之后的方向，以接受无效的值和不支持的值。
   *
   */
  private _dir: Direction = 'ltr';

  /**
   * Whether the `value` has been set to its initial value.
   *
   * 该 `value` 是否已设置为初始值。
   *
   */
  private _isInitialized: boolean = false;

  /**
   * Direction as passed in by the consumer.
   *
   * 由消费者传入的方向。
   *
   */
  _rawDir: string;

  /**
   * Event emitted when the direction changes.
   *
   * 当方向发生变化时会触发本事件。
   *
   */
  @Output('dirChange') change = new EventEmitter<Direction>();

  /** @docs-private */
  @Input()
  get dir(): Direction { return this._dir; }
  set dir(value: Direction) {
    const old = this._dir;
    const normalizedValue = value ? value.toLowerCase() : value;

    this._rawDir = value;
    this._dir = (normalizedValue === 'ltr' || normalizedValue === 'rtl') ? normalizedValue : 'ltr';

    if (old !== this._dir && this._isInitialized) {
      this.change.emit(this._dir);
    }
  }

  /**
   * Current layout direction of the element.
   *
   * 该元素的当前布局方向。
   *
   */
  get value(): Direction { return this.dir; }

  /**
   * Initialize once default value has been set.
   *
   * 一旦设置了默认值，就初始化一次。
   *
   */
  ngAfterContentInit() {
    this._isInitialized = true;
  }

  ngOnDestroy() {
    this.change.complete();
  }
}

