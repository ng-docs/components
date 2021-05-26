/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  Directive,
  EventEmitter,
  Input,
  Output,
  NgZone,
  InjectionToken,
  Inject,
  Optional,
  OnDestroy,
} from '@angular/core';
import {Clipboard} from './clipboard';
import {PendingCopy} from './pending-copy';

/**
 * Object that can be used to configure the default options for `CdkCopyToClipboard`.
 *
 * 可用于配置 `CdkCopyToClipboard` 默认选项的对象。
 *
 */
export interface CdkCopyToClipboardConfig {
  /**
   * Default number of attempts to make when copying text to the clipboard.
   *
   * 复制文本到剪贴板时的默认尝试次数。
   *
   */
  attempts?: number;
}

/**
 * Injection token that can be used to provide the default options to `CdkCopyToClipboard`.
 *
 * 这个注入令牌可以用来为 `CdkCopyToClipboard` 提供默认选项。
 *
 */
export const CDK_COPY_TO_CLIPBOARD_CONFIG =
    new InjectionToken<CdkCopyToClipboardConfig>('CDK_COPY_TO_CLIPBOARD_CONFIG');

/**
 * @deprecated Use `CDK_COPY_TO_CLIPBOARD_CONFIG` instead.
 *
 * 请改用 `CDK_COPY_TO_CLIPBOARD_CONFIG`。
 *
 * @breaking-change 13.0.0
 */
export const CKD_COPY_TO_CLIPBOARD_CONFIG = CDK_COPY_TO_CLIPBOARD_CONFIG;

/**
 * Provides behavior for a button that when clicked copies content into user's
 * clipboard.
 *
 * 为某个按钮提供行为，此按钮在被点击时会把内容复制到用户的剪贴板中。
 *
 */
@Directive({
  selector: '[cdkCopyToClipboard]',
  host: {
    '(click)': 'copy()',
  }
})
export class CdkCopyToClipboard implements OnDestroy {
  /**
   * Content to be copied.
   *
   * 要复制的内容。
   *
   */
  @Input('cdkCopyToClipboard') text: string = '';

  /**
   * How many times to attempt to copy the text. This may be necessary for longer text, because
   * the browser needs time to fill an intermediate textarea element and copy the content.
   *
   * 尝试复制文本的次数是多少次。这对于文本较长的文本来说可能是必需的，因为浏览器需要时间来填充中转 textarea 元素并复制其内容。
   *
   */
  @Input('cdkCopyToClipboardAttempts') attempts: number = 1;

  /**
   * Emits when some text is copied to the clipboard. The
   * emitted value indicates whether copying was successful.
   *
   * 某些文本被复制到剪贴板后发出通知。发出的值表示复制是否成功。
   *
   */
  @Output('cdkCopyToClipboardCopied') readonly copied = new EventEmitter<boolean>();

  /**
   * Copies that are currently being attempted.
   *
   * 目前正在尝试的复制操作。
   *
   */
  private _pending = new Set<PendingCopy>();

  /**
   * Whether the directive has been destroyed.
   *
   * 该指令是否已被销毁。
   *
   */
  private _destroyed: boolean;

  /**
   * Timeout for the current copy attempt.
   *
   * 本次尝试复制的超时时间。
   *
   */
  private _currentTimeout: any;

  constructor(
    private _clipboard: Clipboard,
    private _ngZone: NgZone,
    @Optional() @Inject(CKD_COPY_TO_CLIPBOARD_CONFIG) config?: CdkCopyToClipboardConfig) {

    if (config && config.attempts != null) {
      this.attempts = config.attempts;
    }
  }

  /**
   * Copies the current text to the clipboard.
   *
   * 把当前文本复制到剪贴板。
   *
   */
  copy(attempts: number = this.attempts): void {
    if (attempts > 1) {
      let remainingAttempts = attempts;
      const pending = this._clipboard.beginCopy(this.text);
      this._pending.add(pending);

      const attempt = () => {
        const successful = pending.copy();
        if (!successful && --remainingAttempts && !this._destroyed) {
          // We use 1 for the timeout since it's more predictable when flushing in unit tests.
          this._currentTimeout = this._ngZone.runOutsideAngular(() => setTimeout(attempt, 1));
        } else {
          this._currentTimeout = null;
          this._pending.delete(pending);
          pending.destroy();
          this.copied.emit(successful);
        }
      };
      attempt();
    } else {
      this.copied.emit(this._clipboard.copy(this.text));
    }
  }

  ngOnDestroy() {
    if (this._currentTimeout) {
      clearTimeout(this._currentTimeout);
    }

    this._pending.forEach(copy => copy.destroy());
    this._pending.clear();
    this._destroyed = true;
  }
}
