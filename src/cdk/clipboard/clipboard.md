The clipboard package provides helpers for working with the system clipboard.

剪贴板包为处理系统剪贴板提供了一些辅助方法。

### Click an element to copy

### 单击元素以复制它

The `cdkCopyToClipboard` directive can be used to easily add copy-on-click functionality to an
existing element. The directive selector doubles as an `@Input()` for the text to be copied.

`cdkCopyToClipboard` 指令可以很容易地为现有元素添加 copy-on-click 功能。指令选择器同时用作待复制文本的 `@Input()`

```html
<img src="avatar.jpg" alt="Hero avatar" [cdkCopyToClipboard]="getShortBio()">
```

<!-- example(cdk-clipboard-overview) -->

### Programmatically copy a string

### 以编程方式复制字符串

The `Clipboard` service copies text to the user's clipboard. It has two methods: `copy` and
`beginCopy`. For cases where you are copying a relatively small amount of text, you can call `copy`
directly to place it on the clipboard.

`Clipboard` 服务会将文本复制到用户的剪贴板中。它有两个方法：`copy` 和 `beginCopy`。如果要复制相对少量的文本，你可以调用 `copy` 来把它放在剪贴板上。

```typescript
import {Clipboard} from '@angular/cdk/clipboard';

class HeroProfile {
  constructor(private clipboard: Clipboard) {}

  copyHeroName() {
    this.clipboard.copy('Alphonso');
  }
}
```

However, for longer text the browser needs time to fill an intermediate textarea element and copy
the content. Directly calling `copy` may fail in this case, so you can pre-load the text by calling
`beginCopy`. This method returns a `PendingCopy` object that has a `copy` method to finish copying
the text that was buffered. Please note, if you call `beginCopy`, you must clean up the
`PendingCopy` object by calling `destroy` on it after you are finished.

但是，对于更长的文本，浏览器需要时间来填充一个临时 textarea 元素并复制内容。在这种情况下，直接调用 `copy` 可能会失败，所以你可以通过调用 `beginCopy` 来预加载该文本。这个方法会返回一个 `PendingCopy` 对象，它有一个 `copy` 方法来真正复制缓存的文本。请注意，如果你调用过 `beginCopy`，就必须在完成后调用 `destroy` 来清理这个 `PendingCopy` 对象。

```typescript
import {Clipboard} from '@angular/cdk/clipboard';

class HeroProfile {
  lifetimeAchievements: string;

  constructor(private clipboard: Clipboard) {}

  copyAchievements() {
    const pending = this.clipboard.beginCopy(this.lifetimeAchievements);
    let remainingAttempts = 3;
    const attempt = () => {
      const result = pending.copy();
      if (!result && --remainingAttempts) {
        setTimeout(attempt);
      } else {
        // Remember to destroy when you're done!
        pending.destroy();
      }
    };
    attempt();
  }
}
```

If you're using the `cdkCopyToClipboard` you can pass in the `cdkCopyToClipboardAttempts` input
to automatically attempt to copy some text a certain number of times.

如果你在使用 `cdkCopyToClipboard`，则可以传入 `cdkCopyToClipboardAttempts` 输入属性要求在复制这些文本时自动重试指定的次数。

```html
<button [cdkCopyToClipboard]="longText" [cdkCopyToClipboardAttempts]="5">Copy text</button>
```
