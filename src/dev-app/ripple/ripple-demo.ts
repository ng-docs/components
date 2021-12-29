/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Component, ViewChild} from '@angular/core';
import {MatRipple} from '@angular/material/core';

@Component({
  selector: 'ripple-demo',
  templateUrl: 'ripple-demo.html',
  styleUrls: ['ripple-demo.css'],
})
export class RippleDemo {
  @ViewChild(MatRipple) ripple: MatRipple;

  centered = false;
  disabled = false;
  unbounded = false;
  rounded = false;
  radius: number;
  rippleSpeed = 1;
  rippleColor = '';

  disableButtonRipples = false;

  launchRipple(persistent = false, disableAnimation = false) {
    if (!this.ripple) {
      return;
    }

    const rippleConfig = {
      centered: true,
      persistent: persistent,
      animation: disableAnimation ? {enterDuration: 0, exitDuration: 0} : undefined,
    };

    this.ripple.launch(0, 0, rippleConfig);
  }

  fadeOutAll() {
    if (this.ripple) {
      this.ripple.fadeOutAll();
    }
  }
}
