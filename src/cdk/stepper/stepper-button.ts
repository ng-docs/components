/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Directive, HostListener, Input} from '@angular/core';

import {CdkStepper} from './stepper';

/**
 * Button that moves to the next step in a stepper workflow.
 *
 * 可以进入步进器工作流中下一步的按钮。
 *
 */
@Directive({
  selector: 'button[cdkStepperNext]',
  host: {
    '[type]': 'type',
  }
})
export class CdkStepperNext {
  /**
   * Type of the next button. Defaults to "submit" if not specified.
   *
   * 下一个按钮的类型如果没有指定，默认为 “submit”。
   *
   */
  @Input() type: string = 'submit';

  constructor(public _stepper: CdkStepper) {}

  // We have to use a `HostListener` here in order to support both Ivy and ViewEngine.
  // In Ivy the `host` bindings will be merged when this class is extended, whereas in
  // ViewEngine they're overwritten.
  // TODO(crisbeto): we move this back into `host` once Ivy is turned on by default.
  // tslint:disable-next-line:no-host-decorator-in-concrete
  @HostListener('click')
  _handleClick() {
    this._stepper.next();
  }
}

/**
 * Button that moves to the previous step in a stepper workflow.
 *
 * 移动到步进器工作流中上一步的按钮。
 *
 */
@Directive({
  selector: 'button[cdkStepperPrevious]',
  host: {
    '[type]': 'type',
  }
})
export class CdkStepperPrevious {
  /**
   * Type of the previous button. Defaults to "button" if not specified.
   *
   * 上一个按钮的类型如果没有指定，默认为 “button”。
   *
   */
  @Input() type: string = 'button';

  constructor(public _stepper: CdkStepper) {}

  // We have to use a `HostListener` here in order to support both Ivy and ViewEngine.
  // In Ivy the `host` bindings will be merged when this class is extended, whereas in
  // ViewEngine they're overwritten.
  // TODO(crisbeto): we move this back into `host` once Ivy is turned on by default.
  // tslint:disable-next-line:no-host-decorator-in-concrete
  @HostListener('click')
  _handleClick() {
    this._stepper.previous();
  }
}
