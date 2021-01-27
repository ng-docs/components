/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {DOCUMENT} from '@angular/common';
import {Inject, Injectable} from '@angular/core';
import {PendingCopy} from './pending-copy';

/**
 * A service for copying text to the clipboard.
 *
 * 把文本复制到剪贴板的服务。
 *
 */
@Injectable({providedIn: 'root'})
export class Clipboard {
  private readonly _document: Document;

  constructor(@Inject(DOCUMENT) document: any) {
    this._document = document;
  }

  /**
   * Copies the provided text into the user's clipboard.
   *
   * 把提供的文本复制到用户的剪贴板中。
   *
   * @param text The string to copy.
   *
   * 要复制的字符串。
   *
   * @returns Whether the operation was successful.
   *
   * 操作是否成功。
   *
   */
  copy(text: string): boolean {
    const pendingCopy = this.beginCopy(text);
    const successful = pendingCopy.copy();
    pendingCopy.destroy();

    return successful;
  }

  /**
   * Prepares a string to be copied later. This is useful for large strings
   * which take too long to successfully render and be copied in the same tick.
   *
   * 准备稍后要复制的字符串。这对于大型字符串很有用，在同一个检测周期内它们需要很长的时间才能成功渲染并复制。
   *
   * The caller must call `destroy` on the returned `PendingCopy`.
   *
   * 调用者必须调用 `PendingCopy` 型返回值上的 `destroy` 方法。
   *
   * @param text The string to copy.
   *
   * 要复制的字符串。
   *
   * @returns the pending copy operation.
   *
   * 挂起的复制操作。
   *
   */
  beginCopy(text: string): PendingCopy {
    return new PendingCopy(text, this._document);
  }
}
