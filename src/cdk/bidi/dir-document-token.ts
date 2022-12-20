/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {DOCUMENT} from '@angular/common';
import {inject, InjectionToken} from '@angular/core';

/**
 * Injection token used to inject the document into Directionality.
 * This is used so that the value can be faked in tests.
 *
 * 用于把 document 注入到 Directionality 中的注入令牌。这是为了可以在测试中伪造该值。
 *
 * We can't use the real document in tests because changing the real `dir` causes geometry-based
 * tests in Safari to fail.
 *
 * 我们不能在测试中使用真正的 document，因为改变真实的 `dir` 会导致 Safari 中基于几何的测试失败。
 *
 * We also can't re-provide the DOCUMENT token from platform-browser because the unit tests
 * themselves use things like `querySelector` in test code.
 *
 * 我们也无法从 platform-browser 中重新提供 DOCUMENT 令牌，因为单元测试本身会在测试代码中使用 `querySelector` 等。
 *
 * This token is defined in a separate file from Directionality as a workaround for
 * https://github.com/angular/angular/issues/22559
 *
 * 这个令牌是在 Directionality 的一个独立文件中定义的，用于解决 https://github.com/angular/angular/issues/22559 问题。
 *
 * @docs-private
 */
export const DIR_DOCUMENT = new InjectionToken<Document>('cdk-dir-doc', {
  providedIn: 'root',
  factory: DIR_DOCUMENT_FACTORY,
});

/** @docs-private */
export function DIR_DOCUMENT_FACTORY(): Document {
  return inject(DOCUMENT);
}
