/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {Injectable, CSP_NONCE, Optional, Inject} from '@angular/core';
import {Platform} from '@angular/cdk/platform';

/**
 * Global registry for all dynamically-created, injected media queries.
 *
 * 所有动态创建、注入的媒体查询的全局注册表。
 *
 */
const mediaQueriesForWebkitCompatibility: Set<string> = new Set<string>();

/**
 * Style tag that holds all of the dynamically-created media queries.
 *
 * 包含所有动态创建的媒体查询的样式标记。
 *
 */
let mediaQueryStyleNode: HTMLStyleElement | undefined;

/**
 * A utility for calling matchMedia queries.
 *
 * 调用 matchMedia 查询的实用工具。
 *
 */
@Injectable({providedIn: 'root'})
export class MediaMatcher {
  /**
   * The internal matchMedia method to return back a MediaQueryList like object.
   *
   * 内部的 matchMedia 方法返回类似 MediaQueryList 的对象。
   *
   */
  private _matchMedia: (query: string) => MediaQueryList;

  constructor(
    private _platform: Platform,
    @Optional() @Inject(CSP_NONCE) private _nonce?: string | null,
  ) {
    this._matchMedia =
      this._platform.isBrowser && window.matchMedia
        ? // matchMedia is bound to the window scope intentionally as it is an illegal invocation to
          // call it from a different scope.
          window.matchMedia.bind(window)
        : noopMatchMedia;
  }

  /**
   * Evaluates the given media query and returns the native MediaQueryList from which results
   * can be retrieved.
   * Confirms the layout engine will trigger for the selector query provided and returns the
   * MediaQueryList for the query provided.
   *
   * 计算指定的媒体查询，并返回可以从中检索结果的原生 MediaQueryList。确认布局引擎会触发所提供的选择器查询，并为提供的查询返回 MediaQueryList。
   *
   */
  matchMedia(query: string): MediaQueryList {
    if (this._platform.WEBKIT || this._platform.BLINK) {
      createEmptyStyleRule(query, this._nonce);
    }
    return this._matchMedia(query);
  }
}

/**
 * Creates an empty stylesheet that is used to work around browser inconsistencies related to
 * `matchMedia`. At the time of writing, it handles the following cases:
 *
 * 创建一个空样式表，用于解决与 `matchMedia` 相关的浏览器不一致问题。在撰写本文时，它处理以下情况：
 *
 * 1. On WebKit browsers, a media query has to have at least one rule in order for `matchMedia`
 *    to fire. We work around it by declaring a dummy stylesheet with a `@media` declaration.
 *
 *    在 WebKit 浏览器上，媒体查询必须至少有一个规则才能 `matchMedia` 。我们通过使用 `@media` 声明一个虚拟样式表来解决它。
 *
 * 2. In some cases Blink browsers will stop firing the `matchMedia` listener if none of the rules
 *    inside the `@media` match existing elements on the page. We work around it by having one rule
 *    targeting the `body`. See https://github.com/angular/components/issues/23546.
 *
 *    在某些情况下，如果 `@media` 中的任何规则都不能匹配页面上的现有元素，则 Blink 浏览器将停止触发 `matchMedia` 侦听器。我们通过制定一个针对 `body` 的规则来解决它。请参阅 https://github.com/angular/components/issues/23546 。
 *
 */
function createEmptyStyleRule(query: string, nonce: string | undefined | null) {
  if (mediaQueriesForWebkitCompatibility.has(query)) {
    return;
  }

  try {
    if (!mediaQueryStyleNode) {
      mediaQueryStyleNode = document.createElement('style');

      if (nonce) {
        mediaQueryStyleNode.nonce = nonce;
      }

      mediaQueryStyleNode.setAttribute('type', 'text/css');
      document.head!.appendChild(mediaQueryStyleNode);
    }

    if (mediaQueryStyleNode.sheet) {
      mediaQueryStyleNode.sheet.insertRule(`@media ${query} {body{ }}`, 0);
      mediaQueriesForWebkitCompatibility.add(query);
    }
  } catch (e) {
    console.error(e);
  }
}

/**
 * No-op matchMedia replacement for non-browser platforms.
 *
 * 为非浏览器平台准备的 matchMedia 替代品。
 *
 */
function noopMatchMedia(query: string): MediaQueryList {
  // Use `as any` here to avoid adding additional necessary properties for
  // the noop matcher.
  return {
    matches: query === 'all' || query === '',
    media: query,
    addListener: () => {},
    removeListener: () => {},
  } as any;
}
