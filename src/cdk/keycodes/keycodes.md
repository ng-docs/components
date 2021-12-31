### KeyCodes

### 键码

Commonly used keycode constants.

常用的键码常量。

#### Example

#### 例子

```ts
import {Directive} from '@angular/core';
import {UP_ARROW, DOWN_ARROW, LEFT_ARROW, RIGHT_ARROW} from '@angular/cdk/keycodes';

@Directive({
  selector: '[count-arrows]'
  host: {
    (keypress): 'handleKeyPress($event)'
  }
})
export class ArrowCounterDirective {
  arrowPressCount = 0;

  handleKeyPress(event: KeyboardEvent) {
    if ([UP_ARROW, DOWN_ARROW, LEFT_ARROW, RIGHT_ARROW].includes(event.keyCode)) {
      this.arrowPresscount++;
    }
  }
}
```
