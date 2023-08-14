/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

/**
 * A pending copy-to-clipboard operation.
 *
 * 一个挂起的复制到剪贴板操作。
 *
 * The implementation of copying text to the clipboard modifies the DOM and
 * forces a re-layout. This re-layout can take too long if the string is large,
 * causing the execCommand('copy') to happen too long after the user clicked.
 * This results in the browser refusing to copy. This object lets the
 * re-layout happen in a separate tick from copying by providing a copy function
 * that can be called later.
 *
 * 把文本复制到剪贴板的实现会修改 DOM 并强制重新布局。如果字符串很大，这次重新布局可能需要很长时间，这会导致 execCommand('copy') 在用户点击后很久才会发生。这会导致浏览器拒绝复制。该对象可以通过提供一个稍后调用的复制函数，来允许在一个独立的周期中内进行重新布局。
 *
 * Destroy must be called when no longer in use, regardless of whether `copy` is
 * called.
 *
 * 无论是否调用 `copy`，都必须在不再使用时调用其 Destroy。
 *
 */
export class PendingCopy {
  private _textarea: HTMLTextAreaElement | undefined;

  constructor(text: string, private readonly _document: Document) {
    const textarea = (this._textarea = this._document.createElement('textarea'));
    const styles = textarea.style;

    // Hide the element for display and accessibility. Set a fixed position so the page layout
    // isn't affected. We use `fixed` with `top: 0`, because focus is moved into the textarea
    // for a split second and if it's off-screen, some browsers will attempt to scroll it into view.
    styles.position = 'fixed';
    styles.top = styles.opacity = '0';
    styles.left = '-999em';
    textarea.setAttribute('aria-hidden', 'true');
    textarea.value = text;
    // Making the textarea `readonly` prevents the screen from jumping on iOS Safari (see #25169).
    textarea.readOnly = true;
    // The element needs to be inserted into the fullscreen container, if the page
    // is in fullscreen mode, otherwise the browser won't execute the copy command.
    (this._document.fullscreenElement || this._document.body).appendChild(textarea);
  }

  /**
   * Finishes copying the text.
   *
   * 完成复制文本的操作。
   *
   */
  copy(): boolean {
    const textarea = this._textarea;
    let successful = false;

    try {
      // Older browsers could throw if copy is not supported.
      if (textarea) {
        const currentFocus = this._document.activeElement as HTMLOrSVGElement | null;

        textarea.select();
        textarea.setSelectionRange(0, textarea.value.length);
        successful = this._document.execCommand('copy');

        if (currentFocus) {
          currentFocus.focus();
        }
      }
    } catch {
      // Discard error.
      // Initial setting of {@code successful} will represent failure here.
    }

    return successful;
  }

  /**
   * Cleans up DOM changes used to perform the copy operation.
   *
   * 清理用于执行复制操作的 DOM 更改。
   *
   */
  destroy() {
    const textarea = this._textarea;

    if (textarea) {
      textarea.remove();
      this._textarea = undefined;
    }
  }
}
