/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {Injectable} from '@angular/core';
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

  constructor(private _platform: Platform) {
    this._matchMedia = this._platform.isBrowser && window.matchMedia ?
      // matchMedia is bound to the window scope intentionally as it is an illegal invocation to
      // call it from a different scope.
      window.matchMedia.bind(window) :
      noopMatchMedia;
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
    if (this._platform.WEBKIT) {
      createEmptyStyleRule(query);
    }
    return this._matchMedia(query);
  }
}

/**
 * For Webkit engines that only trigger the MediaQueryListListener when
 * there is at least one CSS selector for the respective media query.
 *
 * 针对那些只有当媒体查询中至少有一个 CSS 选择器时才触发 MediaQueryListListener 的 Webkit 引擎。
 *
 */
function createEmptyStyleRule(query: string) {
  if (mediaQueriesForWebkitCompatibility.has(query)) {
    return;
  }

  try {
    if (!mediaQueryStyleNode) {
      mediaQueryStyleNode = document.createElement('style');
      mediaQueryStyleNode.setAttribute('type', 'text/css');
      document.head!.appendChild(mediaQueryStyleNode);
    }

    if (mediaQueryStyleNode.sheet) {
      (mediaQueryStyleNode.sheet as CSSStyleSheet)
          .insertRule(`@media ${query} {.fx-query-test{ }}`, 0);
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
    removeListener: () => {}
  } as any;
}
