/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Component} from '@angular/core';
import {LiveAnnouncer} from '@angular/cdk/a11y';

@Component({
  selector: 'toolbar-demo',
  templateUrl: 'live-announcer-demo.html',
})
export class LiveAnnouncerDemo {
  constructor(private _liveAnnouncer: LiveAnnouncer) {}

  announceText(message: string) {
    this._liveAnnouncer.announce(message);
  }
}
